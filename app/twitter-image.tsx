import { ImageResponse } from "next/og";

import { renderSocialImage } from "@/lib/seo/social-image-template";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(renderSocialImage(), size);
}
