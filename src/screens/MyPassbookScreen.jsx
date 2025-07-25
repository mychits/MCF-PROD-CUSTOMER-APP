import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  TouchableOpacity,
  Image,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Header from "../components/layouts/Header";

import url from "../data/url";
import axios from "axios";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get("window");

const MyPassbookScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const [currentUserId, setCurrentUserId] = useState(userId || null);
  const [chitGroups, setChitGroups] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [enrolledGroupsCount, setEnrolledGroupsCount] = useState(0);

  const fetchAllOverview = useCallback(async () => {
    if (!currentUserId) {
      console.warn("userId is undefined. Cannot fetch user data.");
      setIsLoadingData(false);
      setDataError(
        "User ID not found. Please log in again or navigate correctly."
      );
      return;
    }
    setIsLoadingData(true);
    setDataError(null);
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets-report/${currentUserId}`
      );
      const data = Array.isArray(response.data) ? response.data : [];

      const totalPaidAmount = data.reduce(
        (sum, group) => sum + (group?.payments?.totalPaidAmount || 0),
        0
      );
      setTotalPaid(totalPaidAmount);

      const totalProfitAmount = data.reduce(
        (sum, group) => sum + (group?.profit?.totalProfit || 0),
        0
      );
      setTotalProfit(totalProfitAmount);

      setChitGroups(data);
      setEnrolledGroupsCount(data.length);

      setIsLoadingData(false);
    } catch (error) {
      console.error("Error fetching overview and chit data:", error);
      setDataError(
        "Join a group to track your payments here!"
      );
      Toast.show({
        type: "error",
        text1: "Data Load Error",
        text2: "Could not load your passbook details. Please try again.",
        position: "bottom",
        visibilityTime: 4000,
      });
      setIsLoadingData(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      setCurrentUserId(userId);
      if (userId) {
        fetchAllOverview();
      } else {
        setIsLoadingData(false);
        setDataError(
          "User ID is missing from navigation. Cannot load passbook."
        );
      }
    }, [userId, fetchAllOverview])
  );

  const handleViewAllChits = () => {
    Vibration.vibrate(50);
    navigation.navigate("Mygroups", {
      userId: currentUserId,
    });
  };

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#053B90" />
      </SafeAreaView>
    );
  }

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
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Header
        userId={currentUserId}
        navigation={navigation}
        title="My Passbook"
      />

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollViewContent}
      >
        <View style={styles.contentArea}>
          <Text style={styles.mainTitle}>Your Financial Snapshot</Text>
          <Text style={styles.subtitle}>
            A quick look at your investments & returns.
          </Text>

          {dataError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{dataError}</Text>
              <TouchableOpacity
                onPress={fetchAllOverview}
                style={styles.retryButton}
              >
                
              </TouchableOpacity>
            </View>
          )}

          {/* Summary Cards - Enhanced Layout */}
          <View style={styles.summaryCardsColumn}>
            {/* Investment Card */}
            <View style={[styles.summaryCard, styles.investmentCardBackground]}>
              <FontAwesome5
                name="wallet"
                size={24}
                color="#E0E0E0"
                style={styles.summaryIcon}
              />
              <View style={styles.summaryTextContent}>
                <Text style={styles.summaryLabel}>Total Investment</Text>
                <Text style={styles.summaryAmount}>
                  ₹ {totalPaid.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
            {/* Profit Card */}
            <View style={[styles.summaryCard, styles.profitCardBackground]}>
              <FontAwesome5
                name="chart-line"
                size={24}
                color="#E0E0E0"
                style={styles.summaryIcon}
              />
              <View style={styles.summaryTextContent}>
                <Text style={styles.summaryLabel}>Total Dividend / Profit</Text>
                <Text style={styles.summaryAmount}>
                  ₹ {totalProfit.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
            {/* Enrolled Groups Card */}
            <View
              style={[styles.summaryCard, styles.enrolledGroupsCardBackground]}
            >
              <MaterialIcons
                name="group"
                size={28}
                color="#E0E0E0"
                style={styles.summaryIcon}
              />
              <View style={styles.summaryTextContent}>
                <Text style={styles.summaryLabel}>Enrolled Groups</Text>
                <Text style={styles.summaryAmount}>{enrolledGroupsCount}</Text>
              </View>
            </View>
          </View>

          {/* Section Header for Chit Groups */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Chit Groups</Text>
            {/* Only show "View All" if there are groups to view or if not loading/error */}
            {(chitGroups.length > 0 || (!isLoadingData && !dataError)) && (
              <TouchableOpacity
                onPress={handleViewAllChits}
                style={styles.viewAllButton} // Apply new style here
              >
                <Text style={styles.viewAllText}>
                  View All{" "}
                  <Ionicons
                    name="arrow-forward-outline"
                    size={16}
                    color="#007BFF"
                  />
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Display No Data message if no groups */}
          {chitGroups.length === 0 && !isLoadingData && !dataError && (
            <View style={styles.noDataContainer}>
              <Image
                source={NoGroupImage}
                style={styles.noGroupImage}
                resizeMode="contain"
              />
              <Text style={styles.noDataText}>
                No Chit Groups Enrolled Yet!
              </Text>
              <Text style={styles.noDataSubText}>
                It looks like you haven't joined any groups. Explore available
                chits and start your journey!
              </Text>
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={() => navigation.navigate("Discover")}
              >
                <Text style={styles.enrollButtonText}>Discover Groups</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#053B90",
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
    
  },
  mainScrollView: {
    flex: 1,
    width: "100%",
  },
  mainScrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingBottom: 55,
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#F0F8FF",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#053B90",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.05)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 18,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 25,
    borderColor: "#EF5350",
    borderWidth: 1,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },

  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 30,
    marginBottom: 50,
  },
  noGroupImage: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 25,
  },
  noDataText: {
    fontSize: 22,
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
    lineHeight: 28,
  },
  noDataSubText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  enrollButton: {
    backgroundColor: "#053B90",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  enrollButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 5,
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#053B90",
  },
  viewAllText: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "600",
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E6F0FF',
    borderWidth: 1,
    borderColor: '#A9D6E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginLeft: 10, // Added space here!
  },
  summaryCardsColumn: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 15,
    width: "100%",
  },
  summaryCard: {
    width: "100%",
    padding: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 110,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  investmentCardBackground: {
    backgroundColor: "#053B90",
  },
  profitCardBackground: {
    backgroundColor: "#2E7D32",
  },
  enrolledGroupsCardBackground: {
    backgroundColor: "#6A1B9A",
  },
  summaryIcon: {
    marginRight: 20,
  },
  summaryTextContent: {
    flex: 1,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#E0E0E0",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default MyPassbookScreen;