from django.urls import path
from .views import (
    RegisterView, LoginView, UserDetailView, LogoutView,
    TripListCreateView, TripRetrieveUpdateDeleteView,
    LogEntryListCreateView, LogEntryRetrieveUpdateDeleteView, LogEntriesByTripLogView,
    TripCompletionCreateView, TripCompletionRetrieveView,
    TripLogListCreateView, TripLogRetrieveUpdateDeleteView, TripLogByTripView, update_log_entry, trip_end, log_end,
)

urlpatterns = [
    #  Authentication Routes
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', UserDetailView.as_view(), name='user-detail'),
    path('logout/', LogoutView.as_view(), name='logout'),

    #  Trip Routes
    path('trips/', TripListCreateView.as_view(), name='trip-list-create'),
    path('trips/<int:pk>/', TripRetrieveUpdateDeleteView.as_view(), name='trip-detail'),
    
    #  Trip Logs Routes
    path('logs/', TripLogListCreateView.as_view(), name='trip-log-list-create'),
    path('logs/<int:pk>/', TripLogRetrieveUpdateDeleteView.as_view(), name='trip-log-detail'),
    path('trip/logs/<int:tripId>/', TripLogByTripView.as_view(), name='trip-log-by-trips'),
    path("logs/log-end", log_end, name="log-end"),


    #  Log Entries Routes
    path('log-entries/', LogEntryListCreateView.as_view(), name='log-entry-list-create'),
    path('log-entries/<int:pk>/', LogEntryRetrieveUpdateDeleteView.as_view(), name='log-entry-detail'),
    path('logs/log-entries/<int:logId>/', LogEntriesByTripLogView.as_view(), name='log-entries-by-log'),
    path("update-log-entry/", update_log_entry, name="update-log-entry"),


    #  Trip Completion Routes
    #path('trip-completions/', TripCompletionCreateView.as_view(), name='trip-completion-create'),
    path('trip-completion/<int:trip_id>/', trip_end, name="trip_end"),
    #log entry automation
]
