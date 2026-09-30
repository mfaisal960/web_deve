import axios from "axios";
import { server } from "../../server";

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
export const createOrder = (order) => async () => {
  try {
    const { data } = await axios.post(`${server}/order/create-order`, order, {
      headers: { "Content-Type": "application/json" },
      // The API is on a different origin (localhost:8000), so the session cookie
      // has to be sent explicitly for authenticated endpoints.
      withCredentials: true,
    });

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

export const getAllOrdersOfShop = (shopId) => async (dispatch) => {
  dispatch({ type: "OrderRequest" });

  try {
    const { data } = await axios.get(
      `${server}/order/get-all-orders-of-shop/${shopId}`,
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "OrderSuccess",
      payload: data.orders || [],
    });
  } catch (error) {
    dispatch({
      type: "OrderFail",
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

    return { ok: true, order, error: null };
  } catch (error) {
    return {
      ok: false,
      order: null,
      error: errorMessage(error, "Failed to update the order status"),
    };
  }
};

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
