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
  Dimensions, // Import Dimensions to get screen height
  StatusBar, // Import StatusBar for consistency
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Keep if used elsewhere, not in selected code
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false); // For loading state

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

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

  const handleRegister = async () => {
    const trimmedFullName = fullName.trim();
    const trimmedPhoneNumber = phoneNumber.replace(/\s/g, "");
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (
      !trimmedFullName ||
      !trimmedPhoneNumber ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      showAppToast("Please fill all fields.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      showAppToast("Passwords do not match.");
      return;
    }

    if (trimmedPhoneNumber.length !== 10 || isNaN(trimmedPhoneNumber)) {
      showAppToast("Phone number must be 10 digits.");
      return;
    }

    setLoading(true); // Start loading

    try {
      const response = await fetch(`${url}/user/signup-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: trimmedFullName,
          phone_number: trimmedPhoneNumber,
          password: trimmedPassword,
          track_source: "mobile",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showAppToast("Registration Successful!");

        setTimeout(() => {
          setAppUser((prev) => ({ ...prev, userId: data.user?._id }));
          navigation.navigate("BottomTab", { userId: data.user?._id });
        }, 2000);
      } else {
        const errorData = await response.json();
        if (response.status === 400) {
          showAppToast("User with this phone number already exists");
        } else if (response.status === 500) {
          showAppToast(
            errorData.message || "Server error. Please try again later."
          );
        } else {
          showAppToast(
            errorData.message || "Registration failed. Please try again."
          );
        }
      }
    } catch (error) {
      showAppToast("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 0 : -screenHeight * 0.15
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
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

          <View style={[styles.bottomSection, { paddingTop: 20 }]}>
            <Text style={styles.registerTitle}>Register</Text>
            <Text style={styles.registerSubtitle}>Create your account</Text>

            {/* Full Name Input */}
            <TextInput
              style={styles.input}
              placeholder="Full Name" // Label now as placeholder
              placeholderTextColor="#78909C"
              value={fullName}
              onChangeText={setFullName}
              accessible
              accessibilityLabel="Full name input"
              autoCapitalize="words"
              autoCorrect={false}
            />

            {/* Phone Number Input */}
            <TextInput
              style={styles.input}
              placeholder="Phone Number" // Label now as placeholder
              placeholderTextColor="#78909C"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) =>
                setPhoneNumber(text.replace(/[^0-9]/g, ""))
              }
              maxLength={10}
              accessible
              accessibilityLabel="Phone number input"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Create Password Input */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create Password" // Label already as placeholder
                placeholderTextColor="#78909C"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                accessible
                accessibilityLabel="Password input"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                accessible
                accessibilityLabel="Toggle password visibility"
              >
                <AntDesign
                  name={showPassword ? "eye" : "eyeo"}
                  size={20}
                  color="#78909C"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password" // Label already as placeholder
                placeholderTextColor="#78909C"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                accessible
                accessibilityLabel="Confirm password input"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                accessible
                accessibilityLabel="Toggle confirm password visibility"
              >
                <AntDesign
                  name={showConfirmPassword ? "eye" : "eyeo"}
                  size={20}
                  color="#78909C"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              accessible
              accessibilityLabel="Register"
            >
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                accessible
                accessibilityLabel="Navigate to Login"
              >
                <Text style={styles.loginButtonText}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#053B90" />
              <Text style={styles.loadingText}>Registering...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast popup */}
      <Toast ref={toastRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
  },
  keyboardAvoidingView: {
    // Added style for KeyboardAvoidingView
    flex: 1,
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
    paddingVertical: 20,
    width: "100%",
  },
  logo: {
    width: 110,
    height: 110,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#C7E3EF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
    width: "100%",
  },
  registerTitle: {
    color: "#000",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  registerSubtitle: {
    color: "#000",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
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
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#053B90",
  },
  eyeIcon: {
    padding: 12,
  },
  registerButton: {
    backgroundColor: "#053B90",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginBottom: 18,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "center",
  },
  loginText: {
    color: "#78909C",
    fontSize: 14,
  },
  loginButtonText: {
    color: "#053B90",
    fontSize: 14,
    fontWeight: "bold",
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
    zIndex: 1000, // Ensure it's on top of other content
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#053B90",
  },
  toastContainer: {
    position: "absolute",
    top: 40, // Position at the top
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
