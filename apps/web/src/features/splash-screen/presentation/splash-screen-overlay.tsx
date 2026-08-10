"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSplashScreen } from "../application/use-splash-screen";
import { BrandMotionLogo } from "./brand-motion-logo";

export function SplashScreenOverlay() {
  const { isVisible } = useSplashScreen();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl"
        >
          <BrandMotionLogo />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
