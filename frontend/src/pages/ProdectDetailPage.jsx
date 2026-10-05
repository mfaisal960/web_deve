import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Footer from "../components/Login/Layout/Footer";
import Header from "../components/Login/Layout/Header";
import Loader from "../components/Login/Layout/Loader";
import ProductDetails from "../components/Product/ProductDetail";
import SuggestedProduct from "../components/Product/SuggestedProduct";
import { useSelector } from "react-redux";
import { mergeCatalog } from "../utils/catalog";

const ProductDetailsPage = () => {
  const { allProducts, soldCounts, isLoading: productsLoading } = useSelector(
    (state) => state.products
  );
  const { allEvents, loading: eventsLoading } = useSelector(
    (state) => state.events
  );
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEvent = searchParams.get("isEvent") === "true";
  const items = isEvent ? allEvents : mergeCatalog(allProducts, soldCounts);
  const data = items?.find((item) => String(item._id || item.id) === id);
  const isLoading = isEvent ? eventsLoading : productsLoading;

  // The product list is fetched on app mount, so the store is still empty on a
  // direct load or refresh. Without this guard the page reported "not found"
  // for products that were simply still on their way in.
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div>
      <Header />
      {data ? (
        <>
          <ProductDetails data={data} />
          {!isEvent && <SuggestedProduct data={data} />}
        </>
      ) : (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center text-slate-600">
          <p>Product not found. Please return to the products page and try again.</p>
          <Link
            to="/products"
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
