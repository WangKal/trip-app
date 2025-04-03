import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
 LogOut,
  Menu,
  Home,
  MoreVertical,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  ClipboardCheck,
  Bell,
  PlusCircle,
  User,
  Settings,
  User2,
  Package,
  Truck, 
  Building, 
  Clock,
  Route
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { useLocation,useRoute } from "wouter";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query"
import {TripCard} from "../components/trip-card";
import { useTrips } from "../hooks/use-trips";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import LocationTracker from "../components/location-tracker";
import {TripMap} from "@/components/trip-map";

import {SidebarContent} from "../components/sidebar-content";
/*const trips = async (): Promise<Trip[]> => {
    const response = await fetch("/api/trips");
    return response.json();
  };*/

export default function MapPage() {
  const { user, logoutMutation } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const fullname = `${user?.first_name} ${user?.last_name}`;
  const [isMounted, setIsMounted] = useState(false);
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/map-page/:tripId");
  const tripId = params?.tripId;

  // Fetch trip details
  const { data: trip, isLoading: isTripLoading } = useQuery({
    queryKey: ["/api/trips", tripId],
    queryFn: async () => {
      const response = await apiRequest("GET",`/api/trips/${tripId}`);
      return response.json();
    },
    enabled: !!tripId,
  });

 

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  if (isTripLoading) return <p>Loading trip details...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 shadow-sm">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          {/* Mobile Sidebar */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <ScrollArea className="h-full py-6">
                <SidebarContent />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* App Title */}
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold text-indigo-600"
          >
            Trip App
          </motion.h1>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground hidden sm:inline"
            >
              @{user?.username}
            </motion.span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 flex">
        {/* Sidebar (Desktop) */}
        <aside className="w-64 fixed left-0 top-16 bottom-0 border-r hidden lg:block bg-white shadow-sm">
          <ScrollArea className="h-full py-6 px-4">
            <SidebarContent />
          </ScrollArea>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6 lg:ml-64">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isMounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
                        {/* Trip Summary */}
<div className="bg-white shadow-lg rounded-lg p-6">
  {/* Trip Header */}
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-gray-700 text-xl md:text-2xl lg:text-3xl flex items-center gap-3">
      <span className="font-semibold">Current Trip:</span>

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
        <span className="text-gray-500">No trip</span>
      )}
    </h2>
  </div>

  {/* Trip Info & Details (Inline) */}
  <div className="flex items-start justify-between">
    {/* 📍 Trip Info Icon */}
    <div className="flex flex-col items-center text-blue-600 bg-blue-100 p-3 md:p-4 rounded-lg shadow-md">
      <Route size={32} className="md:size-48" />
      <span className="text-xs md:text-sm">Trip Info</span>
    </div>

    {/* Trip Details (Now Inline) */}
    <div className="space-y-2 text-sm text-gray-700 flex-1 ml-6">
      <p className="flex items-center gap-2"><User2 size={18} /> <strong>Driver:</strong> {trip?.driver_name}</p>
      <p className="flex items-center gap-2"><Package size={18} /> <strong>Carrier:</strong> {trip?.carrier_name}</p>
      <p className="flex items-center gap-2"><Truck size={18} /> <strong>Truck:</strong> #{trip?.truck_number}</p>
      <p className="flex items-center gap-2"><Building size={18} /> <strong>Main Office:</strong> {trip?.main_office_address}</p>
      <p className="flex items-center gap-2"><Clock size={18} /> <strong>Start Time:</strong> {trip?.date}</p>
      <p className="flex items-center gap-2">
        <MapPin size={18} />
        <strong>Status:</strong>
        <span className="inline-block px-3 py-1 text-white bg-green-600 rounded-full ml-2">
          Ongoing
        </span>
      </p>
             
    </div>
  </div>
</div>
            {/* Map & Logs Components (Next Step) */}
            <div className="p-4">
                 <h1 className="text-2xl font-bold mb-4">Trip Map</h1>
                     <LocationTracker onLocationUpdate={setCurrentLocation} />
             
              <TripMap trip={trip} currentLocation={currentLocation} />
                       </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
}


