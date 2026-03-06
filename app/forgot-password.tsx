import React from "react";
import ForgotPasswordScreen from "../screens/login/ForgotPasswordScreen";
import { Stack } from "expo-router";

export default function ForgotPasswordPage() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ForgotPasswordScreen />
        </>
    );
}
