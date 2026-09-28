const ErrorHandler=require('../utils/ErrorHandler')
const catchAsyncErrors=require('./catchAsyncErrors')
const jwt=require('jsonwebtoken')
const User=require('../model/user')
const Shop=require('../model/shop')

exports.isAuthenticated=catchAsyncErrors(async(req,res,next)=>{
    const {token}=req.cookies;

    if(!token){
        return next(new ErrorHandler("Please login to continue",401))
    }

    const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY)

    req.user=await User.findById(decoded.id)

    // A token for an account that no longer exists must not continue as
    // req.user === null, otherwise downstream handlers throw instead of 401.
    if(!req.user){
        return next(new ErrorHandler("Please login to continue",401))
    }

    next();
})

exports.isSeller=catchAsyncErrors(async(req,res,next)=>{
    const {seller_token} = req.cookies;
    if(!seller_token){
        return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);
    req.seller = await Shop.findById(decoded.id);

    if(!req.seller){
        return next(new ErrorHandler("Seller not found", 401));
    }

    next();
});

exports.isAdmin=(...roles)=>catchAsyncErrors(async(req,res,next)=>{
    const {token}=req.cookies;

    if(!token){
        return next(new ErrorHandler("Please login to continue",401))
    }

    const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY)
    req.user=await User.findById(decoded.id)

    if(!req.user || !roles.includes(req.user.role)){
        return next(new ErrorHandler("You are not authorized",403))
    }

    next();
})
