
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { getAllProductsShop } from "../../redux/actions/product";
import ProductCard from "../Route/Hero/ProductCard/ProductCard";
import Ratings from "../Product/Ratings";
import { getAllEventsShop } from "../../redux/actions/event";

const ShopProfileData = ({ isOwner }) => {
  const { products } = useSelector((state) => state.products);
  const { events } = useSelector((state) => state.events);

  const { id } = useParams();
  const dispatch = useDispatch();

  const [active, setActive] = useState(1);

  useEffect(() => {
    dispatch(getAllProductsShop(id));
    dispatch(getAllEventsShop(id));
  }, [dispatch, id]);

  const allReviews =
    products && products.map((product) => product.reviews).flat();

  const tabs = [
    {
      id: 1,
      label: "Shop Products",
    },
    {
      id: 2,
      label: "Running Events",
    },
    {
      id: 3,
      label: "Shop Reviews",
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Tabs */}
          <div className="w-full overflow-x-auto lg:w-auto">
            <div className="flex min-w-max items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  className={`relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all duration-200 sm:px-5 sm:text-base ${
                    active === tab.id
                      ? "text-red-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab.label}

                  {active === tab.id && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-red-500 sm:left-4 sm:right-4" />
                  )}
                </button>
              ))}
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
                className="flex h-11 w-full items-center justify-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-[0.98] lg:w-auto"
              >
                Go Dashboard
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ================= PRODUCTS ================= */}
      {active === 1 && (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((item, index) => (
                <ProductCard
                  data={item}
                  key={item._id || index}
                  isShop={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-2xl">📦</span>
              </div>

              <h5 className="text-lg font-semibold text-gray-800">
                No Products Found
              </h5>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                This shop has not added any products yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= EVENTS ================= */}
      {active === 2 && (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-2xl">🎉</span>
              </div>

              <h5 className="text-lg font-semibold text-gray-800">
                No Events Found
              </h5>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                This shop currently has no running events.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= REVIEWS ================= */}
      {active === 3 && (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {allReviews && allReviews.length > 0 ? (
            <div className="space-y-4">
              {allReviews.map((item, index) => (
                <div
                  key={item._id || index}
                  className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.user?.avatar?.url}
                      className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm sm:h-14 sm:w-14"
                      alt={item.user?.name || "User"}
                    />
                  </div>

                  {/* Review Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                        {item.user?.name || "Anonymous"}
                      </h1>

                      <Ratings rating={item.rating} />
                    </div>

                    <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                      {item?.comment || "No comment provided."}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {"2days ago"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-2xl">⭐</span>
              </div>

              <h5 className="text-lg font-semibold text-gray-800">
                No Reviews Found
              </h5>

              <p className="mt-1 max-w-md text-sm text-gray-500">
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
