"use client";

import Image from "next/image";
import Link from "next/link";
import { money } from "../../components/MarketplaceCards";
import useDashboardData from "../../lib/useDashboardData";
import { CATEGORY_META, getCropMeta } from "../../lib/catalog";

export default function AnalyticsPage() {
  const { listings, orders, loading, listingsError } = useDashboardData();

  const totalGmv = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalStock = listings.reduce((sum, listing) => sum + listing.quantity, 0);
  const avgPrice = listings.length
    ? Math.round(listings.reduce((sum, listing) => sum + listing.price, 0) / listings.length)
    : 0;
  const cropMix = Object.entries(
    listings.reduce((acc, listing) => {
      acc[listing.crop] = (acc[listing.crop] || 0) + listing.quantity;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const categorySummary = Object.values(CATEGORY_META).map((category) => {
    const categoryListings = listings.filter(
      (listing) => getCropMeta(listing.crop).category === category.label
    );
    return {
      ...category,
      listingCount: categoryListings.length,
      quantity: categoryListings.reduce((sum, listing) => sum + listing.quantity, 0),
    };
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f2ebd8_0%,#fcfaf4_36%,#f7f4ea_100%)] px-3 py-6 text-[#183322] sm:px-4 lg:px-6">
      <section className="mx-auto max-w-7xl">
        <header className="mb-5 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <article className="rounded-[32px] bg-[linear-gradient(135deg,#1e3b2b_0%,#295c3d_46%,#d2a647_100%)] p-7 text-white shadow-[0_24px_70px_rgba(31,62,44,0.18)]">
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#fff2d2]">
              Analytics Page
            </p>
            <h1 className="text-4xl font-semibold leading-none sm:text-5xl">
              Separate metrics view for judges, operations, and business review.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/90">
              This page focuses on live marketplace metrics derived from backend
              listings and orders without mixing them into the buying workflow.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#21412c]"
              >
                Back to home
              </Link>
              <Link
                href="/orders"
                className="rounded-xl border border-white/25 px-4 py-3 text-sm font-bold text-white"
              >
                Open orders page
              </Link>
            </div>
          </article>

          <article className="grid gap-3 rounded-[28px] border border-[#e7decb] bg-white/85 p-6 shadow-sm">
            {[
              ["Platform GMV", money(totalGmv)],
              ["Average price", `${money(avgPrice)}/kg`],
              ["Live stock", `${totalStock} kg`],
              ["Active crops", cropMix.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#f8f5ed] p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[#6d7a6d]">{label}</p>
                <strong className="text-3xl">{value}</strong>
              </div>
            ))}
          </article>
        </header>

        {listingsError ? (
          <div className="mb-5 rounded-2xl bg-[#fde8e8] px-5 py-4 text-[#aa3333]">
            {listingsError}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-[#e7decb] bg-white/85 p-6 shadow-sm">
            <div className="mb-5">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#6f7d6b]">
                Crop mix
              </p>
              <h2 className="text-3xl font-semibold leading-tight">
                Live supply composition from marketplace listings
              </h2>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-[#f6f4ee] px-5 py-4 text-[#405145]">
                Loading analytics...
              </div>
            ) : null}

            {!loading && cropMix.length === 0 ? (
              <div className="rounded-2xl bg-[#f6f4ee] px-5 py-4 text-[#405145]">
                <strong className="block">No analytics yet.</strong>
                <p className="mt-2 leading-6">
                  Publish produce from the farmer flow to generate real metrics here.
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              {cropMix.map(([cropName, quantity]) => {
                const crop = getCropMeta(cropName);
                const largest = cropMix[0]?.[1] || 1;

                return (
                  <article
                    key={cropName}
                    className="grid grid-cols-[88px_1fr] gap-4 rounded-3xl border border-[#ece3d0] bg-[#fffdf8] p-4"
                  >
                    <div className="relative h-[88px] overflow-hidden rounded-2xl">
                      <Image
                        src={crop.image}
                        alt={cropName}
                        fill
                        sizes="88px"
                        className="object-cover"
                      />
                    </div>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-lg">{cropName}</strong>
                        <span className="text-sm font-bold text-[#21412c]">{quantity} kg</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#e3e9df]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#2f7f4f_0%,#d2a647_100%)]"
                          style={{ width: `${Math.max((quantity / largest) * 100, 14)}%` }}
                        />
                      </div>
                      <p className="text-sm text-[#5f6d62]">
                        Base price {money(crop.price)}/kg | {crop.category}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="grid gap-5">
            <section className="rounded-[28px] border border-[#e7decb] bg-white/85 p-6 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#6f7d6b]">
                Category lanes
              </p>
              <div className="grid gap-3">
                {categorySummary.map((category) => (
                  <div
                    key={category.label}
                    className="grid grid-cols-[64px_1fr] gap-3 rounded-3xl border border-[#ece3d0] bg-[#fffdf8] p-4"
                  >
                    <div className="relative h-16 overflow-hidden rounded-2xl">
                      <Image
                        src={category.icon}
                        alt={category.label}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <strong className="block text-lg">{category.label}</strong>
                      <p className="mt-1 text-sm text-[#5f6d62]">{category.note}</p>
                      <p className="mt-2 text-sm font-semibold text-[#21412c]">
                        {category.listingCount} listings | {category.quantity} kg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#e7decb] bg-white/85 p-6 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#6f7d6b]">
                Judge summary
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[#435248]">
                <li>Metrics are derived from live listings and live orders.</li>
                <li>Crop mix changes when stock is added or consumed.</li>
                <li>GMV changes as new orders are placed through the platform.</li>
                <li>Analytics is separated from operations for cleaner storytelling.</li>
              </ul>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
