import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
  Linking, // Import Linking for opening URLs (emails)
  Alert, // Import Alert for user feedback
} from "react-native";
import axios from "axios";
import url from "../data/url";
import LottieView from "lottie-react-native";
import Header from "../components/layouts/Header";
import { MaterialIcons } from "@expo/vector-icons"; // Import MaterialIcons

const { width, height } = Dimensions.get("window");
import { ContextProvider } from "../context/UserProvider";

const MyAccount = ({ route, navigation }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const [userData, setUserData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    pincode: "",
    adhaar_no: "",
    pan_no: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${url}/user/get-user-by-id/${userId}`
        );
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to fetch user data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleInputChange = (field, value) => {
    setUserData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleRequestUpdateDetails = async () => {
    const recipientEmail = "info.mychits@gmail.com"; // The email address to send to
    const subject = `Requesting Update Details - User ID: ${userId}`;
    const body = `Dear MyChits Team,

I would like to request an update to my account details. Below are my current details for your reference:

Full Name: ${userData.full_name}
Email: ${userData.email}
Phone Number: ${userData.phone_number}
Address: ${userData.address}
Pincode: ${userData.pincode}
Aadhaar No: ${userData.adhaar_no}
PAN No: ${userData.pan_no}

Please let me know the process to update these details.

Thank you.`;

    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          "Error",
          "No email client found on your device. Please contact support directly at mychits.co.in."
        );
      }
    } catch (error) {
      console.error("Failed to open email client:", error);
      Alert.alert("Error", "Could not open email client. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.fullScreenLoader}>
        <ActivityIndicator size="large" color="#053B90" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />

      <Header userId={userId} navigation={navigation} />

      <View style={styles.mainContentWrapper}>
        <View style={styles.contentCard}>
          <Text style={styles.titleText}>Basic Details</Text>
          <ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.readOnlyWarning}>
              To update your details, please send a request via email.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={userData.full_name}
                editable={false} // Disabled
              />
            </View>

            <View style={styles.inputGroupRow}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  value={userData.email}
                  editable={false} // Disabled
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={userData.phone_number}
                  editable={false} // Disabled
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={userData.address}
                editable={false} // Disabled
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                keyboardType="numeric"
                maxLength={6}
                value={userData.pincode}
                editable={false} // Disabled
              />
            </View>

            <View style={styles.inputGroupRow}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Aadhaar No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Aadhaar No"
                  keyboardType="numeric"
                  maxLength={12}
                  value={userData.adhaar_no}
                  editable={false} // Disabled
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>PAN No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="PAN No"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={userData.pan_no}
                  editable={false} // Disabled
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.requestUpdateButton}
                onPress={handleRequestUpdateDetails}
              >
                <MaterialIcons name="email" size={24} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.requestUpdateButtonText}>
                Requesting for Profile Update
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  fullScreenLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: "#053B90",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: height * 0.005,
    paddingTop: height * 0.005,
  },
  contentCard: {
    backgroundColor: "#fff",
    width: "92%",
    borderRadius: 15,
    padding: width * 0.04,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    flex: 1,
    maxHeight: "100%",
  },
  titleText: {
    marginVertical: height * 0.015,
    fontWeight: "bold",
    fontSize: width * 0.06,
    color: "#053B90",
    textAlign: "center",
  },
  formContainer: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: height * 0.02,
  },
  inputGroupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: height * 0.02,
  },
  inputWrapper: {
    width: "48%",
  },
  label: {
    fontSize: width * 0.038,
    color: "#333",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    paddingHorizontal: 15,
    fontSize: width * 0.04,
    backgroundColor: "#F9F9F9", // Slightly greyed out for disabled look
    color: "#555", // Dimmed text color for disabled
  },
  readOnlyWarning: {
    backgroundColor: '#FFF3CD', // Light yellow background
    borderColor: '#FFE082',    // Darker yellow border
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: width * 0.035,
    color: '#856404', // Dark yellow text
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: height * 0.02,
    alignItems: "center",
    marginBottom: height * 0.05,
  },
  requestUpdateButton: {
    backgroundColor: "#053B90",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row', // Added to align icon and text
  },
  requestUpdateButtonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginLeft: 10, // Added space between icon and text
  },
  buttonIcon: {
    // Optional: Add specific styles for the icon if needed
  }
});

export default MyAccount;