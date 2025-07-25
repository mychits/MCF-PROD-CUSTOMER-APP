import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity } from "react-native";
import LottieView from "lottie-react-native";
import axios from "axios"; // Import axios for API calls
import url from "../data/url"; // Import your URL data
import Header from "../components/layouts/Header"; // Import Header component
import { NetworkContext } from '../context/NetworkProvider';
import  { ContextProvider } from "../context/UserProvider";

const { width, height } = Dimensions.get("window");

const FeatureComingSoon = ({ route, navigation }) => { // Accept route and navigation props
 
     const [appUser,setAppUser] = useContext(ContextProvider);
      const userId = appUser.userId || {};

 
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

 
  const [userData, setUserData] = useState({ full_name: '', phone_number: '' });
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [userDataError, setUserDataError] = useState(null);

 
  const fetchUserData = async () => {
    if (!isConnected || !isInternetReachable) {
      setIsLoadingUserData(false);
      setUserDataError("No internet connection.");
      setUserData({ full_name: '', phone_number: '' });
      return;
    }

    setIsLoadingUserData(true);
    setUserDataError(null);
    try {
      const response = await axios.get(`${url}/user/get-user-by-id/${userId}`);
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data for FeatureComingSoonScreen:', error);
      setUserDataError("Failed to fetch user data.");
    } finally {
      setIsLoadingUserData(false);
    }
  };

 
  useEffect(() => {
    if (userId) { // Only fetch if userId is available
      fetchUserData();
    }
  }, [userId, isConnected, isInternetReachable]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Header userId={userId} navigation={navigation} /> {/* Render the Header component */}

      {isLoadingUserData ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#053B90" />
         
        </View>
      ) : userDataError || !isConnected || !isInternetReachable ? (
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>
            {userDataError || (isConnected ? "Connected to a network, but internet might not be reachable." : "You are currently offline. Please check your internet connection.")}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <LottieView
            source={require("../../assets/animations/comingSoon.json")}
            autoPlay
            loop
            style={styles.animation}
          />

        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: Dimensions.get('window').width * 0.05,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#053B90',
  },
  animation: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
  },
  comingSoonText: {
    marginTop: Dimensions.get('window').height * 0.02,
    fontSize: Dimensions.get('window').width * 0.045,
    fontWeight: "bold",
    color: "#053B90", // Changed to match app's primary color
    textAlign: "center",
    paddingHorizontal: Dimensions.get('window').width * 0.05,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#053B90',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeatureComingSoon;