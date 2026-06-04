import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes, useParams } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "./components/Header.js";
import { getPreferredLocale, isLocale } from "./locale.js";
import { GalleryPage } from "./pages/GalleryPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { MyUploadsPage } from "./pages/MyUploadsPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { UploadPage } from "./pages/UploadPage.js";
import { useMe } from "./queries.js";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<LocaleRedirect />} />
          <Route path="/:locale" element={<LocaleLayout />}>
            <Route index element={<GalleryPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route
              path="upload"
              element={
                <RequireAuth>
                  <UploadPage />
                </RequireAuth>
              }
            />
            <Route
              path="mine"
              element={
                <RequireAuth>
                  <MyUploadsPage />
                </RequireAuth>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/en" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

function LocaleRedirect() {
  return <Navigate to={`/${getPreferredLocale()}`} replace />;
}

function LocaleLayout() {
  const { locale } = useParams();
  const { i18n } = useTranslation();
  const activeLocale = isLocale(locale) ? locale : null;
  useEffect(() => {
    if (activeLocale) {
      window.localStorage.setItem("artmuseum.locale", activeLocale);
      void i18n.changeLanguage(activeLocale);
    }
  }, [activeLocale, i18n]);
  if (!activeLocale) {
    return <Navigate to="/en" replace />;
  }
  return (
    <div className="app-shell">
      <Header locale={activeLocale} />
      <main className="main-surface">
        <Outlet />
      </main>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { locale } = useParams();
  const { t } = useTranslation();
  const me = useMe();
  if (me.isLoading) {
    return <p className="status-text">{t("common.loading")}</p>;
  }
  if (!me.data?.user) {
    return <Navigate to={`/${isLocale(locale) ? locale : "en"}/login`} replace />;
  }
  return children;
}
