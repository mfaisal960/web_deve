import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { server } from "../server";

const SellerActivationPage = () => {
  const { activation_token } = useParams();
  const [status, setStatus] = useState(
    activation_token ? "loading" : "error"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activation_token) {
      return;
    }

    const sendRequest = async () => {
      try {
        // withCredentials is required: activation is what signs the seller in, so
        // the browser has to store the seller_token cookie the API answers with.
        // Without it the activation succeeds but the session is thrown away.
        await axios.post(
          `${server}/shop/activation`,
          {
            activation_token,
          },
          { withCredentials: true }
        );

        // Only report success once the backend has actually created the shop.
        setStatus("success");
      } catch (err) {
        console.error("Shop activation failed:", err.response?.data || err.message);
        setError(
          err?.response?.data?.message || "Unable to activate your shop."
        );
        setStatus("error");
      }
    };

    sendRequest();
  }, [activation_token]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {status === "loading" ? (
        <p>Activating your shop...</p>
      ) : status === "error" ? (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#b91c1c" }}>{error}</p>

          <p style={{ marginTop: "12px" }}>
            Activation links expire after 24 hours. Create the shop again to get
            a new link.
          </p>

          <Link
            to="/shop-create"
            style={{
              display: "inline-block",
              marginTop: "12px",
              padding: "10px 18px",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Create Shop
          </Link>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>Your shop has been created successfully!</p>

          <p style={{ marginTop: "12px" }}>
            You are already signed in as this seller. Open your dashboard, or{" "}
            <Link to="/shop-login">log in again</Link> later.
          </p>

          <Link
            to="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "12px",
              padding: "10px 18px",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default SellerActivationPage;
