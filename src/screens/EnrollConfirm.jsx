import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import Toast from "react-native-toast-message";
import { ContextProvider } from "../context/UserProvider";

const EnrollConfirm = ({ navigation, route }) => {
  const { group_name, tickets } = route?.params || {};
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [scaleValue] = useState(new Animated.Value(0));

  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();

    if (!isConnected || !isInternetReachable) {
      Toast.show({
        type: "info",
        text1: "Offline Mode",
        text2: "Some features might be limited without internet.",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  }, [scaleValue, isConnected, isInternetReachable]); // Updated dependencies

  const handleGoToMyGroups = () => {
    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Navigation Error",
        text2: "User ID is missing. Cannot navigate to My Groups.",
        position: "bottom",
        visibilityTime: 3000,
      });
      return; // Prevent navigation if userId is missing
    }

    navigation.navigate("BottomTab", {
      screen: "PaymentScreen",
      params: { userId: userId }, // Pass the userId to the PaymentScreen
    });
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#053B90" />
         
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header userId={userId} navigation={navigation} />
      <View style={styles.mainContentWrapper}>
        <View style={styles.contentCard}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <AntDesign name="checkcircle" size={100} color="green" />
          </Animated.View>
          <Text style={styles.congratulationsText}>
            Congratulations! You successfully enrolled for {group_name} with{" "}
            {tickets} tickets.
          </Text>
          <Text style={styles.activationText}>
            Account will be activated soon.
          </Text>
          {!isConnected && (
            <Text style={styles.offlineIndicator}>
              You are currently offline.
            </Text>
          )}

          {/* Button to go to My Groups */}
          <TouchableOpacity style={styles.button} onPress={handleGoToMyGroups}>
            {/* Removed conditional rendering for ActivityIndicator */}
            <Text style={styles.buttonText}>Go to My Groups</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  mainContentWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#fff",
    width: "95%",
    borderRadius: 10,
    padding: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  congratulationsText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    color: "#333",
  },
  activationText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  offlineIndicator: {
    fontSize: 14,
    color: "orange",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#053B90",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 20, // Added margin top for spacing from text
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#053B90",
  },
});

export default EnrollConfirm;
