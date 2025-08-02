import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  View,
  Text, // Ensure Text is imported
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Platform,
  Vibration,
  LayoutAnimation,
  NativeModules,
  Animated, // Re-added Animated
  Easing,   // Re-added Easing
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import NoRecordFoundImage from "../../assets/NoRecordFound.png";
import AuctionIcon from "../../assets/Auction.png";
import { ContextProvider } from "../context/UserProvider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
if (Platform.OS === "android") {
  if (NativeModules.UIManager) {
    NativeModules.UIManager.setLayoutAnimationEnabledExperimental &&
      NativeModules.UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F0F5F9",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentGreen: "#2ECC71",
  accentBlue: "#053B90",
  buttonPrimary: "#00BCD4",
  buttonText: "#FFFFFF",
  shadowColor: "rgba(0,0,0,0.1)",

  gradientStart: "#FFFFFF",
  gradientEnd: "#E3F2FD",
  actionBoxBackground: "#F8F8F8",
  borderColor: "#E0E0E0",
  amountHighlight: "#E74C3C",

  darkInvestment: "#0A2647",
  darkProfit: "#196F3D",
  dateTextHighlight: "#007BFF",
  dateLabel: "#5D6D7E",
  selectedGroupBorder: "#007BFF",
  selectedGroupBackground: "#EBF5FF",
  accentOrange: "#FFA500",
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return "0";
  }
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";

  let isNegative = false;
  if (integerPart.startsWith("-")) {
    isNegative = true;
    integerPart = integerPart.substring(1);
  }

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    const formattedOtherNumbers = otherNumbers.replace(
      /\B(?=(\d{2})+(?!\d))/g,
      ","
    );
    return (
      (isNegative ? "-" : "") +
      formattedOtherNumbers +
      "," +
      lastThree +
      decimalPart
    );
  } else {
    return (isNegative ? "-" : "") + lastThree + decimalPart;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  if (dateString.includes("-")) {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  }
  return "N/A";
};

