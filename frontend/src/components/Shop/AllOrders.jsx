import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { AiOutlineArrowRight } from "react-icons/ai";
import Loader from "../Login/Layout/Loader";
import OrderItemsCell from "../Order/OrderItemsCell";
import { REFUND_STATUSES, isRefundStatus } from "../../utils/orderItems";

const AllOrders = () => {
  // `shopOrders`, not `orders`: the buyer's list is a different query and the two
  // used to share one slot, so each overwrote the other and this grid could
  // render the buyer's rows or an empty table.
  const { shopOrders, shopLoading: isLoading } = useSelector(
    (state) => state.order
  );
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
      field: "refund",
      headerName: "Refund",
      minWidth: 140,
      flex: 0.7,
      sortable: false,
      filterable: false,
      // Only refunds are called out; an order on the normal delivery flow has
      // nothing to report here, so it gets a dash rather than a second badge
      // repeating the Status column next to it.
      renderCell: (params) => {
        const status = params.row.status;

        if (!isRefundStatus(status)) {
          return <span className="text-xs text-gray-400">—</span>;
        }

        const isDone = status === REFUND_STATUSES[1];

        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              isDone
                ? "bg-green-50 text-green-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {isDone ? "Refunded" : "Refund Pending"}
          </span>
        );
      },
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

  shopOrders &&
    shopOrders.forEach((item) => {
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
            pageSizeOptions={[5, 10, 25, 50, 100]}
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