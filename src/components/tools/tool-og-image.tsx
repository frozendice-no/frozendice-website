import { ImageResponse } from "next/og";

type ToolOgImageOptions = {
  eyebrow: string;
  title: string;
  description: string;
};

export const toolOgImageSize = {
  width: 1200,
  height: 630,
};

export const toolOgImageType = "image/png";

export function createToolOgImage({
  eyebrow,
  title,
  description,
}: ToolOgImageOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #14101e 0%, #22174f 52%, #f0a14f 100%)",
          color: "#f8f7fb",
          padding: "56px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-15% auto auto 62%",
            width: "420px",
            height: "420px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "24px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#f6c78b",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "9999px",
                background: "#f0a14f",
              }}
            />
            {eyebrow}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "860px" }}>
            <div style={{ fontSize: "74px", lineHeight: 1.02, fontWeight: 700 }}>
              {title}
            </div>
            <div
              style={{
                fontSize: "28px",
                lineHeight: 1.35,
                color: "rgba(248,247,251,0.82)",
                maxWidth: "760px",
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "28px",
            }}
          >
            <div style={{ display: "flex", gap: "12px", color: "rgba(248,247,251,0.8)" }}>
              <span>Frozen Dice</span>
              <span style={{ color: "#f6c78b" }}>Free D&D Tools</span>
            </div>
            <div style={{ color: "#f8f7fb" }}>frozendice.no/tools</div>
          </div>
        </div>
      </div>
    ),
    toolOgImageSize,
  );
}