const AuctionList = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [TotalToBepaid, setTotalToBePaid] = useState(0);
  const [Totalpaid, setTotalPaid] = useState(0);
  const [Totalprofit, setTotalProfit] = useState(0);

  const [showingAuctionRecords, setShowingAuctionRecords] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedTicketNumber, setSelectedTicketNumber] = useState(null);
  const [auctionRecords, setAuctionRecords] = useState([]);
  const [auctionRecordsLoading, setAuctionRecordsLoading] = useState(false);
  const [auctionRecordsError, setAuctionRecordsError] = useState(null);

  const [highlightedCardId, setHighlightedCardId] = useState(null);

  const scrollViewRef = useRef(null);
  const contentWidthRef = useRef(0);
  const scrollViewWidthRef = useRef(0);
  const [maxScrollOffset, setMaxScrollOffset] = useState(0);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets/${userId}`
      );

      console.log("API Response Data for User Tickets:", response.data);
      setCardsData(response.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setCardsData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
    } catch (error) {
      console.error("Error fetching overview:", error);
    }
  }, [userId]);

  const fetchAuctionDetails = useCallback(async (groupId) => {
    if (!groupId) {
      setAuctionRecordsError("No Group ID provided.");
      return;
    }
    setAuctionRecordsLoading(true);
    setAuctionRecordsError(null);
    try {
      const auctionResponse = await axios.get(
        `${url}/auction/get-group-auction/${groupId}`
      );

      if (auctionResponse.status === 200) {
        setAuctionRecords(auctionResponse.data || []);
      } else {
        setAuctionRecordsError("Failed to fetch auction records.");
        setAuctionRecords([]);
      }
    } catch (error) {
      console.error("Error fetching auction details:", error);
      setAuctionRecordsError("Error fetching auction details.");
      setAuctionRecords([]);
    } finally {
      setAuctionRecordsLoading(false);
    }
  }, []);

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
      setShowingAuctionRecords(false);
      setSelectedGroupId(null);
      setSelectedTicketNumber(null);
      setAuctionRecords([]);
      setAuctionRecordsError(null);
      setHighlightedCardId(null);
      // Removed animationStoppedByUser.current = false; and animation starts
    }, [
      fetchTickets,
      fetchAllOverview,
      // Removed filteredCards, loading, maxScrollOffset from dependencies as they are not used here and cause re-renders
    ])
  );

  const filteredCards = cardsData.filter((card) => card.group_id !== null);

  // Removed startArrowAnimation and useEffect for animations

  const handleViewDetails = (enrollmentId, groupId, ticket) => {
    // Removed stopAutoScroll();
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHighlightedCardId(enrollmentId);
    setSelectedGroupId(groupId);
    setSelectedTicketNumber(ticket);
    setShowingAuctionRecords(true);
    fetchAuctionDetails(groupId);
  };

  // Removed handleScrollBeginDrag as auto-scroll is removed

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />

      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Auction</Text>
            <Image
              source={AuctionIcon}
              style={styles.headerAuctionIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subSentence}>
            Explore all your auction activities, past and present, right here.
          </Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primaryBlue}
              style={styles.loader}
            />
          ) : Array.isArray(filteredCards) && filteredCards.length > 0 ? (
            <View>
              <View style={styles.groupsWrapperBox}>
                <ScrollView
                  ref={scrollViewRef}
                  onLayout={(e) => {
                    scrollViewWidthRef.current = e.nativeEvent.layout.width;
                    if (contentWidthRef.current > scrollViewWidthRef.current) {
                      setMaxScrollOffset(
                        contentWidthRef.current - scrollViewWidthRef.current
                      );
                    } else {
                      setMaxScrollOffset(0);
                    }
                  }}
                  onContentSizeChange={(w, h) => {
                    contentWidthRef.current = w;
                    if (contentWidthRef.current > scrollViewWidthRef.current) {
                      setMaxScrollOffset(
                        contentWidthRef.current - scrollViewWidthRef.current
                      );
                    } else {
                      setMaxScrollOffset(0);
                    }
                  }}
                  contentContainerStyle={styles.groupListContentContainer}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  // Removed onScrollBeginDrag
                >
                  {filteredCards.map((card) => (
                    <View
                      key={card._id}
                      style={[
                        styles.groupCardEnhanced,
                        highlightedCardId === card._id &&
                          styles.selectedGroupCard,
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          handleViewDetails(
                            card._id,
                            card.group_id._id,
                            card.tickets
                          )
                        }
                        style={styles.fullCardTouchable}
                      >
                        <LinearGradient
                          colors={[Colors.gradientStart, Colors.gradientEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.infoGradientBox}
                        >
                          <View style={styles.iconContainer}>
                            <Image
                              source={AuctionIcon}
                              style={styles.groupCardIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.textDetailsContainer}>
                            <View style={styles.groupValueContainer}>
                              <Text style={styles.groupValue}>
                                ₹{" "}
                                {formatNumberIndianStyle(
                                  card.group_id.group_value
                                )}
                              </Text>
                            </View>

                            <Text style={styles.groupCardNameEnhanced}>
                              {card.group_id.group_name}
                            </Text>

                            {card.tickets !== undefined && (
                              <Text style={styles.groupCardTicketEnhanced}>
                                Ticket: {card.tickets}
                              </Text>
                            )}

                            {card.group_id?.amount_due !== undefined && (
                              <Text style={styles.highlightedAmountEnhanced}>
                                Amount: ₹{" "}
                                {formatNumberIndianStyle(
                                  card.group_id.amount_due
                                )}
                              </Text>
                            )}
                            {card.group_id?.auction_type && (
                              <View style={styles.auctionTypeWrapper}> {/* New wrapper for centering */}
                                <Text style={[
                                  styles.groupCardTicketEnhanced,
                                  styles.auctionTypeBaseText, // Apply base style for font weight
                                  card.group_id.auction_type.toLowerCase() === 'free'
                                    ? styles.auctionTypeOrangeText
                                    : styles.auctionTypeDefaultText, // Default for non-free
                                ]}>
                                  Auction Type:{" "} 
                                  {card.group_id.auction_type.charAt(0).toUpperCase() + card.group_id.auction_type.slice(1)}
                                </Text>
                              </View>
                            )}
                            <TouchableOpacity
                              onPress={() =>
                                handleViewDetails(
                                  card._id,
                                  card.group_id._id,
                                  card.tickets
                                )
                              }
                              style={styles.viewRecordsButton}
                            >
                                <MaterialIcons
                                  name="visibility" // Eye icon
                                  size={18}
                                  color={Colors.buttonText} // White color for the icon
                                />
                              <Text style={styles.viewRecordsButtonText}>
                                View Records
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Static Scroll Indicator using Text */}
              {Array.isArray(filteredCards) &&
                filteredCards.length > 1 &&
                !showingAuctionRecords &&
                maxScrollOffset > 0 && ( // Only show if scrollable
                  <View style={styles.scrollIndicatorTextContainer}>
                    <Text style={styles.scrollIndicatorText}>
                      {"<   Swipe   >"}
                    </Text>
                  </View>
                )}
            </View>
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

          {showingAuctionRecords && selectedGroupId && (
            <View style={styles.auctionRecordsContainer}>
              {auctionRecordsLoading ? (
                <ActivityIndicator
                  size="large"
                  color={Colors.primaryBlue}
                  style={styles.loader}
                />
              ) : auctionRecords.length > 0 ? (
                <ScrollView
                  contentContainerStyle={styles.auctionRecordsScrollContent}
                >
                  <Text style={styles.recordsListTitle}>
                      Auctions
                  </Text>
                  {auctionRecords.map((record, index) => (
                    <View
                      key={record._id || `auction-${index}`}
                      style={styles.auctionRecordCard}
                    >
                      <View style={styles.row}>
                        <Text style={styles.leftText}>
                          Auction Date: {formatDate(record.auction_date)}
                        </Text>
                        <Text style={styles.rightText}>
                          Next Date: {formatDate(record.next_date)}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.leftText}>
                          Win Ticket: {record.ticket || "N/A"}
                        </Text>
                      </View>
                      {record.auction_type && (
                        // This is the section for the "Normal Auction" text in the bottom cards
                        <View style={[styles.row, styles.auctionTypeRecordRow]}>
                          <Text style={[
                            styles.auctionTypeRecordText, // New style for centering and potential margin
                            styles.auctionTypeBaseText,
                            record.auction_type.toLowerCase() === 'free'
                              ? styles.auctionTypeOrangeText
                              : styles.auctionTypeDefaultText
                          ]}>
                             {record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1)} Auction 
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noDataContainer}>
                  <Image
                    source={NoRecordFoundImage}
                    style={styles.noDataImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.noDataText}>
                    No auction records found for this group.
                  </Text>
                </View>
              )}
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
    marginBottom: 60,
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
        elevation: 12,
      },
    }),
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,

    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "900",
    fontSize: 28,
    color: Colors.primaryBlue,
    letterSpacing: 1,
  },
  headerAuctionIcon: {
    width: 80,
    height: 60,
    marginLeft: -15,
  },
  subSentence: {
    fontSize: 16,
    color: Colors.mediumText,
    marginBottom: 25,
    textAlign: "center",
    paddingHorizontal: 25,
    lineHeight: 24,
  },
  groupsWrapperBox: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 15,
    paddingVertical: 10,
    marginBottom: 0,
  },
  groupListContentContainer: {
    paddingBottom: 0,
    paddingRight: 0,
    paddingHorizontal: 10,
  },
  groupCardEnhanced: {
    width: 300,
    height: 150,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.cardBackground,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  selectedGroupCard: {
    borderColor: Colors.selectedGroupBorder,
    borderWidth: 3,
    backgroundColor: Colors.selectedGroupBackground,
    ...Platform.select({
      ios: {
        shadowColor: Colors.selectedGroupBorder,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.7,
        shadowRadius: 15,
      },
      android: {
        elevation: 18,
      },
    }),
    transform: [{ scale: 1.07 }],
  },
  fullCardTouchable: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  infoGradientBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.2)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  groupCardIcon: {
    width: 24,
    height: 24,
    tintColor: "yellow",
  },
  textDetailsContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  groupValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  groupValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFA500",
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  groupCardNameEnhanced: {
    fontWeight: "700",
    fontSize: 17,
    color: Colors.darkText,
    marginTop: 6,
  },
  groupCardTicketEnhanced: {
    fontSize: 14,
    color: Colors.mediumText,
  },
  highlightedAmountEnhanced: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.amountHighlight,
    marginTop: 6,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 120,
  },
  noGroupsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 45,
    backgroundColor: Colors.gradientEnd,
    borderRadius: 20,
    marginVertical: 25,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    ...Platform.select({
      ios: {
        shadowColor: Colors.accentBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  noGroupImage: {
    width: 90,
    height: 90,
    marginBottom: 15,
  },
  noGroupsText: {
    textAlign: "center",
    color: Colors.darkText,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noGroupsSubText: {
    textAlign: "center",
    color: Colors.mediumText,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "90%",
  },

  auctionRecordsContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  recordsListTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primaryBlue,
    marginBottom: 10,
    textAlign: "center",
  },
  auctionRecordsScrollContent: {
    paddingBottom: 40,
  },
  auctionRecordCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: 22,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  leftText: {
    flex: 1,
    textAlign: "left",
    fontSize: 18,
    color: Colors.darkText,
    fontWeight: "500",
  },
  rightText: {
    flex: 1,
    textAlign: "right",
    fontSize: 18,
    color: Colors.darkText,
    fontWeight: "500",
  },

  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 50,

    borderRadius: 20,
    marginVertical: 30,
  },
  noDataText: {
    fontSize: 15,
    color: Colors.darkText,
    textAlign: "center",
    fontWeight: "300",
    marginTop: 30,
    paddingHorizontal: 30,
  },
  noDataImage: {
    width: 220,
    height: 200,
    marginBottom: 20,
  },
 viewRecordsButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.accentBlue, // Blue background
    flexDirection: 'row', // To align icon and text
    alignItems: 'center', // Align items vertically
    justifyContent: 'center', // Center content horizontally
    alignSelf: "flex-start",
    // Added shadow styles below
    ...Platform.select({
        ios: {
            shadowColor: Colors.shadowColor, // Using existing shadowColor
            shadowOffset: { width: 0, height: 10 }, // Adjust height for bottom shadow
            shadowOpacity: 0.5,
            shadowRadius: 5,
        },
        android: {
            elevation: 8, // Adjust elevation for Android shadow depth
        },
    }),
},
  viewRecordsButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.buttonText, // White text color
    marginLeft: 5, // Space between icon and text
  },

  // Style for the "Auction Type" wrapper in the top cards
  auctionTypeWrapper: {
    width: '100%', // Take full width of its parent to allow centering
    alignItems: 'center', // Center content horizontally within this wrapper
    marginTop: 5, // Add some vertical spacing
    marginBottom: 5,
  },

  // New styles for the static scroll indicator (using Text)
  scrollIndicatorTextContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  scrollIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.accentBlue,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: Colors.gradientEnd, // A subtle background for visibility
    overflow: 'hidden', // Ensures border radius clips text correctly
  },
  auctionTypeBaseText: {
    fontWeight: "bold",
  },
  auctionTypeDefaultText: {
    color: Colors.darkProfit, // Default color for non-free auction types in main card
  },
  auctionTypeOrangeText: {
    color: Colors.accentOrange, // Orange color for 'free' auction type
  },
  // Added new styles for the auction type in the auction records section
  auctionTypeRecordRow: {
    justifyContent: 'center', // Center content horizontally within this row
    width: '100%', // Ensure the row takes full width
  },
  auctionTypeRecordText: {
    fontSize: 18, // Adjust font size as needed
    color: Colors.darkText, // Default text color
    textAlign: 'center', // Center the text within itself
    marginLeft: 20, // Adjust this value to shift it slightly to the right
    marginRight: 20, // Optional: to keep it from going too far if text is very long
  },
});

export default AuctionList;