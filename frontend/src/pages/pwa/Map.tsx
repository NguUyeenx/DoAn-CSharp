import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { APP_CONFIG } from "@/constants/config";
import { usePOIs } from "@/hooks/queries/usePois";
import { Loader2, Navigation, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import RoutingMachine from "@/components/map/RoutingMachine";

// Fix Leaflet Default Icon Issue in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create custom icon
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const primaryIcon = createCustomIcon(APP_CONFIG.MAP ? "#FF6B35" : "#FF6B35");
const userIcon = createCustomIcon("#3B82F6");

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const location = useLocation();
  const routeTo = location.state?.routeTo as [number, number] | null;

  const [position, setPosition] = useState<[number, number]>([
    APP_CONFIG.MAP.DEFAULT_CENTER.lat,
    APP_CONFIG.MAP.DEFAULT_CENTER.lng,
  ]);
  const [hasGPS, setHasGPS] = useState(false);
  const { data: pois, isLoading } = usePOIs();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setHasGPS(true);
        },
        () => {
          console.warn("User denied GPS or GPS unavailable. Using default Vĩnh Khánh center.");
          if (routeTo) {
            // For demo purposes, mock user location at Cầu Ông Lãnh if they want to navigate but GPS fails
            setPosition([10.7601, 106.6975]);
            setHasGPS(true);
          }
        }
      );
    }
  }, []);

  return (
    <div className="h-full flex flex-col relative">
      {/* Floating Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <div className="bg-surface/90 backdrop-blur-md rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between pointer-events-auto">
          <div>
            <h1 className="font-bold text-lg text-primary">Bản đồ Vĩnh Khánh</h1>
            <p className="text-xs text-muted-foreground">
              {hasGPS ? "Đang hiển thị vị trí của bạn" : "Đang hiển thị khu vực trung tâm"}
            </p>
          </div>
          {hasGPS && (
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Navigation className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 w-full h-full relative z-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <MapContainer
          center={position}
          zoom={APP_CONFIG.MAP.DEFAULT_ZOOM}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <ChangeView center={position} zoom={16} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User Location Marker */}
          {hasGPS && (
            <Marker position={position} icon={userIcon}>
              <Popup>Vị trí hiện tại của bạn</Popup>
            </Marker>
          )}

          {/* POI Markers */}
          {pois?.map((poi: any) => (
            <Marker
              key={poi.id}
              position={[poi.latitude, poi.longitude]}
              icon={primaryIcon}
            >
              <Popup className="custom-popup rounded-xl">
                <div className="min-w-[150px]">
                  {poi.imageUrl && (
                    <img src={poi.imageUrl} className="w-full h-24 object-cover rounded-t-lg -mt-3 -mx-3 mb-2 max-w-[calc(100%+24px)]" alt="" />
                  )}
                  <h3 className="font-bold text-sm mb-1">{poi.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-warning mb-2">
                    <Star className="w-3 h-3 fill-warning" /> {poi.rating.toFixed(1)}
                  </div>
                  <Link 
                    to={APP_ROUTES.POI_DETAIL.replace(":slug", poi.slug)}
                    className="block w-full bg-primary text-primary-foreground text-center text-xs py-1.5 rounded-md font-medium hover:bg-primary/90"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}

          {routeTo && hasGPS && (
            <RoutingMachine source={position} dest={routeTo} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}


