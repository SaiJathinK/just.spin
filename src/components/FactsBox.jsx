import { useState, useEffect } from "react";
import { colors } from "../constants/theme";
import { CITY_FACTS } from "../data/cityFacts";
import brigadeRoadBg from "../assets/brigade_road.png";
import skylineBg from "../assets/skyline.png";
import vidhanaSoudhaBg from "../assets/vidhana_soudha.png";
import whitefieldBg from "../assets/whitefield.png";

// Cycles through these in order as the fact changes.
// Tweak `position` per image to adjust framing — any valid CSS background-position value.
const FACT_IMAGES = [
  { src: brigadeRoadBg, position: "30% 70%" },
  { src: skylineBg, position: "70% 30%" },
  { src: vidhanaSoudhaBg, position: "50% 50%" },
  { src: whitefieldBg, position: "60% 40%" },
];

export default function FactsBox({ cityName }) {
  const facts = CITY_FACTS[cityName] || CITY_FACTS.Bengaluru;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % facts.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [facts.length]);

  // Cycles through the images even if there are fewer images than facts.
  const currentImage = FACT_IMAGES[index % FACT_IMAGES.length];

  return (
    <div
      key={index}
      className="relative overflow-hidden rounded-2xl p-4 flex flex-col justify-center min-h-[150px] animate-[factFade_600ms_ease-in]"
      style={{
        backgroundImage: `url(${currentImage.src})`,
        backgroundSize: "cover",
        backgroundPosition: currentImage.position,
        border: `10px solid ${colors.accent}55`,
        borderRadius: "20px",
        boxShadow: "0 12px 40px rgba(0,0,0,.35), 0 0 30px rgba(17,213,255,.06)",
      }}
    >
      {/* Dark fade so text stays readable over the full-size background image */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(4,16,31,.85) 0%, rgba(4,16,31,.55) 55%, rgba(4,16,31,.3) 100%)" }}
        aria-hidden="true"
      />

      <p className="relative text-5xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.accent }}>
        Did you know?
      </p>
    <p className="relative text-xs leading-snug font-bold" style={{ color: "#FFFFFF", lineHeight: 1.5 }}>
  {facts[index]}
</p>
    </div>
  );
}
