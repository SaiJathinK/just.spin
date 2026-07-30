// Flip Gallery — Originkit
// Converted from TSX to plain JSX (types stripped, logic unchanged).

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_ITEMS = [
  { image: { src: "" }, focusY: 50 },
];

const DEFAULTS = {
  fit: "cover",
  focusY: 50,
  rounded: 16,
  transition: {
    type: "tween",
    stiffness: 800,
    damping: 60,
    mass: 1,
    duration: 0.6,
    ease: "easeInOut",
  },
  tilt: true,
  tiltOptions: {
    effect: "repel",
    tiltLimit: 15,
    scale: 123,
  },
};

const HALF_TURN = 180;
const PERSPECTIVE = 900;

const srcOf = (image) => (typeof image === "string" ? image : image?.src ?? "");

const focusOf = (item) =>
  Math.min(100, Math.max(0, typeof item?.focusY === "number" ? item.focusY : DEFAULTS.focusY));

export default function ImageFlip(props) {
  const {
    images,
    fit = DEFAULTS.fit,
    rounded = DEFAULTS.rounded,
    transition = DEFAULTS.transition,
    tilt = DEFAULTS.tilt,
    tiltOptions = DEFAULTS.tiltOptions,
    style,
  } = props;

  const items = useMemo(() => {
    const list = (images ?? []).filter((item) => srcOf(item?.image));
    return list.length ? list : DEFAULT_ITEMS;
  }, [images]);
  const urls = useMemo(() => items.map((item) => srcOf(item.image)), [items]);

  const tiltRef = useRef(null);

  const effect = tiltOptions?.effect ?? DEFAULTS.tiltOptions.effect;
  const tiltLimit = tiltOptions?.tiltLimit ?? DEFAULTS.tiltOptions.tiltLimit;
  const scale = (tiltOptions?.scale ?? DEFAULTS.tiltOptions.scale) / 100;

  const [angle, setAngle] = useState(0);
  const [index, setIndex] = useState(0);
  const [faces, setFaces] = useState({ a: 0, b: 0 });

  const facing = (deg) => (Math.abs(Math.round(deg / HALF_TURN)) % 2 === 0 ? "a" : "b");

  const flip = (dir) => {
    const n = urls.length;
    if (n < 2) return;

    const next = (index + dir + n) % n;

    const nextAngle = angle + dir * HALF_TURN;
    const incoming = facing(nextAngle);
    setFaces((f) => ({ ...f, [incoming]: next }));
    setIndex(next);
    setAngle(nextAngle);
  };

  // Exposes flip() to a parent via ref, so external prev/next controls can drive it too.
  const apiRef = props.apiRef;
  useEffect(() => {
    if (apiRef) apiRef.current = { flip, goTo: (i) => flipTo(i) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, index, urls.length]);

  const flipTo = (targetIndex) => {
    const n = urls.length;
    if (n < 2 || targetIndex === index) return;
    let diff = targetIndex - index;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    const dir = diff > 0 ? 1 : -1;
    const nextAngle = angle + dir * HALF_TURN;
    const incoming = facing(nextAngle);
    setFaces((f) => ({ ...f, [incoming]: targetIndex }));
    setIndex(targetIndex);
    setAngle(nextAngle);
  };

  const focusKey = JSON.stringify(items.map(focusOf));
  const lastFocusRef = useRef(null);

  useEffect(() => {
    const next = JSON.parse(focusKey);
    const last = lastFocusRef.current;
    lastFocusRef.current = next;
    if (!last) return;
    const moved = next.findIndex((f, i) => i < last.length && last[i] !== f);
    if (moved < 0) return;
    setFaces((f) => ({ ...f, [facing(angle)]: moved }));
    setIndex(moved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, angle]);

  const onClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width / 2;
    flip(isLeft ? -1 : 1);
  };

  const onMove = (e) => {
    const el = tiltRef.current;
    if (!tilt || !el) return;
    const { width, height, top, left } = el.getBoundingClientRect();
    const mult = effect === "repel" ? -1 : 1;
    const tiltX = ((e.clientY - top) / height - 0.5) * (tiltLimit * 2) * mult;
    const tiltY = ((e.clientX - left) / width - 0.5) * -(tiltLimit * 2) * mult;
    el.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  const faceStyle = (slot) => ({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: fit,
    objectPosition: fit === "cover" ? `center ${focusOf(items[slot % items.length])}%` : "center",
    borderRadius: rounded,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    userSelect: "none",
    pointerEvents: "none",
  });

  return (
    <div
      style={{
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: `${PERSPECTIVE}px`,
        cursor: urls.length > 1 ? "pointer" : "default",
      }}
    >
      <div
        ref={tiltRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.2s ease-out",
          willChange: "transform",
        }}
      >
        <motion.div
          animate={{ rotateY: angle }}
          transition={transition}
          style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d" }}
        >
          <img src={urls[faces.a % urls.length]} alt="" draggable={false} style={faceStyle(faces.a)} />
          <img
            src={urls[faces.b % urls.length]}
            alt=""
            draggable={false}
            style={{ ...faceStyle(faces.b), transform: "rotateY(180deg)" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
