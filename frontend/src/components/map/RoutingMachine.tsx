import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useMap } from "react-leaflet";

interface RoutingMachineProps {
  source: [number, number] | null;
  dest: [number, number] | null;
}

export default function RoutingMachine({ source, dest }: RoutingMachineProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !source || !dest) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(source[0], source[1]),
        L.latLng(dest[0], dest[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      show: true, // Show the directions panel
      createMarker: () => null, // We already have markers, don't create new ones
      fitSelectedRoutes: true,
    }).addTo(map);

    return () => {
      try {
        const plan = routingControl.getPlan();
        if (plan) {
          plan.setWaypoints([]);
        }
        if (map && map.removeControl) {
          map.removeControl(routingControl);
        }
      } catch (e) {
        console.warn("Routing control cleanup error ignored", e);
      }
    };
  }, [map, source, dest]);

  return null;
}
