
import React, { useEffect, useState } from "react";
import { BsFillBagFill } from "react-icons/bs";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { server } from "../../server";
import axios from "axios";
import { toast } from "react-toastify";

const OrderDetails = () => {
  const { orders, isLoading } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);
  const dispatch = useDispatch();
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const { id } = useParams();

  useEffect(() => {
    dispatch(getAllOrdersOfShop(seller._id));
  }, [dispatch]);

  const data = orders && orders.find((item) => item._id === id);

  const orderUpdateHandler = async (e) => {
    await axios
      .put(
        `${server}/order/update-order-status/${id}`,
        {
          status,
        },
        { withCredentials: true }
      )
      .then((res) => {
        toast.success("Order updated!");
        navigate("/dashboard-orders");
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  const refundOrderUpdateHandler = async (e) => {
    await axios
      .put(
        `${server}/order/order-refund-success/${id}`,
        {
          status,
        },
        { withCredentials: true }
      )
      .then((res) => {
        toast.success("Order updated!");
        dispatch(getAllOrdersOfShop(seller._id));
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  console.log(data?.status);

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fce1e6]">
              <BsFillBagFill size={22} className="text-[#e94560]" />
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 sm:text-[25px]">
              Order Details
            </h1>
          </div>

          <Link to="/dashboard-orders">
            <div className="flex h-11 items-center justify-center rounded-md bg-[#fce1e6] px-5 text-[17px] font-semibold text-[#e94560] transition-colors duration-200 hover:bg-[#f8d1d9]">
              Order List
            </div>
          </Link>
        </div>

        {/* Order Meta */}
        <div className="flex flex-col gap-2 border-b border-gray-200 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h5 className="text-sm font-medium text-gray-500 sm:text-base">
            Order ID:{" "}
            <span className="font-semibold text-gray-700">
              #{data?._id?.slice(0, 8)}
            </span>
          </h5>

          <h5 className="text-sm font-medium text-gray-500 sm:text-base">
            Placed on:{" "}
            <span className="font-semibold text-gray-700">
              {data?.createdAt?.slice(0, 10)}
            </span>
          </h5>
        </div>

        {/* Order Items */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Order Items
          </h2>

          <div className="space-y-5">
            {data &&
              data?.cart.map((item, index) => (
                <div
                  key={item._id || index}
                  className="flex items-center gap-4 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0"
                >
                  <img
                    src={`${item.images[0]?.url}`}
                    alt={item.name}
                    className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
                      {item.name}
                    </h5>

                    <h5 className="mt-1 text-sm text-gray-500 sm:text-base">
                      US${item.discountPrice} × {item.qty}
                    </h5>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-gray-500">
                      Subtotal
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      US${item.discountPrice * item.qty}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* Total */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">
            <span className="text-base font-medium text-gray-600">
              Total Price
            </span>

            <strong className="text-xl font-bold text-gray-900">
              US${data?.totalPrice}
            </strong>
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Shipping Address */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h4 className="mb-5 text-lg font-semibold text-gray-900">
              Shipping Address
            </h4>

            <div className="space-y-2 text-sm text-gray-600 sm:text-base">
              <p className="font-medium text-gray-800">
                {data?.shippingAddress.address1 +
                  " " +
                  data?.shippingAddress.address2}
              </p>

              <p>{data?.shippingAddress.country}</p>

              <p>{data?.shippingAddress.city}</p>

              <p>{data?.user?.phoneNumber}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h4 className="mb-5 text-lg font-semibold text-gray-900">
              Payment Info
            </h4>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-600">
                Status
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {data?.paymentInfo?.status
                  ? data?.paymentInfo?.status
                  : "Not Paid"}
              </span>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900">
            Order Status
          </h4>

          {data?.status !== "Processing refund" &&
            data?.status !== "Refund Success" && (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-3 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-[#e94560] focus:ring-2 focus:ring-[#e94560]/10 sm:w-[260px]"
              >
                {[
                  "Processing",
                  "Transferred to delivery partner",
                  "Shipping",
                  "Received",
                  "On the way",
                  "Delivered",
                ]
                  .slice(
                    [
                      "Processing",
                      "Transferred to delivery partner",
                      "Shipping",
                      "Received",
                      "On the way",
                      "Delivered",
                    ].indexOf(data?.status)
                  )
                  .map((option, index) => (
                    <option value={option} key={index}>
                      {option}
                    </option>
                  ))}
              </select>
            )}

          {data?.status === "Processing refund" ||
          data?.status === "Refund Success" ? (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-3 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-[#e94560] focus:ring-2 focus:ring-[#e94560]/10 sm:w-[260px]"
            >
              {["Processing refund", "Refund Success"]
                .slice(
                  ["Processing refund", "Refund Success"].indexOf(data?.status)
                )
                .map((option, index) => (
                  <option value={option} key={index}>
                    {option}
                  </option>
                ))}
            </select>
          ) : null}

          {/* Update Button */}
          <button
            type="button"
            className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-[#fce1e6] px-6 text-base font-semibold text-[#e94560] transition-all duration-200 hover:bg-[#f8d1d9] hover:shadow-sm active:scale-[0.99] sm:w-auto"
            onClick={
              data?.status !== "Processing refund"
                ? orderUpdateHandler
                : refundOrderUpdateHandler
            }
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
