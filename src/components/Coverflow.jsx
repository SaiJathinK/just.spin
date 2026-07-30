// Coverflow Gallery — Originkit
// Converted from TSX to plain JSX (types stripped, logic unchanged).

import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_SLIDES = [{ image: { src: "" }, title: "" }];

// Fixed internals (no longer exposed as controls).
const PERSPECTIVE = 1600;
const SCALE_STEP = 0.16;
const MAX_VISIBLE = 2;
const DEPTH = 240;

function cssTransition(t) {
  const dur = t && typeof t.duration === "number" ? t.duration : 0.6;
  let ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const e = t?.ease;
  if (Array.isArray(e) && e.length === 4) {
    ease = `cubic-bezier(${e[0]}, ${e[1]}, ${e[2]}, ${e[3]})`;
  } else if (typeof e === "string") {
    const map = { linear: "linear", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out" };
    ease = map[e] || "ease";
  }
  return { dur, ease };
}

const COMPONENT_DEFAULTS = {
  cardWidth: 400,
  cardHeight: 400,
  radius: 3,
  tilt: 12,
  sideTilt: 8,
  gap: 8,
  opacity: 60,
  autoplay: false,
  autoplayDirection: "rightToLeft",
  transition: { type: "tween", duration: 0.6, delay: 2.5, ease: [0.22, 1, 0.36, 1] },
  showTitle: true,
  titleFont: { fontFamily: "Inter", fontWeight: 700, fontSize: "28px", letterSpacing: "-0.02em", lineHeight: "1.1em" },
  titleColor: "#ffffff",
  titlePosition: { position: "bottomLeft", paddingLeft: 22, paddingRight: 22, paddingTop: 24, paddingBottom: 24 },
};

/**
 * Smooth 3D Slideshow / Coverflow
 * Active card sits upright centre, neighbours tilt back in perspective.
 * Click any card (or pass activeIndex + onActiveChange) to bring it to centre.
 */
export default function Coverflow(props) {
  props = { ...COMPONENT_DEFAULTS, ...props };
  const {
    slides = DEFAULT_SLIDES,
    cardWidth,
    cardHeight,
    radius,
    tilt,
    sideTilt,
    gap,
    opacity,
    transition,
    autoplay,
    autoplayDirection,
    showTitle,
    titleFont,
    titleColor,
    titlePosition,
    activeIndex,
    onActiveChange,
    style,
  } = props;

  const tp = titlePosition || {};
  const corner = tp.position || "bottomLeft";
  const isTop = corner === "topLeft" || corner === "topRight";
  const isRight = corner === "topRight" || corner === "bottomRight";
  const padLeft = tp.paddingLeft ?? 22;
  const padRight = tp.paddingRight ?? 22;
  const padTop = tp.paddingTop ?? 24;
  const padBottom = tp.paddingBottom ?? 24;

  const list = slides && slides.length ? slides : DEFAULT_SLIDES;
  const n = list.length;

  const loop = true;
  const [internalActive, setInternalActive] = useState(0);
  // Supports being driven externally (controlled) via activeIndex/onActiveChange,
  // or used standalone (uncontrolled) — falls back to internal state either way.
  const active = activeIndex !== undefined ? activeIndex : internalActive;
  const setActive = (updater) => {
    const next = typeof updater === "function" ? updater(active) : updater;
    if (onActiveChange) onActiveChange(next);
    setInternalActive(next);
  };

  useEffect(() => {
    setInternalActive((a) => Math.max(0, Math.min(n - 1, a)));
  }, [n]);

  const moveDur = transition && typeof transition.duration === "number" ? transition.duration : 0.6;
  const lockRef = useRef(false);
  const lock = useCallback(() => {
    lockRef.current = true;
    window.setTimeout(() => {
      lockRef.current = false;
    }, Math.max(50, moveDur * 1000));
  }, [moveDur]);

  const step = useCallback(
    (dir) => {
      if (lockRef.current) return;
      lock();
      setActive((a) => (((a + dir) % n) + n) % n);
    },
    [n, lock] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleCardClick = useCallback(
    (i) => {
      if (autoplay || lockRef.current) return;
      lock();
      setActive((a) => (i === a ? (a + 1) % n : i));
    },
    [autoplay, n, lock] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const delay = transition && typeof transition.delay === "number" ? transition.delay : 2.5;
  useEffect(() => {
    if (!autoplay || n < 2) return;
    const ms = Math.max(0.3, delay) * 1000;
    const dir = autoplayDirection === "leftToRight" ? -1 : 1;
    const id = window.setInterval(() => step(dir), ms);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDirection, delay, n, step]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    },
    [step]
  );

  const { dur, ease } = cssTransition(transition);
  const transitionCss = `transform ${dur}s ${ease}, opacity ${dur}s ${ease}`;

  const effectiveRadius = (Math.max(0, Math.min(20, radius)) / 20) * (Math.min(cardWidth, cardHeight) / 2);
  const dim = 1 - Math.max(0, Math.min(100, opacity)) / 100;

  const rootStyle = {
    ...(style || {}),
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    perspective: `${PERSPECTIVE}px`,
    overflow: "hidden",
    outline: "none",
  };

  return (
    <div style={rootStyle} tabIndex={0} role="group" aria-roledescription="carousel" onKeyDown={onKeyDown}>
      <div style={{ position: "relative", width: cardWidth, height: cardHeight, transformStyle: "preserve-3d" }}>
        {list.map((slide, i) => {
          let rel = i - active;
          if (loop) {
            if (rel > n / 2) rel -= n;
            if (rel < -n / 2) rel += n;
          }
          const ax = Math.abs(rel);
          const visible = ax <= MAX_VISIBLE;
          const isActive = rel === 0;
          const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
          const tx = rel * (gap * 30);
          const tz = -ax * DEPTH;
          const ry = -rel * tilt;
          const rz = rel * sideTilt;
          const src = slide.image?.src || "";

          const cardStyle = {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: cardWidth,
            height: cardHeight,
            borderRadius: effectiveRadius,
            overflow: "hidden",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
            transition: transitionCss,
            opacity: visible ? 1 : 0,
            cursor: autoplay || isActive ? "default" : "pointer",
            pointerEvents: visible && !autoplay ? "auto" : "none",
            backgroundColor: "#1a1a1a",
          };

          return (
            <div key={i} style={cardStyle} onClick={() => handleCardClick(i)} aria-label={slide.title} aria-hidden={!visible}>
              {src ? (
                <img
                  src={src}
                  alt={slide.image?.alt || slide.title || ""}
                  draggable={false}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none" }}
                />
              ) : null}

              {showTitle && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: isTop
                        ? "linear-gradient(0deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)"
                        : "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: padLeft,
                      right: padRight,
                      [isTop ? "top" : "bottom"]: isTop ? padTop : padBottom,
                      textAlign: isRight ? "right" : "left",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        color: titleColor,
                        fontSize: 28,
                        fontWeight: 700,
                        lineHeight: "1.1em",
                        letterSpacing: "-0.02em",
                        whiteSpace: "pre-line",
                        textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                        ...(titleFont || {}),
                      }}
                    >
                      {slide.title}
                    </span>
                  </div>
                </>
              )}

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#000000",
                  opacity: isActive ? 0 : dim,
                  transition: `opacity ${dur}s ${ease}`,
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
