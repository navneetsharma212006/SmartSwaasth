// lib/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smart_swaasth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function extractMedicine(imageFile, dosage) {
  const formData = new FormData();
  formData.append("image", imageFile);
  if (dosage) {
    formData.append("dosagePerDay", String(dosage.dosagePerDay));
    formData.append("dosageTimes", JSON.stringify(dosage.dosageTimes));
  }

  const response = await api.post("/extract-medicine", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function listMedicines() {
  const response = await api.get("/medicines");
  return response.data;
}

export async function getMedicine(id) {
  const response = await api.get(`/medicine/${id}`);
  return response.data;
}

export async function createManualMedicine(data) {
  const response = await api.post("/medicines/manual", data);
  return response.data;
}

export async function updateMedicine(id, data) {
  const response = await api.put(`/medicine/${id}`, data);
  return response.data;
}

export async function deleteMedicine(id) {
  const response = await api.delete(`/medicine/${id}`);
  return response.data;
}

export async function checkInteractions(medicineIds) {
  const response = await api.post("/medicines/interactions", { medicineIds });
  return response.data;
}

export async function checkMedicineInteractions(medicineNames) {
  const response = await api.post("/medicine/check-interaction", {
    medicineNames,
  });
  return response.data;
}

export async function fetchNotifications(limit = 50) {
  const response = await api.get("/notifications", { params: { limit } });
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.post("/notifications/read-all");
  return response.data;
}

export async function logAdherence(data) {
  const response = await api.post("/adherence/log", data);
  return response.data;
}

export async function fetchAdherenceHistory(medicineId) {
  const response = await api.get("/adherence/history", { params: { medicineId } });
  return response.data;
}

export async function loginUser(email, password) {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
}

export async function registerUser(userData) {
  const response = await api.post("/auth/register", userData);
  return response.data;
}

// NEW: Connection & Patient Management
export async function generateConnectionOTP() {
  const response = await api.post("/auth/generate-otp");
  return response.data;
}

export async function joinDoctor(otp) {
  const response = await api.post("/auth/join-doctor", { otp });
  return response.data;
}

export async function listConnectedPatients() {
  const response = await api.get("/auth/patients");
  return response.data;
}

export async function getConnectedDoctors() {
  const response = await api.get("/auth/doctors");
  return response.data;
}

export async function getChatHistory(userId) {
  const response = await api.get(`/chat/${userId}`);
  return response.data;
}

export async function listPatientMedicines(patientId) {
  const response = await api.get(`/medicines/patient/${patientId}`);
  return response.data;
}

export async function createPatientManualMedicine(patientId, data) {
  const response = await api.post(`/medicines/patient/${patientId}/manual`, data);
  return response.data;
}

export async function updatePatientMedicine(patientId, medicineId, data) {
  const response = await api.put(`/medicines/patient/${patientId}/${medicineId}`, data);
  return response.data;
}

export async function deletePatientMedicine(patientId, medicineId) {
  const response = await api.delete(`/medicines/patient/${patientId}/${medicineId}`);
  return response.data;
}