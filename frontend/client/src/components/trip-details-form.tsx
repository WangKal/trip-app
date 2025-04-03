import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export function TripDetailsForm({ form,  handleSubmit, prevStep }) {
  return (
    <div>
      <h2 className="text-xl mb-4">Step 2: Trip Details</h2>

      {/** Carrier Name */}
      <FormField
        control={form.control}
        name="carrier_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Carrier Name</FormLabel>
            <FormControl>
              <Input placeholder="Carrier Name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/** Main Office Address */}
      <FormField
        control={form.control}
        name="main_office_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Main Office Address</FormLabel>
            <FormControl>
              <Input placeholder="Main Office Address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/** Truck Number */}
      <FormField
        control={form.control}
        name="truck_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Truck Number</FormLabel>
            <FormControl>
              <Input placeholder="Truck Number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/** Home Terminal Address */}
      <FormField
        control={form.control}
        name="home_terminal_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Home Terminal Address</FormLabel>
            <FormControl>
              <Input placeholder="Home Terminal Address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/** Document Number */}
      <FormField
        control={form.control}
        name="document_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Document Number</FormLabel>
            <FormControl>
              <Input placeholder="Document Number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/** Shipper */}
      <FormField
        control={form.control}
        name="shipper"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Shipper</FormLabel>
            <FormControl>
              <Input placeholder="Shipper" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/** Commodity */}
      <FormField
        control={form.control}
        name="commodity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Commodity</FormLabel>
            <FormControl>
              <Input placeholder="Commodity" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/** Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <Button onClick={prevStep} variant="secondary">Back</Button>
        <Button onClick={handleSubmit}>Submit Trip</Button>
      </div>
    </div>
  );
}
