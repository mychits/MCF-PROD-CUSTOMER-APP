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
  Animated,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
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

export default function Register() {
  const navigation = useNavigation();
  const toastRef = useRef();
  const [appUser, setAppUser] = useContext(ContextProvider);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const showAppToast = (message) => {
    if (toastRef.current) {
      toastRef.current.show(message, require("../../assets/Group400.png"));
    }
  };

  const validateInputs = () => {
    const trimmedFullName = fullName.trim();
    const trimmedPhoneNumber = phoneNumber.replace(/\s/g, "");
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedFullName || !trimmedPhoneNumber || !trimmedPassword || !trimmedConfirmPassword) {
      showAppToast("Please fill all required fields.");
      return false;
    }
    if (trimmedPassword !== trimmedConfirmPassword) {
      showAppToast("Passwords do not match.");
      return false;
    }
    if (trimmedPhoneNumber.length !== 10 || isNaN(trimmedPhoneNumber)) {
      showAppToast("Phone number must be 10 digits.");
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    const cleanPhone = phoneNumber.replace(/\s/g, "");

    try {
      // PROPER FLOW: Just send the OTP request. 
      // The backend should check if the number is already registered inside this endpoint.
      const otpPayload = {
        phone_number: cleanPhone,
        full_name: fullName.trim(),
        ...(referralCode.trim() && { referral_code: referralCode.trim() }),
      };

      const otpResponse = await fetch(`${url}/user/send-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otpPayload),
      });

      const otpData = await otpResponse.json();

      if (otpResponse.ok) {
        showAppToast(otpData.message || "OTP sent successfully!");
        navigation.navigate("RegisterOtpVerify", {
          mobileNumber: cleanPhone,
          fullName: fullName.trim(),
          password: password.trim(),
          referralCode: referralCode.trim(),
        });
      } else {
        // This is where "User already exists" or "Error sending SMS" will be caught
        showAppToast(otpData.message || "Failed to send OTP.");
      }
    } catch (error) {
      console.error("Verification Error:", error);
      showAppToast("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -screenHeight * 0.15}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          {!keyboardVisible && (
            <View style={styles.topSection}>
              <Image source={require("../../assets/Group400.png")} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>MyChits</Text>
            </View>
          )}

          <View style={[styles.bottomSection, { paddingTop: 30 }]}>
            <Text style={styles.registerTitle}>Register</Text>
            <Text style={styles.registerSubtitle}>Create your account</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#78909C"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#78909C"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ""))}
              maxLength={10}
            />

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create Password"
                placeholderTextColor="#78909C"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <AntDesign name={showPassword ? "eye" : "eyeo"} size={20} color="#78909C" />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#78909C"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <AntDesign name={showConfirmPassword ? "eye" : "eyeo"} size={20} color="#78909C" />
              </TouchableOpacity>
            </View>

            {showReferralInput ? (
              <View style={styles.referralInputGroup}>
                <TouchableOpacity
                  onPress={() => {
                    setShowReferralInput(false);
                    setReferralCode("");
                  }}
                  style={styles.skipLinkContainer}
                >
                  <Text style={styles.skipLinkText}>Skip</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="Referral Number (Optional)"
                  placeholderTextColor="#78909C"
                  value={referralCode}
                  onChangeText={setReferralCode}
                />
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowReferralInput(true)} style={styles.referralLinkContainer}>
                <Text style={styles.referralLinkText}>Have a referral code?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.registerButton} onPress={handleSendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.registerButtonText}>Continue</Text>}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginButtonText}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast ref={toastRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#053B90" },
  keyboardAvoidingView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, justifyContent: "space-between" },
  topSection: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#053B90",
    paddingVertical: 20,
    width: "100%",
  },
  logo: { width: 110, height: 110 },
  title: { color: "#FFFFFF", fontSize: 30, fontWeight: "700", textAlign: "center" },
  bottomSection: {
    flex: 1,
    backgroundColor: "#C7E3EF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%",
  },
  registerTitle: { color: "#000", fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  registerSubtitle: { color: "#000", fontSize: 14, marginBottom: 10 },
  input: {
    width: "90%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#053B90",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#B3E5FC",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    height: 50,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ADD8E6",
    marginBottom: 12,
  },
  passwordInput: { flex: 1, height: 50, paddingHorizontal: 15, color: "#053B90" },
  eyeIcon: { padding: 12 },
  registerButton: {
    backgroundColor: "#053B90",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonText: { color: "white", fontSize: 16 },
  loginContainer: { flexDirection: "row", marginTop: 15 },
  loginText: { color: "#78909C" },
  loginButtonText: { color: "#053B90", fontWeight: "bold" },
  toastContainer: {
    position: "absolute",
    top: 40,
    left: "5%",
    right: "5%",
    backgroundColor: "rgba(238, 243, 247, 0.9)",
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    zIndex: 9999,
  },
  toastContent: { flexDirection: "row", alignItems: "center" },
  toastText: { color: "#053B90", fontWeight: "900", marginLeft: 10 },
  toastImage: { width: 30, height: 30 },
  referralLinkContainer: { width: "90%", alignItems: "flex-end", marginBottom: 12 },
  referralLinkText: { color: "#053B90", textDecorationLine: "underline" },
  referralInputGroup: { width: "100%", alignItems: "center" },
  skipLinkContainer: { width: "90%", alignItems: "flex-end", marginBottom: 5 },
  skipLinkText: { color: "#053B90", fontSize: 13, textDecorationLine: "underline" },
});