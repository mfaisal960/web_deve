import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  // Kept separate from `isLoading` on purpose. `isLoading` drives the full-page
  // <Loader /> on the product detail page, so letting a background "products of
  // this shop" fetch flip it used to unmount the product detail component, whose
  // own effect then refetched on remount and looped until React gave up with
  // "Maximum update depth exceeded".
  shopProductsLoading: false,
  // A shop's stats are only meaningful together with the shop they describe, so
  // the object carries its own `shopId` rather than sitting loose in the slice
  // next to a separate id field that could fall out of step with it.
  sellerStats: null,
  sellerStatsLoading: false,
  sellerStatsError: null,
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

  // sold counts, keyed by product id
    .addCase("soldCountsSuccess", (state, action) => {
    state.soldCounts = action.payload;
    })
    // `isLoading` is left alone on purpose: the count is decoration on a card,
    // so failing to fetch it must not put up a full-page loader or replace the
    // cards with an error. The seeded numbers simply stay as they are.
    .addCase("soldCountsFailed", (state, action) => {
    state.soldCountsError = action.payload;
    })

  // reviews for the product currently open on the detail page
  //
  // `reviewsProductId` records which product the list belongs to. Without it a
  // page that navigates from one product straight to the next would render the
  // previous product's reviews for one frame, and the detail page compares the
  // two ids to decide whether what it is holding is usable.
    .addCase("productReviewsRequest", (state) => {
    state.productReviewsLoading = true;
    })
    .addCase("productReviewsSuccess", (state, action) => {
    state.productReviewsLoading = false;
    state.reviewsProductId = action.payload.productId;
    state.productReviews = action.payload.reviews;
    state.productReviewsTotal = action.payload.totalReviews;
    state.productAverageRating = action.payload.averageRating;
    state.productReviewsError = null;
    })
    // Leaves any previously loaded list alone rather than blanking it: the
    // detail page falls back to whatever the product itself carries, so a failed
    // fetch must not turn a page that had reviews into an empty one.
    .addCase("productReviewsFailed", (state, action) => {
    state.productReviewsLoading = false;
    state.productReviewsError = action.payload;
    })

  // A shop's review total, average and review list
  //
  // `shopId` is recorded inside the payload so the pages can tell whether what
  // they are holding belongs to the shop they are rendering. Without it, a page
  // that navigates from one shop straight to another would show the first shop's
  // totals until the second request came back, and a failed request would leave
  // the wrong shop's numbers on screen permanently.
    .addCase("sellerStatsRequest", (state) => {
    state.sellerStatsLoading = true;
    })
    .addCase("sellerStatsSuccess", (state, action) => {
    state.sellerStatsLoading = false;
    state.sellerStats = action.payload;
    state.sellerStatsError = null;
    })
    // Clears the held stats rather than keeping them: they belong to some other
    // shop, and a page checking `sellerStats.shopId` would discard them anyway,
    // so leaving them behind would only invite a future reader to use them
    // without that check.
    .addCase("sellerStatsFailed", (state, action) => {
    state.sellerStatsLoading = false;
    state.sellerStats = null;
    state.sellerStatsError = action.payload?.error || null;
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
    state.productReviewsError = null;
    state.sellerStatsError = null;
    });
});