// Becomeanagent.jsx - (No significant changes needed here for the 404 error fix, as your POST request URL formation is correct for the intended backend setup)

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Header from "../components/layouts/Header";
import { LinearGradient } from "expo-linear-gradient";
import { ContextProvider } from "../context/UserProvider";
import axios from 'axios';
import url from "../data/url"; // Make sure this path is correct to your backend URL

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F0F5F9",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentGreen: "#2ECC71",
  accentBlue: "#3499DB",
  buttonPrimary: "#00BCD4",
  buttonText: "#FFFFFF",
  shadowColor: "rgba(0,0,0,0.1)",
  gradientStart: "#FFFFFF",
  gradientEnd: "#E3F2FD",
  actionBoxBackground: "#F8F8F8",
  borderColor: "#E0E0E0",
  amountHighlight: "#E74C3C",
  darkInvestment: "#0A2647",
  darkProfit: "#196F3D",
};

const Becomeanagent = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser] = useContext(ContextProvider);
  const currentUserId = appUser.userId || null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [experience, setExperience] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (
      !fullName ||
      !email ||
      !phoneNumber ||
      !address ||
      !idProofType ||
      !idProofNumber ||
      !bankAccountNumber ||
      !ifscCode ||
      !experience
    ) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill in all required fields.",
        position: "bottom",
      });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address.",
        position: "bottom",
      });
      return false;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a 10-digit phone number.",
        position: "bottom",
      });
      return false;
    }
    return true;
  };

  const handleSubmitApplication = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentUserId) {
      Toast.show({
        type: "error",
        text1: "User Not Authenticated",
        text2: "Please log in to submit your application.",
        position: "bottom",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = {
        userId: currentUserId,
        fullName,
        email,
        phoneNumber,
        address,
        idProofType,
        idProofNumber,
        bankAccountNumber,
        ifscCode,
        experience,
        status: "pending",
        appliedAt: new Date().toISOString(),
      };

      const fullUrl = `${url}/become-agent/agents/become`;
      console.log("Attempting to post to URL:", fullUrl);

      const response = await axios.post(fullUrl, formData);

      if (response.status === 201 || response.status === 200) {
        Toast.show({
          type: "success",
          text1: "Application Submitted!",
          text2: "We will review your application shortly.",
          position: "bottom",
          visibilityTime: 4000,
        });
        setFullName("");
        setEmail("");
        setPhoneNumber("");
        setAddress("");
        setIdProofType("");
        setIdProofNumber("");
        setBankAccountNumber("");
        setIfscCode("");
        setExperience("");

      } else {
        Toast.show({
          type: "info",
          text1: "Submission Issue",
          text2: response.data.message || "Something went wrong with the submission.",
          position: "bottom",
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      console.error("Error submitting agent application: ", error);
      let errorMessage = "Failed to submit application. Please try again later.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: errorMessage,
        position: "bottom",
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#053B90" />
      <Header
        userId={currentUserId}
        navigation={navigation}
        title="Become an Agent"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <LinearGradient
            colors={["#FFFFFF", "#E0F2F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.formContainer}
          >
            <Text style={styles.formTitle}>Agent Application Form</Text>
            <Text style={styles.formSubtitle}>
              Please fill in your details to apply.
            </Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Full Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your full address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>
              ID Proof Type (e.g., Aadhaar, PAN)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Aadhaar Card"
              value={idProofType}
              onChangeText={setIdProofType}
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>ID Proof Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ID proof number"
              value={idProofNumber}
              onChangeText={setIdProofNumber}
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Bank Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter bank account number"
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter IFSC code"
              value={ifscCode}
              onChangeText={setIfscCode}
              autoCapitalize="characters"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>
              Relevant Experience (Optional)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., 2 years in sales, managed a chits group"
              value={experience}
              onChangeText={setExperience}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitApplication}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#053B90",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 20,
    backgroundColor: "#053B90",
  },
  formContainer: {
    width: "100%",
    borderRadius: 15,
    padding: 25,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    overflow: "hidden",
    borderWidth: 0,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#053B90",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formSubtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: 14,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    borderColor: "#A9D6E5",
    borderWidth: 1,
    marginBottom: 18,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  submitButton: {
    backgroundColor: "#053B90",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#A9BEDA",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default Becomeanagent;