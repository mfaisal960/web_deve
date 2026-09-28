
import React, { useEffect, useState } from "react";
import { Country, State } from "country-state-city";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const inputClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100";

const selectClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100";

const Checkout = () => {
  const { user } = useSelector((state) => state.user);
  const { cart } = useSelector((state) => state.cart);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [userInfo, setUserInfo] = useState(false);
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponCodeData, setCouponCodeData] = useState(null);
  const [discountPrice, setDiscountPrice] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const paymentSubmit = () => {
    if (
      address1 === "" ||
      address2 === "" ||
      zipCode === "" ||
      country === "" ||
      city === ""
    ) {
      toast.error("Please choose your delivery address!");
      return;
    }

    const shippingAddress = {
      address1,
      address2,
      zipCode,
      country,
      city,
    };

    const orderData = {
      cart,
      totalPrice,
      subTotalPrice,
      shipping,
      discountPrice,
      shippingAddress,
      user,
    };

    localStorage.setItem("latestOrder", JSON.stringify(orderData));
    navigate("/payment");
  };

  const getItemPrice = (item) =>
    item?.discountPrice ?? item?.discount_price ?? item?.price ?? 0;

  const subTotalPrice = (cart || []).reduce(
    (acc, item) => acc + getItemPrice(item) * (item?.qty ?? 1),
    0
  );

  const shipping = subTotalPrice * 0.1;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code!");
      return;
    }

    try {
      const res = await axios.get(
        `${server}/coupon/get-coupon-value/${couponCode.trim()}`
      );

      const coupon = res.data.couponCode;

      if (!coupon) {
        toast.error("Coupon code doesn't exist!");
        setCouponCode("");
        return;
      }

      const shopId = coupon.shopId;
      const couponCodeValue = coupon.value;

      const getItemShopId = (item) => {
        const raw =
          item?.shopId ??
          item?.shop?._id ??
          item?.shop?.id ??
          item?.sellerId ??
          item?.seller?._id ??
          item?.seller?.id;
        return raw == null ? null : String(raw);
      };

      const shopMatchedItems =
        cart?.filter((item) => getItemShopId(item) === String(shopId)) || [];

      const eligibleItems =
        shopMatchedItems.length > 0 ? shopMatchedItems : cart || [];

      if (eligibleItems.length === 0) {
        toast.error("Coupon code is not valid for this shop!");
        setCouponCode("");
        return;
      }

      const eligiblePrice = eligibleItems.reduce(
        (acc, item) => acc + getItemPrice(item) * (item?.qty ?? 1),
        0
      );

      const calculatedDiscount =
        (eligiblePrice * couponCodeValue) / 100;

      setDiscountPrice(calculatedDiscount);
      setCouponCodeData(coupon);
      setCouponCode("");
      toast.success("Coupon applied successfully!");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to apply coupon!"
      );
      setCouponCode("");
    }
  };

  const discountPercentage = couponCodeData ? discountPrice : 0;

  const totalPrice = couponCodeData
    ? (subTotalPrice + shipping - discountPercentage).toFixed(2)
    : (subTotalPrice + shipping).toFixed(2);

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Complete your shipping details and review your order.
          </p>
        </div>

        {/* Checkout Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Shipping Information */}
          <div className="lg:col-span-8">
            <ShippingInfo
              user={user}
              country={country}
              setCountry={setCountry}
              city={city}
              setCity={setCity}
              userInfo={userInfo}
              setUserInfo={setUserInfo}
              address1={address1}
              setAddress1={setAddress1}
              address2={address2}
              setAddress2={setAddress2}
              zipCode={zipCode}
              setZipCode={setZipCode}
            />
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4">
            <CartData
              handleSubmit={handleSubmit}
              totalPrice={totalPrice}
              shipping={shipping}
              subTotalPrice={subTotalPrice}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              discountPercentenge={discountPercentage}
            />
          </div>
        </div>

        {/* Payment Button */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={paymentSubmit}
            className="w-full rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-[280px]"
          >
            Go to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SHIPPING INFORMATION
========================================================= */

const ShippingInfo = ({
  user,
  country,
  setCountry,
  city,
  setCity,
  userInfo,
  setUserInfo,
  address1,
  setAddress1,
  address2,
  setAddress2,
  zipCode,
  setZipCode,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Shipping Address
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter the address where you want your order delivered.
        </p>
      </div>

      <form>
        {/* Name & Email */}
        <div className="grid grid-cols-1 gap-5 pb-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="full-name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Full Name
            </label>

            <input
              id="full-name"
              type="text"
              value={user?.name || ""}
              readOnly
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={user?.email || ""}
              readOnly
              required
              className={inputClasses}
            />
          </div>
        </div>

        {/* Phone & Zip Code */}
        <div className="grid grid-cols-1 gap-5 pb-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Phone Number
            </label>

            <input
              id="phone"
              type="tel"
              value={user?.phoneNumber || ""}
              readOnly
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="zip-code"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Zip Code
            </label>

            <input
              id="zip-code"
              type="text"
              inputMode="numeric"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              required
              placeholder="Enter zip code"
              className={inputClasses}
            />
          </div>
        </div>

        {/* Country & City */}
        <div className="grid grid-cols-1 gap-5 pb-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="country"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Country
            </label>

            <select
              id="country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setCity("");
              }}
              required
              className={selectClasses}
            >
              <option value="">Choose your country</option>

              {Country.getAllCountries().map((item) => (
                <option key={item.isoCode} value={item.isoCode}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              City
            </label>

            <select
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              disabled={!country}
              className={selectClasses}
            >
              <option value="">Choose your city</option>

              {country &&
                State.getStatesOfCountry(country).map((item) => (
                  <option key={item.isoCode} value={item.isoCode}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label
              htmlFor="address1"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Address 1
            </label>

            <input
              id="address1"
              type="text"
              required
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="Street address"
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="address2"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Address 2
            </label>

            <input
              id="address2"
              type="text"
              required
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Apartment, floor, area, etc."
              className={inputClasses}
            />
          </div>
        </div>
      </form>

      {/* Saved Addresses */}
      <div className="mt-7 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => setUserInfo(!userInfo)}
          className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
        >
          <span>Choose From Saved Address</span>

          <span className="text-blue-600">
            {userInfo ? "Hide" : "Show"}
          </span>
        </button>

        {userInfo && (
          <div className="mt-4 space-y-3">
            {user?.addresses?.length > 0 ? (
              user.addresses.map((item, index) => (
                <label
                  key={item._id || index}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <input
                    type="radio"
                    name="saved-address"
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    value={item.addressType}
                    onChange={() => {
                      setAddress1(item.address1 || "");
                      setAddress2(item.address2 || "");
                      setZipCode(item.zipCode || "");
                      setCountry(item.country || "");
                      setCity(item.city || "");
                    }}
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.addressType}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {item.address1} {item.address2}
                    </p>
                  </div>
                </label>
              ))
            ) : (
              <p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                No saved addresses available.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   CART DATA
========================================================= */

const CartData = ({
  handleSubmit,
  totalPrice,
  shipping,
  subTotalPrice,
  couponCode,
  setCouponCode,
  discountPercentenge,
}) => {
  return (
    <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-6 text-xl font-bold text-gray-900">
        Order Summary
      </h2>

      {/* Subtotal */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-500">
          Subtotal
        </span>

        <span className="text-sm font-semibold text-gray-900">
          ${Number(subTotalPrice).toFixed(2)}
        </span>
      </div>

      {/* Shipping */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-500">
          Shipping
        </span>

        <span className="text-sm font-semibold text-gray-900">
          ${Number(shipping).toFixed(2)}
        </span>
      </div>

      {/* Discount */}
      <div className="flex items-center justify-between border-b border-gray-200 py-3">
        <span className="text-sm text-gray-500">
          Discount
        </span>

        <span className="text-sm font-semibold text-green-600">
          {discountPercentenge
            ? `- $${Number(discountPercentenge).toFixed(2)}`
            : "$0.00"}
        </span>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-5">
        <span className="text-base font-bold text-gray-900">
          Total
        </span>

        <span className="text-2xl font-bold text-gray-900">
          ${totalPrice}
        </span>
      </div>

      {/* Coupon */}
      <form onSubmit={handleSubmit} className="mt-2">
        <label
          htmlFor="coupon-code"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Have a coupon?
        </label>

        <input
          id="coupon-code"
          type="text"
          className={inputClasses}
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          required
        />

        <button
          type="submit"
          className="mt-4 w-full rounded-lg border border-red-500 bg-white px-4 py-3 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
          Apply Coupon
        </button>
      </form>
    </div>
  );
};

export default Checkout;