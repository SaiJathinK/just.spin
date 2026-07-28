import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { searchPlaces, getPlaceDetails, getPlacePhoto, getPlacePhotos } from "../services/places";
import { useAuth } from "../context/AuthContext";

const glassCard = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const blue = "linear-gradient(to right, #2563EB, #3B82F6)";
const cyan = "linear-gradient(to right, #06B6D4, #0891b2)";

const cityPlans = {
  Bengaluru: [
    {
      id: "blr-a",
      title: "Cubbon Park Day",
      emoji: "🌳",
      tagline: "Heritage, culture & food within 5km of city center",
      color: "#10B981",
      budget: "2,600-5,500 per person",
      stops: [
        { time: "8:00-9:00 AM", place: "Konark Kanteerava", type: "Breakfast", note: "Benne dosa, idli-vada, kesari bath and filter coffee right beside Cubbon Park", cost: "200-350" },
        { time: "9:00-10:30 AM", place: "Cubbon Park", type: "Nature", note: "Walk through bamboo groves, bandstand and red Central Library", cost: "Free" },
        { time: "10:30 AM-12:00 PM", place: "Visvesvaraya Industrial and Technological Museum", type: "Museum", note: "Interactive science exhibits enjoyable even for adults!", cost: "60-150" },
        { time: "12:10-1:00 PM", place: "Government Museum Bangalore", type: "Heritage", note: "Karnataka's history and archaeology", cost: "15-250" },
        { time: "1:15-2:45 PM", place: "Karavalli Restaurant Bangalore", type: "Lunch", note: "Finest coastal South Indian meals", cost: "800-2,000" },
        { time: "3:00-4:30 PM", place: "Museum of Art and Photography Bangalore", type: "Museum", note: "One of the city's best modern museums", cost: "200-400" },
        { time: "4:30-5:30 PM", place: "UB City Bangalore", type: "Coffee", note: "Coffee, dessert and boutique browsing", cost: "250-500" },
        { time: "5:30-7:00 PM", place: "MG Road Bangalore", type: "Evening", note: "Browse bookstores and local shops", cost: "Free" },
        { time: "7:30-9:30 PM", place: "Spice Terrace Bangalore", type: "Dinner", note: "Rooftop North Indian dining", cost: "1,200-2,500" },
      ],
    },
    { id: "blr-c", title: "Basavanagudi Heritage & Food Trail", emoji: "🌿", tagline: "Temples, gardens and old Bangalore's favourite food, all without feeling rushed", color: "#8B5CF6", budget: "2,700-4,700 for 2 people", stops: [
      { time: "9:30 AM", place: "Vidyarthi Bhavan", type: "Breakfast", note: "Crispy masala dosa, vada and filter coffee", cost: "300-400 for 2" },
      { time: "10:30 AM", place: "Bull Temple (Dodda Basavana Gudi)", type: "Heritage", note: "One of Bangalore's oldest and most iconic temples, famous for its massive monolithic Nandi statue. ~45 min", cost: "Free" },
      { time: "11:15 AM", place: "Dodda Ganesha Temple", type: "Heritage", note: "Located just opposite the Bull Temple. Spend 20-30 minutes seeking blessings", cost: "Free" },
      { time: "11:45 AM", place: "Bugle Rock Park", type: "Nature", note: "Leisurely walk through ancient rock formations, walking trails and greenery. ~1 hour", cost: "Free" },
      { time: "1:15 PM", place: "MTR (Mavalli Tiffin Rooms)", type: "Lunch", note: "South Indian meals, rava idli, bisibele bath and poori sagu", cost: "700-900 for 2" },
      { time: "2:45 PM", place: "Lalbagh Botanical Garden", type: "Nature", note: "Glass House, Lalbagh Lake, Bonsai Garden, Rose Garden and one of the oldest rock formations on Earth. 2-2.5 hours, perfect for an evening stroll", cost: "60" },
      { time: "5:30 PM", place: "Gandhi Bazaar", type: "Shopping", note: "Optional stop for filter coffee powder, Mysore sandal soap, incense sticks, brass lamps, spices and handmade gifts. ~30-45 min", cost: "500-2,000" },
      { time: "6:30 PM", place: "VV Puram Food Street", type: "Dinner", note: "Akki roti, open butter dosa, gobi manchurian, holige, congress kadlekai, pani puri, jalebi and kulfi", cost: "600-800 for 2" },
      { time: "8:30-9:00 PM", place: "Return Home", type: "Evening", note: "Reach home by 9:00 PM", cost: "Fuel & parking ~500" },
    ]},
    { id: "blr-g", title: "Tumakuru 1-Day Monsoon Getaway", emoji: "🌿", tagline: "A relaxed road trip to nature, forts and hilltop temples", color: "#22C55E", budget: "4,000-6,000 for 2 people", stops: [
      { time: "6:00 AM", place: "Bangalore", type: "Departure", note: "Start the road trip from Bangalore towards Tumakuru", cost: "Free" },
      { time: "7:30 AM", place: "A2B Tumakuru", type: "Breakfast", note: "Masala dosa, idli-vada and filter coffee", cost: "500 for 2" },
      { time: "8:45-10:15 AM", place: "Namada Chilume & Deer Park", type: "Nature", note: "Nature walk, deer park, natural spring and great photography spots", cost: "Free" },
      { time: "10:30 AM-1:00 PM", place: "Devarayanadurga", type: "Heritage", note: "Yoga Narasimha & Bhoga Narasimha temples, fort ruins, scenic viewpoints and a short hill walk", cost: "Free" },
      { time: "1:30 PM", place: "Lunch in Devarayanadurga area", type: "Lunch", note: "Authentic Karnataka meals or Donne Biryani", cost: "900 for 2" },
      { time: "3:00-5:00 PM", place: "Mandaragiri", type: "Adventure", note: "Peacock Feather Jain Temple, easy hill climb, hilltop Jain temples and sunset views", cost: "Free" },
      { time: "5:30 PM", place: "Tumakuru City Shopping", type: "Shopping", note: "Sandalwood products, handmade crafts, Karnataka coffee, local snacks and spices", cost: "500-2,000" },
      { time: "7:00 PM", place: "Kamat Upachar / Local Family Restaurant", type: "Dinner", note: "Hearty local dinner before the drive back", cost: "800 for 2" },
      { time: "8:00-10:00 PM", place: "Return to Bangalore", type: "Evening", note: "Drive back to Bangalore, reaching around 10 PM", cost: "Fuel & parking ~1,600" },
    ]},
    { id: "blr-h", title: "Bannerghatta Wildlife Day Trip", emoji: "🦁", tagline: "Safari, zoo and butterfly park for a full day of family-friendly wildlife", color: "#F97316", budget: "4,700-5,100 for 2 people", stops: [
      { time: "9:00 AM", place: "MTR (JP Nagar)", type: "Breakfast", note: "Rava idli, masala dosa and filter coffee", cost: "400-500 for 2" },
      { time: "10:00 AM-2:00 PM", place: "Bannerghatta Biological Park", type: "Adventure", note: "Grand safari (lion, tiger, bear & herbivore), zoo, elephant enclosure, reptile section and aviary. Do the safari first, then walk through the zoo. 4-5 hours", cost: "1,400-1,800 for 2" },
      { time: "2:00-3:00 PM", place: "Butterfly Park", type: "Nature", note: "Butterfly conservatory, museum and landscaped garden, great for photography. 45-60 min", cost: "Included in park ticket" },
      { time: "3:15 PM", place: "Nagarjuna Restaurant / The Big Barbeque", type: "Lunch", note: "Andhra meals, chicken biryani and chicken fry, or a leisurely buffet at The Big Barbeque", cost: "700-900 for 2" },
      { time: "5:00 PM", place: "Coffee Break", type: "Coffee", note: "Stop at a cafe for coffee before heading back", cost: "300 for 2" },
      { time: "7:00 PM", place: "Platform65", type: "Dinner", note: "Fun train-served meals, biryani and sizzlers", cost: "800-1,200 for 2" },
      { time: "8:15-9:00 PM", place: "Return Home", type: "Evening", note: "Drive back, reaching home by 8:45-9:00 PM", cost: "Fuel & parking ~600" },
    ]},
    { id: "blr-i", title: "Nandi Hills Sunrise & Vineyard Escape", emoji: "🌄", tagline: "Sunrise, heritage, a vineyard and Adiyogi in one scenic drive", color: "#0EA5E9", budget: "2,700-4,200 for 2 people", stops: [
      { time: "5:00 AM", place: "Leave Bangalore", type: "Departure", note: "Start early to reach Nandi Hills before sunrise", cost: "Free" },
      { time: "6:00-8:30 AM", place: "Nandi Hills", type: "Nature", note: "Sunrise point, Tipu's Drop, Amrita Sarovar, viewpoints and morning photography. 2-2.5 hours", cost: "Free" },
      { time: "8:45 AM", place: "Bhoga Nandeeshwara Temple", type: "Heritage", note: "1,000-year-old Shiva temple with ancient stone carvings, temple pond and Dravidian architecture. 45-60 min", cost: "Free" },
      { time: "10:30 AM", place: "Nandi Upachar", type: "Lunch", note: "South Indian & North Karnataka meals, ragi mudde, chicken biryani and fresh lime soda", cost: "800-1,000 for 2" },
      { time: "12:00-2:30 PM", place: "Grover Zampa Vineyards", type: "Experiences", note: "Vineyard walk, winery tour and optional wine tasting", cost: "1,000-1,500 (optional)" },
      { time: "3:30 PM", place: "Coffee Break", type: "Coffee", note: "Relax at the vineyard cafe before heading to Adiyogi", cost: "300 for 2" },
      { time: "5:00-7:00 PM", place: "Adiyogi", type: "Spiritual", note: "112-ft Adiyogi statue, meditation spaces, sunset views and the evening Light & Sound Show", cost: "Free" },
      { time: "8:00-9:30 PM", place: "Return to Bangalore", type: "Evening", note: "Drive back, reaching Bangalore by 9:30 PM", cost: "Fuel & parking ~1,100" },
    ]},
    { id: "blr-j", title: "Chunchi Falls, Sangama & Mekedatu Adventure", emoji: "🌊", tagline: "Waterfalls, a river confluence and dramatic gorge views along a scenic drive", color: "#0891B2", budget: "3,500-4,500 for 2 people", stops: [
      { time: "6:00 AM", place: "Leave Bangalore", type: "Departure", note: "Drive towards Kanakapura, avoiding city traffic", cost: "Free" },
      { time: "7:30 AM", place: "Local restaurant, Kanakapura", type: "Breakfast", note: "Masala dosa, thatte idli, vada, kesari bath and filter coffee", cost: "300-500 for 2" },
      { time: "9:00-10:30 AM", place: "Chunchi Falls", type: "Nature", note: "Waterfall surrounded by rocky cliffs and greenery. Walk to the viewpoint and relax on the rocks. 1-1.5 hours", cost: "Free" },
      { time: "11:00 AM-12:30 PM", place: "Sangama", type: "Nature", note: "Where the Arkavathi meets the Kaveri river. Walk along the riverbank, spot birds and take a short boat ride towards Mekedatu", cost: "Boat ride extra" },
      { time: "12:30-2:30 PM", place: "Mekedatu Viewpoint", type: "Adventure", note: "Watch the Kaveri squeeze through the narrow gorge and enjoy dramatic rock formations", cost: "Free" },
      { time: "2:30 PM", place: "Vasu Hotel, Kanakapura", type: "Lunch", note: "South Indian meals, ragi mudde and jolada roti, or chicken biryani and mutton meals", cost: "800-1,000 for 2" },
      { time: "4:00 PM", place: "Refreshment Stop", type: "Coffee", note: "Tender coconut, sugarcane juice or ice cream to cool down", cost: "Included below" },
      { time: "5:00 PM", place: "Local Shopping, Kanakapura", type: "Shopping", note: "Fresh honey, homemade pickles, ragi products and handmade bamboo items", cost: "Optional" },
      { time: "6:00 PM", place: "Sunset Stop", type: "Nature", note: "Pull over at a scenic countryside viewpoint to watch the sunset", cost: "Free" },
      { time: "7:30 PM", place: "The Fisherman's Wharf / Rasta Cafe", type: "Dinner", note: "Wood-fired pizza, burgers, pasta and sizzlers", cost: "900-1,200 for 2" },
      { time: "9:00 PM", place: "Reach Bangalore", type: "Evening", note: "Arrive home after a full day of nature and light adventure", cost: "Fuel & parking ~1,400" },
    ]},
    { id: "blr-k", title: "Hidden Hills of Tumakuru", emoji: "🌿", tagline: "Forest walks, ancient temples and scenic hilltops for a peaceful countryside escape", color: "#65A30D", budget: "3,000-4,000 for 2 people", stops: [
      { time: "6:00 AM", place: "Leave Bangalore", type: "Departure", note: "Early morning drive on NH-48 towards Devarayanadurga", cost: "Free" },
      { time: "7:45 AM", place: "Namada Chilume & Deer Park", type: "Nature", note: "Spot deer, walk the forest trail, visit the natural spring and capture the morning light. 1 hour", cost: "Free" },
      { time: "9:00 AM", place: "Bhoga Narasimha Temple", type: "Heritage", note: "Calm, less-crowded temple with ancient stone carvings. 30-45 min", cost: "Free" },
      { time: "10:00 AM-12:00 PM", place: "DD Hills (Yoga Narasimha Temple & Fort)", type: "Heritage", note: "Short hill walk, old fort walls, famous viewpoints and cool breeze. 2 hours", cost: "Free" },
      { time: "12:45 PM", place: "Hotel Nanjundeshwara", type: "Lunch", note: "Karnataka meals, ragi mudde, jolada roti, biryani and fresh buttermilk", cost: "800-1,000 for 2" },
      { time: "2:30-4:00 PM", place: "Mandaragiri", type: "Adventure", note: "Peacock Feather Jain Temple, an easy 15-20 min hill climb and panoramic countryside views", cost: "Free" },
      { time: "4:30 PM", place: "The Blackhills Cafe", type: "Coffee", note: "Coffee, tea, sandwiches and pakodas before heading back", cost: "300 for 2" },
      { time: "5:30 PM", place: "Sunset View", type: "Nature", note: "Stop at a viewpoint around DD Hills or Mandaragiri for golden hour", cost: "Free" },
      { time: "7:00 PM", place: "Ghar Ka Khana by Farmveda", type: "Dinner", note: "North Karnataka meals, chapati & curry, paneer dishes and fresh lime soda", cost: "900 for 2" },
      { time: "8:00-9:30 PM", place: "Return to Bangalore", type: "Evening", note: "Drive back, reaching home by 9:30 PM", cost: "Fuel & parking ~1,200" },
    ]},
    { id: "blr-l", title: "Nandi Hills to Lepakshi Escape", emoji: "🏛️", tagline: "Sunrise at Nandi Hills, temple heritage and Andhra flavours before ending at Adiyogi", color: "#7C3AED", budget: "3,000-3,500 for 2 people", stops: [
      { time: "5:00 AM", place: "Leave Bangalore", type: "Departure", note: "Start before dawn for one of Karnataka's most beautiful sunrises", cost: "Free" },
      { time: "6:00-8:00 AM", place: "Sunrise at Nandi Hills", type: "Nature", note: "Watch the sunrise, visit Tipu's Drop and explore Amrita Sarovar. 2 hours", cost: "Free" },
      { time: "8:30 AM", place: "Bhoga Nandeeshwara Temple", type: "Heritage", note: "9th-century temple with Dravidian architecture, stone carvings and a peaceful pond. 45-60 min", cost: "Free" },
      { time: "10:00 AM", place: "Nandi Upachar", type: "Breakfast", note: "Masala dosa, thatte idli, vada, poori sagu and filter coffee", cost: "400-600 for 2" },
      { time: "11:30 AM-1:30 PM", place: "Lepakshi Temple", type: "Heritage", note: "Hanging Pillar, giant monolithic Nandi, ancient ceiling paintings and intricate stone carvings", cost: "Free" },
      { time: "2:00 PM", place: "Haritha Restaurant, Lepakshi", type: "Lunch", note: "Andhra meals, chicken fry, gongura chicken and fresh buttermilk", cost: "800-1,000 for 2" },
      { time: "5:00-6:30 PM", place: "Adiyogi Shiva Statue", type: "Spiritual", note: "Sunset views, a few peaceful moments of meditation and the beautifully maintained campus", cost: "Free" },
      { time: "6:30 PM", place: "Light & Sound Show", type: "Experiences", note: "Evening projection show illuminating the Adiyogi statue with music and storytelling", cost: "Free" },
      { time: "7:30-9:00 PM", place: "Return to Bangalore", type: "Evening", note: "Relaxed drive back home, arriving by 8:30-9:00 PM", cost: "Fuel & parking ~1,300" },
    ]},
    { id: "blr-m", title: "Paddle • Pray • Play", emoji: "🚣", tagline: "Sunrise kayaking, a hidden temple, bowling and a sweet ending, all around Hoskote", color: "#0D9488", budget: "3,800-4,800 for 2 people", stops: [
      { time: "5:30 AM", place: "Leave Bangalore", type: "Departure", note: "Peaceful sunrise drive towards Hoskote", cost: "Free" },
      { time: "6:00-8:00 AM", place: "Bangalore Kayak Club", type: "Adventure", note: "Sunrise kayaking, calm-water paddling, bird watching and sunrise photography", cost: "1,000 for 2" },
      { time: "8:30 AM", place: "Sri Asha Tiffins, Hoskote", type: "Breakfast", note: "Thatte idli, benne dosa, vada and filter coffee", cost: "350-500 for 2" },
      { time: "10:00 AM", place: "Sri Kateramma Temple", type: "Spiritual", note: "Peaceful countryside temple for prayers and a calm break after the morning adventure. 45 min", cost: "Free" },
      { time: "12:00 PM", place: "Biryani Zone, Hoskote", type: "Lunch", note: "Hoskote donne biryani, chicken kabab and mutton fry, or Karnataka meals and veg biryani", cost: "700-1,000 for 2" },
      { time: "2:30-4:30 PM", place: "Timezone, Forum Shantiniketan Mall", type: "Entertainment", note: "Bowling, arcade games, basketball challenge, racing games and air hockey", cost: "1,000 for 2" },
      { time: "5:00 PM", place: "Dessert & Coffee", type: "Coffee", note: "Magnolia Bakery, Glen's Bakehouse or Milano Ice Cream for a sweet, relaxed ending", cost: "500-700 for 2" },
      { time: "6:30-7:30 PM", place: "Drive Back Home", type: "Evening", note: "Relaxed drive back, arriving by 7:30-8:00 PM", cost: "Fuel & parking ~700" },
    ]},
  ],
};

