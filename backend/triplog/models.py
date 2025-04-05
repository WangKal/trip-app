from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone



class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username field is required")
        if not email:
            raise ValueError("The Email field is required")

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)  # Hash the password here
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(username, email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Add the password field here
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return self.username


class Trip(models.Model):
    driver_id = models.CharField(max_length=100)
    date = models.DateField(auto_now_add=True)
    from_location = models.CharField(max_length=255)
    to_location = models.CharField(max_length=255)
    total_miles_today = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_mileage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    carrier_name = models.CharField(max_length=255)
    main_office_address = models.TextField()
    truck_number = models.CharField(max_length=50)
    home_terminal_address = models.TextField()
    cycle_type = models.CharField(
    max_length=10,
    choices=[("70/8", "70 Hours / 8 Days"), ("60/7", "60 Hours / 7 Days")],
    default="70/8",
    )

    # Shipping Info
    document_number = models.CharField(max_length=50, blank=True, null=True)
    shipper = models.CharField(max_length=255, blank=True, null=True)
    commodity = models.CharField(max_length=255, blank=True, null=True)

    status = models.CharField(
        max_length=10,
        choices=[('ongoing', 'Ongoing'), ('completed', 'Completed')],
        default='ongoing'
    )
    is_completed = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"Trip from {self.from_location} to {self.to_location}"




class TripLog(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="logs")
    log_date = models.DateField()

    # Total Hours per Status
    total_off_duty_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_sleeper_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_driving_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_on_duty_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Compliance Tracking
    total_on_duty_hours_last_6_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_on_duty_hours_last_7_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_on_duty_hours_last_8_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_on_duty_hours_last_7_days_60 = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    available_hours_tomorrow = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Distance Tracking
    total_miles_driving_today = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_miles_today = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)


    remarks = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip Log {self.id} - Trip {self.trip.id} on {self.log_date}"

class LogEntry(models.Model):
    STATUS_CHOICES = [
        ("off_duty", "Off Duty"),
        ("sleeper", "Sleeper Berth"),
        ("driving", "Driving"),
        ("on_duty", "On Duty, Not Driving"),
    ]

    log = models.ForeignKey(TripLog, on_delete=models.CASCADE, related_name="log_entries")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    start_time = models.DateTimeField(null=True, blank=True, default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    start_gps = models.JSONField(default=dict)  # {"lat": ..., "lon": ...}
    end_gps = models.JSONField(default=dict, null=True, blank=True)
    mileage = models.FloatField(default=0.0)  # Miles driven in this log entry
    remarks = models.TextField(blank=True, null=True)
    automated = models.BooleanField(default=True)  # Distinguish automated vs manual

    def __str__(self):
        return f"{self.status} - {self.start_time}"


class TripCompletion(models.Model):
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name="recap")

    total_on_duty_last_period = models.FloatField(default=0.0)  # Last 7 or 8 days
    available_hours_tomorrow = models.FloatField(default=0.0)

    reset_applied = models.BooleanField(default=False)  # 34-hour reset
    consecutive_hours_off = models.FloatField(default=0.0)  # Hours off if reset

    def __str__(self):
        return f"Recap for Trip {self.trip.id}"
