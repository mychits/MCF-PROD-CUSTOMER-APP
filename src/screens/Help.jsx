import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Linking,
  BackHandler, // Import BackHandler
  Platform,    // Import Platform
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { ContextProvider } from "../context/UserProvider";

const { width, height } = Dimensions.get("window");

const Help = ({ route, navigation }) => {
//   const { userId } = route.params || {};
   const [appUser,setAppUser] = useContext(ContextProvider);
    const userId = appUser.userId || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // --- Back Button Handling for Android ---
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const onBackPress = () => {
          // Navigate to the HomeScreen within the BottomTab navigator
          // This will go back to the tab navigator and specifically select the Home screen
          navigation.navigate('BottomTab', { screen: 'HomeScreen' });
          return true; // Indicate that we've handled the back press
        };

        // Add event listener when the screen is focused
        // This now returns a subscription object
        const subscription = BackHandler.addEventListener(
          'hardwareBackPress',
          onBackPress
        );

        // Clean up the event listener when the screen loses focus
        return () => {
          // Call the remove method on the subscription object
          subscription.remove();
        };
      }
      return undefined; // Return undefined for iOS or if no custom handling
    }, [navigation]) // Dependency on navigation to ensure it's current
  );

  const handleSubmit = () => {
    const recipientEmail = 'info.mychits@gmail.com';
    // Corrected emailBody string interpolation
    const emailBody = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`;
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(emailBody);
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;

    Linking.openURL(mailtoUrl)
      .then(() => {
        console.log("Email client opened successfully.");
        // Clear form fields after successful attempt
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      })
      .catch((err) => {
        console.error("Failed to open email client:", err);
        // Using alert for demonstration; consider a custom modal or Toast in a real app
        alert("Could not open email app. Please send your message to info.mychits@gmail.com directly.");
      });
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const openWhatsApp = () => {
    const phoneNumber = '+919483900777';
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(whatsappUrl)
      .catch((err) => {
        console.error("Failed to open WhatsApp:", err);
        // Using alert for demonstration; consider a custom modal or Toast in a real app
        alert("WhatsApp is not installed on your device, or an error occurred.");
      });
  };

  const address = "11/36-25, Third Floor, 2nd Main, Kathriguppe Main Road, Banashankari Stage 3, Bengaluru Karnataka - 560085";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;


  return (
    <SafeAreaView style={styles.blueBackgroundContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Header title="Help & Support" userId={userId} navigation={navigation} />
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.whiteContentContainer}
      >
        {/* Registered Office Section */}
        <Text style={styles.sectionTitle}>Registered Office</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => openLink(mapsUrl)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="location-on" size={22} color="#053B90" />
            <Text style={styles.contactText}>
              {address}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL('tel:+919483900777')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="phone" size={22} color="#053B90" />
            <Text style={styles.contactText}>+91 94839 00777</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:info.mychits@gmail.com')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="email" size={22} color="#053B90" />
            <Text style={styles.contactText}>info.mychits@gmail.com</Text>
          </TouchableOpacity>
        </View>

        {/* Send us a Message Form Section */}
        <Text style={[styles.sectionTitle, { marginTop: height * 0.03 }]}>Send us a Message</Text>
        <View style={styles.formContainer}>
          <TextInput
            style={[
              styles.input,
              focusedField === 'name' && styles.focusedInput
            ]}
            placeholder="Your Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
          <TextInput
            style={[
              styles.input,
              focusedField === 'email' && styles.focusedInput
            ]}
            placeholder="Your Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
          <TextInput
            style={[
              styles.input,
              focusedField === 'phone' && styles.focusedInput
            ]}
            placeholder="Your Phone Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
          />
          <TextInput
            style={[
              styles.input,
              focusedField === 'subject' && styles.focusedInput
            ]}
            placeholder="Subject of your message"
            placeholderTextColor="#999"
            value={subject}
            onChangeText={setSubject}
            onFocus={() => setFocusedField('subject')}
            onBlur={() => setFocusedField(null)}
          />
          <TextInput
            style={[
              styles.input,
              styles.messageInput,
              focusedField === 'message' && styles.focusedInput
            ]}
            placeholder="Your Message"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            onFocus={() => setFocusedField('message')}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
            <LinearGradient
              colors={['#053B90', '#1A75FF', '#2A9DF4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.submitButtonText}>Send Message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Connect With Us Social Media Section */}
        <Text style={[styles.sectionTitle, { marginTop: height * 0.02 }]}>Connect With Us</Text>
        <View style={styles.socialMediaContainer}>
          <TouchableOpacity onPress={() => openLink('https://www.facebook.com/MyChits')} style={styles.socialIcon} activeOpacity={0.7}>
            <LinearGradient
              colors={['#3b5998', '#4267B2']} // Facebook blue
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientIcon}
            >
              <FontAwesome name="facebook" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openLink('https://www.instagram.com/my_chits/')} style={styles.socialIcon} activeOpacity={0.7}>
            <LinearGradient
              colors={['#833AB4', '#C13584', '#FD1D1D', '#F56040', '#FFDC80']} // Instagram gradient
              start={{ x: 0.0, y: 1.0 }}
              end={{ x: 1.0, y: 0.0 }}
              style={styles.gradientIcon}
            >
              <FontAwesome name="instagram" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={openWhatsApp} style={styles.socialIcon} activeOpacity={0.7}>
            <LinearGradient
              colors={['#25D366', '#128C7E']} // WhatsApp green
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientIcon}
            >
              <FontAwesome name="whatsapp" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Base Background (Header and overall screen)
  blueBackgroundContainer: {
    flex: 1,
    backgroundColor: "#053B90",
    paddingTop: StatusBar.currentHeight || 0,
  },
  // Main Scrollable Area Background
  scrollViewStyle: {
    flex: 1,
    backgroundColor: '#053B90',
  },
  // Main Content Card
  whiteContentContainer: {
    backgroundColor: "#fff",
    borderRadius: 20, // Reduced radius
    marginHorizontal: width * 0.03, // More reduced horizontal margin
    marginTop: height * 0.018, // More reduced top margin
    marginBottom: height * 0.03, // More reduced bottom margin
    paddingVertical: height * 0.03, // More reduced vertical padding
    paddingHorizontal: width * 0.04, // More reduced horizontal padding
    paddingBottom: height * 0.08, // Adjusted bottom padding
    shadowColor: "rgba(0, 0, 0, 0.15)", // Lighter shadow
    shadowOffset: { width: 0, height: 8 }, // Less lift
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 0.3, // Even thinner border
    borderColor: '#F0F0F0', // Even lighter border
  },

  // --- Section Titles ---
  sectionTitle: {
    fontSize: width * 0.055, // Smaller title font size
    // fontFamily: 'Montserrat_700Bold', // Commented out as this font might not be loaded
    fontWeight: "bold",
    color: "#053B90",
    marginBottom: height * 0.02, // Reduced space below titles
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1, // Tighter letter spacing
    textShadowColor: 'rgba(0, 0, 0, 0.08)', // Even softer text shadow
    textShadowOffset: { width: 0.7, height: 1.2 },
    textShadowRadius: 1,
  },

  // --- Registered Office Section Card ---
  sectionCard: {
    backgroundColor: '#F8F8FD',
    borderRadius: 14, // Smaller radius
    padding: width * 0.04, // Reduced internal padding
    marginBottom: height * 0.03, // Reduced space below this section card
    shadowColor: "rgba(0, 0, 0, 0.06)", // Lighter shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0.7, // Thinner border
    borderColor: '#F8F8FD', // Subtle border color
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015, // Reduced space between items
    paddingHorizontal: width * 0.025, // Reduced horizontal padding
    paddingVertical: height * 0.012, // Reduced vertical padding
    borderRadius: 8, // Smaller radius for contact items
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4, // Thinner left border
    borderColor: '#FF9933',
    shadowColor: "rgba(0, 0, 0, 0.04)", // Even softer shadow
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1.5,
  },
  contactText: {
    fontSize: width * 0.035, // Even smaller contact text font size
    color: "#333",
    marginLeft: width * 0.025, // Reduced space between icon and text
    flexShrink: 1,
    // fontFamily: 'Roboto_500Medium', // Commented out as this font might not be loaded
    fontWeight: '500',
    lineHeight: width * 0.048, // Adjusted line height
  },

  // --- Form Section ---
  formContainer: {
    width: '100%',
    padding: width * 0.05, // Reduced padding inside the form container
    backgroundColor: '#fff',
    borderRadius: 16, // Smaller radius for the form box
    shadowColor: "rgba(0, 0, 0, 0.12)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 0.7, // Thinner border
    borderColor: '#E5E5E5',
  },
  input: {
    borderWidth: 0.8, // Even thinner border
    borderColor: '#E5E5E5', // Lighter border
    borderRadius: 8, // Smaller radius for inputs
    padding: width * 0.03, // Reduced padding inside inputs
    marginBottom: height * 0.015, // Reduced space between inputs
    fontSize: width * 0.038, // Even smaller input text font size
    color: '#333',
    backgroundColor: '#F9F9F9', // Lighter background
    shadowColor: "rgba(0,0,0,0.04)",
    shadowOffset: { width: 0, height: 0.8 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 0.5,
  },
  focusedInput: {
    borderColor: '#1A75FF',
    shadowColor: 'rgba(26, 117, 255, 0.2)', // Softer shadow for focus
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  messageInput: {
    height: height * 0.12, // Even shorter message input
    textAlignVertical: 'top',
  },

  // --- Submit Button (with LinearGradient) ---
  submitButton: {
    borderRadius: 14, // Smaller radius for button
    overflow: 'hidden',
    marginTop: height * 0.025, // Reduced space above button
    shadowColor: "rgba(5, 59, 144, 0.3)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.002 }], // Even more subtle scale for emphasis
  },
  gradientButton: {
    paddingVertical: height * 0.02, // Reduced button padding
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: width * 0.045, // Even smaller button text font size
    // fontFamily: 'Montserrat_700Bold', // Commented out as this font might not be loaded
    fontWeight: 'bold',
    letterSpacing: 0.8, // Tighter letter spacing
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0.7, height: 1.5 },
    textShadowRadius: 2,
  },

  // --- Social Media Section ---
  socialMediaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: width * 0.07, // Reduced gap between icons
    marginTop: height * 0.012, // Reduced space after section title (from 0.03 to 0.015)
    marginBottom: height * 0.05, // Adjusted this as well for overall bottom spacing (from 0.1 to 0.05)
  },
  socialIcon: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: "rgba(0, 0, 0, 0.1)", // Generic subtle shadow for the social icons
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    transform: [{ scale: 1.02 }], // Even smaller scale for emphasis
  },
 gradientIcon: {
    width: 48, // Set a fixed width
    height: 48, // Set a fixed height, equal to width for a perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24, // Half of the width/height to make it a perfect circle
  },
});

export default Help;