import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { server } from './server.js'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Login, Signup ,ActivationPage,HomePage,ProductsPage ,
  BestSellingPage,Event,Faq, ProductDetailsPage,
  ProfilePage,ShopOrderDetails,UserOrderDetailsPage} from './routes/Routes.js'
import { ShopCreateProduct } from './routes/ShopRoutes.js'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Store from './redux/store.js'
import { loadSeller, loadUser } from './redux/actions/user.js'
import { getAllProducts } from './redux/actions/product.js'
import { getAllEvents } from './redux/actions/event.js'
import OrderSuccessPage from './pages/OrderSuccessPages.jsx'
import ProtectedRoute from './routes/ProtectedRoute.js'
import { useSelector } from 'react-redux'
import ShopCreatePage from './pages/ShopCreate.jsx'
import SellerActivationPage from './pages/SellerActivationPage.jsx'
import ShopLoginPage from './pages/ShopLoginPage.jsx'
import ShopDashboardPage from './pages/ShopDashboardPage.jsx'
import ShopHomePage from './pages/Shop/ShopHomePage.jsx'
import ShopPreviewPage from './pages/Shop/ShopPreviewPage.jsx'
import SellerProtectedRoute from './routes/SellerProtectedRoute.jsx'
import ShopAllProducts from './pages/Shop/ShopAllProducts.jsx'
import ShopAllOrders from './pages/Shop/ShopAllOrders.jsx'
import ShopCreateEvents from './pages/Shop/ShopCreateEvents.jsx'
import ShopAllEvents from './pages/Shop/ShopAllEvent.jsx'
import ShopAllCoupouns from './pages/Shop/ShopAllCoupouns.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import ShopSettingsPage from './pages/Shop/ShopSettingsPage.jsx'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const isValidStripeKey = (key) =>
  /^pk_(test|live)_[A-Za-z0-9]{10,}$/.test((key || "").trim());

// Stripe.js refuses to initialise a live publishable key on an insecure
// origin. Detect it up-front so we never hand such a key to loadStripe().
const isLiveKeyOnInsecurePage = (key) =>
  (key || "").trim().startsWith("pk_live_") &&
  typeof window !== "undefined" &&
  window.location.protocol === "http:";

// React StrictMode double-invokes effects in dev, and this component can
// remount on navigation, so guard the one-off diagnostics to keep them from
// spamming the console.
const loggedStripeIssues = new Set();
const logStripeIssueOnce = (id, message) => {
  if (loggedStripeIssues.has(id)) return;
  loggedStripeIssues.add(id);
  console.error(message);
};

