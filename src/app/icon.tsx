import { ImageResponse } from "next/og";
import { AppIcon } from "./app-icon";

export function generateImageMetadata() {
  return [192, 512].map((size) => ({
    id: String(size),
    contentType: "image/png",
    size: { width: size, height: size },
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return new ImageResponse(<AppIcon size={size} />, { width: size, height: size });
}
