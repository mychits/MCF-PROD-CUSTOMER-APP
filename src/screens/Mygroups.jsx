import React, { useState, useEffect, useCallback, useContext, useRef } from "react"; // Import useRef
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
  Animated,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

const Colors = {
  primaryBlue: "#053B90", // Dark blue, main app color
  lightBackground: "#F0F5F9", // Very light grey-blue for screen background
  cardBackground: "#FFFFFF", // Pure white for card base
  darkText: "#2C3E50", // Dark grey for primary text
  mediumText: "#7F8C8D", // Medium grey for secondary text
  lightText: "#BDC3C7", // Light grey for subtle labels
  accentGreen: "#2ECC71", // Bright green for profit/positive
  accentBlue: "#3499DB", // Vibrant blue for investment/neutral
  buttonPrimary: "#00BCD4", // Teal/Cyan for main action button
  buttonText: "#FFFFFF", // White for button text
  shadowColor: "rgba(0,0,0,0.1)", // Light shadow for depth

  gradientStart: "#FFFFFF", // White or very light blue
  gradientEnd: "#C4D9ED", // Lighter blue for a soft transition
  actionBoxBackground: "#F8F8F8", // Very light grey for action section
  borderColor: "#E0E0E0", // Consistent light border
  amountHighlight: "#E74C3C", // Red for amounts (or you could use a strong blue/green if it represents a positive due amount)

  darkInvestment: "#0A2647", // A very dark blue, almost black-blue
  darkProfit: "#196F3D", // A deep, rich green
  dateTextHighlight: "#007BFF", // A distinct blue for dates
  dateLabel: "#5D6D7E", // Slightly darker grey for date labels

  // New/Adjusted colors for enhanced design
  cardGradientStart: "#F8FBFE", // Lighter start for card background
  cardGradientEnd: "#EBF3FC", // Light blue tint for card background
  groupValueColor: "#E67E22", // A vibrant orange for group value
  ticketColor: "#3498DB", // A distinct blue for ticket number
  paidAmountColor: "#27AE60", // Green for paid amount
  cardBorder: "#DCE1E7", // Soft border for cards
  subtleText: '#5A6A7D', // A softer dark text
  iconBorderHighlight: 'rgba(255,255,255,0.5)', // Brighter border for icon
  cardShadowLight: 'rgba(0,0,0,0.08)', // Lighter, more diffused shadow
  goldColor: '#FFD700', // Gold color for currency icon
};

