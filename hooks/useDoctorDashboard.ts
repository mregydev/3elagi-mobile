import { useCallback, useState } from "react";
import { fetchMyAppointments } from "@/domains/appointments/api";
import {
  fetchAccountProfile,
  type AccountProfile,
} from "@/domains/auth/profile-api";
import { fetchMyConsultations, type DoctorConsultation } from "@/domains/consultations/api";
import { useChatStore } from "@/domains/chat/store";
import { fetchPointsBalance } from "@/domains/points/api";

export type DoctorDashboardMetrics = {
  appointmentsToday: number;
  pendingConsultations: number;
  openConsultations: number;
  unreadMessages: number;
  reimbursableCredits: number;
};

const EMPTY_METRICS: DoctorDashboardMetrics = {
  appointmentsToday: 0,
  pendingConsultations: 0,
  openConsultations: 0,
  unreadMessages: 0,
  reimbursableCredits: 0,
};

function isToday(date: string): boolean {
  return date === new Date().toISOString().slice(0, 10);
}

function sumUnread(conversations: { unreadCount?: number }[]): number {
  return conversations.reduce((total, c) => total + (c.unreadCount ?? 0), 0);
}

export function useDoctorDashboard(accessToken: string | null, role: string | null) {
  const [metrics, setMetrics] = useState<DoctorDashboardMetrics>(EMPTY_METRICS);
  const [consultations, setConsultations] = useState<DoctorConsultation[]>([]);
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || role?.toLowerCase() !== "doctor") return;
    try {
      const conversations = useChatStore.getState().conversations;
      const [appointments, consultationList, pointsSummary, profile] = await Promise.all([
        fetchMyAppointments(accessToken),
        fetchMyConsultations(accessToken),
        fetchPointsBalance(accessToken),
        fetchAccountProfile(accessToken, role),
      ]);

      const appointmentsToday = appointments.filter(
        (item) => isToday(item.date) && item.status !== "cancelled",
      ).length;
      const pendingConsultations = consultationList.filter((c) => c.status === "pending").length;
      const openConsultations = consultationList.filter((c) => c.status === "open").length;

      setMetrics({
        appointmentsToday,
        pendingConsultations,
        openConsultations,
        unreadMessages: sumUnread(conversations),
        reimbursableCredits: pointsSummary.message_points ?? 0,
      });
      setConsultations(consultationList);
      setAccount(profile);
    } finally {
      setLoading(false);
    }
  }, [accessToken, role]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return {
    metrics,
    consultations,
    account,
    setAccount,
    loading,
    refreshing,
    load,
    refresh,
  };
}
