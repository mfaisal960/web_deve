import React from "react";
import Footer from "../components/Login/Layout/Footer";
import Header from "../components/Login/Layout/Header";

const OrderSuccessPage = () => {
  return (
    <div>
      <Header />
      <Success />
      <Footer />
    </div>
  );
};

const Success = () => {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">✓</div>
      <h5 className="text-center mb-14 text-[25px] text-[#000000a1]">
        Your order is successful 😍
      </h5>
      <p className="text-gray-600">Thank you for your purchase!</p>
      <br />
      <br />
    </div>
  );
};

export default OrderSuccessPage;