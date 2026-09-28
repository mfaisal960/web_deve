const express = require("express");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Cart = require("../model/cart");

const router = express.Router();

const getItemPrice = (item) =>
  item?.discountPrice ?? item?.discount_price ?? item?.price ?? 0;

const getItemQty = (item) => item?.qty ?? 1;

const calculateTotalPrice = (items) =>
  items.reduce((sum, item) => sum + getItemPrice(item) * getItemQty(item), 0);

const sameItem = (i, productId) => {
  const pid = String(productId ?? "").trim();
  if (!pid) return false;
  return (
    String(i?._id ?? "") === pid ||
    String(i?.id ?? "") === pid ||
    String(i?.productId ?? "") === pid
  );
};

// ==================== ADD TO CART ====================
router.post(
  "/add-to-cart",
  catchAsyncErrors(async (req, res, next) => {
    const { userId, item } = req.body;

    if (!userId || !item) {
      return next(new ErrorHandler("userId and item are required", 400));
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [item] });
    } else {
      const isItemExist = cart.items.find((i) => sameItem(i, item._id ?? item.id));

      if (isItemExist) {
        cart.items = cart.items.map((i) => sameItem(i, item._id ?? item.id) ? item : i);
      } else {
        cart.items.push(item);
      }
    }

    cart.totalPrice = calculateTotalPrice(cart.items);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully!",
      cart,
    });
  })
);

// ==================== GET CART ====================
router.get(
  "/get-cart/:userId",
  catchAsyncErrors(async (req, res, next) => {
    const cart = await Cart.findOne({ userId: req.params.userId });

    if (!cart) {
      return next(new ErrorHandler("Cart not found", 404));
    }

    res.status(200).json({
      success: true,
      cart,
    });
  })
);

// ==================== REMOVE FROM CART ====================
router.delete(
  "/remove-from-cart/:userId/:productId",
  catchAsyncErrors(async (req, res, next) => {
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return next(new ErrorHandler("Cart not found", 404));
    }

    const isItemExist = cart.items.some((i) => sameItem(i, productId));
    if (!isItemExist) {
      return next(new ErrorHandler("Item not found in cart", 404));
    }

    cart.items = cart.items.filter((i) => !sameItem(i, productId));
    cart.totalPrice = calculateTotalPrice(cart.items);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully!",
      cart,
    });
  })
);

module.exports = router;