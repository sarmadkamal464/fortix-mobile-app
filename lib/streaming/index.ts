import { useCallback } from "react";
import { useToast } from "@/lib/utils/toast";
import axiosInstance from "../utils/axios";
import { RealTimePreviewFiltersQuery } from "@/lib/types/streaming";

const useFetchStreams = (setState: any) => {
  const { successToast, errorToast } = useToast();

  return useCallback(async (filters?: RealTimePreviewFiltersQuery) => {
    setState((prev: any) => ({ ...prev, loading: true }));

    try {
      const params = new URLSearchParams();
      
      if (filters?.page) {
        params.append("page", filters.page.toString());
      }
      if (filters?.limit) {
        params.append("limit", filters.limit.toString());
      }
      if (filters?.business_case_id) {
        params.append("business_case_id", filters.business_case_id.toString());
      }
      if (filters?.site_id) {
        params.append("site_id", filters.site_id.toString());
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }

      const queryString = params.toString();
      const url = `/streaming${queryString ? `?${queryString}` : ""}`;
      
      const response = await axiosInstance.get(url);

      console.log("stream response", response.data);
      setState({
        streams: response.data?.data?.streams || [],
        pagination: response.data?.data?.pagination || {},
        filters: response.data?.data?.filters || { sites: [], businessCases: [] },
        activeStreams: response.data?.data?.activeStreams,
        inactiveStreams: response.data?.data?.inactiveStreams,
        loading: false,
        error: null,
      });
      successToast("Streams loaded successfully");
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to fetch streams";

      setState((prev: any) => ({
        ...prev,
        loading: false,
        error: message,
      }));

      errorToast(message);
    }
  }, []);
};

export default useFetchStreams;
