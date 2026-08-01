import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { searchPlaces } from "../services/places";
import { useAuth } from "../context/AuthContext";

import { cityData } from "../data/cityData";
import { cityPlans } from "../data/cityPlans";
import { glassCard, blue, cyan, colors, accentGlow } from "../constants/theme";

import WeatherBox from "../components/WeatherBox";
import WaterButton from "../components/WaterButton";
import FactsBox from "../components/FactsBox";
import PhotoGallery from "../components/PhotoGallery";
import ReviewModal from "../components/ReviewModal";
import PlanModal from "../components/PlanModal";
import PlaceCard from "../components/PlaceCard";

export default function CityPage() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const { user, authLoading, login, logout } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const city = cityData[cityName] || cityData.Bengaluru;
  const allPlans = cityPlans[cityName] || [];

  const [mode, setMode] = useState("spin");
  // Toggles which single action button is shown: false = "Spin The Wheel", true = "Find My Spot"
  const [useFindMode, setUseFindMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [foodVeg, setFoodVeg] = useState(null);
  const [foodCuisine, setFoodCuisine] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // Discover mode filters — narrow down the static day-plan list by
  // duration, vibe and proximity (AND across groups, single-select each,
  // click-again-to-clear — same toggle pattern as foodVeg/foodCuisine).
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [selectedProximity, setSelectedProximity] = useState(null);

  const durationOptions = ["Half-day", "Full-day", "Quick getaway (under 3 hours)"];
  const vibeOptions = ["Nature & Outdoors", "Heritage & Culture", "Food & Trails", "Wildlife & Adventure"];
  const proximityOptions = ["Within City Center", "Outskirts / Road Trip"];

  const plans = allPlans.filter((plan) => {
    if (selectedDuration && plan.duration !== selectedDuration) return false;
    if (selectedVibe && plan.vibe !== selectedVibe) return false;
    if (selectedProximity && plan.proximity !== selectedProximity) return false;
    return true;
  });

  // Ref for the "Where do you want to go?" filter panel — used to smooth-scroll
  // into view when a Hero Card shortcut (like the category tag) is clicked.
  const filterPanelRef = useRef(null);
  // Briefly true right after a shortcut pre-selects chips, so we can pulse/highlight
  // them and make it obvious to the user what just changed.
  const [justHighlighted, setJustHighlighted] = useState(false);

  // Reusable shortcut handler — pre-selects the given categories (reusing the
  // exact same setSelectedCategories state the manual chip clicks already use,
  // so there's no duplicated filtering logic anywhere), then smooth-scrolls
  // the filter panel into view and triggers a brief highlight pulse.
  // eslint-disable-next-line no-unused-vars
  function quickExplore(categoryLabels) {
    setMode("spin");
    setSelectedCategories(categoryLabels.slice(0, 3)); // respect the existing 3-category cap
    setJustHighlighted(true);

    // Smooth scroll to the filter panel, positioned comfortably near the top
    filterPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // Clear the highlight pulse after the animation has had time to play
    setTimeout(() => setJustHighlighted(false), 1600);
  }

  // Called when a circular spot thumbnail is clicked — uses that place as a
  // "near" seed for a fresh spin. Reuses handleSpin's existing area-override
  // param (searchCity becomes "<placeName> <cityName>"), so Google's own
  // text-search relevance does the "find things near this place" work —
  // no new proximity/geo code needed here.
  // eslint-disable-next-line no-unused-vars
  function spinNearPlace(placeName) {
    setMode("spin");
    filterPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    handleSpin(placeName);
  }


  const [selectedLocation, setSelectedLocation] = useState("Anywhere in Bangalore");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setLocationDropdownOpen(false);
        setLocationSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewPlace, setReviewPlace] = useState(null);
  const [galleryPlace, setGalleryPlace] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);



  const categories = [
    { label: "Nature", emoji: "🌿" },
    { label: "Food", emoji: "🍽️" },
    { label: "Heritage", emoji: "🏛️" },
    { label: "Experiences", emoji: "🍷" },
    { label: "Adventure", emoji: "🏕️", locked: true },
    { label: "Spiritual", emoji: "🛕", locked: true },
    { label: "Entertainment", emoji: "🎮", locked: true },
  ];

  const budgets = ["Under 1000", "1000-2500", "2500+"];

  const bangaloreLocations = [
    "Anywhere in Bangalore", "Koramangala", "Indiranagar", "MG Road",
    "Brigade Road", "Jayanagar", "JP Nagar", "HSR Layout", "Whitefield",
    "Electronic City", "Marathahalli", "Bellandur", "Sarjapur Road",
    "Bannerghatta Road", "Hebbal", "Yelahanka", "Rajajinagar", "Malleswaram",
    "Basavanagudi", "BTM Layout", "Vijaya Nagar", "Cunningham Road",
    "Lavelle Road", "UB City", "Residency Road", "Old Airport Road",
    "Domlur", "HAL", "Brookefield", "Kadugodi", "KR Puram", "Nagarbhavi",
    "Kengeri", "Tumkur Road", "Yeshwanthpur", "Peenya", "RT Nagar",
    "Banaswadi", "CV Raman Nagar", "Frazer Town",
  ];



  const distanceKm = (lat1, lng1, lat2, lng2) => {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Tries the place area first, then a broader "near <area>" search, then the whole city.
  // Returns { list, forced } where `forced` is the single most-famous pick when the
  // category didn't exist locally and we had to widen the search.
  const getCategoryCandidates = async (cat, budget, searchCity, cityWide, foodFilters) => {
    const local = await searchPlaces(cat, budget, searchCity, false, foodFilters);
    if (local.length > 0) return { list: local, forced: null };

    const near = await searchPlaces(cat, budget, searchCity, true, foodFilters);
    if (near.length > 0) {
      const famous = [...near].sort((a, b) => (b.rating * (b.totalRatings || 1)) - (a.rating * (a.totalRatings || 1)))[0];
      return { list: near, forced: famous };
    }

    const cityList = await searchPlaces(cat, budget, cityWide, false, foodFilters);
    if (cityList.length > 0) {
      const famous = [...cityList].sort((a, b) => (b.rating * (b.totalRatings || 1)) - (a.rating * (a.totalRatings || 1)))[0];
      return { list: cityList, forced: famous };
    }
    return { list: [], forced: null };
  };

  const handleFind = async () => {
    setSearched(true); setSpinResult(null); setResults([]); setLoading(true);
    try {
      const searchCity = selectedLocation === "Anywhere in Bangalore" ? cityName : selectedLocation + " " + cityName;
      const foodFilters = { veg: foodVeg, cuisine: foodCuisine };
      if (selectedCategories.length > 1) {
        const lists = await Promise.all(selectedCategories.map((cat) => searchPlaces(cat, selectedBudget, searchCity, false, foodFilters)));
        const combined = lists.flat().sort(() => Math.random() - 0.5);
        setResults(combined);
      } else {
        const data = await searchPlaces(selectedCategories[0] || null, selectedBudget, searchCity, false, foodFilters);
        setResults(data);
      }
    } catch (e) { setResults([]); } finally { setLoading(false); }
  };

  const handleSpin = async (areaOverride = null) => {
    setSpinning(true); setSpinResult(null); setSearched(false); setResults([]); setSelectedPlan(null);
    try {
      const searchCity = areaOverride
        ? `${areaOverride} ${cityName}`
        : (selectedLocation === "Anywhere in Bangalore" ? cityName : selectedLocation + " " + cityName);
      const areaLabel = areaOverride || (selectedLocation === "Anywhere in Bangalore" ? cityName : selectedLocation);
      const foodFilters = { veg: foodVeg, cuisine: foodCuisine };

      if (selectedCategories.length >= 2) {
        const categoryResults = await Promise.all(
          selectedCategories.map((cat) => getCategoryCandidates(cat, selectedBudget, searchCity, cityName, foodFilters))
        );
        const usable = categoryResults.map((r, i) => ({ ...r, cat: selectedCategories[i] })).filter((r) => r.list.length > 0);

        if (usable.length >= 2) {
          const forcedAnchors = usable.filter((r) => r.forced).map((r) => r.forced);
          let chosen;

          if (forcedAnchors.length > 0) {
            // At least one category doesn't exist in this area — anchor everything
            // around the nearest famous option(s), and pick the rest close to them.
            chosen = usable.map((r) => {
              if (r.forced) return r.forced;
              const sorted = [...r.list].sort((a, b) => {
                const da = Math.min(...forcedAnchors.map((f) => distanceKm(f.lat, f.lng, a.lat, a.lng)));
                const db = Math.min(...forcedAnchors.map((f) => distanceKm(f.lat, f.lng, b.lat, b.lng)));
                return da - db;
              });
              return sorted[0];
            });
          } else {
            // Everything exists locally — pick a fun random top-rated seed, then
            // chain the rest by proximity to what's already been picked.
            const topSeed = [...usable[0].list].sort((a, b) => b.rating - a.rating).slice(0, 5);
            chosen = [topSeed[Math.floor(Math.random() * topSeed.length)]];
            for (let i = 1; i < usable.length; i++) {
              const sorted = [...usable[i].list].sort((a, b) => {
                const da = Math.min(...chosen.map((c) => distanceKm(c.lat, c.lng, a.lat, a.lng)));
                const db = Math.min(...chosen.map((c) => distanceKm(c.lat, c.lng, b.lat, b.lng)));
                return da - db;
              });
              chosen.push(sorted[0]);
            }
          }

          const startHour = 10;
          const timeLabels = chosen.map((_, i) => {
            const hour24 = startHour + i * 2;
            const hour12 = ((hour24 + 11) % 12) + 1;
            const suffix = hour24 % 24 < 12 ? "AM" : "PM";
            return `${hour12}:00 ${suffix}`;
          });

          const stops = chosen.map((place, i) => {
            const wasForced = forcedAnchors.includes(place);
            return {
              time: timeLabels[i],
              place: place.name,
              type: place.category,
              note: `${place.rating}★ (${place.totalRatings}) · ${place.area}${wasForced ? ` · Closest great option outside ${areaLabel}` : ""}`,
              cost: place.price,
            };
          });

          setSelectedPlan({
            id: `spin-${Date.now()}`,
            title: "Your Custom Spin Plan",
            emoji: "🎲",
            tagline: forcedAnchors.length > 0
              ? `${selectedCategories.join(" + ")} spots — built around the closest options near ${areaLabel}`
              : `${selectedCategories.join(" + ")} spots picked close to each other`,
            color: "#06B6D4",
            budget: selectedBudget || "Mixed budget",
            stops,
          });
          setSpinning(false);
          return;
        }
      }

      const cats = ["Food", "Nature", "Heritage", "Experiences"];
      const randomCat = selectedCategories[0] || cats[Math.floor(Math.random() * cats.length)];
      const { list, forced } = await getCategoryCandidates(randomCat, selectedBudget, searchCity, cityName, foodFilters);
      if (forced) {
        setSpinResult({ ...forced, category: randomCat, type: randomCat, area: `${forced.area} · Closest option outside ${areaLabel}` });
      } else if (list.length > 0) {
        const random = list[Math.floor(Math.random() * list.length)];
        setSpinResult({ ...random, category: randomCat, type: randomCat });
      }
    } catch (e) {} finally { setSpinning(false); }
  };

  const handleReset = () => {
    setSelectedCategories([]); setSelectedBudget(null);
    setFoodVeg(null); setFoodCuisine(null);
    setSelectedLocation("Anywhere in Bangalore");
    setResults([]); setSearched(false); setSpinResult(null); setSelectedPlan(null);
    setSelectedDuration(null); setSelectedVibe(null); setSelectedProximity(null);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: colors.bg }}>

      {/* Navbar */}
      <div className="px-4 pt-4">
        <nav
          className="relative flex items-center justify-between px-4 sm:px-12 py-3 sm:py-5 bg-white rounded-full"
          style={{ boxShadow: "0 10px 35px rgba(0,0,0,.15)" }}
        >
          <button onClick={() => navigate("/")} className="text-black font-medium text-sm sm:text-lg hover:opacity-60 transition-opacity whitespace-nowrap">
            ← Back
          </button>
          <span
            className="absolute left-1/2 -translate-x-1/2 text-black font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-wide whitespace-nowrap"
          >
            Just Spin
          </span>
          {authLoading ? null : user ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-black text-white font-bold text-xs sm:text-base px-3 sm:px-4 py-2 sm:py-2.5 rounded-full whitespace-nowrap transition-all duration-[250ms] hover:scale-[1.03]"
              style={{ boxShadow: "0 10px 20px rgba(0,0,0,.18)" }}
              title="Click to log out"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </span>
              )}
              <span className="hidden sm:inline">{user.displayName?.split(" ")[0] || "Account"}</span>
            </button>
          ) : (
            <WaterButton
              label="Sign in"
              onClick={login}
              textColor="#FFFFFF"
              paddingX={24}
              paddingY={10}
              rounded={100}
              font={{ fontSize: "14px", fontWeight: 700 }}
              glass={{ tint: "rgba(0, 0, 0, 0.85)", blur: 20, frost: 20 }}
              waterAmount={25}
              waterColor="#11D5FF"
              border={false}
              shadow={false}
            />
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="flex justify-center px-4 pt-8 pb-12">
        <div className="w-full max-w-2xl">

        {/* CENTER — your existing content, unchanged */}
        <div className="w-full">

        {/* Weather + Did you know */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <WeatherBox cityName={cityName} />
          <FactsBox cityName={cityName} />
        </div>

        {/* Toggle */}
        <div className="flex gap-2 p-1 rounded-full my-4" style={glassCard}>
          <button
            onClick={() => setMode("spin")}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-[250ms]"
            style={{
              background: mode === "spin" ? blue : "transparent",
              opacity: mode === "spin" ? 1 : 0.6,
              boxShadow: mode === "spin" ? accentGlow : "none",
            }}
          >
            Spin
          </button>
          <button
            onClick={() => setMode("discover")}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-[250ms]"
            style={{
              background: mode === "discover" ? blue : "transparent",
              opacity: mode === "discover" ? 1 : 0.6,
              boxShadow: mode === "discover" ? accentGlow : "none",
            }}
          >
            🧭 Discover {cityName}
          </button>
        </div>

        <style>{`
          .press-btn {
            position: relative;
            display: inline-block;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            outline: none;
            box-shadow: none;
            margin: 0;
            font-family: inherit;
            padding: 0.55em 1.1em;
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.2px;
            color: #fff;
            background: rgba(var(--btn-rgb), 0.14);
            border: 1px solid rgba(var(--btn-rgb), 0.55);
            border-radius: 9999px;
            cursor: pointer;
            z-index: 0;
            transition: transform 150ms cubic-bezier(0,0,0.58,1), background 150ms cubic-bezier(0,0,0.58,1);
          }
          .press-btn::before {
            position: absolute;
            content: '';
            width: 100%;
            height: 100%;
            top: 0; left: 0;
            background: rgba(var(--btn-rgb), 0.35);
            border-radius: inherit;
            transform: translateY(0.28em);
            transition: transform 150ms cubic-bezier(0,0,0.58,1);
            z-index: -1;
          }
          .press-btn:focus {
            outline: none;
            box-shadow: none;
          }
          .press-btn:hover {
            background: rgba(var(--btn-rgb), 0.22);
            transform: translateY(0.12em);
          }
          .press-btn:hover::before {
            transform: translateY(0.16em);
          }
          .press-btn:active {
            transform: translateY(0.28em);
          }
          .press-btn:active::before {
            transform: translateY(0);
          }
          .press-btn.press-btn-active {
            background: rgb(var(--btn-rgb));
            border-color: rgb(var(--btn-rgb));
            box-shadow: 0 6px 16px -2px rgba(var(--btn-rgb), 0.55);
          }
          .press-btn.press-btn-active::before {
            display: none;
          }
          .press-btn:disabled {
            cursor: not-allowed;
            opacity: 0.35;
          }
          .press-btn:disabled:hover {
            transform: none;
            background: rgba(var(--btn-rgb), 0.14);
          }
          .press-btn:disabled::before {
            transform: translateY(0.28em);
          }
        `}</style>

        {/* DISCOVER MODE */}
        {mode === "discover" && (
          <div>
            <div className="rounded-2xl p-4 mb-4" style={glassCard}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#06B6D4" }}>Duration</p>
              <div className="flex gap-2.5 flex-wrap mb-5">
                {durationOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(selectedDuration === d ? null : d)}
                    className={`press-btn ${selectedDuration === d ? "press-btn-active" : ""}`}
                    style={{ "--btn-rgb": "6, 182, 212" }}
                  >
                    {selectedDuration === d ? "✓ " : ""}{d}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#06B6D4" }}>Vibe</p>
              <div className="flex gap-2.5 flex-wrap mb-5">
                {vibeOptions.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVibe(selectedVibe === v ? null : v)}
                    className={`press-btn ${selectedVibe === v ? "press-btn-active" : ""}`}
                    style={{ "--btn-rgb": "139, 92, 246" }}
                  >
                    {selectedVibe === v ? "✓ " : ""}{v}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#06B6D4" }}>Proximity</p>
              <div className="flex gap-2.5 flex-wrap">
                {proximityOptions.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedProximity(selectedProximity === p ? null : p)}
                    className={`press-btn ${selectedProximity === p ? "press-btn-active" : ""}`}
                    style={{ "--btn-rgb": "249, 115, 22" }}
                  >
                    {selectedProximity === p ? "✓ " : ""}{p}
                  </button>
                ))}
              </div>

              {(selectedDuration || selectedVibe || selectedProximity) && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => { setSelectedDuration(null); setSelectedVibe(null); setSelectedProximity(null); }}
                    className="text-white opacity-60 text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#06B6D4" }}>
              {plans.length} Day {plans.length === 1 ? "Plan" : "Plans"} for {cityName}
            </p>
            <div className="flex flex-col gap-3">
              {plans.length > 0 ? plans.map((plan) => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan)} className="rounded-2xl p-4 text-left transition-all" style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}40` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: `${plan.color}25` }}>{plan.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-white font-black text-lg mb-0.5">{plan.title}</h3>
                      <p className="text-sm" style={{ color: plan.color }}>{plan.tagline}</p>
                      <p className="text-white opacity-40 text-xs mt-1">{plan.stops.length > 0 ? `${plan.stops.length} stops · Full day plan` : "Coming soon"}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ background: `${plan.color}40` }}>→</div>
                  </div>
                </button>
              )) : allPlans.length > 0 ? (
                <div className="rounded-2xl p-8 text-center" style={glassCard}>
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-white font-bold">No plans match these filters</p>
                  <p className="text-white opacity-50 text-sm mt-1">Try clearing a filter!</p>
                </div>
              ) : (
                <div className="rounded-2xl p-8 text-center" style={glassCard}>
                  <p className="text-4xl mb-3">🚧</p>
                  <p className="text-white font-bold">Plans coming soon for {cityName}!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SPIN MODE */}
        {mode === "spin" && (
          <div>
            {cityName === "Bengaluru" && (
              <div className="relative overflow-hidden rounded-2xl p-4 mb-3" style={glassCard}>
                {/* Faint blueprint grid + glowing corner, sitting behind the content */}
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(17,213,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(17,213,255,1) 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div
                    className="absolute -right-8 -top-8 w-28 h-28 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(17,213,255,.25), transparent 70%)" }}
                  />
                </div>
                <p className="relative text-xs font-bold uppercase tracking-widest mb-3" style={{ color: colors.accent }}>Pick your area</p>
                <style>{`
                  .loc-dropdown-panel {
                    animation: locDropdownIn 160ms ease-out;
                    transform-origin: top center;
                  }
                  @keyframes locDropdownIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                  }
                  .loc-dropdown-list::-webkit-scrollbar { width: 6px; }
                  .loc-dropdown-list::-webkit-scrollbar-track { background: transparent; }
                  .loc-dropdown-list::-webkit-scrollbar-thumb { background: rgba(17,213,255,.25); border-radius: 999px; }
                  .loc-dropdown-list::-webkit-scrollbar-thumb:hover { background: rgba(17,213,255,.45); }
                  .loc-search-input::placeholder { color: rgba(255,255,255,.35); }
                `}</style>
                <div ref={locationDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setLocationDropdownOpen((o) => !o)}
                    className="relative w-full flex items-center gap-2.5 justify-between rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all duration-[200ms]"
                    style={{
                      background: locationDropdownOpen ? "rgba(17,213,255,.08)" : "rgba(255,255,255,.04)",
                      border: locationDropdownOpen ? "1px solid rgba(17,213,255,.4)" : "1px solid rgba(255,255,255,.08)",
                      boxShadow: locationDropdownOpen ? "0 0 24px rgba(17,213,255,.18)" : "none",
                    }}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-base">📍</span>
                      <span className="truncate">{selectedLocation}</span>
                    </span>
                    <span
                      className="text-xs flex-shrink-0 transition-transform duration-200"
                      style={{ color: colors.accent, transform: locationDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      ▼
                    </span>
                  </button>

                  {locationDropdownOpen && (
                    <div
                      className="loc-dropdown-panel absolute left-0 right-0 mt-2 rounded-xl z-20"
                      style={{
                        background: "#0B1120",
                        border: "1px solid rgba(17,213,255,.15)",
                        boxShadow: "0 16px 40px rgba(0,0,0,.6)",
                      }}
                    >
                      <div className="p-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                        <input
                          autoFocus
                          type="text"
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          placeholder="Search area..."
                          className="loc-search-input w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                          style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}
                        />
                      </div>

                      <div className="loc-dropdown-list overflow-y-auto" style={{ maxHeight: "240px" }}>
                        {bangaloreLocations
                          .filter((loc) => loc.toLowerCase().includes(locationSearch.toLowerCase()))
                          .map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setSelectedLocation(loc);
                                setLocationDropdownOpen(false);
                                setLocationSearch("");
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center gap-2"
                              style={{
                                background: loc === selectedLocation ? "rgba(17,213,255,.12)" : "transparent",
                                color: loc === selectedLocation ? colors.accent : "rgba(255,255,255,.85)",
                                fontWeight: loc === selectedLocation ? 700 : 500,
                              }}
                              onMouseEnter={(e) => { if (loc !== selectedLocation) e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                              onMouseLeave={(e) => { if (loc !== selectedLocation) e.currentTarget.style.background = "transparent"; }}
                            >
                              <span className="text-xs opacity-60">{loc === selectedLocation ? "✓" : "📍"}</span>
                              {loc}
                            </button>
                          ))}
                        {bangaloreLocations.filter((loc) => loc.toLowerCase().includes(locationSearch.toLowerCase())).length === 0 && (
                          <p className="px-4 py-4 text-sm text-white opacity-40 text-center">No matches</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={filterPanelRef} className="rounded-2xl p-4 mb-3" style={glassCard}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#06B6D4" }}>Where do you want to go?</p>
                <p className="text-white opacity-40 text-xs font-medium">Pick 1-3</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.label);
                  const atLimit = selectedCategories.length >= 3 && !isSelected;
                  const disabled = cat.locked || atLimit;
                  return (
                    <button
                      key={cat.label}
                      disabled={disabled}
                      onClick={() => {
                        if (cat.locked) return;
                        if (isSelected) {
                          setSelectedCategories(selectedCategories.filter((c) => c !== cat.label));
                          if (cat.label === "Food") { setFoodVeg(null); setFoodCuisine(null); }
                        } else if (selectedCategories.length < 3) {
                          setSelectedCategories([...selectedCategories, cat.label]);
                        }
                      }}
                      className={`press-btn ${isSelected ? "press-btn-active" : ""}`}
                      style={{
                        "--btn-rgb": "6, 182, 212",
                        boxShadow: isSelected && justHighlighted ? "0 0 0 3px rgba(6,182,212,0.6)" : undefined,
                        transform: isSelected && justHighlighted ? "scale(1.05)" : undefined,
                      }}
                    >
                      {isSelected ? "✓ " : ""}{cat.emoji} {cat.label}{cat.locked ? " 🔒 Soon" : ""}
                    </button>
                  );
                })}
              </div>
              {selectedCategories.length >= 2 && (
                <p className="text-white opacity-50 text-xs font-medium mt-3">✨ Spin will build you a plan with these picked close together</p>
              )}
            </div>

            {selectedCategories.includes("Food") && (
              <div className="rounded-2xl p-4 mb-3" style={glassCard}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06B6D4" }}>Food Preferences</p>

                <p className="text-white opacity-60 text-xs font-semibold mb-2">Veg / Non-Veg</p>
                <div className="flex gap-2.5 flex-wrap mb-4">
                  {["Veg", "Non-Veg"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setFoodVeg(foodVeg === v ? null : v)}
                      className={`press-btn ${foodVeg === v ? "press-btn-active" : ""}`}
                      style={{ "--btn-rgb": "34, 197, 94" }}
                    >
                      {foodVeg === v ? "✓ " : ""}{v}
                    </button>
                  ))}
                </div>

                <p className="text-white opacity-60 text-xs font-semibold mb-2">Cuisine</p>
                <div className="flex gap-2.5 flex-wrap">
                  {["South Indian", "North Indian", "Cafe", "Brewery", "Pub & Bar"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setFoodCuisine(foodCuisine === c ? null : c)}
                      className={`press-btn ${foodCuisine === c ? "press-btn-active" : ""}`}
                      style={{ "--btn-rgb": "139, 92, 246" }}
                    >
                      {foodCuisine === c ? "✓ " : ""}{c}
                    </button>
                  ))}
                  {["Chinese", "Italian", "Continental"].map((c) => (
                    <button key={c} disabled className="press-btn" style={{ "--btn-rgb": "139, 92, 246" }}>
                      {c} <span className="ml-1 opacity-80">🔒 Soon</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl p-4 mb-5" style={glassCard}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06B6D4" }}>Budget</p>
              <div className="flex gap-2.5 flex-wrap">
                {budgets.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBudget(selectedBudget === b ? null : b)}
                    className={`press-btn ${selectedBudget === b ? "press-btn-active" : ""}`}
                    style={{ "--btn-rgb": "249, 115, 22" }}
                  >
                    {selectedBudget === b ? "✓ " : ""}{b}
                  </button>
                ))}
              </div>
            </div>

            <style>{`
              /* Sparkle button, scoped to .spin-sparkle-btn (adapted from Uiverse.io by ilkhoeri) */
              .spin-sparkle-btn {
                --round: 1rem;
                cursor: pointer;
                position: relative;
                overflow: hidden;
                z-index: 0;
                transition: transform 0.2s ease;
              }
              .spin-sparkle-btn:active {
                transform: scale(0.97);
              }
              .spin-sparkle-btn::before,
              .spin-sparkle-btn::after {
                content: "";
                position: absolute;
                inset: var(--space);
                transition: all 0.5s ease-in-out;
                border-radius: calc(var(--round) - var(--space));
                z-index: 0;
                pointer-events: none;
              }
              .spin-sparkle-btn::before {
                --space: 1px;
                background: linear-gradient(177.95deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%);
              }
              .spin-sparkle-btn::after {
                --space: 2px;
                background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(103,232,249,0.55) 0%, rgba(103,232,249,0) 100%);
              }

              .spin-fold {
                z-index: 1;
                position: absolute;
                top: 0;
                right: 0;
                height: 1rem;
                width: 1rem;
                display: inline-block;
                transition: all 0.5s ease-in-out;
                background: radial-gradient(100% 75% at 55%, rgba(103,232,249,0.7) 0%, rgba(103,232,249,0) 100%);
                box-shadow: 0 0 3px rgba(0,0,0,0.6);
                border-bottom-left-radius: 0.5rem;
                border-top-right-radius: var(--round);
                pointer-events: none;
              }
              .spin-sparkle-btn:hover .spin-fold {
                margin-top: -1rem;
                margin-right: -1rem;
              }

              .spin-points_wrapper {
                overflow: hidden;
                width: 100%;
                height: 100%;
                pointer-events: none;
                position: absolute;
                inset: 0;
                z-index: 1;
              }
              .spin-points_wrapper .spin-point {
                bottom: -10px;
                position: absolute;
                animation: spinFloatingPoints infinite ease-in-out;
                pointer-events: none;
                width: 2px;
                height: 2px;
                background-color: #fff;
                border-radius: 9999px;
              }
              @keyframes spinFloatingPoints {
                0% { transform: translateY(0); }
                85% { opacity: 0; }
                100% { transform: translateY(-55px); opacity: 0; }
              }
              .spin-points_wrapper .spin-point:nth-child(1) { left: 10%; opacity: 1; animation-duration: 2.35s; animation-delay: 0.2s; }
              .spin-points_wrapper .spin-point:nth-child(2) { left: 30%; opacity: 0.7; animation-duration: 2.5s; animation-delay: 0.5s; }
              .spin-points_wrapper .spin-point:nth-child(3) { left: 25%; opacity: 0.8; animation-duration: 2.2s; animation-delay: 0.1s; }
              .spin-points_wrapper .spin-point:nth-child(4) { left: 44%; opacity: 0.6; animation-duration: 2.05s; }
              .spin-points_wrapper .spin-point:nth-child(5) { left: 50%; opacity: 1; animation-duration: 1.9s; }
              .spin-points_wrapper .spin-point:nth-child(6) { left: 75%; opacity: 0.5; animation-duration: 1.5s; animation-delay: 1.5s; }
              .spin-points_wrapper .spin-point:nth-child(7) { left: 88%; opacity: 0.9; animation-duration: 2.2s; animation-delay: 0.2s; }
              .spin-points_wrapper .spin-point:nth-child(8) { left: 58%; opacity: 0.8; animation-duration: 2.25s; animation-delay: 0.2s; }
              .spin-points_wrapper .spin-point:nth-child(9) { left: 98%; opacity: 0.6; animation-duration: 2.6s; animation-delay: 0.1s; }
              .spin-points_wrapper .spin-point:nth-child(10) { left: 65%; opacity: 1; animation-duration: 2.5s; animation-delay: 0.2s; }

              .spin-inner {
                z-index: 2;
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                color: white;
              }

              /* Corner button - from Uiverse.io by dexter-st */
              .btn-container {
                --btn-color: #fcf92c;
                --corner-color: #0002;
                --corner-dist: 30px;
                --corner-multiplier: 1.5;
                --timing-function: cubic-bezier(0, 0, 0, 2.5);
                --duration: 250ms;

                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 70%;
              }

              .btn-container.find-variant {
                --btn-color: #84CC16;
              }

              .btn {
                position: relative;
                width: 100%;
                min-height: calc(var(--corner-dist) * 2);
                border-radius: 24px;
                border: none;
                padding: 0.15em 0.8em;

                background: linear-gradient(#fff2, #0001), var(--btn-color);
                box-shadow:
                  1px 1px 2px -1px #fff inset,
                  0 2px 1px #00000010,
                  0 4px 2px #00000010,
                  0 8px 4px #00000010,
                  0 16px 8px #00000010,
                  0 32px 16px #00000010;

                transition:
                  transform var(--duration) var(--timing-function),
                  filter var(--duration) var(--timing-function);
                -webkit-transition:
                  transform var(--duration) var(--timing-function),
                  -webkit-filter var(--duration) var(--timing-function);

                cursor: pointer;
              }

              .btn:disabled {
                cursor: not-allowed;
                opacity: 0.7;
              }

              .btn-drawer {
                position: absolute;
                display: flex;
                justify-content: center;

                min-height: 32px;
                border-radius: 24px;
                border: none;
                padding: 0.25em 1em;
                font-size: 0.8em;
                font-weight: 900;
                font-family: "Poppins", monospace;
                color: rgb(0, 0, 0);

                background: linear-gradient(#fff2, rgb(0, 0, 0)), var(--btn-color);
                background-color: #fbff13;
                opacity: 0;

                transition:
                  transform calc(0.5 * var(--duration)) ease,
                  filter var(--duration) var(--timing-function),
                  opacity calc(0.5 * var(--duration)) ease;
                -webkit-transition:
                  transform calc(0.5 * var(--duration)) ease,
                  -webkit-filter var(--duration) var(--timing-function),
                  opacity calc(0.5 * var(--duration)) ease;
                filter: blur(2px);
                -webkit-filter: blur(2px);
              }

              .transition-top {
                top: 0;
                left: 0;
                border-radius: 24px 24px 0 0;
                align-items: start;
              }
              .transition-bottom {
                bottom: 0;
                right: 0;
                border-radius: 0 0 24px 24px;
                align-items: end;
              }

              .btn-text {
                display: inline-block;

                font-size: 1.50em;
                font-family: "Poppins", "Inter", sans-serif;
                font-weight: 900;
                color: rgb(3, 3, 3);

                background-image: linear-gradient(#444, rgb(0, 0, 0));
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                filter: drop-shadow(0 1px 0 #fff6) drop-shadow(0 -1px 0 #0006);
                -webkit-filter: drop-shadow(0 1px 0 #fff6) drop-shadow(0 -1px 0 #0006);

                transition:
                  transform var(--duration) var(--timing-function),
                  filter var(--duration) var(--timing-function),
                  color var(--duration) var(--timing-function);
                -webkit-transition:
                  transform var(--duration) var(--timing-function),
                  -webkit-filter var(--duration) var(--timing-function),
                  color var(--duration) var(--timing-function);
              }

              .btn-corner {
                position: absolute;
                width: 32px;

                fill: none;
                stroke: var(--corner-color);

                transition:
                  transform var(--duration) var(--timing-function),
                  filter var(--duration) var(--timing-function);
                -webkit-transition:
                  transform var(--duration) var(--timing-function),
                  -webkit-filter var(--duration) var(--timing-function);
              }

              .btn-corner:nth-of-type(1) {
                top: 0;
                left: 0;
                transform: translate(
                    calc(-1 * var(--corner-dist)),
                    calc(-1 * var(--corner-dist))
                  )
                  rotate(90deg);
              }
              .btn-corner:nth-of-type(2) {
                top: 0;
                right: 0;
                transform: translate(var(--corner-dist), calc(-1 * var(--corner-dist)))
                  rotate(180deg);
              }
              .btn-corner:nth-of-type(3) {
                bottom: 0;
                right: 0;
                transform: translate(var(--corner-dist), var(--corner-dist)) rotate(-90deg);
              }
              .btn-corner:nth-of-type(4) {
                bottom: 0;
                left: 0;
                transform: translate(calc(-1 * var(--corner-dist)), var(--corner-dist))
                  rotate(0deg);
              }

              .btn-container:has(.btn:hover),
              .btn-container:has(.btn:focus-visible) {
                .btn {
                  transform: scale(1.05);
                  filter: drop-shadow(0 16px 16px #0002);
                  -webkit-filter: drop-shadow(0 16px 16px #0002);
                }
                .transition-top {
                  transform: translateY(-24px) rotateZ(4deg);
                  filter: blur(0px);
                  -webkit-filter: blur(0px);
                  animation: hue-anim 3s infinite linear;
                  -webkit-animation: hue-anim 3s infinite linear;
                  opacity: 1;
                }
                .transition-bottom {
                  transform: translateY(24px) rotateZ(4deg);
                  filter: blur(0px);
                  -webkit-filter: blur(0px);
                  animation: hue-anim 3s infinite linear;
                  -webkit-animation: hue-anim 3s infinite linear;
                  opacity: 1;
                }
                .btn-text {
                  filter: drop-shadow(0 1px 0 #fff6) drop-shadow(0 -1px 0 #0006)
                    drop-shadow(0px 6px 2px #0003);
                  -webkit-filter: drop-shadow(0 1px 0 #fff6) drop-shadow(0 -1px 0 #0006)
                    drop-shadow(0px 6px 2px #0003);
                  transform: scale(1.05);
                  color: rgb(0, 0, 0);
                }

                --corner-color: #0004;
                .btn-corner:first-of-type {
                  transform: translate(
                      calc(-1 * var(--corner-multiplier) * var(--corner-dist)),
                      calc(-1 * var(--corner-multiplier) * var(--corner-dist))
                    )
                    rotate(90deg);
                  filter: drop-shadow(-10px 10px 1px var(--corner-color))
                    drop-shadow(-20px 20px 2px var(--corner-color));
                  -webkit-filter: drop-shadow(-10px 10px 1px var(--corner-color))
                    drop-shadow(-20px 20px 2px var(--corner-color));
                }
                .btn-corner:nth-of-type(2) {
                  transform: translate(
                      calc(var(--corner-multiplier) * var(--corner-dist)),
                      calc(-1 * var(--corner-multiplier) * var(--corner-dist))
                    )
                    rotate(180deg);
                  filter: drop-shadow(-10px 10px 1px var(--corner-color))
                    drop-shadow(-20px 20px 2px var(--corner-color));
                  -webkit-filter: drop-shadow(-10px 10px 1px var(--corner-color))
                    drop-shadow(-20px 20px 2px var(--corner-color));
                }
                @-moz-document url-prefix() {
                  .btn-corner:nth-of-type(2) {
                    filter: drop-shadow(10px -10px 1px var(--corner-color))
                      drop-shadow(20px -20px 2px var(--corner-color));
                  }
                }
                .btn-corner:nth-of-type(3) {
                  transform: translate(
                      calc(var(--corner-multiplier) * var(--corner-dist)),
                      calc(var(--corner-multiplier) * var(--corner-dist))
                    )
                    rotate(-90deg);
                  filter: drop-shadow(-10px 10px 1px var(--corner-color))
                    drop-shadow(-20px 20px 2px var(--corner-color));
                  -webkit-filter: drop-shadow(-10px 10px 1px var(--corner-color))
                    drop-shadow(-20px 20px 2px var(--corner-color));
                }
                .btn-corner:nth-of-type(4) {
                  transform: translate(
                      calc(-1 * var(--corner-multiplier) * var(--corner-dist)),
                      calc(var(--corner-multiplier) * var(--corner-dist))
                    )
                    rotate(0deg);
                  filter: drop-shadow(-10px 10px 1px var(--corner-color))
                    drop-shadow(-20px 20px 2px var(--corner-color));
                  -webkit-filter: drop-shadow(-10px 10px 1px var(--corner-color))
                    drop-shadow(-20px 20px 2px var(--corner-color));
                }
              }

              .btn-container:has(.btn:active) {
                .btn {
                  transform: scale(0.95);
                  filter: drop-shadow(0 10px 4px #0002);
                  -webkit-filter: drop-shadow(0 10px 4px #0002);
                }
                .transition-top,
                .transition-bottom {
                  transform: translateY(0px) scale(0.5);
                }
                .btn-text {
                  filter: drop-shadow(0 1px 0 #fff6) drop-shadow(0 -1px 0 #0006)
                    drop-shadow(0px 6px 2px #0003);
                  -webkit-filter: drop-shadow(0 1px 0 #fff6) drop-shadow(0 -1px 0 #0006)
                    drop-shadow(0px 6px 2px #0003);
                  transform: scale(1);
                  color: rgb(0, 0, 0);
                }
                --corner-color: #0005;
                --corner-multiplier: 0.95;
                .btn-corner:first-of-type {
                  transform: translate(
                      calc(-1 * var(--corner-multiplier) * var(--corner-dist)),
                      calc(-1 * var(--corner-multiplier) * var(--corner-dist))
                    )
                    rotate(90deg);
                  filter: drop-shadow(-10px 10px 2px var(--corner-color))
                    drop-shadow(-20px 20px 3px var(--corner-color));
                  -webkit-filter: drop-shadow(-10px 10px 2px var(--corner-color))
                    drop-shadow(-20px 20px 3px var(--corner-color));
                }
                .btn-corner:nth-of-type(2) {
                  transform: translate(
                      calc(var(--corner-multiplier) * var(--corner-dist)),
                      calc(-1 * var(--corner-multiplier) * var(--corner-dist))
                    )
                    rotate(180deg);
                  filter: drop-shadow(-10px 10px 2px var(--corner-color))
                    drop-shadow(-20px 20px 3px var(--corner-color));
                  -webkit-filter: drop-shadow(-10px 10px 2px var(--corner-color))
                    drop-shadow(-20px 20px 3px var(--corner-color));
                }
                @-moz-document url-prefix() {
                  .btn-corner:nth-of-type(2) {
                    filter: drop-shadow(10px -10px 2px var(--corner-color))
                      drop-shadow(20px -20px 3px var(--corner-color));
                  }
                }
                .btn-corner:nth-of-type(3) {
                  transform: translate(
                      calc(var(--corner-multiplier) * var(--corner-dist)),
                      calc(var(--corner-multiplier) * var(--corner-dist))
                    )
                    rotate(-90deg);
                  filter: drop-shadow(-10px 10px 2px var(--corner-color))
                    drop-shadow(-20px 20px 3px var(--corner-color));
                  -webkit-filter: drop-shadow(-10px 10px 2px var(--corner-color))
                    drop-shadow(-20px 20px 3px var(--corner-color));
                }
                .btn-corner:nth-of-type(4) {
                  transform: translate(
                      calc(-1 * var(--corner-multiplier) * var(--corner-dist)),
                      calc(var(--corner-multiplier) * var(--corner-dist))
                    )
                    rotate(0deg);
                  filter: drop-shadow(-10px 10px 2px var(--corner-color))
                    drop-shadow(-20px 20px 3px var(--corner-color));
                  -webkit-filter: drop-shadow(-10px 10px 2px var(--corner-color))
                    drop-shadow(-20px 20px 3px var(--corner-color));
                }
              }

              @keyframes hue-anim {
                0%,
                100% {
                  filter: hue-rotate(0deg);
                  -webkit-filter: hue-rotate(0deg);
                }
                50% {
                  filter: hue-rotate(-70deg);
                  -webkit-filter: hue-rotate(-70deg);
                }
              }
              @-webkit-keyframes hue-anim {
                0%,
                100% {
                  -webkit-filter: hue-rotate(0deg);
                }
                50% {
                  -webkit-filter: hue-rotate(-70deg);
                }
              }
            `}</style>
            <style>{`
              .action-toggle-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-top: 28px;
              }
              .action-toggle-row .btn-container {
                flex: 1;
              }
              /* Toggle switch - from Uiverse.io by swift_9148 */
              .spark-switch {
                display: inline-block;
                font-size: 20px;
                margin-left: 14px;
              }
              .spark-switch input {
                display: none;
              }
              .spark-switch .track {
                position: relative;
                width: 5em;
                height: 2.5em;
                background: #080e27;
                border-radius: 1.25em;
                cursor: pointer;
                overflow: hidden;
                border: 0.1em solid rgba(255, 255, 255, 0.15);
                box-shadow:
                  inset 0 0.2em 0.5em rgba(0, 0, 0, 0.6),
                  0 0.2em 0.4em rgba(0, 0, 0, 0.2);
                transition: all 0.4s ease;
              }
              .spark-switch .track::before {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, #3478f6, #f5ba1f);
                opacity: 0;
                transition: opacity 0.4s ease;
              }
              .spark-switch .knob {
                position: absolute;
                top: 0.15em;
                left: 0.15em;
                width: 2em;
                height: 2em;
                background: #f7f7f7;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 0.1em 0.3em rgba(0, 0, 0, 0.3);
              }
              .spark-switch .knob svg {
                width: 1.2em;
                height: 1.2em;
                color: #272727;
                transition:
                  color 0.4s ease,
                  transform 0.4s ease;
              }
              .spark-switch input:checked + .track {
                border-color: rgba(245, 186, 31, 0.8);
                box-shadow:
                  inset 0 0.1em 0.3em rgba(0, 0, 0, 0.4),
                  0 0 0.6em 0.1em rgba(245, 186, 31, 0.4);
              }
              .spark-switch input:checked + .track .knob {
                transform: translateX(2.5em);
              }
              .spark-switch input:checked + .track::before {
                opacity: 1;
              }
              .spark-switch input:checked + .track .knob svg {
                color: #f5ba1f;
                transform: scale(1.1);
              }
              .spark-switch .stars {
                position: absolute;
                inset: 0;
                z-index: 1;
              }
              .spark-switch .star {
                position: absolute;
                background: #f7f7f7;
                border-radius: 50%;
                transition:
                  width 0.3s,
                  height 0.3s,
                  background 0.3s,
                  border-radius 0.3s;
              }
              .spark-switch .star:nth-child(1) {
                top: 0.4em;
                left: 100%;
                width: 0.15em;
                height: 0.15em;
                animation: drift 3s linear infinite;
              }
              .spark-switch .star:nth-child(2) {
                top: 1.2em;
                left: 100%;
                width: 0.2em;
                height: 0.2em;
                animation: drift 4s linear infinite 1s;
              }
              .spark-switch .star:nth-child(3) {
                top: 2em;
                left: 100%;
                width: 0.1em;
                height: 0.1em;
                animation: drift 2.5s linear infinite 0.5s;
              }
              .spark-switch .star:nth-child(4) {
                top: 0.8em;
                left: 100%;
                width: 0.15em;
                height: 0.15em;
                animation: drift 5s linear infinite 2s;
              }
              .spark-switch input:checked + .track .star {
                width: 1.5em;
                height: 0.1em;
                border-radius: 0.05em;
                background: rgba(255, 255, 255, 0.9);
              }
              .spark-switch input:checked + .track .star:nth-child(1) {
                animation: warp 0.4s linear infinite;
              }
              .spark-switch input:checked + .track .star:nth-child(2) {
                animation: warp 0.6s linear infinite 0.1s;
              }
              .spark-switch input:checked + .track .star:nth-child(3) {
                animation: warp 0.3s linear infinite 0.2s;
              }
              .spark-switch input:checked + .track .star:nth-child(4) {
                animation: warp 0.5s linear infinite 0.15s;
              }
              @keyframes drift {
                0% {
                  transform: translateX(0);
                  opacity: 0;
                }
                10% {
                  opacity: 1;
                }
                90% {
                  opacity: 1;
                }
                100% {
                  transform: translateX(-6em);
                  opacity: 0;
                }
              }
              @keyframes warp {
                0% {
                  transform: translateX(0) scaleX(1);
                  opacity: 0;
                }
                10% {
                  opacity: 1;
                }
                100% {
                  transform: translateX(-6em) scaleX(2);
                  opacity: 0;
                }
              }
            `}</style>
            <div className="action-toggle-row mb-6">
              {useFindMode ? (
                <div className="btn-container find-variant">
                  <button onClick={handleFind} disabled={loading} className="btn">
                    <span className="btn-text">{loading ? "Searching..." : "Find My Spot"}</span>
                  </button>
                  <svg className="btn-corner" viewBox="0 0 32 32"><path d="M0 32 L0 12 Q0 0 12 0 L32 0" /></svg>
                  <svg className="btn-corner" viewBox="0 0 32 32"><path d="M0 32 L0 12 Q0 0 12 0 L32 0" /></svg>
                  <svg className="btn-corner" viewBox="0 0 32 32"><path d="M0 32 L0 12 Q0 0 12 0 L32 0" /></svg>
                  <svg className="btn-corner" viewBox="0 0 32 32"><path d="M0 32 L0 12 Q0 0 12 0 L32 0" /></svg>
                  <div className="btn-drawer transition-top">{loading ? "Searching..." : "Find My Spot"}</div>
                  <div className="btn-drawer transition-bottom">{loading ? "Searching..." : "Find My Spot"}</div>
                </div>
              ) : (
                <div className="btn-container">
                  <button onClick={() => handleSpin()} disabled={spinning} className="btn">
                    <span className="btn-text">{spinning ? "Spinning..." : "Spin The Wheel"}</span>
                  </button>
                  <svg className="btn-corner" viewBox="0 0 32 32"><path d="M0 32 L0 12 Q0 0 12 0 L32 0" /></svg>
                  <svg className="btn-corner" viewBox="0 0 32 32"><path d="M0 32 L0 12 Q0 0 12 0 L32 0" /></svg>
                  <svg className="btn-corner" viewBox="0 0 32 32"><path d="M0 32 L0 12 Q0 0 12 0 L32 0" /></svg>
                  <svg className="btn-corner" viewBox="0 0 32 32"><path d="M0 32 L0 12 Q0 0 12 0 L32 0" /></svg>
                  <div className="btn-drawer transition-top">{spinning ? "Spinning..." : "Spin The Wheel"}</div>
                  <div className="btn-drawer transition-bottom">{spinning ? "Spinning..." : "Spin The Wheel"}</div>
                </div>
              )}
              <label className="spark-switch" aria-label="Switch between Spin and Find modes">
                <input
                  type="checkbox"
                  checked={useFindMode}
                  onChange={() => setUseFindMode((prev) => !prev)}
                />
                <div className="track">
                  <div className="stars">
                    <div className="star"></div>
                    <div className="star"></div>
                    <div className="star"></div>
                    <div className="star"></div>
                  </div>
                  <div className="knob">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                      <circle cx="12" cy="12" r="5" />
                    </svg>
                  </div>
                </div>
              </label>
            </div>

            {spinResult && (
              <div className="mb-4">
                <PlaceCard place={spinResult} isSpinResult={true} onReview={setReviewPlace} onSpin={handleSpin} onGallery={setGalleryPlace} />
              </div>
            )}

            {searched && (
              <div>
                {loading && (
                  <div className="rounded-2xl p-8 text-center mb-4" style={glassCard}>
                    <p className="text-white font-bold">Finding spots...</p>
                  </div>
                )}
                {!loading && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3B82F6" }}>
                        {results.length} {results.length === 1 ? "Spot" : "Spots"} Found
                      </p>
                      <button onClick={handleReset} className="text-white opacity-60 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>Reset</button>
                    </div>
                    {results.length === 0 ? (
                      <div className="rounded-2xl p-8 text-center" style={glassCard}>
                        <p className="text-white font-bold">No spots found</p>
                        <p className="text-white opacity-50 text-sm mt-1">Try different filters!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {results.map((place, index) => (
                          <PlaceCard key={index} place={place} isSpinResult={false} onReview={setReviewPlace} onSpin={handleSpin} onGallery={setGalleryPlace} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-10 text-white opacity-20 text-xs">Built with React and Tailwind</div>
        </div>

        </div>
      </div>

      {reviewPlace && <ReviewModal place={reviewPlace} onClose={() => setReviewPlace(null)} />}
      {galleryPlace && <PhotoGallery place={galleryPlace} onClose={() => setGalleryPlace(null)} />}
      {selectedPlan && <PlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}

      {/* Bottom nav bar */}
      <style>{`
        .nav-icon-btn {
          display: grid;
          place-items: center;
          background: #e3edf7;
          border-radius: 9999px;
          width: 2.75rem;
          height: 2.75rem;
          box-shadow: 6px 6px 10px -1px rgba(0,0,0,0.15),
                      -6px -6px 10px -1px rgba(255,255,255,0.7);
          border: 1px solid rgba(0,0,0,0);
          cursor: pointer;
          transition: transform 0.5s;
        }
        .nav-icon-btn:hover {
          box-shadow: inset 4px 4px 6px -1px rgba(0,0,0,0.2),
                      inset -4px -4px 6px -1px rgba(255,255,255,0.7),
                      -0.5px -0.5px 0px rgba(255,255,255,1),
                      0.5px 0.5px 0px rgba(0,0,0,0.15),
                      0px 12px 10px -10px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          transform: translateY(0.5em);
        }
        .nav-icon-btn svg {
          transition: transform 0.5s;
          width: 20px;
          height: 20px;
        }
        .nav-icon-btn:hover svg {
          transform: scale(0.9);
          fill: #333333;
        }
      `}</style>
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-6 sm:gap-10 py-4 z-40" style={{ background: "#000000", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button aria-label="Home" onClick={() => navigate("/")} className="nav-icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
          </svg>
        </button>
        <button aria-label="Discover" onClick={() => setMode("discover")} className="nav-icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" />
          </svg>
        </button>
        <button aria-label="Favorites" className="nav-icon-btn">
          <svg viewBox="0 0 24 24" fill="white" stroke="#333333" strokeWidth="1">
            <path d="M12 20s-7-4.35-9.5-8.5C.9 8.6 2.3 5 5.6 5c1.9 0 3.3 1 4.4 2.6C11.1 6 12.5 5 14.4 5c3.3 0 4.7 3.6 3.1 6.5C19 15.65 12 20 12 20Z" />
          </svg>
        </button>
        <button aria-label="Profile" onClick={() => (user ? logout() : login())} className="nav-icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
          </svg>
        </button>
        <button
          aria-label="Feedback"
          onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLSf3PxnHxYwtKcTz-UyFmDVebJY6RPasDZpwwmQbgaiX7OKcSw/viewform?usp=header", "_blank")}
          className="nav-icon-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}