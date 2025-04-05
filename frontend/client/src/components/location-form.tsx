import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import axios from "axios";

const getgps_location = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve("0.3204, 36.0056"), 1000)
  ); // Simulate GPS

export function LocationForm({ form, nextStep }) {
  const mapRef = useRef(null);
  const routingControlRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState({ address: "", lat: null, lng: null });
  const [to, setTo] = useState({ address: "", lat: null, lng: null });
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });

  const fetchAddressFromGPS = async (lat, lng, setLocation) => {
    try {
      const { data } = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: { lat, lon: lng, format: "json" },
      });
      if (data) setLocation({ address: data.display_name, lat, lng });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const parseLocation = (location) => {
    if (!location) return null;
    const [lat, lng] = location.split(",").map(Number);
    return { lat, lng };
  };

  useEffect(() => {
    getgps_location().then((gps) => {
      const { lat, lng } = parseLocation(gps);
      fetchAddressFromGPS(lat, lng, setFrom);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    form.setValue("from_location", from);
    form.setValue("to_location", to);
  }, [from, to, form]);

  const initMap = () => {
    const map = L.map("leaflet-map").setView([0.3204, 36.0056], 7);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      fetchAddressFromGPS(lat, lng, setFrom);
    });
  };

  useEffect(() => {
    if (!mapRef.current) initMap();
  }, []);

  useEffect(() => {
    if (
      mapRef.current &&
      from.lat &&
      from.lng &&
      to.lat &&
      to.lng
    ) {
      if (routingControlRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
      }

      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(from.lat, from.lng),
          L.latLng(to.lat, to.lng),
        ],
        routeWhileDragging: true,
        showAlternatives: false,
        addWaypoints: false,
      }).addTo(mapRef.current);
    }
  }, [from, to]);

  const handleGeocode = async (query, setLocation, type) => {
    try {
      const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: query, format: "json" },
      });
      if (data.length) {
        setSuggestions((prev) => ({ ...prev, [type]: data }));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const selectSuggestion = (item, setLocation, type) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setLocation({ address: item.display_name, lat, lng });
    setSuggestions((prev) => ({ ...prev, [type]: [] }));
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Step 1: Set Locations</h2>

      <FormField
        control={form.control}
        name="from_location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>From Location</FormLabel>
            <FormControl>
              <div>
                <Input
                  placeholder="From location"
                  value={from.address}
                  onChange={(e) => {
                    setFrom({ ...from, address: e.target.value });
                    handleGeocode(e.target.value, setFrom, "from");
                  }}
                  required
                />
                {suggestions.from.length > 0 && (
                  <ul className="bg-white border max-h-40 overflow-y-auto z-10 relative">
                    {suggestions.from.map((item) => (
                      <li
                        key={item.place_id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectSuggestion(item, setFrom, "from")}
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="to_location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>To Location</FormLabel>
            <FormControl>
              <div>
                <Input
                  placeholder="To location"
                  value={to.address}
                  onChange={(e) => {
                    setTo({ ...to, address: e.target.value });
                    handleGeocode(e.target.value, setTo, "to");
                  }}
                  required
                />
                {suggestions.to.length > 0 && (
                  <ul className="bg-white border max-h-40 overflow-y-auto z-10 relative">
                    {suggestions.to.map((item) => (
                      <li
                        key={item.place_id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectSuggestion(item, setTo, "to")}
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div id="leaflet-map" className="w-full h-64 border rounded my-4"></div>

      <Button onClick={nextStep} disabled={loading}>
        {loading ? "Getting GPS..." : "Next"}
      </Button>
    </div>
  );
}
