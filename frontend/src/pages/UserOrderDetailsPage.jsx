import React from "react";
import Footer from "../components/Login/Layout/Footer";
import Header from "../components/Login/Layout/Header";
import UserOrderDetails from "../components/Profile/UserOrderDetails";

const UserOrderDetailsPage = () => {
  return (
    <div>
      <Header />

      <UserOrderDetails />

      <Footer />
    </div>
  );
};

export default UserOrderDetailsPage;
