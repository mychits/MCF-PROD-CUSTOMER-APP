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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import url from "../data/url";
import bikeImage from "../../assets/bike.png";
import carImage from "../../assets/car.png";
import healthImage from "../../assets/health.png";
import termLifeImage from "../../assets/Termlife.png";

import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get("window");

const cardBackgroundColors = [
  "#004775",
  "#357500",
  "#800080",
  "#E74C3C",
  "#FF6347",
  "#2ECC71",
];

// -------------------- InsuranceCard ---------------------
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

  useEffect(() => {
    Animated.sequence([
      Animated.delay(animationDelay || 0),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: false }),
        Animated.timing(translateYAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(rotateXAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]),
    ]).start();
  }, [animationDelay]);

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
    <View style={{ width: "48%", marginBottom: 25 }}>
      {/* Card content */}
      <Animated.View style={[styles.insuranceCard, animatedCardStyle]}>
        <TouchableOpacity
          style={styles.touchableCardContent}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <View style={styles.cardContentWrapper}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
            </View>
            {imageSource && (
              <Image
                source={typeof imageSource === "string" ? { uri: imageSource } : imageSource}
                style={styles.cardImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* 🚨 Button now BELOW the card */}
      <TouchableOpacity style={styles.enquireButtonBelow} onPress={onPress}>
        <Text style={styles.enquireButtonText}>Enquire Now</Text>
      </TouchableOpacity>
    </View>
  );
};

// -------------------- Main Screen -----------------------
const Insurance = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId || "default_user_id";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const headerTranslateY = useRef(new Animated.Value(-100)).current;
  const mainTitleTranslateY = useRef(new Animated.Value(-50)).current;
  const mainTitleOpacity = useRef(new Animated.Value(0)).current;
  const mainTitleScale = useRef(new Animated.Value(0.9)).current;
  const subTitleTranslateY = useRef(new Animated.Value(-30)).current;
  const subTitleOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerTranslateY, { toValue: 0, duration: 400, useNativeDriver: false }),
      Animated.parallel([
        Animated.spring(mainTitleTranslateY, { toValue: 0, friction: 8, tension: 120, useNativeDriver: false }),
        Animated.spring(mainTitleScale, { toValue: 1, friction: 8, tension: 120, useNativeDriver: false }),
        Animated.timing(mainTitleOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(subTitleTranslateY, { toValue: 0, duration: 350, useNativeDriver: false }),
        Animated.timing(subTitleOpacity, { toValue: 1, duration: 350, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.spring(contentScale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: false }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]),
    ]).start();
  }, []);

  const handleInsuranceOptionPress = (optionType) => {
    Alert.alert(
      "Confirm Enquiry",
      `Are you sure you want to enquire about ${optionType} insurance?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Okay", onPress: () => submitEnquiry(optionType) },
      ]
    );
  };

  const submitEnquiry = async (optionType) => {
    setMessage(null);
    setLoading(true);

    try {
      const postData = {
        customer_id: userId,
        insurance_type: [optionType.toLowerCase()],
      };
      const response = await axios.post(`${url}/insurance`, postData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.message === "updated enquiry") {
        setMessage(`Success! Your interest in ${optionType} has been recorded.`);
        Alert.alert("Success", `Your interest in ${optionType} has been recorded.`);
      } else {
        setMessage(`Request for ${optionType} succeeded, but server response was unexpected.`);
      }
    } catch (error) {
      setMessage(`Failed to record your interest in ${optionType}. Please try again.`);
      Alert.alert("Error", `Failed to record your interest in ${optionType}.`);
    } finally {
      setLoading(false);
    }
  };

  const insuranceOptions = [
    { title: "Bike", image: bikeImage, color: cardBackgroundColors[2] },
    { title: "Car", image: carImage, color: cardBackgroundColors[1] },
    { title: "Term", image: termLifeImage, color: "#053B90" },
    { title: "Health", image: healthImage, color: cardBackgroundColors[0] },
  ];

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : insets.top },
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
            transform: [{ scale: contentScale }, { translateY: contentTranslateY }],
            opacity: contentOpacity,
          },
        ]}
      >
        <View style={styles.bottomSection}>
          <Animated.View
            style={[
              styles.mainTitleContainer,
              {
                transform: [{ translateY: mainTitleTranslateY }, { scale: mainTitleScale }],
                opacity: mainTitleOpacity,
              },
            ]}
          >
            <Text style={styles.mainTitleBold}>Insurance</Text>
            <Animated.Text
              style={[
                styles.mainTitleNormal,
                { transform: [{ translateY: subTitleTranslateY }], opacity: subTitleOpacity },
              ]}
            >
              Secure what you love
            </Animated.Text>
            <TouchableOpacity style={styles.myPoliciesButton}>
              <MaterialIcons name="list-alt" size={20} color="#053B90" />
              <Text style={styles.myPoliciesText}>My Policies</Text>
            </TouchableOpacity>
          </Animated.View>

          {loading && (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="small" color="#053B90" />
              <Text style={styles.statusText}>Processing request...</Text>
            </View>
          )}
          {message && !loading && (
            <View
              style={[
                styles.statusContainer,
                message.includes("Success") && styles.statusContainerSuccess,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  message.includes("Success") && styles.statusTextSuccess,
                ]}
              >
                {message}
              </Text>
            </View>
          )}

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
          </ScrollView>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// -------------------- Styles ----------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#053B90" },
  darkHeader: { backgroundColor: "#053B90" },
  mainContentArea: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 50,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  bottomSection: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
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
  mainTitleBold: { fontSize: 26, fontWeight: "bold", color: "#333", textAlign: "left" },
  mainTitleNormal: { fontSize: 18, color: "#666", textAlign: "left" },
  myPoliciesButton: {
    position: "absolute",
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FE",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7D3FE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  myPoliciesText: { color: "#053B90", fontSize: 14, marginLeft: 5, fontWeight: "700" },
  cardsScrollViewContent: { flexGrow: 1, paddingBottom: 5 },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  insuranceCard: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    alignItems: "flex-start",
    height: 160,
    justifyContent: "space-between",
  },
  touchableCardContent: { flex: 1, width: "100%", justifyContent: "space-between" },
  cardContentWrapper: { width: "100%", alignItems: "flex-start", flex: 1, justifyContent: "space-between" },
  cardTitleContainer: { width: "100%", marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  cardImage: { width: "110%", height: 85, alignSelf: "flex-end", resizeMode: "contain" },
  statusContainer: {
    width: "90%",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: "#053B90",
    textAlign: "center",
  },
  // Added styling for success message container
  statusContainerSuccess: {
    backgroundColor: '#E8F6F3', // Light green background
    borderColor: '#4CAF50', // Green border
    borderWidth: 1,
    borderRadius:14,
  },
  // Added styling for success message text
  statusTextSuccess: {
    color: '#4CAF50', // Green text
    fontWeight: 'bold',
  },
  enquireButtonBelow: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#053B90",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginTop: 8,
  },
  enquireButtonText: {
    color: "#053B90",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default Insurance;