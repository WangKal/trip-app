import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LogOut,
  Menu,
  Home,
  ClipboardCheck,
  Bell,
  PlusCircle,
  User,
  Settings,
  Truck,
  Briefcase, 
  Moon, 
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiRequest, queryClient } from "../lib/queryClient";
import {TripCard} from "../components/trip-card";
import {SidebarContent} from "../components/sidebar-content";
import { useToast } from "@/hooks/use-toast";


/*const trips = async (): Promise<Trip[]> => {
    const response = await fetch("/api/trips");
    return response.json();
  };*/

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const fullname = `${user?.first_name} ${user?.last_name}`;
  const [isMounted, setIsMounted] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: trips = [] } = useQuery({
    queryKey: ["/api/trips"],
  });
  const [loading, setLoading] = useState(true);

  const [logId, setLogId] = useState(
    localStorage.getItem("logId") || null
  );
  const [currentStatus, setCurrentStatus] = useState(
    localStorage.getItem("runningStatus") || "No Running Logs"
  );
  const [selectedStatus, setSelectedStatus] = useState(
  currentStatus);
  const [fromAddress, setFromAddress] = useState("Fetching address...");
  const [toAddress, setToAddress] = useState("Fetching address...");
  const [logDate, setLogDate] = useState("");
  const [gps, setGPS] = useState("");
  
  useEffect(() => {
    setIsMounted(true);
  }, []);  
const { data: log_details } = useQuery({
  queryKey: ["/api/logs/", logId],
  queryFn: async () => {
    const response = await apiRequest("GET", `/api/logs/${logId}`);
    return response.json();
  },
  enabled: !!logId,
});

useEffect(() => {
  if (log_details?.log_date) {
    setLogDate(log_details.log_date); // Use correct property name
  }
}, [log_details]);

const ongoingTrip = trips.find((trip) => trip.status === "ongoing");

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
      fetchAddress(ongoingTrip?.from_location, setFromAddress),
      fetchAddress(ongoingTrip?.to_location, setToAddress),
    ]).then(() => setLoading(false)); // Set loading to false once all fetches complete
}, [ongoingTrip]);
  
  



useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const gpsData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setGPS(gpsData);

      const timestamp = Date.now(); // Get current timestamp

      
    },
    (error) => {
      console.error("Error getting GPS:", error);
    }
  );
}, []); // Empty dependency array ensures this runs only once


   const timestamp = Date.now();

 const handleStatusChange = async (status) => {
  if (!logId) {
        
      toast({ title: "Log ELD ", description: "Please go to the trip and select the Log or create one to set status.", variant: "destructive" });
   
      return;
    }
    setSelectedStatus(status);
    status={status:status}
    // Save static values in local storage
            localStorage.setItem("logId", logId);
            localStorage.setItem("status", status);
    await apiRequest("POST", "/api/update-log-entry/", { status,logId,gps,timestamp }); // Send to backend
  };
   const handleEndTrip = async (status) => {
 
    await apiRequest("POST", `/api/trip-completion/${ongoingTrip.id}/`); // Send to backend
  };
  // Role-based navigation data
  const navigation = {
    driver: [
      { icon: <Home />, label: "Home", path: "/" },
      { icon: <ClipboardCheck />, label: "Dashboard", path: "/dashboard" },
      { icon: <PlusCircle />, label: "Log Entry", path: "/log-entry" },
      { icon: <ClipboardCheck />, label: "Compliance", path: "/compliance" },
      { icon: <Bell />, label: "Alerts", path: "/alerts" },
      { icon: <User />, label: "Profile", path: "/profile" },
      { icon: <Settings />, label: "Settings", path: "/settings" },
    ],
    admin: [
      { icon: <Home />, label: "Home", path: "/" },
      { icon: <ClipboardCheck />, label: "Dashboard", path: "/dashboard" },
      { icon: <ClipboardCheck />, label: "Compliance Audit", path: "/compliance" },
      { icon: <Bell />, label: "Manage Alerts", path: "/alerts" },
      { icon: <User />, label: "Manage Users", path: "/profile" },
      { icon: <Settings />, label: "System Settings", path: "/settings" },
    ],
  };
const STATUS_CHOICES = [
  { key: "driving", label: "Driving", icon: <Truck className="w-6 h-6" /> },
  { key: "on_duty", label: "On Duty, Not Driving", icon: <Briefcase className="w-6 h-6" /> },
  { key: "sleeper", label: "Sleeper Berth", icon: <Moon className="w-6 h-6" /> },
  { key: "off_duty", label: "Off Duty", icon: <CheckCircle className="w-6 h-6" /> }
];
  const userNav = navigation.driver; //user?.role === "admin" ? navigation.admin : navigation.driver;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 shadow-sm">
        <div className="container mx-auto h-full flex flex-wrap items-center justify-between px-4">
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
      <div className="pt-20 flex flex-wrap">
        {/* Sidebar (Desktop) */}
        <aside className="w-64 fixed left-0 top-16 bottom-0 border-r hidden lg:block bg-white shadow-sm">
          <ScrollArea className="h-full py-6 px-4">
            <SidebarContent  />
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


