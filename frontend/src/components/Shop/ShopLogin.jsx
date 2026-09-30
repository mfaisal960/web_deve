
import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const ShopLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginIssue, setLoginIssue] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [resendUrl, setResendUrl] = useState("");
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (resending || !email.trim()) {
      return;
    }

    setResending(true);
    setResendUrl("");

    try {
      const res = await axios.post(
        `${server}/shop/resend-activation`,
        { email: email.trim().toLowerCase() },
        { withCredentials: true }
      );

      setResendStatus(res.data.message);
      // Only present in development builds of the API.
      setResendUrl(res.data.activationUrl || "");
      toast.success("Activation email sent again");
    } catch (err) {
      const message =
        err?.response?.data?.message || "Could not resend the activation email";
      setResendStatus(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setLoginIssue("");

    await axios
      .post(
        `${server}/shop/login-shop`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          withCredentials: true,
        }
      )
      .then(() => {
        toast.success("Login Success!");
        navigate("/dashboard");
        window.location.reload(true);
      })
      .catch((err) => {
        const message =
          err?.response?.data?.message || "Something went wrong";

        toast.error(message);

        // A shop account only exists after the shop was created and the emailed
        // activation link was opened, so point the seller at that step instead
        // of leaving them with a bare 400.
        if (err?.response?.status === 400) {
          setErrorMessage(message);
          setLoginIssue(
            /not activated/i.test(message) ? "not-activated" : "not-found"
          );
        } else if (err?.response?.status === 404) {
          setErrorMessage(message);
          setLoginIssue("not-found");
        }
      });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <span className="text-2xl font-bold text-white">S</span>
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            Welcome Back
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Login to manage your shop and continue selling
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                >
                  {visible ? (
                    <AiOutlineEye size={22} />
                  ) : (
                    <AiOutlineEyeInvisible size={22} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between gap-4">

              <label
                htmlFor="remember-me"
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  name="remember-me"
                  id="remember-me"
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                />

                <span className="text-sm text-slate-600">
                  Remember me
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-300 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Login to Shop
            </button>

            {/* Inline hint: why a 400 happens and what to do next */}
            {errorMessage && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  {errorMessage}
                </p>

                {loginIssue === "not-activated" ? (
                  <>
                    <p className="mt-2 text-sm text-amber-800">
                      The activation email can land in spam, or be delayed. Send
                      it again to the address you registered with.
                    </p>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resending ? "Sending..." : "Resend activation email"}
                      </button>
                    </div>

                    {resendStatus && (
                      <p className="mt-3 text-sm text-amber-900">
                        {resendStatus}
                      </p>
                    )}

                    {resendUrl && (
                      <a
                        href={resendUrl}
                        className="mt-3 inline-block text-sm font-semibold text-amber-900 underline"
                      >
                        Open activation link now (development only)
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-amber-800">
                      No shop is registered with this email yet. Create the shop
                      first, then open the activation link we email you.
                    </p>

                    <Link
                      to="/shop-create"
                      className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      Create Shop
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  New seller?
                </span>
              </div>
            </div>

            {/* Sign Up */}
            <div className="text-center">
              <span className="text-sm text-slate-500">
                Don't have a shop account?
              </span>

              <Link
                to="/shop-create"
                className="ml-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                Create Shop
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom Text */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Shop Management. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ShopLogin;
