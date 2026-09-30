import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  orders: [],
  order: null,
  // The orders created by the checkout that just finished. The confirmation
  // screen reads these to list what was bought; without them it had nothing to
  // show, because the buyer is navigated straight to it after paying.
  lastOrders: [],
  error: null,
};

export const orderReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("OrderRequest", (state) => {
      state.loading = true;
    })
    .addCase("OrderSuccess", (state, action) => {
      state.loading = false;
      state.orders = action.payload;
      state.error = null;
    })
    .addCase("OrderFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.orders = [];
    })
    .addCase("OrdersCreated", (state, action) => {
      state.loading = false;
      state.lastOrders = Array.isArray(action.payload) ? action.payload : [];
    })
    .addCase("OrderDetailsSuccess", (state, action) => {
      state.loading = false;
      state.order = action.payload;
      state.error = null;
    })
    .addCase("OrderDetailsFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.order = null;
    })
    // The saved order comes back whole from the server, so the open order and
    // the row in the list are both patched from it. Without this the seller page
    // kept showing the stage they had just replaced until it was refetched.
    .addCase("OrderStatusUpdated", (state, action) => {
      const updated = action.payload?.order;

      if (!updated?._id) return;

      if (state.order?._id === updated._id) {
        state.order = updated;
      }

      const row = state.orders.find((order) => order._id === updated._id);

      if (row) {
        row.status = updated.status;
        row.deliveredAt = updated.deliveredAt;
      }

      const recent = state.lastOrders.find((order) => order._id === updated._id);

      if (recent) {
        recent.status = updated.status;
      }

      state.error = null;
    })
    // The reviewed order comes back whole from the server, so the line that was
    // just reviewed is marked here too. Without it the page kept offering the
    // review button for an item the buyer had already reviewed, and re-submitting
    // only overwrote the same review server side.
    .addCase("createNewReviewSuccess", (state, action) => {
      const updated = action.payload?.order;

      if (!updated?._id) return;

      if (state.order?._id === updated._id) {
        state.order = updated;
      }

      const row = state.orders.find((order) => order._id === updated._id);

      if (row) {
        row.cart = updated.cart;
      }

      const recent = state.lastOrders.find((order) => order._id === updated._id);

      if (recent) {
        recent.cart = updated.cart;
      }
    });
});
