
import React, { useEffect, useState } from "react";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { RxCross1 } from "react-icons/rx";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { addTocart } from "../../../../redux/actions/cart";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../../../redux/actions/wishlist";

const ProductDetailsCard = ({ setOpen, data }) => {
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();

  const [count, setCount] = useState(1);
  const isInWishlist = Boolean(
    (data?._id || data?.id) &&
      wishlist?.some((item) => (item._id || item.id) === (data._id || data.id))
  );

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setOpen]);

  const discount =
    data.discount_price ?? data.discountPrice ?? data.price ?? 0;
  const original = data.price ?? data.originalPrice ?? 0;

  const handleMessageSubmit = () => {};

  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  const addToCartHandler = (id) => {
    const isItemExists = cart && cart.find((i) => (i._id || i.id) === id);

    if (isItemExists) {
      toast.error("Item already in cart!");
    } else {
      if (data.stock < count) {
        toast.error("Product stock limited!");
      } else {
        const cartData = { ...data, qty: count };
        dispatch(addTocart(cartData));
        toast.success("Item added to cart successfully!");
      }
    }
  };

  const removeFromWishlistHandler = (data) => {
    dispatch(removeFromWishlist(data));
  };

  const addToWishlistHandler = (data) => {
    dispatch(addToWishlist(data));
  };

  return (
    <div className="bg-white">
      {data ? (
        <div
          className="fixed inset-0 z-40 overflow-y-auto bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="flex min-h-full items-start justify-center px-4 pb-10 pt-24">
          {/* Modal */}
          <div
            className="relative w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6 800px:h-[75vh] 800px:w-[65%]"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
            >
              <RxCross1 size={20} />
            </button>

            {/* Main Content */}
            <div className="block w-full gap-8 800px:flex">
              
              {/* Left Side */}
              <div className="w-full 800px:w-1/2">
                
                {/* Product Image */}
                <div className="overflow-hidden rounded-xl bg-gray-50">
                  <img
                    src={
                      data.images?.[0]?.url ||
                      data.image_Url?.[0]?.url ||
                      data.image ||
                      "https://dummyimage.com/150x150/cccccc/999999?text=No+Image"
                    }
                    alt={data.name}
                    className="h-[300px] w-full object-contain p-5 transition-transform duration-300 hover:scale-105 sm:h-[350px]"
                    onError={(e) => {
                      e.target.src =
                        "https://dummyimage.com/150x150/cccccc/999999?text=No+Image";
                    }}
                  />
                </div>

                {/* Shop Information */}
                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <Link
                    to={`/shop/preview/${data.shop?._id || data.shopId || data.shop?.id}`}
                    className="flex items-center"
                  >
                    <img
                      src={
                        data.shop?.shop_avatar?.url ||
                        data.images?.[0]?.url ||
                        data.image_Url?.[0]?.url ||
                        data.image ||
                        "https://dummyimage.com/150x150/cccccc/999999?text=No+Image"
                      }
                      alt={data.shop?.name}
                      className="mr-3 h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                    />

                    <div>
                      <h3 className="text-base font-semibold text-gray-800 transition-colors hover:text-red-500">
                        {data.shop?.name || "Shop"}
                      </h3>

                      <h5 className="mt-1 text-sm text-gray-500">
                        {data?.ratings} Ratings
                      </h5>
                    </div>
                  </Link>
                </div>

                {/* Message Button */}
                <button
                  type="button"
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 active:scale-[0.98]"
                  onClick={handleMessageSubmit}
                >
                  <span className="flex items-center gap-2">
                    Send Message
                    <AiOutlineMessage size={20} />
                  </span>
                </button>

                {/* Stock */}
                <h5 className="mt-5 text-sm font-semibold text-red-500">
                  {data.stock ?? data.sold_out ?? 0} sold
                </h5>
              </div>

              {/* Right Side */}
              <div className="w-full pt-6 800px:w-1/2 800px:pl-3">
                
                {/* Product Title */}
                <h1 className="pr-10 text-2xl font-bold leading-tight text-gray-900">
                  {data.name}
                </h1>

                {/* Description */}
                <p className="mt-4 text-sm leading-6 text-gray-500">
                  {data.description}
                </p>

                {/* Price */}
                <div className="mt-5 flex items-center gap-3 border-b border-gray-100 pb-5">
                  <h4 className="text-2xl font-bold text-red-600">
                    {discount}$
                  </h4>

                  <h3 className="text-base text-gray-400 line-through">
                    {original ? original + "$" : null}
                  </h3>
                </div>

                {/* Quantity + Wishlist */}
                <div className="mt-8 flex items-center justify-between pr-3">
                  
                  {/* Quantity */}
                  <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center bg-gray-50 text-xl font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                      onClick={decrementCount}
                    >
                      -
                    </button>

                    <span className="flex h-10 min-w-[50px] items-center justify-center border-x border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800">
                      {count}
                    </span>

                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center bg-gray-50 text-xl font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                      onClick={incrementCount}
                    >
                      +
                    </button>
                  </div>

                  {/* Wishlist */}
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50"
                    onClick={() =>
                      isInWishlist
                        ? removeFromWishlistHandler(data)
                        : addToWishlistHandler(data)
                    }
                    aria-label={
                      isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                    }
                  >
                    {isInWishlist ? (
                      <AiFillHeart
                        size={24}
                        aria-hidden="true"
                        className="text-red-500"
                      />
                    ) : (
                      <AiOutlineHeart
                        size={24}
                        aria-hidden="true"
                        className="text-gray-500 transition-colors hover:text-red-500"
                      />
                    )}
                  </button>
                </div>

                {/* Add To Cart */}
                <button
                  type="button"
                  className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-lg shadow-red-100 transition-all duration-200 hover:bg-red-700 active:scale-[0.98]"
                  onClick={() => addToCartHandler(data._id ?? data.id)}
                >
                  <span className="flex items-center gap-2">
                    Add to Cart
                    <AiOutlineShoppingCart size={20} />
                  </span>
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductDetailsCard;
