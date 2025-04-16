import React from "react";
import LoginScreen from "../screens/login/LoginScreen";
import { Stack } from "expo-router";

export default function LoginPage() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoginScreen />
    </>
  );
}
