
import React, { useEffect, useState } from "react";
import {
  AiOutlineArrowRight,
  AiOutlineCamera,
  AiOutlineDelete,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { server } from "../../server";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import { MdTrackChanges } from "react-icons/md";
import { RxCross1 } from "react-icons/rx";
import {
  deleteUserAddress,
  loadUser,
  updatUserAddress,
  updateUserInformation,
} from "../../redux/actions/user";
import { Country, State } from "country-state-city";
import { toast } from "react-toastify";
import axios from "axios";
import { getAllOrdersOfUser } from "../../redux/actions/order";

const inputClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const selectClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const primaryButtonClasses =
  "inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

const ProfileContent = ({ active }) => {
  const { user, error, successMessage } = useSelector((state) => state.user);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.response?.data?.message || "Something went wrong"
      );

      dispatch({ type: "clearErrors" });
    }

    if (successMessage) {
      toast.success(successMessage);
      dispatch({ type: "clearMessages" });
    }
  }, [error, successMessage, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(updateUserInformation(name, email, phoneNumber, password));
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatar(reader.result);

        axios
          .put(
            `${server}/user/update-avatar`,
            { avatar: reader.result },
            {
              withCredentials: true,
            }
          )
          .then(() => {
            dispatch(loadUser());
            toast.success("Avatar updated successfully!");
          })
          .catch((error) => {
            toast.error(
              error?.response?.data?.message || "Failed to update avatar"
            );
          });
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      {/* Profile */}
      {active === 1 && (
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          {/* Avatar */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <img
                src={avatar || user?.avatar?.url}
                alt={user?.name || "Profile"}
                className="h-32 w-32 rounded-full border-4 border-green-500 object-cover shadow-md sm:h-36 sm:w-36"
              />

              <label
                htmlFor="profile-image"
                className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-gray-100 text-gray-700 shadow-md transition-all duration-200 hover:bg-blue-600 hover:text-white"
              >
                <AiOutlineCamera size={18} />

                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImage}
                />
              </label>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="full-name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="full-name"
                  type="text"
                  className={inputClasses}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
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
                  className={inputClasses}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  className={inputClasses}
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Enter Your Password
                </label>

                <input
                  id="password"
                  type="password"
                  className={inputClasses}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="mt-7">
              <button
                type="submit"
                className={`${primaryButtonClasses} min-w-[160px]`}
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders */}
      {active === 2 && (
        <div className="w-full overflow-hidden rounded-xl bg-white shadow-sm">
          <AllOrders />
        </div>
      )}

      {/* Refund Orders */}
      {active === 3 && (
        <div className="w-full overflow-hidden rounded-xl bg-white shadow-sm">
          <AllRefundOrders />
        </div>
      )}

      {/* Track Orders */}
      {active === 5 && (
        <div className="w-full overflow-hidden rounded-xl bg-white shadow-sm">
          <TrackOrder />
        </div>
      )}

      {/* Change Password */}
      {active === 6 && (
        <div className="w-full rounded-xl bg-white shadow-sm">
          <ChangePassword />
        </div>
      )}

      {/* Addresses */}
      {active === 7 && (
        <div className="w-full rounded-xl bg-white shadow-sm">
          <Address />
        </div>
      )}
    </div>
  );
};

/* =========================================================
   ORDERS
========================================================= */

const AllOrders = () => {
  const { user } = useSelector((state) => state.user);
  const { orders } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllOrdersOfUser(user._id));
    }
  }, [dispatch, user?._id]);

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      minWidth: 180,
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      flex: 0.8,
      renderCell: (params) => {
        const delivered = params.value === "Delivered";

        return (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              delivered
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {params.value}
          </span>
        );
      },
    },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      minWidth: 120,
      flex: 0.6,
    },
    {
      field: "total",
      headerName: "Total",
      minWidth: 130,
      flex: 0.7,
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 100,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Link to={`/user/order/${params.row.id}`}>
          <Button>
            <AiOutlineArrowRight size={20} />
          </Button>
        </Link>
      ),
    },
  ];

  const rows =
    orders?.map((item) => ({
      id: item._id,
      itemsQty: item.cart?.length || 0,
      total: `US$ ${item.totalPrice}`,
      status: item.status,
    })) || [];

  return (
    <div className="w-full overflow-x-auto p-3 sm:p-5">
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
      />
    </div>
  );
};

/* =========================================================
   REFUND ORDERS
========================================================= */

const AllRefundOrders = () => {
  const { user } = useSelector((state) => state.user);
  const { orders } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllOrdersOfUser(user._id));
    }
  }, [dispatch, user?._id]);

  const eligibleOrders =
    orders?.filter((item) => item.status === "Processing refund") || [];

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      minWidth: 180,
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      flex: 0.8,
      renderCell: (params) => (
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          {params.value}
        </span>
      ),
    },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      minWidth: 120,
      flex: 0.6,
    },
    {
      field: "total",
      headerName: "Total",
      minWidth: 130,
      flex: 0.7,
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 100,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Link to={`/user/order/${params.row.id}`}>
          <Button>
            <AiOutlineArrowRight size={20} />
          </Button>
        </Link>
      ),
    },
  ];

  const rows = eligibleOrders.map((item) => ({
    id: item._id,
    itemsQty: item.cart?.length || 0,
    total: `US$ ${item.totalPrice}`,
    status: item.status,
  }));

  return (
    <div className="w-full overflow-x-auto p-3 sm:p-5">
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        autoHeight
        disableRowSelectionOnClick
      />
    </div>
  );
};

/* =========================================================
   TRACK ORDER
========================================================= */

