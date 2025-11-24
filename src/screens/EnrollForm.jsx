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
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
// FIX 1: Added MaterialCommunityIcons to the import list
import { AntDesign, MaterialIcons, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import url from "../data/url";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import Toast from "react-native-toast-message";
import { ContextProvider } from "../context/UserProvider";

// Helper function to format dates (Copied from AuctionList logic for consistency)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    // FIX 2: Enhanced date parsing logic for better compatibility
    let date;
    if (typeof dateString === 'string') {
      // Try parsing as ISO format first (which handles both YYYY-MM-DD and full datetime)
      date = new Date(dateString);
    } else {
      // Fallback for unexpected formats, though typically unnecessary for API dates
      date = new Date(dateString);
    }

    // Check if the date object is valid
    if (!isNaN(date.getTime())) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      // Format: e.g., "31-May-2025" (matching image style)
      const formatted = date.toLocaleDateString('en-GB', options);
      // Clean up the format to match your desired style (e.g., 31-May-2025)
      return formatted.replace(/ /g, '-').replace(',', '');
    }
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
  }
  return "N/A";
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) {
    return "0";
  }
  const parts = num.toString().split('.');
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? '.' + parts[1] : '';
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
  // ADDED: Colors for consistency with AuctionList
  textMedium: "#757575",
  lightDivider: "#EEEEEE",
  error: "#E74C3C",
  // NEW COLOR: To mimic the light background of the image card
  chitBackground: "#FFFFFF",
  chitLabel: "#757575", // Lighter label text
  chitValue: "#343A40", // Darker value text
  chitLink: "#DC3545", // Red link color from image
  // ADDED FOR NEW DESIGN
  accentBlue: "#17A2B8", // A nice complementary blue
  shadowBlue: "rgba(5, 59, 144, 0.2)",
};

// NEW: Component for a single detail item in the Chit Details Grid
const ChitDetailItem = ({ label, value, isLink = false, linkIcon = null, index, totalItems }) => {
  const isRightItem = index % 2 !== 0; // Item index 1, 3, 5...
  const isLastRow = index >= totalItems - (totalItems % 2 === 0 ? 2 : 1); // For 7 items, it's 6. For 8 items, it's 6, 7.

  // Apply conditional styling for borders to create a clean grid
  const itemStyle = [
    styles.detailItem,
    isRightItem && styles.detailItemNoRightBorder,
    isLastRow && styles.detailItemNoBottomBorder,
  ];

  return (
    <View style={itemStyle}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={[
          styles.detailValue,
          isLink && styles.detailValueLink,
          // Applied a larger text style to currency values for emphasis
          (label === 'Monthly Installment' || label.includes('Value')) && styles.detailValueCurrency
        ]}>
          {value}
        </Text>
        {/* Link Icon for potential future link items */}
        {isLink && linkIcon}
      </View>
    </View>
  );
};

