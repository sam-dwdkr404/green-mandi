"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { CATEGORY_BROWSER, LANGUAGE_OPTIONS, TRANSLATIONS } from "../lib/constants";

const TOP_NAV_KEYS = [
  { key: "home", href: "/" },
  { key: "forFarmers", href: "/farmers" },
  { key: "forBuyers", href: "/buyers" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "login", href: "/login" },
];

export default function Home() {
  const router = useRouter();
  const { activeLanguage, updateLanguage } = useLanguage();
  const t = TRANSLATIONS[activeLanguage];

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Vegetables");
  const [translateOpen, setTranslateOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const runLandingSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    let url = "/buyers?";
    if (trimmedQuery) url += `search=${encodeURIComponent(trimmedQuery)}&`;
    if (activeCategory && activeCategory !== "All Categories") url += `category=${encodeURIComponent(activeCategory)}`;
    router.push(url);
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#121212]">
      <section className="border-y border-[#888]/40 bg-[#efefef]">
        <div className="mx-auto max-w-[1520px] px-4 lg:px-10">
          <div className="flex min-h-[168px] flex-col justify-center gap-5 py-4">
            <div className="hidden items-center justify-between gap-6 lg:flex">
              <nav className="flex min-w-0 flex-1 items-center justify-start gap-6 xl:gap-10">
                {TOP_NAV_KEYS.slice(0, 3).map((item, index) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`text-[18px] font-semibold transition-colors duration-200 hover:text-[#67ad45] ${
                      index === 0 ? "border-b-2 border-[#67ad45] pb-2 text-[#67ad45]" : "text-[#2e2e2e]"
                    }`}
                  >
                    {TRANSLATIONS[activeLanguage][item.key]}
                  </Link>
                ))}
              </nav>

              <div className="px-4 text-center">
                <p className="text-[34px] font-bold uppercase tracking-[0.15em] text-[#4d8b31]">
                  Green Mandi
                </p>
                <p className="text-[13px] font-medium tracking-wide text-[#8b8b8b] uppercase">Beyond farming in Nippani</p>
              </div>

              <nav className="flex min-w-0 flex-1 items-center justify-end gap-6 xl:gap-10">
                {TOP_NAV_KEYS.slice(3).map((item) => (
                  <Link 
                    key={item.key} 
                    href={item.href} 
                    className={`text-[18px] font-semibold transition-colors duration-200 hover:text-[#67ad45] ${item.key === 'login' ? 'bg-[#67ad45] text-white px-6 py-2 rounded-full hover:bg-[#5c9d3d] hover:text-white' : 'text-[#2e2e2e]'}`}
                  >
                    {TRANSLATIONS[activeLanguage][item.key]}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div>
                <p className="text-[24px] font-semibold uppercase tracking-[0.08em] text-[#5c9d3d]">
                  Green Mandi
                </p>
                <p className="text-[12px] text-[#8b8b8b]">Beyond farming in Nippani</p>
              </div>
              <Link
                href="/login"
                className="rounded-full bg-[#67ad45] px-4 py-2 text-sm font-bold text-white"
              >
                {TRANSLATIONS[activeLanguage].login}
              </Link>
            </div>

            <form
              className="mx-auto flex w-full max-w-[780px] overflow-hidden rounded-[4px] border border-[#bdbdbd] bg-white"
              onSubmit={runLandingSearch}
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={TRANSLATIONS[activeLanguage].searchCrops}
                className="min-w-0 flex-1 bg-white px-4 py-4 text-[18px] text-[#5a6670] outline-none placeholder:text-[#5a6670]"
              />
              <button
                type="submit"
                className="flex h-[48px] w-[54px] items-center justify-center bg-[#67ad45] text-[18px] font-bold text-white"
              >
                GO
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden">
        <div className="relative min-h-[540px] sm:min-h-[620px] lg:min-h-[740px]">
          <Image
            src="/images/farm-bg.jpg"
            alt="Farmer marketplace hero background"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 bg-[linear-gradient(90deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.6)_100%)]" />

          <div className="absolute inset-y-0 left-4 hidden items-center text-[76px] font-light text-white/50 hover:text-white/90 cursor-pointer transition-colors lg:flex">
            &lt;
          </div>
          <div className="absolute inset-y-0 right-4 hidden items-center text-[76px] font-light text-white/50 hover:text-white/90 cursor-pointer transition-colors lg:flex">
            &gt;
          </div>

          <div className="relative z-10 mx-auto flex min-h-[540px] max-w-[1520px] items-center justify-center px-4 text-center sm:min-h-[620px] lg:min-h-[740px]">
            <div className="max-w-[1024px] pt-14">
              <h1 className="text-[42px] font-extrabold uppercase italic leading-[1.1] tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] sm:text-[62px] lg:text-[72px] xl:text-[80px]">
                {t.heroTitle}
              </h1>
              <div className="mt-10 flex justify-center">
                <Link
                  href="/buyers"
                  className="rounded-full bg-white px-10 py-5 text-[15px] font-semibold uppercase tracking-[0.45em] text-black shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:px-16"
                >
                  {t.exploreMarket}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f6f6] px-4 py-8 lg:px-10">
        <div className="mx-auto max-w-[1520px]">
          <div className="flex flex-wrap items-start gap-4 border-b border-[#dedede] pb-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setTranslateOpen(!translateOpen); setCategoriesOpen(false); }}
                className="flex items-center gap-2 rounded-[6px] border border-[#bdbdbd] bg-white px-5 py-3 text-[16px] font-semibold text-[#1f1f1f] shadow-sm hover:bg-[#f0f0f0]"
              >
                {t.translate}
                <span className="text-[12px]">{translateOpen ? "▲" : "▼"}</span>
              </button>
              {translateOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-[8px] border border-[#d0d0d0] bg-white shadow-lg">
                  {LANGUAGE_OPTIONS.map((language) => (
                    <button
                      key={language}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-[16px] font-semibold text-[#1f1f1f] hover:bg-[#f5f5f5]"
                      onClick={() => { updateLanguage(language); setTranslateOpen(false); }}
                    >
                      <span
                        className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] ${
                          activeLanguage === language
                            ? "border-[#78ad48] text-[#78ad48]"
                            : "border-[#9e9e9e] text-transparent"
                        }`}
                      >
                        o
                      </span>
                      {language}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => { setCategoriesOpen(!categoriesOpen); setTranslateOpen(false); }}
                className="flex items-center gap-2 rounded-[6px] border border-[#bdbdbd] bg-white px-5 py-3 text-[16px] font-semibold text-[#1f1f1f] shadow-sm hover:bg-[#f0f0f0]"
              >
                {t.categoriesTitle}
                <span className="text-[12px]">{categoriesOpen ? "▲" : "▼"}</span>
              </button>
              {categoriesOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-[8px] border border-[#d0d0d0] bg-white shadow-lg">
                  {Object.keys(CATEGORY_BROWSER).map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`flex w-full items-center justify-between px-4 py-3 text-[15px] font-semibold hover:bg-[#f5f5f5] ${
                        activeCategory === category ? "text-[#78ad48]" : "text-[#242424]"
                      }`}
                      onClick={() => { setActiveCategory(category); setCategoriesOpen(false); }}
                    >
                      {category}
                      <span className="text-[11px] text-[#888]">v</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center self-center text-[14px] text-[#777]">
              {t.languageStatus} <span className="ml-1 font-semibold text-[#5c9d3d]">{activeLanguage}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white px-4 py-12 lg:px-10">
        <div className="mx-auto grid max-w-[1520px] gap-6 lg:grid-cols-3">
          {[
            [t.featureFarmersTitle, t.featureFarmersBody],
            [t.featureBuyersTitle, t.featureBuyersBody],
            [t.featureHowWorksTitle, t.featureHowWorksBody],
          ].map(([title, body]) => (
            <article key={title} className="border border-[#e5e5e5] bg-[#fafafa] p-6 text-center">
              <h2 className="text-[28px] font-semibold text-[#5c9d3d]">{title}</h2>
              <p className="mt-3 text-[16px] leading-7 text-[#555]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="bg-white px-4 py-8 lg:px-10">
        <div className="mx-auto max-w-[1520px] border-t border-[#d8d8d8] pt-8 text-center">
          <p className="text-[28px] font-semibold uppercase tracking-[0.08em] text-[#5c9d3d]">
            Green Mandi
          </p>
          <p className="mt-2 text-[15px] text-[#7c7c7c]">Beyond farming in Nippani</p>
          <p className="mt-5 text-[20px] font-semibold text-[#222]">
            {t.copyright}
          </p>
        </div>
      </footer>
    </main>
  );
}
