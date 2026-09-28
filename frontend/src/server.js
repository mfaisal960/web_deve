export const server = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v2";
const backend_url = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/";
export default backend_url

const backendOrigin = backend_url.replace(/\/$/, "");

// Uploads are stored as root-relative paths (e.g. "/uploads/products/x.jpg")
// unless Cloudinary is configured, so they must be resolved against the
// backend origin. Absolute URLs and data URIs are passed through untouched.
export const resolveImageUrl = (url) => {
  if (typeof url !== "string" || url === "") {
    return "";
  }

  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }

  return url.startsWith("/") ? `${backendOrigin}${url}` : url;
};