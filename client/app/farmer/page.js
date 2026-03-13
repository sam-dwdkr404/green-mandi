"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../lib/api";
import { clearUser, getUser } from "../../lib/auth";
import useDashboardData from "../../lib/useDashboardData";
import { db } from "../../lib/offlineDB";
import { getCropMeta, getLocationProfile, RETAILER_DATA } from "../../lib/catalog";
import { CATEGORY_BROWSER, LANGUAGE_OPTIONS, TRANSLATIONS } from "../../lib/constants";
import { useLanguage } from "../../lib/LanguageContext";

// Simple SVG Icons to match Lucide
const Icons = {
  Box: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  )
};

const FARMER_NAME_KEY = "green-mandi-farmer-name";
const DASHBOARD_CROPS = ["Rice", "Wheat", "Tomato", "Potato", "Onion", "Corn", "Cauliflower", "Cabbage", "Chilli", "Brinjal", "Cotton", "Sugarcane", "Tobacco", "Soybean"];
const QUANTITY_OPTIONS = [100, 200, 500, 1000];
const LOCATION_OPTIONS = ["Nipani", "Sankeshwar", "Gadhinglaj", "Chikodi", "Kolhapur", "Belagavi"];

function cropByName(name) {
  return getCropMeta(name);
}

export default function FarmerDashboard() {
  const router = useRouter();
  const { listings, orders, refreshData } = useDashboardData();
  const { activeLanguage, updateLanguage } = useLanguage();
  const t = TRANSLATIONS[activeLanguage];
  
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [translateOpen, setTranslateOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [orderTab, setOrderTab] = useState("active");
  const [editingId, setEditingId] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [connectionOffline, setConnectionOffline] = useState(false);
  const [queuedListings, setQueuedListings] = useState([]);
  const [farmerName, setFarmerName] = useState("Ravi Patil");
  const [selectedCropName, setSelectedCropName] = useState("Tomato");
  const [quantity, setQuantity] = useState(100);
  const [price, setPrice] = useState(cropByName("Tomato").price);
  const [location, setLocation] = useState("Nipani");
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(farmerName);

  const selectedCrop = cropByName(selectedCropName);
  const selectedLocation = getLocationProfile(location);
  const effectiveOffline = offlineMode || connectionOffline;

  const myListings = useMemo(() => {
    const live = listings.filter((item) => item.farmer?.toLowerCase() === farmerName.toLowerCase());
    const queued = queuedListings.map(q => ({ ...q, isOffline: true }));
    
    return [...queued, ...live].filter((item) => 
      activeCategory === "All" || 
      (CATEGORY_BROWSER[activeCategory] && CATEGORY_BROWSER[activeCategory].includes(item.crop))
    );
  }, [farmerName, listings, queuedListings, activeCategory]);

  const ordersReceived = useMemo(() => {
    return orders
      .filter((item) => item.farmer?.toLowerCase() === farmerName.toLowerCase());
  }, [farmerName, orders]);

  // Calculate Estimated Profit
  const estimatedProfit = useMemo(() => {
    return myListings.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [myListings]);

  // Sorted list of all orders
  const sortedOrders = useMemo(() => {
    return [...ordersReceived].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [ordersReceived]);

  const loadQueuedListings = useCallback(async () => {
    const offlineListings = await db.listings.where("synced").equals(0).reverse().toArray();
    setQueuedListings(offlineListings);
  }, []);

  const publishOnline = useCallback(
    async (payload) => {
      await API.post("/listings/add", payload);
      await refreshData();
    },
    [refreshData]
  );

  const syncQueuedListings = useCallback(async () => {
    const offlineListings = await db.listings.where("synced").equals(0).toArray();

    if (!offlineListings.length || connectionOffline || offlineMode) {
      await loadQueuedListings();
      return;
    }

    setSyncing(true);
    setSuccessMessage("");
    setErrorMessage("");

    let syncedCount = 0;

    for (const listing of offlineListings) {
      try {
        const payload = {
          crop: listing.crop,
          farmer: listing.farmer,
          quantity: Number(listing.quantity),
          price: Number(listing.price),
          location: listing.location,
        };

        await publishOnline(payload);
        await db.listings.update(listing.id, { synced: 1 });
        syncedCount += 1;
      } catch (_error) {
        setErrorMessage("Some queued listings could not be synced yet.");
      }
    }

    await loadQueuedListings();
    setSyncing(false);

    if (syncedCount > 0) {
      setSuccessMessage(`Offline listings synced! ${syncedCount} listing(s) are now in "My Active Listings".`);
      await refreshData();
    }
  }, [connectionOffline, loadQueuedListings, offlineMode, publishOnline, refreshData]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existingUser = getUser();
    if (!existingUser || existingUser.role !== "farmer") {
      router.replace("/login");
      return;
    }

    const savedFarmerName = localStorage.getItem(FARMER_NAME_KEY);
    setConnectionOffline(!navigator.onLine);
    setAuthUser(existingUser);
    setFarmerName(existingUser.name || savedFarmerName || "Ravi Patil");

    if (existingUser.location && LOCATION_OPTIONS.includes(existingUser.location)) {
      setLocation(existingUser.location);
    }

    if (savedFarmerName && !existingUser.name) {
      setFarmerName(savedFarmerName);
    }

    loadQueuedListings();
    setAuthReady(true);
  }, [loadQueuedListings, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FARMER_NAME_KEY, farmerName);
  }, [farmerName]);

  useEffect(() => {
    setPrice(selectedCrop.price);
  }, [selectedCrop.price]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = async () => {
      setConnectionOffline(false);
      if (!offlineMode) {
        await syncQueuedListings();
      }
    };

    const handleOffline = () => {
      setConnectionOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [offlineMode, syncQueuedListings]);

  const handlePublish = async () => {
    const payload = {
      crop: selectedCropName,
      farmer: farmerName.trim(),
      quantity: Number(quantity),
      price: Number(price),
      location,
    };

    if (!payload.farmer || !payload.quantity || !payload.price || !payload.location) {
      setErrorMessage("Complete the farmer name, quantity, price, and location.");
      return;
    }

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (effectiveOffline) {
        if (editingId) {
          await db.listings.update(editingId, { ...payload, synced: 0 });
        } else {
          await db.listings.add({
            ...payload,
            synced: 0,
            createdAt: new Date().toISOString(),
          });
        }
        await loadQueuedListings();
        setSuccessMessage(editingId ? "Update saved offline." : "Saved offline. Listing will sync when internet returns.");
      } else {
        if (editingId) {
          await API.put(`/listings/update/${editingId}`, payload);
          setSuccessMessage("Listing updated successfully!");
        } else {
          await publishOnline(payload);
          setSuccessMessage("Listing published to the marketplace.");
        }
        await refreshData();
      }
      
      // Reset form
      setEditingId(null);
      setSelectedCropName("Tomato");
      setQuantity(100);
      setPrice(cropByName("Tomato").price);
    } catch (_error) {
      setErrorMessage("Unable to process listing right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async (item) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      if (item.isOffline) {
        await db.listings.delete(item.id);
        await loadQueuedListings();
      } else {
        await API.delete(`/listings/delete/${item._id}`);
        await refreshData();
      }
      setSuccessMessage("Listing deleted successfully!");
    } catch (_error) {
      setErrorMessage("Failed to delete listing.");
    }
  };

  const handleEditListing = (item) => {
    setEditingId(item._id || item.id);
    setSelectedCropName(item.crop);
    setQuantity(item.quantity);
    setPrice(item.price);
    setLocation(item.location);
    
    // Scroll to form
    const formElement = document.getElementById("publish-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };


  const handleCall = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleChat = (phone, name) => {
    if (!phone) return;
    const message = encodeURIComponent(`Hello ${name}, I am interested in your services on Green Mandi.`);
    window.open(`https://wa.me/91${phone}?text=${message}`, "_blank");
  };

  const toggleOfflineMode = async () => {
    const nextValue = !offlineMode;
    setOfflineMode(nextValue);

    if (!nextValue && !connectionOffline) {
      await syncQueuedListings();
    }
  };

  const logout = () => {
    clearUser();
    router.push("/login");
  };

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#efefec] px-4 py-8 text-[#485148]">
        {t.checkingAccess}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#efefec] px-4 py-5 text-[#2a2f2b]">
      <section className="mx-auto max-w-[1200px]">
        {/* Modern Nav Header */}
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-[#dbe5d2] bg-[#f5f4ef] px-6 py-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-[#4CAF50] transition-colors hover:text-[#385134]">
              GREEN MANDI
            </Link>

            <div className="flex items-center gap-3">
              {/* Translate Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setTranslateOpen(!translateOpen); setCategoriesOpen(false); }}
                  className="flex items-center gap-2 rounded-full border border-[#d9dfd1] bg-white px-4 py-2 text-sm font-bold text-[#4CAF50] shadow-sm hover:bg-[#F1F8F1]"
                >
                  🌐 {activeLanguage}
                </button>
                {translateOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-36 rounded-2xl border border-[#dbe5d2] bg-white p-2 shadow-xl ring-1 ring-black/5">
                    {LANGUAGE_OPTIONS.map((language) => (
                      <button
                        key={language}
                        type="button"
                        className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-[#F1F8F1] hover:text-[#4CAF50]"
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
                  className="flex items-center gap-2 rounded-full border border-[#d9dfd1] bg-white px-4 py-2 text-sm font-bold text-[#555c56] shadow-sm hover:bg-[#f9f9f7]"
                >
                  🗂 {activeCategory === "All" ? t.categoriesTitle : activeCategory}
                </button>
                {categoriesOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[#dbe5d2] bg-white p-2 shadow-xl max-h-[300px] overflow-auto">
                    <button
                      type="button"
                      className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-[#F1F8F1] hover:text-[#4CAF50]"
                      onClick={() => { setActiveCategory("All"); setCategoriesOpen(false); }}
                    >
                      {t.allCategories}
                    </button>
                    {Object.keys(CATEGORY_BROWSER).map((category) => (
                      <button
                        key={category}
                        type="button"
                        className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-[#F1F8F1] hover:text-[#4CAF50]"
                        onClick={() => { setActiveCategory(category); setCategoriesOpen(false); }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button
              type="button"
              className={`rounded-full border px-5 py-2 text-sm font-bold transition-all ${
                offlineMode ? "border-[#4CAF50] bg-[#E8F5E9] text-[#2E7D32]" : "border-[#d7ddd1] bg-white text-[#555c56]"
              }`}
              onClick={toggleOfflineMode}
            >
              🛰 {offlineMode ? TRANSLATIONS[activeLanguage].offlineEnabled : TRANSLATIONS[activeLanguage].enableOffline}
            </button>

            <div className="flex items-center gap-3 rounded-full border border-[#d9dfd1] bg-white px-4 py-1.5 shadow-sm">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-[#1a1c1a]">{authUser?.name || farmerName}</p>
                <p className="text-[10px] text-[#8b8f86]">{authUser?.location || location}</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-[#f1f2ed] p-2 transition-colors hover:bg-[#e64a19] hover:text-white"
                onClick={logout}
                title={t.logout}
              >
                🚪
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section - Simplified */}
        <section className="mb-10 rounded-[32px] border border-[#dbe5d2] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-extrabold text-[#1a1c1a]">
                    {t.welcomeBack} 
                    {isEditingName ? (
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="ml-2 inline-block border-b-2 border-[#4CAF50] bg-transparent focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="ml-1">{farmerName}</span>
                    )}
                  </h1>
                  <button
                    onClick={() => {
                      if (isEditingName) {
                        setFarmerName(tempName);
                        localStorage.setItem(FARMER_NAME_KEY, tempName);
                        setIsEditingName(false);
                        refreshData();
                      } else {
                        setTempName(farmerName);
                        setIsEditingName(true);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f2ed] text-sm hover:bg-[#ccd1c7] transition-colors"
                    title={isEditingName ? t.saveName : t.editName}
                  >
                    {isEditingName ? "✅" : "✏️"}
                  </button>
                  {isEditingName && (
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1F0] text-sm hover:bg-[#FFD8D6] transition-colors"
                      title={t.cancel}
                    >
                      ❌
                    </button>
                  )}
                </div>
              <p className="mt-2 text-lg font-medium text-[#5c655c]">
                {t.heroSubtitle}
              </p>
            </div>
          </div>
            
            <div className="flex gap-4">
              <div className="rounded-2xl bg-[#F1F8F1] px-6 py-4 border border-[#dbe5d2]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#4CAF50]">{t.estimatedProfit}</span>
                <p className="text-2xl font-black text-[#1a1c1a]">₹{estimatedProfit.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-[#F1F8F1] px-6 py-4 border border-[#dbe5d2]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#4CAF50]">{t.activeItems}</span>
                <p className="text-2xl font-black text-[#1a1c1a]">{myListings.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Section: Publishing Form (Centered) */}
        <div id="publish-form" className="mx-auto max-w-4xl">
          <section className="rounded-[40px] border border-[#dbe5d2] bg-white p-8 shadow-sm lg:p-12">
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9] text-3xl text-[#4CAF50]">
                  {editingId ? "✏️" : "📦"}
                </div>
                <h2 className="text-4xl font-extrabold text-[#1a1c1a]">{editingId ? t.editListingTitle : t.publishYourCrop}</h2>
              </div>
              {editingId && (
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setSelectedCropName("Tomato");
                    setQuantity(100);
                    setPrice(cropByName("Tomato").price);
                  }}
                  className="text-sm font-bold text-[#e64a19] hover:underline"
                >
                  {t.cancel}
                </button>
              )}
            </div>

            <div className="space-y-12">
              {/* Step 1: Crop Selection */}
              <div>
                <label className="mb-5 block text-xs font-bold uppercase tracking-widest text-[#8b8f86]">{t.step1}</label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                  {DASHBOARD_CROPS.map((name) => {
                    const crop = cropByName(name);
                    const active = selectedCropName === name;
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          setSelectedCropName(name);
                          setPrice(crop.price);
                        }}
                        className={`group relative flex flex-col rounded-2xl border-2 p-3 transition-all ${
                          active ? "border-[#4CAF50] bg-[#F1F8F1]" : "border-[#f0f2ed] bg-[#f9faf8] hover:border-[#ccd1c7]"
                        }`}
                      >
                        <div className="relative mb-3 h-20 w-full overflow-hidden rounded-xl">
                          <Image src={crop.image} alt={name} fill className="object-cover" />
                        </div>
                        <span className={`text-center text-sm font-bold ${active ? "text-[#2E7D32]" : "text-[#5c655c]"}`}>
                          {activeLanguage === "Kannada" ? crop.localNames?.kannada : activeLanguage === "Hindi" ? crop.localNames?.hindi : activeLanguage === "Marathi" ? crop.localNames?.marathi : name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 & 3: Qty and Price */}
              <div className="grid gap-12 md:grid-cols-2">
                <div>
                  <label className="mb-5 block text-xs font-bold uppercase tracking-widest text-[#8b8f86]">{t.step2}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {QUANTITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setQuantity(opt)}
                        className={`rounded-2xl border-2 py-5 text-xl font-black transition-all ${
                          quantity === opt ? "border-[#4CAF50] bg-[#4CAF50] text-white shadow-xl shadow-[#4CAF50]/30" : "border-[#f0f2ed] bg-white text-[#5c655c] hover:border-[#ccd1c7]"
                        }`}
                      >
                        {opt >= 1000 ? `${opt / 1000} ${t.ton}` : `${opt} ${t.kg}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-5 block text-xs font-bold uppercase tracking-widest text-[#8b8f86]">{t.step3}</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-[#4CAF50]">₹</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full rounded-3xl border-2 border-[#f0f2ed] bg-white py-6 pl-14 pr-8 text-3xl font-black text-[#1a1c1a] outline-none transition-colors focus:border-[#4CAF50]"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-[#8b8f86]">/{t.kg}</span>
                  </div>
                </div>
              </div>

              {/* Step 4: Location */}
              <div>
                <label className="mb-5 block text-xs font-bold uppercase tracking-widest text-[#8b8f86]">{t.step4}</label>
                <div className="flex flex-wrap gap-3">
                  {LOCATION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setLocation(opt)}
                      className={`flex items-center gap-2 rounded-full border-2 px-8 py-3.5 text-lg font-bold transition-all ${
                        location === opt ? "border-[#4CAF50] bg-[#E8F5E9] text-[#2E7D32]" : "border-[#f0f2ed] bg-white text-[#5c655c] hover:border-[#ccd1c7]"
                      }`}
                    >
                      <Icons.MapPin />
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-[#4CAF50] py-4 text-xl font-bold text-white shadow-xl shadow-[#4CAF50]/20 transition-all hover:translate-y-[-2px] hover:bg-[#43A047] active:translate-y-0 disabled:bg-[#ccd1c7]"
                >
                  {submitting ? t.publishing : editingId ? t.saveChanges : t.publishListingBtn}
                </button>
              </div>
            </div>
          </section>

          {queuedListings.length > 0 && (
            <div className="mt-8 rounded-[32px] border-2 border-dashed border-[#dbe5d2] bg-[#f9faf8] p-8 text-center">
              <p className="text-lg font-bold text-[#5c655c]">
                {queuedListings.length} {t.pendingSyncMessage}
              </p>
              <button
                onClick={syncQueuedListings}
                disabled={syncing || effectiveOffline}
                className="mt-4 rounded-2xl bg-white px-8 py-3 text-sm font-bold text-[#2E7D32] shadow-sm transition-all hover:bg-[#F1F8F1]"
              >
                {syncing ? t.syncing : t.syncNow}
              </button>
            </div>
          )}
        </div>

        {/* My Active Listings - Grid View */}
        <section className="mt-20">
          <div className="mb-8 flex items-center justify-between border-b border-[#dbe5d2] pb-6">
            <h2 className="text-3xl font-extrabold text-[#1a1c1a]">{t.myActiveListings}</h2>
            <Link href="/buyers" className="text-sm font-bold text-[#4CAF50] hover:underline">
              {t.viewAll} →
            </Link>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {myListings.length === 0 ? (
              <div className="col-span-full rounded-[32px] border-2 border-dashed border-[#dbe5d2] py-16 text-center text-[#8b918b]">
                {t.noActiveListings}
              </div>
            ) : (
              myListings.map((item) => {
                const crop = cropByName(item.crop);
                return (
                  <div key={item._id || item.id} className="group overflow-hidden rounded-[24px] border border-[#dbe5d2] bg-white transition-all hover:shadow-xl">
                    <div className="relative h-48 w-full">
                      <Image src={crop?.image || "/images/crops/default.jpg"} alt={item.crop} fill className="object-cover" />
                      <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
                        <div className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-[#4CAF50] shadow-sm">
                          🟢 {t.statusActive}
                        </div>
                        {item.isOffline && (
                          <div className="rounded-full bg-[#FFF3E0] px-3 py-1 text-[10px] font-bold text-[#E65100] shadow-sm border border-[#FFE0B2]">
                            ⏳ {t.pendingSyncLabel}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold text-[#1a1c1a]">
                          {activeLanguage === "Kannada" ? crop?.localNames?.kannada : activeLanguage === "Hindi" ? crop?.localNames?.hindi : activeLanguage === "Marathi" ? crop?.localNames?.marathi : item.crop}
                        </h4>
                        <span className="text-[10px] font-bold text-[#8b918b] uppercase tracking-wider">
                          {getLocationProfile(item.location).localNames?.[activeLanguage.toLowerCase()] || item.location}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[#f0f2ed] pt-4">
                        <div>
                          <p className="text-xs font-bold text-[#5c655c]">{item.quantity} {t.kg}</p>
                          <p className="text-xl font-black text-[#2E7D32]">₹{item.price}/{t.kg}</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                            onClick={() => handleEditListing(item)}
                            className="rounded-xl bg-[#f1f2ed] p-3 text-[#5c655c] transition-colors hover:bg-[#ccd1c7]"
                            title={t.editListing}
                           >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteListing(item)}
                            className="rounded-xl bg-[#FFF1F0] p-3 text-[#e64a19] transition-colors hover:bg-[#FFD8D6]"
                            title={t.declineOrder}
                           >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Orders Section - Corrected Real-Time Stack */}
        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_400px]">
            <div className="space-y-12">
              {/* Real-Time Order History */}
              <section>
                  <div className="mb-6 flex items-center justify-between border-b border-[#dbe5d2] pb-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-extrabold text-[#1a1c1a]">{t.orderHistoryTitle}</h2>
                        <button 
                          onClick={() => refreshData()}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f2ed] text-sm hover:bg-[#ccd1c7] transition-colors"
                          title={t.refreshStats}
                        >
                          🔄
                        </button>
                      </div>
                      <span className="text-[10px] font-bold text-[#4CAF50] uppercase tracking-widest">{t.liveUpdates}</span>
                  </div>
                  <div className="space-y-4">
                      {sortedOrders.length === 0 ? (
                          <div className="flex flex-col items-center justify-center rounded-[24px] bg-white py-12 text-[#8b918b] border border-[#dbe5d2]">
                              <Icons.Clock />
                              <p className="mt-3 text-sm font-bold">{t.noOrdersFound}</p>
                          </div>
                      ) : (
                          sortedOrders.map((order) => (
                              <div key={order._id || order.id} className="rounded-[24px] border border-[#f0f2ed] bg-white p-6 shadow-sm transition-all hover:shadow-md">
                                  <div className="flex items-start gap-4">
                                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F8F1] text-2xl">📦</div>
                                      <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                              <strong className="text-lg font-bold text-[#1a1c1a]">{order.retailer || t.retailer}</strong>
                                              <span className="text-[10px] font-bold text-[#8b8f86]">{new Date(order.createdAt).toLocaleDateString()}</span>
                                          </div>
                                          <div className="mt-1 flex items-center justify-between">
                                              <p className="text-[#555c56]">
                                                {activeLanguage === "Kannada" ? (
                                                  <><span className="font-bold text-[#1a1c1a]">{order.quantity}{t.kg} {cropByName(order.crop)?.localNames?.kannada || order.crop}</span> {t.orderedLabel}</>
                                                ) : (
                                                  <>{t.orderedLabel} <span className="font-bold text-[#1a1c1a]">{order.quantity}{t.kg} {cropByName(order.crop)?.localNames?.[activeLanguage.toLowerCase()] || order.crop}</span></>
                                                )}
                                              </p>
                                              <span className="text-sm font-black text-[#2E7D32]">₹{order.totalAmount?.toLocaleString()}</span>
                                          </div>
                                          <div className="mt-4 flex items-center gap-2">
                                              <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                                  order.status === "confirmed" || order.status === "paid" || order.status === "delivered" || order.status === "completed"
                                                  ? "bg-[#E8F5E9] text-[#2E7D32]"
                                                  : "bg-[#FFF3E0] text-[#E65100]"
                                              }`}>
                                                  {order.status === "confirmed" ? t.statusProcessing : 
                                                   order.status === "payment_pending" ? t.statusAwaitingPayment : 
                                                   order.status === "delivered" ? t.statusDelivered :
                                                   order.status === "completed" ? t.statusCompleted :
                                                   order.status}
                                              </span>
                                              {order.status === "confirmed" && (
                                                <span className="text-[10px] text-[#4CAF50] font-bold">• {t.statusPaidConfirmed}</span>
                                              )}
                                              <div className="mt-2 text-[10px] font-bold text-[#8b8f86] flex items-center gap-1">
                                                <span>{t.utrLabel}</span>
                                                <span className="font-mono text-[#1a1c1a]">{order.transactionId || "N/A"}</span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </section>
            </div>

            {/* Nearby Retailers */}
            <section className="rounded-[40px] border border-[#dbe5d2] bg-white p-10">
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-3xl font-extrabold text-[#1a1c1a]">{t.nearbyRetailersTitle}</h2>
                    <Link href="/map" className="text-sm font-bold text-[#4CAF50]">{t.mapsView} →</Link>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                    {RETAILER_DATA.map((shop, idx) => (
                        <div key={idx} className="min-w-[320px] rounded-[32px] border border-[#f0f2ed] bg-[#fdfdfb] p-8 transition-all hover:bg-white hover:shadow-2xl">
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F1F8F1] text-4xl shadow-inner">🏪</div>
                            <h4 className="text-2xl font-black text-[#1a1c1a]">{shop.name}</h4>
                            <p className="mt-2 text-sm font-bold text-[#4CAF50] uppercase tracking-widest">
                                {shop.localCategory?.[activeLanguage.toLowerCase()] || shop.category}
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-[#8b8f86]">
                                <Icons.MapPin />
                                <span className="text-sm font-medium">
                                    {shop.localArea?.[activeLanguage.toLowerCase()] || shop.location}
                                </span>
                            </div>
                            <div className="mt-8">
                                <button 
                                  onClick={() => handleChat(shop.phone, shop.name)}
                                  className="w-full rounded-2xl border border-[#dbe5d2] py-4 text-sm font-bold text-[#555c56] hover:bg-[#f9f9f7]"
                                >
                                  {t.chatOnWhatsApp}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </section>
    </main>
  );
}
