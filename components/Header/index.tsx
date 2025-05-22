// filepath: /Users/apple/Documents/fortix-mobile-app/components/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LogoutButton from "@/components/LogoutButton"; // Adjust the import path as necessary

const Header = ({ title }: { title: string }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <LogoutButton />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    // paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  logoutButton: {
    padding: 8,
  },
});

export default Header;
