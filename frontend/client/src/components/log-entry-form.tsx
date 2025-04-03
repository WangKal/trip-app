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

export function LogEntryForm() {
  const [, setLocation] = useLocation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const fullname = `${user?.first_name} ${user?.last_name}`;
  const { createLogEntryMutation, updateLogEntryMutation, fetchLogEntryById } = useTrips();
  const [gps_location, setgps_location] = useState("Fetching...");

  
  // Get tripId from the route
 /* const [match, params] = useRoute("/edit-trip/:logId");
  const LogId = match ? params.logId : null;
*/
// Match both routes
const [isEditTrip, editParams] = useRoute("/log-entry/edit/:logId");
const [isCreateLog, createParams] = useRoute("/log-entry/create/:tripId");



  /*const [manualLog, setManualLog] = useState({
    startTime: "",
    endTime: "",
    eventType: "",
  });*/

// Extract values based on route match
const logEntryId = isEditTrip ? editParams.logId : null;
const logId = isCreateLog ? createParams.tripId : null;



 // Initialize form
  const form = useForm({
    defaultValues: {
      log: logId || "AUTO-LINK",
      automated:false,
      status: "",
      start_time: "",
      end_time: "",
      remarks: "",
      },
  });

  useEffect(() => {
    getGPSLocation().then((location) => {
      setgps_location(location);
      form.setValue("location", location); // Update form with GPS
    });
  }, [form]);



  // Fetch Trip if Editing
  useEffect(() => {
    const loadLog = async () => {
      if (logEntryId) {
        const logData = await fetchLogEntryById(logEntryId);
        setTrip(logData);
      }
    };
    loadLog();
  }, [logEntryId, fetchLogEntryById]);

  //set trip id on form
 useEffect(() => {
  form.setValue('log_id', logId);

  }, [logId, form]);
  useEffect(() => {
  form.setValue('location', gps_location);
  }, [location, form]);



  // Submit handler
  const handleSubmit = async (values) => {
  try {
    if (logEntryId) {
      await updateLogEntryMutation.mutateAsync({ id: logEntryId, log: values });
    } else {
      await createLogEntryMutation.mutateAsync(values);
    }
    navigate(`log-entry-page/${logId}`);
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
            name="log"
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="automated"
            value ="false"
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />

          {/* Duty Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duty Status</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    required
                    className="w-full border rounded p-2"
                  >
                    <option value="">Select Status</option>
                    <option value="off_duty">Off Duty</option>
                    <option value="sleeper">Sleeper Berth</option>
                    <option value="driving">Driving</option>
                    <option value="on_duty (Not Driving)">
                      On Duty (Not Driving)
                    </option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        
          {/* Auto Timestamp */}
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input {...field}
                   type="datetime-local" 
                   />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Auto Timestamp */}
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input {...field}
                   type="datetime-local" 
                     />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

         

          {/* GPS Location */}
          {/* Driver's Name */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GPS location</FormLabel>
                <FormControl>
                  <Input placeholder="GPS location" {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
{/* Amendments (Optional) */}
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea placeholder="Remarks" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Submit Log Entry
          </Button>
        </form>
      </Form>
    </div>
  );
}
