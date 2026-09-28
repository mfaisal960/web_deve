import React, { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import ProductCard from '../ProductCard/ProductCard'

const BestDeals = () => {
  const { allProducts } = useSelector((state) => state.products)

  const data = useMemo(() => {
    const products = allProducts || []

    // Highest discount first, so "Best Deals" reflects real shop inventory.
    return [...products]
      .sort((a, b) => discount(b) - discount(a))
      .slice(0, 5)
  }, [allProducts])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <section className="my-10 px-4 md:px-8 lg:px-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Best Deals</h2>
        <p className="text-sm text-gray-500">Top selling products this week</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {data?.map((item, index) => (
          <ProductCard data={item} key={item._id || index} />
        ))}
      </div>
    </section>
  )
}

function discount(product) {
  const original = product?.originalPrice ?? product?.price ?? 0
  const current = product?.discountPrice ?? product?.discount_price ?? 0

  return original > 0 ? (original - current) / original : 0
}

export default BestDeals 
