import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import useDashboardData from "../lib/useDashboardData";
import { getCropMeta } from "../lib/catalog";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_COORDS = [16.4023, 74.3789];

const APMC_DATA = [
  { name: "Nippani APMC", coords: [16.4023, 74.3789], state: "KA", type: "Major" },
  { name: "Sankeshwar APMC", coords: [16.2657, 74.4777], state: "KA", type: "Major" },
  { name: "Belagavi APMC", coords: [15.8497, 74.4977], state: "KA", type: "Major" },
  { name: "Gadhinglaj APMC", coords: [16.2250, 74.3433], state: "MH", type: "Major" },
  { name: "Kolhapur APMC", coords: [16.7050, 74.2433], state: "MH", type: "Major" },
  { name: "Ichalkaranji APMC", coords: [16.7015, 74.4515], state: "MH", type: "Minor" }
];

const REGION_COORDS = {
  Nipani: [16.4023, 74.3789],
  Chikodi: [16.4357, 74.5977],
  Belagavi: [15.8497, 74.4977],
  Hubballi: [15.3647, 75.1240],
  Kolhapur: [16.7050, 74.2433],
  Sangli: [16.8524, 74.5815],
  Gadhinglaj: [16.2250, 74.3433],
  Sankeshwar: [16.2657, 74.4777]
};

// Custom Marker Icons
const createColoredIcon = (color) => L.divIcon({
  className: "custom-pin",
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const KA_ICON = createColoredIcon("#2E7D32"); // Forest Green
const MH_ICON = createColoredIcon("#FF9800"); // Saffron/Orange
const LOGISTICS_ICON = createColoredIcon("#1976D2"); // Blue

function jiggleCoord(coord) {
  const dx = (Math.random() - 0.5) * 0.02;
  const dy = (Math.random() - 0.5) * 0.02;
  return [coord[0] + dx, coord[1] + dy];
}

export default function MapComponent() {
  const { listings, orders } = useDashboardData();
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState("all"); // "all", "apmc", "logistics"

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const showAPMC = viewMode === "all" || viewMode === "apmc";
  const showLogistics = viewMode === "all" || viewMode === "logistics";

  return (
    <div className="h-[600px] w-full lg:h-[750px] relative z-0">
      {/* View Toggle */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2 rounded-2xl border border-[#dbe5d2] bg-white p-2 shadow-xl">
        {["all", "apmc", "logistics"].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === mode ? "bg-[#4CAF50] text-white" : "text-[#555c56] hover:bg-[#F1F8F1]"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <MapContainer
        center={DEFAULT_COORDS}
        zoom={9}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* APMC Pins */}
        {showAPMC && APMC_DATA.map((apmc) => (
          <Marker 
            key={`apmc-${apmc.name}`} 
            position={apmc.coords} 
            icon={apmc.state === "KA" ? KA_ICON : MH_ICON}
          >
            <Tooltip permanent direction="top" offset={[0, -20]} opacity={0.9}>
              <span className="font-bold text-[10px]">{apmc.name}</span>
            </Tooltip>
            <Popup>
              <div className="font-sans">
                <strong className="text-[#2E7D32]">{apmc.name}</strong>
                <p className="m-0 text-[10px] font-bold text-[#8b8f86]">State: {apmc.state === "KA" ? "Karnataka" : "Maharashtra"}</p>
                <p className="mt-2 text-xs">Primary agricultural trading hub for this region.</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Logistics Pins (Farmer Listings) */}
        {showLogistics && listings
          .filter(l => REGION_COORDS[l.location])
          .map((truck) => {
            const coords = jiggleCoord(REGION_COORDS[truck.location]);
            return (
              <Marker key={`listing-${truck._id}`} position={coords} icon={LOGISTICS_ICON}>
                <Popup>
                  <div className="font-sans">
                    <strong>Farmer: {truck.farmer}</strong>
                    <br />
                    Crop: {truck.crop} ({truck.quantity}kg)
                    <br />
                    Market: Available at {truck.location}
                    <br />
                    Price: ₹{truck.price}/kg
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
