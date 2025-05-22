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
import { Ionicons } from "@expo/vector-icons"; // For the eye icon

const LoginScreen = () => {
  const { loading, require2FA, login: authLogin, verify2FA } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const device_token = usePushToken();
   console.log("Device Token", device_token)

  const validateInputs = () => {
    let isValid = true;

    if (!username) {
      setUsernameError("Username is required");
      isValid = false;
    } else {
      setUsernameError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    if (!device_token) {
      setUsernameError("");
      setPasswordError("Push token not ready yet. Please try again later.");
      return;
    }

    await authLogin({ username, password, device_token });
  };

  const isLoginDisabled = !username || !password || !device_token;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo.png")} // Replace with your logo path
          style={styles.logo}
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>Login</Text>

      {/* Username Input */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      {usernameError ? (
        <Text style={styles.errorText}>{usernameError}</Text>
      ) : null}

      {/* Password Input */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setIsPasswordVisible((prev) => !prev)}
          style={styles.eyeIcon}>
          <Ionicons
            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={24}
            color="#aaa"
          />
        </TouchableOpacity>
      </View>
      {passwordError ? (
        <Text style={styles.errorText}>{passwordError}</Text>
      ) : null}

      {/* Device Token Message */}
      {device_token === null && (
        <Text style={{ color: "gray", marginBottom: 10 }}>
          Preparing device for notifications...
        </Text>
      )}

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, { opacity: isLoginDisabled ? 0.5 : 1 }]}
        onPress={handleLogin}
        disabled={isLoginDisabled}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
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
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 150, // Adjust the width of the logo
    height: 150, // Adjust the height of the logo
    resizeMode: "contain",
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
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    height: 48,
  },
  eyeIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
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