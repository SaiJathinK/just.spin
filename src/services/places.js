const experienceTypeToKeyword = {
  "Vineyard": "vineyard wine tasting",
  "Winery Tour": "winery tour",
  "Chocolate Factory": "chocolate factory tour",
  "Horse Ranch": "horse riding ranch",
  "Yoga Retreat": "yoga retreat center",
  "Ayurveda": "ayurveda wellness center spa",
  // Temporarily locked in the UI (not selectable), but kept mapped here so
  // they're easy to re-enable later without touching the search logic.
  "Microlight Flying": "microlight flying",
  "Paragliding": "paragliding",
  "Para Sailing": "para sailing parasailing",
  "Hot Air Balloon": "hot air balloon ride",
};

// Only the currently-unlocked sub-types are included in the generic
// "browse all Experiences" merge — locked ones stay reachable only via
// their specific keyword above, for when they're unlocked later.
const UNLOCKED_EXPERIENCE_TYPES = ["Vineyard", "Winery Tour", "Chocolate Factory", "Horse Ranch", "Yoga Retreat", "Ayurveda"];

const categoryToKeyword = {
  Adventure: ["trekking trails", "ATV off-roading", "kayaking", "paragliding", "go-karting", "adventure sports camp"],
  Nature: "parks gardens zoo wildlife sanctuary lakes",
  Spiritual: ["hindu temple", "church", "gurudwara", "mosque", "jain temple", "buddhist monastery"],
  Food: "restaurants cafes pubs breweries dhaba street food",
  Heritage: "historical monuments museums art galleries forts palaces",
  Entertainment: ["gaming arcade", "bowling alley", "VR gaming zone", "escape room"],
  // Each sub-type gets its own targeted search, same pattern as Adventure/Spiritual —
  // a single generic query like "wine tour farm stay unique experiences" doesn't
  // surface things like paragliding operators or pottery studios at all.
  Experiences: UNLOCKED_EXPERIENCE_TYPES.map((t) => experienceTypeToKeyword[t]),
};

const cuisineToKeyword = {
  "South Indian": "south indian restaurants",
  "North Indian": "north indian restaurants",
  "Cafe": "cafes coffee shops",
  "Brewery": "breweries microbrewery",
  "Pub & Bar": "pubs bars",
  "Chinese": "chinese restaurants",
  "Italian": "italian restaurants",
  "Continental": "continental restaurants",
};

function getCategoryEmoji(category) {
  const emojis = {
    Adventure: "🏕️",
    Nature: "🌿",
    Spiritual: "🛕",
    Food: "🍽️",
    Heritage: "🏛️",
    Entertainment: "🎮",
    Experiences: "🍷",
  };
  return emojis[category] || "📍";
}

function getPriceLabel(level) {
  const labels = {
    0: "Free",
    1: "Under ₹1000",
    2: "₹1000-₹2500",
    3: "₹2500+",
    4: "₹2500+",
  };
  return labels[level] || "Under ₹1000";
}

const BASE_URL = "https://my-place-finder.vercel.app/api/places";

export async function getPlaceDetails(placeId) {
  try {
    const response = await fetch(
      `${BASE_URL}?type=details&query=${placeId}`
    );
    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}

const shapePlace = (place, category, budget, location) => ({
  name: place.name,
  type: category,
  category: category,
  budget: budget || "Under ₹1000",
  emoji: getCategoryEmoji(category),
  rating: place.rating || 4.0,
  totalRatings: place.user_ratings_total || 0,
  area: place.vicinity || place.formatted_address || location,
  price: getPriceLabel(place.price_level),
  lat: place.geometry?.location?.lat ?? null,
  lng: place.geometry?.location?.lng ?? null,
  photo: place.photos
    ? `${BASE_URL}?type=photo&query=${place.photos[0].photo_reference}`
    : null,
  placeId: place.place_id,
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
});

const runQuery = async (query) => {
  try {
    const response = await fetch(`${BASE_URL}?type=search&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    console.log("Places response:", data);
    return data.results || [];
  } catch (error) {
    console.error("Error fetching places:", error);
    return [];
  }
};

export async function searchPlaces(category, budget, city, near = false, foodFilters = {}, experienceType = null) {
  let keywordEntry = categoryToKeyword[category] || "places";
  const location = city || "Bengaluru";
  const connector = near ? " near " : " in ";

  // If the user picked one specific Experience sub-type, search that exact
  // keyword only, instead of running all 13 sub-searches and filtering after.
  if (category === "Experiences" && experienceType && experienceTypeToKeyword[experienceType]) {
    keywordEntry = experienceTypeToKeyword[experienceType];
  }

  // Categories with several distinct sub-keywords (e.g. Adventure covers trekking,
  // kayaking, paragliding...) run one targeted search per sub-keyword in parallel
  // and merge the results, instead of cramming everything into a single query —
  // Google's Text Search doesn't do OR matching, so a crammed string tends to
  // return a narrow or empty result set rather than good coverage.
  if (Array.isArray(keywordEntry)) {
    const rawLists = await Promise.all(
      keywordEntry.map((kw) => runQuery(kw + connector + location))
    );
    const seen = new Map();
    for (const list of rawLists) {
      for (const place of list) {
        if (place.business_status === "CLOSED_PERMANENTLY") continue;
        if (!seen.has(place.place_id)) seen.set(place.place_id, place);
      }
    }
    const merged = [...seen.values()].sort(
      (a, b) => (b.rating || 0) * (b.user_ratings_total || 1) - (a.rating || 0) * (a.user_ratings_total || 1)
    );
    return merged.slice(0, 10).map((place) => shapePlace(place, category, budget, location));
  }

  let keyword = keywordEntry;
  if (category === "Food") {
    const { veg, cuisine } = foodFilters;
    if (cuisine && cuisineToKeyword[cuisine]) keyword = cuisineToKeyword[cuisine];
    if (veg === "Veg") keyword = "vegetarian " + keyword;
    else if (veg === "Non-Veg") keyword = "non-vegetarian " + keyword;
  }
  const query = keyword + connector + location;
  const results = await runQuery(query);
  const openPlaces = results.filter((place) => place.business_status !== "CLOSED_PERMANENTLY");
  return openPlaces.slice(0, 10).map((place) => shapePlace(place, category, budget, location));
}

export async function getPlacePhoto(placeName, city = "Bengaluru") {
  try {
    const response = await fetch(
      `${BASE_URL}?type=find&query=${encodeURIComponent(placeName + " " + city)}`
    );
    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      const place = data.candidates[0];
      const photoRef = place.photos?.[0]?.photo_reference;
      const placeId = place.place_id;
      const lat = place.geometry?.location?.lat;
      const lng = place.geometry?.location?.lng;
return {
  photoUrl: photoRef ? `${BASE_URL}?type=photo&query=${photoRef}` : null,
  placeId,
  lat,
  lng,
  mapsUrl: `https://www.google.com/maps/search/?api=1&query_place_id=${placeId}&query=${encodeURIComponent(placeName)}`,
};
    }
    return null;
  } catch (error) {
    console.error("Error fetching place photo:", error);
    return null;
  }
}
export async function getPlacePhotos(placeId) {
  try {
    const response = await fetch(
      `${BASE_URL}?type=photos&query=${placeId}`
    );
    const data = await response.json();
    if (data.result?.photos) {
      return data.result.photos.slice(0, 10).map((photo) =>
        `${BASE_URL}?type=photo&query=${photo.photo_reference}`
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching photos:", error);
    return [];
  }
}