import React from "react";
import CountDown from "./CountDown";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import { resolveImageUrl } from "../../server";

const EventCard = ({ active, data }) => {
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const eventImage = data?.images?.[0]?.url;
  const imageSrc =
    resolveImageUrl(eventImage) ||
    "https://dummyimage.com/800x600/f3f4f6/6b7280?text=Event+Image";

  const addToCartHandler = (product) => {
    const isItemExists = cart?.find((item) => item._id === product._id);

    if (isItemExists) {
      toast.error("Item already in cart!");
      return;
    }

    if (product.stock < 1) {
      toast.error("Product stock limited!");
      return;
    }

    const cartData = {
      ...product,
      qty: 1,
    };

    dispatch(addTocart(cartData));
    toast.success("Item added to cart successfully!");
  };

  return (
    <div
      className={`flex w-full flex-col gap-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-lg lg:flex-row lg:items-center ${
        active ? "" : "mb-12"
      }`}
    >
      {/* Product Image */}
      <div className="w-full overflow-hidden rounded-lg bg-gray-50 lg:w-1/2">
        <img
          src={imageSrc}
          alt={data?.name || "Event product"}
          className="h-64 w-full object-cover transition-transform duration-300 hover:scale-105 sm:h-80 lg:h-96"
          onError={(event) => {
            event.currentTarget.src =
              "https://dummyimage.com/800x600/f3f4f6/6b7280?text=Event+Image";
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex w-full flex-col justify-center lg:w-1/2">
        <h2 className="mb-3 line-clamp-2 text-2xl font-bold text-gray-900 transition-colors duration-200 hover:text-blue-600">
          {data?.name}
        </h2>

        <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600">
          {data?.description}
        </p>

        {/* Price and Sold Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-medium text-red-500 line-through">
              {data?.originalPrice}$
            </span>

            <span className="text-2xl font-bold text-gray-900">
              {data?.discountPrice}$
            </span>
          </div>

          <span className="text-sm font-medium text-green-600">
            {data?.sold_out || 0} sold
          </span>
        </div>

        {/* Countdown */}
        <div className="my-4">
          <CountDown data={data} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to={`/product/${data?._id}?isEvent=true`}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            See Details
          </Link>

          <button
            type="button"
            onClick={() => addToCartHandler(data)}
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