const AppRoutes = () => {
  const [stripeApiKey, setStripeApiKey] = useState(null);
  const [cardPaymentsEnabled, setCardPaymentsEnabled] = useState(false);
  const { isAuthenticated }=useSelector((state)=>state.user)
  const location = useLocation()
  const isSellerPage = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/shop/')

  // The session only changes on a full page load (login/logout both call
  // window.location.reload), so load it once. Refiring it on every seller-page
  // navigation, and twice more under StrictMode's dev double-invoke, made the
  // console fill up with 401s from GET /user/getuser for signed-out visitors.
  const didLoadUser = useRef(false);

  useEffect(() => {
    if (didLoadUser.current) return;
    didLoadUser.current = true;
    Store.dispatch(loadUser());
  }, []);

  useEffect(() => {
    Store.dispatch(getAllProducts());
    Store.dispatch(getAllEvents());
  }, []);

  useEffect(() => {
    if (isSellerPage) {
      Store.dispatch(loadSeller())
    }
  }, [isSellerPage])

  useEffect(() => {
    let cancelled = false;

    const getStripeApikey = async () => {
      const envKey = (import.meta.env.VITE_STRIPE_PUBLIC_KEY || "").trim();
      let key = "";
      let canChargeCards = false;

      try {
        const { data } = await axios.get(`${server}/payment/stripeapikey`);
        key = (data?.stripeApikey || "").trim();
        canChargeCards = Boolean(data?.cardPaymentsEnabled);
      } catch (error) {
        console.error("Failed to load Stripe API key:", error);
      }

      if (!isValidStripeKey(key)) {
        key = isValidStripeKey(envKey) ? envKey : "";
      }

      if (isLiveKeyOnInsecurePage(key)) {
        logStripeIssueOnce(
          "live-on-http",
          "Blocked a pk_live_ Stripe key on an http:// page (Stripe.js requires HTTPS for live keys). " +
            "Add a pk_test_ key to frontend/.env or backend/config/.env for local development, " +
            "or serve the app over HTTPS."
        );
        key = "";
      }

      // A publishable key is not enough to charge a card, so only trust the
      // server's own signal once the key it handed us survived validation.
      if (!key) canChargeCards = false;

      if (!cancelled) {
        setStripeApiKey(key);
        setCardPaymentsEnabled(canChargeCards);
      }
    };

    getStripeApikey();

    return () => {
      cancelled = true;
    };
  }, []);

  const stripePromise = useMemo(
    () => (stripeApiKey && !isLiveKeyOnInsecurePage(stripeApiKey) ? loadStripe(stripeApiKey) : null),
    [stripeApiKey]
  );

  useEffect(() => {
    if (stripeApiKey === null) return;

    if (!stripeApiKey) {
      logStripeIssueOnce(
        "missing-key",
        "No usable Stripe publishable key found (pk_test_... / pk_live_...). " +
          "Card fields will not be interactive. " +
          "Set VITE_STRIPE_PUBLIC_KEY in frontend/.env (restart the dev server) " +
          "or STRIPE_API_KEY in backend/config/.env."
      );
    }
  }, [stripeApiKey]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/activation/:activation_token" element={<ActivationPage/>} />
        <Route path="/seller/activation/:activation_token" 
        element={<SellerActivationPage/>} />
        <Route path="/products" element={<ProductsPage/>}/>
        <Route path="/best-selling" element={<BestSellingPage/>}/>
        <Route path="/events" element={<Event/>}/>
         <Route path="/faq" element={<Faq/>}/>
        <Route path="/order/success" element={<OrderSuccessPage/>}/>
        {/* Both of these are linked from the profile order list but had no route,
            so the arrow buttons silently redirected to the home page. */}
        <Route path="/user/order/:id"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <UserOrderDetailsPage />
            </ProtectedRoute>
          } />
        <Route path="/user/track/order/:id"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <UserOrderDetailsPage />
            </ProtectedRoute>
          } />
   
         <Route path="/Signup" element={<Signup/>}/>  
              <Route path="/profile" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <ProfilePage/>
                </ProtectedRoute>
              }/>
          <Route path="/shop-create" element={<ShopCreatePage />} />
          <Route path="/shop-login" element={<ShopLoginPage />} />
          <Route path="/shop/preview/:id" element={<ShopPreviewPage />} />
          
           <Route
          path="/checkout"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="/payment" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Elements stripe={stripePromise}>
                <PaymentPage cardPaymentsEnabled={cardPaymentsEnabled}/>
              </Elements>
            </ProtectedRoute>
          } />
          <Route path="/shop/:id" 
          element={
            <SellerProtectedRoute>
              <ShopHomePage/>
            </SellerProtectedRoute>
          } />
           <Route path="/dashboard-create-product" 
          element={
            <SellerProtectedRoute>
              <ShopCreateProduct/>
            </SellerProtectedRoute>
          } />
           <Route
          path="/dashboard-products"
          element={
            <SellerProtectedRoute>
              <ShopAllProducts />
            </SellerProtectedRoute>
          }
        />
        <Route
          path="/dashboard-orders"
          element={
            <SellerProtectedRoute>
              <ShopAllOrders/>
            </SellerProtectedRoute>
          }
        />
           <Route
          path="/order/:id"
          element={
            <SellerProtectedRoute>
              <ShopOrderDetails />
            </SellerProtectedRoute>
          }
        />
         <Route
          path="/settings"
          element={
            <SellerProtectedRoute>
              <ShopSettingsPage />
            </SellerProtectedRoute>
          }
        />
         <Route
          path="/dashboard-create-event"
          element={
            <SellerProtectedRoute>
              <ShopCreateEvents />
            </SellerProtectedRoute>
          }
        />
         <Route
          path="/dashboard-events"
          element={
            <SellerProtectedRoute>
              <ShopAllEvents />
            </SellerProtectedRoute>
          }
        />
           <Route
          path="/dashboard-coupouns"
          element={
            <SellerProtectedRoute>
              <ShopAllCoupouns />
            </SellerProtectedRoute>
          }
        />
          <Route path="/dashboard" element={<ShopDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer
position="bottom-center"
autoClose={5000}
hideProgressBar={false}
newestOnTop={false}
closeOnClick={false}
rtl={false}
pauseOnFocusLoss
draggable
pauseOnHover
theme="light"
/>
    </>
  )
}

const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
)

export default App