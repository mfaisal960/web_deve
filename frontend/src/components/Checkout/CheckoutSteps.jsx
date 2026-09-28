
import React from "react";

const CheckoutSteps = ({ active }) => {
  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-[90%] sm:w-[70%] lg:w-1/2 flex items-center justify-center">
        {/* Step 1 */}
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center h-10 px-4 rounded-full font-semibold text-sm whitespace-nowrap transition-colors duration-200 ${
              active > 1
                ? "bg-[#f63b60] text-white"
                : "bg-[#FDE1E6] text-[#f63b60]"
            }`}
          >
            1. Shipping
          </div>

          <div
            className={`w-8 sm:w-12 lg:w-[70px] h-1 mx-2 rounded-full transition-colors duration-200 ${
              active > 1 ? "bg-[#f63b60]" : "bg-[#FDE1E6]"
            }`}
          />
        </div>

        {/* Step 2 */}
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center h-10 px-4 rounded-full font-semibold text-sm whitespace-nowrap transition-colors duration-200 ${
              active > 1
                ? "bg-[#f63b60] text-white"
                : "bg-[#FDE1E6] text-[#f63b60]"
            }`}
          >
            2. Payment
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-center">
          <div
            className={`w-8 sm:w-12 lg:w-[70px] h-1 mx-2 rounded-full transition-colors duration-200 ${
              active > 2 ? "bg-[#f63b60]" : "bg-[#FDE1E6]"
            }`}
          />

          <div
            className={`flex items-center justify-center h-10 px-4 rounded-full font-semibold text-sm whitespace-nowrap transition-colors duration-200 ${
              active > 2
                ? "bg-[#f63b60] text-white"
                : "bg-[#FDE1E6] text-[#f63b60]"
            }`}
          >
            3. Success
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSteps;