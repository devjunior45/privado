import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nortão Empregos",
    short_name: "Nortão Empregos",
    description: "Encontre as melhores oportunidades de emprego na sua região",
    start_url: "/",
    display: "fullscreen",
    background_color: "#000",
    theme_color: "#000",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
