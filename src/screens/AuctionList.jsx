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
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import NoRecordFoundImage from "../../assets/NoRecordFound.png";
import { ContextProvider } from "../context/UserProvider";

// Enable LayoutAnimation for Android
if (Platform.OS === "android") {
  if (NativeModules.UIManager) {
    NativeModules.UIManager.setLayoutAnimationEnabledExperimental &&
      NativeModules.UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get("window");

// A consolidated and more organized color palette
const Colors = {
  primary: "#053B90", // Dark Blue
  primaryLight: "#1F55A4",
  backgroundLight: "#F0F5F9",
  card: "#FFFFFF",
  textDark: "#212121", // Darker text for more contrast
  textMedium: "#757575",
  accentOrange: "#F48024", // Vibrant Orange for Free Auction
  accentBlue: "#3F51B5", // Soft Indigo for Dates
  accentGreen: "#4CAF50", // Standard Green
  successGreen: "#388E3C", // Deeper Green for metrics background
  gold: "#FFC300",
  error: "#E74C3C",
  border: "#E0E0E0",
  shadow: "rgba(0,0,0,0.1)",
  selectedBorder: "#F39C12",
  selectedBackground: "#FFF8E1",
  lightDivider: "#EEEEEE",
  // New unique colors
  dataPanelBg: "#F5F5F5", // Light grey background for segmented details
  metricPanelBg: "#E8F5E9", // Light green for financial metric
};

// Helper function to format numbers in Indian style
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return "";
  }
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";
  const isNegative = integerPart.startsWith("-");
  if (isNegative) {
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

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      // Format: e.g., "10 Jun 2025"
      const parts = date.toLocaleDateString('en-US', options).split(' ');
      return `${parts[1].replace(',', '')} ${parts[0]} ${parts[2]}`;
    }
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
  }
  return "";
};

// Extracted sub-component for a single group card (remains the same)
const GroupCard = ({ card, onSelect, isHighlighted, cardRadius = 20 }) => {
  const { group_id, tickets, _id } = card;
  const { group_name, group_value, amount_due, auction_type } = group_id || {};

  const safeAuctionType = auction_type || "";
  const formattedAuctionType = safeAuctionType !== "" ? safeAuctionType.charAt(0).toUpperCase() + safeAuctionType.slice(1) : "";
  const isFreeAuction = safeAuctionType.toLowerCase() === "free";

  return (
    <View
      style={[
        styles.newGroupCard,
        isHighlighted && styles.selectedNewGroupCard,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardHeaderTitle}>{group_name || ""}</Text>
          {formattedAuctionType && (
            <View style={styles.auctionTypeTag}>
              <Text
                style={[
                  styles.auctionTypeTagText,
                  isFreeAuction
                    ? styles.auctionTypeOrangeText
                    : styles.auctionTypeDefaultText,
                ]}
              >
                {formattedAuctionType}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoTitle}>Group Value:</Text>
          <Text style={styles.infoValue}>
            ₹ {formatNumberIndianStyle(group_value)}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSelect(_id, group_id?._id, tickets)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="list-alt"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.actionButtonLabel}>View Auctions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSelect(_id, group_id?._id, tickets)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="timeline"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.actionButtonLabel}>Auction Details</Text>
        </TouchableOpacity>
       
      </View>
    </View>
  );
};


