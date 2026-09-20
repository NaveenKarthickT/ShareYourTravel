import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet's default paths break with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored pins
const greenIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#10b981;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const redIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#f43f5e;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Simple deterministic hash of a string → gives repeatable fake coordinates
// (We don't have real lat/lng in the DB, so we generate plausible positions from route text.)
const hashCode = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const fakeCoords = (name, seed = 0) => {
  // Center around Bangalore-ish (12.97, 77.59); offset by hash
  const h = hashCode(name + seed);
  const latOffset = ((h % 1000) / 1000 - 0.5) * 0.4;
  const lngOffset = (((h >> 10) % 1000) / 1000 - 0.5) * 0.4;
  return [12.9716 + latOffset, 77.5946 + lngOffset];
};

export default function RouteMap({ startLocation, destination, height = 260 }) {
  const startCoords = fakeCoords(startLocation, 1);
  const endCoords = fakeCoords(destination, 2);
  const center = [(startCoords[0] + endCoords[0]) / 2, (startCoords[1] + endCoords[1]) / 2];

  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={startCoords} icon={greenIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold text-emerald-700">Start</div>
              <div>{startLocation}</div>
            </div>
          </Popup>
        </Marker>

        <Marker position={endCoords} icon={redIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold text-rose-700">Destination</div>
              <div>{destination}</div>
            </div>
          </Popup>
        </Marker>

        <Polyline
          positions={[startCoords, endCoords]}
          pathOptions={{
            color: "#00A3C4",
            weight: 4,
            opacity: 0.7,
            dashArray: "10, 10",
          }}
        />
      </MapContainer>
    </div>
  );
}