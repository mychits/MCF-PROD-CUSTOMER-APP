import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  Dimensions,
  Animated,
  ScrollView,
  Easing,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import bikeImage from "../../assets/bike.png";
import carImage from "../../assets/car.png";
import healthImage from "../../assets/health.png";
import homeImage from "../../assets/home_image.png";
import travelImage from "../../assets/travel.png";
import goldImage from "../../assets/gold.png";
import termLifeImage from "../../assets/Termlife.png";
import savingsImage from "../../assets/Savings.png"; // Added import for Savings.png

import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get("window");

// Updated card background colors to match EnrollGroup's style
const cardBackgroundColors = [
  "#004775", // Dark Blue for Health (matches EnrollGroup's investmentCardBackground)
  "#357500", // Dark Green for Car (matches EnrollGroup's profitCardBackground)
  "#800080", // Purple for Bike (matches EnrollGroup's totalPaid color)
  "#E74C3C", // Red for Home (matches EnrollGroup's balance color)
  "#FF6347", // Tomato for Travel (matches EnrollGroup's toBePaid color)
  "#2ECC71", // Emerald Green for Gold (matches EnrollGroup's balanceExcess color)
];

const InsuranceCard = ({
  title,
  imageSource,
  onPress,
  backgroundColor,
  animationDelay,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateXAnim = useRef(new Animated.Value(10)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0.1)).current;
  const elevationAnim = useRef(new Animated.Value(6)).current;

  const arrowTranslateX = useRef(new Animated.Value(20)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const arrowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(animationDelay || 0),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: false,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.bezier(0.25, 0.1, 0.25, 1)),
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(rotateXAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(arrowTranslateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [
    fadeAnim,
    animationDelay,
    arrowTranslateX,
    arrowOpacity,
    scaleAnim,
    translateYAnim,
    rotateXAnim,
  ]);

  const handlePressIn = () => {
    Vibration.vibrate(50);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.25,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(elevationAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.spring(arrowScale, {
        toValue: 1.1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: false,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.1,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(elevationAnim, {
        toValue: 6,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.spring(arrowScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cardRotationX = rotateXAnim.interpolate({
    inputRange: [0, 10],
    outputRange: ["0deg", "10deg"],
  });

  const animatedCardStyle = {
    backgroundColor: backgroundColor || "#282828",
    opacity: fadeAnim,
    transform: [
      { scale: scaleAnim },
      { translateY: translateYAnim },
      { perspective: 1000 },
      { rotateX: cardRotationX },
    ],
    shadowOpacity: shadowOpacityAnim,
    elevation: elevationAnim,
  };

  return (
    <Animated.View style={[styles.insuranceCard, animatedCardStyle]}>
      <TouchableOpacity
        style={styles.touchableCardContent}
        onPress={onPress}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.cardContentWrapper}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            {title === "Health"}
            <Animated.View
              style={{
                transform: [
                  { translateX: arrowTranslateX },
                  { scale: arrowScale },
                ],
                opacity: arrowOpacity,
              }}
            >
              <MaterialIcons name="arrow-forward" size={22} color="#E0E0E0" />
            </Animated.View>
          </View>
          {imageSource && (
            <Image
              source={
                typeof imageSource === "string"
                  ? { uri: imageSource }
                  : imageSource
              }
              style={styles.cardImage}
              resizeMode="contain"
            />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Insurance = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser?.userId || {};

  const headerTranslateY = useRef(new Animated.Value(-100)).current;
  const mainTitleTranslateY = useRef(new Animated.Value(-50)).current;
  const mainTitleOpacity = useRef(new Animated.Value(0)).current;
  const mainTitleScale = useRef(new Animated.Value(0.9)).current;

  const subTitleTranslateY = useRef(new Animated.Value(-30)).current;
  const subTitleOpacity = useRef(new Animated.Value(0)).current;

  const contentScale = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  const exploreTranslateY = useRef(new Animated.Value(50)).current;
  const exploreOpacity = useRef(new Animated.Value(0)).current;

  const vehicleInsuranceTranslateY = useRef(new Animated.Value(50)).current;
  const vehicleInsuranceOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.spring(mainTitleTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 120,
          useNativeDriver: false,
        }),
        Animated.spring(mainTitleScale, {
          toValue: 1,
          friction: 8,
          tension: 120,
          useNativeDriver: false,
        }),
        Animated.timing(mainTitleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subTitleTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(subTitleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: false,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(exploreTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(exploreOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(vehicleInsuranceTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(vehicleInsuranceOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const handleInsuranceOptionPress = (optionType) => {
    console.log(`Navigating to ${optionType} insurance details`);
  };

  const insuranceOptions = [
    { title: "Bike", image: bikeImage, color: cardBackgroundColors[2] },
    { title: "Car", image: carImage, color: cardBackgroundColors[1] },
    { title: "Term life", image: termLifeImage, color: "#053B90" }, // Use EnrollGroup's primary color
    { title: "Health", image: healthImage, color: cardBackgroundColors[0] },
    { title: "Savings", image: savingsImage, color: "#004775" }, // Updated 'image' to savingsImage
    { title: "Travel", image: travelImage, color: cardBackgroundColors[4] },
  ];

  const exploreOptions = [
    { title: "Pension", icon: "face" },
    { title: "Cyber Insurance", icon: "security" },
    { title: "Shop", icon: "store" },
    { title: "Hospital cash", icon: "local-hospital" },
    { title: "Home Insurance", icon: "home" },
  ];

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
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Animated.View style={{ transform: [{ translateY: headerTranslateY }] }}>
        <Header userId={userId} navigation={navigation} style={styles.darkHeader} />
      </Animated.View>

      <Animated.View
        style={[
          styles.mainContentArea,
          {
            transform: [
              { scale: contentScale },
              { translateY: contentTranslateY },
            ],
            opacity: contentOpacity,
          },
        ]}
      >
        <View style={styles.bottomSection}>
          <Animated.View
            style={[
              styles.mainTitleContainer,
              {
                transform: [
                  { translateY: mainTitleTranslateY },
                  { scale: mainTitleScale },
                ],
                opacity: mainTitleOpacity,
              },
            ]}
          >
            <Text style={styles.mainTitleBold}>Insurance</Text>
            <Animated.Text
              style={[
                styles.mainTitleNormal,
                {
                  transform: [{ translateY: subTitleTranslateY }],
                  opacity: subTitleOpacity,
                },
              ]}
            >
              Secure what you love
            </Animated.Text>
            <TouchableOpacity style={styles.myPoliciesButton}>
              <MaterialIcons name="list-alt" size={20} color="#053B90" />
              <Text style={styles.myPoliciesText}>My Policies</Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            contentContainerStyle={styles.cardsScrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardsGrid}>
              {insuranceOptions.map((option, index) => (
                <InsuranceCard
                  key={option.title}
                  title={option.title}
                  imageSource={option.image}
                  onPress={() => handleInsuranceOptionPress(option.title)}
                  backgroundColor={option.color}
                  animationDelay={index * 80 + 1000}
                />
              ))}
            </View>

            <Animated.View
              style={[
                styles.exploreOtherContainer,
                {
                  transform: [{ translateY: exploreTranslateY }],
                  opacity: exploreOpacity,
                },
              ]}
            >
              <Text style={styles.exploreOtherTitle}>Explore other insurances</Text>
              <View style={styles.exploreGrid}>
                {exploreOptions.map((option, index) => (
                  <TouchableOpacity key={index} style={styles.exploreItem}>
                    <View style={styles.exploreIconCircle}>
                      <MaterialIcons name={option.icon} size={30} color="#053B90" />
                    </View>
                    <Text style={styles.exploreItemText}>{option.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.insureVehicleContainer,
                {
                  transform: [{ translateY: vehicleInsuranceTranslateY }],
                  opacity: vehicleInsuranceOpacity,
                },
              ]}
            >
              {/* This section was empty in your provided code, adding a placeholder */}
              
            </Animated.View>
          </ScrollView>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90", // Changed to EnrollGroup's primary background
  },
  darkHeader: {
    backgroundColor: "#053B90", // Changed to EnrollGroup's primary background
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: "#fff", // Changed to white to match EnrollGroup's content card
    marginHorizontal: 10, // Added margin to match EnrollGroup's content card
    marginBottom: 50, // Adjusted margin to match EnrollGroup's content card
    borderRadius: 12, // Added borderRadius to match EnrollGroup's content card
    paddingBottom: 0,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 }, // Adjusted shadow to match EnrollGroup
        shadowOpacity: 0.1, // Adjusted shadow to match EnrollGroup
        shadowRadius: 10, // Adjusted shadow to match EnrollGroup
      },
      android: {
        elevation: 8, // Adjusted elevation to match EnrollGroup
      },
    }),
  },
  bottomSection: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff", // Changed to white
    padding: 15, // Adjusted padding to match EnrollGroup's content card
    alignItems: "center",
  },
  mainTitleContainer: {
    width: "100%",
    paddingLeft: 5,
    marginBottom: 12,
    paddingBottom: 20,
    alignItems: "flex-start",
    position: "relative",
  },
  mainTitleBold: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333", // Changed to dark grey
    textAlign: "left",
  },
  mainTitleNormal: {
    fontSize: 18,
    color: "#666", // Changed to softer grey
    marginTop: 0,
    textAlign: "left",
  },
  // --- My Policies Button Styles ---
  myPoliciesButton: {
    position: "absolute",
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FE", // A very light blue, subtle background
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1, // Added a subtle border
    borderColor: "#A7D3FE", // A slightly darker light blue for the border
    shadowColor: "#000", // Subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  myPoliciesText: {
    color: "#053B90", // EnrollGroup's primary blue for text
    fontSize: 14,
    marginLeft: 5,
    fontWeight: "700", // Slightly bolder for emphasis
  },
  // --- End My Policies Button Styles ---
  cardsScrollViewContent: {
    flexGrow: 1,
    paddingBottom: 5,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    width: "100%",
  },
  insuranceCard: {
    width: "48%",
    borderRadius: 12, // Increased border radius
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, // Adjusted shadow
    shadowOpacity: 0.1, // Adjusted shadow
    shadowRadius: 6, // Adjusted shadow
    elevation: 6, // Adjusted elevation
    borderColor: "#E0E0E0", // Changed to a lighter border color
    borderWidth: 1,
    alignItems: "flex-start",
    height: 160,
    justifyContent: "space-between",
  },
  touchableCardContent: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
  },
  cardContentWrapper: {
    width: "100%",
    alignItems: "flex-start",
    flex: 1,
  },
  cardTitleContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    flexShrink: 1,
    marginRight: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#CCC",
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#800080", // Changed to purple
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 5,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardImage: {
    width: "110%",
    height: 85,
    alignSelf: "flex-end",
    resizeMode: "contain",
  },
  exploreOtherContainer: {
    width: "100%",
    marginTop: 20,
    alignItems: "flex-start",
    paddingHorizontal: 5,
  },
  exploreOtherTitle: {
    fontSize: 18,
    fontWeight: "800", // Bolder font weight
    color: "#333", // Changed to dark grey
    marginBottom: 15,
  },
  exploreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    width: "100%",
  },
  exploreItem: {
    alignItems: "center",
    width: "25%",
    marginBottom: 20,
  },
  // --- Explore Icon Circle Styles ---
  exploreIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F2F7FF", // A very light, subtle blue for the background
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1, // Added a thin border
    borderColor: "#D0E0FF", // A slightly darker blue for the border
    shadowColor: "#000", // Subtle shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android shadow
  },
  exploreItemText: {
    color: "#053B90", // EnrollGroup's primary blue for text
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600", // Slightly bolder
  },
  // --- End Explore Icon Circle Styles ---
  insureVehicleContainer: {
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 5,
  },
  insureVehicleButton: {
    flexDirection: "row",
    backgroundColor: "#F0F8FF", // A very light, almost white blue
    borderRadius: 12, // Increased border radius
    padding: 15,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1, // Added a border
    borderColor: "#E0EFFF", // A very light blue for the border
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  insureVehicleTextContent: {
    flex: 1,
  },
  insureVehicleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#053B90", // Changed to primary blue
    marginBottom: 5,
  },
  insureVehicleSubtitle: {
    fontSize: 13,
    color: "#4A90E2", // A medium blue for contrast
  },
  insureVehicleImageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  insureVehicleImage: {
    width: 70,
    height: 70,
    marginRight: 10,
  },
  insureVehicleArrow: {
    color: "#053B90", // Primary blue for the arrow
  },
});

export default Insurance;