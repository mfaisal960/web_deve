import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { updateOrderStatus } from "../../redux/actions/order";
import {
  ORDER_STATUSES,
  REFUND_STATUSES,
  isRefundStatus,
} from "../../utils/orderItems";


// `request` is the thunk that performs the move, so the same control serves the
// seller panel and the buyer's own order page, which are different endpoints.
// `lockToFlow` keeps the seller rule that a stage can only be a later one, so a
// shipped order cannot be walked backwards; the buyer page passes false and is
// offered the whole flow.
const OrderStatusButton = ({
  orderId,
  status: savedStatus,
  request = updateOrderStatus,
  lockToFlow = true,
}) => {
  const dispatch = useDispatch();

  const [selected, setSelected] = useState(savedStatus || ORDER_STATUSES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [seededFor, setSeededFor] = useState(savedStatus);

  if (seededFor !== savedStatus) {
    setSeededFor(savedStatus);
    setSelected(savedStatus || ORDER_STATUSES[0]);
    setError(null);
  }

  const isRefund = isRefundStatus(savedStatus);

  const flow = isRefund ? REFUND_STATUSES : ORDER_STATUSES;

  // Only the stages from the current one forward are offered, so an order cannot
  // be walked backwards from here. A status outside the known flow falls back to
  // the whole list rather than slicing from -1.
  const currentIndex = flow.indexOf(savedStatus);

  const options =
    !lockToFlow || currentIndex === -1 ? flow : flow.slice(currentIndex);

  // Delivered is the end of the flow: there is no stage after it to offer, so the
  // control is replaced by the outcome rather than left as a one option dropdown
  // with a button that can never be pressed.
  if (savedStatus === "Delivered" && lockToFlow) {
    return (
      <div className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-green-100 bg-green-50 px-3 text-xs font-semibold text-green-600">
        <AiOutlineCheckCircle size={14} />
        Delivered
      </div>
    );
  }

  const canSave = Boolean(orderId) && selected !== savedStatus && !saving;

  const handleUpdateStatus = async () => {
    if (!orderId || saving) return;

    setSaving(true);
    setError(null);

    const result = await dispatch(request(orderId, selected));

    setSaving(false);

    if (result?.ok) {
      toast.success(`Order moved to "${selected}"`);
      return;
    }

    // Nothing was stored, so the select goes back to the status the server still
    // holds rather than showing a stage the order is not on.
    setSelected(savedStatus || ORDER_STATUSES[0]);
    setError(result?.error || "Failed to update the order status");
  };

  return (
    <div className="flex w-full flex-col justify-center">
      <div className="flex w-full items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={saving || !orderId}
          aria-label="Order status"
          className="h-9 w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none transition-colors focus:border-[#e94560] focus:ring-2 focus:ring-[#e94560]/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          {options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!canSave}
          onClick={handleUpdateStatus}
          className={`h-9 flex-shrink-0 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition-colors duration-200 ${
            canSave
              ? "cursor-pointer bg-[#fce1e6] text-[#e94560] hover:bg-[#f8d1d9]"
              : "cursor-not-allowed bg-gray-100 text-gray-400"
          }`}
        >
          {saving ? "Updating..." : "Update Status"}
        </button>
      </div>

      {error && (
        <p className="mt-1 truncate text-[11px] text-red-600" title={error}>
          {error}
        </p>
      )}
    </div>
  );
};

export default OrderStatusButton;
