import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from "react-leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";

const getgps_location = () => new Promise((resolve) => setTimeout(() => resolve("37.7749, -122.4194"), 1000));

export function LocationForm({ form, nextStep }) {
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState({ address: "", lat: null, lng: null });
  const [to, setTo] = useState({ address: "", lat: null, lng: null });
  const [route, setRoute] = useState([]);
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });

  useEffect(() => {
    getgps_location().then((gps) => {
      const [lat, lng] = gps.split(", ").map(Number);
      fetchAddressFromGPS(lat, lng, setFrom);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchRoute();
       
  }, [from, to]);
    useEffect(() => {
     form.setValue("from_location", from); 
       form.setValue("to_location", to);
  }, [from, to, form]);

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

  const fetchRoute = async () => {
  if (from.lat && from.lng && to.lat && to.lng) {
    try {
      const res = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`,
        { params: { overview: "full", geometries: "geojson" } }
      );

      console.log("Route Response:", res.data);

      if (res.data.routes.length > 0) {
        const routeCoordinates = res.data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng] // Ensure correct order for Leaflet
        );
        setRoute(routeCoordinates);
      } else {
        console.error("No route found");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  }
};


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
    setLocation({ address: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions((prev) => ({ ...prev, [type]: [] }));
  };

  const LocationMarker = ({ setLocation }) => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        fetchAddressFromGPS(lat, lng, setLocation);
      },
    });
    return null;
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Step 1: Set Locations</h2>

      <FormField control={form.control} name="from_location" render={({ field }) => (
        <FormItem>
          <FormLabel>From Location</FormLabel>
          <FormControl>
            <div>
              <Input
                placeholder="From location"
                {...field}
                value={from.address}
                onChange={(e) => {
                  setFrom({ ...from, address: e.target.value });
                  handleGeocode(e.target.value, setFrom, "from");
                }}
                required
              />
              {suggestions.from.length > 0 && (
                <ul className="bg-white border max-h-40 overflow-y-auto">
                  {suggestions.from.map((item) => (
                    <li key={item.place_id} onClick={() => selectSuggestion(item, setFrom, "from")}>
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="to_location" render={({ field }) => (
        <FormItem>
          <FormLabel>To Location</FormLabel>
          <FormControl>
            <div>
              <Input
                placeholder="To location"
                {...field}
                value={to.address}
                onChange={(e) => {
                  setTo({ ...to, address: e.target.value });
                  handleGeocode(e.target.value, setTo, "to");
                }}
                required
              />
              {suggestions.to.length > 0 && (
                <ul className="bg-white border max-h-40 overflow-y-auto">
                  {suggestions.to.map((item) => (
                    <li key={item.place_id} onClick={() => selectSuggestion(item, setTo, "to")}>
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="h-64 w-full border rounded">
        <MapContainer center={[0.0236, 37.9062]} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          {from.lat && <Marker position={[from.lat, from.lng]} />}
          {to.lat && <Marker position={[to.lat, to.lng]} />}
          <LocationMarker setLocation={setFrom} />
          {route.length > 0 && <Polyline positions={route} color="blue" />}
        </MapContainer>
      </div>

      <Button onClick={nextStep} disabled={loading}>{loading ? "Getting GPS..." : "Next"}</Button>
    </div>
  );
}
