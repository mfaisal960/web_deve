import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import ProductCard from "../ProductCard/ProductCard";

const FeatureProduct = () => {
  const { allProducts } = useSelector((state) => state.products);

  const products = useMemo(() => {
    const items = allProducts || [];

    // Newest shop inventory first.
    return [...items]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [allProducts]);

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
          {products.length > 0 ? (
            products.map((item) => (
              <ProductCard key={item._id} data={item} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center">
              No products found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureProduct; 
