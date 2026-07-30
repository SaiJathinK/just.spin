// City metadata: hero images, tagline, spot counts, lock state.
// NOTE: 'images' are currently unused by CityPage — verify before keeping;
// if you do use them for a hero/banner, request them at ~1200w/q70/webp, not 2600w/q95.
export const cityData = {
  Bengaluru: {
    images: [
      "https://images.unsplash.com/photo-1580714234233-2b3fc19c6fd0?w=2600&q=95&fit=crop&dpr=2&auto=format", // Bangalore cityscape
      "https://images.unsplash.com/photo-1580017830165-98fb8112ab98?w=2600&q=95&fit=crop&dpr=2&auto=format", // Bangalore Palace
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=2600&q=95&fit=crop&dpr=2&auto=format", // Bangalore skyline
      "https://images.unsplash.com/photo-1600100397608-f7febcf6db86?w=2600&q=95&fit=crop&dpr=2&auto=format", // Cubbon Park / Lalbagh greenery
    ],
    tagline: "Silicon Valley of India",
    spotCount: 340,
    locked: false,
  },
  Chennai: {
    images: [
      "https://images.unsplash.com/photo-1582651957983-56e9d6062e1c?w=2200&q=92&fit=crop&dpr=2&auto=format",
    ],
    tagline: "Gateway of South India",
    spotCount: 0,
    locked: true,
  },
  Hyderabad: {
    images: [
      "https://images.unsplash.com/photo-1533461502717-83546f485d24?w=2200&q=92&fit=crop&dpr=2&auto=format",
    ],
    tagline: "City of Nizams",
    spotCount: 0,
    locked: true,
  },
  Goa: {
    images: [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=2200&q=92&fit=crop&dpr=2&auto=format",
    ],
    tagline: "Pearl of the Orient",
    spotCount: 0,
    locked: true,
  },
};
