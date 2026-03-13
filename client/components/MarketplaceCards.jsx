"use client";

import Image from "next/image";
import Link from "next/link";
import { CATEGORY_META, LOGISTICS_STAGES, getCropMeta, getFarmerProfile } from "../lib/catalog";

export function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function statusLabel(status) {
  return String(status || "").replaceAll("_", " ");
}

export function ListingCard({ listing, onOrder }) {
  const crop = getCropMeta(listing.crop);
  const category = CATEGORY_META[crop.category];
  const farmer = getFarmerProfile(listing.farmer, listing.location);

  return (
    <article className="overflow-hidden rounded-[30px] border border-[#ece3d0] bg-[#fffdf8] shadow-sm">
      <Link href={`/listings/${listing._id}`} className="relative block aspect-[16/10]">
        <Image
          src={crop.image}
          alt={listing.crop}
          fill
          sizes="(min-width: 1280px) 28vw, (min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,20,14,0.06)_0%,rgba(12,20,14,0.56)_100%)]" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-2 text-xs font-bold text-[#23432e]">
            <span className="relative h-6 w-6 overflow-hidden rounded-full">
              <Image
                src={category.icon}
                alt={category.label}
                fill
                sizes="24px"
                className="object-cover"
              />
            </span>
            {category.label}
          </span>
          <span className="rounded-full bg-[#21412c]/85 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            Bulk ready
          </span>
        </div>
        <p className="absolute bottom-4 left-4 rounded-full bg-black/35 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white">
          {listing.location}
        </p>
      </Link>

      <div className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href={`/listings/${listing._id}`} className="text-2xl font-semibold hover:text-[#2f7f4f]">
              {listing.crop}
            </Link>
            <p className="mt-1 text-sm text-[#66746b]">{category.note}</p>
          </div>
          <div className="rounded-full bg-[#edf6e8] px-4 py-2 font-extrabold text-[#1f6137]">
            {money(listing.price)}/kg
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f5f4ef] p-3">
          <Image
            src={farmer.avatar}
            alt={listing.farmer}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-[#728071]">Farmer profile</p>
            <strong className="block truncate text-[#203128]">{listing.farmer}</strong>
            <p className="text-sm text-[#5f6d62]">
              {farmer.village} | Rating {farmer.rating.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="my-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#ece3d0] bg-white p-4">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#728071]">
              Village
            </span>
            <strong>{listing.location}</strong>
          </div>
          <div className="rounded-2xl border border-[#ece3d0] bg-white p-4">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#728071]">
              Stock
            </span>
            <strong>{listing.quantity} kg ready</strong>
          </div>
          <div className="rounded-2xl border border-[#ece3d0] bg-white p-4">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#728071]">
              Dispatch window
            </span>
            <strong>Same-day pickup</strong>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#f8f5ed] px-3 py-2 text-xs font-semibold text-[#415045]">
            Direct farmer listing
          </span>
          <span className="rounded-full bg-[#f8f5ed] px-3 py-2 text-xs font-semibold text-[#415045]">
            Retail order enabled
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/listings/${listing._id}`}
            className="w-full rounded-xl border border-[#d6ddcf] bg-white px-4 py-3 text-center text-sm font-bold text-[#294333]"
          >
            View crop details
          </Link>
          {onOrder ? (
            <button
              type="button"
              className="w-full rounded-xl bg-[linear-gradient(135deg,#2f7f4f_0%,#1d5a34_100%)] px-4 py-3 text-sm font-bold text-white"
              onClick={() => onOrder(listing)}
            >
              Place bulk order
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function OrderCard({ order, advancingOrderId, onAdvance }) {
  const crop = getCropMeta(order.crop);
  const farmer = getFarmerProfile(order.farmer);
  const paymentPending = order.paymentStatus !== "paid";

  return (
    <article className="rounded-[30px] border border-[#ece3d0] bg-[#fffdf8] p-5">
      <div className="grid gap-4 lg:grid-cols-[152px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-[26px]">
          <Image src={crop.image} alt={order.crop} fill sizes="152px" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,20,14,0.12)_0%,rgba(12,20,14,0.48)_100%)]" />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#23432e]">
            {statusLabel(order.status)}
          </span>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">
                {order.crop} for {order.retailer}
              </h3>
              <p className="mt-1 text-sm text-[#66746b]">
                {order.quantity} kg | {money(order.pricePerKg)}/kg | {order.paymentReference}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#5b665d]">
                Payment: {String(order.paymentStatus || "").toUpperCase()}
              </p>
            </div>
            <div className="rounded-full bg-[#edf6e8] px-4 py-2 font-extrabold text-[#1f6137]">
              {money(order.totalAmount)}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-[#f5f4ef] p-3">
              <Image
                src={farmer.avatar}
                alt={order.farmer}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.14em] text-[#728071]">Farmer</p>
                <strong className="block truncate">{order.farmer}</strong>
                <p className="text-sm text-[#5f6d62]">Rating {farmer.rating.toFixed(1)}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f5f4ef] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#728071]">Destination</p>
              <strong className="mt-1 block">{order.deliveryLocation}</strong>
              <p className="mt-2 text-sm text-[#5f6d62]">ETA: {order.etaText}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#f5f4ef] p-4">
            <div className="flex flex-wrap items-center gap-3 text-[#526056]">
              {LOGISTICS_STAGES.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
                    <span className="relative h-8 w-8 overflow-hidden rounded-full">
                      <Image
                        src={stage.icon}
                        alt={stage.label}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </span>
                    <span className="text-sm font-semibold">{stage.label}</span>
                  </div>
                  {index < LOGISTICS_STAGES.length - 1 ? (
                    <span className="text-sm font-bold text-[#7a887d]">-&gt;</span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.14em] text-[#728071]">
                Route progress
              </span>
              <strong>{order.etaText}</strong>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#dde7d8]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#2f7f4f_0%,#7abd74_100%)]"
                style={{ width: `${order.logisticsProgress}%` }}
              />
            </div>
          </div>

          {onAdvance ? (
            <div>
              {paymentPending ? (
                <div className="inline-flex rounded-full bg-[#fff3d6] px-4 py-2 font-extrabold text-[#6d4a0b]">
                  Awaiting payment confirmation
                </div>
              ) : order.status !== "delivered" ? (
                <button
                  type="button"
                  className="rounded-xl border border-[#ecd39a] bg-[#fff3d6] px-4 py-3 text-sm font-bold text-[#6d4a0b]"
                  onClick={() => onAdvance(order._id)}
                  disabled={advancingOrderId === order._id}
                >
                  {advancingOrderId === order._id ? "Updating..." : "Advance logistics"}
                </button>
              ) : (
                <div className="inline-flex rounded-full bg-[#e7f6eb] px-4 py-2 font-extrabold text-[#1f5a34]">
                  Delivered successfully
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
