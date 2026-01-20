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

  const { mobileNumber, fullName, password, referralCode } = route.params;

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(59);
  const [timerActive, setTimerActive] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const bottomSectionPaddingTopAnim = useRef(new Animated.Value(50)).current;
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
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
      Animated.timing(bottomSectionPaddingTopAnim, {
        toValue: Platform.OS === "ios" ? 15 : 5,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      Animated.timing(bottomSectionPaddingTopAnim, {
        toValue: 50,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

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

  const fetchUserDetailsAndNavigate = async (userId) => {
    try {
      const userDetailUrl = `${url}/user/get-user-by-id/${userId}`; 
      const response = await fetch(userDetailUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        const approvalStatus = data.approval_status; 

        setTimeout(() => {
          if (approvalStatus === 'false') {
            navigation.replace("Dashboard", { userId });
          } else {
            navigation.replace("BottomTab", { userId });
          }
        }, 2000);
      } else {
        showAppToast("Registration successful! Redirecting...");
        setTimeout(() => navigation.replace("BottomTab", { userId }), 2000);
      }
    } catch (error) {
      console.error(error);
      setTimeout(() => navigation.replace("BottomTab", { userId }), 2000);
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");
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
      
      const verifyResponse = await fetch(`${url}/user/verify-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otpVerificationPayload),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.success) {
        showAppToast("OTP Verified Successfully!");

        // ONLY NOW: Call signup-user to actually create the account
        const registrationPayload = {
          full_name: fullName,
          phone_number: mobileNumber,
          password: password,
          track_source: "mobile",
          ...(referralCode && { referral_code: referralCode }),
        };

        const registerResponse = await fetch(`${url}/user/signup-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registrationPayload),
        });

        const registerData = await registerResponse.json();

        if (registerResponse.ok) {
          showAppToast("Registration Successful!");
          const registeredUserId = registerData.user?._id;
          setAppUser((prev) => ({ ...prev, userId: registeredUserId }));
          await fetchUserDetailsAndNavigate(registeredUserId);
        } else {
          showAppToast(registerData.message || "Registration failed.");
          setLoading(false);
        }
      } else {
        showAppToast(verifyData.message || "Incorrect OTP.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showAppToast("Unexpected error. Please try again.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!timerActive) {
      setLoading(true);
      try {
        const resendPayload = { phone_number: mobileNumber, full_name: fullName };
        const response = await fetch(`${url}/user/send-register-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resendPayload),
        });

        if (response.ok) {
          showAppToast("New OTP sent successfully!");
          setSeconds(59);
          setTimerActive(true);
          setOtp(["", "", "", ""]);
          inputRefs[0].current.focus();
        } else {
          showAppToast("Failed to resend OTP.");
        }
      } catch (error) {
        showAppToast("Network error.");
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
      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {!keyboardVisible && (
            <View style={styles.topSection}>
              <Image source={require("../../assets/Group400.png")} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>MyChits</Text>
            </View>
          )}
          <Animated.View style={[styles.bottomSection, { paddingTop: bottomSectionPaddingTopAnim }]}>
            <Text style={styles.enterOtpText}>Enter OTP</Text>
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

            <Text style={styles.timerText}>00:{seconds < 10 ? "0" : ""}{seconds}</Text>

            <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#1A237E" /> : <Text style={styles.verifyButtonText}>Verify</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={timerActive || loading}>
              <Text style={[styles.resendButtonText, { color: (timerActive || loading) ? "#B0BEC5" : "#053B90" }]}>
                Didn't get it? <Text style={{ fontWeight: "bold" }}>Send Again</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
      <Toast ref={toastRef} />
    </KeyboardAvoidingView>
  );
};

const inputWidthPercentage = "90%";
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { flex: 1, backgroundColor: "#053B90" },
  scrollViewContent: { flexGrow: 1, justifyContent: "space-between" },
  topSection: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#053B90",
    paddingTop: 20,
    paddingBottom: 10,
  },
  logo: { width: 100, height: 100 },
  title: { color: "#FFFFFF", fontSize: 30, fontWeight: "700", textAlign: "center", letterSpacing: 1 },
  bottomSection: {
    flex: 1.4,
    backgroundColor: "#C7E3EF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  enterOtpText: { fontSize: 20, color: "#000000", fontWeight: "bold", marginBottom: 10 },
  instructionText: { fontSize: 14, color: "#455A64", textAlign: "center", marginBottom: 20 },
  otpInputContainer: { flexDirection: "row", justifyContent: "space-between", width: inputWidthPercentage, marginBottom: 30 },
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
  timerText: { fontSize: 16, color: "#053B90", marginBottom: 40 },
  verifyButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginBottom: 25,
  },
  verifyButtonText: { color: "#1A237E", fontSize: 16, fontWeight: "600" },
  resendButton: { marginTop: 10 },
  resendButtonText: { fontSize: 14 },
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
  toastContent: { flexDirection: "row", alignItems: "center" },
  toastText: { color: "#053B90", fontSize: 14, fontWeight: "600", marginLeft: 10 },
  toastImage: { width: 30, height: 30 },
});

export default RegisterOtpVerify;