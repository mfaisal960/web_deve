import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  AiOutlineClockCircle,
  AiOutlineEnvironment,
  AiOutlineSend,
  AiOutlineShoppingCart,
  AiOutlineCreditCard,
  AiOutlineCheckCircle,
} from "react-icons/ai";
import { getOrderById } from "../../redux/actions/order";
import OrderStatusButton from "../Order/OrderStatusButton";
import Loader from "../Login/Layout/Loader";

const FALLBACK_IMAGE =
  "https://dummyimage.com/150x150/cccccc/999999?text=No+Image";

const getItemPrice = (item) =>
  item?.discountPrice ?? item?.discount_price ?? item?.price ?? 0;

const getItemQty = (item) => item?.qty ?? 1;

const getItemImage = (item) =>
  item?.images?.[0]?.url || item?.image_Url?.[0]?.url || item?.image;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrderDetails = () => {
  const { id } = useParams();
  const { order = null, loading = false, error = null } = useSelector(
    (state) => state.order || {}
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (id) {
      dispatch(getOrderById(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="w-full px-4 py-10">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-700">
            Could not load this order
          </h3>

          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const cart = Array.isArray(order.cart) ? order.cart : [];
  const shippingAddress = order.shippingAddress || {};
  const paymentInfo = order.paymentInfo || {};
  const user = order.user || {};

  return (
    <div className="w-full bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        {/* Header */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Order Details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Order ID:{" "}
                <span className="font-mono text-gray-700">{order._id}</span>
              </p>

              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <AiOutlineClockCircle size={16} />
                {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 px-4 py-2">
              <p className="text-xs uppercase tracking-wide text-red-500">
                Status
              </p>

              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-red-700">
                {order.status === "Delivered" ? (
                  <AiOutlineCheckCircle size={16} />
                ) : (
                  <AiOutlineSend size={16} />
                )}
                {order.status}
              </p>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <AiOutlineShoppingCart size={18} className="text-red-500" />
            Customer
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Name
              </p>

              <p className="mt-1 text-sm text-gray-800">
                {user.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Email
              </p>

              <p className="mt-1 text-sm text-gray-800">
                {user.email || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <AiOutlineEnvironment size={18} className="text-red-500" />
            Shipping Address
          </h3>

          <div className="mt-4 space-y-1 text-sm text-gray-700">
            <p>{shippingAddress.address || "—"}</p>

            <p>
              {shippingAddress.city || "—"}
              {shippingAddress.state ? `, ${shippingAddress.state}` : ""}
              {shippingAddress.zipCode ? ` - ${shippingAddress.zipCode}` : ""}
            </p>

            <p>
              {shippingAddress.country || "—"}
              {shippingAddress.phoneNumber
                ? ` • ${shippingAddress.phoneNumber}`
                : ""}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <h3 className="border-b border-gray-100 p-5 text-base font-semibold text-gray-900 sm:px-6">
            Items ({cart.length})
          </h3>

          {cart.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">
              This order has no items.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.map((item, index) => (
                <div
                  key={item._id || index}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-50 sm:px-6"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={getItemImage(item) || FALLBACK_IMAGE}
                      alt={item.name || "Product"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-gray-800">
                      {item.name || "Product"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      ${getItemPrice(item)} × {getItemQty(item)}
                    </p>
                  </div>

                  <p className="flex-shrink-0 text-sm font-semibold text-gray-900">
                    ${(getItemPrice(item) * getItemQty(item)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <OrderStatusButton orderId={order._id} status={order.status} />
        </div>

        {/* Payment & Total */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <AiOutlineCreditCard size={18} className="text-red-500" />
            Payment
          </h3>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Payment ID</span>

              <span className="font-mono text-gray-700">
                {paymentInfo.id || "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>

              <span className="text-gray-800">
                {paymentInfo.type || "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Payment status</span>

              <span className="text-gray-800">
                {paymentInfo.status || "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Paid at</span>

              <span className="text-gray-800">
                {formatDate(order.paidAt)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Delivered at</span>

              <span className="text-gray-800">
                {formatDate(order.deliveredAt)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex justify-between border-t border-gray-100 pt-4">
            <span className="text-sm font-medium text-gray-500">Total</span>

            <span className="text-lg font-bold text-red-600">
              USD ${(order.totalPrice ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
