from datetime import datetime, timedelta  # Add datetime import here
from triplog.models import TripLog, LogEntry, Trip
from django.utils import timezone
import random

def create_trip_log_and_entries(trip_id):
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        print(f"Trip with id {trip_id} does not exist.")
        return

    log_date = timezone.now().date()

    # Create TripLog
    trip_log = TripLog.objects.create(
        trip=trip,
        log_date=log_date
    )

    # Define status blocks with their durations (in minutes)
    status_blocks = [
        ("off_duty", 4 * 60),    # 4 hours
        ("sleeper", 6 * 60),     # 6 hours
        ("driving", 5 * 60),     # 5 hours
        ("on_duty", 3 * 60),     # 3 hours
    ]

    # Driving distance simulation
    total_miles = 250
    driving_minutes = dict(status_blocks)["driving"]
    miles_per_minute = total_miles / driving_minutes

    # Set start time pointer, starting at 1:48:18 AM on the given date
    current_time = timezone.make_aware(datetime(2025, 4, 5, 1, 48, 18))
    start_time = None
    end_time = None
    for idx, (status, duration_minutes) in enumerate(status_blocks):
        
        
        if idx == 0:
            # For the first status, use the current_time as start_time
            start_time = current_time
        else:
            # For subsequent statuses, the start time is the end time of the previous status
            print(f"endtime",end_time)
            start_time = end_time
        
        # Calculate the end time for this status
        end_time = start_time + timedelta(minutes=duration_minutes)
        print(f"starttime",start_time)
        # If the status is "driving", calculate mileage
        mileage = round(duration_minutes * miles_per_minute, 2) if status == "driving" else 0.0

        # Create LogEntry
        LogEntry.objects.create(
            log=trip_log,
            status=status,
            start_time=start_time,
            end_time=end_time,
            start_gps={"lat": round(random.uniform(-90, 90), 6), "lon": round(random.uniform(-180, 180), 6)},
            end_gps={"lat": round(random.uniform(-90, 90), 6), "lon": round(random.uniform(-180, 180), 6)},
            mileage=mileage,
            remarks=f"Auto-generated {status}",
            automated=True
        )

    # Set trip log totals
    trip_log.total_off_duty_hours = 4
    trip_log.total_sleeper_hours = 6
    trip_log.total_driving_hours = 5
    trip_log.total_on_duty_hours = 3
    trip_log.total_miles_driving_today = total_miles
    trip_log.total_miles_today = total_miles
    trip_log.save()

    print(f"✅ TripLog and non-overlapping LogEntries created for Trip {trip_id}")
