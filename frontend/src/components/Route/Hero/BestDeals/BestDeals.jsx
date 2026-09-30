import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import ProductCard from "../ProductCard/ProductCard";
import { mergeCatalog } from "../../../../utils/catalog";

const DISPLAY_COUNT = 15;

const BestDeals = () => {
  const { allProducts } = useSelector((state) => state.products);

  const data = useMemo(() => {
    const catalog = mergeCatalog(allProducts);

    // Rank across the whole merged catalogue so real shop products and the
    // bundled demo items compete on the same measure. createdAt only breaks
    // ties, and local entries have none.
    return catalog
      .sort(
        (a, b) =>
          (b.sold_out || 0) - (a.sold_out || 0) ||
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      .slice(0, DISPLAY_COUNT);
  }, [allProducts]);

  return (
    <div className="w-full">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Best Deals
          </h1>
        </div>

        {/* Products */}
        <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-7">
          {data.map((item) => (
            <ProductCard data={item} key={item._id || item.id} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default BestDeals;
