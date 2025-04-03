import { useState, useEffect, useRef } from "react";
import { MoreVertical, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function TripCard({ trip }) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isNew = Date.now() - new Date(trip.createdAt).getTime() < 24 * 60 * 60 * 1000;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const [fromAddress, setFromAddress] = useState("Fetching address...");
  const [toAddress, setToAddress] = useState("Fetching address...");
  const [loading, setLoading] = useState(true);
  // Function to fetch address from GPS
  const fetchAddress = async (gpsString, setAddress) => {
    if (!gpsString) {
      setAddress("No GPS data");
      return;
    }

    // Extract latitude and longitude from the string
    const match = gpsString.match(/([-+]?\d*\.\d+),\s*([-+]?\d*\.\d+)/);//match(/GPS:\s*([-+]?[0-9]*\.?[0-9]+),\s*([-+]?[0-9]*\.?[0-9]+)/);
    if (!match) {
      setAddress("Invalid GPS format");
      return;
    }

    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();

      // Extract meaningful address parts
      const { road, town, city, village, state } = data.address;
      let shortAddress = road || town || city || village || state || "Unknown Location";

      setAddress(shortAddress);
      //setAddress(data.display_name || "Address not found");
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress("Error fetching address");
    }
  };
    useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAddress(trip?.from_location, setFromAddress),
      fetchAddress(trip?.to_location, setToAddress),
    ]).then(() => setLoading(false)); // Set loading to false once all fetches complete
}, [trip]);
  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative p-4 rounded-lg shadow-md transition-colors ${
        trip.status === "ongoing" ? "bg-white" : "bg-indigo-50"
        }`}
        style={{ zIndex: menuOpen ? 40 : 1 }} // Ensures menu stays on top
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MapPin className="text-indigo-600" />
            <div>
                <h2 className="text-gray-700 text-xl md:text-2xl lg:text-3xl flex items-center gap-3">
      <span className="font-semibold">Trip:</span>

      {fromAddress && toAddress ? (
        <>
          <span className="truncate">{fromAddress}</span>

          {/* Truck Route SVG */}
          <svg className="w-16 h-6 md:w-20 md:h-8" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M5 25 C20 5, 60 5, 75 25" 
              stroke="gray" 
              strokeWidth="2" 
              fill="none" 
              strokeDasharray="5,5"
            />
            <rect x="70" y="20" width="8" height="6" fill="gray" />
          </svg>

          <span className="truncate">{toAddress}</span>
        </>
      ) : (
        <></>
      )}
    </h2>
              <h3 className="text-lg font-semibold text-gray-800">
                {trip.title || "Start Date"}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {new Date(trip.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="h-5 w-5" />
            </Button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-gray-200 z-50"
                style={{ pointerEvents: "auto" }}
              >
                {trip.status === "ongoing" ? (
                  <>
                    <MenuItem label="View Map" onClick={() => handleNavigation(`/map-page/${trip.id}`)} />
                    <MenuItem label="View Logs" onClick={() => handleNavigation(`/trip-page/${trip.id}`)} />
                  </>
                ) : (
                  <>
                    <MenuItem label="View Map" onClick={() => handleNavigation(`/map-page/${trip.id}`)} />
                    <MenuItem label="View Logs" onClick={() => handleNavigation(`/trip-page/${trip.id}`)} />
                    </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Menu Item Component
const MenuItem = ({ label, onClick }) => (
  <button
    className="block w-full px-4 py-2 text-left text-sm hover:bg-indigo-100"
    onClick={onClick}
  >
    {label}
  </button>
);
