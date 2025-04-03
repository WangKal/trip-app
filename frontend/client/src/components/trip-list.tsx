import { TripCard } from "./TripCard";

interface Trip {
  id: number;
  name: string;
  isCompleted: boolean;
}

interface Props {
  trips: Trip[];
  onSelect: (trip: Trip) => void;
}

export function TripList({ trips, onSelect }: Props) {
  //const completedTrips = trips.filter((trip) => trip.isCompleted);
  //const ongoingTrips = trips.filter((trip) => !trip.isCompleted);

  return (
    <div className="flex space-x-4">
      <div>
        <h2 className="text-xl font-semibold">Trips</h2>
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onSelect={onSelect} />
        ))}
      </div>

  );
}
