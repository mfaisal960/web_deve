import React from 'react'
import CheckoutSteps from '../components/Checkout/CheckoutSteps'
import Footer from '../components/Login/Layout/Footer'
import Header from '../components/Login/Layout/Header'
import Payment from "../components/Payment/Payment";

const PaymentPage = ({ cardPaymentsEnabled = false }) => {
  return (
    <div className='w-full min-h-screen bg-[#f6f9fc]'>
       <Header />
       <br />
       <br />
       <CheckoutSteps active={2} />
       <Payment cardPaymentsEnabled={cardPaymentsEnabled} />
       <br />
       <br />
       <Footer />
    </div>
  )
}

export default PaymentPage