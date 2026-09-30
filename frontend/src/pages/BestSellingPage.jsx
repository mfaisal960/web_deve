import React, { useMemo } from 'react'
import Header from '../components/Login/Layout/Header'
import { bestSellingData } from '../static/data'
import ProductCard from '../components/Route/Hero/ProductCard/ProductCard'

const BestSellingPage= () => {

  const data = useMemo(
    () =>
      bestSellingData
        ? [...bestSellingData].sort((a, b) => b.total_sell - a.total_sell)
        : [],
    []
  )

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Best Selling items
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Explore our latest and best-selling products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {
            data && data.map((i, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-3"
              >
                <ProductCard data={i} />
              </div>
            ))
          }
        </div>

        {/* Empty State */}
       
      </div>
    </div>
  )
}

export default BestSellingPage
