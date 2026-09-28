
import React from "react";
import { useLocation } from "react-router-dom";
import ShopInfo from "../../components/Shop/ShopInfo";
import ShopProfileData from "../../components/Shop/ShopProfileData";

const ShopPreviewPage = () => {
  const { state } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* Shop Information Sidebar */}
          <aside className="w-full lg:sticky lg:top-6 lg:w-[28%]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="max-h-none overflow-y-visible lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
              <ShopInfo isOwner={false} initialShop={state?.shop} />
              </div>
            </div>
          </aside>

          {/* Shop Profile Content */}
          <main className="w-full lg:w-[72%]">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ShopProfileData isOwner={false} />
            </div>
          </main>

        </div>
      </div>
    </div>
  );
};

export default ShopPreviewPage;
