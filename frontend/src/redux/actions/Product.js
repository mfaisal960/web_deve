import axios from "axios";
import { server } from "../../server";

// create product
export const createProduct =
  (
    name,
    description,
    category,
    tags,
    originalPrice,
    discountPrice,
    stock,
    shopId,
    images
  ) =>
  async (dispatch) => {
    try {
      dispatch({
        type: "productCreateRequest",
      });

      const { data } = await axios.post(
        `${server}/product/create-product`,
        {
          name,
          description,
          category,
          tags,
          originalPrice,
          discountPrice,
          stock,
          shopId,
          images,
        },
        { withCredentials: true }
      );
      dispatch({
        type: "productCreateSuccess",
        payload: data.product,
      });
      return true;
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not create product";
      dispatch({
        type: "productCreateFail",
        payload: message,
      });
      return false;
    }
  };

// get All Products of a shop
export const getAllProductsShop = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "getAllProductsShopRequest",
    });

    const { data } = await axios.get(
      `${server}/product/get-all-products-shop/${id}`
    );
    dispatch({
      type: "getAllProductsShopSuccess",
      payload: data.products,
    });
  } catch (error) {
    dispatch({
      type: "getAllProductsShopFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// delete product of a shop
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "deleteProductRequest",
    });

    const { data } = await axios.delete(
      `${server}/product/delete-shop-product/${id}`,
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "deleteProductSuccess",
      payload: data.message,
    });
    return true;
  } catch (error) {
    dispatch({
      type: "deleteProductFailed",
      payload: error.response?.data?.message || "Could not delete product",
    });
    return false;
  }
};

// get all products
export const getAllProducts = () => async (dispatch) => {
  try {
    dispatch({
      type: "getAllProductsRequest",
    });

    const { data } = await axios.get(`${server}/product/get-all-products`);
    dispatch({
      type: "getAllProductsSuccess",
      payload: data.products,
    });
  } catch (error) {
    dispatch({
      type: "getAllProductsFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// How many units of each product have actually been bought, keyed by product
// id. Sold as a single map rather than folded into the products themselves
// because the bundled demo catalogue is not in this store: it is merged in from
// static JSON at render time, so the counts are the only thing both halves of
// the catalogue can both be matched against.
export const getSoldCounts = () => async (dispatch) => {
  try {
    const { data } = await axios.get(`${server}/product/sold-counts`);
    dispatch({
      type: "soldCountsSuccess",
      payload: data.soldCounts,
    });
  } catch (error) {
    // Deliberately silent. The count is a decoration on a card, so a failure
    // here must leave the seeded numbers in place rather than blank the cards
    // or raise a toast over an unrelated page.
    dispatch({
      type: "soldCountsFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Reviews for a single product.
//
// This is the only way the detail page can see a review: the bundled demo
// catalogue carries no `reviews` array at all, and a review of one of those
// products is only ever written onto the order's cart line (the write to
// `product.reviews` is guarded by `mongoose.isValidObjectId`), so reading
// `product.reviews` in the store found nothing to render.
//
// The id is sent as given and compared server-side as a string, so the demo
// catalogue's numeric `id` and a real `_id` both resolve.
export const getProductReviews = (productId) => async (dispatch) => {
  try {
    dispatch({
      type: "productReviewsRequest",
    });

    const { data } = await axios.get(
      `${server}/product/reviews/${productId}`
    );

    dispatch({
      type: "productReviewsSuccess",
      payload: {
        productId: String(productId),
        reviews: data.reviews || [],
        totalReviews: data.totalReviews || 0,
        averageRating: data.averageRating || 0,
      },
    });
  } catch (error) {
    dispatch({
      type: "productReviewsFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// A whole shop's review total, average and review list.
//
// The seller panels on the product detail page and the shop profile used to
// total `product.reviews` over the products in the store, which is always empty:
// a review is only ever guaranteed to live on the order's cart line (the write to
// `product.reviews` is guarded by `mongoose.isValidObjectId`), and the bundled
// demo catalogue has no Product document at all. The count therefore stayed at 0
// while the reviews tab, which reads `/product/reviews/:productId`, showed the
// review. `/product/seller-stats/:shopId` is the shop-wide version of that same
// read, so both numbers now come from the records that actually hold reviews.
//
// The shop id is sent as given, so a real Mongo `_id` and a demo catalogue's
// numeric `shop.id` both resolve server-side.
export const getSellerStats = (shopId) => async (dispatch) => {
  try {
    dispatch({
      type: "sellerStatsRequest",
    });

    const { data } = await axios.get(
      `${server}/product/seller-stats/${shopId}`
    );

    dispatch({
      type: "sellerStatsSuccess",
      payload: {
        shopId: String(shopId),
        // `null` means "not knowable from the server" (a demo shop has no
        // Product documents), which is not the same as zero, so it is passed
        // through untouched for the page to count itself.
        totalProducts: data.totalProducts ?? null,
        totalReviews: data.totalReviews ?? 0,
        averageRating: data.averageRating ?? 0,
        reviews: data.reviews || [],
      },
    });
  } catch (error) {
    // Deliberately silent, like `getSoldCounts`: the stat is decoration next to a
    // product, so a failure must leave the page rendering rather than raise a
    // toast over it.
    dispatch({
      type: "sellerStatsFailed",
      payload: {
        shopId: String(shopId),
        error: error.response?.data?.message || error.message,
      },
    });
  }
};

// Reviews an item of a delivered order. The order id is part of the request
// because the server checks it against the session buyer and the delivered
// status, rather than trusting the page to have offered the button at all.
//
// Resolves rather than rejects, so the form can tell "the order was refused"
// apart from "the product could not be reviewed" and keep what the buyer typed
// either way.
export const createNewReview =
  (orderId, productId, rating, comment) => async (dispatch) => {
    try {
      dispatch({
        type: "createNewReviewRequest",
      });

      const { data } = await axios.put(
        `${server}/product/create-new-review`,
        { orderId, productId, rating, comment },
        { withCredentials: true }
      );

      dispatch({
        type: "createNewReviewSuccess",
        payload: { productId, order: data.order || null },
      });

      return { ok: true, order: data.order || null, error: null };
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not submit the review";

      dispatch({
        type: "createNewReviewFailed",
        payload: message,
      });

      return { ok: false, order: null, error: message };
    }
  };