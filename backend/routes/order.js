const express = require("express");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");

const router = express.Router();

// The owning shop is derived from the item itself rather than trusted from the
// request body. Every seller dashboard query scopes orders on `cart.shopId`, so
// an item that cannot be resolved to a real shop has to be rejected up front,
// otherwise the order is stored and then invisible in every seller dashboard.
const resolveShopId = (item) => {
  const raw = item?.shopId ?? item?.shop?._id ?? item?.shop?.id;
  if (raw == null) return null;

  const value = raw?._id ?? raw;
  const shopId = String(value);

  return mongoose.isValidObjectId(shopId) ? shopId : null;
};

// ==================== CREATE ORDER ====================
router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, totalPrice, paymentInfo } = req.body;

    // The buyer is taken from the session, never from the request body, so an
    // order can never be filed against somebody else's account.
    const user = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phoneNumber: req.user.phoneNumber,
    };

    if (!Array.isArray(cart) || !cart.length) {
      return next(new ErrorHandler("Order data is required", 400));
    }

    if (totalPrice === undefined || totalPrice === null || totalPrice === "") {
      return next(new ErrorHandler("Total price is required", 400));
    }

    // Group the cart by shop so a seller only ever receives their own items.
    const shopItemsMap = new Map();

    for (const item of cart) {
      const shopId = resolveShopId(item);

      if (!shopId) {
        return next(
          new ErrorHandler(
            `Cart item "${item?.name || "unknown"}" is not linked to a shop and cannot be ordered`,
            400
          )
        );
      }

      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }

      // Persist the resolved id on the item so `cart.shopId` is always queryable.
      shopItemsMap.get(shopId).push({ ...item, shopId });
    }

    // Reject carts pointing at shops that no longer exist, otherwise the order
    // would again be created without a matching seller.
    const existingShops = await Shop.find({
      _id: { $in: [...shopItemsMap.keys()] },
    })
      .select("_id")
      .lean();

    const validShopIds = new Set(existingShops.map((shop) => String(shop._id)));
    const unknownShopId = [...shopItemsMap.keys()].find(
      (shopId) => !validShopIds.has(shopId)
    );

    if (unknownShopId) {
      return next(
        new ErrorHandler(`Shop ${unknownShopId} does not exist`, 400)
      );
    }

    // One order per shop.
    const orders = [];

    for (const items of shopItemsMap.values()) {
      orders.push(
        await Order.create({
          cart: items,
          shippingAddress,
          user,
          totalPrice,
          paymentInfo,
          status: "Processing",
        })
      );
    }

    res.status(201).json({
      success: true,
      orders,
    });
  })
);

// ==================== GET ALL ORDERS OF A USER ====================
// Scoped to the logged-in user, so nobody can read another account's orders.
router.get(
  "/get-all-orders/:userId",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { userId } = req.params;

    if (String(userId) !== String(req.user.id)) {
      return next(new ErrorHandler("You are not authorized", 403));
    }

    const orders = await Order.find({ "user._id": userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  })
);

// ==================== GET ALL ORDERS OF A SHOP ====================
// Scoped to the logged-in seller, so a shop can only ever read its own orders.
router.get(
  "/get-all-orders-of-shop/:shopId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { shopId } = req.params;

    if (String(shopId) !== String(req.seller.id)) {
      return next(new ErrorHandler("You are not authorized", 403));
    }

    const orders = await Order.find({ "cart.shopId": shopId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  })
);

// ==================== GET A SINGLE ORDER OF A SHOP ====================
router.get(
  "/get-order-by-id/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findOne({
      _id: req.params.id,
      "cart.shopId": req.seller.id,
    });

    if (!order) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

    res.status(200).json({
      success: true,
      order,
    });
  })
);

module.exports = router;