const typeColors = {
  Breakfast: "#F59E0B", Nature: "#10B981", Museum: "#8B5CF6",
  Heritage: "#06B6D4", Lunch: "#EF4444", Coffee: "#92400E",
  Evening: "#F97316", Dinner: "#EC4899", Food: "#EF4444",
  Adventure: "#EF4444", Brunch: "#F59E0B", Shopping: "#8B5CF6",
  Departure: "#22C55E", Spiritual: "#A855F7", Experiences: "#0EA5E9",
  Entertainment: "#F43F5E",
};

function PhotoGallery({ place, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useState(() => {
    async function fetchPhotos() {
      const imgs = await getPlacePhotos(place.placeId);
      setPhotos(imgs);
      setLoading(false);
    }
    fetchPhotos();
  }, [place.placeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.95)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex items-center justify-between border-b border-white border-opacity-10">
          <div>
            <h2 className="text-white font-black text-lg">{place.name}</h2>
            <p className="text-white opacity-40 text-xs">{photos.length} photos</p>
          </div>
          <button onClick={onClose} className="text-white opacity-50 hover:opacity-100 text-xl font-bold">X</button>
        </div>
        <div className="relative w-full" style={{ height: "280px" }}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-white opacity-40">Loading photos...</p>
            </div>
          ) : photos.length > 0 ? (
            <img src={photos[activeIndex]} alt={place.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-white opacity-40">No photos available</p>
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button onClick={() => setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "rgba(0,0,0,0.6)" }}>←</button>
              <button onClick={() => setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))} className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "rgba(0,0,0,0.6)" }}>→</button>
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-white text-xs font-bold" style={{ background: "rgba(0,0,0,0.6)" }}>{activeIndex + 1} / {photos.length}</div>
            </>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {photos.map((photo, index) => (
              <button key={index} onClick={() => setActiveIndex(index)} className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: "64px", height: "64px", border: index === activeIndex ? "2px solid #2563EB" : "2px solid transparent", opacity: index === activeIndex ? 1 : 0.6 }}>
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="p-4 pt-0">
          <button onClick={() => window.open(place.mapsUrl, "_blank")} className="w-full py-3 rounded-2xl text-white font-bold text-sm" style={{ background: cyan }}>View on Map</button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ place, onClose }) {
  const [reviews, setReviews] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [userReview, setUserReview] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [userReviews, setUserReviews] = useState([]);

  useState(() => {
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

function PlanModal({ plan, onClose }) {
  const [stopData, setStopData] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useState(() => {
    if (plan.stops.length === 0) { setLoadingPhotos(false); return; }
    async function fetchPhotos() {
      const results = {};
      await Promise.all(plan.stops.map(async (stop) => {
        const data = await getPlacePhoto(stop.place, "Bengaluru");
        if (data) results[stop.place] = data;
      }));
      setStopData(results);
      setLoadingPhotos(false);
    }
    fetchPhotos();
  }, [plan.id]);

  const validStops = plan.stops.filter((s) => stopData[s.place]?.lat);
  const routeUrl = validStops.length > 0 ? `https://www.google.com/maps/dir/${validStops.map(s => `${stopData[s.place].lat},${stopData[s.place].lng}`).join("/")}` : "https://www.google.com/maps";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "#0F172A", border: `1px solid ${plan.color}40`, maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5" style={{ background: `${plan.color}15`, borderBottom: `1px solid ${plan.color}30` }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{plan.emoji}</div>
              <div>
                <h2 className="text-white font-black text-xl">{plan.title}</h2>
                <p className="text-sm" style={{ color: plan.color }}>{plan.tagline}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white opacity-50 text-xl font-bold ml-2">X</button>
          </div>
          {plan.budget && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: `${plan.color}40` }}>Budget: {plan.budget}</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "rgba(255,255,255,0.1)" }}>{plan.stops.length} stops</span>
            </div>
          )}
        </div>
        <div className="overflow-y-auto p-5" style={{ maxHeight: "72vh" }}>
          <div className="flex flex-col gap-3 mb-6">
            {plan.stops.map((stop, index) => {
              const typeColor = typeColors[stop.type] || plan.color;
              const data = stopData[stop.place];
              return (
                <div key={index} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {data?.photoUrl ? (
                    <div className="w-full h-40 overflow-hidden"><img src={data.photoUrl} alt={stop.place} className="w-full h-full object-cover" /></div>
                  ) : loadingPhotos ? (
                    <div className="w-full h-32 flex items-center justify-center" style={{ background: `${plan.color}10` }}><p className="text-white opacity-30 text-xs">Loading photo...</p></div>
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center text-4xl" style={{ background: `${plan.color}10` }}>{plan.emoji}</div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${typeColor}20`, color: typeColor }}>{stop.type}</span>
                      <span className="text-white opacity-40 text-xs">{stop.time}</span>
                    </div>
                    <h3 className="text-white font-black text-base mb-1">{stop.place}</h3>
                    <p className="text-white opacity-60 text-sm mb-3">{stop.note}</p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {stop.cost && <span className="text-xs font-semibold" style={{ color: plan.color }}>Cost: {stop.cost}</span>}
                      {data?.mapsUrl && <button onClick={() => window.open(data.mapsUrl, "_blank")} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white" style={{ background: "rgba(6,182,212,0.3)" }}>View on Map</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${plan.color}30` }}>
            <div className="p-3" style={{ background: `${plan.color}15` }}>
              <p className="text-white font-bold text-sm">Full Day Route</p>
              <p className="text-white opacity-50 text-xs">All {plan.stops.length} stops</p>
            </div>
            {loadingPhotos && (
              <div className="p-8 text-center"><p className="text-white opacity-40 text-sm">Loading map...</p></div>
            )}
          </div>
          <button
            className="w-full py-4 rounded-2xl text-white font-black text-sm tracking-widest uppercase"
            style={{ background: plan.color, opacity: !loadingPhotos && validStops.length > 0 ? 1 : 0.5 }}
            disabled={loadingPhotos || validStops.length === 0}
            onClick={() => {
              window.open(routeUrl, "_blank");
              onClose();
            }}
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceCard({ place, isSpinResult, onReview, onSpin, onGallery }) {
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

// City center coordinates, used for live weather lookups.
const CITY_COORDS = {
  Bengaluru: { lat: 12.9716, lon: 77.5946 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Hyderabad: { lat: 17.385, lon: 78.4867 },
  Goa: { lat: 15.2993, lon: 74.124 },
};

// Rough mapping from Open-Meteo's weather codes to an emoji + label.
function describeWeatherCode(code) {
  if (code === 0) return { emoji: "☀️", label: "Clear" };
  if ([1, 2].includes(code)) return { emoji: "🌤️", label: "Partly cloudy" };
  if (code === 3) return { emoji: "☁️", label: "Cloudy" };
  if ([45, 48].includes(code)) return { emoji: "🌫️", label: "Foggy" };
  if ([51, 53, 55, 56, 57].includes(code)) return { emoji: "🌦️", label: "Drizzle" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { emoji: "🌧️", label: "Rainy" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { emoji: "❄️", label: "Snow" };
  if ([95, 96, 99].includes(code)) return { emoji: "⛈️", label: "Storm" };
  return { emoji: "🌡️", label: "—" };
}

function WeatherBox({ cityName }) {
  const [weather, setWeather] = useState(null); // { tempC, emoji, label } | "error" | null (loading)
  const coords = CITY_COORDS[cityName] || CITY_COORDS.Bengaluru;

  useState(() => {
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
    return () => { cancelled = true; };
  }, [cityName]);

  return (
    <div className="rounded-2xl p-4 flex flex-col justify-center" style={glassCard}>
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#06B6D4" }}>Weather</p>
      {weather === null && <div className="h-6 w-20 rounded bg-white/10 animate-pulse mt-1" />}
      {weather === "error" && <p className="text-white opacity-50 text-sm">Unavailable</p>}
      {weather && weather !== "error" && (
        <p className="text-white font-black text-lg leading-tight">
          {weather.emoji} {weather.tempC}°C
          <span className="block text-xs font-semibold opacity-60">{weather.label}</span>
        </p>
      )}
    </div>
  );
}

const CITY_FACTS = {
  Bengaluru: [
    "Bengaluru is called the Garden City for its many parks and green cover.",
    "Cubbon Park was laid out in 1870 and covers about 300 acres in the city center.",
    "Bengaluru sits at roughly 900m elevation, giving it a cooler climate than most Indian cities.",
    "The city is home to India's first science museum, the Visvesvaraya Industrial and Technological Museum.",
    "Lalbagh Botanical Garden's Glass House was inspired by London's Crystal Palace.",
  ],
};

function FactsBox({ cityName }) {
  const facts = CITY_FACTS[cityName] || CITY_FACTS.Bengaluru;
  const [index, setIndex] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % facts.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [facts.length]);

  return (
    <div className="rounded-2xl p-4 flex flex-col justify-center" style={glassCard}>
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#06B6D4" }}>Did you know?</p>
      <p className="text-white text-xs leading-snug opacity-70">{facts[index]}</p>
    </div>
  );
}

export default function CityPage() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const { user, authLoading, login, logout } = useAuth();
  const plans = cityPlans[cityName] || [];

  const [mode, setMode] = useState("spin");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [foodVeg, setFoodVeg] = useState(null);
  const [foodCuisine, setFoodCuisine] = useState(null);
  const [experienceType, setExperienceType] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // Ref for the "Where do you want to go?" filter panel.
  const filterPanelRef = useRef(null);

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

  // Exact, closed list of allowed "Experiences" sub-types — nothing outside this list
  // is considered a valid Experience, regardless of what the data source returns.
  // The aerial/flying ones are marked locked (temporarily unavailable, shown as
  // disabled "Soon" pills) rather than removed outright.
  const EXPERIENCE_TYPES = [
    { label: "Vineyard & Winery Tour" },
    { label: "Chocolate Factory" }, { label: "Horse Ranch" }, { label: "Yoga Retreat" }, { label: "Ayurveda" },
    { label: "Microlight Flying", locked: true }, { label: "Paragliding", locked: true },
    { label: "Para Sailing", locked: true }, { label: "Hot Air Balloon", locked: true },
  ];

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

  const pillBase = "px-4 py-2 rounded-full text-sm font-semibold transition-all border border-white border-opacity-10 text-white opacity-60 bg-white bg-opacity-10";
  const pillActive = "px-4 py-2 rounded-full text-sm font-semibold transition-all text-white";

  const distanceKm = (lat1, lng1, lat2, lng2) => {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Minimum bar for a place to be considered "real" and currently open for business.
  // Applied to every raw searchPlaces() result before it ever reaches the UI.
  const MIN_RATING = 3.5;
  const MIN_REVIEWS = 5;

  const isQualityPlace = (place, cat = null) => {
    if (!place || !place.name) return false;

    // Drop anything Google/the data source has flagged as closed.
    const status = (place.business_status || place.businessStatus || "").toUpperCase();
    if (status === "CLOSED_PERMANENTLY" || status === "CLOSED_TEMPORARILY") return false;
    if (place.permanently_closed === true) return false;

    // Drop listings with no real location — a common sign of a bad/fake entry.
    if (place.lat == null || place.lng == null) return false;

    // Drop listings with no meaningful review history — low-credibility / likely fake.
    const totalRatings = place.totalRatings || 0;
    const rating = place.rating || 0;
    if (totalRatings < MIN_REVIEWS) return false;
    if (rating < MIN_RATING) return false;

    // "Experiences" now runs a targeted search per sub-type (see places.js) —
    // the query itself already guarantees relevance, so we no longer re-check
    // result text against a whitelist here. The old whitelist required the
    // place's name/type to literally contain words like "Paragliding", which
    // caused real results to get dropped even when the search was correct
    // (e.g. an operator listed on Google simply as "Bir Adventures").

    return true;
  };

  const filterQualityPlaces = (places, cat = null) => (places || []).filter((p) => isQualityPlace(p, cat));

  // Tries the place area first, then a broader "near <area>" search, then the whole city.
  // Returns { list, forced } where `forced` is the single most-famous pick when the
  // category didn't exist locally and we had to widen the search.
  const getCategoryCandidates = async (cat, budget, searchCity, cityWide, foodFilters) => {
    const local = filterQualityPlaces(await searchPlaces(cat, budget, searchCity, false, foodFilters, experienceType), cat);
    if (local.length > 0) return { list: local, forced: null };

    const near = filterQualityPlaces(await searchPlaces(cat, budget, searchCity, true, foodFilters, experienceType), cat);
    if (near.length > 0) {
      const famous = [...near].sort((a, b) => (b.rating * (b.totalRatings || 1)) - (a.rating * (a.totalRatings || 1)))[0];
      return { list: near, forced: famous };
    }

    const cityList = filterQualityPlaces(await searchPlaces(cat, budget, cityWide, false, foodFilters, experienceType), cat);
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
        const lists = await Promise.all(selectedCategories.map((cat) => searchPlaces(cat, selectedBudget, searchCity, false, foodFilters, experienceType)));
        const combined = lists
          .flatMap((list, i) => filterQualityPlaces(list, selectedCategories[i]))
          .sort(() => Math.random() - 0.5);
        setResults(combined);
      } else {
        const cat = selectedCategories[0] || null;
        const data = filterQualityPlaces(await searchPlaces(cat, selectedBudget, searchCity, false, foodFilters, experienceType), cat);
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
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0F172A" }}>

      {/* Navbar */}
      <div className="px-3 pt-3">
        <nav className="relative flex items-center justify-between px-4 sm:px-12 py-3 sm:py-5 bg-white rounded-2xl">
          <button onClick={() => navigate("/")} className="text-black font-medium text-sm sm:text-lg hover:opacity-60 transition-opacity whitespace-nowrap">
            ← Back
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-black font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap">
            Just Spin
          </span>
          {authLoading ? null : user ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-black text-white font-bold text-xs sm:text-base px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:opacity-80 transition-all whitespace-nowrap"
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
            <button
              onClick={login}
              className="bg-black text-white font-bold text-xs sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 rounded-full hover:opacity-80 transition-all whitespace-nowrap"
            >
              Sign in
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="flex justify-center px-4 pt-8 pb-12">
        <div className="w-full max-w-2xl">

        {/* CENTER — your existing content, unchanged */}
        <div className="w-full">

        {/* Weather + Did you know */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <WeatherBox cityName={cityName} />
          <FactsBox cityName={cityName} />
        </div>

        {/* Toggle */}
        <div className="flex gap-2 p-1 rounded-full my-4" style={glassCard}>
          <button onClick={() => setMode("spin")} className="flex-1 py-2.5 rounded-full text-sm font-bold text-white transition-all" style={{ background: mode === "spin" ? blue : "transparent", opacity: mode === "spin" ? 1 : 0.6 }}>
            Spin
          </button>
          <button onClick={() => setMode("discover")} className="flex-1 py-2.5 rounded-full text-sm font-bold text-white transition-all" style={{ background: mode === "discover" ? blue : "transparent", opacity: mode === "discover" ? 1 : 0.6 }}>
            Discover {cityName}
          </button>
        </div>

        {/* DISCOVER MODE */}
        {mode === "discover" && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#06B6D4" }}>Day Plans for {cityName}</p>
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
              )) : (
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
              <div className="rounded-2xl p-4 mb-3" style={glassCard}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06B6D4" }}>Pick your area</p>
                <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {bangaloreLocations.map((loc) => (<option key={loc} value={loc} style={{ background: "#0F172A", color: "white" }}>{loc}</option>))}
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
                          if (cat.label === "Experiences") { setExperienceType(null); }
                        } else if (selectedCategories.length < 3) {
                          setSelectedCategories([...selectedCategories, cat.label]);
                        }
                      }}
                      className={`${isSelected ? pillActive : pillBase} transition-all duration-300`}
                      style={{
                        ...(isSelected ? { background: blue } : {}),
                        opacity: cat.locked ? 0.35 : (atLimit ? 0.3 : undefined),
                        cursor: cat.locked ? "not-allowed" : undefined,
                      }}
                    >
                      {cat.emoji} {cat.label}{cat.locked ? " 🔒 Soon" : ""}
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
                <div className="flex gap-2 flex-wrap mb-4">
                  {["Veg", "Non-Veg"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setFoodVeg(foodVeg === v ? null : v)}
                      className={foodVeg === v ? pillActive : pillBase}
                      style={foodVeg === v ? { background: blue } : {}}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <p className="text-white opacity-60 text-xs font-semibold mb-2">Cuisine</p>
                <div className="flex gap-2 flex-wrap">
                  {["South Indian", "North Indian", "Cafe", "Brewery", "Pub & Bar"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setFoodCuisine(foodCuisine === c ? null : c)}
                      className={foodCuisine === c ? pillActive : pillBase}
                      style={foodCuisine === c ? { background: blue } : {}}
                    >
                      {c}
                    </button>
                  ))}
                  {["Chinese", "Italian", "Continental"].map((c) => (
                    <button key={c} disabled className={pillBase} style={{ opacity: 0.35, cursor: "not-allowed" }}>
                      {c} <span className="ml-1 opacity-80">🔒 Soon</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCategories.includes("Experiences") && (
              <div className="rounded-2xl p-4 mb-3" style={glassCard}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06B6D4" }}>Experience Type</p>
                <div className="flex gap-2 flex-wrap">
                  {EXPERIENCE_TYPES.map((exp) => (
                    <button
                      key={exp.label}
                      disabled={exp.locked}
                      onClick={() => !exp.locked && setExperienceType(experienceType === exp.label ? null : exp.label)}
                      className={experienceType === exp.label ? pillActive : pillBase}
                      style={{
                        ...(experienceType === exp.label ? { background: blue } : {}),
                        opacity: exp.locked ? 0.35 : undefined,
                        cursor: exp.locked ? "not-allowed" : undefined,
                      }}
                    >
                      {exp.label}{exp.locked ? " 🔒 Soon" : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}



            <div className="rounded-2xl p-4 mb-5" style={glassCard}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#06B6D4" }}>Budget</p>
              <div className="flex gap-2 flex-wrap">
                {budgets.map((b) => (
                  <button key={b} onClick={() => setSelectedBudget(selectedBudget === b ? null : b)} className={selectedBudget === b ? pillActive : pillBase} style={selectedBudget === b ? { background: blue } : {}}>
                    {b}
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
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-4 sm:px-8 py-4 z-40" style={{ background: "#000000", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex-1" />
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <button aria-label="Home" onClick={() => navigate("/")} className="w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: blue }}>🏠</button>
          <button aria-label="Discover" onClick={() => setMode("discover")} className="w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: blue }}>🧭</button>
          <button aria-label="Favorites" className="w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: blue }}>❤️</button>
          <button aria-label="Profile" onClick={() => (user ? logout() : login())} className="w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: blue }}>👤</button>
        </div>
        <div className="flex-1 flex justify-end">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSf3PxnHxYwtKcTz-UyFmDVebJY6RPasDZpwwmQbgaiX7OKcSw/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white border-2 border-white/30 hover:border-white/60 transition-all whitespace-nowrap"
          >
            Feedback
          </a>
        </div>
      </div>
    </div>
  );
}