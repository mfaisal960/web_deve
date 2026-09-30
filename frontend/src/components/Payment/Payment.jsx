import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CardNumberElement,
  CardCvcElement,
  CardExpiryElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { RxCross1 } from "react-icons/rx";
import { clearCart, dropUnorderableItems } from "../../redux/actions/cart";
// Aliased: this file already has a local `createOrder`, which is PayPal's
// onCreateOrder callback and has nothing to do with filing the order.
import {
  createOrder as createOrderRequest,
  getAllOrdersOfUser,
} from "../../redux/actions/order";

const inputClasses =
  "w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10";

const stripeInputClasses =
  "w-full h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 transition-all duration-200 focus-within:border-[#f63b60] focus-within:ring-2 focus-within:ring-[#f63b60]/10";

const buttonClasses =
  "w-full h-12 rounded-lg bg-[#f63b60] px-5 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#e92f54] hover:shadow-md active:scale-[0.99]";

const stripeOptions = {
  style: {
    base: {
      fontSize: "17px",
      lineHeight: "1.5",
      color: "#444",
      fontFamily: "inherit",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    empty: {
      color: "#9ca3af",
    },
  },
};
const Payment = () => {
  // latestOrder is written by Checkout right before navigating here, so it can
  // be read once as a lazy initializer instead of in an effect.
  const [orderData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("latestOrder") || "null") || [];
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);

  const { user } = useSelector((state) => state.user);

  const dispatch = useDispatch();

  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  // ------------------------------------------------
  // ORDER DATA
  // ------------------------------------------------
  // Built per request instead of being a shared object that handlers mutate.
  const buildOrder = (paymentInfo) => ({
    cart: orderData?.cart,
    shippingAddress: orderData?.shippingAddress,
    user: user || null,
    totalPrice: orderData?.totalPrice,
    paymentInfo,
  });

  // Places the order and, only once the API confirms it, empties the cart in both
  // the store and localStorage. `ok` is false when the order was refused, so each
  // payment method can stop instead of reporting a success that never happened.
  const placeOrder = async (paymentInfo, fallback) => {
    const { ok, orders, unorderableItems, error } = await dispatch(
      createOrderRequest(buildOrder(paymentInfo))
    );

    if (!ok) {
      // Part of the cart can point at a shop that no longer exists, which is a
      // 400 naming the rows. They can never be bought, so they are dropped and
      // the buyer is told which, rather than retrying into the same failure.
      if (unorderableItems.length) {
        await dispatch(dropUnorderableItems(unorderableItems));
        return { ok: false, cartRepaired: true };
      }

      toast.error(error || fallback);

      return { ok: false, cartRepaired: false };
    }

    dispatch(clearCart());
    localStorage.setItem("cartItems", JSON.stringify([]));
    localStorage.setItem("latestOrder", JSON.stringify([]));

    // Keep what was just bought: the confirmation screen renders these products,
    // and the order list is refreshed so the new order is there the moment the
    // buyer goes looking for it instead of only after a page remount.
    dispatch({ type: "OrdersCreated", payload: orders });

    if (user?._id) {
      dispatch(getAllOrdersOfUser(user._id));
    }

    setOpen(false);
    navigate("/order/success");

    toast.success("Order successful!");

    return { ok: true, cartRepaired: false };
  };

  // ------------------------------------------------
  // PAYPAL CREATE ORDER
  // ------------------------------------------------
  const createOrder = (data, actions) => {
    return actions.order
      .create({
        purchase_units: [
          {
            description: "Sunflower",
            amount: {
              currency_code: "USD",
              value: orderData?.totalPrice,
            },
          },
        ],
        application_context: {
          shipping_preference: "NO_SHIPPING",
        },
      })
      .then((orderID) => orderID);
  };

  // ------------------------------------------------
  // PAYPAL APPROVE
  // ------------------------------------------------
  const onApprove = async (data, actions) => {
    return actions.order.capture().then(function (details) {
      const { payer } = details;

      const paymentInfo = payer;

      if (paymentInfo !== undefined) {
        paypalPaymentHandler(paymentInfo);
      }
    });
  };

  // ------------------------------------------------
  // PAYPAL PAYMENT
  // ------------------------------------------------
  const paypalPaymentHandler = async (paymentInfo) => {
    const { ok, cartRepaired } = await placeOrder(
      {
        id: paymentInfo.payer_id,
        status: "succeeded",
        type: "Paypal",
      },
      "Payment failed!"
    );

    if (!ok && !cartRepaired) {
      // PayPal already captured the money, so the buyer has to be told the order
      // was not recorded rather than seeing the request fail silently.
      toast.error(
        "PayPal completed the payment but the order could not be saved. Please contact support with your receipt."
      );
    }
  };

  // ------------------------------------------------
  // STRIPE PAYMENT DATA
  // ------------------------------------------------
  const paymentData = {
    amount: Math.round((orderData?.totalPrice || 0) * 100),
  };

  // ------------------------------------------------
  // STRIPE PAYMENT
  // ------------------------------------------------
  const paymentHandler = async (e) => {
    e.preventDefault();

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        // The API is on a different origin (localhost:8000), so the session
        // cookie has to be sent explicitly for authenticated endpoints.
        withCredentials: true,
      };

      if (!stripe || !elements) {
        toast.error(
          "Stripe is not configured. Add VITE_STRIPE_PUBLIC_KEY to frontend/.env"
        );
        return;
      }

      const { data } = await axios.post(
        `${server}/payment/process`,
        paymentData,
        config
      );

      const client_secret = data.client_secret;

      const result = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
          },
        }
      );

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      if (
        result.paymentIntent &&
        result.paymentIntent.status === "succeeded"
      ) {
        // Stripe already took the money, so an order that fails to save needs
        // its own message on top of whatever went wrong.
        const { ok, cartRepaired } = await placeOrder(
          {
            id: result.paymentIntent.id,
            status: result.paymentIntent.status,
            type: "Credit Card",
          },
          "Payment failed!"
        );

        if (!ok && !cartRepaired) {
          toast.error(
            "Your card was charged but the order could not be saved. Please contact support with your receipt."
          );
        }
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Payment failed!"
      );
    }
  };

  // ------------------------------------------------
  // CASH ON DELIVERY
  // ------------------------------------------------
  const cashOnDeliveryHandler = async (e) => {
    e.preventDefault();

    const { ok, cartRepaired } = await placeOrder(
      { type: "Cash On Delivery" },
      "Order failed!"
    );

    // The repair already explained what was removed, but the buyer is still
    // sitting on a payment screen for an order that was not created. Previously
    // this returned quietly, so clicking "Confirm Order" looked broken and the
    // next click just reported an empty cart.
    if (!ok && cartRepaired) {
      toast.info("Please review your cart and confirm your order again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-start">

        {/* PAYMENT SECTION */}
        <div className="w-full lg:w-[65%]">
          <PaymentInfo
            user={user}
            open={open}
            setOpen={setOpen}
            onApprove={onApprove}
            createOrder={createOrder}
            paymentHandler={paymentHandler}
            cashOnDeliveryHandler={cashOnDeliveryHandler}
          />
        </div>

        {/* CART / SUMMARY SECTION */}
        <div className="w-full lg:w-[35%]">
          <CartData orderData={orderData} />
        </div>

      </div>
    </div>
  );
};

// ============================================================
// PAYMENT INFO
// ============================================================

const PaymentInfo = ({
  user,
  open,
  setOpen,
  onApprove,
  createOrder,
  paymentHandler,
  cashOnDeliveryHandler,
}) => {
  const [select, setSelect] = useState(1);

  const paymentOptionClasses =
    "flex w-full cursor-pointer items-center gap-3 border-b border-gray-200 px-1 py-4 transition-colors duration-200 hover:bg-gray-50";

  const radioClasses =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[3px] border-gray-400";

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:w-[95%]">

      {/* =====================================================
          CREDIT / DEBIT CARD
      ===================================================== */}

      <div>
        <button
          type="button"
          className={paymentOptionClasses}
          onClick={() => setSelect(1)}
        >
          <span className={radioClasses}>
            {select === 1 && (
              <span className="h-3 w-3 rounded-full bg-gray-700" />
            )}
          </span>

          <span className="text-left text-base font-semibold text-gray-800 sm:text-lg">
            Pay with Debit/Credit Card
          </span>
        </button>

        {select === 1 && (
          <div className="border-b border-gray-200 py-5">
            <form
              className="w-full"
              onSubmit={paymentHandler}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Name On Card
                  </label>

                  <input
                    required
                    placeholder={user?.name}
                    value={user?.name || ""}
                    readOnly
                    className={`${inputClasses} cursor-not-allowed bg-gray-50`}
                  />
                </div>

                {/* EXPIRY */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Exp Date
                  </label>

                  <div className={stripeInputClasses}>
                    <CardExpiryElement
                      options={stripeOptions}
                    />
                  </div>
                </div>

                {/* CARD NUMBER */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Card Number
                  </label>

                  <div className={stripeInputClasses}>
                    <CardNumberElement
                      options={stripeOptions}
                    />
                  </div>
                </div>

                {/* CVV */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    CVV
                  </label>

                  <div className={stripeInputClasses}>
                    <CardCvcElement
                      options={stripeOptions}
                    />
                  </div>
                </div>

              </div>

              <button
                type="submit"
                className={`${buttonClasses} mt-6`}
              >
                Submit Payment
              </button>
            </form>
          </div>
        )}
      </div>

      {/* =====================================================
          PAYPAL
      ===================================================== */}

      <div className="mt-5">
        <button
          type="button"
          className={paymentOptionClasses}
          onClick={() => setSelect(2)}
        >
          <span className={radioClasses}>
            {select === 2 && (
              <span className="h-3 w-3 rounded-full bg-gray-700" />
            )}
          </span>

          <span className="text-left text-base font-semibold text-gray-800 sm:text-lg">
            Pay with PayPal
          </span>
        </button>

        {select === 2 && (
          <div className="border-b border-gray-200 py-5">

            <button
              type="button"
              className={buttonClasses}
              onClick={() => setOpen(true)}
            >
              Pay Now
            </button>

            {open && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

                <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl sm:p-8">

                  {/* CLOSE */}
                  <button
                    type="button"
                    aria-label="Close payment"
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    onClick={() => setOpen(false)}
                  >
                    <RxCross1 size={24} />
                  </button>

                  <div className="mb-6 pr-8">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Pay with PayPal
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Complete your payment securely through PayPal.
                    </p>
                  </div>

                  <PayPalScriptProvider
                    options={{
                      "client-id":
                        "Aczac4Ry9_QA1t4c7TKH9UusH3RTe6onyICPoCToHG10kjlNdI-qwobbW9JAHzaRQwFMn2-k660853jn",
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                      }}
                      onApprove={onApprove}
                      createOrder={createOrder}
                    />
                  </PayPalScriptProvider>

                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          CASH ON DELIVERY
      ===================================================== */}

      <div className="mt-5">

        <button
          type="button"
          className={paymentOptionClasses}
          onClick={() => setSelect(3)}
        >
          <span className={radioClasses}>
            {select === 3 && (
              <span className="h-3 w-3 rounded-full bg-gray-700" />
            )}
          </span>

          <span className="text-left text-base font-semibold text-gray-800 sm:text-lg">
            Cash on Delivery
          </span>
        </button>

        {select === 3 && (
          <div className="py-5">

            <form
              className="w-full"
              onSubmit={cashOnDeliveryHandler}
            >
              <button
                type="submit"
                className={buttonClasses}
              >
                Confirm Order
              </button>
            </form>

          </div>
        )}
      </div>

    </div>
  );
};

// ============================================================
// CART DATA + COUPON
// ============================================================

const CartData = ({ orderData }) => {
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const shipping = Number(orderData?.shipping || 0).toFixed(2);

  // ==========================================================
  // APPLY COUPON
  // ==========================================================

  const handleApplyCoupon = async (e) => {
    e.preventDefault();

    const code = couponCode.trim();

    if (!code) {
      toast.error("Please enter a coupon code.");
      return;
    }

    try {
      setCouponLoading(true);

      // The coupon value comes from the same endpoint Checkout uses. There is
      // no POST /coupon/apply route in this backend, so the old call could
      // only ever answer 404.
      const { data } = await axios.get(
        `${server}/coupon/get-coupon-value/${encodeURIComponent(code)}`
      );

      const coupon = data?.couponCode;

      if (!coupon) {
        toast.error("Coupon code doesn't exist!");
        setCouponCode("");
        return;
      }

      const cart = orderData?.cart || [];

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

      const shopMatchedItems = cart.filter(
        (item) => getItemShopId(item) === String(coupon.shopId)
      );

      const eligibleItems =
        shopMatchedItems.length > 0 ? shopMatchedItems : cart;

      if (eligibleItems.length === 0) {
        toast.error("Coupon code is not valid for this shop!");
        setCouponCode("");
        return;
      }

      const getItemPrice = (item) =>
        item?.discountPrice ?? item?.discount_price ?? item?.price ?? 0;

      const subTotal = cart.reduce(
        (acc, item) => acc + getItemPrice(item) * (item?.qty ?? 1),
        0
      );

      const eligiblePrice = eligibleItems.reduce(
        (acc, item) => acc + getItemPrice(item) * (item?.qty ?? 1),
        0
      );

      const calculatedDiscount = (eligiblePrice * coupon.value) / 100;
      const shippingCost = Number(orderData?.shipping || subTotal * 0.1);

      // Store the recalculated total so Payment charges and displays the same
      // amount.
      const updatedOrder = {
        ...orderData,
        subTotalPrice: Number(subTotal),
        shipping: Number(shippingCost),
        discountPrice: Number(calculatedDiscount.toFixed(2)),
        totalPrice: Number(
          (subTotal + shippingCost - calculatedDiscount).toFixed(2)
        ),
      };

      localStorage.setItem("latestOrder", JSON.stringify(updatedOrder));

      setCouponCode("");
      toast.success("Coupon applied successfully!");

      // Reload so Payment reads the updated latestOrder from localStorage.
      window.location.reload();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to apply coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">

      {/* ======================================================
          SUBTOTAL
      ====================================================== */}

      <div className="flex items-center justify-between gap-4">

        <h3 className="text-sm font-medium text-gray-500 sm:text-base">
          Subtotal
        </h3>

        <h5 className="text-base font-semibold text-gray-900 sm:text-lg">
          ${Number(orderData?.subTotalPrice || 0).toFixed(2)}
        </h5>

      </div>

      <div className="my-5 h-px bg-gray-100" />

      {/* ======================================================
          SHIPPING
      ====================================================== */}

      <div className="flex items-center justify-between gap-4">

        <h3 className="text-sm font-medium text-gray-500 sm:text-base">
          Shipping
        </h3>

        <h5 className="text-base font-semibold text-gray-900 sm:text-lg">
          ${shipping}
        </h5>

      </div>

      <div className="my-5 h-px bg-gray-100" />

      {/* ======================================================
          DISCOUNT
      ====================================================== */}

      <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-5">

        <h3 className="text-sm font-medium text-gray-500 sm:text-base">
          Discount
        </h3>

        <h5 className="text-base font-semibold text-gray-900 sm:text-lg">

          {Number(orderData?.discountPrice || 0) > 0
            ? `$${Number(
                orderData.discountPrice
              ).toFixed(2)}`
            : "-"}

        </h5>

      </div>

      {/* ======================================================
          TOTAL
      ====================================================== */}

      <div className="flex items-center justify-between pt-5">

        <span className="text-base font-semibold text-gray-800">
          Total
        </span>

        <span className="text-xl font-bold text-[#f63b60]">
          ${Number(orderData?.totalPrice || 0).toFixed(2)}
        </span>

      </div>

      {/* ======================================================
          COUPON INPUT
      ====================================================== */}

      <form
        onSubmit={handleApplyCoupon}
        className="mt-6"
      >

        <input
          type="text"
          value={couponCode}
          onChange={(e) =>
            setCouponCode(e.target.value)
          }
          placeholder="Coupon code"
          disabled={couponLoading}
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        <button
          type="submit"
          disabled={couponLoading}
          className="mt-4 h-11 w-full rounded-lg border border-[#f63b60] bg-white px-5 text-sm font-semibold text-[#f63b60] transition-all duration-200 hover:bg-[#f63b60] hover:text-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {couponLoading
            ? "Applying..."
            : "Apply code"}
        </button>

      </form>

    </div>
  );
};

export default Payment;
