import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Login/Layout/Header";
import ProfileSideBar from "../components/Profile/ProfileSidebar";
import ProfileContent from "../components/Profile/ProfileContent";
import { useSelector } from "react-redux";

const ProfilePage = () => {
  const { loading } = useSelector((state) => state.user);
  const [searchParams] = useSearchParams();

  // The sidebar tabs are numbered and the tab is not in the path, so a page
  // outside /profile (the order confirmation, the order detail page) could not
  // send the buyer to their orders — it always opened on the profile form.
  // `?tab=` carries the tab number across.
  const [active, setActive] = useState(() => {
    const requested = Number(searchParams.get("tab"));

    return Number.isInteger(requested) && requested >= 1 && requested <= 7
      ? requested
      : 1;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center text-gray-600">
          Loading...
        </div>
      ) : (
        <>
          {/* Header */}
          <Header />

          {/* Main Profile Section */}
          <main className="w-full bg-gray-100 py-6 sm:py-8 lg:py-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">

              {/* Sidebar */}
              <aside className="w-full flex-shrink-0 lg:sticky lg:top-24 lg:w-[280px] lg:self-start">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <ProfileSideBar
                    active={active}
                    setActive={setActive}
                  />
                </div>
              </aside>

              {/* Profile Content */}
              <section className="min-w-0 flex-1">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <ProfileContent active={active} />
                </div>
              </section>

            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default ProfilePage;