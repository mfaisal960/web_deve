import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { AiOutlineCheckCircle } from "react-icons/ai";

import { updateOrderStatus } from "../../redux/actions/order";

import {
  FALLBACK_IMAGE,
  ORDER_STATUSES,
  REFUND_STATUSES,
  getItemImage,
  getItemQty,
  isPaymentPaid,
  isPaymentRefunded,
  isRefundStatus,
} from "../../utils/orderItems";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_STATUS = ORDER_STATUSES[0];

const PAYMENT_TONES = {
  unpaid: "bg-gray-100 text-gray-500",
  paid: "bg-green-50 text-green-600",
  refunded: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-600",
};

/* =========================================================
   HELPERS
========================================================= */

const getPaymentTone = (paymentStatus) => {
  if (!paymentStatus) {
    return PAYMENT_TONES.unpaid;
  }

  if (isPaymentRefunded(paymentStatus)) {
    return PAYMENT_TONES.refunded;
  }

  if (isPaymentPaid(paymentStatus)) {
    return PAYMENT_TONES.paid;
  }

  return PAYMENT_TONES.pending;
};

const getInitialStatus = (status) => {
  return status || DEFAULT_STATUS;
};

/* =========================================================
   ORDER ITEMS
========================================================= */

const OrderItemsCell = ({ cart = [] }) => {
  if (!cart.length) {
    return (
      <span className="text-xs font-medium text-gray-400">
        No items
      </span>
    );
  }

  const visibleItems = cart.slice(0, 3);
  const hiddenItemCount = cart.length - visibleItems.length;

  const firstItem = visibleItems[0];

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Product Images */}
      <div className="flex shrink-0 items-center -space-x-2">
        {visibleItems.map((item, index) => (
          <img
            key={item._id || item.productId || index}
            src={getItemImage(item) || FALLBACK_IMAGE}
            alt={item.name || "Product"}
            title={`${item.name || "Product"} × ${getItemQty(item)}`}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="
              h-10 w-10 rounded-lg border-2 border-white
              bg-gray-100 object-cover shadow-sm
            "
          />
        ))}
      </div>

      {/* Product Information */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-gray-800">
          {firstItem?.name || "Product"}

          {visibleItems.length > 1 && (
            <span className="ml-1 font-normal text-gray-500">
              + {cart.length - 1} more
            </span>
          )}
        </p>

        <p className="mt-0.5 text-[11px] text-gray-500">
          {hiddenItemCount > 0
            ? `${cart.length} item${cart.length === 1 ? "" : "s"}`
            : `Qty ${getItemQty(firstItem)}`}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   PAYMENT INFORMATION
========================================================= */

const PaymentInformation = ({ paymentInfo = {} }) => {
  const paymentId = paymentInfo.id || "—";
  const paymentStatus = paymentInfo.status || "Not Paid";
  const paymentTone = getPaymentTone(paymentInfo.status);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div>
        <h4 className="text-base font-semibold text-gray-900">
          Payment
        </h4>

        <p className="mt-0.5 text-xs text-gray-500">
          Payment information for this order
        </p>
      </div>

      {/* Payment Details */}
      <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {/* Payment ID */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-xs font-medium text-gray-500">
            Payment ID
          </span>

          <span
            className="
              max-w-[65%] truncate font-mono text-xs text-gray-800
            "
            title={paymentId}
          >
            {paymentId}
          </span>
        </div>

        {/* Payment Status */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-xs font-medium text-gray-500">
            Payment Status
          </span>

          <span
            className={`
              rounded-full px-2.5 py-1
              text-xs font-semibold
              ${paymentTone}
            `}
          >
            {paymentStatus}
          </span>
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   ORDER ITEMS SECTION
========================================================= */

const OrderItemsSection = ({ cart = [] }) => {
  const itemCount = cart.length;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            Order Items
          </h4>

          <p className="mt-0.5 text-xs text-gray-500">
            Products included in this order
          </p>
        </div>

        <span
          className="
            rounded-full bg-gray-100
            px-2.5 py-1 text-xs font-medium text-gray-600
          "
        >
          {itemCount} {itemCount === 1 ? "Item" : "Items"}
        </span>
      </div>

      {/* Items */}
      <div
        className="
          mt-4 rounded-lg border border-gray-100
          bg-gray-50/50 px-3
        "
      >
        <OrderItemsCell cart={cart} />
      </div>
    </section>
  );
};

/* =========================================================
   STATUS SELECT
========================================================= */

const StatusSelect = ({
  value,
  options,
  disabled,
  onChange,
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-label="Order status"
      className="
        h-11 w-full rounded-lg border border-gray-300
        bg-white px-3 text-sm font-medium text-gray-700
        outline-none transition-all duration-200
        hover:border-gray-400
        focus:border-[#e94560]
        focus:ring-2 focus:ring-[#e94560]/10
        disabled:cursor-not-allowed
        disabled:bg-gray-100
        disabled:text-gray-400
        sm:w-[280px]
      "
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

/* =========================================================
   UPDATE BUTTON
========================================================= */

const UpdateStatusButton = ({
  saving,
  canSave,
  onClick,
}) => {
  return (
    <button
      type="button"
      disabled={!canSave}
      onClick={onClick}
      className={`
        mt-5 inline-flex h-11 w-full items-center
        justify-center rounded-lg px-6
        text-sm font-semibold
        transition-all duration-200
        sm:w-auto

        ${
          canSave
            ? `
              cursor-pointer
              bg-[#fce1e6]
              text-[#e94560]
              shadow-sm
              hover:bg-[#f8d1d9]
              hover:shadow-md
              active:scale-[0.99]
            `
            : `
              cursor-not-allowed
              bg-gray-100
              text-gray-400
            `
        }
      `}
    >
      {saving ? (
        <span className="flex items-center gap-2">
          <span
            className="
              h-4 w-4 animate-spin rounded-full
              border-2 border-gray-300
              border-t-[#e94560]
            "
            aria-hidden="true"
          />

          Updating...
        </span>
      ) : (
        "Update Status"
      )}
    </button>
  );
};

/* =========================================================
   ERROR MESSAGE
========================================================= */

const StatusError = ({ error }) => {
  if (!error) {
    return null;
  }

  return (
    <div
      className="
        mt-3 flex items-start gap-2
        rounded-lg border border-red-100
        bg-red-50 px-3 py-2.5
      "
      role="alert"
    >
      <div
        className="
          mt-0.5 h-1.5 w-1.5 shrink-0
          rounded-full bg-red-500
        "
        aria-hidden="true"
      />

      <p className="text-xs font-medium text-red-600">
        {error}
      </p>
    </div>
  );
};

/* =========================================================
   ORDER STATUS
========================================================= */

const OrderStatus = ({ data }) => {
  const dispatch = useDispatch();

  const [status, setStatus] = useState(
    getInitialStatus(data?.status)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------------------------------------------------
     RESET STATUS WHEN ORDER CHANGES
  --------------------------------------------------------- */

  useEffect(() => {
    setStatus(getInitialStatus(data?.status));
    setError(null);
  }, [data?._id, data?.status]);

  /* ---------------------------------------------------------
     DETERMINE STATUS FLOW
  --------------------------------------------------------- */

  const isRefund = isRefundStatus(data?.status);

  const statusFlow = useMemo(() => {
    return isRefund ? REFUND_STATUSES : ORDER_STATUSES;
  }, [isRefund]);

  /* ---------------------------------------------------------
     STATUS OPTIONS
  --------------------------------------------------------- */

  const statusOptions = useMemo(() => {
    const currentIndex = statusFlow.indexOf(data?.status);

    if (currentIndex === -1) {
      return statusFlow;
    }

    return statusFlow.slice(currentIndex);
  }, [data?.status, statusFlow]);

  /* ---------------------------------------------------------
     ORDER STATE
  --------------------------------------------------------- */

  const isDelivered = data?.status === "Delivered";

  /* ---------------------------------------------------------
     BUTTON STATE
  --------------------------------------------------------- */

  const canSave =
    Boolean(data?._id) &&
    Boolean(status) &&
    status !== data?.status &&
    !saving;

  /* ---------------------------------------------------------
     STATUS CHANGE
  --------------------------------------------------------- */

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setError(null);
  };

  /* ---------------------------------------------------------
     UPDATE ORDER STATUS
  --------------------------------------------------------- */

  const handleUpdateStatus = async () => {
    if (!data?._id || !status || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await dispatch(
        updateOrderStatus(data._id, status)
      );

      if (result?.ok) {
        toast.success(`Order moved to "${status}"`);
        return;
      }

      const errorMessage =
        result?.error ||
        "Failed to update the order status";

      setStatus(getInitialStatus(data?.status));
      setError(errorMessage);

      toast.error(errorMessage);
    } catch (err) {
      const errorMessage =
        err?.message ||
        "Something went wrong while updating the order";

      setStatus(getInitialStatus(data?.status));
      setError(errorMessage);

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */

  return (
    <div className="w-full space-y-4">
      {/* =====================================================
          ORDER ITEMS
      ===================================================== */}

      <OrderItemsSection cart={data?.cart || []} />

      {/* =====================================================
          PAYMENT
      ===================================================== */}

      <PaymentInformation
        paymentInfo={data?.paymentInfo || {}}
      />

      {/* =====================================================
          ORDER STATUS
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Header */}
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            Order Status
          </h4>

          <p className="mt-0.5 text-xs text-gray-500">
            Update the current status of this order.
          </p>
        </div>

        {/* Status Control */}
        <div className="mt-4">
          {isDelivered ? (
            <div
              className="
                flex h-11 w-full items-center justify-center
                gap-2 rounded-lg border border-green-100
                bg-green-50 px-6
                text-sm font-semibold text-green-600
                sm:w-[280px]
              "
            >
              <AiOutlineCheckCircle
                size={17}
                aria-hidden="true"
              />

              Delivered
            </div>
          ) : (
            <StatusSelect
              value={status}
              options={statusOptions}
              disabled={saving || !data?._id}
              onChange={handleStatusChange}
            />
          )}
        </div>

        {/* Error */}
        <StatusError error={error} />

        {/* Update Status Button */}
        {!isDelivered && (
          <UpdateStatusButton
            saving={saving}
            canSave={canSave}
            onClick={handleUpdateStatus}
          />
        )}
      </section>
    </div>
  );
};

/* =========================================================
   EXPORTS
========================================================= */

export {
  OrderItemsCell,
  OrderItemsSection,
  PaymentInformation,
  OrderStatus,
  StatusSelect,
  UpdateStatusButton,
};

export default OrderItemsCell;