import { ImageResponse } from "next/og";

export const alt = "PatiShop - Petshop urunleri";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 15% 20%, #d1fae5 0%, transparent 35%), radial-gradient(circle at 85% 10%, #fee2e2 0%, transparent 28%), #f8fffb",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "48px",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundColor: "#10b981",
            borderRadius: "18px",
            color: "white",
            fontSize: 38,
            fontWeight: 700,
            padding: "16px 24px",
          }}
        >
          PatiShop
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: "28px",
            textAlign: "center",
          }}
        >
          Petshop urunleri tek adreste
        </div>
        <div
          style={{
            color: "#334155",
            fontSize: 30,
            marginTop: "16px",
            textAlign: "center",
          }}
        >
          Mama, oyuncak, aksesuar ve daha fazlasi
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
