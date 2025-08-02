import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking, // For opening URLs
  Platform, // For platform-specific styles like StatusBar
  Dimensions, // To make styles responsive
  Alert, // Using Alert instead of console.log for user feedback
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient
import { MaterialIcons, FontAwesome } from "@expo/vector-icons"; // Import MaterialIcons and FontAwesome for more icons
import { NetworkContext } from "../context/NetworkProvider"; // Assuming this context exists
import Header from "../components/layouts/Header"; // Import the Header component
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Import useSafeAreaInsets for better padding
import { ContextProvider } from "../context/UserProvider";

const { width, height } = Dimensions.get("window");

const Colors = {
  primaryBlue: "#053B90", // Deep, vibrant blue
  secondaryBlue: "#3498DB", // Lighter, sky blue
  accentGreen: "#2ECC71", // Fresh green for success/positive
  accentOrange: "#FFA000", // Warm orange for accents/warnings

  backgroundLight: "#053B90", // Very light off-white for main background
  cardBackground: "#FFFFFF", // Pure white for card elements
  textDark: "#2C3E50", // Dark charcoal for primary text
  textMedium: "#7F8C8D", // Medium grey for secondary text
  textLight: "#BDC3C7", // Very light grey for subtle labels

  buttonPrimary: "#0A4B9F",
  buttonSecondary: "#95A5A6",
  dangerRed: "#E74C3C", // Red for errors/danger
  successGreen: "#2ECC71", // Green for success
  linkBlue: "#3498DB", // Blue for hyperlinks

  gradientStart: "#0A4B9F",
  gradientEnd: "#062E61",

  shadowColor: "rgba(0,0,0,0.15)", // Subtle shadow
};

