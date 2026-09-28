import React from 'react'
import DashboardHeader from '../../components/Shop/Layout/DashboardHeader'
import DashboardSideBar from '../../components/Shop/Layout/DashboardSideBar'
import OrderDetails from '../../components/Shop/OrderDetails'

const ShopOrderDetails = () => {
  return (
        <div>
            <DashboardHeader />
            <div className="flex justify-between w-full">
                <div className="w-20 800px:w-[330px]">
                  <DashboardSideBar active={2} />
                </div>
                <div className="w-full justify-center flex">
                   <OrderDetails />
                </div>
              </div>
        </div>
  )
}

export default ShopOrderDetails
