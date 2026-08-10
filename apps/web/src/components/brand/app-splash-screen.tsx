"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  APP_SPLASH_FADE_OUT_MS,
  getAppSplashExitDelay,
  shouldWaitForAppLoad
} from "@/lib/app-splash";

type SplashPhase = "visible" | "collapsed" | "exiting" | "hidden";

function waitForWindowLoad(): Promise<void> {
  if (!shouldWaitForAppLoad(document.readyState)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

export function AppSplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>("visible");
  const prefersReducedMotion = useReducedMotion();
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.classList.add("app-splash-active");
      document.body.classList.remove("app-splash-cleared");
    }

    return () => {
      if (typeof window !== "undefined") {
        document.body.classList.remove("app-splash-active");
        document.body.classList.add("app-splash-cleared");
      }
    };
  }, []);

  useEffect(() => {
    if (phase === "hidden" && typeof window !== "undefined") {
      document.body.classList.remove("app-splash-active");
      document.body.classList.add("app-splash-cleared");
    }
  }, [phase]);

  useEffect(() => {
    const storedTheme = typeof window !== "undefined" && typeof window.localStorage !== "undefined"
      ? window.localStorage.getItem("brids-ui-theme")
      : null;
    const isStoredLight = storedTheme === "light";
    const isSystemLight = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches;

    const timer = setTimeout(() => {
      setIsLightMode(isStoredLight || (storedTheme === null && !!isSystemLight));
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const startedAt = performance.now();

    // Schedule the collapse phase at 1.8s (1800ms)
    const collapseTimer = window.setTimeout(() => {
      if (isMounted) {
        setPhase("collapsed");
      }
    }, 1800);

    async function finishSplash() {
      await waitForWindowLoad();

      const remainingMs = getAppSplashExitDelay(performance.now() - startedAt);
      window.setTimeout(() => {
        if (!isMounted) {
          return;
        }

        setPhase("exiting");
        window.setTimeout(() => {
          if (isMounted) {
            setPhase("hidden");
          }
        }, APP_SPLASH_FADE_OUT_MS);
      }, remainingMs);
    }

    void finishSplash();

    return () => {
      isMounted = false;
      window.clearTimeout(collapseTimer);
    };
  }, []);

  const cyanVariants = useMemo(() => ({
    visible: prefersReducedMotion
      ? {}
      : {
          x: [-20, 20, -20],
          y: [-10, 20, -10],
          scale: [1, 1.12, 1],
          transition: {
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        },
    collapsed: prefersReducedMotion
      ? {}
      : {
          x: [-20, 20, -20],
          y: [-10, 20, -10],
          scale: [1, 1.12, 1],
          transition: {
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        },
    exiting: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 2,
      transition: {
        duration: APP_SPLASH_FADE_OUT_MS / 1000,
        ease: "easeOut" as const
      }
    }
  }), [prefersReducedMotion]);

  const violetVariants = useMemo(() => ({
    visible: prefersReducedMotion
      ? {}
      : {
          x: [20, -20, 20],
          y: [20, -10, 20],
          scale: [1.12, 0.96, 1.12],
          transition: {
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        },
    collapsed: prefersReducedMotion
      ? {}
      : {
          x: [20, -20, 20],
          y: [20, -10, 20],
          scale: [1.12, 0.96, 1.12],
          transition: {
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        },
    exiting: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 2,
      transition: {
        duration: APP_SPLASH_FADE_OUT_MS / 1000,
        ease: "easeOut" as const
      }
    }
  }), [prefersReducedMotion]);

  const blueVariants = useMemo(() => ({
    visible: prefersReducedMotion
      ? {}
      : {
          y: [10, -20, 10],
          scale: [0.96, 1.06, 0.96],
          transition: {
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        },
    collapsed: prefersReducedMotion
      ? {}
      : {
          y: [10, -20, 10],
          scale: [0.96, 1.06, 0.96],
          transition: {
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        },
    exiting: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 1.5,
      transition: {
        duration: APP_SPLASH_FADE_OUT_MS / 1000,
        ease: "easeOut" as const
      }
    }
  }), [prefersReducedMotion]);

  const centerVariants = useMemo(() => ({
    visible: prefersReducedMotion
      ? {}
      : {
          scale: [1, 1.08, 1],
          opacity: [0.55, 0.72, 0.55],
          transition: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        },
    collapsed: prefersReducedMotion
      ? {}
      : {
          scale: [1, 1.08, 1],
          opacity: [0.55, 0.72, 0.55],
          transition: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        },
    exiting: {
      scale: prefersReducedMotion ? 1 : 4.5,
      opacity: [0.65, 0.92, 0],
      transition: {
        duration: APP_SPLASH_FADE_OUT_MS / 1000,
        times: [0, 0.35, 1],
        ease: "easeOut" as const
      }
    }
  }), [prefersReducedMotion]);

  const bMarkVariants = useMemo(() => ({
    initial: {
      opacity: 0,
      scale: 0.95,
      x: 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.62,
        delay: 0.42,
        ease: "easeOut" as const
      }
    },
    collapsed: {
      opacity: 1,
      scale: 1,
      x: 47.7, // Mathematically centered in the 116.37px viewbox (58.185 - 10.5)
      transition: {
        duration: 0.7,
        ease: [0.25, 1, 0.5, 1] as [number, number, number, number]
      }
    },
    exiting: {
      opacity: [1, 0.8, 0],
      scale: prefersReducedMotion ? 1 : 70,
      x: 47.7,
      transition: {
        duration: APP_SPLASH_FADE_OUT_MS / 1000,
        times: [0, 0.25, 1],
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
      }
    }
  }), [prefersReducedMotion]);

  const letterVariants = useMemo(() => {
    return (index: number) => {
      let fadeDuration = 0.05;
      let fadeDelay = 0.0;

      if (index === 3) {
        // 'D' barely moves
        fadeDuration = 0.12;
        fadeDelay = 0.06;
      } else if (index === 4) {
        // 'S' slides all the way to merge with 'B' in the center
        fadeDuration = 0.45;
        fadeDelay = 0.15;
      }

      return {
        initial: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.62,
            delay: 0.42 + index * 0.05,
            ease: "easeOut" as const
          }
        },
        collapsed: {
          opacity: 0,
          transition: {
            duration: fadeDuration,
            delay: fadeDelay,
            ease: "easeOut" as const
          }
        },
        exiting: {
          opacity: 0,
          transition: {
            duration: APP_SPLASH_FADE_OUT_MS / 1000,
            ease: "easeOut" as const
          }
        }
      };
    };
  }, []);

  const wordmarkVariants = useMemo(() => ({
    initial: { x: 0 },
    visible: {
      x: 0,
      transition: {
        duration: 0.62,
        delay: 0.42,
        ease: "easeOut" as const
      }
    },
    collapsed: {
      x: -51.5, // Aligns 'S' center (109.5 - 51.5 = 58.0) directly with centered 'B' (58.185)
      transition: {
        duration: 0.7,
        ease: [0.25, 1, 0.5, 1] as [number, number, number, number]
      }
    },
    exiting: {
      x: -51.5,
      transition: {
        duration: APP_SPLASH_FADE_OUT_MS / 1000,
        ease: "easeOut" as const
      }
    }
  }), []);

  if (phase === "hidden") {
    return null;
  }

  // Common hardware acceleration styles
  const hardwareAcceleration = { willChange: "transform, opacity", transform: "translateZ(0)" };
  const svgHardwareAcceleration = { willChange: "transform, opacity" };

  return (
    <motion.div
      className={`app-splash app-splash--${phase}`}
      aria-label="BRIDS loading screen"
      role="status"
      style={hardwareAcceleration}
      animate={{
        backgroundColor: phase === "exiting" && isLightMode ? "#f5f7ff" : "#04060f",
        opacity: phase === "exiting" ? 0 : 1
      }}
      transition={{
        duration: APP_SPLASH_FADE_OUT_MS / 1000,
        ease: "easeOut"
      }}
    >
      <motion.div
        className="app-splash__glow app-splash__glow--cyan"
        aria-hidden="true"
        variants={cyanVariants}
        animate={phase}
        style={hardwareAcceleration}
      />
      <motion.div
        className="app-splash__glow app-splash__glow--violet"
        aria-hidden="true"
        variants={violetVariants}
        animate={phase}
        style={hardwareAcceleration}
      />
      <motion.div
        className="app-splash__glow app-splash__glow--blue"
        aria-hidden="true"
        variants={blueVariants}
        animate={phase}
        style={hardwareAcceleration}
      />
      <motion.div
        className="app-splash__glow app-splash__glow--center"
        aria-hidden="true"
        variants={centerVariants}
        animate={phase}
        style={hardwareAcceleration}
      />
      <div className="app-splash__content" style={hardwareAcceleration}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 116.37 38.5"
          className="w-[clamp(200px,28vw,280px)] h-auto overflow-visible select-none pointer-events-none"
          style={svgHardwareAcceleration}
        >
          <defs>
            <style>{`
              .cls-svg-1 {
                clip-path: url(#clippath-logo);
              }
              .cls-svg-2 {
                fill: none;
                stroke-width: 0px;
              }
              .cls-svg-3 {
                fill: url(#linear-gradient-logo);
                stroke-width: 0px;
              }
              .cls-svg-4 {
                fill: #fff;
                stroke-width: 0px;
              }
            `}</style>
            <clipPath id="clippath-logo">
              <path className="cls-svg-2" d="M10.32.43L1.07,5.77c-.29.17-.47.48-.47.82v18.42c0,.52.43.94.95.94h0c.52,0,.94-.43.94-.95V7.13s7.35-4.23,7.35-4.23v21.59L1.14,29.52c-.31.15-.52.42-.53.77-.01.35.17.61.47.78l9.29,5.37c.15.08.31.13.48.13s.33-.04.47-.13l9.3-5.37c.29-.17.47-.48.47-.82v-10.74c0-.36-.22-.62-.54-.81l-5.17-2.98c-.47-.23-1.04-.02-1.26.45-.23.47-.03,1.04.45,1.26l4.63,2.67v9.59l-8.35,4.82-7.3-4.21,7.67-4.43c.32-.16.53-.49.53-.85V1.25c0-.34-.18-.65-.47-.82-.15-.08-.31-.13-.48-.13s-.33.04-.48.13"/>
            </clipPath>
            <linearGradient id="linear-gradient-logo" x1="-3.94" y1="7750.69" x2="-2.94" y2="7750.69" gradientTransform="translate(-289946.98 140.09) rotate(90) scale(37.41 -37.41)" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#00b0f9"/>
              <stop offset=".17" stopColor="#03aff9"/>
              <stop offset=".31" stopColor="#0dadf9"/>
              <stop offset=".44" stopColor="#1ea9f9"/>
              <stop offset=".57" stopColor="#37a4f9"/>
              <stop offset=".69" stopColor="#569df9"/>
              <stop offset=".81" stopColor="#7d95f9"/>
              <stop offset=".92" stopColor="#a98bf9"/>
              <stop offset="1" stopColor="#cf84f9"/>
              <stop offset="1" stopColor="#cf84f9"/>
            </linearGradient>
          </defs>
          <motion.g
            id="Wordmark"
            variants={wordmarkVariants}
            initial="initial"
            animate={phase}
            style={svgHardwareAcceleration}
          >
            <motion.path className="cls-svg-4" d="M44.85,20.36c-.09-.36-.25-.67-.51-.91-.25-.24-.62-.42-1.08-.55-.47-.12-1.09-.19-1.86-.19h-9.61c-.35,0-.64.28-.64.64s.28.64.64.64h9.1c.51,0,.93.02,1.26.06.33.04.59.12.78.23.19.11.32.28.4.49.07.21.11.49.11.83,0,.22,0,.41-.02.59h1.52c.02-.18.03-.38.03-.59,0-.47-.04-.88-.12-1.25M45.38,26.24c-.08-.27-.17-.5-.29-.7-.12-.2-.26-.37-.41-.5-.15-.14-.31-.25-.47-.34-.38-.21-.8-.33-1.28-.35.38-.03.72-.14,1.02-.34.13-.09.25-.19.38-.33.09-.1.17-.21.25-.34h-1.62s-.09.07-.14.1c-.17.1-.38.19-.65.24-.26.06-.59.1-.97.12-.38.02-.83.03-1.35.03h-8.06c-.35,0-.64.29-.64.64s.28.64.64.64h8.06c.6,0,1.11.01,1.55.03.44.02.81.05,1.11.11.31.05.55.13.74.22.18.1.33.22.43.37.11.15.18.34.21.56.04.22.06.48.06.78,0,.38-.02.71-.06.99-.03.27-.11.5-.21.69-.1.19-.25.34-.43.46-.19.11-.43.2-.74.26-.3.06-.67.1-1.11.12-.44.02-.95.03-1.55.03h-8.06c-.35,0-.64.29-.64.64s.28.64.64.64h8.57c.77,0,1.43-.03,1.98-.1.55-.07,1.02-.17,1.4-.32.38-.14.69-.32.92-.53.23-.21.41-.46.53-.74.12-.28.2-.6.25-.96.04-.35.06-.74.06-1.17,0-.35-.04-.66-.11-.93" variants={letterVariants(0)} style={svgHardwareAcceleration} />
            <motion.path className="cls-svg-4" d="M65.5,24.63c.17-.27.29-.6.36-.99.02-.1.03-.2.05-.31h-1.5c-.01.24-.06.44-.13.62-.08.19-.2.35-.36.46-.17.12-.4.21-.7.27-.3.06-.69.11-1.16.13-.47.03-1.04.03-1.72.03h-7.91c-.43,0-.78.35-.78.78v4.59c0,.42.35.77.77.77.21,0,.41-.09.54-.23.14-.14.23-.33.23-.54v-4.09h6.9c.68,0,1.26,0,1.72.03.47.02.85.07,1.16.13.31.06.54.16.71.27.17.12.29.27.36.46.08.19.12.42.14.69.01.27.02.59.02.96v1.63c0,.37.3.67.67.67h.2c.37,0,.67-.3.67-.67v-1.63c0-.45-.02-.85-.07-1.2-.05-.35-.14-.66-.28-.91-.14-.26-.34-.47-.6-.62-.25-.16-.6-.27-1.02-.34.43-.06.78-.18,1.07-.34.28-.16.51-.38.68-.66M65.94,21.2c-.02-.33-.08-.63-.19-.9-.1-.26-.27-.5-.5-.7-.22-.2-.54-.36-.97-.5-.42-.13-.95-.23-1.59-.3-.64-.06-1.44-.1-2.37-.1h-8.06c-.35,0-.64.28-.64.64s.29.64.64.64h8.06c.68,0,1.25,0,1.72.02.47.01.85.05,1.16.11.3.05.54.13.7.23.16.1.28.24.36.41.08.17.12.38.14.63.01.23.02.49.02.8h1.54c0-.36,0-.69-.03-.99" variants={letterVariants(1)} style={svgHardwareAcceleration} />
            <motion.path className="cls-svg-4" d="M72.88,18.71c-.42,0-.77.34-.77.77v2.71h1.53v-2.71c0-.42-.34-.77-.76-.77M72.11,23.33v6.9c0,.21.09.4.23.54.14.14.33.22.54.22.42,0,.76-.34.76-.76v-6.9h-1.53Z" variants={letterVariants(2)} style={svgHardwareAcceleration} />
            <motion.path className="cls-svg-4" d="M94.94,21.4c-.1-.46-.27-.85-.5-1.19-.23-.34-.55-.62-.97-.84-.42-.22-.95-.39-1.59-.5-.65-.11-1.44-.16-2.37-.16h-8.57c-.35,0-.64.28-.64.64s.29.64.64.64h8.57c.68,0,1.25.02,1.72.05.47.04.85.12,1.15.23.3.11.54.28.71.5.16.22.28.51.36.87.03.17.06.35.08.55h1.53c-.03-.28-.08-.55-.13-.79M95.13,23.33h-1.53c0,.45.01.95.01,1.52,0,.74,0,1.36-.02,1.89-.01.53-.06.97-.13,1.33-.08.36-.2.65-.36.87-.17.22-.4.38-.71.5-.3.11-.69.19-1.16.23-.47.03-1.05.05-1.72.05h-7.67v-4.13c0-.42-.34-.77-.77-.77-.21,0-.4.09-.54.22-.14.14-.23.33-.23.55v4.63c0,.43.35.78.78.78h8.43c.94,0,1.73-.05,2.37-.16.64-.11,1.17-.28,1.59-.5.42-.22.74-.5.97-.84.23-.33.39-.73.5-1.19.11-.46.17-.97.19-1.54.02-.57.03-1.21.03-1.91,0-.54,0-1.05-.01-1.52" variants={letterVariants(3)} style={svgHardwareAcceleration} />
            <motion.path className="cls-svg-4" d="M114.54,20.89c0-.05-.02-.1-.03-.16-.06-.31-.18-.59-.34-.85-.16-.25-.38-.46-.66-.64-.27-.18-.62-.33-1.03-.45-.42-.12-.91-.21-1.49-.26-.58-.06-1.25-.09-2.02-.09h-1.53c-.94,0-1.75.04-2.45.11-.69.07-1.29.17-1.78.31-.5.14-.9.31-1.21.51-.32.21-.57.44-.75.69-.18.26-.3.54-.37.87-.06.32-.1.67-.1,1.04,0,.08,0,.15,0,.22h1.54c0-.07,0-.14,0-.22,0-.43.08-.79.22-1.08.15-.29.42-.52.8-.69.38-.17.9-.29,1.56-.36.66-.07,1.5-.11,2.53-.11h1.53c.77,0,1.41.02,1.94.05.52.03.94.12,1.26.25.32.14.55.34.69.61.07.14.12.3-.15.49.07.37.38.64.75.64h.02c.47,0,.83-.43.75-.89M114.55,26.58c-.04-.32-.13-.61-.26-.87-.13-.26-.32-.49-.57-.69-.24-.2-.57-.38-.99-.51-.41-.14-.92-.24-1.52-.31-.6-.07-1.33-.1-2.17-.1h-2.11c-.69,0-1.27-.02-1.77-.04-.49-.03-.91-.08-1.25-.15-.34-.07-.61-.16-.82-.26-.16-.09-.3-.19-.4-.3h-1.76c.04.17.11.33.2.47.14.25.34.47.62.67.27.2.64.36,1.09.49.46.13,1.02.23,1.69.3.67.07,1.47.11,2.41.11h2.11c.85,0,1.54.03,2.07.11.53.08.94.2,1.23.37.29.17.49.4.58.69.1.29.15.65.15,1.09s-.07.8-.22,1.11c-.14.31-.39.55-.74.74-.35.19-.83.33-1.42.41-.59.09-1.34.13-2.23.13h-2.05c-.76,0-1.41-.02-1.93-.05-.52-.04-.94-.12-1.26-.26-.32-.14-.55-.34-.69-.62-.07-.14-.12-.3-.16-.49-.07-.38-.38-.66-.76-.66h0c-.48,0-.84.43-.76.91,0,.05.02.1.03.15.06.32.18.6.34.85.16.25.38.46.65.65.27.19.62.34,1.03.45.41.12.91.21,1.49.27.58.06,1.25.09,2.01.09h2.05c.85,0,1.6-.04,2.24-.11.64-.08,1.18-.19,1.64-.34.45-.15.82-.33,1.12-.54.29-.21.52-.45.69-.72.17-.27.29-.57.36-.89.07-.33.1-.68.1-1.05s-.02-.72-.06-1.05" variants={letterVariants(4)} style={svgHardwareAcceleration} />
          </motion.g>
          <motion.g
            id="B-Mark"
            variants={bMarkVariants}
            initial="initial"
            animate={phase}
            style={{ transformOrigin: "10.5px 19.25px", ...svgHardwareAcceleration }}
          >
            <g className="cls-svg-1">
              <rect className="cls-svg-3" x="-9.51" y="-1.29" width="40.7" height="39.44" transform="translate(-10.13 14.25) rotate(-48.26)"/>
            </g>
          </motion.g>
        </svg>
      </div>
      {isLightMode && (
        <motion.div
          className="absolute inset-0 bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={phase === "exiting" ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            duration: (APP_SPLASH_FADE_OUT_MS / 1000) * 0.85,
            ease: "easeIn"
          }}
          style={hardwareAcceleration}
        />
      )}
    </motion.div>
  );
}

