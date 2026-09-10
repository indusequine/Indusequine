import { ImageResponse } from "next/og";

export const alt = "Indusequine — India's First Equestrian Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadCormorant() {
  const css = await (
    await fetch(
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&display=swap",
    )
  ).text();
  const fontUrls = [...css.matchAll(/src: url\(([^)]+)\)/g)].map((m) => m[1]);
  const buffers = await Promise.all(
    fontUrls.map((url) => fetch(url).then((r) => r.arrayBuffer())),
  );
  return buffers;
}

export default async function OpengraphImage() {
  const [regular, italic] = await loadCormorant();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e2419",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1px solid rgba(212,176,122,0.35)",
            margin: 28,
          }}
        />

        <svg width="72" height="72" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 28 }}>
          <path
            d="M12 34 C 12 18, 22 8, 32 8 C 42 8, 52 18, 52 34 L 52 50 L 44 50 L 44 36 C 44 24, 38 18, 32 18 C 26 18, 20 24, 20 36 L 20 50 L 12 50 Z"
            stroke="#d4b07a"
            strokeWidth="1.6"
          />
          <path d="M32 24 L32 46" stroke="#d4b07a" strokeWidth="1.6" />
          <path d="M28 24 L36 24" stroke="#d4b07a" strokeWidth="1.6" />
          <path d="M28 46 L36 46" stroke="#d4b07a" strokeWidth="1.6" />
        </svg>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 14,
            color: "#faf6ed",
            fontFamily: "Cormorant",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Indusequine
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 68,
            lineHeight: 1.15,
            color: "#faf6ed",
            fontFamily: "Cormorant",
            fontWeight: 600,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          India&rsquo;s equestrian marketplace
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 22,
            letterSpacing: 3,
            color: "rgba(250,246,237,0.6)",
          }}
        >
          For the rider. For the horse. For the stable.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant", data: regular, weight: 600, style: "normal" },
        { name: "Cormorant", data: italic, weight: 600, style: "italic" },
      ],
    },
  );
}
