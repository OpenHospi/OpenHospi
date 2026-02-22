import type { MetadataRoute } from "next";
import { APP_NAME } from "@openhospi/shared/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description:
      "Free, open-source student housing platform for the Netherlands",
    start_url: "/nl",
    display: "standalone",
    background_color: "#f5fafa",
    theme_color: "#0D9488",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
