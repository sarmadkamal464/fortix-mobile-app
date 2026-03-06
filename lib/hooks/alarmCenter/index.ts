import { useState, useCallback } from "react";
import {
  Alarm,
  AlarmState,
  AlarmFilters,
  AlarmStatistics,
  AlarmReportingData,
  ReportResponse,
  RequestData,
} from "@/lib/types/alarm";
import axiosInstance from "@/lib/utils/axios";
import fastApiInstance from "@/lib/utils/fastApiInstance";
import { useToast } from "@/lib/utils/toast";

export const useAlarmManagement = () => {
  const [state, setState] = useState<AlarmState>({
    alarms: [],
    loading: false,
    error: null,
    filterOptions: {
      sites: [],
      businessUseCases: [],
      cameras: [],
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    selectedAlarms: [],
  });

  const { successToast, errorToast } = useToast();

  // Fetch alarms with filtering and pagination (Currently Used)
  const fetchAlarms = useCallback(
    async (filters: AlarmFilters = {}, page = 1, limit = 10) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const queryParams = new URLSearchParams();

        // Add pagination
        queryParams.append("page", page.toString());
        queryParams.append("limit", limit.toString());

        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString());
          }
        });

        const response = await axiosInstance.get(
          `/alarms?${queryParams.toString()}`,
        );

        const {
          data: alarms,
          total,
          page: responsePage,
          limit: responseLimit,
        } = response.data.data;

        setState({
          alarms,
          pagination: {
            page: responsePage,
            limit: responseLimit,
            total,
            totalPages: Math.ceil(total / responseLimit),
          },
          filterOptions: {
            sites: [...response.data.data.filters?.sites || []],
            businessUseCases: [...response.data.data.filters?.businessUseCases || []],
            cameras: [...response.data.data.filters?.cameras || []],
          },
          loading: false,
          error: null,
          selectedAlarms: [],
        });
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error?.response?.data?.message || "Failed to fetch alarms",
        }));
        errorToast(error?.response?.data?.message || "Failed to fetch alarms");
      }
    },
    [errorToast],
  );

  // Delete multiple alarms (Currently Used)
  const deleteSelectedAlarms = useCallback(
    async (currentFilters?: AlarmFilters): Promise<boolean> => {
      if (state.selectedAlarms.length === 0) {
        errorToast("No alarms selected");
        return false;
      }

      setState((prev) => ({ ...prev, loading: true }));
      try {
        // Delete alarms one by one (since bulk delete is not implemented in backend)
        const deletePromises = state.selectedAlarms.map((id) =>
          axiosInstance.delete(`/alarms/${id}`),
        );

        await Promise.all(deletePromises);
        setState((prev) => ({ ...prev, loading: false, selectedAlarms: [] }));
        successToast(
          `${state.selectedAlarms.length} alarms deleted successfully`,
        );
        await fetchAlarms(
          currentFilters || {},
          state.pagination.page,
          state.pagination.limit,
        ); // Refresh current page with current filters
        return true;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error?.response?.data?.message ||
            "Failed to delete selected alarms",
        }));
        errorToast(
          error?.response?.data?.message || "Failed to delete selected alarms",
        );
        return false;
      }
    },
    [
      state.selectedAlarms,
      successToast,
      errorToast,
      fetchAlarms,
      state.pagination.page,
      state.pagination.limit,
    ],
  );

  // Selection management (Currently Used)
  const toggleAlarmSelection = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      selectedAlarms: prev.selectedAlarms.includes(id)
        ? prev.selectedAlarms.filter((alarmId) => alarmId !== id)
        : [...prev.selectedAlarms, id],
    }));
  }, []);

  // Clear selection (Currently Used)
  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedAlarms: [] }));
  }, []);

  // Toggle selection of all alarms (Currently Used)
  const toggleAllAlarmsSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedAlarms:
        prev.selectedAlarms.length === prev.alarms.length
          ? []
          : prev.alarms.map((alarm) => alarm.id),
    }));
  }, []);

  // Fetch alarms for active streams only (Currently Not Used)
  const fetchActiveStreamAlarms = useCallback(
    async (userId: number) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const response = await axiosInstance.get(
          `/alarms/active-streams/${userId}`,
        );
        setState((prev) => ({
          ...prev,
          alarms: response.data.data,
          loading: false,
          error: null,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error?.response?.data?.message ||
            "Failed to fetch active stream alarms",
        }));
        errorToast(
          error?.response?.data?.message ||
            "Failed to fetch active stream alarms",
        );
      }
    },
    [errorToast],
  );

  // Get alarm by ID (Currently Not Used)
  const getAlarmById = useCallback(
    async (id: number): Promise<Alarm | null> => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const response = await axiosInstance.get(`/alarms/${id}`);
        setState((prev) => ({ ...prev, loading: false }));
        return response.data.data;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error?.response?.data?.message || "Failed to fetch alarm",
        }));
        errorToast(error?.response?.data?.message || "Failed to fetch alarm");
        return null;
      }
    },
    [errorToast],
  );

  // Get alarm statistics (Currently Not Used)
  const getAlarmStatistics = useCallback(
    async (
      userId?: number,
      startDate?: string,
      endDate?: string,
    ): Promise<AlarmStatistics | null> => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const queryParams = new URLSearchParams();
        if (userId) queryParams.append("user_id", userId.toString());
        if (startDate) queryParams.append("start_date", startDate);
        if (endDate) queryParams.append("end_date", endDate);

        const response = await axiosInstance.get(
          `/alarms/statistics?${queryParams.toString()}`,
        );
        setState((prev) => ({ ...prev, loading: false }));
        return response.data.data;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error?.response?.data?.message ||
            "Failed to fetch alarm statistics",
        }));
        errorToast(
          error?.response?.data?.message || "Failed to fetch alarm statistics",
        );
        return null;
      }
    },
    [errorToast],
  );

  const loadAlarmReportingData = useCallback(async (alarmId: number) => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: AlarmReportingData;
      }>(`/alarms/${alarmId}/reporting`);
      return response?.data?.data?.data;
    } catch (error: any) {
      errorToast(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load chat history",
      );
      return null;
    }
  }, []);

  const generateVideoReporting = useCallback(
    async (requestData: RequestData) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fastApiInstance.post<ReportResponse>(
          "/alarm_analyze-video",
          requestData,
        );
        setState((prev) => ({ ...prev, loading: false }));
        return response?.data;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error?.response?.data?.detail ||
            error?.message ||
            "Failed to generate analysis",
        }));
        errorToast(
          error?.response?.data?.detail || "Failed to generate analysis",
        );
        return null;
      }
    },
    [],
  );

  const fetchAlarmById = async (id: string) => {
    try {
      setState({ ...state, loading: true, error: null });
      const response = await axiosInstance.get(`/alarms/${id}`);
      return response.data.data.data;
    } catch (err) {
      setState({
        ...state,
        loading: false,
        error: "Failed to fetch alarm details.",
      });
      return null;
    } finally {
      setState({ ...state, loading: false });
    }
  };

  return {
    ...state,
    fetchAlarms,
    fetchActiveStreamAlarms,
    getAlarmById,
    deleteSelectedAlarms,
    getAlarmStatistics,
    toggleAlarmSelection,
    toggleAllAlarmsSelection,
    clearSelection,
    loadAlarmReportingData,
    generateVideoReporting,
    fetchAlarmById,
  };
};
