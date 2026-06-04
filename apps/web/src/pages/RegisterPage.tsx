import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { api } from "../api.js";
import { FormError } from "../components/FormError.js";
import { isLocale } from "../locale.js";

type RegisterValues = {
  displayName: string;
  email: string;
  password: string;
};

export function RegisterPage() {
  const { t } = useTranslation();
  const { locale } = useParams();
  const currentLocale = isLocale(locale) ? locale : "en";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const schema = z.object({
    displayName: z.string().trim().min(2, t("forms.displayNameShort")).max(80, t("forms.displayNameLong")),
    email: z.string().email(t("forms.emailInvalid")),
    password: z.string().min(8, t("forms.passwordShort")).max(128, t("forms.passwordLong"))
  });
  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      email: "",
      password: ""
    }
  });
  const register = useMutation({
    mutationFn: api.register,
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
      navigate(`/${currentLocale}`);
    }
  });
  const submit = form.handleSubmit((values) => register.mutate(values));
  return (
    <section className="form-page">
      <div className="form-panel">
        <h1>{t("auth.registerTitle")}</h1>
        <form className="stack-form" onSubmit={submit}>
          <label>
            {t("forms.displayName")}
            <input autoComplete="name" {...form.register("displayName")} />
            {form.formState.errors.displayName ? <span className="field-error">{form.formState.errors.displayName.message}</span> : null}
          </label>
          <label>
            {t("forms.email")}
            <input autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? <span className="field-error">{form.formState.errors.email.message}</span> : null}
          </label>
          <label>
            {t("forms.password")}
            <input type="password" autoComplete="new-password" {...form.register("password")} />
            {form.formState.errors.password ? <span className="field-error">{form.formState.errors.password.message}</span> : null}
          </label>
          <FormError error={register.error} />
          <button className="command-button" type="submit" disabled={register.isPending}>
            <UserPlus size={18} aria-hidden="true" />
            <span>{t("auth.registerAction")}</span>
          </button>
        </form>
        <p className="muted-link">
          {t("auth.haveAccount")} <Link to={`/${currentLocale}/login`}>{t("nav.login")}</Link>
        </p>
      </div>
    </section>
  );
}
