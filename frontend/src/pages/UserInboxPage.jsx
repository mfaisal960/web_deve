import React from "react";
import Header from "../components/Login/Layout/Header";
import Footer from "../components/Login/Layout/Footer";
import UserInboxMessages from "../components/User/UserInboxMessages";

const UserInboxPage = () => {
  return (
    <div>
      <Header />

      <main className="w-full bg-gray-100 py-6 sm:py-8 lg:py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <UserInboxMessages />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserInboxPage;