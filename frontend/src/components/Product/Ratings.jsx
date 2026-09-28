import React from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

const Ratings = ({ rating = 0 }) => {
  const filledStars = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

  return (
    <span
      className="inline-flex items-center gap-0.5 text-yellow-400"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) =>
        index < filledStars ? (
          <AiFillStar key={index} aria-hidden="true" />
        ) : (
          <AiOutlineStar key={index} aria-hidden="true" />
        )
      )}
    </span>
  );
};

export default Ratings;
