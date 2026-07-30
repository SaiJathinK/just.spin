import { useState, useEffect } from "react";
import { colors } from "../constants/theme";
import { CITY_COORDS } from "../data/cityCoords";
import weatherBg from "../assets/weather-bg.jpg";

// Rough mapping from Open-Meteo's weather codes to a label (icon rendered separately).
function describeWeatherCode(code) {
  if (code === 0) return { label: "Clear" };
  if ([1, 2].includes(code)) return { label: "Partly cloudy" };
  if (code === 3) return { label: "Cloudy" };
  if ([45, 48].includes(code)) return { label: "Foggy" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rainy" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow" };
  if ([95, 96, 99].includes(code)) return { label: "Storm" };
  return { label: "—" };
}

// A soft fluffy white cloud icon.
function CloudIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,.35))" }}>
      <path d="M35 34H14a8 8 0 1 1 1.2-15.9A10 10 0 0 1 34 21a6.5 6.5 0 0 1 1 13z" fill="#FFFFFF" />
    </svg>
  );
}

export default function WeatherBox({ cityName }) {
  const [weather, setWeather] = useState(null); // { tempC, label } | "error" | null (loading)
  const coords = CITY_COORDS[cityName] || CITY_COORDS.Bengaluru;

  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`
        );
        const data = await res.json();
        const cw = data?.current_weather;
        if (!cancelled && cw) {
          setWeather({ tempC: Math.round(cw.temperature), ...describeWeatherCode(cw.weathercode) });
        } else if (!cancelled) {
          setWeather("error");
        }
      } catch (err) {
        console.warn("WeatherBox: fetch failed", err);
        if (!cancelled) setWeather("error");
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [coords.lat, coords.lon]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 flex flex-col justify-center min-h-[150px]"
      style={{
        backgroundImage: `url(${weatherBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: `10px solid ${colors.accent}55`,
        borderRadius: "20px",
        boxShadow: "0 12px 40px rgba(0,0,0,.35), 0 0 30px rgba(17,213,255,.06)",
      }}
    >
      {/* Dark/cyan overlay so the text stays readable over the photo — remove this div for the raw photo look */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(11,18,32,.55), rgba(11,18,32,.35))" }}
        aria-hidden="true"
      />

      <p className="relative text-xs font-bold uppercase tracking-widest mb-2" style={{ color: colors.accent }}>
        Weather
      </p>
      {weather === null && <div className="relative h-6 w-20 rounded bg-white/10 animate-pulse mt-1" />}
      {weather === "error" && <p className="relative text-white opacity-50 text-sm">Unavailable</p>}
      {weather && weather !== "error" && (
        <>
          <p className="relative flex items-center gap-2 text-white font-black text-2xl leading-tight">
            <CloudIcon />
            {weather.tempC}°C
          </p>
          <span className="relative block text-sm font-medium mt-1" style={{ color: colors.textSecondary }}>{weather.label}</span>
        </>
      )}
    </div>
  );
}
