import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import Header from "../components/layouts/Header";
import  { ContextProvider } from "../context/UserProvider";

const { width, height } = Dimensions.get("window");

const About = ({ route, navigation }) => {
 
    const [appUser,setAppUser] = useContext(ContextProvider);
     const userId = appUser.userId || {};

  return (
    <SafeAreaView style={styles.blueBackgroundContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Header title="About Us" userId={userId} navigation={navigation} />
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.whiteContentContainer}
      >
        <View style={styles.aboutUsContainer}>
          {/* Image with simplified styling */}
          <View style={styles.imageFrame}>
            <Image
              source={require('../../assets/image.png')}
              style={styles.aboutImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.aboutTitle}>MY CHITS:</Text>
          <Text style={styles.tagline}>India's 100% Digital Chit Fund Firm</Text>

          <Text style={styles.aboutText}>
            We are a registered chit fund company helping people from all walks of life. We understand the necessity of financial independence and thus connect them with necessary funds when they require it.
          </Text>
          <Text style={styles.aboutText}>
            Join our fast-growing team that's disrupting the traditional chit fund segment and offering exciting new opportunities to retail investors in India.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  blueBackgroundContainer: {
    flex: 1,
    backgroundColor: "#053B90", // Deep blue header/status bar background
    paddingTop: StatusBar.currentHeight || 0,
  },
  scrollViewStyle: {
    flex: 1,
    backgroundColor: '#053B90', // Consistent with the header background
  },
  whiteContentContainer: {
    backgroundColor: "#fff", // White background for the main content area
    borderRadius: 15, // Reduced border radius for a cleaner look
    marginHorizontal: width * 0.03, // Slightly less horizontal margin
    marginTop: height * 0.02, // Slightly reduced top margin
    marginBottom: height * 0.03, // Slightly reduced bottom margin
    paddingVertical: height * 0.035, // Reduced vertical padding
    paddingHorizontal: width * 0.05, // Reduced horizontal padding
    paddingBottom: height * 0.1, // Less space at the very bottom
    shadowColor: "rgba(0, 0, 0, 0.1)", // Lighter shadow
    shadowOffset: { width: 0, height: 5 }, // Reduced lift
    shadowOpacity: 0.12, // Less opaque shadow
    shadowRadius: 8, // Smaller, less diffused shadow
    elevation: 6, // Reduced elevation for Android shadow
    borderWidth: 0.5, // Thin border
    borderColor: '#E8E8E8', // Light grey border
  },

  imageFrame: {
    borderRadius: 10, // Smaller border radius for the image frame
    overflow: 'hidden',
    marginBottom: height * 0.03, // Reduced space below the image frame
    shadowColor: "rgba(0, 0, 0, 0.08)", // Lighter shadow for the image frame
    shadowOffset: { width: 0, height: 3 }, // Reduced shadow offset
    shadowOpacity: 0.15, // Less opaque shadow
    shadowRadius: 5, // Smaller shadow radius
    elevation: 4,
    backgroundColor: '#fff',
  },
  aboutImage: {
    width: '100%',
    height: width * 0.55, 
    alignSelf: 'center',
  },
  aboutTitle: {
    fontSize: width * 0.08, // Slightly smaller title font size
    fontWeight: "800",
    color: "#053B90",
    marginBottom: height * 0.003, // Even closer to tagline
    textAlign: 'center',
    letterSpacing: 1, // Slightly tighter letter spacing
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: width * 0.05, // Slightly smaller tagline
    fontWeight: "600", // Slightly less bold
    color: "#FF9933",
    marginBottom: height * 0.035, // Reduced space below the tagline
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: width * 0.04, // Slightly smaller body text
    lineHeight: width * 0.065, // Slightly reduced line height
    color: "#444", // Softer dark grey for body text
    marginBottom: height * 0.02, // Reduced space between paragraphs
    textAlign: 'justify',
  },
});

export default About;