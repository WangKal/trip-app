import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";

// Fetch all trips
const fetchTrips = async () => {
  const response = await fetch("/api/trips");
  return response.json();
};

// Fetch a single trip by ID
const fetchTripById = async (id) => {
  const response = await fetch(`/api/trips/${id}`);
  return response.json();
};

// Create a new trip
const createTrip = async (trip) => {
  const res = await apiRequest("POST", "/api/trips/", trip);
      const data = await res.json();
  
  return data;
};

// Update a trip
const updateTrip = async ({ id, trip }) => {
  const response = await fetch(`/api/trips/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });
  return response.json();
};

// Delete a trip
const deleteTrip = async (id) => {
  await fetch(`/api/trips/${id}`, { method: "DELETE" });
};

// Fetch all logs
const fetchLogs = async () => {
  const response = apiRequest("GET", `/api/trip/logs/${id}`);
  return response.json();
};
// Fetch a single log by ID
const fetchLogById = async (id) => {
  const response = await apiRequest("GET", `/api/logs/${id}`);
  return response.json();
};

// Create a new log
const createLog = async (logs) => {
  const res = await apiRequest("POST", "/api/logs/", logs);
      const data = await res.json();
  
  return data;
};

// Update a log
const updateLog = async ({ id, logs }) => {
  const response = await fetch(`/api/logs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logs),
  });
  return response.json();
};

// Delete a log
const deleteLog = async (id) => {
  await apiRequest("DELETE", `/api/logs/${id}/`);
};

// Fetch all log entries
const fetchLogEntry = async () => {
  const response = await fetch(`/api/logs/log-entry/${id}`);
  return response.json();
};
// Fetch a single log entry by ID
const fetchLogEntryById = async (id) => {
  const response = await fetch(`/api/log-entry/${id}`);
  return response.json();
};
// Create a new log entry

const createLogEntry = async (logs) => {
  const res = await apiRequest("POST", "/api/log-entries/", logs);
      const data = await res.json();
  
  return data;
};

// Update a log entry
const updateLogEntry = async ({ id, logs }) => {
  const response = await fetch(`/api/log-entry/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logs),
  });
  return response.json();
};

// Delete a log entry
const deleteLogEntry = async (id) => {
  await fetch(`/api/log-entry/${id}`, { method: "DELETE" });
};
// End trip
const tripEnd = async (trip) => {
  const res = await apiRequest("POST", `/api/trip-completions/${trip}`);
      const data = await res.json();
  
  return data;
};
// End trip
const logEnd = async (logs) => {


  const res = await apiRequest("POST", "/api/logs/log-end", logs   
  );
      const data = await res.json();
  
  return data;
};
// Custom Hook
export const useTrips = () => {
  
  // Read: Get all trips
  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });

  // Create: Add a new trip
  const createMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: () => queryClient.invalidateQueries(["trips"]),
  });

  // Update: Modify existing trip
  const updateMutation = useMutation({
    mutationFn: updateTrip,
    onSuccess: () => queryClient.invalidateQueries(["trips"]),
  });

  // Delete: Remove a trip
  const deleteMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => queryClient.invalidateQueries(["trips"]),
  });

// Read: Get all logs
  const { data: logs, isLogLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: fetchLogs,
  });

// Create: Add a new Log
  const createLogMutation = useMutation({
    mutationFn: createLog,
    onSuccess: () => queryClient.invalidateQueries(["logs"]),
  });

  // Update: Modify existing log
  const updateLogMutation = useMutation({
    mutationFn: updateLog,
    onSuccess: () => queryClient.invalidateQueries(["logs"]),
  });

  // Delete: Remove a log
  const deleteLogMutation = useMutation({
    mutationFn: deleteLog,
    onSuccess: () => queryClient.invalidateQueries(["logs"]),
  });
// Read: Get all log Entry
  const { data: log_entry, isLogEntryLoading } = useQuery({
    queryKey: ["logentries"],
    queryFn: fetchLogEntry,
  });

// Create: Add a new Log entry
  const createLogEntryMutation = useMutation({
    mutationFn: createLogEntry,
    onSuccess: () => queryClient.invalidateQueries(["logentries"]),
  });

  // Update: Modify existing log entry
  const updateLogEntryMutation = useMutation({
    mutationFn: updateLogEntry,
    onSuccess: () => queryClient.invalidateQueries(["logentries"]),
  });

  // Delete: Remove a log entry
  const deleteLogEntryMutation = useMutation({
    mutationFn: deleteLogEntry,
    onSuccess: () => queryClient.invalidateQueries(["logentries"]),
  });
  // Trip Completion: End a trip
  const tripEndMutation = useMutation({
    mutationFn: tripEnd,
    onSuccess: () => queryClient.invalidateQueries(["trip"]),
  });
  // Trip Completion: End a trip
  const logEndMutation = useMutation({
    mutationFn: logEnd,
    onSuccess: () => queryClient.invalidateQueries(["logs"]),
  });

  return {
    trips,
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    fetchTripById,
    tripEndMutation,
    logs,
    isLogLoading,
    createLogMutation,
    updateLogMutation,
    deleteLogMutation,
    fetchLogById,
    log_entry,
    isLogEntryLoading,
    createLogEntryMutation,
    updateLogEntryMutation,
    deleteLogEntryMutation,
    fetchLogEntryById,
    logEndMutation
  };
};
