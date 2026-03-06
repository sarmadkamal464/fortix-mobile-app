import { useState, useCallback } from "react";
import axiosInstance from "@/lib/utils/axios";
import { useToast } from "@/lib/utils/toast";
import { useRouter } from "expo-router";

export const useForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [email, setEmail] = useState("");
  const [tempToken, setTempToken] = useState("");
  const router = useRouter();
  const { successToast, errorToast } = useToast();

  const requestPasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/admin/request-forgot/${email}`
      );
      if (response.data.success) {
        successToast(response.data.message);
        setEmail(email);
        setShowOtpForm(true);
      }
    } catch (error: any) {
      errorToast(error?.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (otp: string) => {
      setLoading(true);
      try {
        const response = await axiosInstance.post("/admin/verify-forgot", {
          email,
          otp,
        });
        successToast(response.data.message);
        setTempToken(response.data.data.tempToken);
        setShowResetForm(true);
        setShowOtpForm(false);
      } catch (error: any) {
        errorToast(error?.response?.data?.message || "OTP verification failed");
      } finally {
        setLoading(false);
      }
    },
    [email]
  );

  const resetPassword = useCallback(
    async (newPassword: string) => {
      setLoading(true);
      try {
        const response = await axiosInstance.post("/admin/forgot-password", {
          tempToken,
          newPassword,
        });
        successToast(response.data.message);
        router.push("/login");
      } catch (error: any) {
        errorToast(error?.response?.data?.message || "Password reset failed");
      } finally {
        setLoading(false);
      }
    },
    [tempToken]
  );

  return {
    loading,
    showOtpForm,
    showResetForm,
    email,
    requestPasswordReset,
    verifyOtp,
    resetPassword,
  };
};
