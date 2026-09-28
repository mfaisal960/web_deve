import React, { useEffect, useState } from "react";
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
import { useSelector } from "react-redux";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { RxCross1 } from "react-icons/rx";

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
  const [orderData, setOrderData] = useState([]);
  const [open, setOpen] = useState(false);

  const { user } = useSelector((state) => state.user);

  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const storedOrder = JSON.parse(
      localStorage.getItem("latestOrder") || "null"
    );

    setOrderData(storedOrder || []);
  }, []);

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
  // ORDER DATA
  // ------------------------------------------------
  const order = {
    cart: orderData?.cart,
    shippingAddress: orderData?.shippingAddress,
    user: user && user,
    totalPrice: orderData?.totalPrice,
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
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        // The API is on a different origin (localhost:8000), so the session
        // cookie has to be sent explicitly for authenticated endpoints.
        withCredentials: true,
      };

      order.paymentInfo = {
        id: paymentInfo.payer_id,
        status: "succeeded",
        type: "Paypal",
      };

      await axios.post(
        `${server}/order/create-order`,
        order,
        config
      );

      setOpen(false);
      navigate("/order/success");

      toast.success("Order successful!");

      localStorage.setItem("cartItems", JSON.stringify([]));
      localStorage.setItem("latestOrder", JSON.stringify([]));

      window.location.reload();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Payment failed!"
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
        order.paymentInfo = {
          id: result.paymentIntent.id,
          status: result.paymentIntent.status,
          type: "Credit Card",
        };

        await axios.post(
          `${server}/order/create-order`,
          order,
          config
        );

        setOpen(false);

        navigate("/order/success");

        toast.success("Order successful!");

        localStorage.setItem("cartItems", JSON.stringify([]));
        localStorage.setItem("latestOrder", JSON.stringify([]));

        window.location.reload();
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

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        // The API is on a different origin (localhost:8000), so the session
        // cookie has to be sent explicitly for authenticated endpoints.
        withCredentials: true,
      };

      order.paymentInfo = {
        type: "Cash On Delivery",
      };

      await axios.post(
        `${server}/order/create-order`,
        order,
        config
      );

      setOpen(false);

      navigate("/order/success");

      toast.success("Order successful!");

      localStorage.setItem("cartItems", JSON.stringify([]));
      localStorage.setItem("latestOrder", JSON.stringify([]));

      window.location.reload();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Order failed!"
      );
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

      /*
       * ------------------------------------------------------
       * CONNECT YOUR BACKEND COUPON API HERE
       * ------------------------------------------------------
       *
       * Example backend endpoint:
       *
       * POST /coupon/apply
       *
       * Body:
       * {
       *   code: "SAVE10",
       *   amount: 100
       * }
       *
       * Expected response:
       *
       * {
       *   success: true,
       *   discountPrice: 10,
       *   totalPrice: 90
       * }
       *
       * ------------------------------------------------------
       */

      const { data } = await axios.post(
        `${server}/coupon/apply`,
        {
          code: code,
          amount: Number(orderData?.subTotalPrice || 0),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (data?.success) {
        toast.success(
          data?.message || "Coupon applied successfully!"
        );

        /*
         * Update latestOrder so the payment page
         * displays the new discount and total.
         */
        const updatedOrder = {
          ...orderData,

          discountPrice:
            Number(data?.discountPrice || 0),

          totalPrice:
            Number(
              data?.totalPrice ??
                Number(orderData?.totalPrice || 0) -
                  Number(data?.discountPrice || 0)
            ),
        };

        localStorage.setItem(
          "latestOrder",
          JSON.stringify(updatedOrder)
        );

        /*
         * Reload so Payment reads the updated
         * latestOrder from localStorage.
         */
        window.location.reload();
      } else {
        toast.error(
          data?.message || "Invalid coupon code."
        );
      }
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