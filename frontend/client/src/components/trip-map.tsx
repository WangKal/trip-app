import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { apiRequest, queryClient } from "../lib/queryClient";

export function TripMap ({ trip, currentLocation }) {
  const [locations, setLocations] = useState(null); // Ensure it's null initially
  const [stops, setStops] = useState([]); // Fuel and rest stops
  const mapRef = useRef(null); // Store map instance
  const userMarkerRef = useRef(null);
  // Function to convert location strings to objects
  const parseLocation = (location) => {
    if (!location) return null;
    const [latitude, longitude] = location.split(",").map(Number);
    return { latitude, longitude };
  };

  useEffect(() => {
    
     // Ensure response has valid data
        if ( !trip.from_location || !trip.to_location) {
          console.error("Invalid trip data received:", trip);
          return;
        }

        // Convert trip locations
        const tripLocations = [
          parseLocation(trip.from_location),
          parseLocation(trip.to_location),
        ].filter(Boolean); // Filter out null values

        console.log("Fetched locations:", tripLocations);
        setLocations(tripLocations);
   
    

  }, [trip]);

  useEffect(() => {
    if (!locations || locations.length === 0) return; // Prevent running if no locations

    // Initialize the map only when locations are available
    const map = L.map("trip-map").setView(
      [locations[0].latitude, locations[0].longitude], 
      10
    );
    mapRef.current = map
    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Add route using leaflet-routing-machine
    L.Routing.control({
      waypoints: locations.map((loc) => L.latLng(loc.latitude, loc.longitude)),
      routeWhileDragging: true,
      showAlternatives: false,
      addWaypoints: false, // Prevent user from adding points
    })
    .on("routesfound", (e) => {
        const route = e.routes[0].coordinates;
        
       fetchStopsAlongRoute(route);
      })
    .addTo(map);

    return () => map.remove(); // Clean up map on unmount
  }, [locations]);

const fetchStopsAlongRoute = (route) => {
    if (!route || route.length === 0) return;
  const sampledRoute = route.filter((_, index) => index % 20 === 0);
    const overpassQuery = `
      [out:json];
      (
        ${sampledRoute
          .map(
            (point) => `
          node["amenity"="fuel"](around:50,${point.lat},${point.lng});
          node["highway"="rest_area"](around:50,${point.lat},${point.lng});
        `
          )
          .join("\n")}
      );
      out body;
    `;

    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`)
      .then((response) => response.json())
      .then((data) => {
     
        setStops(data.elements || []);
        addMarkers(data.elements || []);
      })
      .catch((error) => console.error("Error fetching stops:", error));
  };

  const addMarkers = (stops) => {
    
    if (!mapRef.current) return;

    stops.forEach((stop) => {
      const marker = L.marker([stop.lat, stop.lon]);
      const popup = new L.Popup({ autoClose: false, closeOnClick: false })
        .setContent(`${stop.tags.ammenity} - ${stop.tags.name}` || "Unnamed Stop")
        .setLatLng([stop.lat, stop.lon]);

      marker.bindPopup(popup);
      // Add marker to map
      marker.addTo(mapRef.current); 
      mapRef.current.addLayer(marker); // Explicitly add the layer (optional)
    });
  };

  // Update User Location Marker in Real-Time
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: L.icon({ iconUrl: "/marker.png", iconSize: [30, 30] }), // Change icon if needed
      }).addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [currentLocation]);
  return (
    <div id="trip-map" style={{ height: "400px", width: "100%" }}>
      {!locations && <p>Loading map...</p>}
    </div>
  );
}
