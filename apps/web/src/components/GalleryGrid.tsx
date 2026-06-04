import type { GalleryImage } from "@artmuseum/shared";
import { useTranslation } from "react-i18next";

export function GalleryGrid({ images, onSelect }: { images: GalleryImage[]; onSelect: (image: GalleryImage) => void }) {
  const { t } = useTranslation();
  if (images.length === 0) {
    return (
      <section className="empty-state">
        <h2>{t("gallery.emptyTitle")}</h2>
        <p>{t("gallery.emptyBody")}</p>
      </section>
    );
  }
  return (
    <section className="gallery-grid" data-testid="gallery-grid" aria-label={t("gallery.label")}>
      {images.map((image) => (
        <button className="photo-tile" key={image.id} onClick={() => onSelect(image)} type="button">
          <img src={image.url} alt={image.altText ?? image.title} loading="lazy" />
          <span className="photo-caption">
            <strong>{image.title}</strong>
            <span>{image.ownerDisplayName}</span>
          </span>
        </button>
      ))}
    </section>
  );
}
