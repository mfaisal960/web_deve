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