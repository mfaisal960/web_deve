import React, { useState } from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

// The read-only <Ratings /> row shows a rating, this one collects it, so it is
// kept separate rather than given an onClick: every other caller renders it as
// a label, and a clickable star row inside a product card would be a trap.
const StarRatingInput = ({ value, onChange, disabled = false, label }) => (
  <div
    className="flex items-center gap-1"
    role="radiogroup"
    aria-label={label}
  >
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = star <= value;
      const Icon = filled ? AiFillStar : AiOutlineStar;

      return (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`text-2xl leading-none transition-transform ${
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:scale-110"
          }`}
        >
          <Icon
            className={filled ? "text-yellow-400" : "text-gray-300"}
            aria-hidden="true"
          />
        </button>
      );
    })}
  </div>
);

// The form is a modal rather than an inline row because a comment box and a star
// picker do not fit beside a price, and the order items list is a table-like
// stack where an expanding row would reflow everything below it.
const ReviewFormModal = ({
  productId,
  productName,
  orderId,
  onClose,
  onSubmit,
  submitting = false,
  error = null,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (rating === 0) return;

    onSubmit({ productId, orderId, rating, comment: comment.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Review this item
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-xl leading-none text-gray-400 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <p className="line-clamp-2 text-sm text-gray-600">{productName}</p>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Your rating
              <span className="ml-1 text-red-500">*</span>
            </p>

            <StarRatingInput
              value={rating}
              onChange={setRating}
              disabled={submitting}
              label="Your rating"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="review-comment"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Your review
              <span className="ml-1 text-red-500">*</span>
            </label>

            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={submitting}
              rows={4}
              required
              maxLength={1000}
              placeholder="What did you think of this item?"
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#e94560] focus:ring-2 focus:ring-[#e94560]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              // A rating of 0 is not a review, so the button stays disabled
              // until a star is picked rather than accepting the submission and
              // letting the server refuse it.
              disabled={submitting || rating === 0 || !comment.trim()}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                submitting || rating === 0 || !comment.trim()
                  ? "cursor-not-allowed bg-gray-300"
                  : "cursor-pointer bg-[#e94560] hover:bg-[#d63a52]"
              }`}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewFormModal;
