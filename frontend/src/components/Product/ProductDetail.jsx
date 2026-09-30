
import React, { useEffect, useState } from "react";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllProductsShop } from "../../redux/actions/product";
import { resolveImageUrl } from "../../server";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "./Ratings";

const ProductDetails = ({ data }) => {
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.user);
  const { products } = useSelector((state) => state.products);

  const [count, setCount] = useState(1);
  const [select, setSelect] = useState(0);

  const dispatch = useDispatch();

  // Product images fallback
  const productImages = data?.images?.length
    ? data.images
    : data?.image_Url?.length
      ? data.image_Url
      : data?.image
        ? [{ url: data.image }]
        : [];

  // Entries can be objects ({ url }) or bare URL strings, depending on source.
  const productImageUrls = productImages
    .map((image) =>
      resolveImageUrl(typeof image === "string" ? image : image?.url)
    )
    .filter(Boolean);

  const selectedImageUrl =
    productImageUrls[select] || productImageUrls[0] ||
    "https://dummyimage.com/800x600/f3f4f6/6b7280?text=No+Product+Image";

  // Shop fallback
  const shop = data?.shop || {};
  const shopId = shop._id || shop.id;

  // Only a real Mongo shop id can be looked up: the bundled demo products
  // carry a numeric `shop.id` that exists purely in the local catalogue, so
  // fetching it always returned an empty list.
  const shopOwnerId = shop._id;

  const shopAvatarUrl =
    resolveImageUrl(shop.avatar?.url || shop.shop_avatar?.url) ||
    "https://dummyimage.com/112x112/e5e7eb/6b7280?text=Shop";

  // Product fallback
  const productId = data?._id || data?.id;

  const discountPrice =
    data?.discountPrice ?? data?.discount_price ?? data?.price ?? 0;

  const originalPrice = data?.originalPrice ?? data?.price;

  // Wishlist membership is derived from the store instead of being mirrored in
  // local state, so it can never drift out of sync with the wishlist slice.
  const click = Boolean(
    wishlist?.some((item) => (item._id || item.id) === productId)
  );

  const [shownProductId, setShownProductId] = useState(productId);

  if (shownProductId !== productId) {
    setShownProductId(productId);
    setSelect(0);
    setCount(1);
  }

  useEffect(() => {
    if (shopOwnerId) {
      dispatch(getAllProductsShop(shopOwnerId));
    }
  }, [dispatch, shopOwnerId]);

  const incrementCount = () => {
    setCount((prev) => prev + 1);
  };

  const decrementCount = () => {
    if (count > 1) {
      setCount((prev) => prev - 1);
    }
  };

  // The wishlist is the single source of truth for the heart icon, so these
  // handlers only dispatch.
  const removeFromWishlistHandler = (product) => {
    dispatch(removeFromWishlist(product));
  };

  const addToWishlistHandler = (product) => {
    dispatch(addToWishlist(product));
  };

  const addToCartHandler = (id) => {
    const isItemExists = cart?.some(
      (item) => String(item._id || item.id) === String(id)
    );

    if (isItemExists) {
      toast.error("Item already in cart!");
      return;
    }

    // A listing with no stock recorded is unknown, not empty. Only a known
    // stock below the requested quantity is a real refusal.
    const hasStock = data.stock !== undefined && data.stock !== null && data.stock !== "";
    const stock = Number(data.stock);

    if (hasStock && Number.isFinite(stock) && stock < count) {
      toast.error(
        stock < 1
          ? "Product stock limited!"
          : `Only ${stock} left in stock.`
      );
      return;
    }

    const cartData = {
      ...data,
      qty: count,
    };

    dispatch(addTocart(cartData));
    toast.success("Item added to cart successfully!");
  };

  const totalReviewsLength =
    products?.reduce(
      (acc, product) => acc + (product.reviews?.length || 0),
      0
    ) || 0;

  const totalRatings =
    products?.reduce(
      (acc, product) =>
        acc +
        (product.reviews || []).reduce(
          (sum, review) => sum + review.rating,
          0
        ),
      0
    ) || 0;

  const avg = totalRatings / totalReviewsLength || 0;
  const averageRating = avg.toFixed(2);

  // Seller messaging is not implemented anywhere in this project: there is no
  // /conversation/* route and no /inbox page, so the previous request could only
  // ever answer 404 and then navigate to a route that does not exist.
  const handleMessageSubmit = () => {
    if (!isAuthenticated) {
      toast.error("Please login to contact the seller");
      return;
    }

    toast.info("Seller messaging is coming soon.");
  };

  return (
    <div className="min-h-screen bg-white">
      {data && (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

          {/* Product Overview */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Product Images */}
            <div className="space-y-5">

              {/* Main Image */}
               <div className="flex min-h-[400px] items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:min-h-[520px]">
                 <img
                   src={selectedImageUrl}
                   alt={data.name || "Product"}
                   className="h-full max-h-[500px] w-full object-contain transition-transform duration-500 hover:scale-[1.03]"
                   onError={(event) => {
                     event.currentTarget.onerror = null;
                     event.currentTarget.src =
                       "https://dummyimage.com/800x600/f3f4f6/6b7280?text=No+Product+Image";
                   }}
                 />
               </div>

              {/* Image Thumbnails */}
              {productImageUrls.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {productImageUrls.map((url, index) => (
                    <button
                      key={url || index}
                      type="button"
                      onClick={() => setSelect(index)}
                      aria-label={`View product image ${index + 1}`}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all duration-200 ${
                        select === index
                          ? "border-gray-900 shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`${data.name || "Product"} ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://dummyimage.com/160x160/f3f4f6/6b7280?text=Product";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="flex flex-col">

              {/* Title & Description */}
              <div className="border-b border-gray-200 pb-6">
                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Product
                </span>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {data.name}
                </h1>

                <p className="mt-5 text-base leading-7 text-gray-600">
                  {data.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="flex items-end gap-4 border-b border-gray-200 py-6">
                <span className="text-3xl font-bold text-gray-900">
                  ${discountPrice}
                </span>

                {originalPrice &&
                  Number(originalPrice) !== Number(discountPrice) && (
                    <span className="text-lg text-gray-400 line-through">
                      ${originalPrice}
                    </span>
                  )}
              </div>

              {/* Quantity & Wishlist */}
              <div className="flex items-center justify-between py-6">
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-300">
                  <button
                    type="button"
                    onClick={decrementCount}
                    disabled={count <= 1}
                    className="flex h-11 w-11 items-center justify-center bg-gray-50 text-xl font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>

                  <span className="flex h-11 w-14 items-center justify-center border-x border-gray-300 bg-white text-sm font-semibold text-gray-900">
                    {count}
                  </span>

                  <button
                    type="button"
                    onClick={incrementCount}
                    className="flex h-11 w-11 items-center justify-center bg-gray-50 text-xl font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    click
                      ? removeFromWishlistHandler(data)
                      : addToWishlistHandler(data)
                  }
                  aria-label={
                    click
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 ${
                    click
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50"
                  }`}
                >
                  {click ? (
                    <AiFillHeart className="text-2xl text-red-500" />
                  ) : (
                    <AiOutlineHeart className="text-2xl text-gray-700" />
                  )}
                </button>
              </div>

              {/* Add To Cart */}
              <button
                type="button"
                onClick={() => addToCartHandler(productId)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 bg-gray-900 hover:bg-gray-800 hover:shadow-lg active:scale-[0.99]"
              >
                Add to Cart
                <AiOutlineShoppingCart className="text-lg" />
              </button>

              {/* Seller Card */}
              <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <Link
                    to={
                      shopId
                        ? `/shop/preview/${shopId}`
                        : "/"
                    }
                    state={{ shop }}
                    className="group flex items-center gap-3"
                  >
                    <img
                      src={shopAvatarUrl}
                      alt={shop.name || "Shop"}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "https://dummyimage.com/112x112/e5e7eb/6b7280?text=Shop";
                      }}
                    />

                    <div>
                      <h3 className="font-semibold text-gray-900 transition group-hover:text-gray-600">
                        {shop.name || "Shop"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        ({averageRating}/5) Ratings
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={handleMessageSubmit}
                    title="Seller messaging is not available yet"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 hover:shadow-md"
                  >
                    Send Message
                    <AiOutlineMessage className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <ProductDetailsInfo
            data={data}
            products={products}
            totalReviewsLength={totalReviewsLength}
            averageRating={averageRating}
            shop={shop}
            shopId={shopId}
            shopAvatarUrl={shopAvatarUrl}
          />
        </div>
      )}
    </div>
  );
};

const ProductDetailsInfo = ({
  data,
  products,
  totalReviewsLength,
  averageRating,
  shop,
  shopId,
  shopAvatarUrl,
}) => {
  const [active, setActive] = useState(1);

  const tabs = [
    {
      id: 1,
      label: "Product Details",
    },
    {
      id: 2,
      label: "Product Reviews",
    },
    {
      id: 3,
      label: "Seller Information",
    },
  ];

  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`relative px-5 py-5 text-sm font-semibold transition sm:px-8 sm:text-base ${
                active === tab.id
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}

              {active === tab.id && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Product Details */}
      {active === 1 && (
        <div className="p-6 sm:p-8 lg:p-10">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Product Description
          </h3>

          <p className="whitespace-pre-line text-base leading-8 text-gray-600">
            {data.description}
          </p>
        </div>
      )}

      {/* Reviews */}
      {active === 2 && (
        <div className="min-h-[300px] p-6 sm:p-8 lg:p-10">
          <div className="space-y-6">
            {data?.reviews?.map((item, index) => (
              <div
                key={item?._id || item?.id || index}
                className="flex gap-4 border-b border-gray-100 pb-6 last:border-0"
              >
                <img
                  src={
                    resolveImageUrl(item.user?.avatar?.url) ||
                    "https://dummyimage.com/96x96/e5e7eb/6b7280?text=User"
                  }
                  alt={item.user?.name || "Customer"}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="font-semibold text-gray-900">
                      {item.user?.name || "Customer"}
                    </h4>

                    <Ratings rating={data?.ratings} />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {item.comment}
                  </p>
                </div>
              </div>
            ))}

            {(data?.reviews?.length || 0) === 0 && (
              <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
                <p className="text-sm font-medium text-gray-500">
                  No reviews for this product yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seller Information */}
      {active === 3 && (
        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:p-10">

          {/* Seller Profile */}
          <div>
            <Link
              to={
                shopId
                  ? `/shop/preview/${shopId}`
                  : "/"
              }
              state={{ shop }}
              className="group inline-flex items-center gap-3"
            >
              <img
                src={shopAvatarUrl}
                className="h-14 w-14 rounded-full object-cover"
                alt={shop.name || "Shop"}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "https://dummyimage.com/112x112/e5e7eb/6b7280?text=Shop";
                }}
              />

              <div>
                <h3 className="font-semibold text-gray-900 transition group-hover:text-gray-600">
                  {shop.name || "Shop"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  ({averageRating}/5) Ratings
                </p>
              </div>
            </Link>

            <p className="mt-5 text-sm leading-7 text-gray-600">
              {shop.description ||
                "No shop description available."}
            </p>
          </div>

          {/* Seller Statistics */}
          <div className="rounded-2xl bg-gray-50 p-6">
            <div className="space-y-4 text-sm">

              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-gray-900">
                  Joined on
                </span>

                <span className="text-gray-600">
                  {shop.createdAt?.slice(0, 10) ||
                    "Not available"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-gray-900">
                  Total Products
                </span>

                <span className="text-gray-600">
                  {products?.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-gray-900">
                  Total Reviews
                </span>

                <span className="text-gray-600">
                  {totalReviewsLength}
                </span>
              </div>

              <Link
                to={
                  shopId
                    ? `/shop/preview/${shopId}`
                    : "/"
                }
                state={{ shop }}
                className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 hover:shadow-md"
              >
                Visit Shop
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDetails;