const MoreInformation = ({ navigation }) => {
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const insets = useSafeAreaInsets(); // Get safe area insets

  const handleWebsiteLink = async () => {
    const websiteUrl = "https://www.mychits.co.in";
    if (!isConnected || !isInternetReachable) {
      Alert.alert("No Internet", "Please check your internet connection to visit the website.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(websiteUrl);
      if (supported) {
        await Linking.openURL(websiteUrl);
      } else {
        Alert.alert("Error", `Don't know how to open this URL: ${websiteUrl}.`);
      }
    } catch (error) {
      console.error("An error occurred while opening the URL:", error);
      Alert.alert("Error", "Could not open website. Please try again.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.fullScreenContainer, { paddingTop: insets.top }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />
      <Header
        navigation={navigation}
        userId={userId}
        title="More Information"
      />{" "}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentCard}>
          <Text style={styles.mainTitle}>About MyChits</Text>
          <Text style={styles.sectionText}>
            Welcome to MyChits! We are dedicated to providing a seamless and
            transparent platform for managing your chit funds. Our goal is to
            empower users with easy access to their chit details, payment
            history, and group information, all at their fingertips.
          </Text>
          <Text style={styles.sectionText}>
            This application is designed with user-friendliness in mind,
            ensuring a smooth experience for both new and experienced chit fund
            participants. We continuously strive to improve our services and add
            new features based on your valuable feedback.
          </Text>
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Need Support?</Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL("tel:+919483900777")}
            >
              <MaterialIcons
                name="call"
                size={20}
                color={Colors.cardBackground}
              />
              <Text style={styles.contactButtonText}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL("mailto:support@mychits.co.in")}
            >
              <MaterialIcons
                name="email"
                size={20}
                color={Colors.cardBackground}
              />
              <Text style={styles.contactButtonText}>Email Support</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.websiteContainer}>
            <TouchableOpacity
              onPress={handleWebsiteLink}
              disabled={!isConnected || !isInternetReachable}
              style={styles.websiteLinkButtonInWhiteContainer}
            >
              <MaterialIcons
                name="language"
                size={20}
                color={Colors.primaryBlue} 
              />
              <Text style={styles.websiteLinkTextInWhiteContainer}>Visit Our Website</Text>
            </TouchableOpacity>
          </View>

        </View>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]} // Using defined gradient colors
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }} // Diagonal gradient for a dynamic look
          style={styles.appInfoFooter}
        >
          <View style={styles.madeWithLoveContainer}>
            <Text style={styles.appInfoMadeWithLove}>
              Made with{" "}
              <Text style={{ color: "#FF6B6B", fontWeight: "bold" }}>❤</Text> in
              India
            </Text>
            <MaterialIcons
              name="public"
              size={16}
              color={Colors.cardBackground}
              style={styles.madeInIndiaIcon}
            />
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundLight, // Light background for the whole screen
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05, // Responsive horizontal padding
    paddingBottom: height * 0.03, // More padding at the bottom
    justifyContent: "space-between", // Pushes footer to bottom
  },
  contentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: width * 0.05,
    marginTop: height * 0.02,
    marginBottom: height * 0.03, // Added some bottom margin to separate from the website container
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  mainTitle: {
    fontSize: width * 0.07, // Responsive font size
    fontWeight: "800", // Extra bold
    color: Colors.primaryBlue,
    marginBottom: height * 0.02,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.05)", // Subtle text shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionText: {
    fontSize: width * 0.042, // Responsive font size
    color: Colors.textDark,
    lineHeight: width * 0.065, // Improved line height
    marginBottom: height * 0.015,
    textAlign: "justify",
  },
  contactSection: {
    marginTop: height * 0.03,
    borderTopWidth: 1,
    borderTopColor: Colors.textLight,
    paddingTop: height * 0.02,
    alignItems: "center",
    marginBottom: height * 0.02, // Added margin bottom to separate from website container
  },
  contactTitle: {
    fontSize: width * 0.05,
    fontWeight: "700",
    color: Colors.primaryBlue,
    marginBottom: height * 0.015,
  },
  contactButton: {
    flexDirection: "row",
    backgroundColor: Colors.accentGreen,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    width: "80%", // Make buttons a bit narrower
    maxWidth: 250, // Max width for larger screens
    shadowColor: Colors.accentGreen, // Shadow for call to action
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  contactButtonText: {
    color: Colors.cardBackground,
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginLeft: 10,
  },
  // NEW STYLE FOR WHITE CONTAINER FOR WEBSITE LINK
  websiteContainer: {
    backgroundColor: Colors.cardBackground, // White background
    borderRadius: 15,
    // Increased padding for more internal space
    paddingVertical: height * 0.025, // Adjusted from width * 0.05 for more vertical padding
    paddingHorizontal: width * 0.05,
    marginTop: height * 0.02, // Consistent space from contact section
    marginBottom: height * 0.03, // Space from footer below
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    alignItems: "center", // Center content within the white container
    // Added border for a more defined card-like appearance
    borderWidth: 1,
    borderColor: Colors.textLight, // Subtle border color
  },
  // NEW STYLE FOR BUTTON INSIDE WHITE CONTAINER
  websiteLinkButtonInWhiteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30, // Slightly more rounded button inside white container
    backgroundColor: Colors.backgroundLight, // Use primary blue for the button
    width: "80%", // Match width of contact buttons
    maxWidth: 250, // Match max width
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  // NEW STYLE FOR TEXT INSIDE WHITE CONTAINER BUTTON
  websiteLinkTextInWhiteContainer: {
    fontSize: width * 0.045,
    color: Colors.cardBackground, // White text for contrast on blue button
    fontWeight: "bold",
    marginLeft: 10,
  },
  appInfoFooter: {
    paddingVertical: height * 0.03,
    paddingHorizontal: width * 0.05,
    borderRadius: 20, // More rounded corners
    alignItems: "center",
    marginTop: height * 0.03, // Space from content above (now from the new website container)
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 }, // Deeper shadow
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  madeWithLoveContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  appInfoMadeWithLove: {
    fontSize: width * 0.038,
    color: Colors.cardBackground, // White text
    marginRight: 5,
  },
  madeInIndiaIcon: {},
  versionText: {
    fontSize: width * 0.035,
    color: Colors.textLight, // Lighter text for version number
    marginTop: 5,
  },
});

export default MoreInformation;
