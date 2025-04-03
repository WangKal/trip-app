import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MoreVertical, 
  PlusCircle, 
  LogOut, 
  CheckCircle, 
  Moon, 
  Truck, 
  Briefcase,
  Menu,
  Home,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  ClipboardCheck,
  Bell,
  User,
  Settings,
  User2,
  Package, 
  Building, 
  Clock,
  FileText  } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLocation, useRoute, Link } from "wouter";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { SidebarContent } from "../components/sidebar-content";
import { motion } from "framer-motion";

const STATUS_CHOICES = [
  { key: "driving", label: "Driving", icon: <Truck className="w-6 h-6" />  },
  { key: "on_duty", label: "On Duty, Not Driving", icon: <Briefcase className="w-6 h-6" />  },
  { key: "sleeper", label: "Sleeper Berth", icon: <Moon className="w-6 h-6" /> },
  { key: "off_duty", label: "Off Duty", icon: <CheckCircle className="w-6 h-6" /> },
];
export default function LogEntryPage({ currentStatus }) {
  const { user, logoutMutation } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const fullname = `${user?.first_name} ${user?.last_name}`;
  const [, navigate] = useLocation();
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/log-entry-page/:tripId");
  const logId = params?.tripId;
  
  const { data: log_details } = useQuery({
    queryKey: ["/api/logs/", logId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/logs/${logId}`);
      return response.json();
    },
    enabled: !!logId,
  });

  const tripId = log_details?.trip;

  const { data: trip } = useQuery({
    queryKey: ["/api/trips/", tripId],
    queryFn: async () => {
      if (!tripId) return;
      const response = await apiRequest("GET", `/api/trips/${tripId}`);
      return response.json();
    },
    enabled: !!tripId,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["/api/logs/log-entries", logId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/logs/log-entries/${logId}`);
      return response.json();
    },
    enabled: !!logId,
  });
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || "off_duty");

  const [gps, setGPS] = useState("");
  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);
  



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
  useEffect(() => {
    setIsMounted(true);
  }, []);

   const timestamp = Date.now(); // Current time in milliseconds
 // Get current status and logId from localStorage
let runningStatus = localStorage.getItem("status") || null;
const runningLogId = localStorage.getItem("logId") || null;

const handleEndLog = async () => {

  if (runningStatus === null) return;


  try {
    const status = {status:runningStatus}
   
      
     //Update last log entry
     await apiRequest("POST", "/api/update-log-entry/", { status,logId,gps,timestamp }); // Send to backend
      runningStatus = null;
  
// Clear local storage after sending
    localStorage.removeItem("status");
    localStorage.removeItem("logId");
    
    //redirect to remarks page
    navigate(`/log-completion/${runningLogId}`)
    
  } catch (error) {
    console.error("Error ending log entry:", error);
  }
};



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




  const handleStatusChange = async (status) => {
    setSelectedStatus(status);
    // Save static values in local storage
            localStorage.setItem("logId", logId);
            localStorage.setItem("status", status);
    await apiRequest("POST", "/api/update-log-entry/", { status,logId,gps,timestamp }); // Send to backend
  };


  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      await apiRequest("POST", `/api/logs/${logId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/logs/", logId]);
    },
  });

  const endLogMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/logs/${logId}/end`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/logs/", logId]);
    },
  });

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
                <SidebarContent  />
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
      <FileText  size={32} className="md:size-48" />
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


      <div className="pt-20 p-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          
           <div className="flex flex-wrap gap-4 p-4 bg-white shadow-md rounded-lg">
       {STATUS_CHOICES.map((status) => (
        <motion.button
          key={status.key}
          onClick={() => handleStatusChange(status.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
            selectedStatus === status.key || runningStatus === status.key
              ? "bg-blue-600 text-white shadow-md scale-105"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {status.icon}
          {status.label}
        </motion.button>
      ))}
    </div>

          <Button onClick={() => handleEndTrip()} className="mt-4 bg-red-500 hover:bg-red-700">
            End Log
          </Button>
        </div>

      
      <h3 className="text-2xl">Log Entries </h3>
        <div className="mt-6">
  

          {logs.length === 0 ? (
            <p>No log entries available.</p>
          ) : (
           <></>)}

         
          <div className="space-y-4">
          {logs.length === 0 ? (
          <></>
          ) : (
            logs.map((log) => <LogCard key={log.id} log={log} navigate={navigate} />)
          )}
          </div>
        </div>
      </div>



          </motion.div>
          </main>
          </div>

    </div>
  );
}

const LogCard = ({ log, navigate }) => {
   const statusChoice = STATUS_CHOICES.find(choice => choice.key === log.status);
  
  return (
  <div className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center">
     <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
         {statusChoice ? statusChoice.icon : <MapPin className="text-indigo-600" />}
         
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Status: {(log.status)}  </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="h-4 w-4" />{`Date: ${new Date(log.start_time). toLocaleDateString()}`}         </p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-4 w-4" />{`Start time: ${new Date(log.start_time). toLocaleTimeString()}`}{log.end_time ?` End time: ${new Date(log.end_time). toLocaleTimeString()}`:``}
            </p>
          </div>
          </div>
      </div>
  </div>
  )
};
