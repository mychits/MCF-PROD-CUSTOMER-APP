import React, { useState, useEffect, useRef, useContext } from "react";
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
  Keyboard,
  Alert,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import url from "../data/url";
import { ContextProvider } from "../context/UserProvider";

const { height: screenHeight } = Dimensions.get("window");

const Toast = React.forwardRef(({ duration = 2000 }, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [imageSource, setImageSource] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;

  React.useImperativeHandle(ref, () => ({
    show: (msg, imgSrc) => {
      setMessage(msg);
      setImageSource(imgSrc);
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            setMessage("");
            setImageSource(null);
          });
        }, duration);
      });
    },
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { opacity }]}>
      <View style={styles.toastContent}>
        {imageSource && (
          <Image source={imageSource} style={styles.toastImage} />
        )}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

const RegisterOtpVerify = ({ route }) => {
  const navigation = useNavigation();
  const toastRef = useRef();
  const [appUser, setAppUser] = useContext(ContextProvider);

  const { mobileNumber, fullName, password } = route.params;

  // Change 1: Initialize otp state for 4 digits
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(59);
  const [timerActive, setTimerActive] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const bottomSectionPaddingTopAnim = useRef(new Animated.Value(50)).current;

  // Change 2: Create refs for 4 input fields
  const inputRefs = Array(4).fill(0).map((_, i) => useRef(null));

  useEffect(() => {
    let interval = null;
    if (timerActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, seconds]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        Animated.timing(bottomSectionPaddingTopAnim, {
          toValue: Platform.OS === "ios" ? 15 : 5,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        Animated.timing(bottomSectionPaddingTopAnim, {
          toValue: 50,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [bottomSectionPaddingTopAnim]);

  const showAppToast = (message) => {
    if (toastRef.current) {
      toastRef.current.show(message, require("../../assets/Group400.png"));
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (text && index < otp.length - 1) {
      inputRefs[index + 1].current.focus();
    }
    if (index === otp.length - 1 && text !== "") {
        Keyboard.dismiss();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }, index) => {
    if (key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputRefs[index - 1].current.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");
    // Change 3: Validate for 4-digit OTP
    if (fullOtp.length !== 4) {
      showAppToast("Please enter the complete OTP.");
      return;
    }

    setLoading(true);

    try {
      const otpVerificationPayload = {
        phone_number: mobileNumber,
        otp: fullOtp,
      };
      // Endpoint updated as per previous turn's request
      const verifyApiEndpoint = `${url}/user/verify-register-otp`; //
      console.log("Attempting to verify OTP to:", verifyApiEndpoint);
      console.log("Verifying OTP payload:", otpVerificationPayload);

      const response = await fetch(verifyApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otpVerificationPayload),
      });

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log("OTP verification success response:", data);
        showAppToast(data.message || "OTP Verified Successfully!");
        const registrationPayload = {
          full_name: fullName,
          phone_number: mobileNumber,
          password: password,
          track_source: "mobile",
        };
        const signupApiEndpoint = `${url}/user/signup-user`; //
        console.log("Attempting to sign up user to:", signupApiEndpoint);
        console.log("Registering user payload:", registrationPayload);

        const registerResponse = await fetch(signupApiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registrationPayload),
        });

        const registerContentType = registerResponse.headers.get("content-type");
        if (registerResponse.ok && registerContentType && registerContentType.includes("application/json")) {
          const registerData = await registerResponse.json();
          showAppToast("Registration Successful!");
          setTimeout(() => {
            setAppUser((prev) => ({ ...prev, userId: registerData.user?._id }));
            navigation.navigate("BottomTab", { userId: registerData.user?._id });
          }, 2000);
        } else {
          let registerErrorMessage = "Registration failed. Please try again.";
          if (registerContentType && registerContentType.includes("application/json")) {
            const errorData = await registerResponse.json();
            registerErrorMessage = errorData.message || registerErrorMessage;
            console.error("Registration error (JSON response):", errorData);
          } else {
            const errorText = await registerResponse.text();
            console.error("Registration error (non-JSON response):", registerResponse.status, errorText);
            registerErrorMessage = `Server Error (${registerResponse.status}) during registration: ${errorText.substring(0, 100)}...`;
          }
          showAppToast(registerErrorMessage);
        }
      } else {
        let errorMessage = "OTP verification failed. Please try again.";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("OTP verification error (JSON response):", errorData);
        } else {
          const errorText = await response.text();
          console.error("OTP verification error (non-JSON response):", response.status, errorText);
          errorMessage = `Server Error (${response.status}): ${errorText.substring(0, 100)}... Please check your backend route.`;
        }
        showAppToast(errorMessage);
      }
    } catch (error) {
      console.error("Network or unexpected error during OTP verification/registration:", error);
      showAppToast("An unexpected error occurred. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!timerActive) {
      setLoading(true);
      try {
        const resendPayload = {
          phone_number: mobileNumber,
          full_name: fullName,
        };
        const resendApiEndpoint = `${url}/user/send-register-otp`; //
        console.log("Attempting to resend OTP to:", resendApiEndpoint);
        console.log("Resending OTP payload:", resendPayload);

        const response = await fetch(resendApiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resendPayload),
        });

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          console.log("OTP resend success response:", data);
          showAppToast(data.message || "New OTP sent successfully!");
          setSeconds(59);
          setTimerActive(true);
          // Change 5: Reset OTP state for 4 digits upon resend
          setOtp(["", "", "", ""]);
          inputRefs[0].current.focus();
        } else {
          let errorMessage = "Failed to resend OTP. Please try again.";
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            console.error("OTP resend error (JSON response):", errorData);
          } else {
            const errorText = await response.text();
            console.error("OTP resend error (non-JSON response):", response.status, errorText);
            errorMessage = `Server Error (${response.status}): ${errorText.substring(0, 100)}... Please check your backend route.`;
          }
          showAppToast(errorMessage);
        }
      } catch (error) {
        console.error("Network or unexpected error resending OTP:", error);
        showAppToast("An unexpected error occurred while resending OTP. Please check your network and try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? -screenHeight * 0.15 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {!keyboardVisible && (
            <View style={styles.topSection}>
              <Image
                source={require("../../assets/Group400.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>MyChits</Text>
            </View>
          )}
          <Animated.View
            style={[
              styles.bottomSection,
              { paddingTop: bottomSectionPaddingTopAnim },
            ]}
          >
            <Text style={styles.enterOtpText}>Enter OTP</Text>
            {/* Change 4: Update instruction text */}
            <Text style={styles.instructionText}>
              A 4 digit code has been sent to your number {mobileNumber}
            </Text>

            <View style={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  ref={inputRefs[index]}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            <Text style={styles.timerText}>
              00:{seconds < 10 ? "0" : ""}
              {seconds}
            </Text>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A237E" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOtp}
              disabled={timerActive || loading}
            >
              <Text
                style={[
                  styles.resendButtonText,
                  { color: (timerActive || loading) ? "#B0BEC5" : "#053B90" },
                ]}
              >
                Didn't get it?{" "}
                <Text style={{ fontWeight: "bold" }}>Send Again</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.footerTextContainer}>
              <Text style={styles.footerText}>
                Don’t have an account?{" "}
                <Text
                  style={styles.signUpText}
                  onPress={() => navigation.navigate("Register")}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
      <Toast ref={toastRef} />
    </KeyboardAvoidingView>
  );
};

const inputWidthPercentage = "90%";

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#053B90",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#053B90",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 20,
    paddingBottom: 10,
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
  bottomSection: {
    flex: 1.4,
    backgroundColor: "#C7E3EF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  enterOtpText: {
    fontSize: 20,
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: "#455A64",
    textAlign: "center",
    marginBottom: 20,
  },
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: inputWidthPercentage,
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 50,
    backgroundColor: "#fff",
    borderColor: "#3b82f6",
    borderWidth: 2,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    color: "#053B90",
    marginHorizontal: 2,
  },
  timerText: {
    fontSize: 16,
    color: "#053B90",
    marginBottom: 40,
  },
  verifyButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginBottom: 25,
    justifyContent: "center",
  },
  verifyButtonText: {
    color: "#1A237E",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  resendButton: {
    marginTop: 10,
  },
  resendButtonText: {
    fontSize: 14,
  },
  footerTextContainer: {
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: "#455A64",
  },
  signUpText: {
    color: "#00000",
    fontWeight: "bold",
  },
  toastContainer: {
    position: "absolute",
    top: 40,
    left: "5%",
    right: "5%",
    backgroundColor: "rgba(238, 243, 247, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    zIndex: 9999,
    alignItems: "center",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: "#053B90",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },
  toastImage: {
    width: 30,
    height: 30,
  },
});

export default RegisterOtpVerify;