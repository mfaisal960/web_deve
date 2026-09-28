
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoriesData } from "../../../static/data";

import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";

import {
  IoIosArrowDown,
  IoIosArrowForward,
} from "react-icons/io";

import {
  BiMenuAltLeft,
  BiX,
} from "react-icons/bi";

import { CgProfile } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";

import { useSelector } from "react-redux";

import DropDown from "./DropDown";
import Navbar from "./Navbar";

import Cart from "../../Cart/Cart";
import Wishlist from "../../Wishlist/Wishlist";


const Header = ({ activeHeading }) => {

  // ================= REDUX =================

  const { isAuthenticated, user } = useSelector(
    (state) => state.user
  );

  const isSeller = useSelector(
    (state) => state.seller?.isSeller ?? false
  );

  const { wishlist } = useSelector(
    (state) => state.wishlist
  );

  const { cart } = useSelector(
    (state) => state.cart
  );

  const { allProducts } = useSelector(
    (state) => state.products
  );


  // ================= STATES =================

  const [searchTerm, setSearchTerm] = useState("");
  const [searchData, setSearchData] = useState([]);
  const [active, setActive] = useState(false);

  const [dropDown, setDropDown] = useState(false);

  const [openCart, setOpenCart] = useState(false);
  const [openWishlist, setOpenWishlist] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);


  // ================= SCROLL =================

  useEffect(() => {

    const handleScroll = () => {
      setActive(window.scrollY > 70);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };

  }, []);


  // ================= SEARCH =================

  const handleSearchChange = (e) => {

    const term = e.target.value;

    setSearchTerm(term);

    if (!term.trim()) {
      setSearchData([]);
      return;
    }

    const filteredProducts =
      allProducts?.filter((product) =>
        product.name
          ?.toLowerCase()
          .includes(term.toLowerCase())
      ) || [];

    setSearchData(filteredProducts);

  };


  // ================= CLOSE MOBILE MENU =================

  const closeMobileMenu = () => {
    setMobileMenu(false);
    setDropDown(false);
  };


  // ================= PRODUCT URL =================

  const getProductUrl = (product) => {
    const productId = product?._id || product?.id;

    if (productId) {
      return `/product/${productId}`;
    }

    const name = product?.name?.replace(/\s+/g, "-");
    return `/product/${name || "product"}`;
  };


  return (
    <>
      {/* =====================================================
          DESKTOP TOP HEADER
      ====================================================== */}

      <div className="hidden md:block w-full bg-white border-b border-gray-100">

        <div className="max-w-7xl mx-auto px-5 lg:px-8">

          <div className="h-[90px] flex items-center justify-between gap-8">


            {/* ================= LOGO ================= */}

            <Link
              to="/"
              className="flex-shrink-0 group"
            >

              <img
                src="/logo.svg"
                alt="Shop Logo"
                className="
                  w-[150px]
                  h-auto
                  object-contain
                  transition-transform
                  duration-300
                  group-hover:scale-105
                "
              />

            </Link>


            {/* ================= SEARCH ================= */}

            <div className="relative flex-1 max-w-[650px]">

              <div className="
                relative
                flex
                items-center
                w-full
                h-[52px]
                bg-gray-50
                border
                border-gray-200
                rounded-2xl
                overflow-hidden
                transition-all
                duration-300
                focus-within:bg-white
                focus-within:border-indigo-500
                focus-within:ring-4
                focus-within:ring-indigo-100
              ">

                <AiOutlineSearch
                  className="
                    ml-4
                    text-gray-400
                    text-xl
                    flex-shrink-0
                  "
                />

                <input
                  type="text"
                  placeholder="Search products, brands and more..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="
                    w-full
                    h-full
                    px-4
                    bg-transparent
                    outline-none
                    text-sm
                    text-gray-700
                    placeholder:text-gray-400
                  "
                />

                <button
                  className="
                    mr-1.5
                    h-[42px]
                    px-5
                    rounded-xl
                    bg-indigo-600
                    text-white
                    flex
                    items-center
                    justify-center
                    hover:bg-indigo-700
                    active:scale-95
                    transition-all
                    duration-200
                  "
                >
                  <span className="hidden lg:block text-sm font-semibold">
                    Search
                  </span>

                  <AiOutlineSearch className="lg:hidden text-xl" />
                </button>

              </div>


              {/* ================= SEARCH RESULTS ================= */}

              {searchTerm && searchData.length > 0 && (

                <div className="
                  absolute
                  top-[62px]
                  left-0
                  w-full
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  shadow-2xl
                  overflow-hidden
                  z-[100]
                  max-h-[380px]
                  overflow-y-auto
                ">

                  <div className="
                    px-4
                    py-3
                    border-b
                    border-gray-100
                    bg-gray-50
                  ">

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Search Results
                    </p>

                  </div>


                  {searchData.map((product) => (

                    <Link
                      key={product._id}
                      to={getProductUrl(product)}
                      onClick={() => {
                        setSearchTerm("");
                        setSearchData([]);
                      }}
                    >

                      <div className="
                        flex
                        items-center
                        gap-4
                        px-4
                        py-3
                        hover:bg-indigo-50
                        transition-colors
                        duration-200
                        border-b
                        border-gray-50
                      ">

                        <div className="
                          w-12
                          h-12
                          flex-shrink-0
                          rounded-xl
                          bg-gray-100
                          overflow-hidden
                        ">

                          <img
                            src={
                              product.images?.[0]?.url ||
                              product.image_Url?.[0]?.url
                            }
                            alt={product.name}
                            className="
                              w-full
                              h-full
                              object-cover
                            "
                          />

                        </div>


                        <div className="min-w-0 flex-1">

                          <h4 className="
                            text-sm
                            font-semibold
                            text-gray-800
                            truncate
                          ">
                            {product.name}
                          </h4>

                          <p className="
                            mt-1
                            text-xs
                            text-gray-400
                          ">
                            View product
                          </p>

                        </div>


                        <IoIosArrowForward
                          className="
                            text-gray-400
                            flex-shrink-0
                          "
                        />

                      </div>

                    </Link>

                  ))}

                </div>

              )}

            </div>


            {/* ================= SELLER BUTTON ================= */}

            <Link
              to={
                isSeller
                  ? "/dashboard"
                  : "/shop-create"
              }
              className="
                flex-shrink-0
                inline-flex
                items-center
                gap-2
                px-5
                py-3
                rounded-xl
                bg-indigo-600
                text-white
                text-sm
                font-semibold
                shadow-lg
                shadow-indigo-100
                hover:bg-indigo-700
                hover:-translate-y-0.5
                hover:shadow-xl
                transition-all
                duration-300
              "
            >

              {isSeller
                ? "Go Dashboard"
                : "Become Seller"}

              <IoIosArrowForward />

            </Link>

          </div>

        </div>

      </div>


      {/* =====================================================
          DESKTOP NAVBAR
      ====================================================== */}

      <div
        className={`
          hidden
          md:block
          w-full
          bg-[#111827]
          transition-all
          duration-300
          ${
            active
              ? "fixed top-0 left-0 z-[50] shadow-2xl"
              : "relative"
          }
        `}
      >

        <div className="max-w-7xl mx-auto px-5 lg:px-8">

          <div className="
            h-[70px]
            flex
            items-center
            justify-between
            gap-6
          ">


            {/* ================= CATEGORIES ================= */}

            <div className="relative">

              <button
                onClick={() => setDropDown(!dropDown)}
                className="
                  relative
                  w-[245px]
                  h-[48px]
                  flex
                  items-center
                  justify-between
                  px-4
                  rounded-xl
                  bg-white
                  text-gray-800
                  shadow-lg
                  hover:shadow-xl
                  transition-all
                  duration-300
                "
              >

                <div className="flex items-center gap-3">

                  <div className="
                    w-9
                    h-9
                    rounded-lg
                    bg-indigo-50
                    flex
                    items-center
                    justify-center
                  ">

                    <BiMenuAltLeft
                      className="text-xl text-indigo-600"
                    />

                  </div>

                  <span className="text-sm font-semibold">
                    All Categories
                  </span>

                </div>


                <IoIosArrowDown
                  className={`
                    text-gray-500
                    transition-transform
                    duration-300
                    ${
                      dropDown
                        ? "rotate-180"
                        : ""
                    }
                  `}
                />

              </button>


              {dropDown && (

                <div className="
                  absolute
                  top-[56px]
                  left-0
                  w-[245px]
                  bg-white
                  rounded-xl
                  shadow-2xl
                  border
                  border-gray-100
                  overflow-hidden
                  z-[100]
                ">

                  <DropDown
                    categoriesData={categoriesData}
                    setDropDown={setDropDown}
                  />

                </div>

              )}

            </div>


            {/* ================= NAVIGATION ================= */}

            <div className="
              flex-1
              flex
              justify-center
            ">

              <Navbar active={activeHeading} />

            </div>


            {/* ================= ACTION ICONS ================= */}

            <div className="
              flex
              items-center
              gap-2
            ">


              {/* WISHLIST */}

              <button
                onClick={() => setOpenWishlist(true)}
                className="
                  relative
                  w-11
                  h-11
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  text-white
                  bg-white/10
                  hover:bg-white/20
                  hover:-translate-y-0.5
                  transition-all
                  duration-300
                "
              >

                <AiOutlineHeart className="text-xl" />

                <span className="
                  absolute
                  -top-1
                  -right-1
                  min-w-[19px]
                  h-[19px]
                  px-1
                  rounded-full
                  bg-rose-500
                  text-white
                  text-[10px]
                  font-bold
                  flex
                  items-center
                  justify-center
                  border-2
                  border-[#111827]
                ">
                  {wishlist&&wishlist.length}
                </span>

              </button>


              {/* CART */}

              <button
                onClick={() => setOpenCart(true)}
                className="
                  relative
                  w-11
                  h-11
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  text-white
                  bg-white/10
                  hover:bg-white/20
                  hover:-translate-y-0.5
                  transition-all
                  duration-300
                "
              >

                <AiOutlineShoppingCart className="text-xl" />

                <span className="
                  absolute
                  -top-1
                  -right-1
                  min-w-[19px]
                  h-[19px]
                  px-1
                  rounded-full
                  bg-rose-500
                  text-white
                  text-[10px]
                  font-bold
                  flex
                  items-center
                  justify-center
                  border-2
                  border-[#111827]
                ">
                  {cart?.length || 0}
                </span>

              </button>


              {/* PROFILE */}

              <Link
                to={
                  isAuthenticated
                    ? "/profile"
                    : "/login"
                }
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-white/10
                  hover:bg-white/20
                  flex
                  items-center
                  justify-center
                  overflow-hidden
                  transition-all
                  duration-300
                "
              >

                {isAuthenticated &&
                user?.avatar?.url ? (

                  <img
                    src={user.avatar.url}
                    alt="Profile"
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                  />

                ) : (

                  <CgProfile
                    className="
                      text-white
                      text-2xl
                    "
                  />

                )}

              </Link>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <div
        className={`
          md:hidden
          w-full
          bg-white
          border-b
          border-gray-100
          ${
            active
              ? "fixed top-0 left-0 z-[50] shadow-xl"
              : "relative"
          }
        `}
      >

        <div className="
          h-[68px]
          px-4
          flex
          items-center
          justify-between
        ">


          {/* MENU BUTTON */}

          <button
            onClick={() => setMobileMenu(true)}
            className="
              w-10
              h-10
              rounded-xl
              bg-gray-100
              text-gray-700
              flex
              items-center
              justify-center
              hover:bg-indigo-50
              hover:text-indigo-600
              transition
            "
          >

            <BiMenuAltLeft className="text-2xl" />

          </button>


          {/* LOGO */}

          <Link to="/" className="flex items-center">

            <img
              src="/logo.svg"
              alt="Shop Logo"
              className="
                w-[125px]
                h-auto
                object-contain
              "
            />

          </Link>


          {/* RIGHT ACTIONS */}

          <div className="flex items-center gap-2">


            {/* WISHLIST */}

            <button
              onClick={() => setOpenWishlist(true)}
              className="
                relative
                w-10
                h-10
                rounded-xl
                bg-gray-100
                flex
                items-center
                justify-center
                text-gray-700
                hover:bg-indigo-50
                hover:text-indigo-600
                transition
              "
            >

              <AiOutlineHeart className="text-xl" />

              <span className="
                absolute
                -top-1
                -right-1
                min-w-[17px]
                h-[17px]
                rounded-full
                bg-rose-500
                text-white
                text-[9px]
                font-bold
                flex
                items-center
                justify-center
              ">
                {wishlist?.length || 0}
              </span>

            </button>


            {/* CART */}

            <button
              onClick={() => setOpenCart(true)}
              className="
                relative
                w-10
                h-10
                rounded-xl
                bg-gray-100
                flex
                items-center
                justify-center
                text-gray-700
                hover:bg-indigo-50
                hover:text-indigo-600
                transition
              "
            >

              <AiOutlineShoppingCart className="text-xl" />

              <span className="
                absolute
                -top-1
                -right-1
                min-w-[17px]
                h-[17px]
                rounded-full
                bg-rose-500
                text-white
                text-[9px]
                font-bold
                flex
                items-center
                justify-center
              ">
                {cart?.length || 0}
              </span>

            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          MOBILE SIDEBAR
      ====================================================== */}

      {mobileMenu && (

        <div className="
          md:hidden
          fixed
          inset-0
          z-[100]
          bg-black/50
          backdrop-blur-sm
        ">


          {/* SIDEBAR */}

          <div className="
            absolute
            top-0
            left-0
            w-[85%]
            max-w-[350px]
            h-full
            bg-white
            shadow-2xl
            overflow-y-auto
          ">


            {/* SIDEBAR HEADER */}

            <div className="
              h-[75px]
              px-5
              flex
              items-center
              justify-between
              border-b
              border-gray-100
            ">

              <Link
                to="/"
                onClick={closeMobileMenu}
              >

                <img
                  src="/logo.svg"
                  alt="Shop Logo"
                  className="w-[125px]"
                />

              </Link>


              <button
                onClick={closeMobileMenu}
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-gray-100
                  flex
                  items-center
                  justify-center
                  hover:bg-rose-50
                  hover:text-rose-500
                  transition
                "
              >

                <BiX className="text-2xl" />

              </button>

            </div>


            {/* MOBILE SEARCH */}

            <div className="p-5">

              <div className="
                relative
                flex
                items-center
                h-12
                bg-gray-50
                border
                border-gray-200
                rounded-xl
                overflow-hidden
                focus-within:bg-white
                focus-within:border-indigo-500
                transition
              ">

                <AiOutlineSearch
                  className="
                    ml-3
                    text-gray-400
                    text-xl
                  "
                />

                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="
                    w-full
                    h-full
                    px-3
                    text-sm
                    outline-none
                    bg-transparent
                  "
                />

              </div>


              {/* MOBILE SEARCH RESULTS */}

              {searchTerm &&
              searchData.length > 0 && (

                <div className="
                  mt-2
                  rounded-xl
                  border
                  border-gray-100
                  bg-white
                  shadow-xl
                  overflow-hidden
                ">

                  {searchData.map((product) => (

                    <Link
                      key={product._id}
                      to={getProductUrl(product)}
                      onClick={closeMobileMenu}
                    >

                      <div className="
                        flex
                        items-center
                        gap-3
                        p-3
                        border-b
                        border-gray-100
                        hover:bg-indigo-50
                      ">

                        <img
                          src={
                            product.images?.[0]?.url ||
                            product.image_Url?.[0]?.url
                          }
                          alt={product.name}
                          className="
                            w-11
                            h-11
                            rounded-lg
                            object-cover
                          "
                        />

                        <p className="
                          text-sm
                          font-medium
                          text-gray-700
                          truncate
                        ">
                          {product.name}
                        </p>

                      </div>

                    </Link>

                  ))}

                </div>

              )}

            </div>


            {/* MOBILE NAVIGATION */}

            <div className="px-5">

              <div className="
                rounded-2xl
                border
                border-gray-100
                overflow-hidden
              ">

                <Navbar
                  active={activeHeading}
                />

              </div>


              {/* CATEGORIES */}

              <div className="mt-5">

                <button
                  onClick={() =>
                    setDropDown(!dropDown)
                  }
                  className="
                    w-full
                    h-12
                    px-4
                    rounded-xl
                    bg-gray-50
                    flex
                    items-center
                    justify-between
                    text-gray-700
                    font-semibold
                    text-sm
                    hover:bg-indigo-50
                    hover:text-indigo-600
                    transition
                  "
                >

                  <div className="flex items-center gap-2">

                    <BiMenuAltLeft className="text-xl" />

                    All Categories

                  </div>


                  <IoIosArrowDown
                    className={`
                      transition-transform
                      ${
                        dropDown
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />

                </button>


                {dropDown && (

                  <div className="
                    mt-2
                    rounded-xl
                    border
                    border-gray-100
                    overflow-hidden
                  ">

                    <DropDown
                      categoriesData={categoriesData}
                      setDropDown={setDropDown}
                    />

                  </div>

                )}

              </div>


              {/* SELLER */}

              <Link
                to={
                  isSeller
                    ? "/dashboard"
                    : "/shop-create"
                }
                onClick={closeMobileMenu}
                className="
                  mt-5
                  w-full
                  h-12
                  rounded-xl
                  bg-indigo-600
                  text-white
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  font-semibold
                  hover:bg-indigo-700
                  transition
                "
              >

                {isSeller
                  ? "Go Dashboard"
                  : "Become Seller"}

                <IoIosArrowForward />

              </Link>


              {/* PROFILE */}

              <div className="
                mt-8
                pt-6
                border-t
                border-gray-100
                flex
                justify-center
              ">

                {isAuthenticated ? (

                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="
                      flex
                      flex-col
                      items-center
                      gap-2
                    "
                  >

                    <img
                      src={user?.avatar?.url}
                      alt="Profile"
                      className="
                        w-16
                        h-16
                        rounded-full
                        object-cover
                        border-4
                        border-indigo-100
                      "
                    />

                    <span className="
                      text-sm
                      font-semibold
                      text-gray-700
                    ">
                      My Profile
                    </span>

                  </Link>

                ) : (

                  <div className="
                    flex
                    items-center
                    gap-3
                  ">

                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="
                        px-5
                        py-2.5
                        rounded-xl
                        bg-gray-100
                        text-sm
                        font-semibold
                        text-gray-700
                        hover:bg-indigo-50
                        hover:text-indigo-600
                        transition
                      "
                    >
                      Login
                    </Link>


                    <Link
                      to="/sign-up"
                      onClick={closeMobileMenu}
                      className="
                        px-5
                        py-2.5
                        rounded-xl
                        bg-indigo-600
                        text-white
                        text-sm
                        font-semibold
                        hover:bg-indigo-700
                        transition
                      "
                    >
                      Sign Up
                    </Link>

                  </div>

                )}

              </div>

            </div>

          </div>


          {/* CLOSE BY CLICKING OVERLAY */}

          <button
            onClick={closeMobileMenu}
            className="
              absolute
              inset-0
              -z-10
              cursor-default
            "
            aria-label="Close menu"
          />

        </div>

      )}


      {/* =====================================================
          CART
      ====================================================== */}

      {openCart && (
        <Cart
          setOpenCart={setOpenCart}
        />
      )}


      {/* =====================================================
          WISHLIST
      ====================================================== */}

      {openWishlist && (
        <Wishlist
          setOpenWishlist={setOpenWishlist}
        />
      )}

    </>
  );
};


export default Header;