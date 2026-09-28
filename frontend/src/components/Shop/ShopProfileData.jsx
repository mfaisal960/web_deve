
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { getAllProductsShop } from "../../redux/actions/product";
import ProductCard from "../Route/Hero/ProductCard/ProductCard";
import { productData as demoProducts } from "../../static/data";

const Ratings = ({ rating }) => {
  const filledStars = Math.round(rating || 0);

  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`${rating || 0} out of 5 stars`}>
      <span className="text-yellow-400">{"★".repeat(filledStars)}</span>
      <span className="text-gray-300">{"★".repeat(5 - filledStars)}</span>
      <span className="text-gray-500">({rating || 0})</span>
    </span>
  );
};

const ShopProfileData = ({ isOwner }) => {
  const { products } = useSelector((state) => state.products);
  const { events } = useSelector((state) => state.events);

  const { id } = useParams();
  const dispatch = useDispatch();
  const isDatabaseId = /^[a-f\d]{24}$/i.test(id || "");
  const shopProducts = isDatabaseId
    ? products || []
    : demoProducts.filter(
        (product) =>
          String(product.shop?._id || product.shop?.id || product.shopId) ===
          String(id)
      );

  const [active, setActive] = useState(1);

  useEffect(() => {
    if (!id) {
      return;
    }
    if (isDatabaseId) {
      dispatch(getAllProductsShop(id));
    }
  }, [dispatch, id, isDatabaseId]);

  const allReviews =
    shopProducts.flatMap((product) => product.reviews || []);

  return (
    <div className="w-full bg-white rounded-xl overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="w-full px-5 sm:px-6 lg:px-7 pt-5 pb-4 border-b border-gray-100">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          {/* Tabs */}
          <div className="w-full lg:w-auto overflow-x-auto">
            <div className="flex items-center min-w-max gap-2">

              {/* Products */}
              <button
                type="button"
                onClick={() => setActive(1)}
                className={`relative px-4 py-3 text-sm sm:text-base font-semibold
                  transition-all duration-200 whitespace-nowrap
                  ${
                    active === 1
                      ? "text-red-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                Shop Products

                {active === 1 && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-red-500 rounded-full" />
                )}
              </button>

              {/* Events */}
              <button
                type="button"
                onClick={() => setActive(2)}
                className={`relative px-4 py-3 text-sm sm:text-base font-semibold
                  transition-all duration-200 whitespace-nowrap
                  ${
                    active === 2
                      ? "text-red-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                Running Events

                {active === 2 && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-red-500 rounded-full" />
                )}
              </button>

              {/* Reviews */}
              <button
                type="button"
                onClick={() => setActive(3)}
                className={`relative px-4 py-3 text-sm sm:text-base font-semibold
                  transition-all duration-200 whitespace-nowrap
                  ${
                    active === 3
                      ? "text-red-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                Shop Reviews

                {active === 3 && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-red-500 rounded-full" />
                )}
              </button>

            </div>
          </div>

          {/* Dashboard Button */}
          {isOwner && (
            <Link
              to="/dashboard"
              className="w-full lg:w-auto"
            >
              <button
                type="button"
                className="w-full lg:w-auto h-11 px-6 rounded-lg
                  bg-black text-white text-sm font-semibold
                  shadow-sm transition-all duration-200
                  hover:bg-gray-800 hover:shadow-md
                  active:scale-[0.98]"
              >
                Go Dashboard
              </button>
            </Link>
          )}

        </div>
      </div>

      {/* ================= PRODUCTS ================= */}
      {active === 1 && (
        <div className="px-5 sm:px-6 lg:px-7 py-6">

          {shopProducts.length > 0 ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                xl:grid-cols-4 gap-5 lg:gap-6"
            >
              {shopProducts.map((item, index) => (
                <ProductCard
                  data={item}
                  key={item._id || index}
                  isShop={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                <span className="text-2xl">📦</span>
              </div>

              <h5 className="text-lg font-semibold text-gray-800">
                No Products Found
              </h5>

              <p className="mt-1 text-sm text-gray-500 text-center">
                This shop has not added any products yet.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ================= EVENTS ================= */}
      {active === 2 && (
        <div className="px-5 sm:px-6 lg:px-7 py-6">

          {events && events.length > 0 ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                xl:grid-cols-4 gap-5 lg:gap-6"
            >
              {events.map((item, index) => (
                <ProductCard
                  data={item}
                  key={item._id || index}
                  isShop={true}
                  isEvent={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">

              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                <span className="text-2xl">🎉</span>
              </div>

              <h5 className="text-lg font-semibold text-gray-800">
                No Running Events
              </h5>

              <p className="mt-1 text-sm text-gray-500 text-center">
                This shop currently has no running events.
              </p>

            </div>
          )}

        </div>
      )}

      {/* ================= REVIEWS ================= */}
      {active === 3 && (
        <div className="px-5 sm:px-6 lg:px-7 py-6">

          {allReviews && allReviews.length > 0 ? (
            <div className="space-y-5">

              {allReviews.map((item, index) => (
                <div
                  key={item._id || index}
                  className="flex gap-4 p-4 rounded-xl
                    border border-gray-100 bg-gray-50/50
                    transition-all duration-200
                    hover:bg-gray-50 hover:shadow-sm"
                >

                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.user?.avatar?.url}
                      alt={item.user?.name || "User"}
                      className="w-12 h-12 sm:w-14 sm:h-14
                        rounded-full object-cover
                        border-2 border-white shadow-sm"
                    />
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">

                    {/* Name + Rating */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        {item.user?.name || "Anonymous"}
                      </h3>

                      <Ratings rating={item.rating} />
                    </div>

                    {/* Comment */}
                    <p className="mt-2 text-sm leading-6 text-gray-600 break-words">
                      {item?.comment || "No comment provided."}
                    </p>

                    {/* Date */}
                    <p className="mt-2 text-xs text-gray-400">
                      2 days ago
                    </p>

                  </div>
                </div>
              ))}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">

              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                <span className="text-2xl">⭐</span>
              </div>

              <h5 className="text-lg font-semibold text-gray-800">
                No Reviews Yet
              </h5>

              <p className="mt-1 text-sm text-gray-500 text-center">
                This shop has not received any reviews yet.
              </p>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ShopProfileData;
