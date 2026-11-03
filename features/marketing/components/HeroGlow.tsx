"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import styles from "./homepage-motion.module.css";

// A soft highlight that follows the mouse across the hero. Mouse only (no touch), and off for reduced motion.
export function HeroGlow() {
  const glow = useRef<HTMLDivElement>(null),
    reduced = useReducedMotion();
  useEffect(() => {
    const element = glow.current, host = element?.parentElement;
    if (!element || !host || reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = host.getBoundingClientRect();
        element.style.setProperty("--gx", `${((event.clientX - box.left) / box.width) * 100}%`);
        element.style.setProperty("--gy", `${((event.clientY - box.top) / box.height) * 100}%`);
      });
    };
    host.addEventListener("pointermove", move, { passive: true });
    return () => { cancelAnimationFrame(frame); host.removeEventListener("pointermove", move); };
  }, [reduced]);
  return <div ref={glow} aria-hidden="true" className={styles.heroGlow} />;
}
