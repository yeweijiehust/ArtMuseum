import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { GalleryImage, ImageUpdateBody } from "@artmuseum/shared";
import { api } from "../api.js";
import { FormError } from "../components/FormError.js";

type EditValues = {
  title: string;
  description: string;
  altText: string;
};

export function MyUploadsPage() {
  const { t } = useTranslation();
  const images = useQuery({
    queryKey: ["my-images"],
    queryFn: api.myImages
  });
  return (
    <section className="page-stack">
      <div className="page-heading">
        <h1>{t("mine.title")}</h1>
        <p>{t("mine.subtitle")}</p>
      </div>
      {images.isLoading ? <p className="status-text">{t("common.loading")}</p> : null}
      {images.isError ? <p className="form-error">{t("mine.loadFailed")}</p> : null}
      {images.data?.items.length === 0 ? (
        <section className="empty-state">
          <h2>{t("mine.emptyTitle")}</h2>
          <p>{t("mine.emptyBody")}</p>
        </section>
      ) : null}
      <div className="management-list">
        {images.data?.items.map((image) => <ManageImageItem image={image} key={image.id} />)}
      </div>
    </section>
  );
}

function ManageImageItem({ image }: { image: GalleryImage }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const schema = z.object({
    title: z.string().trim().min(1, t("forms.titleRequired")).max(120, t("forms.titleLong")),
    description: z.string().max(1000, t("forms.descriptionLong")),
    altText: z.string().max(300, t("forms.altLong"))
  });
  const form = useForm<EditValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: image.title,
      description: image.description ?? "",
      altText: image.altText ?? ""
    }
  });
  const update = useMutation({
    mutationFn: (body: ImageUpdateBody) => api.updateImage(image.id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      await queryClient.invalidateQueries({ queryKey: ["my-images"] });
    }
  });
  const remove = useMutation({
    mutationFn: () => api.deleteImage(image.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      await queryClient.invalidateQueries({ queryKey: ["my-images"] });
    }
  });
  const submit = form.handleSubmit((values) =>
    update.mutate({
      title: values.title,
      description: values.description,
      altText: values.altText
    })
  );
  return (
    <article className="management-item">
      <img src={image.url} alt={image.altText ?? image.title} />
      <form className="stack-form compact" onSubmit={submit}>
        <label>
          {t("forms.title")}
          <input {...form.register("title")} />
          {form.formState.errors.title ? <span className="field-error">{form.formState.errors.title.message}</span> : null}
        </label>
        <label>
          {t("forms.description")}
          <textarea rows={3} {...form.register("description")} />
        </label>
        <label>
          {t("forms.altText")}
          <input {...form.register("altText")} />
        </label>
        <FormError error={update.error ?? remove.error} />
        <div className="button-row">
          <button className="command-button small" type="submit" disabled={update.isPending}>
            <Save size={16} aria-hidden="true" />
            <span>{t("mine.save")}</span>
          </button>
          <button className="danger-button" onClick={() => remove.mutate()} type="button" disabled={remove.isPending} title={t("mine.delete")}>
            <Trash2 size={16} aria-hidden="true" />
            <span>{t("mine.delete")}</span>
          </button>
        </div>
      </form>
    </article>
  );
}
