import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ProductCard from "../ProductCard/ProductCard";
import { PAGE_SIZE } from "../../../../static/pagination";
import { mergeCatalog } from "../../../../utils/catalog";

const FeatureProduct = () => {
  const { allProducts } = useSelector((state) => state.products);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [listSize, setListSize] = useState(0);

  const products = useMemo(() => {
    const items = mergeCatalog(allProducts);

    // Newest shop inventory first. Demo items carry no createdAt, so they keep
    // their bundled order behind the products the shop actually created.
    return items.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [allProducts]);

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );

  const hasMore = products.length > visibleCount;

  // Reset the page size when the product list itself changes.
  if (listSize !== products.length) {
    setListSize(products.length);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="w-full bg-white py-10 md:py-14">
      <div className="w-[95%] md:w-[90%] lg:w-[85%] xl:w-[80%] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Featured Products
          </h2>
          <p className="text-sm text-gray-500">
            Check out our latest featured products
          </p>
        </div>

        {/* Grid container (same as BestDeals) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {visibleProducts.length > 0 ? (
            visibleProducts.map((item) => (
              <ProductCard key={item._id || item.id} data={item} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center">
              No products found.
            </p>
          )}
        </div>

        {products.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">
              Showing {visibleProducts.length} of {products.length} products
            </p>
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureProduct; 
