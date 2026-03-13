"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import API from "../../lib/api";
import { clearUser, getUser } from "../../lib/auth";
import useDashboardData from "../../lib/useDashboardData";
import { getCropMeta, getFarmerProfile } from "../../lib/catalog";
import { money } from "../../components/MarketplaceCards";
import { QRCodeSVG } from "qrcode.react";
import { CATEGORY_BROWSER, LANGUAGE_OPTIONS, TRANSLATIONS } from "../../lib/constants";
import { useLanguage } from "../../lib/LanguageContext";

const DELIVERY_OPTIONS = ["Nipani", "Sankeshwar", "Gadhinglaj", "Chikodi", "Kolhapur", "Belagavi", "Hubballi"];

function BuyersDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { listings, orders, loading, listingsError, refreshData } = useDashboardData();
  const { activeLanguage, updateLanguage } = useLanguage();
  const t = TRANSLATIONS[activeLanguage];

  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [translateOpen, setTranslateOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [retailer, setRetailer] = useState("Retail Buyer");
  const [deliveryLocation, setDeliveryLocation] = useState("Hubballi");
  const [showOrder, setShowOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [paymentHint, setPaymentHint] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [upiProcessing, setUpiProcessing] = useState(false);
  const [upiSuccess, setUpiSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    const existingUser = getUser();

    if (!existingUser || existingUser.role !== "buyer") {
      router.replace("/login");
      return;
    }

    setAuthUser(existingUser);
    setRetailer(existingUser.name || "Retail Buyer");

    if (existingUser.location && DELIVERY_OPTIONS.includes(existingUser.location)) {
      setDeliveryLocation(existingUser.location);
    }

    setAuthReady(true);
  }, [router]);

  useEffect(() => {
    const searchValue = searchParams.get("search");
    if (searchValue) {
      setQuery(searchValue);
    }
    const categoryValue = searchParams.get("category");
    if (categoryValue) {
      setActiveCategory(categoryValue);
    }
  }, [searchParams]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Filter by Search Query
      const haystack = `${item.crop} ${item.farmer} ${item.location}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());

      // Filter by Category
      const matchesCategory =
        activeCategory === "All" ||
        (CATEGORY_BROWSER[activeCategory] && CATEGORY_BROWSER[activeCategory].includes(item.crop));

      return matchesQuery && matchesCategory;
    });
  }, [listings, query, activeCategory]);

  const totalAmount = selected ? Number(quantity || 0) * selected.price : 0;

  const openOrder = (item) => {
    setSelected(item);
    setPendingOrder(null);
    setQuantity(String(Math.min(100, item.quantity)));
    setRetailer(authUser?.name || "Retail Buyer");
    setDeliveryLocation(
      authUser?.location && DELIVERY_OPTIONS.includes(authUser.location)
        ? authUser.location
        : "Hubballi"
    );
    setFlowError("");
    setPaymentHint("");
    setConfirmedOrder(null);
    setShowPayment(false);
    setShowOrder(true);
  };

  const closeModals = () => {
    setShowOrder(false);
    setShowPayment(false);
    setSelected(null);
    setPendingOrder(null);
    setFlowError("");
    setPaymentHint("");
    setTransactionId("");
    setUpiSuccess(false);
    setUpiProcessing(false);
  };

  const proceedToPayment = async () => {
    if (!selected) return;

    const parsedQuantity = Number(quantity);

    if (!retailer.trim()) {
      setFlowError("Retailer name is required.");
      return;
    }

    if (!parsedQuantity || parsedQuantity < 1 || parsedQuantity > selected.quantity) {
      setFlowError("Enter a quantity within the available stock.");
      return;
    }

    setCreatingOrder(true);
    setFlowError("");

    try {
      const response = await API.post("/orders", {
        listingId: selected._id,
        retailer: retailer.trim(),
        quantity: parsedQuantity,
        deliveryLocation,
      });

      setPendingOrder(response.data);
      setShowOrder(false);
      setShowPayment(true);
    } catch (requestError) {
      setFlowError(requestError.response?.data?.error || "Unable to create the order right now.");
    } finally {
      setCreatingOrder(false);
    }
  };

  const simulateUpiOpen = () => {
    if (!pendingOrder) return;
    const upiLink = `upi://pay?pa=farmer@upi&pn=GreenMandiFarmer&am=${pendingOrder.totalAmount}&cu=INR`;
    setUpiProcessing(true);
    setPaymentHint("Connecting to UPI app... Please complete the payment on your device.");
    
    // Simulate user switching to UPI app and paying
    setTimeout(() => {
      setUpiProcessing(false);
      setUpiSuccess(true);
      setPaymentHint("✅ Payment successful in UPI app! You can now confirm the order below.");
    }, 3000);

    window.location.href = upiLink;
  };

  const confirmPayment = async () => {
    if (!pendingOrder) return;

    setConfirmingPayment(true);
    setFlowError("");

    try {
      const response = await API.put(`/orders/pay/${pendingOrder._id}`, {
        transactionId: transactionId.trim(),
      });
      await refreshData();
      setConfirmedOrder(response.data);
      setShowPayment(false);
      setSelected(null);
      setPendingOrder(null);
      setPaymentHint("");
      setTransactionId("");
      setUpiSuccess(false);
    } catch (requestError) {
      setFlowError(requestError.response?.data?.error || "Unable to confirm payment right now.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const logout = () => {
    clearUser();
    router.push("/login");
  };

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#efefec] px-4 py-8 text-[#485148]">
        Checking buyer access...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#efefec] px-4 py-5 text-[#2d312f]">
      <section className="mx-auto max-w-[980px]">
        <header className="mb-6 rounded-[18px] bg-[#f5f4ef] px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <nav className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-[#4c524d] relative">
              <Link href="/" className="text-[#7ead46]">
                {TRANSLATIONS[activeLanguage].home}
              </Link>

              {/* Translate Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setTranslateOpen(!translateOpen); setCategoriesOpen(false); }}
                  className="flex items-center gap-1 rounded bg-[#ecebe8] px-3 py-1.5 transition hover:bg-[#e1dfda] font-medium"
                >
                  {activeLanguage}
                </button>
                {translateOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-32 rounded border border-[#d0d0d0] bg-white shadow-lg">
                    {LANGUAGE_OPTIONS.map((language) => (
                      <button
                        key={language}
                        type="button"
                        className="block w-full px-4 py-2 text-left hover:bg-[#f5f5f5]"
                        onClick={() => { updateLanguage(language); setTranslateOpen(false); }}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Categories Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setCategoriesOpen(!categoriesOpen); setTranslateOpen(false); }}
                  className="flex items-center gap-1 rounded bg-[#ecebe8] px-3 py-1.5 transition hover:bg-[#e1dfda] font-medium"
                >
                  {activeCategory === "All" ? "Categories" : activeCategory}
                </button>
                {categoriesOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded border border-[#d0d0d0] bg-white shadow-lg max-h-[300px] overflow-auto relative">
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left font-semibold hover:bg-[#f5f5f5]"
                      onClick={() => { setActiveCategory("All"); setCategoriesOpen(false); }}
                    >
                      {t.allCategories}
                    </button>
                    {Object.keys(CATEGORY_BROWSER).map((category) => (
                      <button
                        key={category}
                        type="button"
                        className="block w-full px-4 py-2 text-left hover:bg-[#f5f5f5]"
                        onClick={() => { setActiveCategory(category); setCategoriesOpen(false); }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="text-center">
              <p className="text-[28px] font-semibold uppercase tracking-[0.08em] text-[#6ca046]">
                Green Mandi
              </p>
              <p className="text-[12px] text-[#8b8f86]">Beyond farming in Nippani</p>
            </div>

            <div className="flex items-center gap-2 rounded-[10px] border border-[#d9dfd1] bg-white px-3 py-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={TRANSLATIONS[activeLanguage].searchCrops}
                className="min-w-0 bg-transparent text-sm outline-none placeholder:text-[#90978e]"
              />
              <button
                type="button"
                className="rounded-[8px] bg-[#7dad46] px-3 py-2 text-xs font-bold text-white"
              >
                GO
              </button>
              <button
                type="button"
                className="rounded-[8px] border border-[#d7ddd1] bg-white px-3 py-2 text-xs font-bold text-[#5c625d]"
                onClick={logout}
              >
                {TRANSLATIONS[activeLanguage].logout}
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6 text-center">
          <div className="inline-flex items-center gap-3 text-[#476d3b]">
            <h1 className="text-[44px] tracking-tight font-bold">{TRANSLATIONS[activeLanguage].marketplace}</h1>
          </div>
          <p className="mt-2 text-[22px] text-[#555d57] font-medium">{TRANSLATIONS[activeLanguage].buyFresh}</p>
          <div className="mt-5 flex justify-center">
            <Link 
              href="/map"
              className="inline-flex items-center gap-2 rounded-full border border-[#7ead46] bg-[#eef6eb] px-8 py-2.5 text-[15px] font-semibold text-[#476d3b] transition hover:bg-[#7ead46] hover:text-white shadow-sm"
            >
              {TRANSLATIONS[activeLanguage].viewMap}
            </Link>
          </div>
        </section>

        {listingsError ? (
          <div className="mb-5 rounded-[12px] bg-[#fff1f1] px-4 py-3 text-sm text-[#aa3333] shadow-sm">
            {listingsError}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[12px] bg-white px-4 py-4 text-sm text-[#616863] shadow-sm">
            Loading marketplace listings...
          </div>
        ) : null}

        {!loading && filteredListings.length === 0 ? (
          <div className="rounded-[12px] bg-white px-4 py-4 text-sm text-[#616863] shadow-sm">
            {activeLanguage === "English" 
              ? "No listings match the current search." 
              : activeLanguage === "Hindi" 
                ? "वर्तमान खोज से कोई सूची मेल नहीं खाती।" 
                : "सध्याच्या शोधाशी कोणतीही सूची जुळत नाही."}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map((item) => {
            const crop = getCropMeta(item.crop);
            const farmer = getFarmerProfile(item.farmer, item.location);

            return (
              <article
                key={item._id}
                className="overflow-hidden rounded-[14px] border border-[#ddd9d2] bg-[#f8f8f5] shadow-sm"
              >
                <div className="relative h-[120px]">
                  <Image
                    src={crop.image}
                    alt={item.crop}
                    fill
                    sizes="(min-width: 1280px) 20vw, (min-width: 768px) 42vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="px-4 py-3">
                  <h2 className="text-[34px] font-medium text-[#2c2f2d]">
                    {activeLanguage === "Hindi" 
                      ? (crop.localNames?.hindi || item.crop) 
                      : activeLanguage === "Marathi" 
                        ? (crop.localNames?.marathi || item.crop) 
                        : item.crop}
                  </h2>
                  <p className="mt-1 text-sm text-[#686f69]">
                    {farmer.name}, {item.location}
                  </p>
                  <p className="mt-1 text-sm text-[#686f69]">Price: {money(item.price)}/kg</p>
                </div>
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    className="w-full rounded-[6px] bg-[#7ead46] px-4 py-2 text-[15px] font-medium text-white transition hover:bg-[#6ca046]"
                    onClick={() => openOrder(item)}
                  >
                    Order
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            ["Live listings", listings.length],
            ["Orders placed", orders.length],
            ["Total GMV", money(orders.reduce((sum, order) => sum + order.totalAmount, 0))],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[12px] border border-[#e0ddd7] bg-[#f8f8f5] px-4 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7f857f]">{label}</p>
              <strong className="mt-2 block text-[30px] text-[#363936]">{value}</strong>
            </div>
          ))}
        </section>
      </section>

      {showOrder && selected ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-xl rounded-[18px] bg-[#f8f8f5] p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#7f857f]">Order Crop</p>
                <h2 className="mt-2 text-[34px] font-medium text-[#363936]">Order {selected.crop}</h2>
              </div>
              <button
                type="button"
                className="rounded-[8px] border border-[#d7ddd1] bg-white px-3 py-2 text-sm font-bold text-[#5c625d]"
                onClick={closeModals}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-[#4b524c]">
                Retailer Name
                <input
                  value={retailer}
                  onChange={(event) => setRetailer(event.target.value)}
                  className="rounded-[10px] border border-[#d6d8d2] bg-white px-4 py-3 outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4b524c]">
                Enter Quantity
                <input
                  type="number"
                  min="1"
                  max={selected.quantity}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="rounded-[10px] border border-[#d6d8d2] bg-white px-4 py-3 outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4b524c]">
                Delivery Location
                <select
                  value={deliveryLocation}
                  onChange={(event) => setDeliveryLocation(event.target.value)}
                  className="rounded-[10px] border border-[#d6d8d2] bg-white px-4 py-3 outline-none"
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-[12px] bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7f857f]">Total</p>
                <strong className="mt-2 block text-[32px] text-[#363936]">{money(totalAmount || 0)}</strong>
              </div>

              {flowError ? (
                <div className="rounded-[12px] bg-[#fff1f1] px-4 py-3 text-sm text-[#aa3333]">{flowError}</div>
              ) : null}

              <button
                type="button"
                className="rounded-[10px] bg-[#7ead46] px-4 py-3 text-[20px] font-medium text-white"
                onClick={proceedToPayment}
                disabled={creatingOrder}
              >
                {creatingOrder ? "Creating Order..." : "Proceed to Payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPayment && selected && pendingOrder ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-2xl rounded-[18px] bg-[#f8f8f5] p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#7f857f]">UPI Payment</p>
                <h2 className="mt-2 text-[34px] font-medium text-[#363936]">Pay {money(pendingOrder.totalAmount)}</h2>
              </div>
              <button
                type="button"
                className="rounded-[8px] border border-[#d7ddd1] bg-white px-3 py-2 text-sm font-bold text-[#5c625d]"
                onClick={closeModals}
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="flex items-center justify-center rounded-[14px] bg-white p-4">
                <QRCodeSVG 
                  value={`upi://pay?pa=farmer@upi&pn=GreenMandiFarmer&am=${pendingOrder.totalAmount}&cu=INR`} 
                  size={180} 
                  level="Q"
                  includeMargin={true}
                />
              </div>

              <div className="grid gap-4">
                <div className="rounded-[12px] bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f857f]">Order Summary</p>
                  <strong className="mt-2 block text-[28px] text-[#363936]">
                    {pendingOrder.crop} | {pendingOrder.quantity} kg
                  </strong>
                  <p className="mt-2 text-sm text-[#666d67]">
                    Buyer: {pendingOrder.retailer} | Delivery: {pendingOrder.deliveryLocation}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#7ead46]">
                    Payment Status: {pendingOrder.paymentStatus}
                  </p>
                </div>

                {paymentHint ? (
                  <div className="rounded-[12px] bg-[#eef6eb] px-4 py-3 text-sm text-[#245936]">{paymentHint}</div>
                ) : null}
                {flowError ? (
                  <div className="rounded-[12px] bg-[#fff1f1] px-4 py-3 text-sm text-[#aa3333]">{flowError}</div>
                ) : null}

                {upiSuccess && (
                  <div className="grid gap-2 border-t border-[#f0f2ed] pt-4">
                    <label className="text-sm font-bold text-[#4CAF50]">
                      ENTER 12-DIGIT UPI UTR / TRANSACTION ID
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 123456789012"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ""))}
                      className="rounded-[10px] border border-[#7ead46] bg-white px-4 py-3 outline-none font-mono text-lg tracking-widest"
                    />
                    <p className="text-[10px] text-[#8b8f86]">You can find this 12-digit number in your UPI app's transaction history.</p>
                  </div>
                )}

                <button
                  type="button"
                  className={`rounded-[10px] border border-[#d7ddd1] bg-white px-4 py-3 text-center text-sm font-bold text-[#5c625d] ${upiProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={simulateUpiOpen}
                  disabled={upiProcessing || upiSuccess}
                >
                  {upiProcessing ? "UPI App Open..." : upiSuccess ? "Payment Completed" : "Open UPI App"}
                </button>
                <button
                  type="button"
                  className={`rounded-[10px] px-4 py-3 text-[20px] font-medium text-white transition-all ${
                    !upiSuccess || transactionId.length !== 12 ? "bg-gray-300 cursor-not-allowed" : "bg-[#7ead46] hover:bg-[#6ca046]"
                  }`}
                  onClick={confirmPayment}
                  disabled={confirmingPayment || !upiSuccess || transactionId.length !== 12}
                >
                  {confirmingPayment ? "Confirming..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {confirmedOrder ? (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm rounded-[14px] bg-white p-4 shadow-[0_18px_45px_rgba(53,66,46,0.12)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[#7f857f]">Order Confirmation</p>
          <h3 className="mt-2 text-[26px] font-medium text-[#363936]">Payment successful</h3>
          <p className="mt-2 text-sm leading-7 text-[#616863]">
            {confirmedOrder.quantity} kg of {confirmedOrder.crop} booked for {confirmedOrder.deliveryLocation}.
          </p>
          <p className="mt-2 text-sm font-semibold text-[#7ead46]">
            Status: {confirmedOrder.paymentStatus} | Order Sent to Farmer
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="rounded-[8px] border border-[#d7ddd1] bg-white px-3 py-2 text-sm font-bold text-[#5c625d]"
              onClick={() => setConfirmedOrder(null)}
            >
              Dismiss
            </button>
            <Link
              href="/orders"
              className="rounded-[8px] bg-[#7ead46] px-3 py-2 text-sm font-bold text-white"
            >
              View Orders
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function BuyersDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#5c625d] font-medium text-lg">Loading Marketplace...</div>}>
      <BuyersDashboardContent />
    </Suspense>
  );
}
