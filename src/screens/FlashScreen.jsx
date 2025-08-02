import React, { useEffect } from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const FlashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]); 

  return (
    <View style={styles.container}>
      <View style={styles.imageTextContainer}>
        <Image
          source={require("../../assets/Group400.png")}
          style={styles.image}
        />
        <Text style={styles.mainText}>MyChits</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensures the container takes up all available space.
    width: width, // Explicitly set width to full screen width.
    height: height, // Explicitly set height to full screen height.
    backgroundColor: "#053B90", // Deep blue background color.
    alignItems: "center", // Center content horizontally.
    justifyContent: "center", // Center content vertically.
  },
  imageTextContainer: {
    alignItems: "center", // Center items horizontally within this container.
    justifyContent: "center", // Center items vertically within this container.
    marginBottom: height * 0.2, // Add some bottom margin relative to screen height.
  },
  image: {
    width: 122, // Fixed width for the image.
    height: 121, // Fixed height for the image.
    resizeMode: "contain", // Ensures the whole image is visible within its bounds.
  },
  mainText: {
    color: "#FFFFFF", // White text color.
    fontSize: 36, // Large font size.
    fontWeight: "700", // Bold font weight.
    textAlign: "center", // Center align the text.
    fontFamily: "Roboto", // Specify Roboto font. Ensure this font is loaded if custom.
    marginTop: 0, // No top margin (default).
    letterSpacing: 1, // Slightly increased letter spacing.
  },
});

export default FlashScreen;
