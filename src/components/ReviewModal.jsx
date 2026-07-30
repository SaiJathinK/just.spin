import { useState, useEffect } from "react";
import { getPlaceDetails } from "../services/places";
import { blue, cyan } from "../constants/theme";

export default function ReviewModal({ place, onClose }) {
  const [reviews, setReviews] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [userReview, setUserReview] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [userReviews, setUserReviews] = useState([]);

  useEffect(() => {
    async function fetchReviews() {
      const details = await getPlaceDetails(place.placeId);
      setReviews(details?.reviews || []);
      setLoadingReviews(false);
    }
    fetchReviews();
  }, [place.placeId]);

  const handleSubmitReview = () => {
    if (!userReview.trim()) return;
    setUserReviews([{ author_name: "You", rating: userRating, text: userReview }, ...userReviews]);
    setUserReview("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "#0F172A", border: "1px solid rgba(37,99,235,0.3)", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-white border-opacity-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-black text-xl mb-1">{place.name}</h2>
              <p className="text-sm" style={{ color: "#06B6D4" }}>{place.rating} stars · {place.totalRatings} reviews</p>
            </div>
            <button onClick={onClose} className="text-white opacity-50 text-xl font-bold ml-4">X</button>
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
          <div className="p-5 border-b border-white border-opacity-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06B6D4" }}>Write Your Review</p>
            <div className="flex gap-2 mb-3">
              {[1,2,3,4,5].map((star) => (
                <button key={star} onClick={() => setUserRating(star)} className="text-3xl" style={{ color: star <= userRating ? "#FFD700" : "#4B5563" }}>★</button>
              ))}
            </div>
            <textarea value={userReview} onChange={(e) => setUserReview(e.target.value)} placeholder="Share your experience..." rows={3} className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none resize-none mb-3" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
            <button onClick={handleSubmitReview} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: submitted ? "rgba(16,185,129,0.8)" : blue }}>{submitted ? "Submitted!" : "Submit Review"}</button>
          </div>
          {userReviews.length > 0 && (
            <div className="p-5 border-b border-white border-opacity-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06B6D4" }}>Your Reviews</p>
              {userReviews.map((r, i) => (
                <div key={i} className="rounded-xl p-4 mb-2" style={{ background: "rgba(37,99,235,0.15)" }}>
                  <p className="text-white text-sm font-bold">You — {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? "#FFD700" : "#4B5563" }}>★</span>)}</p>
                  <p className="text-white opacity-70 text-sm mt-1">{r.text}</p>
                </div>
              ))}
            </div>
          )}
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06B6D4" }}>Google Reviews</p>
            {loadingReviews ? <p className="text-white opacity-50 text-sm text-center py-6">Loading...</p> : reviews && reviews.length > 0 ? reviews.map((r, i) => (
              <div key={i} className="rounded-xl p-4 mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: cyan }}>{r.author_name?.charAt(0)}</div>
                  <div>
                    <p className="text-white text-sm font-bold">{r.author_name}</p>
                    <p className="text-xs">{[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? "#FFD700" : "#4B5563" }}>★</span>)} <span className="text-white opacity-40">{r.relative_time_description}</span></p>
                  </div>
                </div>
                <p className="text-white opacity-70 text-sm">{r.text}</p>
              </div>
            )) : <p className="text-white opacity-50 text-sm text-center py-6">No reviews found</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
