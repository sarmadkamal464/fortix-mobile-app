import React, { useState, useRef } from "react";
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
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForgotPassword } from "@/lib/hooks/auth/useForgotPassword";
import FortixLogo from "@/assets/images/fortix-logo.png";

const ForgotPasswordScreen = () => {
    const router = useRouter();
    const {
        loading,
        showOtpForm,
        showResetForm,
        requestPasswordReset,
        verifyOtp,
        resetPassword,
    } = useForgotPassword();

    const [email, setEmail] = useState("");
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const otpRefs = useRef<(TextInput | null)[]>([]);

    const handleRequestReset = async () => {
        if (!email) {
            Alert.alert("Please enter your email address");
            return;
        }
        await requestPasswordReset(email);
    };

    const handleVerifyOtp = async () => {
        const otp = otpDigits.join("");
        if (otp.length !== 6) {
            Alert.alert("Please enter the 6-digit OTP");
            return;
        }
        await verifyOtp(otp);
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert("Please fill in all fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Passwords do not match");
            return;
        }
        await resetPassword(newPassword);
        // On success, hook usually handles feedback, but we can navigate back
        // The hook in this impl doesn't navigate, so we might want to do it here
        // But let's assume successToast is enough or wait for user to go back
        Alert.alert("Success", "Your password has been reset successfully.", [
            { text: "OK", onPress: () => router.replace("/login") }
        ]);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otpDigits];
        newOtp[index] = value;
        setOtpDigits(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (index: number, key: string) => {
        if (key === "Backspace" && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
            const newOtp = [...otpDigits];
            newOtp[index - 1] = "";
            setOtpDigits(newOtp);
        }
    };

    const renderEmailStep = () => (
        <View style={styles.form}>
            <View style={styles.headingBlock}>
                <Text style={styles.title}>Confirm Email address</Text>
                <Text style={styles.subtitle}>
                    Enter your registered email address and we’ll send you a link to reset your password.
                </Text>
            </View>

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
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, !email && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={loading || !email}
                activeOpacity={0.9}
            >
                <Text style={styles.buttonText}>{loading ? "SENDING..." : "SEND 2FA CODE"}</Text>
                <Ionicons name="arrow-forward" size={18} color="#020617" />
            </TouchableOpacity>
        </View>
    );

    const renderOtpStep = () => (
        <View style={styles.form}>
            <View style={styles.headingBlock}>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>
                    Enter your 6 digit OTP code in order to reset.
                </Text>
            </View>

            <View style={styles.otpContainer}>
                {otpDigits.map((digit, idx) => (
                    <TextInput
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(idx, value)}
                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(idx, nativeEvent.key)}
                        selectionColor="#06B6D4"
                    />
                ))}
            </View>

            <TouchableOpacity
                style={[styles.button, otpDigits.join("").length !== 6 && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading || otpDigits.join("").length !== 6}
                activeOpacity={0.9}
            >
                <Text style={styles.buttonText}>{loading ? "VERIFYING..." : "VERIFY CODE"}</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color="#020617" />
            </TouchableOpacity>
        </View>
    );

    const renderResetStep = () => (
        <View style={styles.form}>
            <View style={styles.headingBlock}>
                <Text style={styles.title}>Reset Your Password</Text>
                <Text style={styles.subtitle}>
                    Create a new password to secure your account. Make sure it’s something you’ll remember.
                </Text>
            </View>

            <View style={styles.field}>
                <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
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
                        value={newPassword}
                        onChangeText={setNewPassword}
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

            <View style={styles.field}>
                <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
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
                        secureTextEntry={!isConfirmPasswordVisible}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                        style={styles.trailingIcon}
                        onPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
                    >
                        <Ionicons
                            name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                            size={18}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, (!newPassword || newPassword !== confirmPassword) && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading || !newPassword || newPassword !== confirmPassword}
                activeOpacity={0.9}
            >
                <Text style={styles.buttonText}>{loading ? "RESETTING..." : "RESET PASSWORD"}</Text>
                <Ionicons name="refresh-outline" size={18} color="#020617" />
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Image source={FortixLogo} style={styles.logoImage} resizeMode="contain" />
                </View>

                {showResetForm
                    ? renderResetStep()
                    : showOtpForm
                        ? renderOtpStep()
                        : renderEmailStep()}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Remember your password?</Text>
                    <TouchableOpacity onPress={() => router.replace("/login")}>
                        <Text style={styles.loginLink}>Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color="#0EA5E9" />
                        <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#020617",
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 72,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
    },
    logoImage: {
        width: 180,
        height: 60,
    },
    headingBlock: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#fff",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#CBD5F5",
        lineHeight: 20,
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
    button: {
        marginTop: 12,
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
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    otpInput: {
        width: 48,
        height: 52,
        backgroundColor: "rgba(15,23,42,0.95)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1F2937",
        color: "#fff",
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40,
        columnGap: 8,
    },
    footerText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    loginLink: {
        color: "#0EA5E9",
        fontSize: 14,
        fontWeight: "700",
        textDecorationLine: "underline",
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
