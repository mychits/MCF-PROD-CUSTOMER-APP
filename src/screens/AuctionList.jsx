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
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  primary: "#053B90",
  primaryLight: "#1F55A4",
  backgroundLight: "#F0F5F9",
  card: "#FFFFFF",
  textDark: "#2C3E50",
  textMedium: "#7F8C8D",
  accentOrange: "#E67E22",
  accentBlue: "#3499DB",
  accentGreen: "#2ECC71",
  gold: "#FFD700",
  error: "#E74C3C",
  border: "#E0E6EB",
  shadow: "rgba(0,0,0,0.1)",
  selectedBorder: "#F39C12",
  selectedBackground: "#FFF8E1",
  lightDivider: "#EBEBEB",
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
      return date.toLocaleDateString(undefined, options);
    }
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
  }
  return "";
};

// Extracted sub-component for a single group card
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSelect(_id, group_id?._id, tickets)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.actionButtonLabel}>Group Members</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


// Extracted sub-component for displaying auction records
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
          return (
            <View key={record._id || `auction-${index}`} style={styles.auctionRecordCard}>
              <View style={styles.row}>
                <Text style={styles.leftText}>Auction Date:</Text>
                <Text style={styles.rightText}>{formatDate(record.auction_date)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.leftText}>Next Date:</Text>
                <Text style={styles.rightText}>{formatDate(record.next_date)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.leftText}>Win Ticket:</Text>
                <Text style={styles.rightText}>{record.ticket || ""}</Text>
              </View>
              {record.auction_type && (
                <View style={styles.auctionTypeRecordRow}>
                  <Text
                    style={[
                      styles.auctionTypeRecordText,
                      isFreeAuctionRecord
                        ? styles.auctionTypeOrangeText
                        : styles.auctionTypeDefaultText,
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>
                      {record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1)}
                    </Text>{" "}
                    Auction
                  </Text>
                </View>
              )}
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
      const response = await axios.get(`${url}/auction/get-group-auction/${groupId}`);
      if (response.status === 200) {
        setAuctionData(prev => ({ ...prev, records: response.data || [] }));
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
    paddingTop: 15, // Reduced from 30 to 15
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  // Header Section
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5, // Reduced from 10 to 5
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
    marginBottom: 15, // Reduced from 35 to 15
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 24,
  },

  // Group List
  groupsWrapperBox: {
    borderRadius: 20,
    paddingVertical: 5, // Reduced from 15 to 5
    flex: 1,
  },
  groupListContentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 0,
    alignItems: "center",
  },

  // === NEW STYLES FOR THE DASHBOARD-LIKE CARDS ===
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
    paddingVertical: 15,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.card,
    textAlign: 'center',
    flex: 1,
  },
  auctionTypeTag: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 12,
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
    paddingVertical: 15,
  },
  infoColumn: {
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 26,
    color: Colors.textMedium,
    fontWeight: '500',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  infoDivider: {
    width: 0,
    height: '100%',
    backgroundColor: 'transparent',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textDark,
    flex: 1,
    marginLeft: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.lightDivider,
  },
  // END NEW STYLES

  // Old styles (kept for other components)
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
  auctionRecordCard: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
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
    alignItems: "center",
  },
  leftText: {
    flex: 1,
    textAlign: "left",
    fontSize: 16,
    color: Colors.textMedium,
    fontWeight: "500",
  },
  rightText: {
    flex: 1,
    textAlign: "right",
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: "600",
  },
  auctionTypeRecordRow: {
    justifyContent: "flex-start",
    width: "100%",
    marginTop: 8,
    marginBottom: 0,
  },
  auctionTypeRecordText: {
    fontSize: 16,
    color: Colors.textDark,
    textAlign: "left",
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
});

export default AuctionList;