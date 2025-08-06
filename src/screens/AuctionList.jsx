import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
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
  LayoutAnimation,
  NativeModules,
  Dimensions,
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

// Enable LayoutAnimation for Android
if (Platform.OS === "android") {
  if (NativeModules.UIManager) {
    NativeModules.UIManager.setLayoutAnimationEnabledExperimental &&
      NativeModules.UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get("window"); // Get screen width for responsive adjustments

const Colors = {
  // Original/Implied colors
  primaryBlue: "#053B90",
  lightBackground: "#F0F5F9",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentGreen: "#2ECC71",
  accentBlue: "#3499DB",
  buttonPrimary: "#00BCD4",
  buttonText: "#FFFFFF",
  shadowColor: "rgba(0,0,0,0.1)",
  shadowColorStrong: "rgba(0,0,0,0.2)",
  gradientStart: "#FFFFFF",
  gradientEnd: "#F9FCFF",
  borderColor: "#E0E6EB",
  actionBoxBackground: "#ECF0F1",
  
  // Specific text colors
  groupValueHighlight: "#E67E22",
  ticketNumberColor: "#3498DB",
  amountDueColor: "#E74C3C",
  goldColor: '#FFD700',
  selectedBorder: "#F39C12",
  selectedBackground: "#FFF8E1",
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
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    }
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
  }
  return "N/A";
};

