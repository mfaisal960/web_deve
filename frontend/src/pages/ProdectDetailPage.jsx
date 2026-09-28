import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Footer from "../components/Login/Layout/Footer";
import Header from "../components/Login/Layout/Header";
import ProductDetails from "../components/Product/ProductDetail";
import SuggestedProduct from "../components/Product/SuggestedProduct";
import { useSelector } from "react-redux";

const ProductDetailsPage = () => {
  const { allProducts } = useSelector((state) => state.products);
  const { allEvents } = useSelector((state) => state.events);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEvent = searchParams.get("isEvent") === "true";
  const items = isEvent ? allEvents : allProducts;
  const data = items?.find((item) => String(item._id || item.id) === id);

  return (
    <div>
      <Header />
      {data ? (
        <>
          <ProductDetails data={data} />
          {!isEvent && <SuggestedProduct data={data} />}
        </>
      ) : (
        <div className="flex min-h-[50vh] items-center justify-center px-4 text-center text-slate-600">
          Product not found. Please return to the products page and try again.
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
