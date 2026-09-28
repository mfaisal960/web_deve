import React from "react";
import { AiOutlineGift } from "react-icons/ai";
import { MdOutlineLocalOffer } from "react-icons/md";
import { FiPackage, FiShoppingBag } from "react-icons/fi";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BiMessageSquareDetail } from "react-icons/bi";

const DashboardHeader = () => {
  const seller = useSelector((state) => state.seller?.seller);
  const sellerAvatar = seller?.avatar?.url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(seller?.name || "Seller") + "&background=2563eb&color=fff";
  const sellerId = seller?._id || "dashboard";

  return (
    <div className="w-full min-h-[80px] bg-white shadow sticky top-0 left-0 z-30 flex items-center justify-between gap-3 px-4 py-2">
      <div className="flex items-center flex-shrink-0">
        <Link to="/dashboard">
          <img
            src="/logo.svg"
            alt="Shop logo"
            className="h-8 w-auto sm:h-10"
          />
        </Link>
      </div>

      <div className="flex items-center justify-end gap-3 sm:gap-4 flex-wrap">
        <Link to="/dashboard/cupouns" className="hidden md:flex items-center justify-center">
          <AiOutlineGift color="#555" size={28} className="cursor-pointer" />
        </Link>
        <Link to="/dashboard-events" className="hidden md:flex items-center justify-center">
          <MdOutlineLocalOffer color="#555" size={28} className="cursor-pointer" />
        </Link>
        <Link to="/dashboard-products" className="hidden md:flex items-center justify-center">
          <FiShoppingBag color="#555" size={28} className="cursor-pointer" />
        </Link>
        <Link to="/dashboard-orders" className="hidden md:flex items-center justify-center">
          <FiPackage color="#555" size={28} className="cursor-pointer" />
        </Link>
        <Link to="/dashboard-messages" className="hidden md:flex items-center justify-center">
          <BiMessageSquareDetail color="#555" size={28} className="cursor-pointer" />
        </Link>

        <Link to={`/shop/${sellerId}`} className="flex-shrink-0">
          <img
            src={sellerAvatar}
            alt={seller?.name || "Seller"}
            className="h-10 w-10 rounded-full object-cover border border-slate-200"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(seller?.name || "Seller") + "&background=2563eb&color=fff";
            }}
          />
        </Link>
      </div>
    </div>
  );
};

export default DashboardHeader;