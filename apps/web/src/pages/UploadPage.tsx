import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { api } from "../api.js";
import { FormError } from "../components/FormError.js";
import { isLocale } from "../locale.js";

type UploadValues = {
  title: string;
  description: string;
  altText: string;
  file: FileList;
};

export function UploadPage() {
  const { t } = useTranslation();
  const { locale } = useParams();
  const currentLocale = isLocale(locale) ? locale : "en";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const schema = z.object({
    title: z.string().trim().min(1, t("forms.titleRequired")).max(120, t("forms.titleLong")),
    description: z.string().max(1000, t("forms.descriptionLong")),
    altText: z.string().max(300, t("forms.altLong")),
    file: z.custom<FileList>((value) => value instanceof FileList && value.length === 1, t("forms.fileRequired"))
  });
  const form = useForm<UploadValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      altText: ""
    }
  });
  const upload = useMutation({
    mutationFn: api.uploadImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      await queryClient.invalidateQueries({ queryKey: ["my-images"] });
      navigate(`/${currentLocale}/mine`);
    }
  });
  const submit = form.handleSubmit((values) => {
    const file = values.file[0];
    if (!file) {
      return;
    }
    const data = new FormData();
    data.append("title", values.title);
    data.append("description", values.description);
    data.append("altText", values.altText);
    data.append("file", file);
    upload.mutate(data);
  });
  return (
    <section className="form-page">
      <div className="form-panel wide">
        <h1>{t("upload.title")}</h1>
        <form className="stack-form" onSubmit={submit}>
          <label>
            {t("forms.imageFile")}
            <input accept="image/jpeg,image/png,image/webp" type="file" {...form.register("file")} />
            {form.formState.errors.file ? <span className="field-error">{form.formState.errors.file.message}</span> : null}
          </label>
          <label>
            {t("forms.title")}
            <input {...form.register("title")} />
            {form.formState.errors.title ? <span className="field-error">{form.formState.errors.title.message}</span> : null}
          </label>
          <label>
            {t("forms.description")}
            <textarea rows={5} {...form.register("description")} />
            {form.formState.errors.description ? <span className="field-error">{form.formState.errors.description.message}</span> : null}
          </label>
          <label>
            {t("forms.altText")}
            <input {...form.register("altText")} />
            {form.formState.errors.altText ? <span className="field-error">{form.formState.errors.altText.message}</span> : null}
          </label>
          <FormError error={upload.error} />
          <button className="command-button" type="submit" disabled={upload.isPending}>
            <ImagePlus size={18} aria-hidden="true" />
            <span>{t("upload.action")}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
