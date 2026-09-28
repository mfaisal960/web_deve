import axios from "axios";
import { server } from "../../server";

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
