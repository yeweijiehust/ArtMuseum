import { ImagePlus, Languages, LogIn, LogOut, UserPlus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Locale } from "@artmuseum/shared";
import { switchLocalePath } from "../locale.js";
import { useLogout, useMe } from "../queries.js";

export function Header({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const me = useMe();
  const logout = useLogout();
  const user = me.data?.user;
  const changeLocale = (nextLocale: Locale) => {
    window.localStorage.setItem("artmuseum.locale", nextLocale);
    navigate(switchLocalePath(location.pathname, nextLocale));
  };
  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate(`/${locale}`);
  };
  return (
    <header className="site-header">
      <Link className="brand-link" to={`/${locale}`} aria-label={t("nav.home")}>
        <span className="brand-mark">AM</span>
        <span>{t("app.name")}</span>
      </Link>
      <nav className="nav-actions" aria-label={t("nav.primary")}>
        <div className="language-switcher" aria-label={t("language.switch")}>
          <Languages size={18} aria-hidden="true" />
          <button className={locale === "en" ? "text-button active" : "text-button"} onClick={() => changeLocale("en")} type="button">
            EN
          </button>
          <button className={locale === "zh" ? "text-button active" : "text-button"} onClick={() => changeLocale("zh")} type="button">
            中文
          </button>
        </div>
        {user ? (
          <>
            <Link className="icon-link" to={`/${locale}/upload`} title={t("nav.upload")}>
              <ImagePlus size={18} aria-hidden="true" />
              <span>{t("nav.upload")}</span>
            </Link>
            <Link className="text-link" to={`/${locale}/mine`}>
              {t("nav.mine")}
            </Link>
            <button className="icon-button" onClick={handleLogout} type="button" title={t("nav.logout")}>
              <LogOut size={18} aria-hidden="true" />
              <span>{t("nav.logout")}</span>
            </button>
          </>
        ) : (
          <>
            <Link className="icon-link" to={`/${locale}/login`} title={t("nav.login")}>
              <LogIn size={18} aria-hidden="true" />
              <span>{t("nav.login")}</span>
            </Link>
            <Link className="icon-link primary" to={`/${locale}/register`} title={t("nav.register")}>
              <UserPlus size={18} aria-hidden="true" />
              <span>{t("nav.register")}</span>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