const AuctionList = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [TotalToBepaid] = useState(0); 
  const [Totalpaid] = useState(0); 
  const [Totalprofit] = useState(0); 

  const [showingAuctionRecords, setShowingAuctionRecords] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedTicketNumber, setSelectedTicketNumber] = useState(null);
  const [auctionRecords, setAuctionRecords] = useState([]);
  const [auctionRecordsLoading, setAuctionRecordsLoading] = useState(false);
  const [auctionRecordsError, setAuctionRecordsError] = useState(null);

  const [highlightedCardId, setHighlightedCardId] = useState(null);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets/${userId}`
      );
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
    } catch (error) {
      console.error("Error fetching overview:", error);
    }
  }, [userId]);

  const fetchAuctionDetails = useCallback(async (groupId) => {
    if (!groupId) {
      setAuctionRecordsError("No Group ID provided.");
      setAuctionRecords([]);
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
      // Reset state when screen gains focus
      setShowingAuctionRecords(false);
      setSelectedGroupId(null);
      setSelectedTicketNumber(null);
      setAuctionRecords([]);
      setAuctionRecordsError(null);
      setHighlightedCardId(null);
    }, [fetchTickets, fetchAllOverview])
  );

  const filteredCards = cardsData.filter((card) => card.group_id !== null);

  const handleViewDetails = (enrollmentId, groupId, ticket) => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHighlightedCardId(enrollmentId);
    setSelectedGroupId(groupId);
    setSelectedTicketNumber(ticket);
    setShowingAuctionRecords(true);
    fetchAuctionDetails(groupId);
  };

  const handleBackToGroups = () => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowingAuctionRecords(false);
    setSelectedGroupId(null);
    setSelectedTicketNumber(null);
    setAuctionRecords([]);
    setAuctionRecordsError(null);
    setHighlightedCardId(null);
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
          {/* Conditional rendering for group list and related elements */}
          {!showingAuctionRecords && (
            <>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Auctions</Text>
                <MaterialCommunityIcons
                  name="gavel"
                  size={42}
                  color={Colors.goldColor}
                  style={styles.headerAuctionIcon}
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
                <View style={styles.groupsWrapperBox}>
                  <ScrollView
                    contentContainerStyle={styles.groupListContentContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredCards.map((card) => (
                      <TouchableOpacity
                        key={card._id}
                        onPress={() =>
                          handleViewDetails(
                            card._id,
                            card.group_id._id,
                            card.tickets
                          )
                        }
                        style={[
                          styles.groupCardEnhanced,
                          highlightedCardId === card._id &&
                            styles.selectedGroupCard,
                        ]}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={[Colors.gradientStart, Colors.gradientEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.infoGradientBox}
                        >
                          <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                              name="gavel"
                              size={38}
                              color={Colors.goldColor}
                              style={styles.groupCardIcon}
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
                                Ticket: <Text style={{fontWeight: 'bold', color: Colors.ticketNumberColor}}>{card.tickets}</Text>
                              </Text>
                            )}

                            {card.group_id?.amount_due !== undefined && (
                              <Text style={styles.highlightedAmountEnhanced}>
                                Installment: ₹{" "}
                                {formatNumberIndianStyle(
                                  card.group_id.amount_due
                                )}
                              </Text>
                            )}
                            {card.group_id?.auction_type && (
                              <View style={styles.auctionTypeWrapper}>
                                <Text
                                  style={[
                                    styles.auctionTypeBaseText,
                                    card.group_id.auction_type.toLowerCase() ===
                                    "free"
                                      ? styles.auctionTypeOrangeText
                                      : styles.auctionTypeDefaultText,
                                  ]}
                                >
                                  Auction Type:{" "}
                                  <Text style={{fontWeight: 'bold'}}>
                                    {card.group_id.auction_type
                                      .charAt(0)
                                      .toUpperCase() +
                                      card.group_id.auction_type.slice(1)}
                                  </Text>
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
                              activeOpacity={0.7}
                            >
                              <MaterialIcons
                                name="visibility"
                                size={18}
                                color={Colors.buttonText}
                              />
                              <Text style={styles.viewRecordsButtonText}>
                                View Auctions
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
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
            </>
          )}

          {showingAuctionRecords && selectedGroupId && (
            <View style={styles.auctionRecordsContainer}>
              <TouchableOpacity
                onPress={handleBackToGroups}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={22}
                  color={Colors.primaryBlue}
                />
                <Text style={styles.backButtonText}>Back to Groups</Text>
              </TouchableOpacity>
              {auctionRecordsLoading ? (
                <ActivityIndicator
                  size="large"
                  color={Colors.primaryBlue}
                  style={styles.loader}
                />
              ) : auctionRecords.length > 0 ? (
                <ScrollView
                  contentContainerStyle={styles.auctionRecordsScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.recordsListTitle}>
                    Auction Records
                  </Text>
                  {auctionRecords.map((record, index) => (
                    <View
                      key={record._id || `auction-${index}`}
                      style={styles.auctionRecordCard}
                    >
                      <View style={styles.row}>
                        <Text style={styles.leftText}>Auction Date:</Text>
                        <Text style={styles.rightText}>
                          {formatDate(record.auction_date)}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.leftText}>Next Date:</Text>
                        <Text style={styles.rightText}>
                          {formatDate(record.next_date)}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.leftText}>Win Ticket:</Text>
                        <Text style={styles.rightText}>
                          {record.ticket || "N/A"}
                        </Text>
                      </View>
                      {record.auction_type && (
                        <View style={[styles.row, styles.auctionTypeRecordRow]}>
                          <Text
                            style={[
                              styles.auctionTypeRecordText,
                              styles.auctionTypeBaseText,
                              record.auction_type.toLowerCase() === "free"
                                ? styles.auctionTypeOrangeText
                                : styles.auctionTypeDefaultText,
                            ]}
                          >
                            <Text style={{fontWeight: 'bold'}}>
                                {record.auction_type
                                .charAt(0)
                                .toUpperCase() +
                                record.auction_type.slice(1)}
                            </Text>{" "}
                            Auction
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
        shadowColor: Colors.shadowColorStrong,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
      },
      android: {
        elevation: 18,
      },
    }),
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "900", // Bolder font
    fontSize: 38, // Slightly larger
    color: Colors.primaryBlue,
    letterSpacing: 1, // Increased letter spacing
  },
  headerAuctionIcon: {
    width: 65,
    height: 55,
    marginLeft: 5, // Adjusted margin to be next to text
    marginTop: 5,
  },
  subSentence: {
    fontSize: 16, // Slightly larger font
    color: Colors.mediumText,
    marginBottom: 35, // More vertical space
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 24, // Increased line height for readability
  },
  groupsWrapperBox: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 20,
    paddingVertical: 15, // Increased padding
    flex: 1,
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColorStrong,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  groupListContentContainer: {
    paddingBottom: 20, // Increased bottom padding
    paddingHorizontal: 15, // Increased horizontal padding
    alignItems: "center",
  },
  groupCardEnhanced: {
    width: width * 0.9, // Wider card
    minHeight: 180, // Taller card
    marginVertical: 12, // Increased vertical margin
    borderRadius: 20, // More rounded corners
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6EBF0", // Softer border color
    backgroundColor: Colors.cardBackground,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  selectedGroupCard: {
    borderColor: Colors.selectedBorder,
    borderWidth: 2,
    backgroundColor: Colors.selectedBackground,
    ...Platform.select({
      ios: {
        shadowColor: Colors.selectedBorder,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
      },
    }),
    transform: [{ scale: 1.02 }],
  },
  infoGradientBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25, // Increased vertical padding
    paddingHorizontal: 25, // Increased horizontal padding
    flex: 1,
  },
  iconContainer: {
    width: 65, // Larger icon container
    height: 65,
    borderRadius: 32.5,
    backgroundColor: Colors.primaryBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 25, // More space
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColorStrong,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  groupCardIcon: {
    width: 38, // Larger icon
    height: 38,
    tintColor: Colors.goldColor,
  },
  textDetailsContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 5,
  },
  groupValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  groupValue: {
    fontSize: 30, // Larger font
    fontWeight: "900",
    color: Colors.groupValueHighlight,
    letterSpacing: 1, // Increased letter spacing
  },
  groupCardNameEnhanced: {
    fontWeight: "700",
    fontSize: 19, // Larger font
    color: Colors.darkText,
    marginBottom: 5,
  },
  groupCardTicketEnhanced: {
    fontSize: 16, // Larger font
    color: Colors.mediumText,
    marginBottom: 5,
  },
  highlightedAmountEnhanced: {
    fontSize: 19, // Larger font
    fontWeight: "bold",
    color: Colors.amountDueColor,
    marginTop: 8,
    marginBottom: 10,
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
    paddingHorizontal: 20,
    paddingVertical: 50,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  noGroupImage: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  noGroupsText: {
    textAlign: "center",
    color: Colors.darkText,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noGroupsSubText: {
    textAlign: "center",
    color: Colors.mediumText,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: "90%",
  },
  auctionRecordsContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 15,
  },
  recordsListTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.primaryBlue,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  auctionRecordsScrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 15,
  },
  auctionRecordCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 7,
      },
    }),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    alignItems: 'center',
  },
  leftText: {
    flex: 1,
    textAlign: "left",
    fontSize: 16,
    color: Colors.mediumText,
    fontWeight: "500",
  },
  rightText: {
    flex: 1,
    textAlign: "right",
    fontSize: 16,
    color: Colors.darkText,
    fontWeight: "600",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  noDataText: {
    fontSize: 16,
    color: Colors.darkText,
    textAlign: "center",
    fontWeight: "500",
    marginTop: 25,
    paddingHorizontal: 15,
    lineHeight: 24,
  },
  noDataImage: {
    width: 200,
    height: 180,
    marginBottom: 15,
  },
  viewRecordsButton: {
    marginTop: 20, // Increased margin
    paddingVertical: 16, // Larger button
    paddingHorizontal: 30, // Wider button
    borderRadius: 14, // More rounded
    backgroundColor: Colors.accentBlue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  viewRecordsButtonText: {
    fontSize: 17, // Larger font
    fontWeight: "700",
    color: Colors.buttonText,
    marginLeft: 12, // More space between icon and text
  },
  auctionTypeWrapper: {
    width: "100%",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 6,
  },
  auctionTypeBaseText: {
    fontWeight: "600",
    fontSize: 15,
  },
  auctionTypeDefaultText: {
    color: Colors.darkText,
  },
  auctionTypeOrangeText: {
    color: Colors.groupValueHighlight,
  },
  auctionTypeRecordRow: {
    justifyContent: "flex-start",
    width: "100%",
    marginTop: 8,
    marginBottom: 0,
  },
  auctionTypeRecordText: {
    fontSize: 16,
    color: Colors.darkText,
    textAlign: "left",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 25,
    borderRadius: 12,
    backgroundColor: Colors.actionBoxBackground,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 7,
      },
    }),
  },
  backButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primaryBlue,
  },
});

export default AuctionList;
