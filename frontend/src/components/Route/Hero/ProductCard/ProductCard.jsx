import React, { useState } from "react";
import { AiFillHeart, AiFillStar, AiOutlineEye, AiOutlineHeart, AiOutlineShoppingCart, AiOutlineStar } from "react-icons/ai";
import { Link } from "react-router-dom";
import ProductDetailCart from "../ProductDetailCart/ProductDetailCart";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "../../../../redux/actions/wishlist";
import { addTocart } from "../../../../redux/actions/cart";
import { toast } from "react-toastify";
import { getSoldCount } from "../../../../utils/catalog";
const ProductCard = ({ data, isEvent = false }) => {
  const [open, setOpen] = useState();
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { soldCounts } = useSelector((state) => state.products);
  const product = data || {};
  const productId = product?._id || product?.id;
  const isInWishlist = Boolean(
    productId &&
      wishlist?.some((i) => String(i._id || i.id) === String(productId))
  );

  const addToWishlistHandler = (data) => {
    dispatch(addToWishlist(data));
  };

  const removeFromWishlistHandler = (data) => {
    dispatch(removeFromWishlist(data));
  };

  const imageSrc =
    product.images?.[0]?.url ||
    product.image_Url?.[0]?.url ||
    product.image ||
    "https://dummyimage.com/150x150/cccccc/999999?text=Product";

  const currentPrice =
    product.discountPrice ?? product.discount_price ?? product.price ?? 0;
  const originalPrice = product.originalPrice ?? product.price ?? 0;

  const detailUrl = `/product/${productId}${isEvent ? "?isEvent=true" : ""}`;

  const handleAddToCart = () => {
    dispatch(addTocart({ ...product, qty: 1 }));
    toast.success("Item added to cart successfully!");
  };

  return (
    <div className="w-full min-h-[370px] bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 relative cursor-pointer border border-gray-100">
      {/* Product Image */}
      <Link to={detailUrl}>
        <div className="relative w-full h-[190px] bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden mb-4">
          <img
            src={imageSrc}
            alt={product.name || "product"}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.src = "https://dummyimage.com/150x150/cccccc/999999?text=No+Image";
            }}
          />
        </div>
      </Link>

      {/* Shop Name */}
      <Link to="/">
        <h5 className="text-sm text-gray-500 mb-2">
          {product.shop?.name || "No Shop Name"}
        </h5>
      </Link>

      {/* Product Name */}
      <Link to={detailUrl}>
        <h4 className="text-base font-medium text-gray-800 leading-6">
          {product.name?.length > 40
            ? product.name.slice(0, 40) + "..."
            : product.name || "Product Name"}
        </h4>
        <div className="flex mt-2">
          <AiFillStar className="mr-2 cursor-pointer" color="#F6BA00"/>
          <AiFillStar className="mr-2 cursor-pointer" color="#F6BA00"/>
          <AiFillStar className="mr-2 cursor-pointer" color="#F6BA00"/>
          <AiFillStar className="mr-2 cursor-pointer" color="#F6BA00"/>
          <AiOutlineStar className="mr-2 cursor-pointer" color="#F6BA00"/>
        </div>
        <div className="py-2 flex items-center justify-between">
            <div className="flex">
              <h5 className="text-lg font-bold text-black mr-2">
                {currentPrice}$
              </h5>
              <h4 className="text-sm text-red-600 line-through font-medium">
                {originalPrice > currentPrice ? originalPrice + " $" : null}
              </h4>
            </div>
            <span className="font-[400] text-[17px] text-[#68d284]">
              {getSoldCount(product, soldCounts)} sold
            </span>
        </div>
        </Link>
        <div className="">
          {isInWishlist?(
            <AiFillHeart className="cursor-pointer absolute right-2 top-5"
            size={22}
            onClick={()=>removeFromWishlistHandler(product)}
            color="red"
            title="Remove from wishlist"/>
          ):(
              <AiOutlineHeart className="cursor-pointer absolute right-2 top-5"
              size={22}
              onClick={()=>addToWishlistHandler(product)}
              color="#333"
              title="Add to wishlist"/>
          )}
          <AiOutlineEye className="cursor-pointer absolute right-2 top-14"
            size={22}
            onClick={()=>setOpen(!open)}
            color="#333"
            title="Quick view"/>
            <AiOutlineShoppingCart className="cursor-pointer absolute right-2 top-24"
            size={22}
            onClick={handleAddToCart}
            color="#444"
            title="Add to cart" />

            {
              open?(
                <ProductDetailCart setOpen={setOpen} data={product}/>
              ):null
            }
        </div>
    </div>
  );
};

export default ProductCard; 