import { useEffect } from "react";

const LocationTracker = ({ onLocationUpdate }) => {
  useEffect(() => {
    const updateLocation = (position) => {
      const { latitude, longitude } = position.coords;
      onLocationUpdate({ latitude, longitude }); // Sends location to parent
      console.log("Updated location:", latitude, longitude);
    };

    const handleError = (error) => console.error("Geolocation error:", error);

    const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000, // Cache location for 5 seconds
      timeout: 10000,   // Timeout if no location update
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onLocationUpdate]);

  return null; // No UI needed
};

export default LocationTracker;
