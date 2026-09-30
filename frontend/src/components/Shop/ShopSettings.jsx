
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { server } from "../../server";
import { AiOutlineCamera } from "react-icons/ai";
import axios from "axios";
import { loadSeller } from "../../redux/actions/user";
import { toast } from "react-toastify";

const ShopSettings = () => {
  const { seller } = useSelector((state) => state.seller);

  // These are bound to inputs, so they must be strings from the first render.
  // `seller && seller.name` is undefined while the seller is still loading, which
  // turns the inputs uncontrolled and makes React warn once the seller arrives.
  const [avatar, setAvatar] = useState("");
  const [name, setName] = useState(seller?.name ?? "");
  const [description, setDescription] = useState(seller?.description ?? "");
  const [address, setAddress] = useState(seller?.address ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    seller?.phoneNumber != null ? String(seller.phoneNumber) : ""
  );
  const [zipCode, setZipcode] = useState(
    seller?.zipCode != null ? String(seller.zipCode) : ""
  );

  const dispatch = useDispatch();

  const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10";

  const handleImage = async (e) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatar(reader.result);

        axios
          .put(
            `${server}/shop/update-shop-avatar`,
            { avatar: reader.result },
            {
              withCredentials: true,
            }
          )
          .then(() => {
            dispatch(loadSeller());
            toast.success("Avatar updated successfully!");
          })
          .catch((error) => {
            toast.error(
              error?.response?.data?.message || "Unable to update the avatar!"
            );
          });
      }
    };

    reader.readAsDataURL(e.target.files[0]);
  };

  const updateHandler = async (e) => {
    e.preventDefault();

    await axios
      .put(
        `${server}/shop/update-seller-info`,
        {
          name,
          address,
          zipCode,
          phoneNumber,
          description,
        },
        { withCredentials: true }
      )
      .then(() => {
        toast.success("Shop info updated succesfully!");
        dispatch(loadSeller());
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Unable to update the shop info!"
        );
      });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        {/* Shop Avatar */}
        <div className="flex w-full justify-center">
          <div className="relative">
            <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg sm:h-44 sm:w-44">
              <img
                src={avatar || seller?.avatar?.url || ""}
                alt="Shop avatar"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute bottom-2 right-2">
              <input
                type="file"
                id="image"
                accept="image/*"
                className="hidden"
                onChange={handleImage}
              />

              <label
                htmlFor="image"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-[#f63b60] text-white shadow-md transition-all duration-200 hover:bg-[#e92f54] hover:shadow-lg"
                title="Change shop avatar"
              >
                <AiOutlineCamera size={20} />
              </label>
            </div>
          </div>
        </div>

        {/* Shop Information */}
        <form
          aria-required={true}
          className="mt-8 w-full max-w-2xl"
          onSubmit={updateHandler}
        >
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-semibold text-gray-900">
                Shop Settings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update your shop information and contact details.
              </p>
            </div>

            <div className="space-y-5">
              {/* Shop Name */}
              <div>
                <label
                  htmlFor="shop-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Shop Name
                </label>

                <input
                  id="shop-name"
                  type="text"
                  placeholder={seller?.name}
                  value={name || ""}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              {/* Shop Description */}
              <div>
                <label
                  htmlFor="shop-description"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Shop Description
                </label>

                <textarea
                  id="shop-description"
                  placeholder={
                    seller?.description ||
                    "Enter your shop description"
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Shop Address */}
              <div>
                <label
                  htmlFor="shop-address"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Shop Address
                </label>

                <input
                  id="shop-address"
                  type="text"
                  placeholder={seller?.address}
                  value={address || ""}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="shop-phone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Shop Phone Number
                </label>

                <input
                  id="shop-phone"
                  type="tel"
                  placeholder={seller?.phoneNumber}
                  value={phoneNumber || ""}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              {/* Zip Code */}
              <div>
                <label
                  htmlFor="shop-zip"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Shop Zip Code
                </label>

                <input
                  id="shop-zip"
                  type="text"
                  inputMode="numeric"
                  placeholder={seller?.zipCode}
                  value={zipCode || ""}
                  onChange={(e) => setZipcode(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-3 w-full rounded-lg bg-[#f63b60] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#e92f54] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#f63b60]/30 active:scale-[0.99]"
              >
                Update Shop
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopSettings;
