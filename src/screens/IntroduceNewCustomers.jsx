import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView, // Import SafeAreaView
  StatusBar,
  Animated,
} from "react-native";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NetworkContext } from "../context/NetworkProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Import useSafeAreaInsets

import url from "../data/url";
import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";

const CustomToast = React.forwardRef(({ duration = 2000 }, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const opacity = useRef(new Animated.Value(0)).current;

  React.useImperativeHandle(ref, () => ({
    show: (msg) => {
      setMessage(msg);
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            setMessage("");
          });
        }, duration);
      });
    },
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[toastStyles.toastContainer, { opacity }]}>
      <View style={toastStyles.toastContent}>
        <Text style={toastStyles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

const toastStyles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 60,
    left: "5%",
    right: "5%",
    backgroundColor: "rgba(238, 243, 247, 0.95)",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 28,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: "#053B90",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
});

const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  multiline,
  numberOfLines,
  isRequired = false,
  autoCapitalize = "none",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedIsFocused]);

  const labelStyle = {
    position: "absolute",
    left: 15,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -10], // Adjusted top for label when unfocused/focused
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 10], // **Decreased font size here: Unfocused 14, Focused 10**
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ["#999", "#053B90"],
    }),
    backgroundColor: "#fff", // Ensures white background behind the label
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={styles.inputContainer}>
      <Animated.Text style={labelStyle}>
        {label} {isRequired && <Text style={{ color: "red" }}>*</Text>}
      </Animated.Text>
      <TextInput
        style={styles.inputField}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        blurOnSubmit={true}
        autoCapitalize={autoCapitalize}
        placeholder={isFocused ? "" : ""}
        placeholderTextColor="#ccc"
      />
    </View>
  );
};

const IntroduceNewCustomers = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const { isConnected, isInternetReachable } = useContext(NetworkContext);
  const insets = useSafeAreaInsets(); // Initialize useSafeAreaInsets

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [Zipcode, setZipcode] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const customToastRef = useRef();

  const showCustomToast = (message) => {
    if (customToastRef.current) {
      customToastRef.current.show(message);
    }
  };

  const handleCreateUser = async () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      showCustomToast("Full Name and Phone Number are required.");
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      showCustomToast("Please enter a valid 10-digit phone number.");
      return;
    }

    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      showCustomToast("Please enter a valid email address.");
      return;
    }

    if (!isConnected || !isInternetReachable) {
      showCustomToast("No internet connection. Please check your network.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${url}/user/add-user`, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),

        Zipcode: Zipcode.trim(),
        track_source: "mobile",
      });

      console.log("API Response Status:", response.status);
      console.log("API Response Data:", response.data);

      if (response.status === 201) {
        showCustomToast(response.data.message || "User created successfully!");

        setFullName("");
        setEmail("");
        setPhoneNumber("");

        setZipcode("");

        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showCustomToast(
          response.data.message ||
            "Something went wrong. (Status: " + response.status + ")"
        );
      }
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.response) {
        showCustomToast(
          error.response.data.message ||
            "Failed to create user. Please try again."
        );
      } else if (error.request) {
        showCustomToast(
          "No response from server. Check your internet connection or server status."
        );
      } else {
        showCustomToast(
          "An unexpected error occurred while setting up the request."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.outerContainer,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />

      {/* Header component - no longer wrapped in its own SafeAreaView */}
      <Header userId={userId} navigation={navigation} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.mainContentWrapper}>
          <View style={styles.contentCard}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Introduce New Customer</Text>

              <FloatingLabelInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                isRequired={true}
                autoCapitalize="words"
              />
              <FloatingLabelInput
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                isRequired={true}
              />
              <FloatingLabelInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Removed Password FloatingLabelInput */}
              {/* Removed Address FloatingLabelInput */}
              <FloatingLabelInput
                label="Zip code"
                value={Zipcode}
                onChangeText={setZipcode}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleCreateUser}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Customer</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CustomToast ref={customToastRef} duration={3000} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#053B90", // Background for the entire screen, including safe areas
  },

  keyboardAvoidingView: {
    flex: 1,
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: "#053B90", // Background for the main content area below the header
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#fff",
    width: "95%",
    borderRadius: 10,
    padding: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 5,
    paddingBottom: 40, // Add some padding at the bottom of the scroll view
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "black",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 10, // Slightly reduced margin bottom for tighter spacing
    position: "relative",
  },
  inputField: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingTop: 18, // Adjusted to visually center text with smaller font
    paddingBottom: 10, // Adjusted to visually center text with smaller font
    fontSize: 14, // Decreased input field font size
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: "#053B90",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default IntroduceNewCustomers;