// Extracted sub-component for displaying auction records - NEW SLEEK DESIGN
const AuctionRecordsView = ({
  records,
  onBack,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
    );
  }

  const showNoRecordsMessage = records.length === 0 || error;

  if (showNoRecordsMessage) {
    return (
      <View style={styles.auctionRecordsContainer}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back to Groups</Text>
        </TouchableOpacity>
        <View style={styles.noDataContainer}>
          <Image source={NoRecordFoundImage} style={styles.noDataImage} resizeMode="contain" />
          <Text style={styles.noDataText}>
            {error || "No auction records found for this group."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.auctionRecordsContainer}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        <Text style={styles.backButtonText}>Back to Groups</Text>
      </TouchableOpacity>
      <Text style={styles.recordsListTitle}>Auction Records</Text>
      <ScrollView contentContainerStyle={styles.auctionRecordsScrollContent} showsVerticalScrollIndicator={false}>
        {records.map((record, index) => {
          const isFreeAuctionRecord = record.auction_type?.toLowerCase() === "free";
          const formattedAuctionType = record.auction_type
            ? record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1)
            : "Normal"; 
          
          const recordNumber = records.length - index;
            
          return (
            <View key={record._id || `auction-${index}`} style={styles.auctionRecordCard}>
              
              {/* === 1. Sequential Number Chip (Header) === */}
              <View style={styles.recordNumberChip}>
                 <MaterialCommunityIcons name="gavel" size={16} color={Colors.card} />
                 <Text style={styles.recordNumberChipText}>RECORD {recordNumber}</Text>
              </View>
              
              {/* === 2. Segmented Date Block === */}
              <View style={styles.dateSegmentContainer}>
                 {/* Auction Date */}
                 <View style={styles.dateSegment}>
                    <MaterialCommunityIcons name="calendar-start" size={20} color={Colors.accentBlue} />
                    <Text style={styles.dateSegmentTitle}>Auction Date</Text>
                    <Text style={styles.dateSegmentValue}>{formatDate(record.auction_date)}</Text>
                 </View>
                 
                 {/* Next Date */}
                 <View style={[styles.dateSegment, styles.dateSegmentSeparator]}>
                    <MaterialCommunityIcons name="calendar-end" size={20} color={Colors.accentBlue} />
                    <Text style={styles.dateSegmentTitle}>Next Date</Text>
                    <Text style={styles.dateSegmentValue}>{formatDate(record.next_date)}</Text>
                 </View>
              </View>

              {/* === 3. Secondary Info List === */}
              <View style={styles.secondaryInfoList}>
                 {/* Auction Type */}
                 <View style={styles.infoRow}>
                   
                    <Text style={styles.infoTitle}>Auction Type</Text>
                    <Text style={[styles.infoValue, {color: isFreeAuctionRecord ? Colors.accentOrange : Colors.textDark}]}>
                        {formattedAuctionType}
                    </Text>
                 </View>
                 <View style={styles.infoListDivider} />
                 
                 {/* Bid Percentage */}
                 <View style={styles.infoRow}>
                  
                    <Text style={styles.infoTitle}>Bid Percentage</Text>
                    <Text style={styles.infoValue}>
                        {record.bid_percentage || "0"}%
                    </Text>
                 </View>
              </View>
              
              {/* === 4. Footer Metrics Panel === */}
              <View style={styles.footerMetricsPanel}>
                 
                 {/* Win Ticket */}
                 <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, {color: Colors.textMedium}]}>WINNING TICKET</Text>
                    <Text style={styles.metricTicketValue}>{record.ticket || "N/A"}</Text>
                 </View>
                 
                 {/* Bid Amount (Highlighted Segment) */}
                 <View style={[styles.metricItem, styles.metricItemSeparator]}>
                    <Text style={[styles.metricLabel, {color: Colors.card}]}>BID AMOUNT</Text>
                    <Text style={styles.metricAmountValue}>
                       ₹ {formatNumberIndianStyle(record.bid_amount)}
                    </Text>
                 </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};


const AuctionList = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  const [isLoading, setIsLoading] = useState(true);
  const [userTickets, setUserTickets] = useState([]);
  const [isShowingRecords, setIsShowingRecords] = useState(false);
  const [auctionData, setAuctionData] = useState({
    records: [],
    loading: false,
    error: null,
    selectedGroupId: null,
    selectedTicketNumber: null,
    highlightedCardId: null,
  });

  const fetchUserTicketsAndReport = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [ticketsResponse, reportResponse] = await Promise.allSettled([
        axios.post(`${url}/enroll/get-user-tickets/${userId}`),
        axios.post(`${url}/enroll/get-user-tickets-report/${userId}`),
      ]);

      if (ticketsResponse.status === 'fulfilled') {
        setUserTickets(ticketsResponse.value.data || []);
      } else {
        console.error("Error fetching tickets:", ticketsResponse.reason);
        setUserTickets([]);
      }

    } catch (error) {
      console.error("Error in fetching user data:", error);
      setUserTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchAuctionDetails = useCallback(async (groupId) => {
    if (!groupId) {
      setAuctionData(prev => ({ ...prev, error: "No Group ID provided." }));
      return;
    }
    setAuctionData(prev => ({ ...prev, loading: true, error: null, records: [] }));
    try {
      const response = await axios.get(`${url}/auction/group/${groupId}`);
      if (response.status === 200) {
        // Reverse the array to show the most recent auction first
        setAuctionData(prev => ({ ...prev, records: (response.data || []).reverse() }));
      } else {
        setAuctionData(prev => ({ ...prev, error: "Failed to fetch auction records." }));
      }
    } catch (error) {
      console.error("Error fetching auction details:", error);
      setAuctionData(prev => ({ 
        ...prev, 
        error: "No auction records found for this group. The auction may not have started yet.",
      }));
    } finally {
      setAuctionData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchUserTicketsAndReport();
  }, [fetchUserTicketsAndReport]);

  useFocusEffect(
    useCallback(() => {
      fetchUserTicketsAndReport();
      setIsShowingRecords(false);
      setAuctionData({
        records: [],
        loading: false,
        error: null,
        selectedGroupId: null,
        selectedTicketNumber: null,
        highlightedCardId: null,
      });
    }, [fetchUserTicketsAndReport])
  );

  const handleViewDetails = (enrollmentId, groupId, ticket) => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAuctionData(prev => ({
      ...prev,
      selectedGroupId: groupId,
      selectedTicketNumber: ticket,
      highlightedCardId: enrollmentId,
    }));
    setIsShowingRecords(true);
    fetchAuctionDetails(groupId);
  };

  const handleBackToGroups = () => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsShowingRecords(false);
    setAuctionData(prev => ({
      ...prev,
      selectedGroupId: null,
      selectedTicketNumber: null,
      highlightedCardId: null,
      records: [],
      error: null,
    }));
  };

  const filteredCards = userTickets.filter((card) => card.group_id !== null);

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      );
    }
    if (filteredCards.length === 0) {
      return (
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
      );
    }

    return (
      <View style={styles.groupsWrapperBox}>
        <ScrollView
          contentContainerStyle={styles.groupListContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredCards.map((card) => (
            <GroupCard
              key={card._id}
              card={card}
              onSelect={handleViewDetails}
              isHighlighted={auctionData.highlightedCardId === card._id}
              cardRadius={25}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
      />
      <Header userId={userId} navigation={navigation} />
      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          {!isShowingRecords ? (
            <>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Auctions</Text>
                <MaterialCommunityIcons
                  name="gavel"
                  size={42}
                  color={Colors.primary}
                  style={styles.headerAuctionIcon}
                />
              </View>
              <Text style={styles.subSentence}>
                Explore all your auction activities, past and present, right here.
              </Text>
              {renderContent()}
            </>
          ) : (
            <AuctionRecordsView
              records={auctionData.records}
              onBack={handleBackToGroups}
              isLoading={auctionData.loading}
              error={auctionData.error}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Global Layout
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 25,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
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
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 15, 
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5, 
  },
  sectionTitle: {
    fontWeight: "900",
    fontSize: 38,
    color: Colors.primary,
    letterSpacing: 1,
  },
  headerAuctionIcon: {
    width: 65,
    height: 55,
    marginLeft: 5,
    marginTop: 5,
  },
  subSentence: {
    fontSize: 16,
    color: Colors.textMedium,
    marginBottom: 15,
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  groupsWrapperBox: {
    borderRadius: 20,
    paddingVertical: 5,
    flex: 1,
  },
  groupListContentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 0,
    alignItems: "center",
  },
  newGroupCard: {
    width: "100%",
    backgroundColor: Colors.card,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.lightDivider,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  selectedNewGroupCard: {
    borderColor: Colors.selectedBorder,
    borderWidth: 2,
    backgroundColor: Colors.selectedBackground,
  },
  cardHeader: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.card,
    textAlign: 'center',
    flex: 1,
  },
  auctionTypeTag: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auctionTypeTagText: {
    fontWeight: "600",
    fontSize: 14,
  },
  auctionTypeDefaultText: {
    color: Colors.textDark,
  },
  auctionTypeOrangeText: {
    color: Colors.accentOrange,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  infoColumn: {
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16, 
    color: Colors.textMedium,
    fontWeight: '300',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.textDark,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: Colors.backgroundLight,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.lightDivider,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtonLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.lightDivider,
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
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
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
    color: Colors.textDark,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noGroupsSubText: {
    textAlign: "center",
    color: Colors.textMedium,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: "90%",
  },
  auctionRecordsContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 15,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 25,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
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
    color: Colors.primary,
  },
  recordsListTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  auctionRecordsScrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 15,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  noDataImage: {
    width: 200,
    height: 180,
    marginBottom: 15,
  },
  noDataText: {
    fontSize: 16,
    color: Colors.textDark,
    textAlign: "center",
    fontWeight: "500",
    marginTop: 25,
    paddingHorizontal: 15,
    lineHeight: 24,
  },

  // === UNIQUE STYLES FOR AUCTION RECORD CARDS ===
  auctionRecordCard: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  // 1. Sequential Number Chip
  recordNumberChip: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderBottomRightRadius: 15, // Creates a nice sticker effect
      marginBottom: -1, // Pull it slightly over the border/date panel for a better effect
  },
  recordNumberChipText: {
      marginLeft: 6,
      color: Colors.card,
      fontSize: 14,
      fontWeight: '700',
  },

  // 2. Segmented Date Block
  dateSegmentContainer: {
      flexDirection: 'row',
      backgroundColor: Colors.dataPanelBg,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderColor: Colors.lightDivider,
  },
  dateSegment: {
      flex: 1,
      alignItems: 'center',
  },
  dateSegmentSeparator: {
      borderLeftWidth: 1,
      borderColor: Colors.lightDivider,
  },
  dateSegmentTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.textMedium,
      marginTop: 5,
      textTransform: 'uppercase',
  },
  dateSegmentValue: {
      fontSize: 16,
      fontWeight: '800',
      color: Colors.textDark,
      marginTop: 2,
  },

  // 3. Secondary Info List
  secondaryInfoList: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: Colors.card,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
  },
  infoTitle: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      color: Colors.textDark,
      fontWeight: '500',
  },
  infoValue: {
      fontSize: 15,
      fontWeight: '700',
  },
  infoListDivider: {
      height: 1,
      backgroundColor: Colors.lightDivider,
      marginVertical: 0,
  },

  // 4. Footer Metrics Panel
  footerMetricsPanel: {
      flexDirection: 'row',
      backgroundColor: Colors.metricPanelBg,
      borderTopWidth: 1,
      borderColor: Colors.lightDivider,
      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,
  },
  metricItem: {
      flex: 1,
      padding: 15,
      alignItems: 'center',
  },
  metricItemSeparator: {
      borderLeftWidth: 1,
      borderColor: Colors.lightDivider,
      backgroundColor: Colors.successGreen, // Highlight the Bid Amount segment
  },
  metricLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: Colors.textMedium,
      marginBottom: 5,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  metricTicketValue: {
      fontSize: 24,
      fontWeight: '900',
      color: Colors.primary,
  },
  metricAmountValue: {
      fontSize: 24,
      fontWeight: '900',
      color: Colors.card, // White text on dark green background
  },
});

export default AuctionList;