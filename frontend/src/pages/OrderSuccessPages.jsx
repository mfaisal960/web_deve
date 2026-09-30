import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AiOutlineCheckCircle, AiOutlineShoppingCart } from "react-icons/ai";
import Footer from "../components/Login/Layout/Footer";
import Header from "../components/Login/Layout/Header";
import {
  FALLBACK_IMAGE,
  getItemImage,
  getItemPrice,
  getItemQty,
} from "../utils/orderItems";

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
  // The orders the checkout just created. A cart spanning several shops is split
  // into one order per shop, so there can be more than one and each lists only
  // the items that shop is selling.
  const lastOrders = useSelector((state) => state.order?.lastOrders || []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <AiOutlineCheckCircle size={72} className="mx-auto text-green-500" />

          <h1 className="mt-4 text-2xl font-semibold text-gray-900 sm:text-3xl">
            Your order is successful
          </h1>

          <p className="mt-2 text-gray-600">
            Thank you for your purchase. A receipt is on its way to your inbox.
          </p>
        </div>

        {lastOrders.length === 0 ? (
          // Reached by typing the URL or after a reload, when the store no longer
          // holds what was just bought. There is nothing to list, so the page
          // says so and points at the order list instead of showing a blank card.
          <div className="mt-10 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              We could not load the details of this order here.
            </p>

            <Link
              to="/profile?tab=2"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              View my orders
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {lastOrders.map((order) => {
              const cart = Array.isArray(order.cart) ? order.cart : [];
              const shopName = cart[0]?.shop?.name;

              return (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Order ID
                      </p>

                      <p className="font-mono text-sm text-gray-800">
                        {order._id}
                      </p>
                    </div>

                    {shopName && (
                      <p className="text-sm text-gray-600">
                        Sold by <span className="font-medium">{shopName}</span>
                      </p>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {cart.map((item, index) => (
                      <div
                        key={item._id || item.productId || index}
                        className="flex items-center gap-4 p-4 sm:px-5"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={getItemImage(item) || FALLBACK_IMAGE}
                            alt={item.name || "Product"}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-gray-800">
                            {item.name || "Product"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            US$ {getItemPrice(item)} × {getItemQty(item)}
                          </p>
                        </div>

                        <p className="flex-shrink-0 text-sm font-semibold text-gray-900">
                          US${" "}
                          {(getItemPrice(item) * getItemQty(item)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
                    <Link
                      to={`/user/order/${order._id}`}
                      className="text-sm font-medium text-red-600 transition hover:text-red-700"
                    >
                      View order details
                    </Link>

                    <p className="text-sm text-gray-500">
                      Total{" "}
                      <span className="text-base font-semibold text-gray-900">
                        US$ {Number(order.totalPrice || 0).toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/profile?tab=2"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <AiOutlineShoppingCart size={16} />
                View my orders
              </Link>

              <Link
                to="/"
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccessPage;
