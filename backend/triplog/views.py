from django.db.models import Sum, F, ExpressionWrapper, fields
from rest_framework.decorators import api_view
from django.contrib.auth import authenticate, get_user_model
from .models import Trip, LogEntry, TripLog, TripCompletion
from rest_framework import status, viewsets, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    UserSerializer, RegisterSerializer, TripSerializer, 
    LogEntrySerializer, TripCompletionSerializer, TripLogSerializer
)
import logging
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_DOWN
import requests
import json
from django.http import JsonResponse




logger = logging.getLogger(__name__)

User = get_user_model()

# Helper function to create and return JWT tokens
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()  # Create the user
            tokens = get_tokens_for_user(user)  # Get tokens for the new user
            
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                **tokens
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class LoginView(APIView):
    def post(self, request):
        identifier = request.data.get('username')  # Supports username or email
        password = request.data.get('password')

        # Validate input
        if not identifier or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the user (by username OR email)
        try:
            user = User.objects.get(username=identifier) if User.objects.filter(username=identifier).exists() else User.objects.get(email=identifier)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials no user.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Authenticate user (always using username for Django's default backend)
        user = authenticate(request, username=user.username, password=password)

        logger.info(f"Authenticated User: {user}")

        if user is None:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate JWT tokens (using a custom utility function)
        tokens = get_tokens_for_user(user)

        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            **tokens
        }, status=status.HTTP_200_OK)

# User Detail View (Authenticated User Info)
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

# Logout View (Blacklist Refresh Token)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            logger.info(f"Received refresh token: {refresh_token}")

            if not refresh_token:
                return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Validate and blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({'message': 'Logged out successfully'}, status=status.HTTP_205_RESET_CONTENT)

        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)



 # Trip CRUD
