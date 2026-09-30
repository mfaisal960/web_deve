import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { AiOutlineArrowRight } from "react-icons/ai";
import Loader from "../Login/Layout/Loader";
import OrderItemsCell from "../Order/OrderItemsCell";
import OrderStatusButton from "../Order/OrderStatusButton";

const AllOrders = () => {
  const { orders, loading: isLoading } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);

  const dispatch = useDispatch();

  useEffect(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
    }
  }, [dispatch, seller?._id]);

  const columns = [
    { field: "id", headerName: "Order ID", minWidth: 150, flex: 0.7 },

    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      flex: 0.8,
      renderCell: (params) => {
        const status = params.row.status;

        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              status === "Delivered"
                ? "bg-green-50 text-green-600"
                : status === "Processing refund" ||
                    status === "Refund Success"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-red-50 text-red-600"
            }`}
          >
            {status || "—"}
          </span>
        );
      },
    },
    {
      headerName: "Update Status",
      minWidth: 300,
      flex: 1.6,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <OrderStatusButton
          orderId={params.row.id}
          status={params.row.status}
        />
      ),
    },
    {
      field: "items",
      headerName: "Products",
      minWidth: 260,
      flex: 1.4,
      sortable: false,
      renderCell: (params) => <OrderItemsCell cart={params.row.cart} />,
    },

    {
      field: "itemsQty",
      headerName: "Items Qty",
      type: "number",
      minWidth: 110,
      flex: 0.5,
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
          <>
            <Link to={`/order/${params.id}`}>
              <Button>
                <AiOutlineArrowRight size={20} />
              </Button>
            </Link>
          </>
        );
      },
    },
  ];

  const row = [];

  orders &&
    orders.forEach((item) => {
      row.push({
        id: item._id,
        cart: Array.isArray(item.cart) ? item.cart : [],
        itemsQty: item.cart?.length ?? 0,
        total: "US$ " + item.totalPrice,
        status: item.status,
      });
    });

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-8 pt-1 mt-10 bg-white">
          <DataGrid
            rows={row}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            disableRowSelectionOnClick
            autoHeight
          />
        </div>
      )}
    </>
  );
};

export default AllOrders;