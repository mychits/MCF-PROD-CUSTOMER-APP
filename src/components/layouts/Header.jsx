import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated, // Import Animated
  Easing, // Import Easing for better animation control
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
// Removed: import LottieView from "lottie-react-native"; // Removed LottieView import

import url from "../../data/url"; // Your API base URL

const { width, height } = Dimensions.get("window");

// Define colors for consistency and better aesthetics
const Colors = {
  primaryBlue: "#053B90", // Dark blue, main app color
  lightBackground: "#F0F5F9", // Very light grey-blue for screen background
  cardBackground: "#FFFFFF", // Pure white for card base
  darkText: "#2C3E50", // Dark grey for primary text
  mediumText: "#7F8C8D", // Medium grey for secondary text
  lightText: "#BDC3C7", // Light grey for subtle labels
  shadowColor: "rgba(0,0,0,0.1)", // Light shadow for depth

  // Header specific colors/gradients
  headerGradientStart: "#053B90", // Dark blue
  headerGradientEnd: "#053B90", // Slightly lighter, more vibrant blue
};

const Header = ({ userId, navigation }) => {
  const [userData, setUserData] = useState({
    full_name: "",
    phone_number: "",
    address: "",
  });

  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const route = useRoute();

  // Animated value for header slide-down
  const headerAnim = useRef(new Animated.Value(-height * 0.2)).current; // Start off-screen above

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (userId) {
          const response = await axios.get(
            `${url}/user/get-user-by-id/${userId}`
          );
          setUserData(response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

    // Start the header animation when the component mounts
    Animated.timing(headerAnim, {
      toValue: 0, // Slide to its original position (top: 0)
      duration: 1000, // 1 second duration
      easing: Easing.out(Easing.ease), // Smooth easing out effect
      useNativeDriver: true, // Use native driver for performance
    }).start();
  }, [userId]); // Dependency array: re-run if userId changes

  const showBackButton = route.name !== "Home";

  const toggleInfoPopup = () => {
    setShowInfoPopup(!showInfoPopup);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradientStart} />
      <Animated.View // Use Animated.View for the animated header
        style={[
          styles.animatedHeaderWrapper,
          { transform: [{ translateY: headerAnim }] }, // Apply the translate animation
        ]}
      >
        <LinearGradient
          colors={[Colors.headerGradientStart, Colors.headerGradientEnd]}
          style={styles.headerGradient}
        >
          {/* Removed: LottieView component */}

          <View style={styles.headerContainer}>
            {/* Left side: Back Button (if applicable) and Profile Info */}
            <TouchableOpacity
              style={styles.leftContainer}
              onPress={() =>
                navigation.navigate("BottomTab", {
                  screen: "ProfileScreen",
                  params: { userId: userId }, // Pass userId as parameters
                })
              }
            >
              {/* Conditional Back Button */}
              {showBackButton && (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
              )}
              {/* Profile Image and Name/ID */}
              <View
                style={[
                  styles.profileContainer,
                  !showBackButton && { marginLeft: width * 0.02 },
                ]}
              >
                <Image
                  source={require("../../../assets/profile (2).png")} // Updated image path
                  style={styles.profileImage}
                  resizeMode="cover"
                />
                <View>
                  <Text style={styles.profileName}>
                    {userData.full_name || "..."}
                  </Text>
                  <Text style={styles.customerId}>
                    {userData.phone_number || "..."}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Right side: Info Icon to trigger popup */}
            <TouchableOpacity
              onPress={toggleInfoPopup}
              style={styles.infoIconContainer}
            >
              <AntDesign name="infocirlceo" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Info Popup (conditionally rendered) */}
            {showInfoPopup && (
              <TouchableOpacity
                style={styles.infoPopupOverlay} // Covers the entire screen
                onPress={toggleInfoPopup} // Dismiss popup when clicked anywhere on the overlay
                activeOpacity={1} // Prevents visual feedback (opacity change) on overlay press
              >
                <View style={styles.infoPopup}>
                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={toggleInfoPopup}
                    style={styles.closeButton}
                  >
                    <AntDesign name="closecircle" size={24} color="#053B90" />
                  </TouchableOpacity>

                  {/* Image for the popup */}
                  <Image
                    source={require("../../../assets/Group400.png")} // **Verify this path**
                    style={styles.popupImage}
                    resizeMode="contain" // Ensures the whole image is visible within its bounds
                    onError={(e) =>
                      console.log("Image loading error:", e.nativeEvent.error)
                    }
                  />
                  {/* Text for the popup - MODIFIED HERE */}
                  <View style={styles.infoPopupTextContainer}>
                    <Text style={styles.mychitsText}>Mychits</Text>
                    <Text style={styles.customerAppText}>Customer app</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.headerGradientStart,
  },
  animatedHeaderWrapper: {
    position: "relative",
    zIndex: 10,
  },
  headerGradient: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    position: "relative",
    zIndex: 10,
    // Removed: overflow: 'hidden' because Lottie is gone
  },
  // Removed: lottieAnimation style
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: width * 0.04,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: width * 0.04,
  },
  profileImage: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    marginRight: width * 0.015,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  profileName: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "700",
  },
  customerId: {
    color: "rgba(255,255,255,0.8)",
    fontSize: width * 0.028,
  },
  infoIconContainer: {
    padding: width * 0.02,
  },
  infoPopupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  infoPopup: {
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.08,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
    maxWidth: width * 0.8,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: height * 0.01,
    right: width * 0.02,
    padding: width * 0.01,
    zIndex: 1,
  },
  popupImage: {
    width: width * 0.45,
    height: width * 0.25,
    marginBottom: height * 0.015,
    borderRadius: 10,
  },
  infoPopupTextContainer: {
    alignItems: "center",
    marginTop: height * 0.005,
  },
  mychitsText: {
    fontSize: width * 0.06,
    fontWeight: "800",
    color: "#053B90",
    textAlign: "center",
  },
  customerAppText: {
    fontSize: width * 0.04,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginTop: height * 0.005,
  },
});

export default Header;