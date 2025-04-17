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
} from "react-native";

const LoginScreen = () => {
  const { loading, require2FA, login: authLogin, verify2FA } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const pushToken = usePushToken();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Please enter both username and password");
      return;
    }

    if (!pushToken) {
      Alert.alert(
        "Push token not ready yet. Please wait a few seconds and try again."
      );
      return;
    }

    await authLogin({ username, password, pushToken });
  };

  const handleVerify2FA = async () => {
    await verify2FA(otp);
  };

  const isLoginDisabled = !username || !password || !pushToken;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {pushToken === null && (
        <Text style={{ color: "gray", marginBottom: 10 }}>
          Preparing device for notifications...
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, { opacity: isLoginDisabled ? 0.5 : 1 }]}
        onPress={handleLogin}
        disabled={isLoginDisabled}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
