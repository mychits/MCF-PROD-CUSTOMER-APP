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
  SafeAreaView,
  StatusBar,
  Animated,
  Image,
} from "react-native";
import axios from "axios";
import * as Contacts from "expo-contacts";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// --- Custom Imports (your existing) ---
import { NetworkContext } from "../context/NetworkProvider";
import { ContextProvider } from "../context/UserProvider";
import url from "../data/url";
import profileImage from "../../assets/profile (2).png";

// --- Colors / Theme ---
const Colors = {
  primaryViolet: "#0A4B9F",
  secondaryViolet: "#0A4B9F",
  backgroundLight: "#FFFFFF",
  screenBackground: "#0A4B9F",
  inputBackground: "#F3F0F9",
  inputBorder: "#aabdd6ff",
  textDark: "#333333",
  headerGradientStart: "#0A4B9F",
  headerGradientEnd: "#0A4B9F",
  toastBg: "#EDE7F6",
  toastText: "#0A4B9F",
  redError: "#D32F2F",
};

// --- Custom Toast (unchanged) ---
const CustomToast = React.forwardRef(({ duration = 3000 }, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const opacity = useRef(new Animated.Value(0)).current;

  const show = (msg) => {
    Animated.timing(opacity).stop();
    setMessage(msg);
    setVisible(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
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
        });
      }, duration);
    });
  };

  React.useImperativeHandle(ref, () => ({ show }));

  if (!visible) return null;

  return (
    <Animated.View style={[toastStyles.toastContainer, { opacity }]} pointerEvents="none">
      <View style={toastStyles.toastContent}>
        <Text style={toastStyles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

const toastStyles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 60,
    left: "5%",
    right: "5%",
    backgroundColor: Colors.toastBg,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 28,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: Colors.toastText,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
});

// --- FloatingLabelInput (unchanged) ---
const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  isRequired = false,
  autoCapitalize = "none",
  maxLength = undefined,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: "absolute",
    left: 15,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 11],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ["#999", Colors.primaryViolet],
    }),
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 4,
    zIndex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  };

  return (
    <View style={styles.inputContainer}>
      <Animated.Text style={labelStyle}>
        {label} {isRequired && <Text style={{ color: Colors.redError }}>*</Text>}
      </Animated.Text>
      <TextInput
        style={[
          styles.inputField,
          isFocused && { borderColor: Colors.primaryViolet },
          multiline && { minHeight: 100, paddingTop: 15, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        blurOnSubmit
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </View>
  );
};

// --- NEW: Loading Overlay Component ---
const LoadingOverlay = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={overlayStyles.overlay}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={overlayStyles.overlayText}>Accessing Contacts...</Text>
    </View>
  );
};

const overlayStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998, // Below toast (9999), above everything else
  },
  overlayText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  }
});

// --- Main Screen ---
const IntroduceNewCustomers = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [appUser] = useContext(ContextProvider);
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Controls both button and overlay

  const customToastRef = useRef();

  const showCustomToast = (message) => {
    customToastRef.current?.show(message);
  };

  const handleCreateUser = async () => {
    if (!isConnected || !isInternetReachable) {
      showCustomToast("No internet connection. Please check your network.");
      return;
    }
    if (!fullName.trim() || !phoneNumber.trim()) {
      showCustomToast("Full Name and Phone Number are required.");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      showCustomToast("Please enter a valid 10‑digit phone number.");
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      showCustomToast("Please enter a valid email address.");
      return;
    }
    if (zipCode.trim() && !/^\d{5}$/.test(zipCode.trim())) {
      showCustomToast("Please enter a valid 5‑digit Zip Code.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${url}/user/add-user`, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        Zipcode: zipCode.trim(),
        track_source: "mobile",
      });
      if (response.status === 201) {
        showCustomToast(response.data.message || "Customer created successfully! 🎉");
        setFullName("");
        setEmail("");
        setPhoneNumber("");
        setZipCode("");
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showCustomToast(response.data.message || "Unexpected status from server.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred while creating the customer.";
      showCustomToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Updated: Use native contact picker with loader ---
  const handlePickContact = async () => {
    setIsLoading(true); // Start loading overlay

    try {
      // Request permissions
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        showCustomToast("Permission to access contacts was denied.");
        return;
      }

      const contact = await Contacts.presentContactPickerAsync();
      // If user cancels, contact will be null
      if (!contact) {
        // user cancelled
        return;
      }

      // Now contact is a Contact object
      const name = contact.name ?? "";
      const phoneNumbers = contact.phoneNumbers;
      let phone = "";
      if (phoneNumbers && phoneNumbers.length > 0) {
        // Get the first one and strip non digits
        phone = phoneNumbers[0].number.replace(/\D/g, ""); 
      }
      if (name) setFullName(name);
      if (phone) setPhoneNumber(phone);

      showCustomToast("Contact selected & filled.");
    } catch (err) {
      console.error("Error picking contact:", err);
      showCustomToast("Failed to pick contact.");
    } finally {
      setIsLoading(false); // Stop loading overlay
    }
  };

  const handleProfilePress = () => {
    navigation.navigate("BottomTab", { screen: "ProfileScreen" });
  };

  return (
    <SafeAreaView style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradientStart} />
      <LinearGradient
        colors={[Colors.headerGradientStart, Colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Introduce New Customer</Text>
          <TouchableOpacity onPress={handleProfilePress}>
            <Image source={profileImage} style={styles.headerProfileImage} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 50 : 0}
      >
        <View style={styles.mainCard}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.cardFormTitle}>Customer Referral Details</Text>
            <Text style={styles.cardFormSubtitle}>
              Enter the required information to create a new customer lead.
            </Text>

            {/* Contact Picker Button */}
            <TouchableOpacity style={styles.contactButton} onPress={handlePickContact} disabled={isLoading}>
              <View style={styles.contactButtonContent}>
                <Ionicons name="person-circle-outline" size={22} color={Colors.primaryViolet} />
                <Text style={styles.contactButtonText}>Pick from Contacts</Text>
              </View>
            </TouchableOpacity>

            <FloatingLabelInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              isRequired
              autoCapitalize="words"
            />
            <FloatingLabelInput
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              isRequired
              maxLength={10}
            />
            <FloatingLabelInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FloatingLabelInput
              label="Zip Code"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={5}
            />

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleCreateUser}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Create Customer</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <CustomToast ref={customToastRef} />
      
      {/* RENDER THE FULL-SCREEN LOADER */}
      <LoadingOverlay visible={isLoading} /> 
    </SafeAreaView>
  );
};

// --- Styles (same + button styles) ---
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.screenBackground,
  },
  headerContainer: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: Colors.headerGradientStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  headerProfileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainCard: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    marginHorizontal: 15,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 25,
    marginTop: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
  },
  cardFormTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textDark,
    marginBottom: 5,
  },
  cardFormSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
    fontWeight: "500",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 25,
    position: "relative",
  },
  inputField: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
    fontSize: 16,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    color: Colors.textDark,
  },
  submitButton: {
    backgroundColor: Colors.primaryViolet,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    shadowColor: Colors.primaryViolet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.secondaryViolet,
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  contactButton: {
    marginBottom: 10,
    backgroundColor: Colors.inputBackground,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primaryViolet,
    marginLeft: 8,
  },
});

export default IntroduceNewCustomers;