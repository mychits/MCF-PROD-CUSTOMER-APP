import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Platform,
  Vibration,
} from "react-native";
import url from "../data/url"; // Assuming this points to your backend URL
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons } from "@expo/vector-icons"; // Sticking to MaterialIcons for simplicity
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

const Colors = {
  primaryBlue: "#053B90", // Deep professional blue for header/status bar
  lightBackground: "#F9FCFF", // Very light, almost white background for content area
  cardBackground: "#FFFFFF", // Pure white for card base
  darkText: "#263238", // Darker text for main info
  mediumText: "#546E7A", // Medium gray for secondary info/labels
  lightText: "#B0BEC5", // Light gray for subtle hints

  // Subtle Card Gradient
  cardGradientStart: "#FFFFFF",
  cardGradientEnd: "#F5F8FA",

  // Balance Box Gradients (very subtle)
  excessBackgroundStart: '#E8F5E9', // Light green for excess
  excessBackgroundEnd: '#F2FAF2', // Even lighter green
  duesBackgroundStart: '#FBE9E7', // Light orange-red for dues
  duesBackgroundEnd: '#FFF6F5', // Even lighter orange-red

  // Status Icons & Text
  successColor: "#388E3C", // Darker green for success icon/text
  warningColor: "#D32F2F", // Darker red for warning/dues icon/text

  // Pay Now Button
  payNowButtonBackground: "#007BFF", // Standard blue for button
  payNowButtonText: "#FFFFFF",

  shadowColor: "rgba(0,0,0,0.08)", // Very subtle shadow
  borderColor: "#ECEFF1", // Light, almost invisible border
  groupNameColor: '#1976D2', // A professional medium blue for group names
};

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


