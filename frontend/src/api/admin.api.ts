import { apiClient } from "@/lib/axios";
import type { POI } from "@/types/poi";

export interface OwnerDTO {
  id: number;
  email: string;
  name: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  userRole: string;
  action: string;
  entityName: string;
  entityId: number;
  details: string;
  createdAt: string;
}

export interface AdminStats {
  totalOwners: number;
  totalPois: number;
  totalScans: number;
  totalAudioGenerated: number;
}

export const adminApi = {
  getDashboardStats: async (): Promise<AdminStats> => {
    // Mock for now, you will need to add this to your C# backend if missing
    const { data } = await apiClient.get("/admin/dashboard");
    return data;
  },

  getOwners: async (): Promise<OwnerDTO[]> => {
    const { data } = await apiClient.get("/admin/owners");
    return data;
  },

  approveOwner: async (id: number, isApproved: boolean): Promise<void> => {
    await apiClient.put(`/admin/owners/${id}/approve`, { isApproved });
  },

  getPois: async (): Promise<POI[]> => {
    const { data } = await apiClient.get("/admin/pois");
    return data;
  },

  updatePoiStatus: async (id: number, status: "Approved" | "Rejected"): Promise<void> => {
    await apiClient.put(`/admin/pois/${id}/status`, { status });
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const { data } = await apiClient.get("/admin/audit-logs");
    return data;
  },
  
  regenerateAudio: async (poiId: number): Promise<void> => {
    await apiClient.post(`/admin/pois/${poiId}/audio/regenerate`);
  }
};

