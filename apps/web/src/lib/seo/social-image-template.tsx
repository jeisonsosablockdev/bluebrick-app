import type { ReactElement } from "react";

export function renderSocialImage(): ReactElement {
  return (
    <div
      style={{
        alignItems: "stretch",
        background: "linear-gradient(135deg, #04111d 0%, #0a1e2f 48%, #0d2740 100%)",
        color: "white",
        display: "flex",
        height: "100%",
        justifyContent: "space-between",
        padding: "64px 72px",
        position: "relative",
        width: "100%"
      }}
    >
      <div
        style={{
          background: "radial-gradient(circle at top left, rgba(34,211,238,0.24), transparent 48%)",
          inset: 0,
          position: "absolute"
        }}
      />

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative"
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 18
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(34,211,238,0.28), rgba(14,165,233,0.14))",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 24,
              display: "flex",
              fontSize: 46,
              fontWeight: 700,
              height: 86,
              justifyContent: "center",
              letterSpacing: "-0.04em",
              width: 86
            }}
          >
            B
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div
              style={{
                color: "#67e8f9",
                display: "flex",
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase"
              }}
            >
              BRIDS
            </div>
            <div
              style={{
                color: "rgba(226,232,240,0.88)",
                display: "flex",
                fontSize: 24
              }}
            >
              AI discovery infrastructure for real estate
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 760
          }}
        >
          <div
            style={{
              color: "white",
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.05
            }}
          >
            Tokenized property discovery with verifiable public data.
          </div>
          <div
            style={{
              color: "rgba(226,232,240,0.84)",
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              maxWidth: 720
            }}
          >
            Marketplace, transparency, knowledge, and platform pages optimized for search, speed, and trust.
          </div>
        </div>

        <div
          style={{
            color: "rgba(226,232,240,0.78)",
            display: "flex",
            fontSize: 22,
            gap: 24
          }}
        >
          <span>Marketplace</span>
          <span>Transparency</span>
          <span>Knowledge</span>
          <span>Platform</span>
        </div>
      </div>
    </div>
  );
}
