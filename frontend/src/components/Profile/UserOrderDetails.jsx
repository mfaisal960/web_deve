import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCreditCard,
  AiOutlineEnvironment,
  AiOutlineSend,
  AiOutlineStar,
} from "react-icons/ai";
import { getUserOrderById, updateUserOrderStatus } from "../../redux/actions/order";
import { createNewReview } from "../../redux/actions/product";
import OrderStatusButton from "../Order/OrderStatusButton";
import ReviewFormModal from "../Order/ReviewFormModal";
import {
  ORDER_STATUSES,
  REFUND_STATUSES,
  isRefundStatus,
} from "../../utils/orderItems";
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

// The stages are listed on the same flow the status control below edits, so the
// buyer can see where the order is and which stages are already behind it. A
// status that is not one of the stages is shown as it is but marks nothing as
// reached, because nothing on the list can be vouched for it.
const OrderProgress = ({ status }) => {
  const flow = isRefundStatus(status) ? REFUND_STATUSES : ORDER_STATUSES;

  const currentIndex = flow.indexOf(status);

  return (
    <ol className="mt-4 space-y-3 sm:flex sm:space-y-0">
      {flow.map((stage, index) => {
        const isCurrent = index === currentIndex;
        const isDone = currentIndex !== -1 && index < currentIndex;

        return (
          <li key={stage} className="flex gap-3 sm:flex-1 sm:flex-col sm:gap-2">
            <div className="flex items-center">
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isCurrent
                    ? "bg-red-600 text-white"
                    : isDone
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isDone ? <AiOutlineCheckCircle size={14} /> : index + 1}
              </span>

              {index < flow.length - 1 && (
                <span
                  className={`mx-2 hidden h-0.5 flex-1 sm:block ${
                    isDone ? "bg-red-200" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            <p
              className={`text-sm sm:pr-4 ${
                isCurrent
                  ? "font-semibold text-gray-900"
                  : isDone
                  ? "text-gray-600"
                  : "text-gray-400"
              }`}
            >
              {stage}
            </p>
          </li>
        );
      })}
    </ol>
  );
};

const UserOrderDetails = () => {
  const { id } = useParams();
  const { order = null, loading = false, error = null } = useSelector(
    (state) => state.order || {}
  );
  const {
    reviewSubmitting = false,
    reviewError = null,
  } = useSelector((state) => state.products || {});

  const dispatch = useDispatch();

  // The cart line the review form is open for, held by identity rather than by
  // index: the list is refetched on every mount, and an index would point at a
  // different item after a refetch.
  const [reviewingItem, setReviewingItem] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(getUserOrderById(id));
    }
  }, [dispatch, id]);

  // A review is only allowed on an order that arrived, which is the same rule
  // the server enforces. Checked here as well so the button is not offered for
  // an order still in transit and the request is never made to be refused.
  const isDelivered = order?.status === "Delivered";

  const handleSubmitReview = async ({ productId, orderId, rating, comment }) => {
    const result = await dispatch(
      createNewReview(orderId, productId, rating, comment)
    );

    if (result?.ok) {
      toast.success("Thanks for your review");
      setReviewingItem(null);
      return;
    }

    // The modal stays open on a refusal so the typed comment is not lost.
    toast.error(result?.error || "Could not submit the review");
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="w-full px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-100 bg-red-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-700">
            Could not load this order
          </h3>

          <p className="mt-2 text-sm text-red-600">{error}</p>

          <Link
            to="/profile?tab=2"
            className="mt-5 inline-flex rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Back to my orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Order not found
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            This order does not exist, or it belongs to another account.
          </p>

          <Link
            to="/profile?tab=2"
            className="mt-5 inline-flex rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Back to my orders
          </Link>
        </div>
      </div>
    );
  }

  const cart = Array.isArray(order.cart) ? order.cart : [];
  const shippingAddress = order.shippingAddress || {};
  const paymentInfo = order.paymentInfo || {};

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

        {/* Order Progress */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <AiOutlineSend size={18} className="text-red-500" />
            Order Progress
          </h3>

          <OrderProgress status={order.status} />
        </div>

        {/* Order Status */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <AiOutlineSend size={18} className="text-red-500" />
            Update Status
          </h3>

          {/* The whole flow is offered here rather than only the stages after the
              current one: the buyer is choosing where their order is, not a shop
              walking an order forward, so any stage of the list can be picked. */}
          <div className="mt-4">
            <OrderStatusButton
              orderId={order._id}
              status={order.status}
              request={updateUserOrderStatus}
              lockToFlow={false}
            />
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
              {cart.map((item, index) => {
                // A line names the product under whichever key it arrived with,
                // the same three keys the server matches a review against. A
                // line with none of them cannot be reviewed, so no button.
                const productId = item._id ?? item.productId ?? item.id ?? null;

                return (
                <div
                  key={item._id || item.productId || index}
                  className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-gray-50 sm:px-6"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={getItemImage(item) || FALLBACK_IMAGE}
                      alt={item.name || "Product"}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
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

                  {/* Only on a delivered order, and only while the item has not
                      been reviewed. A reviewed line shows a settled label
                      instead of a button, so the same review cannot be sent
                      twice from this page. */}
                  {isDelivered && productId != null && (
                    <div className="w-full sm:w-auto">
                      {item.isReviewed ? (
                        <p className="flex items-center justify-end gap-1.5 text-xs font-semibold text-green-600">
                          <AiOutlineCheckCircle size={14} />
                          Reviewed
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReviewingItem({ productId, name: item.name })}
                          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#e94560] px-3 py-2 text-xs font-semibold text-[#e94560] transition-colors hover:bg-[#fce1e6] sm:w-auto"
                        >
                          <AiOutlineStar size={14} />
                          Write a review
                        </button>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shipping Address */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <AiOutlineEnvironment size={18} className="text-red-500" />
            Shipping Address
          </h3>

          <div className="mt-4 space-y-1 text-sm text-gray-700">
            <p>
              {shippingAddress.address1 || shippingAddress.address || "—"}
              {shippingAddress.address2 ? `, ${shippingAddress.address2}` : ""}
            </p>

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

        {/* Payment */}
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
              <span className="text-gray-500">Payment status</span>

              <span className="text-gray-700">{paymentInfo.status || "—"}</span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">
              Total paid
            </span>

            <span className="text-2xl font-bold text-gray-900">
              US$ {Number(order.totalPrice || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {reviewingItem && (
        <ReviewFormModal
          productId={reviewingItem.productId}
          productName={reviewingItem.name}
          orderId={order._id}
          onClose={() => setReviewingItem(null)}
          onSubmit={handleSubmitReview}
          submitting={reviewSubmitting}
          error={reviewError}
        />
      )}
    </div>
  );
};

export default UserOrderDetails;
