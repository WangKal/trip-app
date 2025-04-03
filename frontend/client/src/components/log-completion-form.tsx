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

export function LogCompletionForm() {
  const [, setLocation] = useLocation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const fullname = `${user?.first_name} ${user?.last_name}`;
  const { logEndMutation, fetchLogById } = useTrips();
  const [gps_location, setgps_location] = useState("Fetching...");

  // Get tripId from the route
  const [match, params] = useRoute("/log-completion/:logId");
  const logId = match ? params.logId : null;

  // Initialize form
  const form = useForm({
    defaultValues: {
      // Trip Completion Form
      log: logId || "AUTO-LINK",
      remarks: "",
},
  });


useEffect(() => {
    getGPSLocation().then((location) => {
      setgps_location(location);
      form.setValue("end_location", location); // Update form with GPS
    });
  }, [form]);

 //set trip id on form
 useEffect(() => {
  form.setValue('log', logId);
  }, [logId, form]);
  


  // Submit handler
  const handleSubmit = async (values) => {
  try {
   
      await logEndMutation.mutateAsync(values);
    
    navigate(`/`);
  } catch (error) {
    console.error("Submission failed:", error);
  }
};

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10 ">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-semibold mb-6"
      >
      
      </motion.h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Trip Completion Section */}
          <h3 className="text-xl font-semibold">Trip Log Completion</h3>

          {/* Trip ID (Auto-Link) */}
          <FormField
            control={form.control}
            name="log"
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />


          {/* Amendments (Optional) */}
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks (If Any)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Add any remarks" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Submit Remarks
          </Button>
        </form>
      </Form>
    </div>
  );
}
