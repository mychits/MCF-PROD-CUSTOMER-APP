import React, { useEffect } from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const FlashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login"); // Ensure 'Login' matches your registered screen name in your navigator.
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]); // Re-run effect if navigation object changes (though it typically won't).

  return (
    <View style={styles.container}>
      {/* Container for the image and text, centered within the main container. */}
      <View style={styles.imageTextContainer}>
        {/* Image component: Displays the logo from assets. */}
        {/* Ensure the path '../../assets/Group400.png' is correct for your project structure. */}
        <Image
          source={require("../../assets/Group400.png")}
          style={styles.image}
        />
        {/* Text component: Displays the app name. */}
        {/* This text is correctly wrapped in a <Text> component. */}
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
