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
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import url from "../data/url";
import { NetworkContext } from "../context/NetworkProvider";
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

  if (!visible) {
    return null;
  }

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

export default function Login() {
  const navigation = useNavigation();
  const [appUser, setAppUser] = useContext(ContextProvider);
  const route = useRoute();
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const toastRef = useRef();

  useEffect(() => {
    if (route.params?.mobileNumber) {
      setPhoneNumber(route.params.mobileNumber);
      setPassword("");
    }
  }, [route.params?.mobileNumber]);

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

  const showAppToast = (message, imgSrc) => {
    if (toastRef.current) {
      toastRef.current.show(message, imgSrc);
    }
  };

  const handleLogin = async () => {
    if (!isConnected || !isInternetReachable) {
      showAppToast(
        "No internet connection. Please connect to the internet to log in.",
        require("../../assets/Group400.png")
      );
      return;
    }

    const trimmedPhoneNumber = phoneNumber.replace(/\s/g, "");
    const trimmedPassword = password.trim();

    if (!trimmedPhoneNumber || !trimmedPassword) {
      showAppToast(
        "Please enter both phone number and password",
        require("../../assets/Group400.png")
      );
      return;
    }

    if (trimmedPhoneNumber.length !== 10 || isNaN(trimmedPhoneNumber)) {
      showAppToast(
        "Phone number must be exactly 10 digits.",
        require("../../assets/Group400.png")
      );
      return;
    }

    setLoading(true);

    try {
      const loginUrl = `${url}/user/signin-user`;
      console.log("Attempting to log in to:", loginUrl,trimmedPhoneNumber,trimmedPassword);
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: trimmedPhoneNumber,
          password: trimmedPassword,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        showAppToast(
          data.message || "Login Successful!",
          require("../../assets/Group400.png")
        );
        setAppUser((prev) => ({ ...prev, userId: data.userId }));
        navigation.replace("BottomTab", { userId: data.userId });
      } else {
        let errorMessage = "An unexpected error occurred. Please try again.";
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            console.error("Login error (JSON response):", errorData);
        } else {
            const errorText = await response.text();
            console.error("Login error (non-JSON response):", response.status, errorText);
            errorMessage = `Server Error (${response.status}): ${errorText.substring(0, 100)}... Please check your backend route or server logs.`;
        }
        showAppToast(errorMessage, require("../../assets/Group400.png"));
      }
    } catch (error) {
      console.error("Login error (network or unexpected):", error);
      showAppToast(
        "Login failed. Please check your network connection and try again.",
        require("../../assets/Group400.png")
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (text) => {
    setPhoneNumber(text.replace(/[^0-9]/g, ""));
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          showsVerticalScrollIndicator={false}
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

          <View style={[styles.bottomSection, { paddingTop: 50 }]}>
            <View style={styles.loginTextContainer}>
              <Text style={styles.loginText}>Login</Text>
              <Text style={styles.description}>
                Get access to your chits very easily
              </Text>
            </View>

            <Text style={styles.inputLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91"
              placeholderTextColor="#78909C"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              maxLength={10}
              accessible
              accessibilityLabel="Phone number input"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#78909C"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={handlePasswordChange}
                accessible
                accessibilityLabel="Password input"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                accessible
                accessibilityLabel="Toggle password visibility"
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#053B90"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate("ForgotPassword")}
              accessible
              accessibilityLabel="Forgot Password"
              disabled={loading || !isConnected || !isInternetReachable}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                (loading || !isConnected || !isInternetReachable) && {
                  opacity: 0.7,
                },
              ]}
              onPress={handleLogin}
              disabled={loading || !isConnected || !isInternetReachable}
              accessible
              accessibilityLabel="Login"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                accessible
                accessibilityLabel="Navigate to Sign Up"
                disabled={loading || !isConnected || !isInternetReachable}
              >
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast ref={toastRef} />
    </SafeAreaView>
  );
}

const inputWidthPercentage = "90%";
const inputHeight = 50;
const labelHorizontalMargin = 20;
const buttonRadius = 8;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
  },
  keyboardAvoidingView: {
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
    minHeight: screenHeight * 0.06,
    flexGrow: 1,
    backgroundColor: "#C7E3EF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  loginTextContainer: {
    alignItems: "center",
    marginBottom: 30,
    width: inputWidthPercentage,
  },
  loginText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  description: {
    color: "#000000",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
  inputLabel: {
    color: "#000000",
    fontSize: 14,
    marginBottom: 5,
    alignSelf: "flex-start",
    marginLeft: labelHorizontalMargin,
    fontWeight: "bold",
  },
  input: {
    width: inputWidthPercentage,
    height: inputHeight,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#1A237E",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#B3E5FC",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: inputWidthPercentage,
    height: inputHeight,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ADD8E6",
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    height: inputHeight,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#053B90",
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPasswordButton: {
    marginVertical: 20,
    width: inputWidthPercentage,
    alignItems: "center",
    borderRadius: buttonRadius,
  },
  forgotPasswordText: {
    color: "#000000",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#053B90",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginBottom: 18,
    justifyContent: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
  },
  signUpContainer: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "center",
  },
  signUpText: {
    color: "#78909C",
    fontSize: 14,
  },
  signUpButtonText: {
    color: "#053B90",
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  toastImage: {
    width: 30,
    height: 30,
  },
});
