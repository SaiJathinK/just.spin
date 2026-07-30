// Premium "luxury travel" theme tokens.
// Palette, glass-card recipe, and shared gradients used across CityPage.

export const colors = {
  bg: "#050B18",
  card: "#0A1826",
  cardSecondary: "#161E3B",
  accent: "#11D5FF",
  accentSecondary: "#6E6BFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#A7B3C7",
  border: "rgba(255,255,255,0.08)",
};

// Soft glassmorphism card recipe — 20px radius, subtle blur, thin border, soft depth.
export const glassCard = {
  background: "linear-gradient(180deg, rgba(20,29,45,.95), rgba(10,24,38,.95))",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: "20px",
  boxShadow: "0 12px 40px rgba(0,0,0,.35), 0 0 30px rgba(17,213,255,.04)",
};

// Primary CTA gradient (Spin button, active toggle, category chips).
export const blue = "linear-gradient(135deg, #19C6FF, #5D6EFF)";
// Secondary accent gradient, used sparingly for contrast moments.
export const cyan = "linear-gradient(to right, #11D5FF, #0891b2)";

// Soft ambient glow to pair with the primary gradient (buttons, active states).
export const accentGlow = "0 0 30px rgba(17,213,255,.30)";

// Gentle lift used on hover across cards and buttons.
export const hoverLift = {
  transform: "translateY(-3px)",
  transition: "transform 250ms ease, box-shadow 250ms ease",
};