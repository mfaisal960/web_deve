const sendShopToken = (seller, statusCode, res) => {
  const token = seller.getJwtToken();

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  // The seller document is handed to us straight from a .select("+password")
  // query or from Shop.create(), so it still carries the bcrypt hash. Returning
  // it would leak it to the browser, and returning the raw token as well would
  // defeat the httpOnly cookie. Same sanitising as routes/user.js.
  const sellerResponse = seller.toObject ? seller.toObject() : { ...seller };
  delete sellerResponse.password;

  res.status(statusCode).cookie("seller_token", token, options).json({
    success: true,
    seller: sellerResponse,
  });
};

module.exports = sendShopToken;