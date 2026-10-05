
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { AiOutlineDelete } from "react-icons/ai";
import { RxCross1 } from "react-icons/rx";
import { useSelector } from "react-redux";
import Loader from "../Login/Layout/Loader";
import { server } from "../../server";
import { toast } from "react-toastify";

const AllCoupons = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [coupouns, setCoupouns] = useState([]);
  const [minAmount, setMinAmout] = useState(null);
  const [maxAmount, setMaxAmount] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [value, setValue] = useState(null);

  const { seller } = useSelector((state) => state.seller);
  const { products } = useSelector((state) => state.products);


  useEffect(() => {
    const shopId = seller?._id;

    if (!shopId) {
      return;
    }

    let cancelled = false;

    axios
      .get(`${server}/coupon/get-coupon/${shopId}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (!cancelled) {
          setCoupouns(res.data.couponCodes || []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error?.response?.data?.message || "Unable to load coupon codes!"
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [seller?._id]);

  // Without a shop there is nothing to load, so the loader is never shown.
  const isCouponsLoading = isLoading && Boolean(seller?._id);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${server}/coupon/delete-coupon/${id}`, {
        withCredentials: true,
      });

      toast.success("Coupon code deleted successfully!");
      window.location.reload();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to delete the coupon code!"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios
      .post(
        `${server}/coupon/create-coupon-code`,
        {
          name,
          minAmount,
          maxAmount,
          selectedProducts,
          value,
          shopId: seller._id,
        },
        { withCredentials: true }
      )
      .then(() => {
        toast.success("Coupon code created successfully!");
        setOpen(false);
        window.location.reload();
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Unable to create the coupon code!"
        );
      });
  };

  const columns = [
    {
      field: "id",
      headerName: "ID",
      minWidth: 150,
      flex: 0.7,
    },
    {
      field: "name",
      headerName: "Coupon Code",
      minWidth: 180,
      flex: 1.4,
    },
    {
      field: "price",
      headerName: "Value",
      minWidth: 100,
      flex: 0.6,
    },
    {
      field: "Delete",
      flex: 0.8,
      minWidth: 120,
      headerName: "Action",
      sortable: false,
      renderCell: (params) => {
        return (
          <Button
            onClick={() => handleDelete(params.id)}
            className="!min-w-0 !p-2 !rounded-lg hover:!bg-red-50"
          >
            <AiOutlineDelete
              size={20}
              className="text-red-500 hover:text-red-600 transition-colors"
            />
          </Button>
        );
      },
    },
  ];

  const row = [];

  coupouns &&
    coupouns.forEach((item) => {
      row.push({
        id: item._id,
        name: item.name,
        price: item.value + " %",
        sold: 10,
      });
    });

  return (
    <>
      {isCouponsLoading ? (
        <Loader />
      ) : (
        <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
          <div className="w-full max-w-7xl mx-auto">

            {/* ================= HEADER ================= */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                    Coupon Codes
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Manage your shop discount coupons
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="
                    w-full sm:w-auto
                    inline-flex items-center justify-center
                    px-5 py-3
                    rounded-xl
                    bg-blue-600
                    hover:bg-blue-700
                    active:bg-blue-800
                    text-white
                    text-sm
                    font-semibold
                    shadow-sm
                    hover:shadow-md
                    transition-all duration-200
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:ring-offset-2
                  "
                >
                  + Create Coupon Code
                </button>

              </div>
            </div>

            {/* ================= COUPON TABLE ================= */}
            <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">
                  All Coupons
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  View and manage all your coupon codes.
                </p>
              </div>

              <div className="w-full overflow-x-auto">
                <div className="min-w-[650px]">
                  <DataGrid
                    rows={row}
                    columns={columns}
                    pageSizeOptions={[5, 10, 25, 50, 100]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                    disableRowSelectionOnClick
                    autoHeight
                    className="!border-0"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ================= CREATE COUPON MODAL ================= */}
          {open && (
            <div
              className="
                fixed inset-0
                z-[20000]
                flex items-center justify-center
                bg-black/60
                backdrop-blur-sm
                px-4
                py-6
              "
              onClick={() => setOpen(false)}
            >
              <div
                className="
                  relative
                  w-full
                  max-w-xl
                  max-h-[92vh]
                  overflow-y-auto
                  bg-white
                  rounded-2xl
                  shadow-2xl
                  border border-gray-100
                  p-5 sm:p-7
                "
                onClick={(e) => e.stopPropagation()}
              >

                {/* ================= MODAL HEADER ================= */}
                <div className="flex items-start justify-between gap-4 mb-7">

                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                      Create Coupon Code
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Create a new discount coupon for your customers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="
                      flex-shrink-0
                      flex items-center justify-center
                      w-9 h-9
                      rounded-full
                      text-gray-500
                      hover:text-gray-800
                      hover:bg-gray-100
                      transition-all duration-200
                    "
                  >
                    <RxCross1 size={18} />
                  </button>

                </div>

                {/* ================= FORM ================= */}
                <form
                  onSubmit={handleSubmit}
                  aria-required={true}
                  className="space-y-5"
                >

                  {/* Coupon Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your coupon code name..."
                      className="
                        w-full
                        h-11
                        px-4
                        bg-gray-50
                        border border-gray-200
                        rounded-xl
                        text-sm
                        text-gray-800
                        placeholder-gray-400
                        outline-none
                        transition-all duration-200
                        focus:bg-white
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Percentage
                      <span className="text-red-500 ml-1">*</span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        name="value"
                        value={value}
                        required
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Enter discount percentage..."
                        className="
                          w-full
                          h-11
                          px-4
                          pr-12
                          bg-gray-50
                          border border-gray-200
                          rounded-xl
                          text-sm
                          text-gray-800
                          placeholder-gray-400
                          outline-none
                          transition-all duration-200
                          focus:bg-white
                          focus:border-blue-500
                          focus:ring-4
                          focus:ring-blue-100
                        "
                      />

                      <span
                        className="
                          absolute
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-gray-500
                          font-semibold
                        "
                      >
                        %
                      </span>
                    </div>
                  </div>

                  {/* Min / Max Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Min Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Amount
                      </label>

                      <input
                        type="number"
                        name="minAmount"
                        value={minAmount || ""}
                        onChange={(e) => setMinAmout(e.target.value)}
                        placeholder="Minimum amount"
                        className="
                          w-full
                          h-11
                          px-4
                          bg-gray-50
                          border border-gray-200
                          rounded-xl
                          text-sm
                          text-gray-800
                          placeholder-gray-400
                          outline-none
                          transition-all duration-200
                          focus:bg-white
                          focus:border-blue-500
                          focus:ring-4
                          focus:ring-blue-100
                        "
                      />
                    </div>

                    {/* Max Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Amount
                      </label>

                      <input
                        type="number"
                        name="maxAmount"
                        value={maxAmount || ""}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        placeholder="Maximum amount"
                        className="
                          w-full
                          h-11
                          px-4
                          bg-gray-50
                          border border-gray-200
                          rounded-xl
                          text-sm
                          text-gray-800
                          placeholder-gray-400
                          outline-none
                          transition-all duration-200
                          focus:bg-white
                          focus:border-blue-500
                          focus:ring-4
                          focus:ring-blue-100
                        "
                      />
                    </div>

                  </div>

                  {/* Selected Product */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Product
                    </label>

                    <select
                      value={selectedProducts || ""}
                      onChange={(e) =>
                        setSelectedProducts(e.target.value)
                      }
                      className="
                        w-full
                        h-11
                        px-4
                        bg-gray-50
                        border border-gray-200
                        rounded-xl
                        text-sm
                        text-gray-700
                        outline-none
                        cursor-pointer
                        transition-all duration-200
                        focus:bg-white
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    >
                      <option value="">
                        Choose a selected product
                      </option>

                      {products &&
                        products.map((i) => (
                          <option
                            value={i.name}
                            key={i.name}
                          >
                            {i.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* ================= ACTION BUTTONS ================= */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">

                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="
                        w-full
                        sm:w-1/2
                        h-11
                        rounded-xl
                        border border-gray-200
                        bg-white
                        text-gray-700
                        text-sm
                        font-semibold
                        hover:bg-gray-50
                        hover:border-gray-300
                        transition-all duration-200
                      "
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="
                        w-full
                        sm:w-1/2
                        h-11
                        rounded-xl
                        bg-blue-600
                        hover:bg-blue-700
                        active:bg-blue-800
                        text-white
                        text-sm
                        font-semibold
                        shadow-sm
                        hover:shadow-md
                        transition-all duration-200
                        focus:outline-none
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    >
                      Create Coupon
                    </button>

                  </div>

                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AllCoupons;
