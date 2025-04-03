import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useRoute} from "wouter";
import { useTrips } from "../hooks/use-trips";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion } from "framer-motion";





// Mock GPS location function
const getGPSLocation = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve("GPS: 37.7749, -122.4194"), 1000)
  );

export function LogForm() {
  const [, setLocation] = useLocation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const fullname = `${user?.first_name} ${user?.last_name}`;
  const { createLogMutation, updateLogMutation, fetchLogById } = useTrips();
  const [gps_location, setgps_location] = useState("Fetching...");

  
  // Get tripId from the route
 /* const [match, params] = useRoute("/edit-trip/:logId");
  const LogId = match ? params.logId : null;
*/
// Match both routes
const [isEditTrip, editParams] = useRoute("/log/edit/:logId");
const [isCreateLog, createParams] = useRoute("/log/create/:tripId");



  /*const [manualLog, setManualLog] = useState({
    startTime: "",
    endTime: "",
    eventType: "",
  });*/

// Extract values based on route match
const logId = isEditTrip ? editParams.logId : null;
const tripId = isCreateLog ? createParams.tripId : null;



 // Initialize form
  const form = useForm({
    defaultValues: {
      trip: tripId || "AUTO-LINK",
      log_date: ""
      },
  });

  



  // Fetch Trip if Editing
  useEffect(() => {
    const loadLog = async () => {
      if (logId) {
        const logData = await fetchTripById(logId);
        setTrip(logData);
      }
    };
    loadLog();
  }, [logId, fetchLogById]);

  //set trip id on form
 useEffect(() => {
  form.setValue('trip', tripId);

  }, [tripId, form]);
  



  // Submit handler
  const handleSubmit = async (values) => {
  try {
    if (logId) {
      await updateLogMutation.mutateAsync({ id: logId, log: values });
    } else {
      await createLogMutation.mutateAsync(values);
    }
    navigate(`/trip-page/${tripId}`);
  } catch (error) {
    console.error("Submission failed:", error);
  }
};


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-semibold mb-6"
      >
        Log Entry Form
      </motion.h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Auto-Link Trip ID */}
          <FormField
            control={form.control}
            name="trip"
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />
          


        
          {/* Date */}
          <FormField
            control={form.control}
            name="log_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Log Date</FormLabel>
                <FormControl>
                  <Input {...field}
                   type="date" 
                   />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Submit Log
          </Button>
        </form>
      </Form>
    </div>
  );
}
