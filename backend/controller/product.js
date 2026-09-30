const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");

// A cart line names the product it was bought from under whichever key that
// product had at the time: a real catalogue product arrives as `_id`, while the
// bundled demo catalogue numbers its products and sends `id`/`productId`. A
// review has to be matched against all of them, or the "reviewed" mark never
// lands on the line it belongs to.
const cartLineProductId = (line) => line?._id ?? line?.productId ?? line?.id ?? null;

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadProductImage = async (image) => {
  if (hasCloudinaryConfig) {
    return cloudinary.v2.uploader.upload(image, { folder: "products" });
  }

  const match = image.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid product image");
  }

  const extension = match[1].split("/")[1].replace("jpeg", "jpg");
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const uploadDirectory = path.join(__dirname, "../../uploads/products");
  fs.mkdirSync(uploadDirectory, { recursive: true });
  fs.writeFileSync(path.join(uploadDirectory, fileName), match[2], "base64");

  return {
    public_id: `products/${fileName}`,
    secure_url: `/uploads/products/${fileName}`,
  };
};

// create product
router.post(
  "/create-product",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        name,
        description,
        category,
        discountPrice,
        stock,
      } = req.body;
      if (!name || !description || !category || !discountPrice || !stock) {
        return next(new ErrorHandler("Please fill all required product fields", 400));
      }

      // The product always belongs to the seller's own shop. The dashboard
      // sends shopId, but a body field must never decide who owns the product,
      // and this route used to be reachable without any session at all.
      const shop = await Shop.findById(req.seller.id);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      }

      if (req.body.shopId && String(req.body.shopId) !== String(shop._id)) {
        return next(
          new ErrorHandler("You can only add products to your own shop", 403)
        );
      }

      let images = [];

      if (typeof req.body.images === "string") {
        images.push(req.body.images);
      } else {
        images = req.body.images || [];
      }

      if (images.length === 0) {
        return next(new ErrorHandler("Please upload at least one product image", 400));
      }

      const imagesLinks = [];

      for (let i = 0; i < images.length; i++) {
        const result = await uploadProductImage(images[i]);

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }

      const productData = {
        ...req.body,
        shopId: String(shop._id),
        images: imagesLinks,
        shop: shop,
      };

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Product creation failed", 400));
    }
  })
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Product request failed", 400));
    }
  })
);

// get a product by id
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("Product is not found", 404));
    }

    res.status(200).json({
      success: true,
      product,
    });
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }    

      // isSeller only proves that *some* shop is logged in, so without this
      // check any seller could delete another shop's products.
      if (String(product.shopId) !== String(req.seller.id)) {
        return next(
          new ErrorHandler("You are not authorized to delete this product", 403)
        );
      }

      for (const image of product.images || []) {
        if (hasCloudinaryConfig) {
          await cloudinary.v2.uploader.destroy(image.public_id);
        } else if (image.url?.startsWith("/uploads/")) {
          const localImagePath = path.join(__dirname, "../..", image.url);
          if (fs.existsSync(localImagePath)) {
            fs.unlinkSync(localImagePath);
          }
        }
      }
    
      await Product.findByIdAndDelete(product._id);

      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Unable to delete product", 400));
    }
  })
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Unable to fetch products", 400));
    }
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { rating, comment, productId, orderId } = req.body;

      if (!rating || !comment || !productId) {
        return next(
          new ErrorHandler("Rating, comment and productId are required", 400)
        );
      }

      const stars = Number(rating);

      // The stars are the only thing a buyer cannot correct after saving, and
      // they are what the product's average is computed from, so the range is
      // checked here rather than trusted from the body. `rating` is also the
      // field the "is it filled in" check above reads, so 0 is refused there.
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        return next(new ErrorHandler("Rating must be a whole number from 1 to 5", 400));
      }

      // findById on a demo catalogue number throws a CastError that surfaces as
      // a 500; a product that was never in the database is simply not found.
      if (!mongoose.isValidObjectId(productId)) {
        return next(new ErrorHandler("Product is not found", 404));
      }

      const product = await Product.findById(productId);

      if (!product) {
        return next(new ErrorHandler("Product is not found", 404));
      }

      // A review is a claim about a purchase, so the order that proves it is
      // required, and it has to belong to the session buyer. Without this the
      // endpoint accepted a review from anybody for anything, and the delivered
      // gate the order page shows was only ever a client side convention.
      if (!orderId) {
        return next(
          new ErrorHandler("An orderId is required to review a product", 400)
        );
      }

      if (!mongoose.isValidObjectId(orderId)) {
        return next(new ErrorHandler("Order not found with this id", 404));
      }

      const order = await Order.findOne({
        _id: orderId,
        "user._id": req.user._id,
      });

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 404));
      }

      // The same rule the order page uses to decide whether to offer the review
      // button, so the button is not the only thing standing between an
      // unreceived order and a review on it.
      if (order.status !== "Delivered") {
        return next(
          new ErrorHandler(
            "You can review a product once its order is delivered",
            400
          )
        );
      }

      const line = (order.cart || []).find(
        (item) => String(cartLineProductId(item)) === String(productId)
      );

      if (!line) {
        return next(
          new ErrorHandler("This product is not part of that order", 400)
        );
      }

      // The reviewer is the session, never the request body, so a review cannot
      // be posted in somebody else's name. The avatar is kept because the
      // product page renders reviews from user.avatar.url.
      const reviewer = {
        _id: String(req.user._id),
        name: req.user.name,
        avatar: req.user.avatar,
      };

      // ObjectId instances from two different queries are never === , which
      // made the "already reviewed" check miss and stack duplicate reviews.
      // Compare the string form instead.
      const existingReview = product.reviews.find(
        (rev) => String(rev.user?._id) === String(req.user._id)
      );

      if (existingReview) {
        existingReview.rating = stars;
        existingReview.comment = comment;
        existingReview.user = reviewer;
      } else {
        product.reviews.push({
          user: reviewer,
          rating: stars,
          comment,
          productId: String(productId),
        });
      }

      const avg = product.reviews.reduce((sum, rev) => sum + (rev.rating || 0), 0);
      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      // Marked on the document rather than through an arrayFilters update:
      // arrayFilters has to name the field the line is keyed by, and those
      // differ between a real product and a demo catalogue one.
      line.isReviewed = true;
      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
        // The saved order comes back whole so the page can mark the line
        // reviewed and stop offering the button without a refetch.
        order,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Unable to review product", 400));
    }
  })
);

// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
module.exports = router;