import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated, // Import Animated
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import url from "../data/url";
import axios from "axios";

const { height: screenHeight } = Dimensions.get("window");

const ForgotPassword = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const contentPaddingTopAnim = useRef(new Animated.Value(40)).current; // Start with default padding

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        Animated.timing(contentPaddingTopAnim, {
          toValue: 15, // Padding when keyboard is visible
          duration: 250, // Animation duration
          useNativeDriver: false, // `padding` cannot use native driver
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        Animated.timing(contentPaddingTopAnim, {
          toValue: 40, // Padding when keyboard is hidden
          duration: 250, // Animation duration
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [contentPaddingTopAnim]); // Add contentPaddingTopAnim to dependency array

  const handleContinue = async () => {
    if (mobileNumber.length !== 10) {
      Toast.show({
        type: "error",
        text1: "Invalid Number",
        text2: "Please enter a valid 10-digit mobile number.",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${url}/user/send-otp-reset-password`, {
        phone_number: mobileNumber,
      });

      if (response.status === 200) {
        Toast.show({
          type: "success",
          text1: "OTP Sent",
          text2: "OTP has been sent to your mobile number.",
          position: "bottom",
          visibilityTime: 2000,
        });
        navigation.navigate("Otp", { mobileNumber });
      } else {
        const errorData = response.data || {};
        Toast.show({
          type: "error",
          text1: "Failed",
          text2: errorData.message || "Failed to send OTP. Please try again.",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error(
        "Forgot Password API Error:",
        error?.response?.data || error.message
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error?.response?.data?.message ||
          "An error occurred while sending OTP.",
        position: "bottom",
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false} 
      >
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
            <Text style={styles.titleText}>Reset Password?</Text>
            <Text style={styles.subtitle}>Don’t worry about your account</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                placeholderTextColor="#78909C"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("Register")}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don’t have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                disabled={loading}
              >
                <Text style={styles.signupLink}> Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </ScrollView>
      {globalLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#053B90" />
          <Text style={styles.loadingText}>Sending OTP...</Text>
        </View>
      )}
      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "space-between",
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
    flex: 1,
    backgroundColor: "#C7E3EF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  titleText: {
    fontSize: 20,
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 10,
  },
  inputContainer: {
    width: "100%",
    marginTop: 20,
    marginBottom: 30,
    paddingLeft: 20,
  },
  label: {
    color: "#000000",
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    width: "95%",
    height: 50,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#053B90",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#B3E5FC",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#053B90",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginTop: -5,
    marginBottom: 20,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginBottom: 25,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#053B90",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  signupText: {
    fontSize: 14,
    color: "#000000",
  },
  signupLink: {
    fontSize: 14,
    color: "#053B90",
    fontWeight: "bold",
    marginLeft: 5,
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

export default ForgotPassword;