<div className="bg-white shadow-lg rounded-lg p-6 flex flex-wrap items-center justify-between">
  <div>
    <h2 className="text-3xl font-semibold text-gray-800">
      Welcome, {fullname}!
    </h2>
    <p className="text-gray-600 mt-2">
      Stay compliant and track your trips effortlessly.
    </p>
  </div>

  {/* Animated Truck and Clock Icons with Colors */}
  <div className="flex flex-wrap items-center space-x-6">
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Truck className="w-24 h-24 text-blue-500" /> {/* Blue Truck */}
    </motion.div>

    <motion.div
      initial={{ rotate: 0, opacity: 0 }}
      animate={{ rotate: 360, opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <Clock className="w-20 h-20 text-amber-500" /> {/* Amber Clock */}
    </motion.div>
  </div>
</div>


<div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-hidden">
  <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 mb-4 flex flex-wrap items-center justify-between gap-4">
    {/* Left Side: Trip Info */}
    <div className="flex-1 min-w-[200px]">
      <h2 className="text-gray-700 text-xl md:text-2xl lg:text-3xl flex flex-wrap items-center gap-2 mb-2">
        <span className="font-semibold">Current Trip:</span>
        {ongoingTrip ? (
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
{ongoingTrip ? (
          <>
        
      <motion.button
        onClick={() => handleEndTrip(ongoingTrip.id)}
         whileHover={ `scale: 1.1` } 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 bg-red-600 text-white shadow-md scale-105 `}>
        End Trip
      </motion.button>
</>
):(<></>)}

      {/* Show Log Date if logId exists */}
      {logId && (
        <p className="text-gray-600 text-sm md:text-base mb-2">
          Log Date: {logDate ? new Date(logDate).toLocaleString() : "Loading..."}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        {/* Display Current Status */}
        <span className="text-lg md:text-xl font-semibold text-gray-600">Current Status:</span>
        <span className="px-3 py-1 md:px-4 md:py-2 rounded-lg text-white bg-blue-600 text-sm md:text-base">
          {currentStatus !== "No Running Logs" ? (
            STATUS_CHOICES.find((s) => s.key === selectedStatus)?.label
          ) : (
            "No Running Logs"
          )}
        </span>
      </div>
    </div>

    {/* 🗺️ Map Icon (Right Side, Responsive) */}
    {ongoingTrip?.id && (
      <Link 
        href={`/map-page/${ongoingTrip.id}`} 
        className="flex flex-col items-center text-blue-600 bg-blue-100 p-2 md:p-3 rounded-lg shadow-md 
                   hover:bg-blue-200 transition duration-300"
      >
        <MapPin size={36} className="md:size-48" />
        <span className="text-xs md:text-sm">View Map</span>
      </Link>
    )}
  </div>
</div>


            {/* Status Selection */}
            <div className=" bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
  
<div className="flex flex-wrap flex-col gap-4 p-4 bg-white shadow-md rounded-lg">
  {/* Description */}
  <p className="text-gray-700">Statuses to update the ELD logs.</p>

  {/* Status Buttons */}
  <div className="flex flex-wrap flex-wrap gap-4">
    {STATUS_CHOICES.map((status) => (
      <motion.button
        key={status.key}
        onClick={() => handleStatusChange(status.key)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          selectedStatus === status.key 
            ? "bg-blue-600 text-white shadow-md scale-105" 
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        } ${!currentStatus ? "opacity-50 cursor-not-allowed" : ""}`}
        whileHover={currentStatus ? { scale: 1.1 } : {}}
        whileTap={currentStatus ? { scale: 0.95 } : {}}
        disabled={!currentStatus}
      >
        {status.icon}
        {status.label}
      </motion.button>
    ))}
  </div>
</div>

    </div>
{/*Create button */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             
           <QuickAction
           className="bg-blue-600 text-white shadow-md scale-105"
              icon = {<PlusCircle className="text-white-600"/>}
              label = "Create Trip"
              onClick={() => {
    if (ongoingTrip) {
        
      toast({ title: "Trip Creation ", description: "There is an ongoing trip. Complete it before creating a new one.", variant: "destructive" });
   
      return;
    }
    navigate("trip-create");
  }}
              />
              </div>

            {/* Tabs moved to top */}
              <Tabs defaultValue="trips">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="trips" className="text-2xl">Trips</TabsTrigger>
                </TabsList>


                <TabsContent value="trips" className="mt-6 space-y-6">
                  {trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </TabsContent>

                
              </Tabs>




          </motion.div>
        </main>
      </div>
    </div>
  );
}



// Quick Action Component
const QuickAction = ({ icon, label, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-center gap-3 p-4 bg-blue-600 text-white shadow-md scale-105 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
    onClick={onClick}
  >
    {icon}
    <span className="text-white-800 text-3xl font-medium">{label}</span>
  </motion.div>
);
