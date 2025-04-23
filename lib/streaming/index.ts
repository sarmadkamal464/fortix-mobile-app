import { useCallback } from "react";
import { useToast } from "@/lib/utils/toast";
import axiosInstance from "../utils/axios";

const useFetchStreams = (setState: any) => {
  const { successToast, errorToast } = useToast();

  return useCallback(async (page = 1, limit = 10) => {
    setState((prev: any) => ({ ...prev, loading: true }));

    try {
      const response = await axiosInstance.get(
        `/streaming?page=${page}&limit=${limit}`
      );

      setState({
        streams: response.data?.data?.streams || [],
        pagination: response.data?.data?.pagination || {},
        loading: false,
        error: null,
      });

      // Optional: Show a success toast
      // successToast("Streams loaded successfully");
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