// Helper function to format numbers with commas in Indian style (e.g., 2,51,500)
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) {
    return "0";
  }
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";

  // Handle negative numbers
  let isNegative = false;
  if (integerPart.startsWith("-")) {
    isNegative = true;
    integerPart = integerPart.substring(1);
  }

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return (isNegative ? "-" : "") + formattedOtherNumbers + "," + lastThree + decimalPart;
  } else {
    return (isNegative ? "-" : "") + lastThree + decimalPart;
  }
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const Mygroups = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [TotalToBepaid, setTotalToBePaid] = useState(0);
  const [Totalpaid, setTotalPaid] = useState(0);
  const [Totalprofit, setTotalProfit] = useState(0);
  const [individualGroupReports, setIndividualGroupReports] = useState({});

  // Use useRef to store Animated.Value instances
  // This ensures Hooks are called consistently, and the ref.current can be updated.
  const animatedCardValues = useRef({});

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets/${userId}`
      );

      setCardsData(response.data || []);

      // Initialize or reset animated values when new data arrives
      animatedCardValues.current = {}; // Clear previous values
      response.data.forEach((_, index) => {
        animatedCardValues.current[index] = {
          fadeAnim: new Animated.Value(0),
          scaleAnim: new Animated.Value(1),
        };
        // Start fade-in animations after data is set
        Animated.timing(animatedCardValues.current[index].fadeAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 100, // Staggered animation
          useNativeDriver: true,
        }).start();
      });

    } catch (error) {
      console.error("Error fetching tickets:", error);
      setCardsData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Removed cardsData.length from dependency array

  const fetchAllOverview = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets-report/${userId}`
      );
      const data = response.data;

      const totalToBePaidAmount = data.reduce(
        (sum, group) =>
          sum +
          (group?.payable?.totalPayable +
            (parseInt(group?.enrollment?.group?.group_install) || 0) || 0),
        0
      );
      setTotalToBePaid(totalToBePaidAmount);

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

      // Create a map for individual group reports for quick lookup
      const reportsMap = {};
      data.forEach((groupReport) => {
        if (
          groupReport.enrollment &&
          groupReport.enrollment.group &&
          groupReport.enrollment.tickets !== undefined
        ) {
          const groupIdFromReport =
            groupReport.enrollment.group._id || groupReport.enrollment.group;
          const key = `${groupIdFromReport}-${groupReport.enrollment.tickets}`;
          reportsMap[key] = {
            totalPaid: groupReport.payments?.totalPaidAmount || 0,
            totalProfit: groupReport.profit?.totalProfit || 0,
          };
        }
      });
      setIndividualGroupReports(reportsMap);
    } catch (error) {
      console.error("Error fetching overview:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTickets();
      fetchAllOverview();
    }
  }, [userId, fetchTickets, fetchAllOverview]);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
      fetchAllOverview();
    }, [fetchTickets, fetchAllOverview])
  );

  const filteredCards = cardsData.filter((card) => card.group_id !== null);

  const handlePressIn = (index) => {
    Vibration.vibrate(20); // Shorter vibration for press-in
    Animated.spring(animatedCardValues.current[index].scaleAnim, { // Access from ref
      toValue: 0.96, // Slightly shrink on press
      useNativeDriver: true,
      bounciness: 12,
    }).start();
  };

  const handlePressOut = (index, groupId, ticket) => {
    Animated.spring(animatedCardValues.current[index].scaleAnim, { // Access from ref
      toValue: 1, // Return to original size
      useNativeDriver: true,
      bounciness: 12,
    }).start(() => {
      navigation.navigate("BottomTab", {
        screen: "EnrollTab",
        params: {
          screen: "EnrollGroup",
          params: {
            userId: userId,
            groupId: groupId,
            ticket: ticket,
          },
        },
      });
    });
  };

  // Determine the display value for Total Profit based on Total Investment
  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit;

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />

      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <Text style={styles.sectionTitle}>My Groups</Text>

          <View style={styles.summaryCardsRow}>
            {/* Investment Card */}
            <View style={[styles.summaryCard, styles.investmentCardBackground]}>
              <FontAwesome5
                name="wallet"
                size={20}
                color={Colors.buttonText}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryAmount}>
                ₹ {formatNumberIndianStyle(Totalpaid || 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Investment</Text>
            </View>
            {/* Profit Card */}
            <View style={[styles.summaryCard, styles.profitCardBackground]}>
              <FontAwesome5
                name="chart-line"
                size={20}
                color={Colors.buttonText}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryAmount}>
                ₹ {formatNumberIndianStyle(displayTotalProfit || 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Dividend / Profit </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primaryBlue}
              style={styles.loader}
            />
          ) : filteredCards.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.groupListContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {filteredCards.map((card, index) => {
                const groupIdFromCard = card.group_id?._id || card.group_id;
                const groupReportKey = `${groupIdFromCard}-${card.tickets}`;
                const individualPaidAmount =
                  individualGroupReports[groupReportKey]?.totalPaid || 0;

                // Safely access animated values from useRef
                const fadeAnim = animatedCardValues.current[index]?.fadeAnim || new Animated.Value(1);
                const scaleAnim = animatedCardValues.current[index]?.scaleAnim || new Animated.Value(1);

                return (
                  <Animated.View
                    key={card._id || index}
                    style={[
                      styles.groupCardAnimated,
                      { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.groupCardTouchable}
                      onPressIn={() => handlePressIn(index)}
                      onPressOut={() =>
                        handlePressOut(index, card.group_id._id, card.tickets)
                      }
                      activeOpacity={1}
                    >
                      <LinearGradient
                        colors={[Colors.cardGradientStart, Colors.cardGradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.infoGradientBox}
                      >
                        <View style={styles.iconContainer}>
                          <MaterialCommunityIcons
                            name="currency-inr"
                            size={30}
                            color={Colors.goldColor}
                          />
                        </View>
                        <View style={styles.textDetailsContainer}>
                          {/* Group Value */}
                          <Text style={styles.groupValue}>
                            ₹ {formatNumberIndianStyle(card.group_id.group_value)}
                          </Text>

                          {/* Group Name */}
                          <Text style={styles.groupCardNameEnhanced}>
                            {card.group_id.group_name}
                          </Text>

                          {/* Display Ticket */}
                          <Text style={styles.groupCardTicketEnhanced}>
                            Ticket: <Text style={{ fontWeight: 'bold', color: Colors.ticketColor }}>{card.tickets}</Text>
                          </Text>

                          {/* Display Individual Paid Amount */}
                          <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>Paid:</Text>
                            <Text style={styles.highlightedAmountEnhanced}>
                              ₹ {formatNumberIndianStyle(individualPaidAmount)}
                            </Text>
                          </View>

                          {/* Start and End Dates */}
                          {(card.group_id?.start_date || card.group_id?.end_date) && (
                            <View style={styles.dateContainer}>
                              {card.group_id?.start_date && (
                                <View style={styles.dateItem}>
                                  <MaterialIcons
                                    name="event-available"
                                    size={16}
                                    color={Colors.dateLabel}
                                  />
                                  <Text style={styles.dateLabelText}>Start:</Text>
                                  <Text style={styles.dateTextHighlight}>
                                    {formatDate(card.group_id.start_date)}
                                  </Text>
                                </View>
                              )}
                              {card.group_id?.end_date && (
                                <View style={styles.dateItem}>
                                  <MaterialIcons
                                    name="event-busy"
                                    size={16}
                                    color={Colors.dateLabel}
                                  />
                                  <Text style={styles.dateLabelText}>End:</Text>
                                  <Text style={styles.dateTextHighlight}>
                                    {formatDate(card.group_id.end_date)}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
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
                No groups found for this user.
              </Text>
              <Text style={styles.noGroupsSubText}>
                Join a group to track your payments here!
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
    marginHorizontal: 10,
    marginBottom: 50,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 24,
    color: Colors.darkText,
    textAlign: "center",
    marginBottom: 15,
  },
  summaryCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  investmentCardBackground: {
    backgroundColor: Colors.darkInvestment,
  },
  profitCardBackground: {
    backgroundColor: Colors.darkProfit,
  },
  summaryIcon: {
    marginBottom: 10,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.buttonText,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.buttonText,
    marginTop: 5,
    textAlign: "center",
    fontWeight: "600",
  },
  groupListContentContainer: {
    paddingBottom: 20,
  },
  groupCardAnimated: {
    marginVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cardBackground, // Ensure background is set for shadow consistency
    ...Platform.select({
      ios: {
        shadowColor: Colors.cardShadowLight,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  groupCardTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  infoGradientBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 22,
    minHeight: 150,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 2,
    borderColor: Colors.iconBorderHighlight,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  textDetailsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  groupValue: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.groupValueColor,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  groupCardNameEnhanced: {
    fontWeight: "800",
    fontSize: 20,
    color: Colors.darkText,
    marginBottom: 6,
  },
  groupCardTicketEnhanced: {
    fontSize: 15,
    color: Colors.subtleText,
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 15,
    color: Colors.mediumText,
    marginRight: 8,
    fontWeight: '600',
  },
  highlightedAmountEnhanced: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.paidAmountColor,
  },
  dateContainer: {
    flexDirection: "column",
    marginTop: 12,
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateLabelText: {
    fontFamily: 'YourRegularFont',
    fontSize: 14, // Slightly larger date label
    color: Colors.dateLabel,
    fontWeight: "600",
    marginRight: 8, // More space
  },
  dateTextHighlight: {
    fontFamily: 'YourSemiBoldFont',
    fontSize: 15, // Slightly larger date text
    fontWeight: "700",
    color: Colors.dateTextHighlight,
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
    paddingHorizontal: 30, // Increased padding
    paddingVertical: 60, // Increased vertical padding
    backgroundColor: Colors.lightBackground,
    borderRadius: 20, // Match main container's rounding
    marginVertical: 25,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  noGroupImage: {
    width: 180, // Larger image
    height: 180,
    marginBottom: 20, // More space
  },
  noGroupsText: {
    fontFamily: 'YourBoldFont',
    textAlign: "center",
    color: Colors.darkText,
    fontSize: 22, // Larger text
    fontWeight: "bold",
    marginBottom: 12,
  },
  noGroupsSubText: {
    fontFamily: 'YourRegularFont',
    textAlign: "center",
    color: Colors.mediumText,
    fontSize: 17, // Slightly larger subtext
    lineHeight: 26, // Improved line height
    maxWidth: "90%",
  },
});
export default Mygroups;