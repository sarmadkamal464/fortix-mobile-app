import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

import axiosInstance from "@/lib/utils/axios";
import { LoginCredentials, LoginResponse } from "@/lib/types/auth";
import { useToast } from "@/lib/utils/toast"; // Should be compatible with React Native
import { getTokenExpiryInDays } from "@/lib/utils/constants";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string>("");
  const router = useRouter();
  const { successToast, errorToast } = useToast();

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post<LoginResponse>(
        "/admin/login",
        credentials
      );

      const data = response.data.data;

      if (data.require2FA) {
        setRequire2FA(true);
        setTempToken(data.tempToken!);
        successToast(response.data.message);
        return;
      }

      if (data.token) {
        const token = data.token;
        const user = data.user;
        const expiryInDays = getTokenExpiryInDays(token);

        // Save token and user
        await SecureStore.setItemAsync("token", token);
        await SecureStore.setItemAsync("role", user?.role ?? "");
        await AsyncStorage.setItem("user", JSON.stringify(user));

        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;

        successToast(response.data.message);
        router.push("/livemonitoring"); // Same destination as login

        //router.replace("/(tabs)"); // Or '/dashboard' if that's the destination
      }
    } catch (error: any) {
      errorToast(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2FA = useCallback(
    async (otp: string) => {
      setLoading(true);
      try {
        const response = await axiosInstance.post<LoginResponse>(
          "/admin/verify-2fa",
          {
            token: tempToken,
            otp,
          }
        );

        const data = response.data.data;

        if (data.token) {
          const token = data.token;
          const user = data.user;
          const expiryInDays = getTokenExpiryInDays(token);

          await SecureStore.setItemAsync("token", token);
          await SecureStore.setItemAsync("role", user?.role ?? "");
          await AsyncStorage.setItem("user", JSON.stringify(user));

          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

          successToast(response.data.message);
          router.push("/livemonitoring"); // Same destination as login
        }
      } catch (error: any) {
        errorToast(error?.response?.data?.message || "OTP verification failed");
      } finally {
        setLoading(false);
      }
    },
    [tempToken]
  );

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("role");
    await AsyncStorage.removeItem("user");

    delete axiosInstance.defaults.headers.common["Authorization"];

    router.push("/login");
  }, []);

  return {
    loading,
    require2FA,
    login,
    verify2FA,
    logout,
  };
};
