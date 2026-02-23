import { useAuth } from "@/lib/hooks/auth";
import { usePushToken } from "@/lib/hooks/usePushToken";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import FortixLogo from "@/assets/images/fortix-logo.png"

const LoginScreen = () => {
  const router = useRouter();
  const { loading, require2FA, login: authLogin, verify2FA } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const device_token = usePushToken();
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Please enter both username and password");
      return;
    }

    if (!device_token) {
      Alert.alert(
        "Push token not ready yet. Please wait a few seconds and try again."
      );
      return;
    }

    await authLogin({ username, password, device_token });
  };

  const handleVerify2FA = async () => {
    await verify2FA(otp);
  };

  const isLoginDisabled = !username || !password || !device_token;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={FortixLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <View style={styles.headingBlock}>
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.subtitle}>
              Sign in to monitor your premises.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={18}
                color="#9CA3AF"
                style={styles.leadingIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="name@company.com"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>SECURITY KEY</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#9CA3AF"
                style={styles.leadingIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••••"
                placeholderTextColor="#6B7280"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.trailingIcon}
                onPress={() => setIsPasswordVisible((prev) => !prev)}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {device_token === null && (
            <Text style={styles.deviceInfo}>
              Preparing device for notifications...
            </Text>
          )}

          {/* Helpers row */}
          <View style={styles.helpersRow}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRememberMe((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={14} color="#020617" />
                )}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/forgot-password")}>
              <Text style={styles.forgotPasswordText}>
                FORGOT YOUR PASSWORD?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoginDisabled && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoginDisabled}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>LOG IN</Text>
            <Ionicons name="arrow-forward" size={18} color="#020617" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.loadingText}>Logging you in...</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
  },
  logoImage: {
    width: 180,
    height: 60,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0EA5E9",
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    letterSpacing: 2,
    color: "#F9FAFB",
    fontWeight: "700",
  },
  headingBlock: {
    maxWidth: "90%",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#CBD5F5",
  },
  form: {
    marginTop: 8,
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: "#9CA3AF",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    paddingHorizontal: 14,
    height: 52,
  },
  leadingIcon: {
    marginRight: 10,
  },
  trailingIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    color: "#F9FAFB",
    fontSize: 14,
    paddingVertical: 0,
  },
  deviceInfo: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 12,
  },
  helpersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#4B5563",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  rememberMeText: {
    color: "#E5E7EB",
    fontSize: 13,
  },
  forgotPasswordText: {
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  button: {
    marginTop: 24,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#06B6D4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#020617",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 6,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  spinnerContainer: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
