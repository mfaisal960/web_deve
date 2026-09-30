import { resolveImageUrl } from "../server";

// An order stores a snapshot of each product as it was at the time of purchase,
// so these readers have to cope with the shapes the catalogue has used over time:
// `discountPrice` / `discount_price` / `price`, and `images` / `image_Url` /
// `image`. Uploaded images are root-relative unless Cloudinary is configured, so
// they are resolved against the backend origin before being handed to an <img>.
export const getItemPrice = (item) =>
  item?.discountPrice ?? item?.discount_price ?? item?.price ?? 0;

export const getItemQty = (item) => item?.qty ?? 1;

export const getItemImage = (item) =>
  resolveImageUrl(
    item?.images?.[0]?.url || item?.image_Url?.[0]?.url || item?.image
  );

export const FALLBACK_IMAGE =
  "https://dummyimage.com/150x150/cccccc/999999?text=No+Image";

// The order lifecycle, in the only order it can move through. A refund never
// rejoins these: it runs on its own two step flow, and the two flows share no
// stages, so the one a given order is on is decided by which list its current
// status appears in.
export const ORDER_STATUSES = [
  "Processing",
  "Transferred to delivery partner",
  "Shipping",
  "Received",
  "On the way",
  "Delivered",
];

export const REFUND_STATUSES = ["Processing refund", "Refund Success"];

export const isRefundStatus = (value) => REFUND_STATUSES.includes(value);

// `paymentInfo.status` is the gateway's own word for the payment, not one of the
// order stages above: PayPal files "succeeded" while Stripe files whatever
// `paymentIntent.status` says ("succeeded", "processing", "requires_action", ...).
// So it cannot be compared against the order flow, and a payment is only called
// paid when the gateway says the money actually settled.
const PAID_PAYMENT_STATUSES = new Set([
  "succeeded",
  "paid",
  "completed",
  "captured",
]);

export const isPaymentPaid = (value) =>
  PAID_PAYMENT_STATUSES.has(String(value ?? "").toLowerCase());

export const isPaymentRefunded = (value) =>
  /refund|revers|void|cancel/.test(String(value ?? "").toLowerCase());
