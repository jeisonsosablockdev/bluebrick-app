import type { ReactElement } from "react";

import { PWA_BACKGROUND_COLOR } from "@/lib/pwa/config";

const BRIDS_MARK_PATH =
  "M10.32.43L1.07,5.77c-.29.17-.47.48-.47.82v18.42c0,.52.43.94.95.94h0c.52,0,.94-.43.94-.95V7.13s7.35-4.23,7.35-4.23v21.59L1.14,29.52c-.31.15-.52.42-.53.77-.01.35.17.61.47.78l9.29,5.37c.15.08.31.13.48.13s.33-.04.47-.13l9.3-5.37c.29-.17.47-.48.47-.82v-10.74c0-.36-.22-.62-.54-.81l-5.17-2.98c-.47-.23-1.04-.02-1.26.45-.23.47-.03,1.04.45,1.26l4.63,2.67v9.59l-8.35,4.82-7.3-4.21,7.67-4.43c.32-.16.53-.49.53-.85V1.25c0-.34-.18-.65-.47-.82-.15-.08-.31-.13-.48-.13s-.33.04-.48.13";

export function renderPwaIcon(size: number): ReactElement {
  const coreSize = Math.round(size * 0.64);
  const logoWidth = Math.round(coreSize * 0.38);
  const logoHeight = Math.round(coreSize * 0.64);

  return (
    <div
      style={{
        alignItems: "center",
        background: `radial-gradient(circle at 30% 28%, rgba(34,211,238,0.28), transparent 38%), linear-gradient(160deg, ${PWA_BACKGROUND_COLOR} 0%, #0a1e2f 48%, #091525 100%)`,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        position: "relative",
        width: "100%"
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(180deg, rgba(5,17,31,0.92), rgba(5,11,22,0.98))",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: Math.round(size * 0.18),
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: coreSize,
          justifyContent: "center",
          width: coreSize
        }}
      >
        <svg
          aria-label="BRIDS mark"
          role="img"
          style={{
            display: "block",
            height: logoHeight,
            width: logoWidth
          }}
          viewBox="0 0 22.54 38.5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="brids-mark-clip">
              <path d={BRIDS_MARK_PATH} />
            </clipPath>
            <linearGradient
              gradientTransform="translate(-289946.98 140.09) rotate(90) scale(37.41 -37.41)"
              gradientUnits="userSpaceOnUse"
              id="brids-mark-gradient"
              x1="-3.94"
              x2="-2.94"
              y1="7750.69"
              y2="7750.69"
            >
              <stop offset="0" stopColor="#00b0f9" />
              <stop offset=".17" stopColor="#03aff9" />
              <stop offset=".31" stopColor="#0dadf9" />
              <stop offset=".44" stopColor="#1ea9f9" />
              <stop offset=".57" stopColor="#37a4f9" />
              <stop offset=".69" stopColor="#569df9" />
              <stop offset=".81" stopColor="#7d95f9" />
              <stop offset=".92" stopColor="#a98bf9" />
              <stop offset="1" stopColor="#cf84f9" />
            </linearGradient>
          </defs>
          <g clipPath="url(#brids-mark-clip)">
            <rect
              fill="url(#brids-mark-gradient)"
              height="39.44"
              transform="translate(-10.13 14.25) rotate(-48.26)"
              width="40.7"
              x="-9.51"
              y="-1.29"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
