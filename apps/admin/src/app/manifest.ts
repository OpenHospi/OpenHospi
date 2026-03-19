import { APP_NAME } from "@openhospi/shared/constants";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} Admin`,
    short_name: `${APP_NAME} Admin`,
    description: "OpenHospi Admin Dashboard",
    start_url: "/",
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
