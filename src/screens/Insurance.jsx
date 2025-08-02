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

import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get("window");

const cardBackgroundColors = [
  "#E0F7FA", // Light Cyan - for Health
  "#FFFDE7", // Very Light Yellow - for Car
  "#F3E5F5", // Light Purple - for Bike
  "#E8F5E5", // Light Green - for Home
  "rgba(251, 233, 231, 0.9)", // Light Peach - for Travel (slightly transparent for layering)
  "#FFF3E0", // Light Orange - for Gold
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
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.bezier(0.25, 0.1, 0.25, 1)),
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(rotateXAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false, // Changed to false
        }),
      ]),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(arrowTranslateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true, // This can remain true as it's on a separate Animated.View
        }),
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true, // This can remain true as it's on a separate Animated.View
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
        useNativeDriver: false, // Already false, keep it
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
        useNativeDriver: false, // Already false, keep it
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
    backgroundColor: backgroundColor || "#FFFFFF",
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
            <Animated.View
              style={{
                transform: [
                  { translateX: arrowTranslateX },
                  { scale: arrowScale },
                ],
                opacity: arrowOpacity,
              }}
            >
              <MaterialIcons name="arrow-forward" size={22} color="#053B90" />
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

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // Changed to false
      }),
      Animated.parallel([
        Animated.spring(mainTitleTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 120,
          useNativeDriver: false, // Changed to false
        }),
        Animated.spring(mainTitleScale, {
          toValue: 1,
          friction: 8,
          tension: 120,
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(mainTitleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false, // Changed to false
        }),
      ]),
      Animated.parallel([
        Animated.timing(subTitleTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(subTitleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: false, // Changed to false
        }),
      ]),
      Animated.parallel([
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false, // Changed to false
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false, // Changed to false
        }),
      ]),
    ]).start();
  }, []);

  const handleInsuranceOptionPress = (optionType) => {
    console.log(`Navigating to ${optionType} insurance details`);
  };

  const insuranceOptions = [
    { title: "Health", image: healthImage, color: cardBackgroundColors[0] },
    { title: "Car", image: carImage, color: cardBackgroundColors[1] },
    { title: "Bike", image: bikeImage, color: cardBackgroundColors[2] },
    { title: "Home", image: homeImage, color: cardBackgroundColors[3] },
    { title: "Travel", image: travelImage, color: cardBackgroundColors[4] },
    { title: "Gold", image: goldImage, color: cardBackgroundColors[5] },
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
      <StatusBar barStyle="dark-content" backgroundColor="#F0F8FF" />
      <Animated.View style={{ transform: [{ translateY: headerTranslateY }] }}>
        <Header userId={userId} navigation={navigation} />
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
                  animationDelay={index * 80 + 1700}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: "#053B90",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 20,
      paddingBottom: 45,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  bottomSection: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
      
  },
  mainTitleContainer: {
    width: "100%",
    paddingLeft: 5,
    marginBottom: 12,
     paddingBottom: 55,
    alignItems: "flex-start",
  },
  mainTitleBold: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#053B90",
    textAlign: "left",
  },
  mainTitleNormal: {
    fontSize: 18,
    color: "#555555",
    marginTop: 0,
    textAlign: "left",
  },
  cardsScrollViewContent: {
    flexGrow: 1,
    paddingBottom: 5,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 0,
    width: "100%",
  },
  insuranceCard: {
    width: "46%",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
    borderColor: "#E6EBF5",
    borderWidth: 1,
    alignItems: "flex-start",
    height: 120,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#053B90",
    flexShrink: 1,
    marginRight: 8,
  },
  cardImage: {
    width: "160%",
    height: 60,
    alignSelf: "flex-start",
    resizeMode: "contain",
  },
});

export default Insurance;