import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import url from "../data/url";
import axios from "axios";
import { NetworkContext } from "../context/NetworkProvider";

const { height: screenHeight } = Dimensions.get("window");

const ConformNewPassword = ({ navigation, route }) => {
  const { mobileNumber, otp } = route.params || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false); // For button loading
  const [globalLoading, setGlobalLoading] = useState(false); // For full-screen overlay
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const contentPaddingTopAnim = useRef(new Animated.Value(50)).current;

  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        Animated.timing(contentPaddingTopAnim, {
          toValue: Platform.OS === "ios" ? 15 : 5, // Keep existing adjustments
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        Animated.timing(contentPaddingTopAnim, {
          toValue: 50, // Reset to initial content padding
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [contentPaddingTopAnim]);

  const handleReset = async () => {
    if (!isConnected || !isInternetReachable) {
      Toast.show({
        type: "error",
        text1: "No Internet Connection",
        text2: "Please check your network and try again.",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all password fields.",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "New password and confirm password do not match.",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }

    if (newPassword.length < 2) {
      Toast.show({
        type: "error",
        text1: "Password Too Short",
        text2: "Password must be at least 2 characters long.",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }

    setLoading(true);
    setGlobalLoading(true);

    try {
      console.log("Sending reset password request with:", {
        mobileNumber,
        otp,
        newPassword,
      });
      const response = await axios.post(`${url}/user/reset-password`, {
        phone_number: mobileNumber,
        otp,
        new_password: newPassword,
      });

      if (response.status === 200) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Password has been reset successfully!",
          position: "bottom",
          visibilityTime: 2000,
        });

        const fetchedUserId = response.data.userId; // Assuming backend returns { userId: '...' }

        navigation.replace("PasswordChanged", {
          userId: fetchedUserId,
          mobileNumber: mobileNumber,
        });
      } else {
        const errorData = response.data || {};
        Toast.show({
          type: "error",
          text1: "Failed",
          text2:
            errorData.message || "Failed to reset password. Please try again.",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error(
        "Reset Password API Error:",
        error?.response?.data,
        "Status:",
        error.response?.status,
        "Message:",
        error.message,
        "Config:",
        error.config
      );

      let errorMessage = "An error occurred while resetting password.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === "Network Error") {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = "Something went wrong. Please try again.";
      }

      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? -100 : 0} // Adjust offset as needed for Android
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={["#053B90", "#053B90"]}
          style={styles.container}
        >
          {!keyboardVisible && (
            <View style={styles.header}>
              <Image
                source={require("../../assets/Group400.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>MyChits</Text>
            </View>
          )}
          <Animated.View style={[styles.content, { paddingTop: 50 }]}>
            <Text style={[styles.inputLabel, { marginTop: 30 }]}>
              New Password
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#78909C"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!newPasswordVisible}
                editable={!loading}
              />
              {newPassword.length > 0 && (
                <TouchableOpacity
                  onPress={() => setNewPasswordVisible(!newPasswordVisible)}
                  style={styles.eyeWrapper}
                  disabled={loading}
                >
                  <Icon
                    name={!newPasswordVisible ? "eye" : "eye-off"}
                    size={20}
                    color="#053B90"
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#78909C"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                editable={!loading}
              />
              {confirmPassword.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                  style={styles.eyeWrapper}
                  disabled={loading}
                >
                  <Icon
                    name={!confirmPasswordVisible ? "eye" : "eye-off"}
                    size={20}
                    color="#053B90"
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { marginTop: 60 },
                (loading || globalLoading) && { opacity: 0.7 },
              ]}
              onPress={handleReset}
              disabled={loading || globalLoading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </ScrollView>

      {globalLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#053B90" />
          <Text style={styles.loadingText}>Resetting Password...</Text>
        </View>
      )}
      <Toast />
    </KeyboardAvoidingView>
  );
};

const inputWidth = "90%";
const inputHeight = 50;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#053B90",
  },
   logo: {
   width: 100,
    height: 100,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
  },
  content: {
    backgroundColor: "#C7E3EF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: "100%",
  marginTop: -20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "flex-start",
    flexGrow: 1,
    paddingBottom: 40,
  },
  inputLabel: {
    color: "#000000",
    fontSize: 14,
    marginBottom: 5,
    alignSelf: "flex-start",
    marginLeft: 20,
      marginTop: -10,
    fontWeight: "bold",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: inputWidth,
    height: inputHeight,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ADD8E6",
    marginBottom: 12,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    height: inputHeight,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#053B90",
  },
  eyeWrapper: {
    padding: 8,
  },
  button: {
    backgroundColor: "#053B90",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#053B90",
  },
});

export default ConformNewPassword;