// NEW: Main component to display the Chit Details Grid, replacing the old card logic
const ChitDetailsGrid = ({ data }) => {
  // Determine the values based on available data, defaulting to 'N/A' or '0' where appropriate.
  const chitValue = data.group_value ? `₹ ${formatNumberIndianStyle(data.group_value)}` : 'N/A';
  // The unit '/Month' is now concatenated here
  const monthlyInstallmentValue = data.monthly_installment ? `₹ ${formatNumberIndianStyle(data.monthly_installment)} /Month` : 'N/A';
  
  // 🎯 MODIFICATION START: Cascading logic to reliably find the commencement date
  let rawCommencementDate = data.group_commencement_date;

  // Fallback 1 (New Priority): Check for the specific 'commencement_date' inside the first auction object
  const firstAuction = data.auction && Array.isArray(data.auction) && data.auction.length > 0 ? data.auction[0] : null;

  if (!rawCommencementDate && firstAuction?.commencement_date) {
      rawCommencementDate = firstAuction.commencement_date;
      console.log("Using auction[0].commencement_date as commencement date fallback.");
  }

  // Fallback 2 (Old Fallback 1): Use group's start_date
  if (!rawCommencementDate && data.start_date) {
      rawCommencementDate = data.start_date;
      console.log("Using start_date as commencement date fallback.");
  }

  // Fallback 3 (Old Fallback 2): Use the date of the very first auction (auction_date)
  if (!rawCommencementDate && firstAuction?.auction_date) {
      rawCommencementDate = firstAuction.auction_date;
      console.log("Using first auction date (auction_date) as commencement date fallback.");
  }

  // Fallback 4 (Old Fallback 3): Use group_first_auction_date
  if (!rawCommencementDate && data.group_first_auction_date) {
      rawCommencementDate = data.group_first_auction_date;
      console.log("Using group_first_auction_date as commencement date fallback.");
  }


  const commencementDateValue = rawCommencementDate
    ? formatDate(rawCommencementDate) // Format the field we successfully found
    : 'N/A'; // Final fallback if no date field is present
  // 🎯 MODIFICATION END

  const duration = data.group_duration || 'N/A';
  const groupName = data.group_name || 'N/A';
  const groupMembers = data.group_members || 'N/A';
  const startDate = data.start_date ? formatDate(data.start_date) : 'N/A';
  const endDate = data.end_date ? formatDate(data.end_date) : 'N/A';

  const details = [
    { label: "Monthly Installment", value: monthlyInstallmentValue },
    // 🎯 MODIFIED: Use the correct label "Commencement Date" and the robustly calculated value
    { label: "Commencement Date", value: commencementDateValue }, 
    { label: "Duration", value: `${duration} Months` },
    { label: "Group Name", value: groupName },
    { label: "Group Members", value: groupMembers },
    { label: "Start Date", value: startDate },
    { label: "End Date", value: endDate },
  ];

  const totalItems = details.length;

  return (
    <View style={styles.chitDetailsCard}>
      {/* Header: Chit Value (Matches the prominent style in the image) */}
      <View style={styles.chitValueHeader}>
        <Text style={styles.chitValueLabel}>Chit Value</Text>
        <Text style={styles.chitValueHeaderText}>{chitValue}</Text>
      
      </View>

      {/* Grid Container */}
      <View style={styles.chitDetailsGridContainer}>
        {details.map((item, index) => (
          <ChitDetailItem
            key={index}
            label={item.label}
            value={item.value}
            index={index}
            totalItems={totalItems}
          />
        ))}
        {/* Add an empty item if the count is odd to maintain layout integrity */}
        {totalItems % 2 !== 0 && (
          <View style={[styles.detailItem, styles.detailItemEmpty, styles.detailItemNoRightBorder, styles.detailItemNoBottomBorder]} />
        )}
      </View>
    </View>
  );
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

  // Custom Modal State
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

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
      // FIX 1: Updated the API route as requested
      const groupApiUrl = `${url}/group/${groupId}`; 
      
      // ✅ Console log for the group fetch API URL
      console.log("Fetching Group Details from URL:", groupApiUrl); 
      
      const groupResponse = await fetch(
        groupApiUrl
      );
      
      // ✅ Console log the group fetch response status
      console.log("Group Details Response Status:", groupResponse.status);

      if (groupResponse.ok) {
        // FIX 2: Handle the nested response structure (data -> [group object])
        const responseBody = await groupResponse.json();
        
        // ✅ CORRECTED LOG: Log raw response body as a string to show full details of nested arrays like 'auction'
        console.log("Group Details Raw Response Body:", JSON.stringify(responseBody, null, 2)); 
        
        const groupData = (responseBody.data && Array.isArray(responseBody.data) && responseBody.data.length > 0)
          ? responseBody.data[0]
          : responseBody; // Fallback to the whole body if structure is unexpected
        
        // ✅ CORRECTED LOG: Deep log the parsed group data to fully expand nested arrays (like 'auction')
        // Using JSON.parse(JSON.stringify) to ensure deep cloning and logging of nested arrays.
        console.log("Parsed Group Data (Deep Log):", JSON.parse(JSON.stringify(groupData))); 
        
        setCardsData(groupData);
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

      const ticketsApiUrl = `${url}/enroll/get-next-tickets/${groupId}`;
      
      // ✅ Console log for the tickets fetch API URL
      console.log("Fetching Available Tickets from URL:", ticketsApiUrl);

      const ticketsResponse = await axios.post(
        ticketsApiUrl
      );
      
      // ✅ Console log the tickets fetch response data
      console.log("Available Tickets Response Data:", ticketsResponse.data);

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

  // New function for the core enrollment logic (can be called by a custom modal's confirm button)
  const performEnrollment = useCallback(async (ticketsCountInt) => {
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

    const payload = {
      group_id: groupId,
      user_id: userId,
      no_of_tickets: ticketsCountInt,
      // tickets: availableTickets[0], // NOTE: Commented out original line
      chit_asking_month: 0,
    };

    console.log("Payload being sent:", payload);

    try {
      await axios.post(`${url}/mobile-app-enroll/add-mobile-app-enroll`, payload, {
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

      // ✅ FIX: Pass the tickets count here
      navigation.navigate("EnrollConfirm", {
        group_name: cardsData?.group_name,
        tickets: ticketsCountInt, // <-- CORRECTED: Pass the ticket count
        userId: userId,
      });

    } catch (err) {
      console.error("Error enrolling user:", err);
      let errorMessage =
        "An error occurred during enrollment. Please try again.";

      if (err.response) {
        console.error("Error response data:", err.response.data);
        // Check if the specific error message structure exists
        errorMessage =
          err.response.data.data?.message ||
          err.response.data.message || // Fallback to a general message field
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
  }, [
    isConnected,
    isInternetReachable,
    groupId,
    userId,
    cardsData,
    navigation,
  ]);

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

    // Show the confirmation modal instead of calling performEnrollment directly
    setIsConfirmModalVisible(true);

  }, [
    ticketCount,
    termsAccepted,
    availableTickets,
    setIsConfirmModalVisible,
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


  // --- CUSTOM CONFIRMATION MODAL COMPONENT (Using new styles) ---
  const renderConfirmModal = () => {
    // Re-use data variables from previous implementation
    const groupName = cardsData?.group_name || "the group";
    // Using dynamic group_install field
    const installmentAmount = cardsData?.group_install ? formatNumberIndianStyle(cardsData.group_install) : 'N/A';
    const durationMonths = cardsData?.group_duration || "N/A";
    const tickets = ticketCount;
    const ticketsText = `${tickets} ticket${tickets > 1 ? "s" : ""}`;

    // Assuming appUser has a 'name' field, fallback to 'User'
    const userName = appUser.name || 'User';

    // The new confirmation text structure (consolidated)
    const confirmationText = `Dear ${userName}, do you want to join the group ${groupName}? Installment Amount: ₹ ${installmentAmount}, Duration: ${durationMonths} months with ${ticketsText}.`;


    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isConfirmModalVisible}
        onRequestClose={() => {
          setIsConfirmModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.styledModalContent}>

            {/* START: ANIMATION/AVATAR PLACEHOLDER (New JSX structure) */}
            <View style={styles.modalAnimationPlaceholder}>
              <Ionicons name="people-circle" size={80} color="#053B90" />
            </View>
            {/* END: ANIMATION/AVATAR PLACEHOLDER */}

            <Text style={styles.styledModalTitle}>
              Confirm Enrollment
            </Text>
            <Text style={styles.styledModalMessage}>
              {confirmationText}
            </Text>
            <Text style={styles.styledModalAgreement}>
              By proceeding, you agree to the group terms and conditions.
            </Text>
            <View style={styles.styledModalButtonContainer}>
              <TouchableOpacity
                style={[styles.styledModalButton, styles.styledModalCancelButton]}
                onPress={() => {
                  setIsConfirmModalVisible(false);
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.styledModalCancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.styledModalButton,
                  styles.styledModalConfirmButton,
                  isSubmitting ? styles.styledModalConfirmButtonDisabled : {}
                ]}
                onPress={() => {
                  setIsConfirmModalVisible(false);
                  const ticketsCountInt = parseInt(ticketCount, 10);
                  performEnrollment(ticketsCountInt);
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.styledModalConfirmButtonText}>
                    Agree & Join
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  // --- END CUSTOM CONFIRMATION MODAL COMPONENT ---


  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <Header userId={userId} navigation={navigation} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ... (Error handling returns) ...

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
          <Text style={styles.groupInfoTitle}>Group Enrollment Details</Text>
          
          {/* SCROLLABLE CONTENT AREA - Now includes the button and terms */}
          <ScrollView
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
          >

            {/* --- NEW CHIT DETAILS GRID INTEGRATION --- */}
            {cardsData && (
              <ChitDetailsGrid data={cardsData} />
            )}
            {/* ------------------------------------------- */}

            {/* TICKET SELECTION */}
            <View style={styles.ticketSelectionBox}>
              <Text style={styles.ticketSelectionBoxTitle}>Select Tickets</Text>


              <View style={styles.unifiedTicketControlRow}>
                <Text style={styles.quantityLabel}>Number of Tickets:</Text>
                <View style={styles.stepperContainer}>

                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      ticketCount <= 1 || availableTickets.length === 0
                        ? styles.stepperButtonDisabled
                        : {},
                    ]}
                    onPress={handleDecrementTicket}
                    disabled={ticketCount <= 1 || availableTickets.length === 0}
                  >
                    <AntDesign name="minus" size={20} color={ticketCount <= 1 || availableTickets.length === 0 ? Colors.mediumGray : Colors.primary} />
                  </TouchableOpacity>

                  {/* Ticket Count Display */}
                  <View style={styles.ticketCountDisplay}>
                    <Text style={styles.ticketCountText}>{ticketCount}</Text>
                  </View>

                  {/* Increment Button */}
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      ticketCount === availableTickets.length || availableTickets.length === 0
                        ? styles.stepperButtonDisabled
                        : {},
                    ]}
                    onPress={handleIncrementTicket}
                    disabled={
                      ticketCount === availableTickets.length || availableTickets.length === 0
                    }
                  >
                    <AntDesign name="plus" size={20} color={ticketCount === availableTickets.length || availableTickets.length === 0 ? Colors.mediumGray : Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* NEW: Combined Summary Row - Stacked Card Style */}
              <View style={styles.combinedTicketSummaryRowStacked}>
                {/* Selected Tickets Box (Primary) */}
                <View style={styles.summaryBoxPrimary}>
                  <Text style={styles.summaryBoxLabel}>Selected Tickets</Text>
                  <Text style={styles.summaryBoxCountPrimary}>{ticketCount}</Text>
                </View>
              </View>
              {/* END: Combined Summary Row */}
            </View>
            
            {/* * MODIFIED SECTION: 
              * The content that was previously in bottomFixedContainer is now placed 
              * directly inside the ScrollView, making it scrollable. 
            */}
            
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
                  I agree to the{" "}
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
                  .
                </Text>

              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.enrollButton,
                styles.enrollButtonInScroll, // Use the new style for extra spacing
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
            
            {/* Added extra space at the bottom of the scroll view */}
            <View style={styles.bottomSpacer} /> 

          </ScrollView>
          {/* END OF SCROLLABLE CONTENT AREA */}
          
          {/* REMOVED: The fixed bottom section (bottomFixedContainer) is gone */}
          
        </View>
      </View >
      {renderConfirmModal()}
      <Toast />
    </SafeAreaView >
  );
};


const styles = StyleSheet.create({
  // ADDED: The style for the full screen with primary background (matching Enrollment.jsx)
  safeArea: {
    flex: 1, backgroundColor: '#053B90', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
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
    paddingHorizontal: 3, // MODIFIED: Reduced from 5
    paddingBottom: 3, // MODIFIED: Reduced from 5
  },
  contentCard: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
    borderRadius: 15,
    marginTop: 3, // MODIFIED: Reduced from 5
    paddingVertical: 8, // MODIFIED: Reduced from 10
    paddingHorizontal: 5, // MODIFIED: Reduced from 8
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  // REMOVED/DEPRECATED: bottomFixedContainer style is removed as it's no longer fixed
  // bottomFixedContainer: {
  //   backgroundColor: Colors.white, 
  //   paddingTop: 10,
  //   borderTopLeftRadius: 15,
  //   borderTopRightRadius: 15,
  //   paddingHorizontal: 8,
  //   shadowColor: Colors.black,
  //   shadowOffset: { width: 0, height: -2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 3,
  //   elevation: 10,
  // },
  // FIX: Added spacer for bottom margin
  bottomSpacer: {
    height: 60, // MODIFIED: Increased from 30 to 60 for more space after the button
    backgroundColor: Colors.primaryBackground, // Use card background color for blending
  },
  scrollContentContainer: {
    paddingHorizontal: 0, // MODIFIED: Reduced from 3 to 0
    paddingBottom: 0, // IMPORTANT: Removed bottom padding here as the spacer handles it now
  },
  groupInfoTitle: {
    fontSize: 18, // Increased for visibility
    fontWeight: "bold",
    color: Colors.primary, // Used primary color for emphasis
    marginBottom: 5, 
    textAlign: "center",
  },
  
  // MODIFIED: Ticket Selection Box for better visibility/design
  ticketSelectionBox: {
    backgroundColor: Colors.white, // Changed background to white
    borderRadius: 15, // Increased border radius
    padding: 15,
    marginHorizontal: 5,
    marginBottom: 15, // MODIFIED: Reduced from 20 to 15
    shadowColor: Colors.shadowBlue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, 
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0, // Removed border for a cleaner look
  },
  ticketSelectionBoxTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primaryText,
    marginBottom: 10, // MODIFIED: Reduced from 15 to 10
    textAlign: "center",
  },

  // START: TICKET SELECTION STYLES

  unifiedTicketControlRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Distribute space between label and stepper
    alignItems: "center",
    marginBottom: 10, // MODIFIED: Reduced from 15 to 10
    paddingHorizontal: 0,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray, // Changed to lighter background
    borderRadius: 8, // Slightly reduced radius
    borderWidth: 0,
    overflow: "hidden",
    elevation: 0, // Removed inner shadow
  },
  stepperButton: {
    backgroundColor: Colors.white, // White background for buttons
    padding: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 5, // Spacing between buttons and count
    borderWidth: 1,
    borderColor: Colors.primary, // Primary color border
  },
  stepperButtonDisabled: {
    backgroundColor: Colors.mediumGray,
    opacity: 0.8,
    borderColor: Colors.mediumGray,
  },
  ticketCountDisplay: {
    backgroundColor: Colors.primaryBackground, // Light blue background for count
    paddingVertical: 6,
    paddingHorizontal: 15,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  ticketCountText: {
    fontSize: 22, // Slightly larger count text
    fontWeight: "bold",
    color: Colors.primary, // Primary blue color
  },
  quantityLabel: {
    fontSize: 16,
    color: Colors.textGray,
    fontWeight: "500",
  },

  // NEW: COMBINED SUMMARY ROW - STACKED CARD STYLE
  combinedTicketSummaryRowStacked: {
    flexDirection: "column", // Stack vertically
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0, // Removed vertical padding
    marginBottom: 5, // MODIFIED: Reduced from 10 to 5 for compactness
    width: '100%',
  },
  summaryBoxPrimary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.accentBlue, // Use a bright accent blue for tickets
    width: "100%",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12, // Increased vertical padding
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  summaryBoxLabel: {
    fontSize: 16, // Larger label
    fontWeight: "600",
    color: Colors.whiteAccent,
  },
  summaryBoxCountPrimary: {
    fontSize: 22, // Larger count
    fontWeight: "bold",
    color: Colors.white,
  },

  // END: TICKET SELECTION ROW STYLES

  boldText: {
    fontWeight: "bold",
    color: Colors.primaryDark,
  },
  checkboxSection: {
    marginTop: 10, // MODIFIED: Reduced from 15 to 10
    marginBottom: 10, // MODIFIED: Reduced from 15 to 10
    paddingHorizontal: 10,
    backgroundColor: 'transparent', // Ensure it doesn't add background color
  },
  linkText: {
    color: Colors.linkBlue,
    fontWeight: "bold",
    fontSize: 13, // Slightly larger
    textDecorationLine: "underline",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // Changed to align to start for multi-line text
    marginBottom: 10, // Reduced from 15
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 13,
    color: Colors.primaryText,
    flex: 1,
    lineHeight: 20,
  },
  enrollButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 15, // Increased padding for a better touch target
    borderRadius: 12, // Slightly reduced radius for a modern look
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, // Increased shadow for better pop
    shadowRadius: 8,
    elevation: 12,
    marginHorizontal: 10,
  },
  enrollButtonInScroll: {
    marginTop: 2, // MODIFIED: Reduced from 5 to 2
    marginBottom: 0, // Managed by bottomSpacer
  },
  enrollButtonDisabled: {
    backgroundColor: Colors.disabledGray,
    shadowColor: Colors.disabledGray,
    opacity: 0.7,
    elevation: 5,
  },
  enrollButtonText: {
    color: Colors.white,
    fontSize: 18, // Larger font
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  centeredFlexContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryBackground,
  },
  loaderContainer: {
    // MODIFIED: Ensure flex: 1 for full screen coverage under the header
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white, // Use white/light color for the loader background
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

  // --- NEW MODAL STYLES (FROM USER SNIPPET) ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  styledModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 25,
    marginHorizontal: 30,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: '#053B90',
    elevation: 10,
  },
  modalAnimationPlaceholder: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 50,
    backgroundColor: '#E0EFFF', // Light background for the avatar/icon
    borderWidth: 2,
    borderColor: '#053B90',
  },
  styledModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: Colors.primaryText
  },
  styledModalMessage: {
    fontSize: 14,
    color: Colors.textGray,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
    width: '100%',
  },
  styledModalAgreement: {
    fontSize: 11,
    color: Colors.darkGray,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25,
    fontStyle: 'italic',
  },
  styledModalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  styledModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  styledModalCancelButton: {
    backgroundColor: Colors.lightGray,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
  },
  styledModalCancelButtonText: {
    color: Colors.darkGray,
    fontSize: 16,
    fontWeight: "bold",
  },
  styledModalConfirmButton: {
    backgroundColor: Colors.primary, // Use primary for Agree & Join
    marginLeft: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  styledModalConfirmButtonDisabled: {
    backgroundColor: Colors.disabledGray,
    shadowColor: 'transparent',
    opacity: 0.7,
    elevation: 3,
  },
  styledModalConfirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  // --- NEW CHIT DETAILS GRID STYLES (Stylized for better design) ---
  chitDetailsCard: {
    width: '98%', // Slightly reduced width
    alignSelf: 'center',
    backgroundColor: Colors.chitBackground,
    borderRadius: 15,
    marginVertical: 10, // MODIFIED: Reduced from 15 to 10
    overflow: 'hidden',
    shadowColor: Colors.shadowBlue,
    shadowOffset: { width: 0, height: 8 }, // Deeper shadow
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1, // Added a subtle border
    borderColor: Colors.mediumGray,
  },
  chitValueHeader: {
    paddingVertical: 15, // MODIFIED: Reduced from 20 to 15
    backgroundColor: Colors.primary, // Primary blue for header
    alignItems: 'center',
    // Removed bottom border to let the card edge define the separation
  },
  chitValueLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.whiteAccent,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  chitValueHeaderText: {
    fontSize: 28, // Larger value text
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  groupNameText: {
    fontSize: 16,
    color: Colors.whiteAccent,
    fontWeight: '600',
    marginTop: 5,
  },
  chitDetailsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.white,
    paddingHorizontal: 0,
    borderTopWidth: 3, // MODIFIED: Reduced from 5 to 3
    borderTopColor: Colors.primaryBackground, 
  },
  detailItem: {
    width: '50%', // Two items per row
    paddingHorizontal: 15,
    paddingVertical: 10, // MODIFIED: Reduced from 14 to 10
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightDivider,
    borderRightWidth: 1,
    borderRightColor: Colors.lightDivider,
    backgroundColor: Colors.white,
  },
  detailItemNoRightBorder: {
    borderRightWidth: 0,
  },
  detailItemNoBottomBorder: {
    borderBottomWidth: 0,
  },
  detailItemEmpty: {
    backgroundColor: Colors.lightGray, // Subtle background for empty slot
  },
  detailLabel: {
    fontSize: 11, // MODIFIED: Reduced from 12 to 11 for compactness
    color: Colors.chitLabel,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase', // Uppercase labels
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.chitValue,
  },
  detailValueCurrency: {
    fontSize: 16, // Highlight currency values
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  detailValueLink: {
    color: Colors.chitLink,
    textDecorationLine: 'underline',
  },
});

export default EnrollForm;