const PayYourDues = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [TotalToBepaid, setTotalToBePaid] = useState(0);
  const [Totalpaid, setTotalPaid] = useState(0);
  const [Totalprofit, setTotalProfit] = useState(0);
  // New state to store individual group overview data
  const [groupOverviews, setGroupOverviews] = useState({});

  // Refactored fetch functions to return data
  const fetchTicketsData = useCallback(async (currentUserId) => {
    if (!currentUserId) {
      return [];
    }
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets/${currentUserId}`
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching tickets:", error);
      return [];
    }
  }, []);

  const fetchAllOverviewData = useCallback(async (currentUserId) => {
    if (!currentUserId) {
      return { totalToBePaid: 0, totalPaid: 0, totalProfit: 0 };
    }
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets-report/${currentUserId}`
      );
      const data = response.data;

      const totalToBePaidAmount = data.reduce(
        (sum, group) =>
          sum +
          (group?.payable?.totalPayable +
            (parseInt(group?.enrollment?.group?.group_install) || 0) || 0),
        0
      );
      const totalPaidAmount = data.reduce(
        (sum, group) => sum + (group?.payments?.totalPaidAmount || 0),
        0
      );
      const totalProfitAmount = data.reduce(
        (sum, group) => sum + (group?.profit?.totalProfit || 0),
        0
      );
      return { totalToBePaid: totalToBePaidAmount, totalPaid: totalPaidAmount, totalProfit: totalProfitAmount };
    } catch (error) {
      console.error("Error fetching overview:", error);
      return { totalToBePaid: 0, totalPaid: 0, totalProfit: 0 };
    }
  }, []);

  const fetchIndividualGroupOverview = useCallback(async (currentUserId, card) => {
    try {
      if (!currentUserId || !card.group_id || !card.group_id._id || !card.tickets) {
        console.warn("Skipping individual overview fetch due to missing data:", card);
        return { key: null, data: null };
      }

      const response = await axios.get(
        `${url}/single-overview?user_id=${currentUserId}&group_id=${card.group_id._id}&ticket=${card.tickets}`
      );
      const groupData = response.data;
      const calculatedTotalToBePaid = groupData?.totalInvestment || 0;
      return {
        key: `${card.group_id._id}_${card.tickets}`,
        data: {
          ...groupData,
          totalToBePaidAmount: calculatedTotalToBePaid,
        },
      };
    } catch (error) {
      console.error(
        `Error fetching overview for group ${card.group_id?._id} ticket ${card.tickets}:`,
        error
      );
      return { key: null, data: null };
    }
  }, []);

  // Consolidated data fetching logic
  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setCardsData([]);
      setGroupOverviews({});
      setTotalToBePaid(0);
      setTotalPaid(0);
      setTotalProfit(0);
      return;
    }

    setLoading(true);
    try {
      // Fetch tickets and overall overview in parallel
      const [fetchedCards, overviewSummary] = await Promise.all([
        fetchTicketsData(userId),
        fetchAllOverviewData(userId),
      ]);

      setCardsData(fetchedCards);
      setTotalToBePaid(overviewSummary.totalToBePaid);
      setTotalPaid(overviewSummary.totalPaid);
      setTotalProfit(overviewSummary.totalProfit);

      // Now fetch individual group overviews based on the fetched cards
      if (fetchedCards.length > 0) {
        const overviewPromises = fetchedCards.map(card =>
          fetchIndividualGroupOverview(userId, card)
        );

        const results = await Promise.all(overviewPromises);
        const newGroupOverviews = {};
        results.forEach((result) => {
          if (result.key && result.data) {
            newGroupOverviews[result.key] = result.data;
          }
        });
        setGroupOverviews(newGroupOverviews);
      } else {
        setGroupOverviews({});
      }
    } catch (error) {
      console.error("Error during overall data fetch:", error);
      // Optionally reset states or show error message
    } finally {
      setLoading(false);
    }
  }, [userId, fetchTicketsData, fetchAllOverviewData, fetchIndividualGroupOverview]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depend on fetchData itself

  useFocusEffect(
    useCallback(() => {
      fetchData(); // Re-fetch all data when screen comes into focus
    }, [fetchData])
  );

  // Filter cards: Do not show if group name contains "loan"
  const filteredCardsToDisplay = cardsData.filter((card) => {
    const isLoanGroup = card.group_id?.group_name
      ? card.group_id.group_name.toLowerCase().includes("loan")
      : false;

    return card.group_id !== null && !isLoanGroup;
  });


  const handleViewDetails = (groupId, ticket) => {
    Vibration.vibrate(50);
    navigation.navigate("BottomTab", {
      // Name of the Tab Navigator in the main stack
      screen: "EnrollTab", // Name of the tab containing EnrollStackNavigator
      params: {
        screen: "EnrollGroup", // Name of the EnrollGroup screen within EnrollStackNavigator
        params: {
          userId: userId,
          groupId: groupId,
          ticket: ticket,
        },
      },
    });
  };

  const handlePayNow = (groupId, ticket, amount) => {
    Vibration.vibrate(50);
    console.log(`Initiating payment for Group: ${groupId}, Ticket: ${ticket}, Amount: ${amount}`);
    // Navigate to a payment screen, passing the necessary details
    navigation.navigate("PaymentScreen", {
      userId: userId,
      groupId: groupId,
      ticket: ticket,
      amountToPay: amount,
    });
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />

      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <Text style={styles.sectionTitle}>Pay Your Dues</Text>
          <Text style={styles.subSectionTitle}>Stay on top of your group payments!</Text>


          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primaryBlue}
              style={styles.loader}
            />
          ) : filteredCardsToDisplay.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.groupListContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {filteredCardsToDisplay.map((card, index) => {
                const groupOverview = groupOverviews[`${card.group_id._id}_${card.tickets}`];
                // Render card only if its specific overview data is loaded
                if (!groupOverview) {
                  return null; // Or render a skeleton card if desired
                }

                const totalToBePaidAmount = groupOverview?.totalInvestment || 0; // Use totalInvestment from groupOverview
                const totalPaid = groupOverview?.totalPaid || 0;
                const totalProfit = groupOverview?.totalProfit || 0;
                const balance = totalPaid - totalToBePaidAmount;
                const isBalanceExcess = balance > 0;

                const balanceBoxColors = isBalanceExcess
                  ? [Colors.excessBackgroundStart, Colors.excessBackgroundEnd]
                  : [Colors.duesBackgroundStart, Colors.duesBackgroundEnd];
                const balanceIcon = isBalanceExcess ? "check-circle" : "credit-card-off";
                const balanceIconColor = isBalanceExcess ? Colors.successColor : Colors.warningColor;
                const balanceMessage = isBalanceExcess ? "You have an excess balance." : "Payment is due.";
                const balanceAmountStyle = isBalanceExcess ? styles.excessAmountText : styles.duesAmountText;

                return (
                  <TouchableOpacity
                    key={card._id || index}
                    onPress={() => handleViewDetails(card.group_id._id, card.tickets)}
                    style={styles.groupCardEnhanced}
                  >
                    <LinearGradient
                      colors={[Colors.cardGradientStart, Colors.cardGradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardContentWrapper}
                    >
                      {/* Card Header */}
                      <View style={styles.cardHeader}>
                        <Text style={styles.groupCardNameEnhanced}>
                          {card.group_id.group_name}
                        </Text>
                        <Text style={styles.groupCardTicketEnhanced}>
                          Ticket: {card.tickets}
                        </Text>
                      </View>

                      {/* Financial Details Section */}
                      <View style={styles.financialDetailsSection}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Amount to be Paid:</Text>
                          <Text style={styles.detailAmount}>₹ {formatNumberIndianStyle(totalToBePaidAmount)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Total Paid:</Text>
                          <Text style={styles.detailAmount}>₹ {formatNumberIndianStyle(totalPaid)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Profit/Dividend:</Text>
                          <Text style={styles.detailAmount}>₹ {formatNumberIndianStyle(totalProfit)}</Text>
                        </View>
                      </View>

                      {/* Balance Status and Action Section */}
                      <LinearGradient
                        colors={balanceBoxColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.balanceStatusBox}
                      >
                        <View style={styles.balanceSummary}>
                          <MaterialIcons
                            name={balanceIcon}
                            size={24}
                            color={balanceIconColor}
                            style={styles.balanceIcon}
                          />
                          <Text style={styles.balanceMessage}>{balanceMessage}</Text>
                          <Text style={[styles.balanceAmount, balanceAmountStyle]}>
                            ₹ {formatNumberIndianStyle(Math.abs(balance))}
                          </Text>
                        </View>

                        {!isBalanceExcess && balance < 0 && (
                          <TouchableOpacity
                            onPress={() => handlePayNow(card.group_id._id, card.tickets, Math.abs(balance))}
                            style={styles.payNowButton}
                          >
                            <Text style={styles.payNowButtonText}>Pay Now</Text>
                            <MaterialIcons name="payment" size={18} color={Colors.payNowButtonText} style={{ marginLeft: 5 }} />
                          </TouchableOpacity>
                        )}
                      </LinearGradient>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noGroupsContainer}>
              <Image
                source={NoGroupImage}
                style={styles.noGroupImage}
                resizeMode="contain"
              />
              <Text style={styles.noGroupsText}>
                No groups to display after filtering.
              </Text>
              <Text style={styles.noGroupsSubText}>
                All groups with 'loan' in their name are excluded.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
  },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    marginHorizontal: 15,
    marginBottom: 55,
    borderRadius: 25,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 25,
    paddingTop: 5,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 34, // Slightly smaller for balance with other text
    color: Colors.darkText,
    textAlign: "center",
    
  },
  subSectionTitle: {
    fontSize: 18, // Adjusted size
    color: Colors.mediumText,
    textAlign: "center",
    marginBottom: 30, // More space
  },
  groupListContentContainer: {
    paddingBottom: 30,
  },
  groupCardEnhanced: {
    marginVertical: 12, // Consistent spacing between cards
    borderRadius: 20, // Rounded corners for individual cards
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderColor,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardContentWrapper: { // Inner content padding for the entire card
    padding: 20,
  },
  cardHeader: {
    marginBottom: 15, // Space after header
    borderBottomWidth: 1, // Subtle separator
    borderBottomColor: Colors.borderColor,
    paddingBottom: 10,
  },
  groupCardNameEnhanced: {
    fontWeight: "bold",
    fontSize: 22, // Larger group name
    color: Colors.groupNameColor,
    marginBottom: 5,
  },
  groupCardTicketEnhanced: {
    fontSize: 16,
    color: Colors.mediumText,
  },
  financialDetailsSection: {
    marginBottom: 20, // Space before balance section
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Spacing between detail rows
  },
  detailLabel: {
    fontWeight: '500',
    color: Colors.mediumText,
    flexShrink: 1,
    marginRight: 10,
    fontSize: 15,
  },
  detailAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  balanceStatusBox: {
    padding: 15,
    borderRadius: 15, // Rounded corners for the status box
    marginTop: 10,
    alignItems: 'center', // Center content horizontally
  },
  balanceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content within the row
    marginBottom: 10, // Space between summary and button
    flexWrap: 'wrap', // Allow wrapping for smaller screens
  },
  balanceIcon: {
    marginRight: 8,
  },
  balanceMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    flexShrink: 1, // Allow text to shrink
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10, // Space from message
  },
  excessAmountText: {
    color: Colors.successColor,
  },
  duesAmountText: {
    color: Colors.warningColor,
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.payNowButtonBackground,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 5, // Close to the balance info
    width: '80%', // Make button slightly wider
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  payNowButtonText: {
    color: Colors.payNowButtonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  noGroupsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 50,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    marginVertical: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 7,
      },
    }),
  },
  noGroupImage: {
    width: 200,
    height: 200,
    marginBottom: 25,
  },
  noGroupsText: {
    textAlign: "center",
    color: Colors.darkText,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noGroupsSubText: {
    textAlign: "center",
    color: Colors.mediumText,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: "90%",
  },
});

export default PayYourDues;