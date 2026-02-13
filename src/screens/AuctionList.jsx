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

const Colors = {
  primary: "#053B90",
  primaryLight: "#1F55A4",
  backgroundLight: "#F0F5F9",
  card: "#FFFFFF",
  textDark: "#212121",
  textMedium: "#757575",
  accentOrange: "#F48024",
  accentBlue: "#3F51B5",
  accentGreen: "#4CAF50",
  successGreen: "#04810bff",
  gold: "#FFC300",
  error: "#E74C3C",
  border: "#E0E0E0",
  shadow: "rgba(0,0,0,0.18)",
  selectedBorder: "#F39C12",
  selectedBackground: "#FFF8E1",
  lightDivider: "#EEEEEE",
  dataPanelBg: "#F5F5F5",
  metricPanelBg: "#E8F5E9",
};

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

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      const parts = date.toLocaleDateString('en-US', options).split(' ');
      return `${parts[1].replace(',', '')} ${parts[0]} ${parts[2]}`;
    }
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
  }
  return "";
};

const calculateCommencementDate = (auctionDateString) => {
  if (!auctionDateString) return "";
  try {
    const date = new Date(auctionDateString);
    if (!isNaN(date.getTime())) {
      date.setDate(date.getDate() - 10);
      return date.toISOString().split('T')[0]; 
    }
  } catch (error) {
    console.error("Error calculating commencement date:", auctionDateString, error);
  }
  return "";
};

const CommencementRecordCard = ({
  groupName,
  firstAuctionDate,
  onPress,
}) => {
  const commencementDateString = calculateCommencementDate(firstAuctionDate);
  let remainingDays = 'N/A';
  let isClose = false; 
  let isPassed = false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  if (commencementDateString) {
    const cDate = new Date(commencementDateString);
    cDate.setHours(0, 0, 0, 0); 

    const diffTime = cDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
        remainingDays = diffDays;
    } else {
        remainingDays = "Passed"; 
        isPassed = true;
    }
    isClose = diffDays >= 0 && diffDays <= 10;
  }
  
  if (!firstAuctionDate && !groupName) return null;
    
  return (
    <TouchableOpacity
      style={[
        styles.auctionRecordCard,
        isClose && styles.commencementCardCloseStyle,
        isPassed && styles.commencementCardPassedStyle,
        styles.commencementCardCustom,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.recordNumberChip, styles.commencementChip]}>
         <MaterialCommunityIcons name="rocket-launch" size={16} color={Colors.card} />
         <Text style={styles.recordNumberChipText}>RECORD 1: COMMENCEMENT</Text>
      </View>
      <View style={styles.dateSegmentContainer}>
         <View style={styles.dateSegment}>
            <MaterialCommunityIcons name="calendar-start" size={20} color={Colors.accentBlue} />
            <Text style={styles.dateSegmentTitle}>Commencement </Text>
             <Text style={styles.dateSegmentTitle}> Date</Text>
            {firstAuctionDate ? (
                <Text style={[styles.dateSegmentValue, {color: Colors.primary}]}>
                    {formatDate(commencementDateString)}
                </Text>
            ) : (
                 <Text style={[styles.dateSegmentValue, {color: Colors.error}]}>
                    Not Set
                </Text>
            )}
         </View>
         <View style={[styles.dateSegment, styles.dateSegmentSeparator]}>
            <MaterialCommunityIcons name="calendar-end" size={20} color={Colors.accentBlue} />
            <Text style={styles.dateSegmentTitle}>next Auction </Text>
              <Text style={styles.dateSegmentTitle}> Date</Text>
            {firstAuctionDate ? (
                <Text style={styles.dateSegmentValue}>{formatDate(firstAuctionDate)}</Text>
            ) : (
                <Text style={[styles.dateSegmentValue, {color: Colors.error}]}>N/A</Text>
            )}
         </View>
      </View>
      <View style={styles.secondaryInfoList}>
         <View style={styles.infoRow}>
           <Text style={styles.infoTitle}>Auction Type</Text>
           <Text style={[styles.infoValue, {color: Colors.selectedBorder}]}>
               COMMENCEMENT
           </Text>
         </View>
      </View>
    </TouchableOpacity>
  );
};

