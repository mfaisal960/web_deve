import { productData as localProducts } from "../static/data";

export const getProductId = (product) => product?._id || product?.id;

// The shop a product belongs to, as a comparable string. Mirrors `resolveShopId`
// in backend/routes/order.js so the same product always lands under the same
// group on both sides of the wire: a real product arrives as a Mongo `shopId`
// (or `shop._id`), a bundled demo one as a numeric `shop.id`.
//
// Returned as a string because the two sides disagree on type — a demo shop id
// is a number in the catalogue and a string once it has been through an order
// line — and `===` between a number and a string never matches.
export const getShopId = (product) => {
  const raw = product?.shopId ?? product?.shop?._id ?? product?.shop?.id;

  if (raw == null) return null;

  const value = raw?._id ?? raw;
  return String(value).trim() || null;
};

// The bundled demo catalogue ships a sold count so the home page is not a wall
// of zeros before anything has been ordered. That seeded number is a floor, not
// a total: once a product has real orders, the count from `/product/sold-counts`
// replaces it outright, so buying one unit shows 1 rather than seeded-plus-one.
//
// Idents are compared as strings because the two sides disagree on type: a
// demo product's `id` is a number in the catalogue and a string on the order
// line, and `===` between a number and a string never matches.
export const getSoldCount = (product, soldCounts) => {
  const sold = soldCounts?.[String(getProductId(product))];

  if (sold > 0) {
    return sold;
  }

  return product?.sold_out || 0;
};

// The Redux store only knows about products that came from the API. Home page
// sections and the product detail page merge the bundled demo catalogue in so
// those sections stay populated when the API is empty, offline, or still
// loading.
//
// `soldCounts` is applied here rather than in each card so every section that
// draws from the merged catalogue ranks and displays the same numbers, and so
// a card never has to know whether the product it was handed came from Mongo or
// from the bundled JSON.
export const mergeCatalog = (apiProducts, soldCounts) => {
  const remote = Array.isArray(apiProducts) ? apiProducts : [];
  const seen = new Set(remote.map(getProductId));

  const locals = localProducts.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });

  return [...remote, ...locals].map((item) => ({
    ...item,
    sold_out: getSoldCount(item, soldCounts),
  }));
};