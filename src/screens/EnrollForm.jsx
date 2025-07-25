import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import url from "../data/url";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import Toast from "react-native-toast-message";
import { ContextProvider } from "../context/UserProvider";

// Helper function to format numbers with commas in Indian style (e.g., 2,51,500)
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) {
    return "0";
  }
  const parts = num.toString().split('.');
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  // Handle negative numbers
  let isNegative = false;
  if (integerPart.startsWith('-')) {
    isNegative = true;
    integerPart = integerPart.substring(1);
  }

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (isNegative ? '-' : '') + formattedOtherNumbers + ',' + lastThree + decimalPart;
  } else {
    return (isNegative ? '-' : '') + lastThree + decimalPart;
  }
};

const EnrollForm = ({ navigation, route }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const { groupId } = route.params || {};
  const [ticketCount, setTicketCount] = useState(1); // Default to 1 ticket
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cardsData, setCardsData] = useState(null);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [termsRead, setTermsRead] = useState(false);

  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (route.params?.termsReadConfirmed) {
        setTermsRead(true);
        navigation.setParams({ termsReadConfirmed: false });
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const fetchData = useCallback(async () => {
    if (!isConnected || !isInternetReachable) {
      setLoading(false);
      setError("No internet connection. Please check your network.");
      setCardsData(null);
      setAvailableTickets([]);
      return;
    }

    if (!groupId) {
      setLoading(false);
      setError("Group ID is missing. Cannot fetch group details.");
      setCardsData(null);
      setAvailableTickets([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const groupResponse = await fetch(
        `${url}/group/get-by-id-group/${groupId}`
      );
      if (groupResponse.ok) {
        const data = await groupResponse.json();
        setCardsData(data);
      } else {
        const errorData = await groupResponse.json();
        console.error(
          "Failed to fetch group details:",
          groupResponse.status,
          errorData
        );
        setError(
          `Failed to load group details: ${errorData.message || "Unknown error"
          }`
        );
        setCardsData(null);
      }

      const ticketsResponse = await axios.post(
        `${url}/enroll/get-next-tickets/${groupId}`
      );
      const fetchedTickets = Array.isArray(
        ticketsResponse.data.availableTickets
      )
        ? ticketsResponse.data.availableTickets
        : [];
      setAvailableTickets(fetchedTickets);

      setTicketCount(fetchedTickets.length > 0 ? 1 : 0);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response) {
        console.error("Error response data:", err.response.data);
        setError(
          `Error fetching data: ${err.response.data.message || "Server error"}`
        );
      } else if (err.request) {
        console.error("Error request:", err.request);
        setError(
          "Network error: No response from server. Please check the URL or server status."
        );
      } else {
        console.error("Error message:", err.message);
        setError(`An unexpected error occurred: ${err.message}`);
      }
      setCardsData(null);
      setAvailableTickets([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, isConnected, isInternetReachable]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnroll = useCallback(async () => {
    if (!termsAccepted) {
      Toast.show({
        type: "error",
        text1: "Required",
        text2: "Please accept the Terms & Conditions and Privacy Policy.",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    if (ticketCount <= 0 || ticketCount > availableTickets.length) {
      Toast.show({
        type: "error",
        text1: "Invalid Ticket Count",
        text2: `Please select between 1 and ${availableTickets.length} tickets.`,
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    if (availableTickets.length === 0) {
      Toast.show({
        type: "error",
        text1: "No Tickets Available",
        text2: "Cannot enroll as no tickets are currently available.",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    Alert.alert(
      "Confirm Enrollment",
      `You are about to enroll for "${cardsData?.group_name || "this group"
      }" with ${ticketCount} ticket(s). Do you want to proceed?`,
      [
        {
          text: "Cancel",
          onPress: () => {
            console.log("Enrollment cancelled by user.");
            setIsSubmitting(false);
          },
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            setIsSubmitting(true);

            if (!isConnected || !isInternetReachable) {
              Toast.show({
                type: "error",
                text1: "No Internet Connection",
                text2: "Please check your network and try again.",
                position: "bottom",
                visibilityTime: 3000,
              });
              setIsSubmitting(false);
              return;
            }

            const ticketsCountInt = parseInt(ticketCount, 10);

            const payload = {
              group_id: groupId,
              user_id: userId,
              no_of_tickets: ticketsCountInt,
              tickets: availableTickets[0],
              chit_asking_month: Number(cardsData?.group_duration) || 0,
            };

            console.log("Payload being sent:", payload);

            try {
              await axios.post(`${url}/enroll/add-enroll`, payload, {
                headers: {
                  "Content-Type": "application/json",
                },
              });

              Toast.show({
                type: "success",
                text1: "Enrollment Successful!",
                text2: `You are enrolled for ${cardsData?.group_name || "the group"
                  } with ${ticketsCountInt} ticket(s).`,
                position: "bottom",
                visibilityTime: 3000,
              });
              navigation.navigate("EnrollConfirm", {
                group_name: cardsData?.group_name,
                tickets: ticketsCountInt,
                userId: userId,
              });
            } catch (err) {
              console.error("Error enrolling user:", err);
              let errorMessage =
                "An error occurred during enrollment. Please try again.";

              if (err.response) {
                console.error("Error response data:", err.response.data);
                errorMessage =
                  err.response.data.data.message ||
                  `Server error: ${err.response.status}`;
              } else if (err.request) {
                console.error("Error request:", err.request);
                errorMessage =
                  "Network error: No response from server. Please check the URL or server status.";
              } else {
                console.error("Error message:", err.message);
                errorMessage = `An unexpected error occurred: ${err.message}`;
              }

              Toast.show({
                type: "error",
                text1: "Enrollment Failed",
                text2: errorMessage,
                position: "bottom",
                visibilityTime: 3000,
              });
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [
    ticketCount,
    termsAccepted,
    isConnected,
    isInternetReachable,
    availableTickets,
    groupId,
    userId,
    cardsData,
    navigation,
  ]);

  const handleIncrementTicket = () => {
    if (ticketCount < availableTickets.length) {
      setTicketCount((prevCount) => prevCount + 1);
    } else {
      Toast.show({
        type: "info",
        text1: "No More Tickets",
        text2: `Only ${availableTickets.length} tickets are available.`,
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  };

  const handleDecrementTicket = () => {
    if (ticketCount > 1) {
      setTicketCount((prevCount) => prevCount - 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredFlexContainer}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isConnected || !isInternetReachable) {
    return (
      <SafeAreaView style={styles.centeredFlexContainer}>
        <View style={styles.messageContainer}>
          <MaterialIcons name="cloud-off" size={60} color={Colors.darkGray} />
          <Text style={styles.networkStatusText}>
            You are currently offline. Please check your network connection.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centeredFlexContainer}>
        <View style={styles.messageContainer}>
          <MaterialIcons name="error-outline" size={60} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!cardsData) {
    return (
      <SafeAreaView style={styles.centeredFlexContainer}>
        <View style={styles.messageContainer}>
          <MaterialIcons
            name="info-outline"
            size={60}
            color={Colors.warningOrange}
          />
          <Text style={styles.errorText}>
            Group data not found or failed to load.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.headerContainer}>
        <Header userId={userId} navigation={navigation} />
      </View>

      <View style={styles.mainContentWrapper}>
        <View style={styles.contentCard}>
          <Text style={styles.groupInfoTitle}>Group Information</Text>
          <ScrollView
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              key={cardsData._id}
              colors={Colors.groupCardGradient}
              style={styles.groupDetailCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* --- Start of NEW Value Display --- */}
              <View style={styles.valueDisplayContainer}>
                <LinearGradient
                  colors={["#4287f5", "#2a64c4"]} // Shades of blue for attractiveness
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.valueGradientBackground}
                >
                  <Text style={styles.groupValueTextEnhanced}>
                    ₹ {formatNumberIndianStyle(cardsData.group_value)}
                  </Text>
                </LinearGradient>
              </View>
              {/* --- End of NEW Value Display --- */}

              <Text style={styles.highlightedGroupName}>
                {cardsData.group_name}
              </Text>

              <View style={styles.infoItem}>
                <MaterialIcons
                  name="credit-card"
                  size={20}
                  color={Colors.whiteAccent}
                  style={styles.infoItemIcon}
                />
                <Text style={styles.infoItemText}>
                  Installment:{" "}
                  <Text style={styles.highlightedText}>
                    ₹ {formatNumberIndianStyle(cardsData.group_install)}/Installment
                  </Text>
                </Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons
                  name="event-seat"
                  size={20}
                  color={Colors.whiteAccent}
                  style={styles.infoItemIcon}
                />
                <Text style={styles.infoItemText}>
                  <Text style={styles.highlightedText}>
                    {availableTickets.length} Seats
                  </Text>{" "}
                  are vacant
                </Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialIcons
                  name="timer"
                  size={20}
                  color={Colors.whiteAccent}
                  style={styles.infoItemIcon}
                />
                <Text style={styles.infoItemText}>
                  Duration:{" "}
                  <Text style={styles.highlightedText}>
                    {cardsData.group_duration} Months
                  </Text>
                </Text>
              </View>

              <View style={styles.dateInfoContainer}>
                <View style={styles.dateItem}>
                  <MaterialIcons
                    name="play-circle-outline"
                    size={18}
                    color={Colors.whiteAccent}
                  />
                  <Text style={styles.dateText}>
                    Starts:{" "}
                    {cardsData.start_date
                      ? new Date(cardsData.start_date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                      : "N/A"}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <MaterialIcons
                    name="event-busy"
                    size={18}
                    color={Colors.whiteAccent}
                  />
                  <Text style={styles.dateText}>
                    Ends:{" "}
                    {cardsData.end_date
                      ? new Date(cardsData.end_date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                      : "N/A"}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.ticketSelectionBox}>
              <Text style={styles.ticketSelectionBoxTitle}>Ticket Details</Text>

              <View style={styles.ticketControlOnlyRow}>
                <View style={styles.quantityControlsWrapper}>
                  <Text style={styles.quantityLabel}>Selected:</Text>
                  <TouchableOpacity
                    style={[
                      styles.ticketButton,
                      ticketCount <= 1 || availableTickets.length === 0
                        ? styles.ticketButtonDisabled
                        : {},
                    ]}
                    onPress={handleDecrementTicket}
                    disabled={ticketCount <= 1 || availableTickets.length === 0}
                  >
                    <AntDesign name="minus" size={24} color={Colors.white} />
                  </TouchableOpacity>
                  <View style={styles.ticketCountDisplay}>
                    <Text style={styles.ticketCountText}>{ticketCount}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.addMoreButtonRow}>
                <TouchableOpacity
                  style={[
                    styles.addMoreButton,
                    ticketCount === availableTickets.length ||
                      availableTickets.length === 0
                      ? styles.ticketButtonDisabled
                      : {},
                  ]}
                  onPress={handleIncrementTicket}
                  disabled={
                    ticketCount === availableTickets.length ||
                    availableTickets.length === 0
                  }
                >
                  <AntDesign name="plus" size={10} color={Colors.white} />
                  <Text style={styles.addMoreButtonText}>Add More</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.totalAvailableTicketsContainer}>
                <Text style={styles.totalAvailableTicketsLabel}>
                  Tickets Remaining:
                </Text>
                <Text style={styles.totalAvailableTicketsCount}>
                  {Math.max(0, availableTickets.length - ticketCount)}
                </Text>
              </View>
            </View>

            <View style={styles.checkboxSection}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  setTermsAccepted(!termsAccepted);
                }}
              >
                <MaterialIcons
                  name={termsAccepted ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color={termsAccepted ? Colors.primary : Colors.darkGray}
                />
                <Text style={styles.checkboxLabel}>
                  By continuing, I agree that I have read and understood the{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      navigation.navigate("TermsConditions", {
                        groupId,
                        userId,
                        callingScreen: "EnrollForm",
                      })
                    }
                  >
                    Terms & Conditions
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      navigation.navigate("TermsConditions", {
                        groupId,
                        userId,
                        callingScreen: "EnrollForm",
                      })
                    }
                  >
                    Privacy Policy
                  </Text>
                  , and I accept to follow the rules mentioned in both documents.
                </Text>


              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.enrollButton,
                isSubmitting ||
                  availableTickets.length === 0 ||
                  ticketCount === 0 ||
                  !termsAccepted
                  ? styles.enrollButtonDisabled
                  : {},
              ]}
              onPress={handleEnroll}
              disabled={
                isSubmitting ||
                availableTickets.length === 0 ||
                ticketCount === 0 ||
                !termsAccepted
              }
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.enrollButtonText}>Enroll Now</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View >
      <Toast />
    </SafeAreaView >
  );
};

const Colors = {
  primary: "#053B90",
  primaryDark: "#053B90",
  secondary: "#28A745",
  danger: "#DC3545",
  warning: "#FFC107",
  lightGray: "#F8F9FA",
  mediumGray: "#E9ECEF",
  darkGray: "#6C757D",
  white: "#FFFFFF",
  black: "#212529",
  primaryBackground: "#E0F2F7",
  contentCardBackground: "#FFFFFF",
  groupCardGradient: ["#007BFF", "#0056b3"],
  whiteAccent: "#F0F8FF",
  textGray: "#495057",
  disabledGray: "#A0A0A0",
  successGreen: "#28A745",
  errorRed: "#DC3545",
  linkBlue: "#007BFF",
  warningOrange: "#FF9800",
  primaryText: "#343A40",
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.primary, // Main outer blue
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    backgroundColor: Colors.primary,
  },
  mainContentWrapper: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 9,
    paddingBottom: 10,
  },
  contentCard: {
    flex: 1,
    backgroundColor: Colors.primaryBackground, // Changed to primaryBackground to align with main outer blue
    borderRadius: 15,
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  scrollContentContainer: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  groupInfoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primaryText,
    marginBottom: 20,
    textAlign: "center",
  },
  groupDetailCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    alignItems: "flex-start",
  },

  valueDisplayContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  valueLabelLarge: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  valueGradientBackground: {
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 25,
    minWidth: "70%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2196F3", // A blue shade for shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 15,
  },
  groupValueTextEnhanced: {
    fontSize: 34,
    fontWeight: "bold",
    color: Colors.white,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  highlightedGroupName: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 15,
    textAlign: "center",
    width: "100%",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoItemIcon: {
    marginRight: 10,
  },
  infoItemText: {
    fontSize: 12,
    color: Colors.whiteAccent,
  },
  highlightedText: {
    fontWeight: "bold",
    color: Colors.white,
  },
  dateInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    color: Colors.whiteAccent,
    marginLeft: 5,
  },
  ticketSelectionBox: {
    backgroundColor: Colors.primaryBackground, // Changed to primaryBackground to align with main outer blue
    borderRadius: 12, // Decreased from 15
    padding: 15, // Decreased from 20
    marginHorizontal: 8, // Decreased from 10
    marginBottom: 20, // Decreased from 25
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 }, // Decreased shadow offset
    shadowOpacity: 0.08, // Decreased shadow opacity
    shadowRadius: 3, // Decreased shadow radius
    elevation: 3, // Decreased elevation
    borderWidth: 0,
  },
  ticketSelectionBoxTitle: {
    fontSize: 18, // Decreased from 20
    fontWeight: "bold",
    color: Colors.primaryText,
    marginBottom: 10, // Decreased from 15
    textAlign: "center",
  },
  ticketControlOnlyRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 10, // Decreased from 15
    paddingHorizontal: 2, // Decreased from 5
  },
  addMoreButtonRow: {
    alignItems: "center",
    marginBottom: 15, // Decreased from 20
  },
  quantityControlsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 16,
    color: Colors.textGray,
    marginRight: 10,
    fontWeight: "500",
  },
  ticketButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  ticketButtonDisabled: {
    backgroundColor: Colors.disabledGray,
    shadowColor: Colors.disabledGray,
    opacity: 0.7,
    elevation: 2,
  },
  ticketCountDisplay: {
    backgroundColor: Colors.mediumGray,
    borderWidth: 0,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketCountText: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primaryText,
  },
  addMoreButton: {
    flexDirection: "row",
    backgroundColor: Colors.secondary,
    borderRadius: 25,
    paddingVertical: 7,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 70,
  },
  addMoreButtonText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 2,
  },
  totalAvailableTicketsContainer: {
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    padding: 10,
    borderWidth: 0,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  totalAvailableTicketsLabel: {
    fontSize: 16,
    color: Colors.textGray,
    marginRight: 8,
    fontWeight: "500",
  },
  totalAvailableTicketsCount: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
  },
  boldText: {
    fontWeight: "bold",
    color: Colors.primaryDark,
  },
  checkboxSection: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  readTermsPrompt: {
    backgroundColor: Colors.warning,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: Colors.warningOrange,
    flexDirection: "row",
    alignItems: "center",
  },
  readTermsText: {
    fontSize: 15,
    color: Colors.black,
    flex: 1,
    marginLeft: 0,
  },
  linkText: {
    color: Colors.linkBlue,
    fontWeight: "bold",
      fontSize: 16,
    textDecorationLine: "underline",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 13,
    color: Colors.primaryText,
    flex: 1,
  },
  enrollButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    marginHorizontal: 10,
    marginTop: -15,
  },
  enrollButtonDisabled: {
    backgroundColor: Colors.disabledGray,
    shadowColor: Colors.disabledGray,
    opacity: 0.7,
    elevation: 5,
  },
  enrollButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0,
  },
  centeredFlexContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryBackground,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: Colors.darkGray,
    textAlign: "center",
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  networkStatusText: {
    fontSize: 18,
    color: Colors.darkGray,
    textAlign: "center",
    marginTop: 15,
  },
  errorText: {
    fontSize: 18,
    color: Colors.danger,
    textAlign: "center",
    marginTop: 15,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EnrollForm;