"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import API from "../../../lib/api";
import useDashboardData from "../../../lib/useDashboardData";
import {
  CROP_OPTIONS,
  getCategoryMeta,
  getListingDetailMeta,
} from "../../../lib/catalog";
import { money } from "../../../components/MarketplaceCards";

const DELIVERY_OPTIONS = ["Nipani", "Chikodi", "Belagavi", "Kolhapur", "Sangli"];

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderStars(rating) {
  const score = Math.round(Number(rating || 0));
  return new Array(5).fill(null).map((_, index) => (
    <span key={`star-${index}`} className={index < score ? "text-[#f3a300]" : "text-[#29313a]"}>
      ★
    </span>
  ));
}

function DetailTable({ title, rows, emptyText }) {
  return (
    <section>
      <h2 className="mb-4 text-[30px] font-semibold text-[#7ab34a]">{title}</h2>
      {rows.length === 0 ? (
        <div className="border-t border-[#d6d6d6] py-6 text-[18px] text-[#666]">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto border-t border-[#d6d6d6]">
          <table className="min-w-full border-separate border-spacing-y-0 text-left text-[18px] text-[#676767]">
            <thead>
              <tr className="text-[#8a8a8a]">
                <th className="border-b border-[#d6d6d6] px-2 py-5 font-semibold">Category</th>
                <th className="border-b border-[#d6d6d6] px-2 py-5 font-semibold">Name</th>
                <th className="border-b border-[#d6d6d6] px-2 py-5 font-semibold">Quantity/Weight</th>
                <th className="border-b border-[#d6d6d6] px-2 py-5 font-semibold">Land Area</th>
                <th className="border-b border-[#d6d6d6] px-2 py-5 font-semibold">Available Date</th>
                <th className="border-b border-[#d6d6d6] px-2 py-5 font-semibold">Farmer ID</th>
                <th className="border-b border-[#d6d6d6] px-2 py-5 font-semibold">More</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-2 py-5">{row.category}</td>
                  <td className="px-2 py-5">{row.name}</td>
                  <td className="px-2 py-5">{row.quantity}</td>
                  <td className="px-2 py-5">{row.landArea}</td>
                  <td className="px-2 py-5">{row.availableDate}</td>
                  <td className="px-2 py-5">{row.farmerId}</td>
                  <td className="px-2 py-5">
                    <Link href={`/listings/${row.linkId}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#7ab34a] text-white">
                      ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const { listings, loading, listingsError, refreshData } = useDashboardData();
  const [orderDraft, setOrderDraft] = useState({
    retailer: "Urban Fresh Mart",
    quantity: 100,
    deliveryLocation: DELIVERY_OPTIONS[0],
  });
  const [orderState, setOrderState] = useState({
    open: false,
    submitting: false,
    message: "",
    error: "",
  });

  const listing = listings.find((item) => item._id === params.id);
  const detail = listing ? getListingDetailMeta(listing) : null;
  const crop = detail?.crop;
  const location = detail?.location;
  const category = crop ? getCategoryMeta(crop.category) : null;

  const relatedListings = useMemo(() => {
    if (!listing || !crop) {
      return [];
    }

    return listings.filter(
      (item) => item._id !== listing._id && getListingDetailMeta(item).crop.category === crop.category
    );
  }, [crop, listing, listings]);

  const cropHistoryRows = useMemo(() => {
    if (!listing || !detail) {
      return [];
    }

    return listings
      .filter((item) => item._id !== listing._id && item.farmer === listing.farmer)
      .slice(0, 3)
      .map((item) => {
        const itemDetail = getListingDetailMeta(item);
        return {
          key: item._id,
          category: itemDetail.crop.category,
          name: item.crop,
          quantity: `${item.quantity} kg`,
          landArea: `${itemDetail.landAreaAcres} acres`,
          availableDate: formatDate(itemDetail.createdAt),
          farmerId: itemDetail.cropCode,
          linkId: item._id,
        };
      });
  }, [detail, listing, listings]);

  const galleryImages = useMemo(() => {
    if (!crop) {
      return [];
    }

    const fallback = CROP_OPTIONS.filter(
      (item) => item.category === crop.category && item.id !== crop.id
    )
      .slice(0, 3)
      .map((item) => item.image);

    return [crop.image, "/images/farm-bg.jpg", ...fallback].slice(0, 5);
  }, [crop]);

  const openOrder = () => {
    if (!listing) return;
    setOrderDraft({
      retailer: "Urban Fresh Mart",
      quantity: Math.min(100, listing.quantity),
      deliveryLocation: DELIVERY_OPTIONS[0],
    });
    setOrderState({ open: true, submitting: false, message: "", error: "" });
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!listing) return;

    if (!orderDraft.retailer.trim()) {
      setOrderState((current) => ({ ...current, error: "Retailer name is required." }));
      return;
    }

    if (!orderDraft.quantity || orderDraft.quantity > listing.quantity) {
      setOrderState((current) => ({
        ...current,
        error: "Choose a quantity within the available stock.",
      }));
      return;
    }

    setOrderState((current) => ({ ...current, submitting: true, message: "", error: "" }));

    try {
      const response = await API.post("/orders", {
        listingId: listing._id,
        retailer: orderDraft.retailer,
        quantity: orderDraft.quantity,
        deliveryLocation: orderDraft.deliveryLocation,
      });
      await refreshData();
      setOrderState((current) => ({
        ...current,
        submitting: false,
        message: `Order ${response.data.paymentReference} confirmed.`,
        error: "",
      }));
    } catch (requestError) {
      setOrderState((current) => ({
        ...current,
        submitting: false,
        message: "",
        error: requestError.response?.data?.error || "Unable to place the order right now.",
      }));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f0f0f0] px-4 py-8 text-[#1d1d1d] lg:px-10">
        <div className="mx-auto max-w-[1600px] text-[22px] text-[#666]">Loading crop details...</div>
      </main>
    );
  }

  if (listingsError) {
    return (
      <main className="min-h-screen bg-[#f0f0f0] px-4 py-8 text-[#1d1d1d] lg:px-10">
        <div className="mx-auto max-w-[1600px] border border-[#efc8c8] bg-[#fff1f1] px-5 py-4 text-[#a33]">
          {listingsError}
        </div>
      </main>
    );
  }

  if (!listing || !detail || !crop || !location || !category) {
    return (
      <main className="min-h-screen bg-[#f0f0f0] px-4 py-8 text-[#1d1d1d] lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <Link href="/" className="text-[18px] font-semibold text-[#5f9b3f]">
            ← Back to marketplace
          </Link>
          <div className="mt-6 bg-white px-6 py-10 text-[20px] text-[#666]">
            Listing not found.
          </div>
        </div>
      </main>
    );
  }

  const detailRows = [
    {
      key: listing._id,
      category: crop.category,
      name: listing.crop,
      quantity: `${listing.quantity} kg`,
      landArea: `${detail.landAreaAcres} acres`,
      availableDate: formatDate(detail.createdAt),
      farmerId: detail.cropCode,
      linkId: listing._id,
    },
  ];

  return (
    <main className="min-h-screen bg-[#ececec] text-[#1b1b1b]">
      <header className="bg-[#f6f6f6] px-4 py-4 lg:px-10">
        <div className="mx-auto flex max-w-[1900px] items-center gap-4">
          <Link href="/" className="min-w-[220px]">
            <p className="text-[30px] font-semibold uppercase tracking-[0.08em] text-[#5c9d3d]">
              Green Mandi
            </p>
            <p className="text-[14px] text-[#868686]">Beyond farming in Nippani</p>
          </Link>

          <div className="hidden flex-1 overflow-hidden rounded-full border border-[#bfc4c7] bg-white lg:flex">
            <input
              value={listing.crop}
              readOnly
              className="w-full bg-transparent px-6 py-3 text-[18px] text-[#44515d] outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[16px] text-[#2f3a40] lg:block">
              {location.district} ▼
            </span>
            {["अ", "🌿", "⇪", "☎", "●"].map((icon, index) => (
              <div
                key={`${icon}-${index}`}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7ab34a] text-[20px] text-white"
              >
                {icon}
              </div>
            ))}
            <div className="ml-2 text-[30px]">☰</div>
          </div>
        </div>
      </header>

      <section className="px-4 py-10 lg:px-10">
        <div className="mx-auto max-w-[1450px]">
          <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
            <div className="relative min-h-[320px] overflow-hidden bg-black xl:min-h-[496px]">
              <Image
                src={galleryImages[0]}
                alt={listing.crop}
                fill
                sizes="(min-width: 1280px) 62vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,17,12,0.08)_0%,rgba(9,17,12,0.55)_100%)]" />
              <p className="absolute left-6 top-6 text-[18px] text-white/90">Live crop image</p>
              <div className="absolute bottom-6 left-6 flex h-[170px] w-[170px] items-center justify-center rounded-[22px] bg-white/92 shadow-lg">
                <Image
                  src={getListingDetailMeta(listing).crop.image}
                  alt={listing.crop}
                  width={108}
                  height={108}
                  className="h-[108px] w-[108px] rounded-full object-cover"
                />
              </div>
              <div className="absolute bottom-8 right-0 space-y-3">
                <div className="bg-black/36 px-4 py-3 text-[18px] font-semibold text-white">
                  {detail.localCropLine}
                </div>
                <div className="bg-black/36 px-4 py-3 text-[16px] font-semibold text-white">
                  {location.fullAddress}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              {galleryImages.slice(1, 5).map((image, index) => (
                <div key={`${image}-${index}`} className="relative min-h-[190px] overflow-hidden bg-black">
                  <Image
                    src={image}
                    alt={`${listing.crop} gallery ${index + 1}`}
                    fill
                    sizes="(min-width: 1280px) 18vw, 50vw"
                    className="object-cover"
                  />
                  {index === 3 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-[20px] font-semibold text-white">
                      See all {galleryImages.length} images
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <section className="mt-8 grid gap-6 bg-[#dfdfdf] px-5 py-6 lg:grid-cols-[1.3fr_0.42fr] lg:px-8">
            <div>
              <h1 className="text-[34px] font-medium text-[#78ad48]">
                {listing.farmer} <span className="text-[#7a7a7a]">(Farmer ID:{detail.farmerCode})</span>
              </h1>
              <p className="mt-3 text-[20px] font-semibold text-[#1a1a1a]">
                Name: <span className="font-normal">{listing.crop} ({category.label})</span>{" "}
                <span className="text-[#78ad48]">({detail.cropCode})</span>{" "}
                <span className="ml-2 inline-flex gap-1 text-[22px]">{renderStars(4.2)}</span>
              </p>
              <div className="mt-4 space-y-3 text-[20px] leading-8 text-[#1d1d1d]">
                <p>
                  <strong>Farm Address:</strong> {location.mandi}, {location.fullAddress}
                </p>
                <p>
                  <strong>Farmer Address:</strong> {location.fullAddress}
                </p>
                <p>
                  <strong>Quantity/Weight:</strong> {listing.quantity} kg, <strong>Estimated Land Area:</strong>{" "}
                  {detail.landAreaAcres} acres, <strong>Rate Per Kg:</strong> {money(listing.price)},
                  <strong> Available Date:</strong> {formatDate(detail.createdAt)} to{" "}
                  {formatDate(detail.closeDate)}
                </p>
                <p className="font-semibold text-[#7ab34a]">{detail.daysLeft} days left</p>
                <p className="text-[18px] text-[#505050]">
                  Nearby trade belt: {location.nearby.join(", ")}
                </p>
              </div>
            </div>

            <div className="grid gap-2.5">
              <button
                type="button"
                className="rounded-[6px] bg-[#7ab34a] px-4 py-4 text-[18px] font-semibold text-white"
                onClick={openOrder}
              >
                Contact / Order
              </button>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  "⇪",
                  "♡",
                  "💬",
                  "📍",
                  "⟡",
                  formatDate(detail.closeDate).slice(0, 6),
                ].map((item) => (
                  <div
                    key={item}
                    className="flex min-h-[56px] items-center justify-center rounded-[6px] bg-[#7ab34a] px-2 text-center text-[20px] font-semibold text-white"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-12 grid gap-8 xl:grid-cols-[1.7fr_0.83fr]">
            <div className="space-y-12">
              <DetailTable
                title="Current Crop"
                rows={detailRows}
                emptyText="No live crop row available."
              />

              <DetailTable
                title="Crop History"
                rows={cropHistoryRows}
                emptyText="No older live listings are available yet for this farmer."
              />
            </div>

            <aside>
              <h2 className="mb-4 text-[30px] font-semibold text-[#7ab34a]">Related Crops</h2>
              <div className="space-y-5">
                {relatedListings.length === 0 ? (
                  <div className="border-t border-[#d6d6d6] py-6 text-[18px] text-[#666]">
                    No related live crops yet in the same category.
                  </div>
                ) : (
                  relatedListings.slice(0, 3).map((item) => {
                    const itemDetail = getListingDetailMeta(item);

                    return (
                      <article key={item._id} className="border-t border-[#d6d6d6] pt-4">
                        <div className="grid grid-cols-[1fr_90px] gap-4">
                          <div>
                            <Link
                              href={`/listings/${item._id}`}
                              className="text-[18px] font-semibold text-[#202020]"
                            >
                              {item.farmer} <span className="text-[#78ad48]">(Farmer ID:{itemDetail.farmerCode})</span>
                            </Link>
                            <p className="mt-2 text-[17px] leading-8 text-[#222]">
                              <strong>Address:</strong> {itemDetail.location.fullAddress}
                            </p>
                            <p className="mt-2 text-[17px] leading-8 text-[#222]">
                              <strong>Quantity/Weight:</strong> {item.quantity} kg, <strong>Land Area:</strong>{" "}
                              {itemDetail.landAreaAcres} acres, <strong>Rate Per KG:</strong> {money(item.price)},
                              <strong> Available Date:</strong> {formatDate(itemDetail.createdAt)}
                            </p>
                            <p className="mt-1 text-[17px] font-semibold text-[#7ab34a]">
                              {itemDetail.daysLeft} days left
                            </p>
                            <div className="mt-1 text-[20px]">{renderStars(4.1)}</div>
                            <Link
                              href={`/listings/${item._id}`}
                              className="mt-2 inline-block text-[17px] text-[#202020]"
                            >
                              More...
                            </Link>
                          </div>
                          <div>
                            <div className="relative h-[82px] overflow-hidden rounded-full">
                              <Image
                                src={itemDetail.crop.image}
                                alt={item.crop}
                                fill
                                sizes="90px"
                                className="object-cover"
                              />
                            </div>
                            <p className="mt-3 text-center text-[16px]">{item.crop}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </aside>
          </section>
        </div>
      </section>

      {orderState.open ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm"
          onClick={() => setOrderState((current) => ({ ...current, open: false }))}
        >
          <div
            className="w-full max-w-3xl rounded-[28px] border border-[#e7decb] bg-[#fffdf8] p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#6f7d6b]">Direct Order</p>
                <h2 className="text-3xl font-semibold leading-tight">
                  Contact {listing.farmer} for {listing.crop}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-xl border border-[#dfd8ca] px-4 py-3 text-sm font-bold text-[#415045]"
                onClick={() => setOrderState((current) => ({ ...current, open: false }))}
              >
                Close
              </button>
            </div>

            <form className="grid gap-4" onSubmit={placeOrder}>
              <label className="grid gap-2 font-bold text-[#415045]">
                Retailer name
                <input
                  value={orderDraft.retailer}
                  onChange={(event) =>
                    setOrderDraft((current) => ({ ...current, retailer: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-[#cdd7c8] bg-[#fffdf8] px-4 py-3 outline-none"
                />
              </label>
              <label className="grid gap-2 font-bold text-[#415045]">
                Quantity required
                <input
                  type="number"
                  min="1"
                  max={listing.quantity}
                  value={orderDraft.quantity}
                  onChange={(event) =>
                    setOrderDraft((current) => ({
                      ...current,
                      quantity: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-[#cdd7c8] bg-[#fffdf8] px-4 py-3 outline-none"
                />
              </label>
              <label className="grid gap-2 font-bold text-[#415045]">
                Delivery location
                <select
                  value={orderDraft.deliveryLocation}
                  onChange={(event) =>
                    setOrderDraft((current) => ({
                      ...current,
                      deliveryLocation: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#cdd7c8] bg-[#fffdf8] px-4 py-3 outline-none"
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-3xl bg-[linear-gradient(135deg,#214e39_0%,#2f7f4f_100%)] p-5 text-white">
                <span className="block text-xs uppercase tracking-[0.16em] text-white/75">
                  UPI payment simulation
                </span>
                <strong className="mt-2 block text-4xl">
                  {money(orderDraft.quantity * listing.price)}
                </strong>
                <p className="mt-3 text-sm text-white/80">Live order amount from the selected crop</p>
              </div>

              {orderState.message ? (
                <div className="rounded-2xl bg-[#e7f6eb] px-5 py-4 text-[#1f5a34]">{orderState.message}</div>
              ) : null}
              {orderState.error ? (
                <div className="rounded-2xl bg-[#fde8e8] px-5 py-4 text-[#aa3333]">{orderState.error}</div>
              ) : null}

              <button
                type="submit"
                className="rounded-xl bg-[linear-gradient(135deg,#2f7f4f_0%,#1d5a34_100%)] px-4 py-3 text-sm font-bold text-white"
                disabled={orderState.submitting}
              >
                {orderState.submitting ? "Confirming payment..." : "Confirm order"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
