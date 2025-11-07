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
  Alert,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient"; // <--- NOW USED
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
  accentOrange: "#F48024", // Vibrant Orange for Free Auction/Highlights
  accentBlue: "#3F51B5", // Soft Indigo for Dates
  accentGreen: "#4CAF50", // Standard Green
  successGreen: "#04810bff", // Deeper Green for metrics background
  gold: "#FFC300", // <--- USED FOR BID AMOUNT HIGHLIGHT
  error: "#E74C3C",
  border: "#E0E0E0",
  shadow: "rgba(0,0,0,0.18)", // Slightly stronger default shadow
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

// NEW: Helper function to calculate a date 10 days before the auction date
const calculateCommencementDate = (auctionDateString) => {
  if (!auctionDateString) return "";
  try {
    const date = new Date(auctionDateString);
    if (!isNaN(date.getTime())) {
      // Subtract 10 days
      date.setDate(date.getDate() - 10);
      // Return in ISO string format (YYYY-MM-DD) for consistency with date parsers
      return date.toISOString().split('T')[0]; 
    }
  } catch (error) {
    console.error("Error calculating commencement date:", auctionDateString, error);
  }
  return "";
};


// NEW: Extracted sub-component for the Commencement Date Card (Sleek/Small version)
const CommencementDateCard = ({
  groupName,
  firstAuctionDate, // This prop is the actual date of the first auction
  onPress,
}) => {
  
  // Calculate the commencement date: First Auction Date - 10 days
  const commencementDateString = calculateCommencementDate(firstAuctionDate);

  let remainingDays = 'N/A';
  let isClose = false; 

  if (commencementDateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const cDate = new Date(commencementDateString);
    cDate.setHours(0, 0, 0, 0); 

    const diffTime = cDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
        remainingDays = diffDays;
    } else {
        remainingDays = "Passed"; 
    }
    
    // Highlight if the Commencement Date is within the next 10 days
    isClose = diffDays >= 0 && diffDays <= 10;
  }
  
  const daysValue = remainingDays !== "Passed" ? remainingDays : "0";
  
  // Guard clause for when the firstAuctionDate is null (no records found yet)
  if (!firstAuctionDate && !groupName) return null;
    
  return (
    <TouchableOpacity
      style={[
        styles.commencementCardSleek, 
        isClose && styles.commencementCardCloseSleek,
        remainingDays === "Passed" && styles.commencementCardPassedSleek,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name="calendar-clock"
        size={22} 
        color={isClose ? Colors.error : Colors.primary}
      />
      
      {/* LEFT CONTENT: Title and Calculated Date */}
      <View style={styles.commencementCardSleekContent}>
        <Text style={styles.commencementCardSleekTitle}>
          Commencement Date for: {groupName || "Your Group"}
        </Text>
        {firstAuctionDate ? (
            <Text style={styles.commencementCardSleekSubtitle}>
                {formatDate(commencementDateString)}
            </Text>
        ) : (
             <Text style={[styles.commencementCardSleekSubtitle, {fontWeight: 'bold', color: Colors.accentOrange}]}>
                First Auction Date Not Set Yet.
            </Text>
        )}
      </View>
      
       
    </TouchableOpacity>
  );
};


// Extracted sub-component for a single group card (REVISED)
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
      {/* REPLACED solid background with LinearGradient for premium look */}
      <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.cardHeaderGradient}
      >
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
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoTitle}>Group Value:</Text>
          {/* Group Value is styled to be more prominent */}
          <Text style={styles.infoValue}>
            ₹ {formatNumberIndianStyle(group_value)}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSelect(_id, group_id?._id, tickets, group_name)} // Passed group_name
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
          onPress={() => onSelect(_id, group_id?._id, tickets, group_name)} // Passed group_name
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


