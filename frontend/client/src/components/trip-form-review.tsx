import { Button } from "@/components/ui/button";

export function TripFormReview({ tripData, handleSubmit, prevStep }) {
  return (
    <div>
      <h2 className="text-xl mb-4">Step 3: Review & Submit</h2>

      <pre>{JSON.stringify(tripData, null, 2)}</pre>

      <div className="flex justify-between mt-4">
        <Button onClick={prevStep}>Back</Button>
        <Button onClick={handleSubmit}>Submit Trip</Button>
      </div>
    </div>
  );
}
