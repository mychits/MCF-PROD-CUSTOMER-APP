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
  Animated,
  Easing,
  Platform
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import url from "../../data/url"; // Your API base URL

const { width, height } = Dimensions.get("window");

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F0F5F9",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  shadowColor: "rgba(0,0,0,0.1)",
  headerGradientStart: "#053B90",
  headerGradientEnd: "#053B90",
};

const Header = ({ userId, navigation }) => {
  const [userData, setUserData] = useState({
    full_name: "",
    phone_number: "",
    address: "",
  });

  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const route = useRoute();

  const headerAnim = useRef(new Animated.Value(-height * 0.2)).current;

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

    Animated.timing(headerAnim, {
      toValue: 0,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [userId]);

  const showBackButton = route.name !== "Home";

  const toggleInfoPopup = () => {
    setShowInfoPopup(!showInfoPopup);
  };

  // Helper function to get the first two words of a string
  const getShortenedName = (name) => {
    if (!name) return "...";
    const words = name.trim().split(/\s+/); // Splits by any whitespace
    return words.length > 2 ? `${words[0]} ${words[1]}` : name;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradientStart} />
      <Animated.View
        style={[
          styles.animatedHeaderWrapper,
          { transform: [{ translateY: headerAnim }] },
        ]}
      >
        <LinearGradient
          colors={[Colors.headerGradientStart, Colors.headerGradientEnd]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContainer}>
            <View style={styles.leftContainer}>
              {showBackButton && (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={1}
                style={[
                  styles.profileContainer,
                  !showBackButton && { marginLeft: width * 0.02 },
                ]}
              >
                <Image
                  source={require("../../../assets/profile (2).png")}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
                <View style={{ flexShrink: 1 }}>
                  <Text
                    style={styles.profileName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getShortenedName(userData.full_name)}
                  </Text>
                  <Text style={styles.customerId}>
                    {userData.phone_number || "..."}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={toggleInfoPopup}
              style={styles.infoIconContainer}
            >
              <AntDesign name="infocirlceo" size={22} color="#fff" />
            </TouchableOpacity>

            {showInfoPopup && (
              <TouchableOpacity
                style={styles.infoPopupOverlay}
                onPress={toggleInfoPopup}
                activeOpacity={1}
              >
                <View style={styles.infoPopup}>
                  <TouchableOpacity
                    onPress={toggleInfoPopup}
                    style={styles.closeButton}
                  >
                    <AntDesign name="closecircle" size={24} color="#053B90" />
                  </TouchableOpacity>

                  <Image
                    source={require("../../../assets/Group400.png")}
                    style={styles.popupImage}
                    resizeMode="contain"
                    onError={(e) =>
                      console.log("Image loading error:", e.nativeEvent.error)
                    }
                  />
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
  },
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
    flex: 1, // Added to allow text to take remaining space
  },
  backButton: {
    marginRight: width * 0.04,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: width * 0.04,
    flex: 1, // Added to prevent pushing the info icon off screen
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