import { useState, useEffect, useRef } from "react";
import { getPlacePhotos } from "../services/places";
import { cyan } from "../constants/theme";
import ImageFlip from "./ImageFlip";
import Coverflow from "./Coverflow";

export default function PhotoGallery({ place, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flipApiRef = useRef(null);

  useEffect(() => {
    async function fetchPhotos() {
      const imgs = await getPlacePhotos(place.placeId);
      setPhotos(imgs);
      setLoading(false);
    }
    fetchPhotos();
  }, [place.placeId]);

  const flipImages = photos.map((src) => ({ image: { src }, focusY: 50 }));
  const coverflowSlides = photos.map((src) => ({ image: { src } }));

  const goTo = (i) => {
    setActiveIndex(i);
    flipApiRef.current?.goTo(i);
  };
  const prev = () => goTo(activeIndex === 0 ? photos.length - 1 : activeIndex - 1);
  const next = () => goTo(activeIndex === photos.length - 1 ? 0 : activeIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.95)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl overflow-y-auto flex flex-col"
        style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between border-b border-white border-opacity-10 shrink-0">
          <div>
            <h2 className="text-white font-black text-lg">{place.name}</h2>
            <p className="text-white opacity-40 text-xs">{photos.length} photos</p>
          </div>
          <button onClick={onClose} className="text-white opacity-50 hover:opacity-100 text-xl font-bold">X</button>
        </div>

        {/* Main viewer — flips between photos with a 3D card-flip animation. Click left/right half to flip. */}
        <div className="relative w-full shrink-0" style={{ height: "280px" }}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-white opacity-40">Loading photos...</p>
            </div>
          ) : photos.length > 0 ? (
            <ImageFlip images={flipImages} fit="cover" rounded={0} tilt apiRef={flipApiRef} style={{ height: "280px" }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-white opacity-40">No photos available</p>
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold z-10" style={{ background: "rgba(0,0,0,0.6)" }}>←</button>
              <button onClick={next} className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold z-10" style={{ background: "rgba(0,0,0,0.6)" }}>→</button>
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-white text-xs font-bold z-10" style={{ background: "rgba(0,0,0,0.6)" }}>{activeIndex + 1} / {photos.length}</div>
            </>
          )}
        </div>

        {/* Thumbnail strip — 3D coverflow, click any card to jump the main viewer to it.
            Boxed with its own overflow:hidden so the coverflow's 3D transforms can never
            escape this slot and drift toward the button below. */}
        {photos.length > 1 && (
          <div className="relative w-full shrink-0 overflow-hidden" style={{ height: "110px" }}>
            <Coverflow
              slides={coverflowSlides}
              cardWidth={90}
              cardHeight={90}
              radius={6}
              tilt={20}
              sideTilt={4}
              gap={4}
              opacity={45}
              showTitle={false}
              activeIndex={activeIndex}
              onActiveChange={goTo}
            />
          </div>
        )}

        <div className="p-4 pt-2 shrink-0">
          <button onClick={() => window.open(place.mapsUrl, "_blank")} className="w-full py-3 rounded-2xl text-white font-bold text-sm" style={{ background: cyan }}>View on Map</button>
        </div>
      </div>
    </div>
  );
}
