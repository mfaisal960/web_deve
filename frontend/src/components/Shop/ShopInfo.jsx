
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { server } from "../../server";
import Loader from "../Login/Layout/Loader";
import { useDispatch, useSelector } from "react-redux";
import { getAllProductsShop, getSellerStats } from "../../redux/actions/product";
import { productData as demoProducts } from "../../static/data";

const ShopInfo = ({ isOwner, initialShop }) => {
  const [data, setData] = useState(initialShop || {});
  const [loadedShopId, setLoadedShopId] = useState(null);

  const { products, sellerStats } = useSelector((state) => state.products);
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


  // The loader is derived from which shop has been fetched, so no state has to
  // be set synchronously when the effect starts.
  const isLoading = Boolean(id) && isDatabaseId && loadedShopId !== id;

  useEffect(() => {
    if (!id) {
      return;
    }

    // Demo products use numeric shop IDs. They are not MongoDB ObjectIds and
    // must not be sent to the API endpoint that queries Shop.findById(), so the
    // initial (demo) shop data is kept as-is.
    if (!isDatabaseId) {
      return;
    }

    let cancelled = false;

    dispatch(getAllProductsShop(id));

    axios
      .get(`${server}/shop/get-shop-info/${id}`)
      .then((res) => {
        if (!cancelled) {
          setData(res.data.shop);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Unable to load shop information:", error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedShopId(id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, id, isDatabaseId]);

  const logoutHandler = async () => {
    try {
      await axios.get(`${server}/shop/logout`, {
        withCredentials: true,
      });

      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  // The shop's reviews, not the product documents' `reviews` arrays: those are
  // only written for a product that has a Mongo `_id`, and the bundled demo
  // catalogue has none, so totalling them left this panel reading "0 reviews"
  // for shops that had been reviewed. Grouping the demo products by shop id is
  // kept for the product count only, which the catalogue really is the authority
  // for.
  useEffect(() => {
    if (!id) {
      return;
    }

    dispatch(getSellerStats(id));
  }, [dispatch, id]);

  // The stats only describe the shop they were fetched for, and the panel is
  // rendered from the `id` in the URL, which is the shop being asked about.
  const hasSellerStats = Boolean(id) && sellerStats?.shopId === String(id);

  const totalReviewsLength = hasSellerStats ? sellerStats.totalReviews : 0;

  const averageRating = (
    hasSellerStats ? sellerStats.averageRating : 0
  ).toFixed(1);


  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full bg-white">

          {/* Shop Header */}
          <div className="flex flex-col items-center px-5 pt-7 pb-6 border-b border-gray-100">
            <div className="relative">
              <img
                src={
                  data.avatar?.url ||
                  data.shop_avatar?.url ||
                  "https://dummyimage.com/128x128/e5e7eb/6b7280?text=Shop"
                }
                alt={data.name || "Shop"}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-50 shadow-md"
              />

              {/* Online Indicator */}
              <span className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-900 text-center">
              {data.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 text-center">
              {data.description || "No shop description available."}
            </p>
          </div>

          {/* Shop Details */}
          <div className="divide-y divide-gray-100">

            {/* Address */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Address
              </p>

              <p className="mt-1 text-sm font-medium text-gray-700 break-words">
                {data.address || "Not available"}
              </p>
            </div>

            {/* Phone */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Phone Number
              </p>

              <p className="mt-1 text-sm font-medium text-gray-700">
                {data.phoneNumber || "Not available"}
              </p>
            </div>

            {/* Total Products */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Products
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {shopProducts.length}
              </p>
            </div>

            {/* Shop Ratings */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Shop Ratings
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {averageRating}
                </span>

                <span className="text-yellow-400 text-lg">
                  ★
                </span>

                <span className="text-xs text-gray-500">
                  ({totalReviewsLength} reviews)
                </span>
              </div>
            </div>

            {/* Joined Date */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Joined On
              </p>

              <p className="mt-1 text-sm font-medium text-gray-700">
                {data?.createdAt
                  ? data.createdAt.slice(0, 10)
                  : "Not available"}
              </p>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="px-5 py-6 space-y-3 border-t border-gray-100">

              {/* Edit Shop */}
              <Link to="/settings" className="block">
                <button
                  type="button"
                  className="w-full h-11 rounded-lg bg-black text-white text-sm font-semibold
                  transition-all duration-200
                  hover:bg-gray-800
                  active:scale-[0.98]
                  shadow-sm hover:shadow-md"
                >
                  Edit Shop
                </button>
              </Link>

              {/* Logout */}
              <button
                type="button"
                onClick={logoutHandler}
                className="w-full h-11 rounded-lg border border-red-200 bg-red-50 text-red-600
                text-sm font-semibold
                transition-all duration-200
                hover:bg-red-500 hover:text-white hover:border-red-500
                active:scale-[0.98]"
              >
                Log Out
              </button>

            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ShopInfo;
