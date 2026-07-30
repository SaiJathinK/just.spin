
import { glassCard, blue, cyan } from "../constants/theme";

export default function PlaceCard({ place, isSpinResult, onReview, onSpin, onGallery }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={glassCard}>
      <div className="px-4 pt-4 pb-1">
        <span className="text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider" style={{ background: isSpinResult ? blue : cyan }}>{isSpinResult ? "Your Pick" : "Top Pick"}</span>
      </div>
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1">
          <h2 className="text-white font-black text-xl leading-tight mb-2">{place.name}</h2>
          <p className="text-sm mb-1" style={{ color: "#06B6D4" }}>
            {place.rating} stars {place.totalRatings > 0 && <span className="text-white opacity-40">({place.totalRatings})</span>} · {place.type} · {place.price}
          </p>
          <p className="text-white opacity-50 text-xs mb-4">{place.area}</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => window.open(place.mapsUrl, "_blank")} className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: cyan }}>View on Map</button>
            <button onClick={() => onReview(place)} className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: blue }}>Reviews</button>
          </div>
        </div>
        <button onClick={() => onGallery(place)} className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center text-5xl flex-shrink-0 relative group" style={{ background: "rgba(255,255,255,0.08)" }}>
          {place.photo ? <img src={place.photo} alt={place.name} className="w-full h-full object-cover" /> : <span>{place.emoji}</span>}
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-all" style={{ background: "rgba(0,0,0,0.5)" }}>
            <span className="text-white text-xs font-bold">Photos</span>
          </div>
        </button>
      </div>
    </div>
  );
}
