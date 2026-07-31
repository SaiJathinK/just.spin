import { useState, useRef } from "react";
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
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="relative w-full rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-shadow duration-[250ms]"
                  style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}
                  onFocus={(e) => (e.target.style.boxShadow = "0 0 20px rgba(17,213,255,.15)")}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                >
                  {bangaloreLocations.map((loc) => (<option key={loc} value={loc} style={{ background: colors.bg, color: "white" }}>{loc}</option>))}
                </select>
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

            <div className="flex flex-col gap-3 mb-6">
              <button onClick={() => handleSpin()} disabled={spinning} className="w-full py-4 rounded-2xl text-white font-black text-sm tracking-widest uppercase" style={{ background: cyan }}>
                {spinning ? "Spinning..." : "Spin The Wheel"}
              </button>
              <button onClick={handleFind} disabled={loading} className="w-full py-4 rounded-2xl text-white font-black text-sm tracking-widest uppercase" style={{ background: blue }}>
                {loading ? "Searching..." : "Find My Spot"}
              </button>
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
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-6 sm:gap-10 py-4 z-40" style={{ background: "#000000", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button aria-label="Home" onClick={() => navigate("/")} className="w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: blue }}>🏠</button>
        <button aria-label="Discover" onClick={() => setMode("discover")} className="w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: blue }}>🧭</button>
        <button aria-label="Favorites" className="w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: blue }}>❤️</button>
        <button aria-label="Profile" onClick={() => (user ? logout() : login())} className="w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: blue }}>👤</button>
      </div>
    </div>
  );
}