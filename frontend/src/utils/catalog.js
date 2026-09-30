import { productData as localProducts } from "../static/data";

export const getProductId = (product) => product?._id || product?.id;

// The Redux store only knows about products that came from the API. Home page
// sections and the product detail page merge the bundled demo catalogue in so
// those sections stay populated when the API is empty, offline, or still
// loading.
export const mergeCatalog = (apiProducts) => {
  const remote = Array.isArray(apiProducts) ? apiProducts : [];
  const seen = new Set(remote.map(getProductId));

  const locals = localProducts.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });

  return [...remote, ...locals];
};