const TrackOrder = () => {
  const { user } = useSelector((state) => state.user);
  const { orders } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllOrdersOfUser(user._id));
    }
  }, [dispatch, user?._id]);

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      minWidth: 180,
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      flex: 0.8,
      renderCell: (params) => {
        const delivered = params.value === "Delivered";

        return (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              delivered
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {params.value}
          </span>
        );
      },
    },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      minWidth: 120,
      flex: 0.6,
    },
    {
      field: "total",
      headerName: "Total",
      minWidth: 130,
      flex: 0.7,
    },
    {
      field: "action",
      headerName: "Track",
      minWidth: 100,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Link to={`/user/track/order/${params.row.id}`}>
          <Button>
            <MdTrackChanges size={20} />
          </Button>
        </Link>
      ),
    },
  ];

  const rows =
    orders?.map((item) => ({
      id: item._id,
      itemsQty: item.cart?.length || 0,
      total: `US$ ${item.totalPrice}`,
      status: item.status,
    })) || [];

  return (
    <div className="w-full overflow-x-auto p-3 sm:p-5">
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
      />
    </div>
  );
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordChangeHandler = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(
        `${server}/user/update-user-password`,
        {
          oldPassword,
          newPassword,
          confirmPassword,
        },
        {
          withCredentials: true,
        }
      );

      toast.success(res.data.success);

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update password"
      );
    }
  };

  return (
    <div className="w-full p-5 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Change Password
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Keep your account secure by updating your password regularly.
          </p>
        </div>

        <form
          onSubmit={passwordChangeHandler}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="old-password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Enter Your Old Password
            </label>

            <input
              id="old-password"
              type="password"
              className={inputClasses}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter your old password"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Enter Your New Password
            </label>

            <input
              id="new-password"
              type="password"
              className={inputClasses}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Confirm Your New Password
            </label>

            <input
              id="confirm-password"
              type="password"
              className={inputClasses}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />
          </div>

          <button
            type="submit"
            className={`${primaryButtonClasses} w-full sm:w-auto`}
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

/* =========================================================
   ADDRESS
========================================================= */

const Address = () => {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [addressType, setAddressType] = useState("");

  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const addressTypeData = [
    {
      name: "Default",
    },
    {
      name: "Home",
    },
    {
      name: "Office",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!addressType || !country || !city) {
      toast.error("Please fill all the fields!");
      return;
    }

    dispatch(
      updatUserAddress(
        country,
        city,
        address1,
        address2,
        zipCode,
        addressType
      )
    );

    setOpen(false);
    setCountry("");
    setCity("");
    setAddress1("");
    setAddress2("");
    setZipCode("");
    setAddressType("");
  };

  const handleDelete = (item) => {
    dispatch(deleteUserAddress(item._id));
  };

  return (
    <div className="w-full p-5 sm:p-8">
      {/* Add Address Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                Add New Address
              </h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <RxCross1 size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-5">
                {/* Country */}
                <div>
                  <label
                    htmlFor="country"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Country
                  </label>

                  <select
                    id="country"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setCity("");
                    }}
                    className={selectClasses}
                    required
                  >
                    <option value="">Choose your country</option>

                    {Country.getAllCountries().map((item) => (
                      <option key={item.isoCode} value={item.isoCode}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* State / City */}
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Choose Your City
                  </label>

                  <select
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={selectClasses}
                    required
                    disabled={!country}
                  >
                    <option value="">Choose your city</option>

                    {country &&
                      State.getStatesOfCountry(country).map((item) => (
                        <option key={item.isoCode} value={item.isoCode}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Address 1 */}
                <div>
                  <label
                    htmlFor="address1"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Address 1
                  </label>

                  <input
                    id="address1"
                    type="text"
                    className={inputClasses}
                    required
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder="Enter your address"
                  />
                </div>

                {/* Address 2 */}
                <div>
                  <label
                    htmlFor="address2"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Address 2
                  </label>

                  <input
                    id="address2"
                    type="text"
                    className={inputClasses}
                    required
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    placeholder="Apartment, street, etc."
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label
                    htmlFor="zip-code"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Zip Code
                  </label>

                  <input
                    id="zip-code"
                    type="text"
                    inputMode="numeric"
                    className={inputClasses}
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter zip code"
                  />
                </div>

                {/* Address Type */}
                <div>
                  <label
                    htmlFor="address-type"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Address Type
                  </label>

                  <select
                    id="address-type"
                    value={addressType}
                    onChange={(e) => setAddressType(e.target.value)}
                    className={selectClasses}
                    required
                  >
                    <option value="">Choose your address type</option>

                    {addressTypeData.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={`${primaryButtonClasses} mt-6 w-full`}
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Address Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Addresses
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your saved delivery addresses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={primaryButtonClasses}
        >
          + Add New Address
        </button>
      </div>

      {/* Address List */}
      <div className="space-y-4">
        {user?.addresses?.map((item, index) => (
          <div
            key={item._id || index}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Address Type */}
              <div className="min-w-[120px]">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {item.addressType}
                </span>
              </div>

              {/* Address */}
              <div className="flex-1 lg:px-5">
                <p className="text-sm leading-6 text-gray-700">
                  {item.address1} {item.address2}
                </p>
              </div>

              {/* Phone */}
              <div className="lg:min-w-[140px]">
                <p className="text-sm font-medium text-gray-600">
                  {user?.phoneNumber}
                </p>
              </div>

              {/* Delete */}
              <div className="flex justify-end lg:min-w-[50px]">
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete address"
                >
                  <AiOutlineDelete size={22} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {user?.addresses?.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <AiOutlineDelete size={25} />
            </div>

            <h3 className="text-lg font-semibold text-gray-800">
              No Saved Addresses
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              You don't have any saved address yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileContent;
