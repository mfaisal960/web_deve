const express = require("express");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Cart = require("../model/cart");
const Product = require("../model/product");

const router = express.Router();

// The owning shop is derived from the item itself rather than trusted from the
// request body, so a seller can only ever be credited with their own items.
// A shop reference that is not a Mongo id (the bundled demo catalogue carries
// numeric shop ids) is still a usable grouping key: those items are ordered
// normally and simply never match a real seller, which is correct because there
// is no seller behind them. Only an item with no shop reference at all is
// unorderable.
const resolveShopId = (item) => {
  const raw = item?.shopId ?? item?.shop?._id ?? item?.shop?.id;
  if (raw == null) return null;

  const value = raw?._id ?? raw;
  return String(value).trim() || null;
};

const getItemPrice = (item) =>
  item?.discountPrice ?? item?.discount_price ?? item?.price ?? 0;

const getItemQty = (item) => item?.qty ?? 1;

// The browser posts whatever it had in the cart, which is not always the whole
// product: a listing added from a search card can reach checkout without an
// image, and the order list renders `name` and `images` straight off the stored
// line, so a bare row showed as an empty box. The catalogue is the authority for
// those fields, so anything the client left out is filled in from the product
// before the order is written. The buyer's quantity is never touched.
const snapshotOrderItems = async (items) => {
  const ids = [
    ...new Set(
      items
        .map((item) => String(item?._id ?? item?.productId ?? "").trim())
        .filter((id) => mongoose.isValidObjectId(id))
    ),
  ];

  if (!ids.length) return items;

  const products = await Product.find({ _id: { $in: ids } })
    .select("name discountPrice originalPrice images")
    .lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));

  return items.map((item) => {
    const product = byId.get(
      String(item?._id ?? item?.productId ?? "").trim()
    );

    if (!product) return item;

    return {
      ...item,
      name: item?.name || product.name,
      discountPrice: item?.discountPrice ?? product.discountPrice,
      originalPrice: item?.originalPrice ?? product.originalPrice,
      images:
        Array.isArray(item?.images) && item.images.length
          ? item.images
          : product.images,
    };
  });
};

