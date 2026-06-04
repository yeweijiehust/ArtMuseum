import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { api } from "../api.js";
import { FormError } from "../components/FormError.js";
import { isLocale } from "../locale.js";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { t } = useTranslation();
  const { locale } = useParams();
  const currentLocale = isLocale(locale) ? locale : "en";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const schema = z.object({
    email: z.string().email(t("forms.emailInvalid")),
    password: z.string().min(8, t("forms.passwordShort"))
  });
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const login = useMutation({
    mutationFn: api.login,
    onSuccess: async (data) => {
      queryClient.setQueryData(["me"], data);
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      navigate(`/${currentLocale}`);
    }
  });
  const submit = form.handleSubmit((values) => login.mutate(values));
  return (
    <section className="form-page">
      <div className="form-panel">
        <h1>{t("auth.loginTitle")}</h1>
        <form className="stack-form" onSubmit={submit}>
          <label>
            {t("forms.email")}
            <input autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? <span className="field-error">{form.formState.errors.email.message}</span> : null}
          </label>
          <label>
            {t("forms.password")}
            <input type="password" autoComplete="current-password" {...form.register("password")} />
            {form.formState.errors.password ? <span className="field-error">{form.formState.errors.password.message}</span> : null}
          </label>
          <FormError error={login.error} />
          <button className="command-button" type="submit" disabled={login.isPending}>
            <LogIn size={18} aria-hidden="true" />
            <span>{t("auth.loginAction")}</span>
          </button>
        </form>
        <p className="muted-link">
          {t("auth.needAccount")} <Link to={`/${currentLocale}/register`}>{t("nav.register")}</Link>
        </p>
      </div>
    </section>
  );
}
