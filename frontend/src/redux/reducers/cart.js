import { createReducer } from "@reduxjs/toolkit";

// localStorage is only the placeholder for a signed-out visitor. As soon as a
// session exists the array is replaced by the server's copy (see syncCart in
// redux/actions/cart.js): reading it from here alone is what let the browser
// show items MongoDB had never received, and every attempt to remove one of
// those came back as a 404 "Item not found in cart".
const readStoredCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem("cartItems") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const initialState = {
  cart: readStoredCart(),
};

// The authoritative copy handed back by the API. Every mutation adopts it, so
// the two can no longer drift apart.
export const cartReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("setCart", (state, action) => {
      state.cart = Array.isArray(action.payload) ? action.payload : [];
    })
    .addCase("addToCart", (state, action) => {
      const item = action.payload;
      // Compared as a string because the bundled demo catalogue uses a numeric
      // id while Mongo ids are strings, and a strict `===` then never matches
      // an item that is already in the cart.
      const itemId = String(item?._id || item?.id || "");
      const isItemExist = state.cart.find(
        (i) => String(i._id || i.id || "") === itemId
      );

      if (isItemExist) {
        return {
          ...state,
          cart: state.cart.map((i) =>
            String(i._id || i.id || "") === itemId ? item : i
          ),
        };
      }

      return {
        ...state,
        cart: [...state.cart, item],
      };
    })
    .addCase("removeFromCart", (state, action) => {
      const itemId = String(action.payload ?? "");

      // Nothing to match on, so removing would be a no-op anyway. Bail out
      // instead of filtering, which would drop every item lacking an id.
      if (!itemId) return state;

      return {
        ...state,
        cart: state.cart.filter((i) => String(i._id || i.id || "") !== itemId),
      };
    })
    .addCase("clearCart", (state) => ({ ...state, cart: [] }));
});
