import { useTranslation } from "react-i18next";
import { ApiClientError } from "../api.js";

export function FormError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  if (!error) {
    return null;
  }
  if (error instanceof ApiClientError) {
    return <p className="form-error">{t(`errors.${error.code}`)}</p>;
  }
  return <p className="form-error">{t("errors.BAD_REQUEST")}</p>;
}
