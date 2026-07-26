import { useNavigate } from "react-router-dom";

/**
 * CitySwitcher
 * Small row of circular city avatars sitting at the bottom of the left
 * hero panel, so users can jump to another city without scrolling up to
 * the back button. Reuses the exact same navigate(`/city/${name}`) logic
 * your Home.jsx city cards already use, and the same locked/soon treatment.
 *
 * cityData shape expected: { [cityName]: { images: [...], locked: bool } }
 */
export default function CitySwitcher({ cityData, currentCity }) {
  const navigate = useNavigate();
  const cityNames = Object.keys(cityData);

  return (
    <div className="flex items-center gap-3 mt-4 px-1">
      {cityNames.map((name) => {
        const city = cityData[name];
        const isCurrent = name === currentCity;
        return (
          <button
            key={name}
            type="button"
            disabled={city.locked}
            onClick={() => !city.locked && navigate(`/city/${name}`)}
            aria-label={city.locked ? `${name} — coming soon` : `Switch to ${name}`}
            className={`relative flex-shrink-0 transition-all duration-200 rounded-full ${
              city.locked ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400`}
          >
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${city.images[0]})`,
                opacity: city.locked ? 0.35 : 1,
                boxShadow: isCurrent ? "0 0 0 2px #06B6D4" : "0 0 0 1px rgba(255,255,255,0.2)",
              }}
            />
            {city.locked && (
              <span className="absolute -bottom-1 -right-1 text-[10px] bg-black/70 rounded-full w-4 h-4 flex items-center justify-center">
                🔒
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
