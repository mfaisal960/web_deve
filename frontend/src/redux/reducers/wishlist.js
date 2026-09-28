import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  wishlist: localStorage.getItem("wishlistItems")
    ? JSON.parse(localStorage.getItem("wishlistItems"))
    : [],
};

export const wishlistReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("addToWishlist", (state, action) => {
      const item = action.payload;
      const itemId = item?._id || item?.id;
      const isItemExist = state.wishlist.find(
        (i) => (i._id || i.id) === itemId
      );
      if (isItemExist) {
        return {
          ...state,
          wishlist: state.wishlist.map((i) =>
            (i._id || i.id) === itemId ? item : i
          ),
        };
      }

      return {
        ...state,
        wishlist: [...state.wishlist, item],
      };
    })
    .addCase("removeFromWishlist", (state, action) => ({
      ...state,
      wishlist: state.wishlist.filter(
        (i) => (i._id || i.id) !== action.payload
      ),
    }));
});