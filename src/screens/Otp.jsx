import React, { useEffect, useRef, useState } from "react";
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
  Animated, // Import Animated for the animation
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

const Otp = ({ route, navigation }) => {
  const { mobileNumber } = route.params;
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(59);
  const [timerActive, setTimerActive] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // State to track keyboard visibility

  const bottomSectionPaddingTopAnim = useRef(new Animated.Value(30)).current;

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

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
          toValue: Platform.OS === "ios" ? 15 : 5, // Adjust padding when keyboard is visible
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
          toValue: 30, // Reset padding when keyboard is hidden
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [bottomSectionPaddingTopAnim]); // Dependency array for useEffect

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (text && index < otp.length - 1) {
      inputRefs[index + 1].current.focus();
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

  const handleVerifyOtp = () => {
    if (otp.every((d) => d !== "")) {
      const fullOtp = otp.join("");
      navigation.navigate("ConformNewPassword", { mobileNumber, otp: fullOtp });
    } else {
      Alert.alert("Incomplete OTP", "Please enter the complete OTP.");
    }
  };

  const handleResend = () => {
    if (!timerActive) {
      setSeconds(59);
      setTimerActive(true);
      Alert.alert(
        "OTP Resent!",
        "A new OTP has been sent to your mobile number."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? -100 : 0} // Adjust this value if needed for Android
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Top Section - Hide when keyboard is visible */}
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

          {/* Bottom Section - Apply Animated padding */}
          <Animated.View
            style={[
              styles.bottomSection,
              { paddingTop: 50 }, // Apply the animated value here
            ]}
          >
            <Text style={styles.enterOtpText}>Enter OTP</Text>

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
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResend}
              disabled={timerActive}
            >
              <Text
                style={[
                  styles.resendButtonText,
                  { color: timerActive ? "#B0BEC5" : "#053B90" },
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
    </KeyboardAvoidingView>
  );
};

const inputWidthPercentage = "80%";

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
    marginBottom: 20,
    textAlign: "center",
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
    marginBottom: 100,
  },
  verifyButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginBottom: 25,
    justifyContent: "center",
      marginTop: -30,
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
});

export default Otp;
