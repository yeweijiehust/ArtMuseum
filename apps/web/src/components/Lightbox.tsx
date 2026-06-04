import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { GalleryImage } from "@artmuseum/shared";

export function Lightbox({ image, onClose }: { image: GalleryImage; onClose: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={image.title}>
      <div className="lightbox-media">
        <img src={image.url} alt={image.altText ?? image.title} />
      </div>
      <aside className="lightbox-details">
        <button className="icon-only" onClick={onClose} type="button" title={t("common.close")} aria-label={t("common.close")}>
          <X size={22} aria-hidden="true" />
        </button>
        <h2>{image.title}</h2>
        <p>{image.description || t("gallery.noDescription")}</p>
        <span>{t("gallery.by", { name: image.ownerDisplayName })}</span>
      </aside>
    </div>
  );
}
