import axios from "axios";
import { toast } from "react-toastify";
import { server } from "../../server";

const identityOf = (item) => String(item?._id || item?.id || "").trim();

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// A guest has no session to save to, so localStorage is the only cart they have.
const persist = (cart) => {
  try {
    localStorage.setItem("cartItems", JSON.stringify(cart || []));
  } catch {
    // Storage full or blocked. The server copy still holds the cart, so the next
    // syncCart recovers it; failing here would break the session for no reason.
  }
};

const itemsOf = (cart) => (Array.isArray(cart?.items) ? cart.items : []);

// Load the cart from the server and adopt it.
//
// Items collected while signed out only ever reached localStorage, so they are
// pushed once here. Anything the server already knows is skipped, so an item the
// buyer removed while signed out is not resurrected.
export const syncCart = () => async (dispatch, getState) => {
  const { user } = getState().user;

  if (!user?._id) return null;

  try {
    const { data } = await axios.get(`${server}/cart/get-cart/${user._id}`, {
      withCredentials: true,
    });

    let current = data?.cart;
    const knownIds = new Set(
      itemsOf(current)
        .map(identityOf)
        .filter(Boolean)
    );

    for (const item of getState().cart.cart) {
      const itemId = identityOf(item);

      if (!itemId || knownIds.has(itemId)) continue;

      // Every add answers with the full cart, so the last one is the freshest.
      const { data: added } = await axios.post(
        `${server}/cart/add-to-cart`,
        { userId: user._id, item },
        { withCredentials: true }
      );

      if (added?.cart) current = added.cart;
    }

    dispatch({ type: "setCart", payload: itemsOf(current) });
    persist(itemsOf(current));

    return itemsOf(current);
  } catch (error) {
    console.error(
      "Failed to load the cart from the server:",
      errorMessage(error, "unknown error")
    );
    return null;
  }
};

// add to cart
export const addTocart = (data) => async (dispatch, getState) => {
  const { user } = getState().user;

  if (!user?._id || !identityOf(data)) {
    dispatch({
      type: "addToCart",
      payload: data,
    });

    persist(getState().cart.cart);

    return data;
  }

  try {
    const { data: res } = await axios.post(
      `${server}/cart/add-to-cart`,
      { userId: user._id, item: data },
      { withCredentials: true }
    );

    dispatch({ type: "setCart", payload: itemsOf(res?.cart) });
    persist(itemsOf(res?.cart));
  } catch (error) {
    toast.error(errorMessage(error, "Could not add this item to your cart"));

    // The optimistic item is not in the stored cart, so re-read it instead of
    // leaving the buyer looking at something that was never saved.
    dispatch(syncCart());
  }

  return data;
};

// remove from cart
export const removeFromCart = (data) => async (dispatch, getState) => {
  const { user } = getState().user;
  const itemId = identityOf(data);

  if (!user?._id || !itemId) {
    dispatch({
      type: "removeFromCart",
      payload: itemId,
    });

    persist(getState().cart.cart);

    return data;
  }

  try {
    const { data: res } = await axios.delete(
      `${server}/cart/remove-from-cart/${user._id}/${itemId}`,
      { withCredentials: true }
    );

    dispatch({ type: "setCart", payload: itemsOf(res?.cart) });
    persist(itemsOf(res?.cart));
  } catch (error) {
    toast.error(
      errorMessage(error, "Could not remove this item from your cart")
    );

    dispatch(syncCart());
  }

  return data;
};

// clear cart
export const clearCart = () => async (dispatch, getState) => {
  const { user } = getState().user;

  if (!user?._id) {
    dispatch({ type: "clearCart" });
    persist([]);

    return [];
  }

  try {
    const { data: res } = await axios.delete(`${server}/cart/clear`, {
      withCredentials: true,
    });

    dispatch({ type: "setCart", payload: itemsOf(res?.cart) });
    persist(itemsOf(res?.cart));
  } catch (error) {
    toast.error(errorMessage(error, "Could not clear your cart"));
    dispatch(syncCart());
  }

  return getState().cart.cart;
};

// An order can be refused because part of the cart belongs to a shop that no
// longer exists. Those rows can never be bought, so they are taken out and the
// buyer is told what went, rather than being left with a checkout that fails on
// every attempt.
export const dropUnorderableItems = (unorderableItems) => async (dispatch) => {
  const items = Array.isArray(unorderableItems) ? unorderableItems : [];

  for (const item of items) {
    if (item?._id) {
      await dispatch(removeFromCart({ _id: item._id }));
    }
  }

  const names = items.map((i) => i?.name).filter(Boolean);

  if (names.length) {
    toast.error(
      `Removed from your cart because the shop no longer exists: ${names.join(", ")}`
    );
  }

  return items;
};
