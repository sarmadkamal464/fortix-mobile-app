// toast/ToastProvider.tsx
import React from "react";
import Toast from "react-native-toast-message";

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Toast />
    </>
  );
};

// toast/useToast.ts
export const useToast = () => {
  const successToast = (message: string) =>
    Toast.show({ type: "success", text1: message });

  const errorToast = (message: string) =>
    Toast.show({ type: "error", text1: message });

  const warningToast = (message: string) =>
    Toast.show({ type: "info", text1: message });

  const infoToast = (message: string) =>
    Toast.show({ type: "info", text1: message });

  return { successToast, errorToast, warningToast, infoToast };
};