const GroupCard = ({ card, onSelect, isHighlighted, cardRadius = 20 }) => {
  const { group_id, tickets, _id } = card;
  const { group_name, group_value, auction_type } = group_id || {};

  const safeAuctionType = auction_type || "";
  const formattedAuctionType = safeAuctionType !== "" ? safeAuctionType.charAt(0).toUpperCase() + safeAuctionType.slice(1) : "";
  const isFreeAuction = safeAuctionType.toLowerCase() === "free";

  return (
    <View style={[styles.newGroupCard, isHighlighted && styles.selectedNewGroupCard]}>
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
              <Text style={[styles.auctionTypeTagText, isFreeAuction ? styles.auctionTypeOrangeText : styles.auctionTypeDefaultText]}>
                {formattedAuctionType}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      <View style={styles.cardBody}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoTitle}>Group Value:</Text>
          <Text style={styles.infoValue}>₹ {formatNumberIndianStyle(group_value)}</Text>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onSelect(_id, group_id?._id, tickets, group_name, group_value)} activeOpacity={0.8}>
          <MaterialIcons name="list-alt" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonLabel}>View Auctions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onSelect(_id, group_id?._id, tickets, group_name, group_value)} activeOpacity={0.8}>
          <MaterialIcons name="timeline" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonLabel}>Auction Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AuctionRecordsView = ({
  records,
  onBack,
  isLoading,
  error,
  commencementData, 
  onCommencementPress,
  selectedGroupName,
  selectedGroupValue
}) => {
  if (isLoading) {
    return <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />;
  }

  const hasCommencementData = !!(commencementData && (commencementData.group_name || commencementData.commencement_date));
  const showNoRecordsMessage = records.length === 0 || error;
  
  // --- CALCULATE STATS ---
  const totalRecords = records.length + (hasCommencementData ? 1 : 0);
  const normalCount = records.filter(r => (r.auction_type || "").toLowerCase() === "normal").length;
  const freeCount = records.filter(r => (r.auction_type || "").toLowerCase() === "free").length;
  // ---------------------

  if (showNoRecordsMessage && !hasCommencementData) {
    return (
      <View style={styles.auctionRecordsContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back to Groups</Text>
        </TouchableOpacity>
        <View style={styles.noDataContainer}>
          <Image source={NoRecordFoundImage} style={styles.noDataImage} resizeMode="contain" />
          <Text style={styles.noDataText}>{error || "No auction records found for this group."}</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.auctionRecordsContainer}>
      {/* Back Button stays fixed at top outside scroll */}
      <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        <Text style={styles.backButtonText}>Back to Groups</Text>
      </TouchableOpacity>

      {/* --- MAIN SCROLL VIEW (Contains Summary + Title + List) --- */}
      <ScrollView 
        contentContainerStyle={styles.auctionRecordsScrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* --- MASTER SUMMARY BOX --- */}
        <View style={styles.masterSummaryCard}>
          {/* Top Section: Name & Value */}
          <View style={styles.masterCardTop}>
            <View style={styles.masterNameRow}>
               <MaterialCommunityIcons name="trophy-outline" size={28} color={Colors.primary} style={{marginRight: 10}} />
               <Text style={styles.masterGroupName} numberOfLines={1}>{selectedGroupName}</Text>
            </View>
            <Text style={styles.masterGroupValue}>
              {selectedGroupValue ? `₹ ${formatNumberIndianStyle(selectedGroupValue)}` : ""}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.masterCardDivider} />

          {/* Bottom Section: Stats Column (Stacked Rows) */}
          <View style={styles.masterCardStatsColumn}>
            
            {/* Total Records Row */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Records</Text>
              <Text style={styles.statValue}>{totalRecords}</Text>
            </View>

            <View style={styles.statHorizontalDivider} />

            {/* Auction Normal Row */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Auction Normal</Text>
              <Text style={[styles.statValue, {color: Colors.primary}]}>{normalCount}</Text>
            </View>

            <View style={styles.statHorizontalDivider} />

            {/* Auction Free Row */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Auction Free</Text>
              <Text style={[styles.statValue, {color: Colors.accentOrange}]}>{freeCount}</Text>
            </View>

          </View>
        </View>

        {/* --- SECTION TITLE --- */}
        <Text style={styles.recordsListTitle}>Auction Records</Text>

        {/* --- RECORDS LIST --- */}
        {records.map((record, index) => {
          const isFreeAuctionRecord = record.auction_type?.toLowerCase() === "free";
          const formattedAuctionType = record.auction_type ? record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1) : "Normal"; 
          
          const recordNumber = totalRecords - index;
            
          return (
            <View key={record._id || `auction-${index}`} style={styles.auctionRecordCard}>
              <View style={styles.recordNumberChip}>
                 <MaterialCommunityIcons name="gavel" size={16} color={Colors.card} />
                 <Text style={styles.recordNumberChipText}>RECORD {recordNumber}</Text>
              </View>
              <View style={styles.dateSegmentContainer}>
                 <View style={styles.dateSegment}>
                    <MaterialCommunityIcons name="calendar-start" size={20} color={Colors.accentBlue} />
                    <Text style={styles.dateSegmentTitle}>Auction Date</Text>
                    <Text style={styles.dateSegmentValue}>{formatDate(record.auction_date)}</Text>
                 </View>
                 <View style={[styles.dateSegment, styles.dateSegmentSeparator]}>
                    <MaterialCommunityIcons name="calendar-end" size={20} color={Colors.accentBlue} />
                    <Text style={styles.dateSegmentTitle}>Next Date</Text>
                    <Text style={styles.dateSegmentValue}>{formatDate(record.next_date)}</Text>
                 </View>
              </View>
              <View style={styles.secondaryInfoList}>
                 <View style={styles.infoRow}>
                    <Text style={styles.infoTitle}>Auction Type</Text>
                    <Text style={[styles.infoValue, {color: isFreeAuctionRecord ? Colors.accentOrange : Colors.textDark}]}>{formattedAuctionType}</Text>
                 </View>
                 <View style={styles.infoListDivider} />
                 <View style={styles.infoRow}>
                    <Text style={styles.infoTitle}>Bid Percentage</Text>
                    <Text style={styles.infoValue}>{record.bid_percentage || "0"}%</Text>
                 </View>
              </View>
              <View style={styles.footerMetricsPanel}>
                 <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, {color: Colors.textMedium}]}>WINNING TICKET</Text>
                    <Text style={styles.metricTicketValue}>{record.ticket || "N/A"}</Text>
                 </View>
                 <View style={[styles.metricItem, styles.metricItemSeparator]}>
                    <Text style={[styles.metricLabel, {color: Colors.card}]}>BID AMOUNT</Text>
                    <Text style={styles.metricAmountValue}>₹ {formatNumberIndianStyle(record.bid_amount)}</Text>
                 </View>
              </View>
            </View>
          );
        })}

        {/* --- COMMENCEMENT CARD (Rendered last visually) --- */}
        {hasCommencementData && (
          <CommencementRecordCard groupName={commencementData.group_name} firstAuctionDate={commencementData.commencement_date} onPress={onCommencementPress} />
        )}

        {records.length === 0 && hasCommencementData && (
            <View style={styles.noDataPlaceholder}>
                <MaterialCommunityIcons name="information" size={30} color={Colors.primaryLight} />
                <Text style={styles.noDataPlaceholderText}>This group's auctions have not started yet. The card above provides details about the commencement date.</Text>
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
    highlightedCardId: null,
    selectedGroupName: "",
    selectedGroupValue: null,
  });

  const [commencementAuctionData, setCommencementAuctionData] = useState(null);

  const fetchUserTicketsAndReport = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const ticketsResponse = await axios.post(`${url}/enroll/get-user-tickets/${userId}`);
      if (ticketsResponse.status === 200) {
        setUserTickets(ticketsResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchAuctionDetails = useCallback(async (groupId, groupName) => { 
    if (!groupId) {
      setAuctionData(prev => ({ ...prev, error: "No Group ID provided." }));
      return;
    }
    setAuctionData(prev => ({ ...prev, loading: true, error: null, records: [] }));
    try {
      const response = await axios.get(`${url}/auction/group/${groupId}`);
      if (response.status === 200) {
        const records = response.data || [];
        const reversedRecords = records.slice().reverse(); 
        const firstAuction = records.length > 0 ? records[0] : null; 
        
        setCommencementAuctionData({
          group_name: firstAuction?.group_id?.group_name || groupName || "Selected Group",
          commencement_date: firstAuction?.auction_date || null,
          _id: "commencement-card-id",
        });
        
        setAuctionData(prev => ({ ...prev, records: reversedRecords }));
      }
    } catch (error) {
      setAuctionData(prev => ({ ...prev, error: "No auction records found. Auction may not have started yet." }));
      setCommencementAuctionData({ group_name: groupName || "Selected Group", commencement_date: null, _id: "commencement-card-id" });
    } finally {
      setAuctionData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserTicketsAndReport();
      setIsShowingRecords(false);
      setAuctionData({ records: [], loading: false, error: null, selectedGroupId: null, highlightedCardId: null, selectedGroupName: "", selectedGroupValue: null });
    }, [fetchUserTicketsAndReport])
  );
  
  const handleCommencementCardPress = () => {
      Vibration.vibrate(50);
      if (!commencementAuctionData?.commencement_date) {
           Alert.alert("Auction Not Started", `The First Auction date for ${commencementAuctionData?.group_name} has not been set yet.`);
      }
  };

  const handleViewDetails = (enrollmentId, groupId, tickets, groupName, groupValue) => { 
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAuctionData(prev => ({
      ...prev,
      selectedGroupId: groupId,
      highlightedCardId: enrollmentId,
      selectedGroupName: groupName,
      selectedGroupValue: groupValue,
    }));
    setIsShowingRecords(true);
    fetchAuctionDetails(groupId, groupName); 
  };

  const handleBackToGroups = () => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsShowingRecords(false);
    setAuctionData(prev => ({ ...prev, records: [], selectedGroupName: "", selectedGroupValue: null }));
  };

  const filteredCards = userTickets.filter((card) => card.group_id !== null);

  const renderContent = () => {
    if (isLoading) return <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />;
    if (filteredCards.length === 0) {
      return (
        <View style={styles.noGroupsContainer}>
          <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
          <Text style={styles.noGroupsText}>No groups found for this user.</Text>
        </View>
      );
    }

    return (
      <View style={styles.groupsWrapperBox}>
        <ScrollView contentContainerStyle={styles.groupListContentContainer} showsVerticalScrollIndicator={false}>
          {filteredCards.map((card) => (
            <GroupCard key={card._id} card={card} onSelect={handleViewDetails} isHighlighted={auctionData.highlightedCardId === card._id} />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Header userId={userId} navigation={navigation} />
      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          {!isShowingRecords ? (
            <>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Auctions</Text>
                <MaterialCommunityIcons name="gavel" size={42} color={Colors.primary} style={styles.headerAuctionIcon} />
              </View>
              <Text style={styles.subSentence}>Explore all your auction activities, past and present, right here.</Text>
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
              selectedGroupName={auctionData.selectedGroupName}
              selectedGroupValue={auctionData.selectedGroupValue}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: Colors.primary },
  outerBoxContainer: { flex: 1, backgroundColor: Colors.backgroundLight, marginHorizontal: 12, marginBottom: 50, borderRadius: 30, overflow: "hidden", ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20 }, android: { elevation: 20 } }) },
  mainContentWrapper: { flex: 1, backgroundColor: Colors.card, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  sectionTitleContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 5 },
  sectionTitle: { fontWeight: "900", fontSize: 38, color: Colors.primary, letterSpacing: 1 },
  headerAuctionIcon: { width: 65, height: 55, marginLeft: 5, marginTop: 5 },
  subSentence: { fontSize: 16, color: Colors.textMedium, marginBottom: 15, textAlign: "center", paddingHorizontal: 10, lineHeight: 24 },
  groupsWrapperBox: { borderRadius: 20, paddingVertical: 5, flex: 1 },
  groupListContentContainer: { paddingBottom: 20, paddingHorizontal: 0, alignItems: "center" },
  newGroupCard: { width: "100%", backgroundColor: Colors.card, marginVertical: 12, borderRadius: 18, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 }, android: { elevation: 12 } }) },
  selectedNewGroupCard: { borderColor: Colors.selectedBorder, borderWidth: 2, backgroundColor: Colors.selectedBackground },
  cardHeaderGradient: { paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', position: 'relative' },
  cardHeaderContent: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  cardHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.card, textAlign: 'center', flex: 1 },
  auctionTypeTag: { position: 'absolute', right: 20, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  auctionTypeTagText: { fontWeight: "600", fontSize: 14 },
  auctionTypeDefaultText: { color: Colors.textDark },
  auctionTypeOrangeText: { color: Colors.accentOrange },
  cardBody: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  infoColumn: { alignItems: 'center' },
  infoTitle: { fontSize: 16, color: Colors.textMedium, fontWeight: "300", marginBottom: 5 },
  infoValue: { fontSize: 42, fontWeight: '900', color: Colors.primary },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, backgroundColor: Colors.dataPanelBg },
  actionButton: { alignItems: 'center', flex: 1 },
  actionButtonLabel: { marginTop: 5, fontSize: 12, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  cardDivider: { height: 1, backgroundColor: Colors.lightDivider },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  noGroupsContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 50 },
  noGroupImage: { width: 140, height: 140, marginBottom: 20 },
  noGroupsText: { textAlign: "center", color: Colors.textDark, fontSize: 20, fontWeight: "bold" },
  auctionRecordsContainer: { flex: 1, paddingVertical: 15 },
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 12, paddingHorizontal: 18, marginBottom: 25, borderRadius: 12, backgroundColor: Colors.backgroundLight, borderWidth: 1, borderColor: Colors.border },
  backButtonText: { marginLeft: 10, fontSize: 16, fontWeight: "bold", color: Colors.primary },
  
  masterSummaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  masterCardTop: {
    backgroundColor: Colors.card,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  masterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  masterGroupName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  masterGroupValue: { 
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
  },
  masterCardDivider: {
    height: 1,
    backgroundColor: Colors.lightDivider,
    marginHorizontal: 20,
  },
  masterCardStatsColumn: {
    flexDirection: 'column',
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 14,
  },
  statLabel: {
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statHorizontalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '90%',
    alignSelf: 'center',
  },
  
  recordsListTitle: { fontSize: 26, fontWeight: "bold", color: Colors.primary, marginBottom: 20, textAlign: "center" },
  auctionRecordsScrollContent: { paddingBottom: 40, paddingHorizontal: 15 },
  noDataContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  noDataImage: { width: 200, height: 180, marginBottom: 15 },
  noDataText: { fontSize: 16, color: Colors.textDark, textAlign: "center", fontWeight: "500", marginTop: 25 },
  auctionRecordCard: { backgroundColor: Colors.card, borderRadius: 20, marginVertical: 12, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15 }, android: { elevation: 10 } }) },
  recordNumberChip: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', backgroundColor: Colors.accentOrange, paddingVertical: 6, paddingHorizontal: 15, borderBottomRightRadius: 20 },
  recordNumberChipText: { marginLeft: 8, color: Colors.card, fontSize: 15, fontWeight: '800' },
  commencementCardCustom: { borderWidth: 1, borderColor: Colors.accentOrange },
  commencementChip: { backgroundColor: Colors.accentOrange },
  commencementCardCloseStyle: { borderColor: Colors.error, backgroundColor: Colors.selectedBackground },
  commencementCardPassedStyle: { opacity: 0.8, borderColor: Colors.textMedium },
  dateSegmentContainer: { flexDirection: 'row', backgroundColor: Colors.dataPanelBg, paddingVertical: 15, borderBottomWidth: 1, borderColor: Colors.lightDivider },
  dateSegment: { flex: 1, alignItems: 'center' },
  dateSegmentSeparator: { borderLeftWidth: 1, borderColor: Colors.lightDivider },
  dateSegmentTitle: { fontSize: 12, fontWeight: '600', color: Colors.textMedium, marginTop: 5, textTransform: 'uppercase', textAlign:'center' },
  dateSegmentValue: { fontSize: 18, fontWeight: '900', color: Colors.primary, marginTop: 2 },
  secondaryInfoList: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: Colors.card },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  infoTitle: { flex: 1, marginLeft: 10, fontSize: 15, color: Colors.textDark, fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '700' },
  infoListDivider: { height: 1, backgroundColor: Colors.lightDivider },
  footerMetricsPanel: { flexDirection: 'row', backgroundColor: Colors.dataPanelBg, borderTopWidth: 1, borderColor: Colors.lightDivider },
  metricItem: { flex: 1, padding: 15, alignItems: 'center' },
  metricItemSeparator: { backgroundColor: Colors.primary },
  metricLabel: { fontSize: 11, fontWeight: '700', color: Colors.card, marginBottom: 5, textTransform: 'uppercase' },
  metricTicketValue: { fontSize: 16, fontWeight: '900', color: Colors.textDark },
  metricAmountValue: { fontSize: 16, fontWeight: '900', color: Colors.gold },
  noDataPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 10, backgroundColor: Colors.dataPanelBg, borderRadius: 15 },
  noDataPlaceholderText: { textAlign: 'center', marginTop: 10, fontSize: 14, color: Colors.textMedium, fontWeight: '500' },
});

export default AuctionList;