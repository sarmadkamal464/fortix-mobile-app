// components/LogoutButton.tsx
import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/hooks/auth";

const LogoutButton = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    logout();
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{ marginRight: 16 }}
      style={{ padding: 8, borderRadius: 6 }}>
      <Ionicons name="log-out-outline" size={20} color="black" />
    </TouchableOpacity>
  );
};

export default LogoutButton;
