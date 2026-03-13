"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", badge: "HM" },
  { href: "/farmer", label: "Farmer", badge: "FM" },
];

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname === href;
}

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/farmer" ||
    pathname === "/farmers" ||
    pathname === "/buyers" ||
    pathname.startsWith("/listings/")
  ) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f2e6]/88 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#6b7a69]">
              Green Mandi
            </p>
            <strong className="text-base text-[#183322]">Mobile field interface</strong>
          </div>
          <Link
            href="/farmer"
            className="rounded-full bg-[#183322] px-4 py-2 text-xs font-bold text-white"
          >
            Farmer mode
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-black/5 bg-[#f7f2e6] px-6 py-8 lg:flex lg:flex-col">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#6b7a69]">
              Green Mandi
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#183322]">
              Mobile-first agri commerce
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#5f6d62]">
              Direct farm-to-retail marketplace for Nipani with low-bandwidth flows,
              order coordination, UPI simulation, and logistics tracking.
            </p>
          </div>

          <nav className="mt-8 grid gap-3">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    active
                      ? "bg-[#183322] text-white"
                      : "bg-white/70 text-[#294333] hover:bg-white"
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-[11px] font-extrabold ${
                      active ? "bg-white/15" : "bg-[#edf6e8] text-[#1f6137]"
                    }`}
                  >
                    {item.badge}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[28px] border border-[#e7decb] bg-white/90 p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f7d6b]">
              Problem Statement #1
            </p>
            <p className="mt-3 text-sm leading-6 text-[#435248]">
              Small-scale farmers in regions like Nipani need a direct retailer link
              that still works under poor connectivity and field conditions.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="pb-24 lg:pb-0">{children}</div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-[#f7f2e6]/95 px-3 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-[11px] font-bold ${
                  active
                    ? "bg-[#183322] text-white"
                    : "bg-white/70 text-[#294333]"
                }`}
              >
                <span
                  className={`mb-1 inline-flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-extrabold ${
                    active ? "bg-white/15" : "bg-[#edf6e8] text-[#1f6137]"
                  }`}
                >
                  {item.badge}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
