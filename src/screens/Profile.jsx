import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import url from "../data/url"; // Assuming this path is correct for your project
import Header from "../components/layouts/Header"; // Assuming this path is correct for your project
import { ContextProvider } from "../context/UserProvider"; // Assuming this path is correct for your project

const Profile = ({ navigation, route }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [userData, setUserData] = useState({
    full_name: "",
    phone_number: "",
    address: "",
  });
  const menuItems = [
    { title: "Basic Details", icon: "person", link: "MyAccount" },
    { title: "About Us", icon: "info", link: "About" },
    { title: "Privacy Policy", icon: "privacy-tip", link: "Privacy" },
    { title: "Help", icon: "help-outline", link: "Help" },
    { title: "F&Q", icon: "question-answer", link: "Fq" },
    { title: "Reset Password", icon: "lock-reset", link: "ConformNewPassword" },
  ];
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${url}/user/get-user-by-id/${userId}`
        );
        setUserData(response.data); 
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData(); 
  }, [userId]); 

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.headerWrapper}>
        <Header userId={userId} navigation={navigation} />
      </View>
      <View style={styles.mainContentWrapper}>
        <View style={styles.contentCard}>
          <View style={styles.dropdownContainer}>
            <Text style={styles.titleText}>My Profile</Text>
          </View>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileContainer}>
              <Image
                source={require("../../assets/profile (2).png")}
                style={styles.profileImage}
              />
              <Text style={styles.userName}>{userData.full_name}</Text>
              <Text style={styles.phoneNumber}>{userData.phone_number}</Text>
            </View>
          </View>
          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() =>
                  navigation.navigate(item.link, { userId: userId })
                }
              >
                <View style={styles.menuItemLeft}>
                  <MaterialIcons name={item.icon} size={24} color="#585858" />
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#585858" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1, // Takes up the entire screen
    backgroundColor: "#053B90", // Blue background for the entire screen
  },
  headerWrapper: {
    // Platform-specific padding for the status bar on Android
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: "#053B90", // Ensures header background is consistent
  },
  mainContentWrapper: {
    flex: 1, // Takes up the remaining vertical space below the header
    backgroundColor: "#053B90", // Blue background for the outer container
    alignItems: "center", // Center the contentCard horizontally
    paddingVertical: 10, // Add vertical padding
  },
  contentCard: {
    flex: 1, // Allows the contentCard to expand and fill available space
    backgroundColor: "#fff",
    width: "95%", // Occupies 95% of the parent's width
    minWidth: 300, // Minimum width
    maxWidth: 600, // Maximum width for larger screens
    borderRadius: 10, // Rounded corners
    padding: 15, // Inner padding
    overflow: "hidden", // Clips content that goes outside the card's bounds
    shadowColor: "#000", // Shadow for depth
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Android shadow
  },
  profileImageContainer: {
    alignItems: "center", // Center items horizontally
    justifyContent: "center", // Center items vertically
    marginBottom: 10, // Margin below the container
  },
  dropdownContainer: {
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  titleText: {
    marginVertical: -10,
    fontWeight: "900",
    fontSize: 21, // Increased font size
    color: "#333", // Dark grey color
    textAlign: "center", // Centered text
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 7,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 60, // Makes it a circle
    marginBottom: 15,
    borderWidth: 3, // Border around the image
    borderColor: "#053B90", // Blue border color
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#053B90", // Blue text color
    marginBottom: 5,
    textAlign:'center',
  },
  phoneNumber: {
    fontSize: 15,
    color: "#555", // Darker grey text color
    marginBottom: 10,
  },
  menuContainer: {
    // Removed flex: 1 from here to allow ScrollView to calculate content height properly
    width: "100%",
    paddingHorizontal: 0,
    // IMPORTANT: Increased paddingBottom to ensure the logout button is scrollable into view
    paddingBottom: 60, // Adjusted this value to provide more scroll space
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 4, // Decreased margin between items
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 14,
    color: "#000",
    marginLeft: 15,
    fontWeight: "500",
  },
  logoutButton: {
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#053B90", // Blue color for logout button
    borderRadius: 14,
    marginHorizontal: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  logoutText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Profile;
