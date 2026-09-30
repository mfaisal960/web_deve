import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  // Kept separate from `isLoading` on purpose. `isLoading` drives the full-page
  // <Loader /> on the product detail page, so letting a background "products of
  // this shop" fetch flip it used to unmount the product detail component, whose
  // own effect then refetched on remount and looped until React gave up with
  // "Maximum update depth exceeded".
  shopProductsLoading: false,
};

export const productReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("productCreateRequest", (state) => {
    state.isLoading = true;
    })
    .addCase("productCreateSuccess", (state, action) => {
    state.isLoading = false;
    state.product = action.payload;
    state.success = true;
    })
    .addCase("productCreateFail", (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    state.success = false;
    })

  // get all products of shop
    .addCase("getAllProductsShopRequest", (state) => {
    state.shopProductsLoading = true;
    })
    .addCase("getAllProductsShopSuccess", (state, action) => {
    state.shopProductsLoading = false;
    state.products = action.payload;
    })
    .addCase("getAllProductsShopFailed", (state, action) => {
    state.shopProductsLoading = false;
    state.error = action.payload;
    })

  // delete product of a shop
    .addCase("deleteProductRequest", (state) => {
    state.isLoading = true;
    })
    .addCase("deleteProductSuccess", (state, action) => {
    state.isLoading = false;
    state.message = action.payload;
    })
    .addCase("deleteProductFailed", (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
    })

  // get all products
    .addCase("getAllProductsRequest", (state) => {
    state.isLoading = true;
    })
    .addCase("getAllProductsSuccess", (state, action) => {
    state.isLoading = false;
    state.allProducts = action.payload;
    })
    .addCase("getAllProductsFailed", (state, action) => {
    // Must clear isLoading: the detail page renders <Loader /> while it is
    // true, so a failed fetch would otherwise leave the page spinning forever.
    state.isLoading = false;
    state.error = action.payload;
    })

  // review a product
  // `reviewSubmitting` is its own flag rather than a reuse of `isLoading`: a
  // review is sent from the order page, and flipping `isLoading` there would
  // swap the product detail page for a full page spinner if one were open.
    .addCase("createNewReviewRequest", (state) => {
    state.reviewSubmitting = true;
    state.reviewError = null;
    })
    .addCase("createNewReviewSuccess", (state) => {
    state.reviewSubmitting = false;
    state.reviewError = null;
    })
    .addCase("createNewReviewFailed", (state, action) => {
    state.reviewSubmitting = false;
    state.reviewError = action.payload;
    })

    .addCase("clearErrors", (state) => {
    state.error = null;
    state.reviewError = null;
    });
});