class TripListCreateView(generics.ListCreateAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

class TripRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

# Trip Completion CRUD
class TripCompletionCreateView(generics.CreateAPIView):
    queryset = TripCompletion.objects.all()
    serializer_class = TripCompletionSerializer

class TripCompletionRetrieveView(generics.RetrieveAPIView):
    queryset = TripCompletion.objects.all()
    serializer_class = TripCompletionSerializer


# Log Entry Create/Update/Delete
class LogEntryListCreateView(generics.ListCreateAPIView):
    queryset = LogEntry.objects.all()
    serializer_class = LogEntrySerializer

    def perform_create(self, serializer):
        log_entry = serializer.save()
        update_trip_log(log_entry.log.id)  # Update TripLog


class LogEntryRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LogEntry.objects.all()
    serializer_class = LogEntrySerializer

    def perform_update(self, serializer):
        log_entry = serializer.save()
        update_trip_log(log_entry.log.id)  # Update TripLog

    def perform_destroy(self, instance):
        log_id = instance.log
        instance.delete()
        update_trip_log(log_id.id)  # Recalculate TripLog after deletion

class LogEntriesByTripLogView(generics.ListAPIView):
    serializer_class = LogEntrySerializer

    def get_queryset(self):
        log_id = self.kwargs.get('logId')
        result = LogEntry.objects.filter(log=log_id)
        return LogEntry.objects.filter(log=log_id)

class TripLogListCreateView(generics.ListCreateAPIView):
    queryset = TripLog.objects.all()
    serializer_class = TripLogSerializer

#  Delete TripLog and its related LogEntries
class TripLogRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TripLog.objects.all()
    serializer_class = TripLogSerializer

    def perform_destroy(self, instance):
        LogEntry.objects.filter(log_id=instance.trip_id).delete()
        instance.delete()

class TripLogByTripView(generics.ListAPIView):
    serializer_class = TripLogSerializer

    def get_queryset(self):
        trip_id = self.kwargs.get('tripId')
        result = TripLog.objects.filter(trip=trip_id)
        return TripLog.objects.filter(trip=trip_id)

# Helper function: Update Trip Log when log entries change
def update_trip_log(log_id):
    log_entries = LogEntry.objects.filter(log=log_id)
    log = TripLog.objects.filter(id=log_id).first()

   # if not log_entries.exists():
        # No log entries left for this date, delete the TripLog
        #TripLog.objects.filter(trip=log).delete()
        #return

    duration_expr = ExpressionWrapper(
        F("end_time") - F("start_time"), output_field=fields.DurationField()
    )

    # Calculate total hours per status
    total_off_duty_hours = (
        log_entries.filter(status="off_duty")
        .annotate(duration=duration_expr)
        .aggregate(Sum("duration"))["duration__sum"]
        or 0
    )

    total_sleeper_hours = (
        log_entries.filter(status="sleeper")
        .annotate(duration=duration_expr)
        .aggregate(Sum("duration"))["duration__sum"]
        or 0
    )

    total_driving_hours = (
        log_entries.filter(status="driving")
        .annotate(duration=duration_expr)
        .aggregate(Sum("duration"))["duration__sum"]
        or 0
    )

    total_on_duty_hours = (
        log_entries.filter(status="on_duty")
        .annotate(duration=duration_expr)
        .aggregate(Sum("duration"))["duration__sum"]
        or 0
    )
    # Calculate miles driven today
    total_miles_driving_today = log_entries.filter(status="driving").aggregate(Sum("mileage"))["mileage__sum"] or 0
    total_miles_today = log_entries.aggregate(Sum("mileage"))["mileage__sum"] or 0

    # Get latest GPS location
    latest_entry = log_entries.order_by("-id").first()
    #gps_location = {
     #   "latitude": latest_entry.latitude if latest_entry else None,
      #  "longitude": latest_entry.longitude if latest_entry else None
    #}
    gps_location = latest_entry.end_gps
    #  Compliance Tracking (Check past logs)
    start_date = log.log_date - timedelta(days=7)
    on_duty_last_7_days = TripLog.objects.filter(trip=log.trip, log_date__gte=start_date) \
        .aggregate(Sum("total_on_duty_hours"))["total_on_duty_hours__sum"] or 0

    start_date_8_days = log.log_date - timedelta(days=8)
    on_duty_last_8_days = TripLog.objects.filter(trip=log.trip, log_date__gte=start_date_8_days) \
        .aggregate(Sum("total_on_duty_hours"))["total_on_duty_hours__sum"] or 0

    start_date_6_days = log.log_date - timedelta(days=6)
    on_duty_last_6_days = TripLog.objects.filter(trip=log.trip, log_date__gte=start_date_6_days) \
        .aggregate(Sum("total_on_duty_hours"))["total_on_duty_hours__sum"] or 0

    start_date_7_days_60 = log.log_date - timedelta(days=7)
    on_duty_last_7_days_60 = TripLog.objects.filter(trip=log.trip, log_date__gte=start_date_7_days_60) \
        .aggregate(Sum("total_on_duty_hours"))["total_on_duty_hours__sum"] or 0

    #  Available Hours Tomorrow (Assuming 70-hour max rule)
    max_hours_per_week = 70
    available_hours_tomorrow = max(0, max_hours_per_week - on_duty_last_7_days)


    #  Update or create TripLog
    trip_log, created = TripLog.objects.update_or_create(
        id=log_id,
        defaults={
            "total_off_duty_hours": timedelta_to_decimal(total_off_duty_hours),
            "total_sleeper_hours": timedelta_to_decimal(total_sleeper_hours),
            "total_driving_hours": timedelta_to_decimal(total_driving_hours),
            "total_on_duty_hours": timedelta_to_decimal(total_on_duty_hours),
            "total_miles_driving_today": total_miles_driving_today,
            "total_miles_today": total_miles_today,
            "total_on_duty_hours_last_7_days": on_duty_last_7_days,
            "total_on_duty_hours_last_8_days": on_duty_last_8_days,
            "total_on_duty_hours_last_6_days": on_duty_last_6_days,
            "total_on_duty_hours_last_7_days_60": on_duty_last_7_days_60,
            "available_hours_tomorrow": available_hours_tomorrow,
            "gps_location": gps_location
    
        }
    )
def get_road_distance(start_gps, end_gps):
    """Calculate real-world road distance using OSRM API"""
    if not start_gps or not end_gps:
        return 0

    coords = f"{start_gps['longitude']},{start_gps['latitude']};{end_gps['longitude']},{end_gps['latitude']}"
    url = f"http://router.project-osrm.org/route/v1/driving/{coords}?overview=false"

    logger.info(f"Log  entries: {coords}")
    response = requests.get(url)
    data = response.json()

    if "routes" in data and data["routes"]:
        return data["routes"][0]["distance"] / 1609.34  # Convert meters to miles
    return 0

@api_view(["POST"])
def update_log_entry(request):
    log_id = request.data.get("logId")
    new_status = request.data.get("status")
    timestamp = request.data.get("timestamp")
    gps = request.data.get("gps")

    try:
        log = TripLog.objects.get(id=log_id)
    except TripLog.DoesNotExist:
        return Response({"error": "TripLog not found"}, status=404)

    try:
        # Ensure timestamp is a string before converting
        if isinstance(timestamp, int):  # If it's an integer (UNIX timestamp)
            timestamp = datetime.utcfromtimestamp(timestamp / 1000)  # Convert ms to seconds

        elif isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)  # Convert ISO string to datetime

    except ValueError:
        return Response({"error": "Invalid timestamp format"}, status=400)

    log_entries = LogEntry.objects.filter(log=log)
    last_entry = log_entries.last()

    if last_entry:
        if last_entry.status == new_status:
            # Status unchanged → Update GPS and mileage
            distance = get_road_distance(last_entry.end_gps, gps)
            last_entry.mileage += distance
            last_entry.end_gps = gps
            last_entry.save()
        else:
            # Status changed → Close previous entry
            last_entry.end_time = timestamp
            last_entry.end_gps = gps
            last_entry.save()

            # Start a new log entry
            LogEntry.objects.create(
                log=log,
                status=new_status,
                start_time=timestamp,
                start_gps=gps,
                mileage=0.0
            )
    else:
        # First log entry
        LogEntry.objects.create(
            log=log,
            status=new_status,
            start_time=timestamp,
            start_gps=gps,
            mileage=0.0
        )
    update_trip_log(log_id)
    return Response({"message": "Log entry updated successfully!"}, status=200)

@api_view(["POST"])
def log_end(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            log_id = data.get("log")
            new_remarks = data.get("remarks")

            # Update the Trip model
            updated_rows = TripLog.objects.filter(id=log_id).update(remarks=new_remarks)

            if updated_rows == 0:
                return JsonResponse({"error": "Log not found"}, status=404)

            return JsonResponse({"message": "Log remarks updated successfully"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)

@api_view(["POST"])
def trip_end(request, trip_id):
    if request.method == "POST":
    
        # Update the Trip model
        updated_rows = Trip.objects.filter(id=trip_id).update(status="completed")

        if updated_rows == 0:
            return JsonResponse({"error": "Trip not found"}, status=404)

        return JsonResponse({"message": "Trip ended successfully"}, status=200)

    return JsonResponse({"error": "Invalid request method"}, status=405)

def timedelta_to_decimal(td):
    """Converts timedelta to total hours as Decimal (5,2 format)"""
    total_seconds = td.total_seconds()  # Convert timedelta to seconds
    total_hours = total_seconds / 3600  # Convert seconds to hours
    return Decimal(total_hours).quantize(Decimal("0.00"), rounding=ROUND_DOWN)

