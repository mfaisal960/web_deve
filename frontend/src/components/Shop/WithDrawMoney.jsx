
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { RxCross1 } from "react-icons/rx";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { loadSeller } from "../../redux/actions/user";
import { AiOutlineDelete } from "react-icons/ai";

const WithdrawMoney = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const { seller } = useSelector((state) => state.seller);

  const [paymentMethod, setPaymentMethod] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState(50);

  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    bankCountry: "",
    bankSwiftCode: null,
    bankAccountNumber: null,
    bankHolderName: "",
    bankAddress: "",
  });

  useEffect(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
    }
  }, [dispatch, seller?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const withdrawMethod = {
      bankName: bankInfo.bankName,
      bankCountry: bankInfo.bankCountry,
      bankSwiftCode: bankInfo.bankSwiftCode,
      bankAccountNumber: bankInfo.bankAccountNumber,
      bankHolderName: bankInfo.bankHolderName,
      bankAddress: bankInfo.bankAddress,
    };

    setPaymentMethod(false);

    await axios
      .put(
        `${server}/shop/update-payment-methods`,
        {
          withdrawMethod,
        },
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        toast.success("Withdraw method added successfully!");

        dispatch(loadSeller());

        setBankInfo({
          bankName: "",
          bankCountry: "",
          bankSwiftCode: null,
          bankAccountNumber: null,
          bankHolderName: "",
          bankAddress: "",
        });
      })
      .catch((error) => {
        console.log(error.response?.data?.message);
      });
  };

  const deleteHandler = async () => {
    await axios
      .delete(`${server}/shop/delete-withdraw-method`, {
        withCredentials: true,
      })
      .then((res) => {
        toast.success("Withdraw method deleted successfully!");
        dispatch(loadSeller());
      });
  };

  const error = () => {
    toast.error("You not have enough balance to withdraw!");
  };

  const withdrawHandler = async () => {
    if (withdrawAmount < 50 || withdrawAmount > availableBalance) {
      toast.error("You can't withdraw this amount!");
    } else {
      const amount = withdrawAmount;

      await axios
        .post(
          `${server}/withdraw/create-withdraw-request`,
          { amount },
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          toast.success("Withdraw money request is successful!");
        });
    }
  };

  const availableBalance = Number(
    seller?.availableBalance || 0
  ).toFixed(2);

  const inputClasses =
    "mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  const primaryButtonClasses =
    "inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="min-h-[90vh] w-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Main Balance Card */}
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <span className="text-2xl font-bold text-blue-600">$</span>
          </div>

          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-500">
            Available Balance
          </p>

          <h2 className="mb-7 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            ${availableBalance}
          </h2>

          <button
            type="button"
            className={primaryButtonClasses}
            onClick={() =>
              availableBalance < 50 ? error() : setOpen(true)
            }
          >
            Withdraw Money
          </button>

          <p className="mt-4 text-xs text-gray-400">
            Minimum withdrawal amount is $50
          </p>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ${
              paymentMethod
                ? "max-h-[90vh] overflow-y-auto"
                : "min-h-[40vh]"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {paymentMethod
                  ? "Add Withdraw Method"
                  : "Withdraw Methods"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPaymentMethod(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <RxCross1 size={20} />
              </button>
            </div>

            {/* Add Payment Method */}
            {paymentMethod ? (
              <div className="p-5 sm:p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    Enter your bank details to receive withdrawal
                    payments.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Bank Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Bank Name{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      value={bankInfo.bankName}
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          bankName: e.target.value,
                        })
                      }
                      placeholder="Enter your bank name"
                      className={inputClasses}
                    />
                  </div>

                  {/* Bank Country */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Bank Country{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      value={bankInfo.bankCountry}
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          bankCountry: e.target.value,
                        })
                      }
                      placeholder="Enter your bank country"
                      className={inputClasses}
                    />
                  </div>

                  {/* Swift Code */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Bank Swift Code{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      value={bankInfo.bankSwiftCode || ""}
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          bankSwiftCode: e.target.value,
                        })
                      }
                      placeholder="Enter your bank SWIFT code"
                      className={inputClasses}
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Bank Account Number{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="number"
                      required
                      value={bankInfo.bankAccountNumber || ""}
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          bankAccountNumber: e.target.value,
                        })
                      }
                      placeholder="Enter your bank account number"
                      className={inputClasses}
                    />
                  </div>

                  {/* Holder Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Bank Holder Name{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      value={bankInfo.bankHolderName}
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          bankHolderName: e.target.value,
                        })
                      }
                      placeholder="Enter bank account holder name"
                      className={inputClasses}
                    />
                  </div>

                  {/* Bank Address */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Bank Address{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      value={bankInfo.bankAddress}
                      onChange={(e) =>
                        setBankInfo({
                          ...bankInfo,
                          bankAddress: e.target.value,
                        })
                      }
                      placeholder="Enter your bank address"
                      className={inputClasses}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                      type="submit"
                      className={`${primaryButtonClasses} w-full sm:flex-1`}
                    >
                      Add Withdraw Method
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod(false)}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Existing Withdraw Methods */
              <div className="p-5 sm:p-6">
                {seller && seller?.withdrawMethod ? (
                  <div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Account Number
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {"*".repeat(
                                Math.max(
                                  0,
                                  seller?.withdrawMethod
                                    ?.bankAccountNumber?.length - 3
                                )
                              )}
                              {seller?.withdrawMethod?.bankAccountNumber?.slice(
                                -3
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Bank Name
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {seller?.withdrawMethod?.bankName}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={deleteHandler}
                          className="flex h-10 w-10 items-center justify-center self-start rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 sm:self-center"
                          aria-label="Delete withdraw method"
                        >
                          <AiOutlineDelete size={22} />
                        </button>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        Available Balance
                      </p>

                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        ${availableBalance}
                      </p>
                    </div>

                    {/* Withdrawal */}
                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Withdrawal Amount
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="number"
                          min="50"
                          placeholder="Amount..."
                          value={withdrawAmount}
                          onChange={(e) =>
                            setWithdrawAmount(e.target.value)
                          }
                          className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-40"
                        />

                        <button
                          type="button"
                          className={`${primaryButtonClasses} flex-1`}
                          onClick={withdrawHandler}
                        >
                          Withdraw
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        Minimum withdrawal amount: $50
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-2xl text-gray-400">$</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">
                      No Withdraw Method
                    </h3>

                    <p className="mt-2 max-w-sm text-sm text-gray-500">
                      Add a bank account to start receiving your
                      withdrawal payments.
                    </p>

                    <button
                      type="button"
                      className={`${primaryButtonClasses} mt-6`}
                      onClick={() => setPaymentMethod(true)}
                    >
                      Add New Method
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawMoney;
