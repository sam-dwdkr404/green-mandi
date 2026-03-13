"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const DynamicMap = dynamic(() => import("../../components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full rounded-[14px] bg-white p-4 text-[#5c625d]">
      Loading live logistics map...
    </div>
  ),
});

export default function MapPage() {
  return (
    <main className="min-h-screen bg-[#f1f2ec] text-[#2d312f]">
      <section className="mx-auto max-w-[1520px] px-4 lg:px-10">
        <header className="mb-8 flex min-h-[140px] flex-col justify-center gap-5 py-4">
          <div className="flex items-center justify-between gap-6">
            <nav className="flex min-w-0 flex-1 items-center justify-start gap-10">
                <Link href="/" className="text-[18px] font-semibold text-[#2e2e2e] transition hover:text-[#7ead46]">
                  Home
                </Link>
                <Link href="/farmers" className="text-[18px] font-semibold text-[#2e2e2e] transition hover:text-[#7ead46]">
                  For Farmers
                </Link>
                <Link href="/buyers" className="text-[18px] font-semibold text-[#2e2e2e] transition hover:text-[#7ead46]">
                  For Buyers
                </Link>
            </nav>

            <div className="text-center">
              <p className="text-[34px] font-bold uppercase tracking-[0.14em] text-[#4d8b31]">
                Green Mandi
              </p>
              <p className="text-[13px] font-medium tracking-wide text-[#8b8b8b] uppercase">Live Logistics Map</p>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-10">
              <Link
                href="/buyers"
                className="rounded-full bg-[#67ad45] px-6 py-2 text-[18px] font-semibold text-white transition hover:bg-[#5c9d3d]"
              >
                Back to Market
              </Link>
            </div>
          </div>
        </header>

        <div className="h-[600px] lg:h-[750px] w-full rounded-[24px] border-[1px] border-[#d7ddd1] bg-white shadow-[0_12px_45px_rgba(0,0,0,0.06)] overflow-hidden relative">
          <DynamicMap />
        </div>
      </section>
    </main>
  );
}
