
import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Link } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { RxAvatar } from "react-icons/rx";

const ShopCreate = () => {
  // Every state that is bound to an input starts as a string. A useState()
  // without an argument starts as undefined, which makes the input uncontrolled
  // on the first render and controlled after the first keystroke, and React then
  // warns that an uncontrolled input is being turned into a controlled one. The
  // same applies to resetting the form: setPhoneNumber() would go back to
  // undefined, so "" is used everywhere.
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [activationUrl, setActivationUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await axios.post(
        `${server}/shop/create-shop`,
        {
          name,
          email,
          password,
          avatar,
          zipCode,
          address,
          phoneNumber,
        },
        { withCredentials: true }
      );

      setCreated(true);
      setActivationUrl(data?.activationUrl || "");

      // The backend reports a failed activation mail instead of throwing, so the
      // "check your inbox" toast would be a lie if the SMTP send did not work.
      if (data?.emailSent === false) {
        toast.error(
          data?.message ||
            "Shop created, but the activation email could not be sent. Use resend activation on the login page."
        );
      } else {
        toast.success(data?.message || "Shop created successfully. Check your email to activate it.");
      }

      setName("");
      setEmail("");
      setPassword("");
      setAvatar("");
      setZipCode("");
      setAddress("");
      setPhoneNumber("");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to create the shop. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col justify-center">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Register as a Seller
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Create your shop account and start selling your products.
          </p>
        </div>

        {/* Success panel: a filtered activation mail is the most common reason a
            seller ends up here with a shop that will not log in, so the link is
            offered here as well. */}
        {created && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <h3 className="text-sm font-semibold text-green-900">
              Shop created
            </h3>

            <p className="mt-2 text-sm text-green-800">
              We sent an activation email to the address you registered. Open the
              link in that email to activate your shop, then sign in. Check the
              spam folder if it has not arrived within a few minutes.
            </p>

            {activationUrl && (
              <a
                href={activationUrl}
                className="mt-4 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
              >
                Activate shop now (development only)
              </a>
            )}

            <p className="mt-4 text-sm text-green-800">
              Need a new link later? Use{" "}
              <span className="font-semibold">Resend activation email</span> on the
              shop login page.
            </p>

            <Link
              to="/shop-login"
              className="mt-4 inline-block text-sm font-semibold text-green-900 underline"
            >
              Go to shop login
            </Link>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Shop Name */}
            <div>
              <label
                htmlFor="shop-name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Shop Name
              </label>

              <input
                id="shop-name"
                type="text"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your shop name"
                className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone-number"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Phone Number
              </label>

              <input
                id="phone-number"
                type="number"
                name="phone-number"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10"
              />
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Address
              </label>

              <input
                id="address"
                type="text"
                name="address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your shop address"
                className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10"
              />
            </div>

            {/* Zip Code */}
            <div>
              <label
                htmlFor="zipcode"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Zip Code
              </label>

              <input
                id="zipcode"
                type="number"
                name="zipcode"
                required
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter your zip code"
                className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={visible ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-12 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#f63b60] focus:ring-2 focus:ring-[#f63b60]/10"
                />

                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors duration-200 hover:text-[#f63b60]"
                >
                  {visible ? (
                    <AiOutlineEye size={22} />
                  ) : (
                    <AiOutlineEyeInvisible size={22} />
                  )}
                </button>
              </div>
            </div>

            {/* Avatar */}
            <div>
              <label
                htmlFor="file-input"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Shop Avatar
              </label>

              <div className="flex items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <RxAvatar className="h-10 w-10 text-gray-400" />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="file-input"
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow"
                  >
                    Upload a file
                  </label>

                  <input
                    type="file"
                    name="avatar"
                    id="file-input"
                    onChange={handleFileInputChange}
                    className="sr-only"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Choose an image for your shop profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#f63b60] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#e92f54] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating shop..." : "Submit"}
              </button>
            </div>

            {/* Login Link */}
            <div className="flex w-full items-center justify-center border-t border-gray-100 pt-5 text-sm">
              <h4 className="text-gray-600">Already have an account?</h4>

              <Link
                to="/shop-login"
                className="pl-2 font-semibold text-[#f63b60] transition-colors duration-200 hover:text-[#e92f54]"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShopCreate;
