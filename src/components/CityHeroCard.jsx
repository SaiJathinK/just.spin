import { useState } from "react";
import LiveStat from "./LiveStat";

export default function CityHeroCard({ cityName, tagline, images = [], onQuickExplore }) {
  const [imgIndex, setImgIndex] = useState(0);
  const currentImage = images[imgIndex];

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ aspectRatio: "3 / 4", background: "#1E293B", minHeight: "420px" }}
    >
      {/* Background image, falls back to the next image in the array if one is dead */}
      {currentImage && (
        <img
          src={currentImage}
          alt={cityName}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => {
            console.warn("Image failed, trying next:", currentImage);
            setImgIndex((i) => (i + 1 < images.length ? i + 1 : i));
          }}
        />
      )}
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
        }}
      />
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p
          className="text-sm font-bold uppercase tracking-widest mb-1"
          style={{ color: "#F59E0B" }}
        >
          Explore
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
          {cityName}
        </h2>
        <p className="text-white opacity-70 text-sm">{tagline}</p>
        <LiveStat city={cityName} type="placeCount" />

        {/* Interactive shortcut pill — pre-selects Nature + Heritage in the
            filter panel and smooth-scrolls the user straight to it. Reuses
            the parent's existing category state via onQuickExplore, so
            there's no separate filtering logic living here. */}
        {onQuickExplore && (
          <button
            type="button"
            onClick={onQuickExplore}
            aria-label="Explore Nature and Heritage places"
            className="mt-3 inline-flex items-center gap-2 rounded-full backdrop-blur-sm px-4 py-2 text-sm text-white transition-all duration-300 ease-out hover:scale-[1.03] hover:brightness-110 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            🌿 Nature, Culture &amp; Unforgettable Experiences
          </button>
        )}
      </div>
    </div>
  );
}
