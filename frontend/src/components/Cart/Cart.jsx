
import React, { useState } from "react";
import { RxCross1 } from "react-icons/rx";
import { IoBagHandleOutline } from "react-icons/io5";
import { HiOutlineMinus, HiPlus } from "react-icons/hi";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addTocart, removeFromCart } from "../../redux/actions/cart";
import { toast } from "react-toastify";

const getItemPrice = (item) =>
  item?.discountPrice ?? item?.discount_price ?? item?.price ?? 0;

const getItemQty = (item) => item?.qty ?? 1;

const Cart = ({ setOpenCart }) => {
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const removeFromCartHandler = (data) => {
    dispatch(removeFromCart(data));
  };

  const totalPrice = cart.reduce(
    (acc, item) => acc + getItemPrice(item) * getItemQty(item),
    0
  );

  const quantityChangeHandler = (data) => {
    dispatch(addTocart(data));
  };

  return (
    <div className="fixed inset-0 z-50 h-screen w-full bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 flex h-full w-[90%] max-w-md flex-col justify-between overflow-hidden bg-white shadow-2xl sm:w-[80%] 800px:w-[400px]">
        
        {/* ================= EMPTY CART ================= */}
        {cart && cart.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center px-6">
            
            {/* Close */}
            <button
              type="button"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
              onClick={() => setOpenCart(false)}
            >
              <RxCross1 size={20} />
            </button>

            {/* Empty Cart Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <IoBagHandleOutline size={38} className="text-red-500" />
            </div>

            <h5 className="mt-5 text-lg font-semibold text-gray-800">
              Your cart is empty
            </h5>

            <p className="mt-2 text-center text-sm text-gray-500">
              Looks like you haven't added anything to your cart yet.
            </p>

            <button
              type="button"
              onClick={() => setOpenCart(false)}
              className="mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-100 transition-all duration-200 hover:bg-red-700 active:scale-95"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* ================= CART CONTENT ================= */}
            <div className="flex min-h-0 flex-1 flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <IoBagHandleOutline
                      size={22}
                      className="text-red-600"
                    />
                  </div>

                  <div>
                    <h5 className="text-lg font-bold text-gray-900">
                      Shopping Cart
                    </h5>

                    <p className="text-xs text-gray-500">
                      {cart.length} {cart.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                  onClick={() => setOpenCart(false)}
                >
                  <RxCross1 size={18} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {cart &&
                  cart.map((i, index) => (
                    <CartSingle
                      key={index}
                      data={i}
                      quantityChangeHandler={quantityChangeHandler}
                      removeFromCartHandler={removeFromCartHandler}
                    />
                  ))}
              </div>
            </div>

            {/* ================= CHECKOUT ================= */}
            <div className="border-t border-gray-100 bg-white p-5 shadow-[0_-4px_15px_rgba(0,0,0,0.04)]">
              
              {/* Total */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Total Amount
                </span>

                <span className="text-xl font-bold text-gray-900">
                  USD ${totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-semibold text-white shadow-lg shadow-red-100 transition-all duration-200 hover:bg-red-700 active:scale-[0.98]"
              >
                Checkout Now
              </Link>

              <p className="mt-3 text-center text-xs text-gray-400">
                Secure checkout • Fast delivery
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CartSingle = ({
  data,
  quantityChangeHandler,
  removeFromCartHandler,
}) => {
  const [value, setValue] = useState(getItemQty(data));

  const totalPrice = getItemPrice(data) * value;

  const increment = (data) => {
    if (data.stock <= value) {
      toast.error("Product stock limited!");
    } else {
      setValue(value + 1);

      const updateCartData = {
        ...data,
        qty: value + 1,
      };

      quantityChangeHandler(updateCartData);
    }
  };

  const decrement = (data) => {
    const newValue = value === 1 ? 1 : value - 1;

    setValue(newValue);

    const updateCartData = {
      ...data,
      qty: newValue,
    };

    quantityChangeHandler(updateCartData);
  };

  return (
    <div className="border-b border-gray-100 p-4 transition-colors duration-200 hover:bg-gray-50">
      <div className="flex gap-3">
        
        {/* Quantity Controls */}
        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-90"
            onClick={() => increment(data)}
          >
            <HiPlus size={14} />
          </button>

          <span className="my-1 text-sm font-semibold text-gray-700">
            {data.qty}
          </span>

          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:bg-gray-200 active:scale-90"
            onClick={() => decrement(data)}
          >
            <HiOutlineMinus size={14} />
          </button>
        </div>

        {/* Product Image */}
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <img
            src={
              data?.images?.[0]?.url ||
              data?.image_Url?.[0]?.url ||
              data?.image ||
              "https://dummyimage.com/150x150/cccccc/999999?text=No+Image"
            }
            alt={data.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-800">
              {data.name}
            </h1>

            {/* Remove */}
            <button
              type="button"
              className="flex-shrink-0 text-gray-400 transition-colors hover:text-red-500"
              onClick={() => removeFromCartHandler(data)}
              title="Remove item"
            >
              <RxCross1 size={16} />
            </button>
          </div>

          <p className="mt-1 text-xs text-gray-400">
            ${getItemPrice(data)} × {value}
          </p>

          <p className="mt-1 text-sm font-bold text-red-600">
            USD ${totalPrice.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cart;
