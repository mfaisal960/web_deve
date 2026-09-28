import { configureStore } from '@reduxjs/toolkit'
import { userReducer } from './reducers/user'
import { cartReducer } from './reducers/cart'
import { wishlistReducer } from './reducers/wishlist'
import { productReducer } from './reducers/products'
import { eventReducer } from './reducers/events'
import { orderReducer } from './reducers/order'
import { sellerReducer } from './reducers/seller'



const Store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    products: productReducer,
    events: eventReducer,
    order: orderReducer,
    seller: sellerReducer,

  },
})

export default Store
