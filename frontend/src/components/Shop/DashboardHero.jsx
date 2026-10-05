
import React, { useEffect } from "react";
import {
  AiOutlineArrowRight,
  AiOutlineMoneyCollect,
} from "react-icons/ai";
import { Link } from "react-router-dom";
import { MdBorderClear } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { getAllProductsShop } from "../../redux/actions/product";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const DashboardHero = () => {
  const dispatch = useDispatch();

  // `shopOrders`, not `orders`: getAllOrdersOfShop writes the shop's own list into
  // `shopOrders`, and `orders` is the buyer's list, so reading `orders` here showed
  // nothing (or another user's rows) on the dashboard.
  const { shopOrders } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);
  const { products } = useSelector((state) => state.products);

  useEffect(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
      dispatch(getAllProductsShop(seller._id));
    }
  }, [dispatch, seller?._id]);

  const availableBalance = Number(
    seller?.availableBalance || 0
  ).toFixed(2);

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      minWidth: 150,
      flex: 0.7,
    },

    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      flex: 0.7,
      // `params.getValue` was removed in DataGrid v6; read the row directly.
      cellClassName: (params) =>
        params.row.status === "Delivered" ? "greenColor" : "redColor",
    },

    {
      field: "itemsQty",
      headerName: "Items Qty",
      type: "number",
      minWidth: 130,
      flex: 0.7,
    },

    {
      field: "total",
      headerName: "Total",
      type: "number",
      minWidth: 130,
      flex: 0.8,
    },

    {
      field: " ",
      flex: 1,
      minWidth: 150,
      headerName: "",
      type: "number",
      sortable: false,

      renderCell: (params) => {
        return (
          <Link
            to={`/order/${params.id}`}
            className="inline-flex items-center justify-center"
          >
            <Button
              className="!min-w-0 !rounded-lg !p-2 !text-gray-600 transition-all duration-200 hover:!bg-[#fce1e6] hover:!text-[#e94560]"
            >
              <AiOutlineArrowRight size={20} />
            </Button>
          </Link>
        );
      },
    },
  ];

  const row = [];

  shopOrders?.forEach((item) => {
    row.push({
      id: item._id,

      itemsQty:
        item.cart?.reduce(
          (acc, cartItem) => acc + (cartItem.qty || 0),
          0
        ) || 0,

      total: "US$ " + item.totalPrice,

      status: item.status,
    });
  });

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* ================= OVERVIEW ================= */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Overview
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Monitor your shop performance and latest activity.
          </p>
        </div>

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {/* Account Balance */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fce1e6]">
                <AiOutlineMoneyCollect
                  size={25}
                  className="text-[#e94560]"
                />
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                Balance
              </span>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-gray-500">
                Account Balance
              </p>

              <p className="mt-1 text-xs text-gray-400">
                With 10% service charge
              </p>

              <h5 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                ${availableBalance}
              </h5>
            </div>

            <Link
              to="/dashboard-withdraw-money"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#077f9c] transition-colors duration-200 hover:text-[#05677e]"
            >
              Withdraw Money
              <AiOutlineArrowRight size={15} />
            </Link>
          </div>

          {/* All Orders */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <MdBorderClear
                  size={25}
                  className="text-blue-600"
                />
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                Orders
              </span>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-gray-500">
                All Orders
              </p>

              <h5 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                {shopOrders?.length || 0}
              </h5>
            </div>

            <Link
              to="/dashboard-orders"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#077f9c] transition-colors duration-200 hover:text-[#05677e]"
            >
              View Orders
              <AiOutlineArrowRight size={15} />
            </Link>
          </div>

          {/* All Products */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                <AiOutlineMoneyCollect
                  size={25}
                  className="text-green-600"
                />
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                Products
              </span>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-gray-500">
                All Products
              </p>

              <h5 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                {products?.length || 0}
              </h5>
            </div>

            <Link
              to="/dashboard-products"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#077f9c] transition-colors duration-200 hover:text-[#05677e]"
            >
              View Products
              <AiOutlineArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* ================= LATEST ORDERS ================= */}
        <div className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                Latest Orders
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                View and manage your recent orders.
              </p>
            </div>

            <Link
              to="/dashboard-orders"
              className="text-sm font-semibold text-[#e94560] hover:underline"
            >
              View all orders
            </Link>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
  );
};

export default DashboardHero;
