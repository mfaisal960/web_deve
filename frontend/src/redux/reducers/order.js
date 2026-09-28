import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  orders: [],
  order: null,
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
    .addCase("OrderDetailsSuccess", (state, action) => {
      state.loading = false;
      state.order = action.payload;
      state.error = null;
    })
    .addCase("OrderDetailsFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.order = null;
    });
});