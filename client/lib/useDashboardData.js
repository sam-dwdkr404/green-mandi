"use client";

import { useEffect, useState } from "react";
import API from "./api";

export default function useDashboardData() {
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingsError, setListingsError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  const refreshData = async () => {
    const [listingRes, orderRes] = await Promise.allSettled([
      API.get("/listings"),
      API.get("/orders"),
    ]);

    if (listingRes.status === "fulfilled") {
      setListings(listingRes.value.data);
      setListingsError("");
    } else {
      setListings([]);
      setListingsError("Unable to load marketplace listings from the backend.");
    }

    if (orderRes.status === "fulfilled") {
      setOrders(orderRes.value.data);
      setOrdersError("");
    } else {
      setOrders([]);
      setOrdersError("Order tracking is temporarily unavailable.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await refreshData();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(refreshData, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return {
    listings,
    orders,
    loading,
    listingsError,
    ordersError,
    refreshData,
    setOrders,
  };
}
