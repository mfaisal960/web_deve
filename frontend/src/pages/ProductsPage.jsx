import React, { useEffect, useMemo } from 'react'
import Header from '../components/Login/Layout/Header'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getAllProducts } from '../redux/actions/product'
import ProductCard from '../components/Route/Hero/ProductCard/ProductCard'

const ProductsPage = () => {
  const [searchParams] = useSearchParams()
  const categoryData = searchParams.get("category")

  const dispatch = useDispatch()
  const { allProducts } = useSelector((state) => state.products)

  useEffect(() => {
    if (!allProducts?.length) {
      dispatch(getAllProducts())
    }
  }, [dispatch, allProducts?.length])

  // The listing is derived from the store, newest first, so it can never go out
  // of sync with the products slice.
  const data = useMemo(() => {
    const products = allProducts || []

    const sorted = [...products].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )

    return categoryData === null
      ? sorted
      : sorted.filter((item) => item.category === categoryData)
  }, [categoryData, allProducts])

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {categoryData ? `${categoryData} Products` : 'All Products'}
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
                key={i._id || index} 
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-3"
              >
                <ProductCard data={i} />
              </div>
            ))
          }
        </div>

        {/* Empty State */}
        {
          data && data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <h1 className="text-2xl font-semibold text-gray-700">
                No Products Found
              </h1>
              <p className="text-gray-500 mt-2">
                Try another category or check back later.
              </p>
            </div>
          ) : null
        }
      </div>
    </div>
  )
}
export default ProductsPage
