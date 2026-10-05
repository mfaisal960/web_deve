import { DataGrid } from "@mui/x-data-grid";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineCheckCircle, HiOutlineReceiptRefund } from "react-icons/hi";
import { toast } from "react-toastify";
import { getAllOrdersOfShop, approveRefund } from "../../redux/actions/order";
import { REFUND_STATUSES } from "../../utils/orderItems";
import Loader from "../Login/Layout/Loader";
import OrderItemsCell from "../Order/OrderItemsCell";

const PENDING = REFUND_STATUSES[0];
const DONE = REFUND_STATUSES[1];

// Refunds are order level, not line level: a refund covers everything in the
// cart, so the whole order moves through the two refund stages together.
const AllRefunds = () => {
  const { shopOrders, shopLoading: isLoading } = useSelector(
    (state) => state.order
  );
  const { seller } = useSelector((state) => state.seller);

  const dispatch = useDispatch();

  // Tracked by id rather than as one flag: a seller can have several refunds
  // open at once, and a single boolean would either disable every button or
  // leave the others clickable mid-request.
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
    }
  }, [dispatch, seller?._id]);

  const refunds = useMemo(
    () =>
      (Array.isArray(shopOrders) ? shopOrders : []).filter((order) =>
        REFUND_STATUSES.includes(order?.status)
      ),
    [shopOrders]
  );

  const pendingCount = refunds.filter((order) => order.status === PENDING).length;

  // Takes the grid row, whose order id is its `id` field: the row is built for the
  // grid below, so it carries `id` and not the `_id` the server orders are keyed by.
  const handleApprove = async (row) => {
    const orderId = row?.id;

    if (!orderId || approving) return;

    setApproving(orderId);

    const result = await dispatch(approveRefund(orderId));

    setApproving(null);

    if (result?.ok) {
      toast.success(`Refund completed for order ${orderId}`);
      return;
    }

    toast.error(result?.error || "Failed to complete the refund");
  };

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      minWidth: 160,
      flex: 0.9,
      renderCell: (params) => (
        <span className="truncate font-mono text-xs text-gray-700" title={params.value}>
          {params.value}
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Refund Status",
      minWidth: 170,
      flex: 0.9,
      renderCell: (params) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            params.row.status === DONE
              ? "bg-green-50 text-green-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {params.row.status || "—"}
        </span>
      ),
    },
    {
      field: "items",
      headerName: "Refunded Items",
      minWidth: 280,
      flex: 1.5,
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
      headerName: "Refunded Amount",
      minWidth: 160,
      flex: 0.8,
      renderCell: (params) => (
        <span className="text-sm font-semibold text-gray-800">
          {params.row.total}
        </span>
      ),
    },
    {
      field: "orderedAt",
      headerName: "Order Date",
      minWidth: 150,
      flex: 0.7,
      // The order date, not the date the refund was asked for: nothing records
      // when a refund was requested (the order schema has no updatedAt), so
      // labelling the order date that way would report a day the refund never
      // happened on.
      renderCell: (params) => (
        <span className="text-xs text-gray-500">
          {params.row.orderedAt}
        </span>
      ),
    },
    {
      field: "approve",
      headerName: "Action",
      minWidth: 170,
      flex: 0.9,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isPending = params.row.status === PENDING;
        const busy = approving === params.row.id;

        if (!isPending) {
          return (
            <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-green-100 bg-green-50 px-3 text-xs font-semibold text-green-600">
              <HiOutlineCheckCircle size={14} />
              Refunded
            </div>
          );
        }

        return (
          <button
            type="button"
            onClick={() => handleApprove(params.row)}
            disabled={busy}
            className={`h-9 w-full rounded-md text-xs font-semibold transition-colors duration-200 ${
              busy
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "cursor-pointer bg-[#e94560] text-white hover:bg-[#d93a55]"
            }`}
          >
            {busy ? (
              "Completing..."
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <HiOutlineReceiptRefund size={14} />
                Complete Refund
              </span>
            )}
          </button>
        );
      },
    },
  ];

  const rows = refunds.map((item) => ({
    id: item._id,
    cart: Array.isArray(item.cart) ? item.cart : [],
    itemsQty: Array.isArray(item.cart) ? item.cart.length : 0,
    total: "US$ " + (item.totalPrice ?? 0),
    status: item.status,
    orderedAt: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString()
      : "—",
  }));

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-8 pt-1 mt-10 bg-white">
          <div className="px-5 sm:px-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-800">Refunds</h3>
            <p className="text-sm text-gray-500 mt-1">
              {pendingCount > 0
                ? `${pendingCount} refund${pendingCount === 1 ? "" : "s"} waiting to be completed.`
                : "No refunds are waiting to be completed."}
            </p>
          </div>

          {refunds.length === 0 ? (
            <div className="px-5 sm:px-6 pb-8">
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                No refunded orders yet.
              </p>
            </div>
          ) : (
            <DataGrid
              rows={rows}
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
          )}
        </div>
      )}
    </>
  );
};

export default AllRefunds;