// UPDATED Extracted sub-component for displaying auction records
const AuctionRecordsView = ({
  records,
  onBack,
  isLoading,
  error,
  commencementData, 
  onCommencementPress, 
}) => {
  if (isLoading) {
    return (
      <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
    );
  }

  const showNoRecordsMessage = records.length === 0 || error;
  
  // Show no records message ONLY if there is no commencement data either
  if (showNoRecordsMessage && !commencementData) {
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
        
        {/* Map renders all existing auction records (newest to oldest) */}
        {records.map((record, index) => {
          const isFreeAuctionRecord = record.auction_type?.toLowerCase() === "free";
          const formattedAuctionType = record.auction_type
            ? record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1)
            : "Normal"; 
          
          const recordNumber = records.length - index;
            
          return (
            <View key={record._id || `auction-${index}`} style={styles.auctionRecordCard}>
              
              {/* === 1. Sequential Number Chip (Header - REVISED COLOR) === */}
              <View style={styles.recordNumberChip}>
                 <MaterialCommunityIcons name="gavel" size={16} color={Colors.card} />
                 <Text style={styles.recordNumberChipText}>RECORD {recordNumber}</Text>
              </View>
              
              {/* === 2. Segmented Date Block (REVISED FONT SIZE/COLOR) === */}
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
              
              {/* === 4. Footer Metrics Panel (REVISED COLOR/CONTRAST) === */}
              <View style={styles.footerMetricsPanel}>
                 
                 {/* Win Ticket */}
                 <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, {color: Colors.textMedium}]}>WINNING TICKET</Text>
                    <Text style={styles.metricTicketValue}>{record.ticket || "N/A"}</Text>
                 </View>
                 
                 {/* Bid Amount (Highlighted Segment - uses primary dark blue/gold) */}
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

        {/* --- COMMENCEMENT DATE CARD INTEGRATION (At the bottom) --- */}
        {commencementData && (
          <CommencementDateCard
              groupName={commencementData.group_name}
              firstAuctionDate={commencementData.commencement_date} 
              onPress={onCommencementPress}
          />
        )}
        {/* ------------------------------------------------------------- */}
        
        {/* Show no data message if no records but commencement data exists (CommencementCard is already rendered) */}
        {records.length === 0 && commencementData && (
            <View style={styles.noDataPlaceholder}>
                <MaterialCommunityIcons name="information" size={30} color={Colors.primaryLight} />
                <Text style={styles.noDataPlaceholderText}>
                    This group's auctions have not started yet. The card above provides details about the commencement date (if available).
                </Text>
            </View>
        )}
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

  // State for the commencement date card data (now dynamically set)
  const [commencementAuctionData, setCommencementAuctionData] = useState(null); // <--- CHANGE: Initialized to null


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

  const fetchAuctionDetails = useCallback(async (groupId, groupName) => { // <--- CHANGE: Added groupName
    if (!groupId) {
      setAuctionData(prev => ({ ...prev, error: "No Group ID provided." }));
      setCommencementAuctionData(null); // Clear commencement data on error
      return;
    }
    setAuctionData(prev => ({ ...prev, loading: true, error: null, records: [] }));
    setCommencementAuctionData(null); // Clear previous commencement data
    try {
      const response = await axios.get(`${url}/auction/group/${groupId}`);
      if (response.status === 200) {
        const records = response.data || [];
        // The API is assumed to return the oldest record first. We reverse for display (newest first)
        const reversedRecords = records.slice().reverse(); 
        
        // Find the FIRST (oldest) auction date
        const firstAuction = records.length > 0 ? records[0] : null; 
        
        if (firstAuction && firstAuction.auction_date) {
          setCommencementAuctionData({
            group_name: firstAuction.group_id?.group_name || groupName || "Selected Group",
            commencement_date: firstAuction.auction_date, // This is the First Auction Date
            _id: "commencement-card-id",
          });
        } else {
             // Set group name even if no auction date is found (for the placeholder card)
             setCommencementAuctionData({
                group_name: groupName || "Selected Group",
                commencement_date: null,
                _id: "commencement-card-id",
            });
        }
        
        setAuctionData(prev => ({ ...prev, records: reversedRecords }));
        
      } else {
        setAuctionData(prev => ({ ...prev, error: "Failed to fetch auction records." }));
        setCommencementAuctionData(null);
      }
    } catch (error) {
      console.error("Error fetching auction details:", error);
      setAuctionData(prev => ({ 
        ...prev, 
        error: "No auction records found for this group. The auction may not have started yet.",
      }));
      // In case of error, set the group name but no date to show the placeholder card
      setCommencementAuctionData({
          group_name: groupName || "Selected Group",
          commencement_date: null,
          _id: "commencement-card-id",
      });
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
      setCommencementAuctionData(null); // Clear commencement data on focus
    }, [fetchUserTicketsAndReport])
  );
  
  // Handler for pressing the Commencement Date card
  const handleCommencementCardPress = () => {
      Vibration.vibrate(50);
      const firstAuctionDate = commencementAuctionData.commencement_date;
      
      if (!firstAuctionDate) {
           Alert.alert(
              "Auction Not Started",
              `The First Auction date for ${commencementAuctionData.group_name} has not been set yet. Check back later.`
          );
          return;
      }
      
      const calculatedCommencementDate = calculateCommencementDate(firstAuctionDate);

      Alert.alert(
          "Commencement Date Calculation", 
          `The First Auction for ${commencementAuctionData.group_name} is scheduled for ${formatDate(firstAuctionDate)}.
          
          The Commencement Date is calculated as:
          ${formatDate(firstAuctionDate)} - 10 days = ${formatDate(calculatedCommencementDate)}.`
      );
  };


  const handleViewDetails = (enrollmentId, groupId, ticket, groupName) => { // <--- CHANGE: Added groupName
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAuctionData(prev => ({
      ...prev,
      selectedGroupId: groupId,
      selectedTicketNumber: ticket,
      highlightedCardId: enrollmentId,
    }));
    setIsShowingRecords(true);
    fetchAuctionDetails(groupId, groupName); // <--- CHANGE: Passed groupName
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
    setCommencementAuctionData(null); // Clear commencement data on back
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
              commencementData={commencementAuctionData} 
              onCommencementPress={handleCommencementCardPress} 
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Global Layout (Enhanced shadows and larger radius for main container)
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    marginHorizontal: 12,
    marginBottom: 10,
    marginBottom:50,
    borderRadius: 30, // Larger radius
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary, // Use primary color for a subtle, matching glow
        shadowOffset: { width: 0, height: 12 }, // More lifted
        shadowOpacity: 0.25, // Slightly less opaque
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 15, 
    paddingBottom: 20,
    borderBottomLeftRadius: 30, // Match outer container
    borderBottomRightRadius: 30, // Match outer container
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
  // Group Card Styles (Enhanced Shadow and Radius)
  newGroupCard: {
    width: "100%",
    backgroundColor: Colors.card,
    marginVertical: 12, // Slightly more space
    borderRadius: 18, // Slightly smaller radius than the main container
    overflow: 'hidden',
    borderWidth: 0, // Remove static border
    // New, stronger shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, // Stronger shadow
        shadowRadius: 15,
      },
      android: {
        elevation: 12, // More elevation
      },
    }),
  },
  selectedNewGroupCard: {
    borderColor: Colors.selectedBorder,
    borderWidth: 2,
    backgroundColor: Colors.selectedBackground,
  },
  // NEW: Gradient container style for GroupCard header
  cardHeaderGradient: { 
    paddingVertical: 15, // Increased padding
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  // cardHeader is now just a container, not defining the background
  cardHeader: {
    // backgroundColor: Colors.primary, // REMOVED
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
    fontSize: 18, // Slightly larger title
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
    paddingVertical: 15, // Increased vertical padding
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
  // Info Value (Group Value) is now larger and colored
  infoValue: {
    fontSize: 42, // Larger font size
    fontWeight: '900',
    color: Colors.primary, // Use primary color for value
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15, // Increased padding
    backgroundColor: Colors.dataPanelBg, // Use a lighter background
    borderTopWidth: 0, // Remove border
    borderBottomWidth: 0, // Remove border
    borderColor: Colors.lightDivider,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtonLabel: {
    marginTop: 5,
    fontSize: 12, // Slightly larger label
    fontWeight: '700', // Bolder label
    color: Colors.primary, // Use primary color for label
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

  // === UNIQUE STYLES FOR AUCTION RECORD CARDS (Enhanced) ===
  auctionRecordCard: {
    backgroundColor: Colors.card,
    borderRadius: 20, // Larger radius
    marginVertical: 12,
    borderWidth: 0, 
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25, // Stronger shadow
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  
  // 1. Sequential Number Chip (Vibrant Orange)
  recordNumberChip: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      alignItems: 'center',
      backgroundColor: Colors.accentOrange, // Use vibrant orange
      paddingVertical: 6, // More padding
      paddingHorizontal: 15,
      borderBottomRightRadius: 20, // Match new card radius
      marginBottom: 0, 
      ...Platform.select({
          ios: { shadowColor: Colors.shadow, shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { height: 2, width: 0 } },
          android: { elevation: 3 },
      }),
  },
  recordNumberChipText: {
      marginLeft: 8,
      color: Colors.card,
      fontSize: 15, // Slightly larger text
      fontWeight: '800',
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
  // Date values use primary color
  dateSegmentValue: {
      fontSize: 18, // Larger font
      fontWeight: '900',
      color: Colors.primary, // Use primary color
      marginTop: 2,
  },

  // 3. Secondary Info List (No change, remains clean)
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

  // 4. Footer Metrics Panel (High Contrast & Gold Highlight)
  footerMetricsPanel: {
      flexDirection: 'row',
      backgroundColor: Colors.dataPanelBg,
      borderTopWidth: 1,
      borderColor: Colors.lightDivider,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
  },
  metricItem: {
      flex: 1,
      padding: 15,
      alignItems: 'center',
      backgroundColor: Colors.dataPanelBg, // Ensure background is set
  },
  metricItemSeparator: {
      borderLeftWidth: 0, // Remove vertical border
      backgroundColor: Colors.primary, // Use primary dark blue for highlight
  },
  metricLabel: {
      fontSize: 11, // Slightly larger label
      fontWeight: '700',
      color: Colors.card, // White text on dark blue background
      marginBottom: 5,
      textTransform: 'uppercase',
      letterSpacing: 1, // More spacing
  },
  metricTicketValue: {
      fontSize: 16,
      fontWeight: '900',
      color: Colors.textDark, // Use dark text for this value
  },
  metricAmountValue: {
      fontSize: 16, // Even larger font
      fontWeight: '900',
      color: Colors.gold, // Use Gold for the final amount
  },
  
  // === NEW SLEEK STYLES FOR COMMENCEMENT DATE CARD (No change needed) ===
  commencementCardSleek: {
    width: "100%",
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.lightDivider,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 6, height: 7 },
        shadowOpacity: 0.4,
        shadowRadius: 9,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  commencementCardCloseSleek: {
      borderColor: Colors.error, 
      backgroundColor: Colors.selectedBackground,
  },
  commencementCardPassedSleek: {
    opacity: 0.7, 
  },
  commencementCardSleekContent: {
      flex: 1,
      marginLeft: 10,
  },
  commencementCardSleekTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: Colors.textDark,
  },
  commencementCardSleekSubtitle: {
      fontSize: 13,
      color: Colors.successGreen,
      marginTop: 2,
      fontWeight: "bold",
  },
  commencementDaysPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  commencementDaysPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.card,
    textTransform: 'uppercase',
  },
  commencementDaysPillValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.card,
    marginTop: 1,
  },
  noDataPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: Colors.dataPanelBg,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noDataPlaceholderText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: Colors.textMedium,
    fontWeight: '500',
  },
});

export default AuctionList;