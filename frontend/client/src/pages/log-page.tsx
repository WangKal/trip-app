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
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { useLocation,useRoute } from "wouter";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query"
import {TripCard} from "../components/trip-card";
import { useTrips } from "../hooks/use-trips";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import {SidebarContent} from "../components/sidebar-content";
/*const trips = async (): Promise<Trip[]> => {
    const response = await fetch("/api/trips");
    return response.json();
  };*/

export default function LogPage() {
  const { user, logoutMutation } = useAuth();
  const fullname = `${user?.first_name} ${user?.last_name}`;
  const [isMounted, setIsMounted] = useState(false);
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/log-page/:tripId");
  const tripId = params?.tripId;

  // Fetch trip details
  const { data: trip, isLoading: isTripLoading } = useQuery({
    queryKey: ["/api/trip", tripId],
    queryFn: async () => {
      const response = await apiRequest("GET",`/api/trips/${tripId}`);
      return response.json();
    },
    enabled: !!tripId,
  });

  // Fetch log entries for the trip
  const { data: logs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ["/api/logs/trip", tripId],
    queryFn: async () => {
      const response = await apiRequest("GET",`/api/logs/trip/${tripId}`);
      return response.json();
    },
    enabled: !!tripId,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
              <h2 className="text-3xl font-semibold text-gray-800">
                Driver: {fullname}
              </h2>
            

              {/* Trip Details */}
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Carrier:</strong> {trip?.carrier_name}
                </p>
                <p>
                  <strong>Truck:</strong> #{trip?.truck_number} |{" "}
                </p>
                <p>
                  <strong>Main Office:</strong> {trip?.main_office_address} |{" "}
                </p>
                <p>
                  <strong>Start Time:</strong> {trip?.date}
                </p>
                
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="inline-block px-2 py-1 text-white bg-green-600 rounded-full">
                    Ongoing
                  </span>
                </p>
              </div>
            </div>
                       {/* Create Log Entry Button */}
            <Button
              onClick={() => navigate(`/log-entry/create/${tripId}`)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-5 w-5" />
              Create Log Entry
            </Button>

            {/* Log Entries */}
            <div className="space-y-4">
              {isLogsLoading ? (
                <p>Loading logs ...</p>
              ) : logs.length === 0 ? (
                <p>No log entries available for this trip.</p>
              ) : (
                logs.map((log) => <LogCard key={log.id} log={log} navigate={navigate} />)
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// Log Entry Card
const LogCard = ({ log, navigate }) => (
  

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/eld/${log.id}`)}>
          View ELD
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/log-entry/${log.id}`)}>
          View Log Entries
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/log/edit/${log.id}`)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDelete(log.id)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

);
