import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { LocationForm } from "../components/location-form";
import { TripDetailsForm } from "../components/trip-details-form";
import { TripFormReview } from "../components/trip-form-review";
import { useTrips } from "@/hooks/use-trips";
import { Form } from "@/components/ui/form";
import { motion } from "framer-motion";

export function TripCreationForm() {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const fullname = `${user?.first_name} ${user?.last_name}`;
  const { createMutation, updateMutation, fetchTripById } = useTrips();
  const [, setLocation] = useLocation();
  const [, navigate] = useLocation();
  const [gps_location, setgps_location] = useState("Fetching...");



  // Shared form instance across steps
  const form = useForm({
    defaultValues: {
      driver_id: `${user?.id} `,
      driver_name: `${user?.first_name} ${user?.last_name}`,
      from_location: "",
      to_location: "",
      carrier_name: "",
      truck_number: "",
      document_number: "",
      shipper: "",
      commodity: "",
    },
  });

// Get tripId from the route
  const [match, params] = useRoute("/edit-trip/:tripId");
  const tripId = match ? params.tripId : null;
 
  // Step Navigation Handlers
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);
  useEffect(() => {
    const loadTrip = async () => {
      if (tripId) {
        const tripData = await fetchTripById(tripId);
        setTrip(tripData);
      }
    };
    loadTrip();
  }, [tripId, fetchTripById]);
  
    const handleSubmit = async (values) => {
  try {

    const formattedValues = {
      ...values,
      from_location: `${(values.from_location).lat},${(values.from_location).lng}`,
      to_location: `${(values.to_location).lat},${(values.to_location).lng}`,
    };

    if (tripId) {
      await updateMutation.mutateAsync({ id: tripId, trip: formattedValues });
    } else {
      await createMutation.mutateAsync(formattedValues);
      alert("Trip Created!");
      navigate("/dashboard");
    }
    navigate("/");
  } catch (error) {
    console.error("Submission failed:", error);
  }
};

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-semibold mb-6"
      >
        Start a New Trip
      </motion.h2>

      {/* Form Wrapper - Shared Context */}
      <Form {...form}>
        {step === 1 && (
          <LocationForm form={form} nextStep={nextStep} />
        )}

        {step === 2 && (
          <TripDetailsForm
            
             form={form}
            handleSubmit={form.handleSubmit(handleSubmit)}
            prevStep={prevStep}
          />
        )}

        
      </Form>
    </div>
  );
}
