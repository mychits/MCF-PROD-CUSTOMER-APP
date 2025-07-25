import React, { useContext, useEffect } from "react";
import { View, Text, Button, StyleSheet, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; // Make sure useRoute is imported
import { ContextProvider } from "../context/UserProvider";

const PasswordChanged = () => {
  const navigation = useNavigation();
  const route = useRoute(); // Access route parameters

  const { mobileNumber } = route.params || {};
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userId) {
        console.log("Navigating to BottomTab with userId:", userId);
        navigation.replace("BottomTab", { userId: userId }); // Or 'Home', depending on your setup
      } else {
        console.warn(
          "userId not found in PasswordChanged, navigating to Login with mobile number."
        );
        navigation.replace("Login", { mobileNumber: mobileNumber });
      }
    }, 4000); // Wait for 3 seconds before navigating

    return () => clearTimeout(timer); // Clean up the timer
  }, [userId, mobileNumber, navigation]); // Re-run effect if these change

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/MarkR.png")} // Replace with your success image
        style={styles.successImage}
      />
      <Text style={styles.message}>Password Changed Successfully!</Text>
      <Text style={styles.subMessage}>
        Password Has Been Changed Successfully.You can now log in with your new
        password.
      </Text>
      {/* You might also have a button to manually navigate immediately */}
      {/* <Button title="Go to Login" onPress={() => navigation.replace('Login', { mobileNumber: mobileNumber })} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", // Vertically center
    alignItems: "center", // Horizontally center
    backgroundColor: "#053B90",
    paddingHorizontal: 20,
  },
  successImage: {
    width: 250,
    height: 250,
    marginBottom: 10,
    transform: [{ translateX: 20 }], // Move 20 units to the right
  },
  message: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff", // Changed to white for visibility on dark background
    marginBottom: 5,
  },
  subMessage: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
});

export default PasswordChanged;
