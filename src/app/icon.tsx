import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const contentType = "image/png";

export const size = {
  width: 32,
  height: 32,
};

export default async function Icon() {
  const logoPath = path.join(process.cwd(), "public", "images", "tesda-logo.png");
  const logoBuffer = await readFile(logoPath);
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#ffffff",
          borderRadius: "6px",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg height="26" viewBox="0 0 26 26" width="26">
          <image height="26" href={logoDataUrl} width="26" />
        </svg>
      </div>
    ),
    size,
  );
}
