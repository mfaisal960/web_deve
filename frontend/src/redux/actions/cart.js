import axios from "axios";
import { server } from "../../server";

// add to cart
export const addTocart = (data) => async (dispatch, getState) => {
  dispatch({
    type: "addToCart",
    payload: data,
  });

  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cart));

  const { user } = getState().user;
  if (user?._id) {
    try {
      await axios.post(
        `${server}/cart/add-to-cart`,
        { userId: user._id, item: data },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Failed to save cart to MongoDB:", error?.response?.data?.message || error.message);
    }
  }

  return data;
};

// remove from cart
export const removeFromCart = (data) => async (dispatch, getState) => {
  const itemId = data?._id || data?.id;

  dispatch({
    type: "removeFromCart",
    payload: itemId,
  });
  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cart));

  const { user } = getState().user;
  if (user?._id && itemId != null) {
    try {
      await axios.delete(
        `${server}/cart/remove-from-cart/${user._id}/${itemId}`,
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Failed to remove cart item from MongoDB:", error?.response?.data?.message || error.message);
    }
  }

  return data;
};