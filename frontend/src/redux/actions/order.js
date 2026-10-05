import axios from "axios";
import { server } from "../../server";
import { getSoldCounts } from "./product";

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// Files the order and returns the created orders. The payment page used to call
// the API inline and drop the response, so the ids of the orders it had just
// created were never known to the app: the confirmation screen had nothing to
// show and the order list stayed stale until the profile page happened to
// remount and refetch.
//
// Resolves rather than rejects on failure, because the caller still has to
// distinguish "the order was refused" from "part of the cart was unorderable"
// (reported through `unorderableItems`) to decide what to tell the buyer.
export const createOrder = (order) => async (dispatch) => {
  try {
    const { data } = await axios.post(`${server}/order/create-order`, order, {
      headers: { "Content-Type": "application/json" },
      // The API is on a different origin (localhost:8000), so the session cookie
      // has to be sent explicitly for authenticated endpoints.
      withCredentials: true,
    });

    // The "N sold" number is an aggregate over the orders, so the purchase that
    // just changed it is not reflected until they are read again. Refetched
    // here rather than left to the next page load, otherwise a buyer who goes
    // straight back to the shop sees the count they just moved not having moved.
    // Not awaited: the caller only needs the order result, and a failed refetch
    // should not turn a placed order into a reported failure.
    dispatch(getSoldCounts());

    return {
      ok: true,
      orders: Array.isArray(data?.orders) ? data.orders : [],
      unorderableItems: Array.isArray(data?.unorderableItems)
        ? data.unorderableItems
        : [],
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      orders: [],
      unorderableItems: Array.isArray(error?.response?.data?.unorderableItems)
        ? error.response.data.unorderableItems
        : [],
      error: errorMessage(error, "Failed to place the order"),
    };
  }
};

export const getAllOrdersOfUser = (userId) => async (dispatch) => {
  dispatch({ type: "OrderRequest" });

  try {
    const { data } = await axios.get(`${server}/order/get-all-orders/${userId}`, {
      withCredentials: true,
    });

    dispatch({
      type: "OrderSuccess",
      payload: data.orders || [],
    });
  } catch (error) {
    dispatch({
      type: "OrderFail",
      payload: error.response?.data?.message || "Failed to load orders",
    });
  }
};

// The seller dashboard's list. Writes `shopOrders` rather than `orders` so it
// cannot overwrite the buyer's list, or be overwritten by it, when both are read
// in the same session.
export const getAllOrdersOfShop = (shopId) => async (dispatch) => {
  dispatch({ type: "ShopOrdersRequest" });

  try {
    const { data } = await axios.get(
      `${server}/order/get-all-orders-of-shop/${shopId}`,
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "ShopOrdersSuccess",
      payload: data.orders || [],
    });
  } catch (error) {
    dispatch({
      type: "ShopOrdersFail",
      payload:
        error.response?.data?.message || "Failed to load shop orders",
    });
  }
};

export const getUserOrderById = (orderId) => async (dispatch) => {
  dispatch({ type: "OrderRequest" });

  try {
    const { data } = await axios.get(
      `${server}/order/get-user-order-by-id/${orderId}`,
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "OrderDetailsSuccess",
      payload: data.order,
    });
  } catch (error) {
    dispatch({
      type: "OrderDetailsFail",
      payload: error.response?.data?.message || "Failed to load the order",
    });
  }
};

export const getOrderById = (orderId) => async (dispatch) => {
  dispatch({ type: "OrderRequest" });

  try {
    const { data } = await axios.get(`${server}/order/get-order-by-id/${orderId}`, {
      withCredentials: true,
    });

    dispatch({
      type: "OrderDetailsSuccess",
      payload: data.order,
    });
  } catch (error) {
    dispatch({
      type: "OrderDetailsFail",
      payload: error.response?.data?.message || "Failed to load the order",
    });
  }
};

// Moves an order to its next stage. The list it can take is fixed by the order
// flow, so a stage is never invented here: the server validates it too, and a
// rejection is returned rather than thrown so the caller can put the select back
// on the status the server still holds instead of showing a change that never
// happened.
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    const { data } = await axios.put(
      `${server}/order/update-order-status/${orderId}`,
      { status },
      { withCredentials: true }
    );

    const order = data?.order || null;

    dispatch({
      type: "OrderStatusUpdated",
      payload: { order },
    });

    // "Refund Success" takes the units back out of the sold count, which is
    // read by aggregating the orders, so the aggregate has to be read again.
    // Only this status changes it: the rest of the flow is a stage the sale has
    // already passed through.
    if (status === "Refund Success") {
      dispatch(getSoldCounts());
    }

    return { ok: true, order, error: null };
  } catch (error) {
    return {
      ok: false,
      order: null,
      error: errorMessage(error, "Failed to update the order status"),
    };
  }
};

// The seller closing a refund out. It is `updateOrderStatus` under another name
// rather than a second endpoint: both sides of the refund are the same move, and
// the server restores the stock on the transition, so there is nothing extra for
// the caller to do beyond naming the stage it is approving.
export const approveRefund = (orderId) => (dispatch) =>
  dispatch(updateOrderStatus(orderId, "Refund Success"));

// The buyer's own copy of the same move, against the endpoint scoped on the
// session buyer. Separate from the seller action because they are separate
// endpoints: reaching for the seller one from a buyer page is a 401, not a
// slower success. Resolves rather than rejects for the same reason, so the
// select can go back to the status the server still holds.
export const updateUserOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    const { data } = await axios.put(
      `${server}/order/update-user-order-status/${orderId}`,
      { status },
      { withCredentials: true }
    );

    const order = data?.order || null;

    dispatch({
      type: "OrderStatusUpdated",
      payload: { order },
    });

    return { ok: true, order, error: null };
  } catch (error) {
    return {
      ok: false,
      order: null,
      error: errorMessage(error, "Failed to update the order status"),
    };
  }
};
