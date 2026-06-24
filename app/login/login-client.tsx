"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PetshopHeader } from "@/components/petshop-header";
import { SiteFooter } from "@/components/site-footer";
import type { Language } from "@/lib/i18n";
import { setAuthUser } from "@/lib/auth-client";

const content = {
  tr: {
    title: "Hesabina Giris Yap",
    subtitle: "Sepet ve siparis adimlari icin giris yapabilirsin.",
    customerLogin: "Musteri Girisi",
    adminLogin: "Admin Girisi",
    email: "E-posta",
    password: "Sifre",
    submit: "Giris Yap",
    helper: "Bu ekran simdilik mock giris ekranidir.",
    invalidCredentials: "Yanlis girdiniz bilgileri.",
    adminRequired: "Bu hesap admin degil.",
  },
  en: {
    title: "Sign In",
    subtitle: "Sign in to continue with cart and order steps.",
    customerLogin: "Customer Login",
    adminLogin: "Admin Login",
    email: "Email",
    password: "Password",
    submit: "Sign In",
    helper: "This is currently a mock login screen.",
    invalidCredentials: "The credentials you entered are incorrect.",
    adminRequired: "This account is not an admin.",
  },
};

const resolveLanguage = (value: string | null): Language => (value === "en" ? "en" : "tr");

export function LoginClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const language = resolveLanguage(searchParams.get("lang"));
  const t = content[language];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loginType, setLoginType] = useState<"customer" | "admin">(
    searchParams.get("mode") === "admin" ? "admin" : "customer",
  );

  useEffect(() => {
    document.documentElement.lang = language === "tr" ? "tr" : "en";
  }, [language]);

  const safeReturnTo = useMemo(() => {
    const returnTo = searchParams.get("returnTo");
    if (returnTo && returnTo.startsWith("/")) {
      return returnTo;
    }
    return `/?lang=${language}`;
  }, [language, searchParams]);

  const onLanguageChange = (nextLanguage: Language) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLanguage);
    params.set("returnTo", safeReturnTo);
    params.set("mode", loginType);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let response: Response;

    try {
      response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password, loginType }),
      });
    } catch {
      setErrorMessage(t.invalidCredentials);
      return;
    }

    if (!response.ok) {
      if (response.status === 403 && loginType === "admin") {
        setErrorMessage(t.adminRequired);
      } else {
        setErrorMessage(t.invalidCredentials);
      }
      return;
    }

    const data = (await response.json()) as {
      ok: boolean;
      user?: { name: string; email: string; isAdmin?: boolean };
    };

    if (!data.ok || !data.user) {
      setErrorMessage(t.invalidCredentials);
      return;
    }

    setErrorMessage("");
    setAuthUser({ name: data.user.name, email: data.user.email, isAdmin: Boolean(data.user.isAdmin) });
    if (loginType === "admin") {
      router.push(`/admin?lang=${language}`);
      return;
    }
    router.push(safeReturnTo);
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <PetshopHeader
        language={language}
        onLanguageChange={onLanguageChange}
        homeHref={`/?lang=${language}`}
        categoriesHref={`/?lang=${language}#categories`}
        dealsHref={`/?lang=${language}#deals`}
        loginHref={`/login?lang=${language}&returnTo=${encodeURIComponent(safeReturnTo)}`}
      />

      <main className="px-4 py-10 md:px-6">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-6 md:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">{t.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-1">
            <button
              type="button"
              onClick={() => {
                setLoginType("customer");
                if (errorMessage) setErrorMessage("");
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                loginType === "customer" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-800"
              }`}
            >
              {t.customerLogin}
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType("admin");
                if (errorMessage) setErrorMessage("");
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                loginType === "admin" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-800"
              }`}
            >
              {t.adminLogin}
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                required
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400"
                placeholder="ornek@mail.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                required
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400"
                placeholder="••••••••"
              />
            </div>

            {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              {t.submit}
            </button>
          </form>

          <p className="mt-4 text-xs text-zinc-500">{t.helper}</p>
        </div>
      </main>

      <SiteFooter
        language={language}
        homeHref={`/?lang=${language}`}
        categoriesHref={`/?lang=${language}#categories`}
        dealsHref={`/?lang=${language}#deals`}
      />
    </div>
  );
}
