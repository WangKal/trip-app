import { useEffect } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import TripCreate from "@/pages/trip-creation";
import TripPage from "@/pages/trip-page";
import LogPageCreate from "@/pages/log-page-create";
import LogPage from "@/pages/log-page";
import LogEntry from "@/pages/log-entry";
import LogEntryPage from "@/pages/log-entry-page";
import LogView from "@/pages/log-view";

import MapPage from "@/pages/map-page";
import LogCompletion from "@/pages/log-completion";
import AuthPage from "@/pages/auth-page";

function Router() {
  const [location] = useLocation();
  const hideBottomNav = location === "/auth"; // Hide BottomNav on auth page

  return (
    <>
      <Switch>
        {/* Protected Routes */}
        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/trip-create" component={TripCreate} />
        <ProtectedRoute path="/trip-edit/:tripId" component={TripCreate} />
        <ProtectedRoute path="/trip-page/:tripId" component={TripPage} />
        <ProtectedRoute path="/log-page/:logId" component={LogPage} />
        <ProtectedRoute path="/log/create/:tripId" component={LogPageCreate} />
        <ProtectedRoute path="/log/edit/:tripId" component={LogPageCreate} />
        <ProtectedRoute path="/log-entry/:logId" component={LogEntryPage} />
        <ProtectedRoute path="/eld/:logId" component={LogView} />
        <ProtectedRoute path="/log-entry/create/:logId" component={LogEntry} />
        <ProtectedRoute path="/log-entry/edit/:logId" component={LogEntry} />
        <ProtectedRoute path="/map-page/:tripId" component={MapPage} />
        <ProtectedRoute path="/log-entry-page/:tripId" component={LogEntryPage} />
        <ProtectedRoute path="/log-entry-view/:tripId" component={LogView} />
        <ProtectedRoute path="/log-entry/create/:tripId" component={LogEntry} />
        <ProtectedRoute path="/log-entry/edit/:logId" component={LogEntry} />
        <ProtectedRoute path="/log-completion/:tripId" component={LogCompletion} />
         <ProtectedRoute path="/map-page/:tripId" component={MapPage} />


        {/* Public Routes */}
        <Route path="/auth" component={AuthPage} />

        {/* 404 Page */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('Service Worker Registered:', registration);
       /* navigator.serviceWorker.ready.then((sw) => {
          sw.active?.postMessage('startTracking');
        });*/
      })
      .catch((err) => console.error('SW Registration Failed:', err));
  }
};
function App() {

   useEffect(() => {
  registerServiceWorker();

  // Wait for service worker to be ready
  navigator.serviceWorker.ready.then((registration) => {
    // Track location and send logs to service worker
    navigator.geolocation.watchPosition(
      (position) => {
        // Get log ID and status from local storage
        const logId = localStorage.getItem("logId");
        const status = localStorage.getItem("status");

        // Ensure log ID and status exist before sending data
        if (!logId || !status) {
          console.warn("Log ID or status missing. Not sending log.");
          return;
        }

        const log = {
          status: status, // Use stored status
          logId: logId, // Include log ID
          gps: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          timestamp: Date.now(), // Match format (milliseconds)
        };

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "log", log });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  });

 
}, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
