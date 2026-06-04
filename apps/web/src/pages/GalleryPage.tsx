import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GalleryImage } from "@artmuseum/shared";
import { api } from "../api.js";
import { GalleryGrid } from "../components/GalleryGrid.js";
import { Lightbox } from "../components/Lightbox.js";

export function GalleryPage() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const images = useQuery({
    queryKey: ["images"],
    queryFn: api.listImages
  });
  return (
    <section className="page-stack">
      <div className="page-heading">
        <h1>{t("gallery.title")}</h1>
        <p>{t("gallery.subtitle")}</p>
      </div>
      {images.isLoading ? <p className="status-text">{t("common.loading")}</p> : null}
      {images.isError ? <p className="form-error">{t("gallery.loadFailed")}</p> : null}
      {images.data ? <GalleryGrid images={images.data.items} onSelect={setSelectedImage} /> : null}
      {selectedImage ? <Lightbox image={selectedImage} onClose={() => setSelectedImage(null)} /> : null}
    </section>
  );
}