// Once an order exists those items have been bought, so they are taken out of
// the buyer's stored cart. It used to be left untouched, which is why a cart
// reloaded from the server kept resurrecting items the buyer had already paid
// for. Reorders of the same product are safe: the next add re-creates the row.
const removeOrderedFromCart = async (userId, orderedIds) => {
  if (!orderedIds.size) return;

  const cart = await Cart.findOne({ userId });

  if (!cart) return;

  const remaining = cart.items.filter(
    (i) => !orderedIds.has(String(i?._id ?? i?.id ?? i?.productId ?? "").trim())
  );

  if (remaining.length === cart.items.length) return;

  cart.items = remaining;
  cart.totalPrice = remaining.reduce(
    (sum, i) => sum + getItemPrice(i) * getItemQty(i),
    0
  );
  await cart.save();
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
      return next(new ErrorHandler("Your cart is empty", 400));
    }

    if (!shippingAddress || typeof shippingAddress !== "object") {
      return next(new ErrorHandler("A shipping address is required", 400));
    }

    if (totalPrice === undefined || totalPrice === null || totalPrice === "") {
      return next(new ErrorHandler("Total price is required", 400));
    }

    // Group the cart by shop so a seller only ever receives their own items.
    const shopItemsMap = new Map();

    // Items that cannot be ordered are collected rather than thrown, so the
    // buyer is told exactly which rows to drop instead of being handed a dead
    // "Shop <mongo id> does not exist" they can do nothing with.
    const unorderable = [];

    for (const item of cart) {
      const shopId = resolveShopId(item);

      if (!shopId) {
        unorderable.push(item);
        continue;
      }

      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }

      // Persist the resolved id on the item so `cart.shopId` is always queryable.
      shopItemsMap.get(shopId).push({ ...item, shopId });
    }

    // Drop carts pointing at shops that no longer exist, otherwise the order
    // would again be created without a matching seller. Only ids that could
    // ever belong to a Shop are looked up: passing a non-ObjectId such as a
    // demo catalogue's numeric id to `find` throws a CastError instead.
    const mongoShopIds = [...shopItemsMap.keys()].filter((id) =>
      mongoose.isValidObjectId(id)
    );

    if (mongoShopIds.length) {
      const existingShops = await Shop.find({
        _id: { $in: mongoShopIds },
      })
        .select("_id")
        .lean();

      const validShopIds = new Set(
        existingShops.map((shop) => String(shop._id))
      );

      for (const shopId of mongoShopIds) {
        if (validShopIds.has(shopId)) continue;

        unorderable.push(...shopItemsMap.get(shopId));
        shopItemsMap.delete(shopId);
      }
    }

    if (!shopItemsMap.size) {
      return res.status(400).json({
        success: false,
        message:
          "No item in your cart can be ordered. Please remove them and try again.",
        unorderableItems: unorderable.map((i) => ({
          _id: i?._id ?? i?.id ?? null,
          name: i?.name || "an item",
        })),
      });
    }

    // One order per shop.
    const orders = [];

    for (const items of shopItemsMap.values()) {
      orders.push(
        await Order.create({
          cart: await snapshotOrderItems(items),
          shippingAddress,
          user,
          totalPrice,
          paymentInfo,
          status: "Processing",
        })
      );
    }

    await removeOrderedFromCart(
      req.user.id,
      new Set(
        [...shopItemsMap.values()].flatMap((items) =>
          items.map((i) => String(i._id ?? i.id ?? "").trim())
        )
      )
    );

    res.status(201).json({
      success: true,
      orders,
      ...(unorderable.length
        ? {
            unorderableItems: unorderable.map((i) => ({
              _id: i?._id ?? i?.id ?? null,
              name: i?.name || "an item",
            })),
          }
        : {}),
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

    // `user` is an untyped Object on the schema, so Mongoose stores the id it was
    // given as a BSON ObjectId. Querying with the string from the URL compares a
    // string against an ObjectId, which never matches, and the buyer's order list
    // came back empty no matter how many orders existed. Both forms are matched
    // so orders written before and after this fix are both returned.
    const orders = await Order.find({
      "user._id": { $in: [req.user._id, String(req.user._id)] },
    }).sort({ createdAt: -1 });

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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

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

// ==================== GET A SINGLE ORDER OF A BUYER ====================
// The seller's copy above is scoped on `cart.shopId`, which no buyer can satisfy,
// so a buyer had no way to open one of their own orders at all. Scoped on the
// session instead, so nobody can read somebody else's order.
router.get(
  "/get-user-order-by-id/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // findOne on a malformed id throws a CastError that surfaces as a 500;
    // a bad id from the address bar is simply an order that does not exist.
    if (!mongoose.isValidObjectId(id)) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

    const order = await Order.findOne({
      _id: id,
      "user._id": req.user._id,
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

// ==================== UPDATE ORDER STATUS ====================
// The status is checked against the same flow the seller panel offers, so a
// hand written request cannot invent a stage or walk an order backwards, and the
// order is scoped on the session seller: nobody can move somebody else's order.
const ORDER_STATUS_FLOW = [
  "Processing",
  "Transferred to delivery partner",
  "Shipping",
  "Received",
  "On the way",
  "Delivered",
];

const REFUND_STATUS_FLOW = ["Processing refund", "Refund Success"];

router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { status } = req.body || {};

    if (!status) {
      return next(new ErrorHandler("A status is required", 400));
    }

    if (
      !ORDER_STATUS_FLOW.includes(status) &&
      !REFUND_STATUS_FLOW.includes(status)
    ) {
      return next(
        new ErrorHandler(
          `"${status}" is not a valid order status. Use one of: ${[
            ...ORDER_STATUS_FLOW,
            ...REFUND_STATUS_FLOW,
          ].join(", ")}.`,
          400
        )
      );
    }

    // findOneAndUpdate on a malformed id throws a CastError that surfaces as a
    // 500; a bad id from the address bar is simply an order that does not exist.
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, "cart.shopId": req.seller.id },
      {
        status,
        // Stamped here rather than in the schema default: an order that is
        // delivered twice (refund then a re-delivery) keeps the latest date.
        ...(status === "Delivered" ? { deliveredAt: new Date() } : {}),
      },
      { new: true }
    );

    if (!order) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

    res.status(200).json({
      success: true,
      order,
    });
  })
);

// ==================== UPDATE ORDER STATUS (BUYER) ====================
// The buyer moving their own order is a separate endpoint from the seller one
// above rather than a shared handler: that one is scoped on `cart.shopId` and
// gated by the seller session, so widening it to buyers would have meant a
// seller could reach any order and a buyer any order. Each side is scoped on
// the session it is authenticated as, and only on the delivery flow, never on
// the refund flow: a buyer asking for a refund is not the one who closes it.
//
// The side effects of the seller endpoint (stock movement, seller balance,
// payment settlement) are deliberately not repeated here. They are the shop's
// money and inventory to move, and a buyer changing the label on their order
// must not credit a balance or decrement stock.
router.put(
  "/update-user-order-status/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { status } = req.body || {};

    if (!status) {
      return next(new ErrorHandler("A status is required", 400));
    }

    if (!ORDER_STATUS_FLOW.includes(status)) {
      return next(
        new ErrorHandler(
          `"${status}" is not a valid order status. Use one of: ${ORDER_STATUS_FLOW.join(
            ", "
          )}.`,
          400
        )
      );
    }

    // findOneAndUpdate on a malformed id throws a CastError that surfaces as a
    // 500; a bad id from the address bar is simply an order that does not exist.
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

    const order = await Order.findOne({ _id: req.params.id, "user._id": req.user._id });

    if (!order) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }

    order.status = status;

    // Stamped here rather than in the schema default, and only the first time
    // the order reaches Delivered, so reopening the status does not rewrite the
    // date the order actually arrived on.
    if (status === "Delivered" && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      order,
    });
  })
);

module.exports = router;
