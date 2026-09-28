import React from 'react'
import { useSelector } from "react-redux";
import EventCard from "./EventCard";

const Event = () => {
  const { allEvents = [] } = useSelector((state) => state.events);

  return (
    <section className="w-full bg-[#f5f5f5] py-8 md:py-10">
      <div className="w-[96%] md:w-[94%] lg:w-[92%] mx-auto">
        
        {/* Heading */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#222222]">
            Popular Events
          </h1>
        </div>

        {/* Event Cards */}
        <div className="space-y-6">
          {allEvents.map((event) => (
            <EventCard key={event._id || event.id} data={event} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Event
