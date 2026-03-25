import React, { useState, useCallback, useContext, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, StatusBar, Image, Platform, Vibration,
  LayoutAnimation, NativeModules, Alert, Animated, Easing, Dimensions,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import NoRecordFoundImage from "../../assets/NoRecordFound.png";
import { ContextProvider } from "../context/UserProvider";

if (Platform.OS === "android" && NativeModules.UIManager) {
  NativeModules.UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const Colors = {
  primary: "#053B90",
  primaryLight: "#1F55A4",
  primaryDark: "#020E2C",
  backgroundLight: "#F0F4FA",
  card: "#FFFFFF",
  textDark: "#1A1A2E",
  textMedium: "#6B7280",
  textLight: "#9CA3AF",
  accentOrange: "#F48024",
  accentBlue: "#3F51B5",
  successGreen: "#10B981",
  darkGreen: "#0F6B3A",
  gold: "#F5C518",
  goldDark: "#D4A017",
  error: "#EF4444",
  border: "#E5E7EB",
  lightDivider: "#F3F4F6",
  deepBlue: "#020E2C",
  dataPanelBg: "#F8FAFC",
  skyBlue: "#B3E5FC",
  teal: "#006064",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  const parts = num.toString().split(".");
  let int = parts[0];
  const dec = parts.length > 1 ? "." + parts[1] : "";
  const neg = int.startsWith("-");
  if (neg) int = int.substring(1);
  const last3 = int.substring(int.length - 3);
  const rest = int.substring(0, int.length - 3);
  if (rest) return (neg ? "-" : "") + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 + dec;
  return (neg ? "-" : "") + last3 + dec;
};

const formatDate = (ds) => {
  if (!ds) return "N/A";
  try {
    const d = new Date(ds);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) { }
  return "N/A";
};

const calcCommencementDate = (ds) => {
  if (!ds) return "";
  try {
    const d = new Date(ds);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() - 10);
      return d.toISOString().split("T")[0];
    }
  } catch (e) { }
  return "";
};

// ─── Fade-Slide entrance ──────────────────────────────────────────────────────
const FadeSlide = ({ children, delay = 0 }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.exp), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>{children}</Animated.View>;
};

// ─── Page Banner ────────────────────────────────────────────────────────────
const AuctionBanner = ({ userName, filter, setFilter, filteredCount }) => (
  <FadeSlide delay={0}>
    <View style={styles.bannerCard}>
      <View style={styles.bannerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerGreeting}>Your Auctions</Text>
          <Text style={styles.bannerName}>{userName || "Member"}</Text>
          <View style={styles.countBadgeInline}>
            <Text style={styles.bannerSub}>
              Showing <Text style={{ fontWeight: '800', color: Colors.primary }}>{filteredCount}</Text> {filter === 'ALL' ? 'Total' : filter.toLowerCase()} groups
            </Text>
          </View>
        </View>
        <View style={styles.bannerIconCircle}>
          <MaterialIcons name="gavel" size={20} color={Colors.primary} />
        </View>
      </View>
      
      <View style={styles.quickActionsBar}>
        <TouchableOpacity
          style={[styles.quickActionItem, filter === 'ALL' && styles.selectedFilter]}
          onPress={() => setFilter("ALL")}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "#B3E5FC" }]}>
            <MaterialIcons name="layers" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.quickActionText}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionItem, filter === 'PRIZED' && styles.selectedFilter]}
          onPress={() => setFilter("PRIZED")}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "#FFF8DC" }]}>
            <MaterialIcons name="emoji-events" size={20} color={Colors.goldDark} />
          </View>
          <Text style={styles.quickActionText}>Prized</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionItem, filter === 'NOT_PRIZED' && styles.selectedFilter]}
          onPress={() => setFilter("NOT_PRIZED")}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "#E8F5E9" }]}>
            <MaterialIcons name="bolt" size={20} color={Colors.darkGreen} />
          </View>
          <Text style={styles.quickActionText}>Unprized</Text>
        </TouchableOpacity>
      </View>
    </View>
  </FadeSlide>
);

// ─── GroupCard ────────────────────────────────────────────────────────────────
const GroupCard = ({ card, onSelect, isHighlighted, onBidRequest, onPrizedInfo, index, isPrized, serialNumber }) => {
  const {
    _id,
    group_id,
    ticket,
    nextAuctionDate,
    next_auction_date,
  } = card;

  const groupName = group_id?.group_name || "";
  const groupValue = group_id?.group_value || "0";
  const groupObjId = group_id?._id || group_id;
  const ticketNum = ticket ?? card.tickets;
  const safeType = group_id?.auction_type || "";
  const formattedType = safeType ? safeType.charAt(0).toUpperCase() + safeType.slice(1) : "";
  const isFree = safeType.toLowerCase() === "free";
  const displayNextAuction = nextAuctionDate || next_auction_date || null;

  const accentColor = isPrized ? "#7c36a8ff" : isFree ? "#EF6C00" : Colors.primary;
  const lightBg = isPrized ? "#EDE7F6" : isFree ? "#FFF3E0" : "#E3F2FD";

  return (
    <FadeSlide delay={index * 90}>
      <View style={[styles.groupCard, isPrized && styles.groupCardPrized, isHighlighted && styles.groupCardHighlighted]}>
        <View style={[styles.serialNumberBadge, { backgroundColor: isPrized ? Colors.goldDark : Colors.primary }]}>
          <Text style={styles.serialNumberText}>{serialNumber}</Text>
        </View>

        <LinearGradient
          colors={isPrized ? ["#F5C518", "#D4A017"] : isFree ? ["#F48024", "#d05d00"] : [Colors.primary, Colors.primaryLight]}
          start={[0, 0]} end={[1, 0]}
          style={styles.cardTopStripe}
        />

        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: lightBg }]}>
              <MaterialIcons
                name={isPrized ? "emoji_events" : isFree ? "local-offer" : "gavel"}
                size={22}
                color={accentColor}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardGroupName} numberOfLines={1}>{groupName || "—"}</Text>
              {ticketNum !== undefined && ticketNum !== null && (
                <View style={styles.ticketPill}>
                  <MaterialCommunityIcons name="ticket-outline" size={10} color={Colors.primary} />
                  <Text style={styles.ticketPillText}>Ticket #{ticketNum}</Text>
                </View>
              )}
            </View>
            {isPrized ? (
              <View style={[styles.statusBadge, { backgroundColor: "#FFF8DC" }]}>
                <MaterialCommunityIcons name="trophy" size={10} color="#9A6F00" />
                <Text style={[styles.statusBadgeText, { color: "#9A6F00" }]}>PRIZED</Text>
              </View>
            ) : formattedType ? (
              <View style={[styles.statusBadge, isFree ? { backgroundColor: "#FFF3E0" } : { backgroundColor: "#E3F2FD" }]}>
                <Text style={[styles.statusBadgeText, { color: isFree ? "#EF6C00" : Colors.primary }]}>
                  {formattedType.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.cardValueSection}>
            <View style={styles.cardValueBox}>
              <Text style={styles.cardValueLabel}>GROUP VALUE</Text>
              <Text style={[styles.cardValueAmount, isPrized && { color: Colors.goldDark }]}>
                ₹ {formatNumberIndianStyle(groupValue)}
              </Text>
            </View>
            {displayNextAuction && !isPrized && (
              <View style={styles.cardDateBox}>
                <MaterialCommunityIcons name="calendar-clock" size={12} color={Colors.accentOrange} />
                <View style={{ marginLeft: 4 }}>
                  <Text style={styles.cardDateLabel}>Next Auction</Text>
                  <Text style={styles.cardDateValue}>{formatDate(displayNextAuction)}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.cardActionsRow}>
            {isPrized ? (
              <TouchableOpacity style={[styles.cardBtn, styles.cardBtnPrized]} onPress={onPrizedInfo} activeOpacity={0.8}>
                <View style={styles.cardBtnIconCircle}><MaterialCommunityIcons name="trophy" size={14} color="#9A6F00" /></View>
                <View><Text style={[styles.cardBtnTitle, { color: "#7A5500" }]}>Prized Info</Text><Text style={styles.cardBtnSub}>View details</Text></View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.cardBtn, styles.cardBtnBid]} onPress={onBidRequest} activeOpacity={0.8}>
                <View style={styles.cardBtnIconCircle}><MaterialCommunityIcons name="handshake" size={14} color={Colors.darkGreen} /></View>
                <View><Text style={[styles.cardBtnTitle, { color: Colors.darkGreen }]}>Bid Request</Text><Text style={styles.cardBtnSub}>Place a bid</Text></View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.cardBtn, styles.cardBtnDetails]} onPress={() => onSelect(_id, groupObjId, ticketNum, groupName, groupValue)} activeOpacity={0.8}>
              <View style={styles.cardBtnIconCircle}><MaterialIcons name="timeline" size={14} color={Colors.primary} /></View>
              <View><Text style={[styles.cardBtnTitle, { color: Colors.primary }]}>Details</Text><Text style={styles.cardBtnSub}>Full history</Text></View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </FadeSlide>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ groupName, groupValue, totalRecords, normalCount, freeCount, commencementCount, selectedTicket, isPrized }) => (
  <FadeSlide delay={0}>
    <View style={styles.summaryCard}>
      <LinearGradient colors={isPrized ? ["#7c36a8ff", "#9C27B0", "#BA68C8"] : ["#0F4C3A", "#0E7C5B", "#14A87A"]} start={[0, 0]} end={[1, 1]} style={styles.summaryGradientHeader}>
        <View style={styles.summaryStripe1} /><View style={styles.summaryStripe2} />
        <View style={styles.summaryHeaderTop}>
          <View style={{ flexDirection: "row", alignItems: "center" }}><MaterialCommunityIcons name="chart-timeline-variant" size={13} color="rgba(255,255,255,0.6)" style={{ marginRight: 4 }} /><Text style={styles.summaryEyebrow}>AUCTION OVERVIEW</Text></View>
          {isPrized && <View style={styles.summaryPrizedBadge}><MaterialCommunityIcons name="trophy" size={9} color="#7B0D1E" /><Text style={styles.summaryPrizedText}>PRIZED</Text></View>}
        </View>
        <Text style={styles.summaryGroupName} numberOfLines={1}>{groupName}</Text>
        
        <View style={styles.summaryDetailsRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialCommunityIcons name="ticket-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.summaryTicketText}>Ticket <Text style={styles.summaryTicketNum}>{selectedTicket}</Text></Text>
          </View>
          <Text style={styles.summaryGroupValueInline}>{groupValue ? `₹ ${formatNumberIndianStyle(groupValue)}` : ""}</Text>
        </View>
      </LinearGradient>

      <View style={styles.summaryStatsBody}>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, styles.statBoxTotal]}>
            <Text style={styles.statValueTotal}>{totalRecords}</Text>
            <Text style={styles.statLabel}>Auction Records</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxNormal]}>
            <Text style={styles.statValueNormal}>{normalCount}</Text>
            <Text style={styles.statLabel}>Normal</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxFree]}>
            <Text style={styles.statValueFree}>{freeCount}</Text>
            <Text style={styles.statLabel}>Free</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxCommence]}>
            <Text style={styles.statValueCommence}>{commencementCount}</Text>
            <Text style={styles.statLabel}>First payment</Text>
          </View>
        </View>
      </View>
    </View>
  </FadeSlide>
);

// ─── REDESIGNED CommencementRecordCard (Timeline/Launch Theme) ────────────────
const CommencementRecordCard = ({ groupName, firstAuctionDate, onPress }) => {
  const commencementStr = calcCommencementDate(firstAuctionDate);
  let isClose = false;
  if (commencementStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cDate = new Date(commencementStr); cDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((cDate - today) / 86400000);
    if (diff >= 0) isClose = diff <= 10;
  }
  if (!firstAuctionDate && !groupName) return null;
  return (
    <FadeSlide delay={100}>
      <TouchableOpacity style={[styles.commencementCard]} onPress={onPress} activeOpacity={0.8}>
        
        {/* 1. Distinct Header (Deep Orange/Red Gradient) */}
        <LinearGradient 
          colors={isClose ? ["#D32F2F", "#C62828"] : ["#FF5722", "#E64A19"]} 
          start={[0, 0]} end={[1, 0]} 
          style={styles.commencementHeader}
        >
          <View style={styles.commencementHeaderTop}>
             <View style={styles.commencementTitleRow}>
                <MaterialCommunityIcons name="rocket-launch" size={18} color="#fff" />
                <Text style={styles.commencementTitleText}>COMMENCEMENT RECORD</Text>
             </View>
             <View style={styles.recordOneBadge}>
                <Text style={styles.recordOneText}>RECORD 1</Text>
             </View>
          </View>
          {isClose && (
             <View style={styles.urgentPill}>
                <MaterialIcons name="notification-important" size={10} color="#fff" />
                <Text style={styles.urgentText}>Commencing Soon</Text>
             </View>
          )}
        </LinearGradient>

        {/* 2. Vertical Timeline Body */}
        <View style={styles.commencementBody}>
           <View style={styles.timelineContainer}>
              
              {/* Step 1: Group Starts */}
              <View style={styles.timelineItem}>
                 <View style={styles.timelineIconBox}>
                    <MaterialCommunityIcons name="flag-variant" size={18} color={isClose ? Colors.error : Colors.accentOrange} />
                 </View>
                 <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Group Starts</Text>
                    <Text style={styles.timelineDate}>{firstAuctionDate ? formatDate(commencementStr) : "Not Set"}</Text>
                 </View>
              </View>

              {/* Dashed Line Connector */}
              <View style={styles.timelineLine} />

              {/* Step 2: First Auction */}
              <View style={styles.timelineItem}>
                 <View style={styles.timelineIconBox}>
                    <MaterialCommunityIcons name="gavel" size={18} color={isClose ? Colors.error : Colors.accentOrange} />
                 </View>
                 <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>First Auction</Text>
                    <Text style={styles.timelineDate}>{firstAuctionDate ? formatDate(firstAuctionDate) : "N/A"}</Text>
                 </View>
              </View>

           </View>
        </View>

        {/* 3. Footer Status */}
        <View style={styles.commencementFooter}>
           <View style={[styles.commencementTypePill, { borderColor: isClose ? Colors.error : Colors.accentOrange }]}>
              <Text style={[styles.commencementTypeText, { color: isClose ? Colors.error : Colors.accentOrange }]}>Auction Type: Commencement</Text>
           </View>
        </View>

      </TouchableOpacity>
    </FadeSlide>
  );
};

// ─── UPDATED AuctionRecordCard ────────────────────────────────────────────────
const AuctionRecordCard = ({ record, recordNumber, index }) => {
  const isFree = record.auction_type?.toLowerCase() === "free";
  const typeLabel = record.auction_type ? record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1) : "Normal";
  
  // Define dynamic theme based on Auction Type
  const theme = isFree ? {
    bg: "#FFF3E0", // Light Orange background
    border: "#FFE0B2",
    primaryText: "#E65100",
    secondaryText: "#EF6C00",
    gradientStart: "#FF9800",
    gradientEnd: "#F57C00",
    iconBg: "rgba(230, 81, 0, 0.1)"
  } : {
    bg: "#E3F2FD", // Light Blue background
    border: "#BBDEFB",
    primaryText: "#0D47A1",
    secondaryText: "#1976D2",
    gradientStart: "#2196F3",
    gradientEnd: "#1976D2",
    iconBg: "rgba(13, 71, 161, 0.1)"
  };

  return (
    <FadeSlide delay={index * 70}>
      <View style={[styles.recordCard, { backgroundColor: Colors.card, borderColor: theme.border }]}>
        
        {/* --- 1. HEADER: Record # (Left) | Auction Type (Right) --- */}
        <LinearGradient 
          colors={[theme.gradientStart, theme.gradientEnd]} 
          start={[0, 0]} end={[1, 0]} 
          style={styles.recordChipBar}
        >
          <View style={styles.headerRow}>
            {/* Left: Record Number */}
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="gavel" size={14} color="#fff" />
              <Text style={styles.recordNumText}>RECORD {recordNumber}</Text>
            </View>

            {/* Right: Auction Type Badge */}
            <View style={styles.headerRightBadge}>
              <Text style={styles.headerTypeText}>{typeLabel}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* --- 2. MIDDLE: Dates --- */}
        <View style={styles.recordDatesRow}>
          <View style={styles.recordDateBox}>
            <View style={[styles.recordDateIconCircle, { backgroundColor: theme.iconBg }]}>
              <MaterialCommunityIcons name="calendar-start" size={14} color={theme.primaryText} />
            </View>
            <View style={{ marginLeft: 6, alignItems: 'center' }}>
               <Text style={styles.recordDateLabel}>Auction Date</Text>
               <Text style={[styles.recordDateValue, { color: theme.primaryText }]}>{formatDate(record.auction_date)}</Text>
            </View>
          </View>
          <View style={styles.recordDateDivider} />
          <View style={styles.recordDateBox}>
            <View style={[styles.recordDateIconCircle, { backgroundColor: theme.iconBg }]}>
              <MaterialCommunityIcons name="calendar-end" size={14} color={theme.primaryText} />
            </View>
            <View style={{ marginLeft: 6, alignItems: 'center' }}>
               <Text style={styles.recordDateLabel}>Next Date</Text>
               <Text style={[styles.recordDateValue, { color: theme.primaryText }]}>{formatDate(record.next_date)}</Text>
            </View>
          </View>
        </View>

        {/* --- 3. FOOTER: Bid % | Ticket | Amount --- */}
        <View style={[styles.recordFooterRow, { borderTopColor: theme.border }]}>
          
          {/* 1. Bid Percentage */}
          <View style={styles.footerMetric}>
             <Text style={[styles.footerLabel, { color: theme.secondaryText }]}>Bid Percentage</Text>
             <Text style={[styles.footerValue, { color: theme.primaryText }]}>{record.bid_percentage || "0"}%</Text>
          </View>

          {/* Divider Line */}
          <View style={[styles.footerDivider, { backgroundColor: theme.border }]} />

          {/* 2. Winning Ticket */}
          <View style={styles.footerMetric}>
             <Text style={[styles.footerLabel, { color: theme.secondaryText }]}>Winning Ticket</Text>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="ticket-confirmation" size={12} color={theme.primaryText} />
                <Text style={[styles.footerValue, { color: theme.primaryText }]}>{record.ticket || "N/A"}</Text>
             </View>
          </View>

          {/* Divider Line */}
          <View style={[styles.footerDivider, { backgroundColor: theme.border }]} />

          {/* 3. Bid Amount */}
          <View style={styles.footerMetric}>
             <Text style={[styles.footerLabel, { color: theme.secondaryText }]}>Bid Amount</Text>
             <Text style={[styles.footerValue, { color: theme.primaryText, fontWeight: '900' }]}>₹ {formatNumberIndianStyle(record.bid_amount)}</Text>
          </View>

        </View>

      </View>
    </FadeSlide>
  );
};

const AuctionRecordsView = ({ records, onBack, isLoading, error, commencementData, onCommencementPress, selectedGroupName, selectedGroupValue, selectedTicket, isPrized }) => {
  if (isLoading) return <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />;
  const hasCommencement = !!(commencementData && (commencementData.group_name || commencementData.commencement_date));
  const totalRecords = records.length + (hasCommencement ? 1 : 0);
  const normalCount = records.filter(r => (r.auction_type || "").toLowerCase() === "normal").length;
  const freeCount = records.filter(r => (r.auction_type || "").toLowerCase() === "free").length;
  return (
    <View style={styles.recordsContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}><View style={[styles.cardBtnIconCircle, { backgroundColor: Colors.backgroundLight }]}><MaterialIcons name="arrow-back" size={18} color={Colors.primary} /></View><Text style={styles.backBtnText}>Back to Groups</Text></TouchableOpacity>
      {records.length === 0 && !hasCommencement ? (
        <View style={styles.noDataContainer}><Image source={NoRecordFoundImage} style={styles.noDataImage} resizeMode="contain" /><Text style={styles.noDataText}>{error || "No auction records found."}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.recordsScrollContent} showsVerticalScrollIndicator={false}>
          <SummaryCard groupName={selectedGroupName} groupValue={selectedGroupValue} totalRecords={totalRecords} normalCount={normalCount} freeCount={freeCount} commencementCount={hasCommencement ? 1 : 0} selectedTicket={selectedTicket} isPrized={isPrized} />
          <View style={styles.sectionLabelRow}><View style={styles.sectionLabelLine} /><Text style={styles.sectionLabelText}>Auction Records</Text><View style={styles.sectionLabelLine} /></View>
          {records.map((record, index) => (<AuctionRecordCard key={record._id || `rec-${index}`} record={record} recordNumber={totalRecords - index} index={index} />))}
          {hasCommencement && (<CommencementRecordCard groupName={commencementData.group_name} firstAuctionDate={commencementData.commencement_date} onPress={onCommencementPress} />)}
        </ScrollView>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AuctionList = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  const [isLoading, setIsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [userName, setUserName] = useState(""); 
  const [filter, setFilter] = useState("ALL");

  const [isShowingRecords, setIsShowingRecords] = useState(false);
  const [auctionData, setAuctionData] = useState({
    records: [], loading: false, error: null,
    selectedGroupId: null, highlightedCardId: null,
    selectedGroupName: "", selectedGroupValue: null, selectedTicket: null,
  });
  const [commencementAuctionData, setCommencementAuctionData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (userId) {
          if (appUser?.full_name || appUser?.name) {
            setUserName(appUser.full_name || appUser.name);
          } else {
            const response = await axios.get(`${url}/user/get-user-by-id/${userId}`);
            setUserName(response.data.full_name || response.data.name || "");
          }
        }
      } catch (error) { console.error("Error fetching user data:", error); }
    };
    fetchUserData();
  }, [userId, appUser]);

  const fetchEnrollments = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await axios.get(`${url}/auction/enrolls-info/users/${userId}`);
      if (res.status === 200) {
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setEnrollments(raw);
      }
    } catch (e) { setEnrollments([]); } finally { setIsLoading(false); }
  }, [userId]);

  const fetchAuctionDetails = useCallback(async (groupId, groupName) => {
    if (!groupId) return;
    setAuctionData(prev => ({ ...prev, loading: true, error: null, records: [] }));
    try {
      const res = await axios.get(`${url}/auction/group/${groupId}`);
      if (res.status === 200) {
        const records = res.data || [];
        const first = records.length > 0 ? records[0] : null;
        setCommencementAuctionData({ group_name: first?.group_id?.group_name || groupName || "Selected Group", commencement_date: first?.auction_date || null });
        setAuctionData(prev => ({ ...prev, records: records.slice().reverse() }));
      }
    } catch (e) {
      setAuctionData(prev => ({ ...prev, error: "No auction records found." }));
      setCommencementAuctionData({ group_name: groupName || "Selected Group", commencement_date: null });
    } finally { setAuctionData(prev => ({ ...prev, loading: false })); }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchEnrollments();
    setIsShowingRecords(false);
  }, [fetchEnrollments]));

  const handleViewDetails = (enrollmentId, groupId, ticket, groupName, groupValue) => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAuctionData(prev => ({ ...prev, selectedGroupId: groupId, highlightedCardId: enrollmentId, selectedGroupName: groupName, selectedGroupValue: groupValue, selectedTicket: ticket }));
    setIsShowingRecords(true);
    fetchAuctionDetails(groupId, groupName);
  };

  const handleBack = () => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsShowingRecords(false);
  };

  const handleBidRequest = useCallback((card) => {
    const nextAuctionDate = card.next_auction_date || card.nextAuctionDate || null;
    if (!nextAuctionDate) { Alert.alert("Auction Not Scheduled", "Next auction date is not available."); return; }
    const now = new Date();
    const auctionDate = new Date(nextAuctionDate);
    const diffHours = (auctionDate - now) / (1000 * 60 * 60);
    if (diffHours > 48) {
      Alert.alert("Bid Request Not Open", `Bid request opens 48 hours before auction.\n\nNext Auction Date: ${formatDate(nextAuctionDate)}`);
      return;
    }
    navigation.navigate("BidRequest", { userId, selectedGroupId: card.group_id?._id, selectedEnrollmentId: card._id, preselectedGroup: { group_id: card.group_id, tickets: card.ticket, _id: card._id, group_name: card.group_id?.group_name } });
  }, [navigation, userId]);

  const handlePrizedInfo = (card) => {
    Vibration.vibrate(50);
    navigation.navigate("PrizedScreen", { userId, groupId: card.group_id?._id, ticket: card.ticket });
  };

  const isCardPrized = (card) => {
    const val = card.isPrized;
    return typeof val === "boolean" ? val : (typeof val === "string" ? val.toLowerCase() === "true" : false);
  };

  const validCards = enrollments.filter(c => c.group_id && c.group_id._id);
  const filteredCards = validCards.filter(card => {
    const isPrized = isCardPrized(card);
    if (filter === "PRIZED") return isPrized;
    if (filter === "NOT_PRIZED") return !isPrized;
    return true;
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Header userId={userId} navigation={navigation} />
      <View style={styles.outerBox}>
        <View style={styles.innerBox}>
          {!isShowingRecords ? (
            <>
              <View style={styles.sectionTitleWrapper}><Text style={styles.sectionTitleText}>Auctions</Text></View>
              {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
              ) : validCards.length === 0 ? (
                <View style={styles.noDataContainer}><Image source={NoGroupImage} style={styles.noDataImage} resizeMode="contain" /><Text style={styles.noDataText}>No groups found.</Text></View>
              ) : (
                <ScrollView contentContainerStyle={styles.groupListContent} showsVerticalScrollIndicator={false}>
                  <AuctionBanner userName={userName} filter={filter} setFilter={setFilter} filteredCount={filteredCards.length} />
                  <View style={styles.groupsLabelRow}><MaterialCommunityIcons name="layers-outline" size={14} color={Colors.textLight} /><Text style={styles.groupsLabelText}>YOUR ENROLLED GROUPS</Text></View>
                  {filteredCards.length > 0 ? (
                    filteredCards.map((card, index) => (
                      <GroupCard key={card._id} card={card} index={index} serialNumber={index + 1} onSelect={handleViewDetails} isHighlighted={auctionData.highlightedCardId === card._id} isPrized={isCardPrized(card)} onBidRequest={() => handleBidRequest(card)} onPrizedInfo={() => handlePrizedInfo(card)} />
                    ))
                  ) : (
                    <View style={styles.noDataContainer}><Text style={styles.noDataText}>No records found for this filter.</Text></View>
                  )}
                  <View style={styles.footerNote}><MaterialIcons name="verified-user" size={14} color={Colors.primary} /><Text style={styles.footerNoteText}>All auctions are fully compliant with the Chit Fund Act 1982</Text></View>
                </ScrollView>
              )}
            </>
          ) : (
            <AuctionRecordsView records={auctionData.records} onBack={handleBack} isLoading={auctionData.loading} error={auctionData.error} commencementData={commencementAuctionData} onCommencementPress={() => Vibration.vibrate(50)} selectedGroupName={auctionData.selectedGroupName} selectedGroupValue={auctionData.selectedGroupValue} selectedTicket={auctionData.selectedTicket} isPrized={!!isCardPrized(validCards.find(c => c.group_id?._id === auctionData.selectedGroupId) || {})} />
          )}
        </View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.primary },
  outerBox: {
    flex: 1, backgroundColor: Colors.backgroundLight,
    marginHorizontal: 10, marginBottom: 50, borderRadius: 30, overflow: "hidden",
    elevation: 20, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20,
  },
  innerBox: { flex: 1, paddingHorizontal: 14, paddingBottom: 10 },
  sectionTitleWrapper: { alignSelf: "center", marginTop: 20, marginBottom: 16, backgroundColor: "#d9dbb6ff", width: 220, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.primary },
  sectionTitleText: { color: Colors.primary, fontWeight: "900", fontSize: 20 },

  // --- Banner Styles ---
  bannerCard: { backgroundColor: Colors.skyBlue, borderRadius: 18, padding: 14, marginBottom: 10, elevation: 3 },
  bannerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  bannerGreeting: { fontSize: 12, fontWeight: "500", color: Colors.primary, opacity: 0.75 },
  bannerName: { fontSize: 14, fontWeight: "bold", color: Colors.primary },
  bannerSub: { fontSize: 11, color: Colors.primaryLight },
  bannerIconCircle: { width: 30, height: 30, borderRadius: 25, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 2 },
  countBadgeInline: { marginTop: 4, backgroundColor: 'rgba(255,255,255,0.4)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  quickActionsBar: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 8, flexDirection: "row", justifyContent: "space-around" },
  quickActionItem: { alignItems: "center", width: "30%" },
  selectedFilter: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingVertical: 2 },
  quickActionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  quickActionText: { fontSize: 8, color: "#fff", fontWeight: "700" },

  groupsLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 4 },
  groupsLabelText: { fontSize: 9, fontWeight: "700", color: Colors.textLight, letterSpacing: 1.6, textTransform: "uppercase" },

  // --- GroupCard Styles ---
  groupCard: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, overflow: "visible", borderWidth: 1, borderColor: Colors.border, elevation: 6 },
  groupCardPrized: { borderColor: Colors.gold, borderWidth: 1.5 },
  groupCardHighlighted: { borderColor: Colors.primaryLight, borderWidth: 2 },
  cardTopStripe: { height: 4, width: "100%", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardBody: { padding: 10 },

  serialNumberBadge: { position: 'absolute', top: -10, left: 12, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 2, borderColor: '#fff', elevation: 4 },
  serialNumberText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  cardHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  cardGroupName: { fontSize: 13, fontWeight: "800", color: Colors.textDark },
  ticketPill: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3, backgroundColor: "#E3F2FD", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
  ticketPillText: { fontSize: 10, fontWeight: "700", color: Colors.primary },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 8, fontWeight: "800" },

  cardValueSection: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.dataPanelBg, borderRadius: 8, padding: 8, marginBottom: 8 },
  cardValueBox: { flex: 1 },
  cardValueLabel: { fontSize: 8, fontWeight: "700", color: Colors.textLight, textTransform: "uppercase" },
  cardValueAmount: { fontSize: 18, fontWeight: "900", color: Colors.primary },
  cardDateBox: { flexDirection: "row", alignItems: "center" },
  cardDateLabel: { fontSize: 8, color: Colors.textLight },
  cardDateValue: { fontSize: 10, fontWeight: "700", color: Colors.textDark },

  cardActionsRow: { flexDirection: "row", gap: 6 },
  cardBtn: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, gap: 6, elevation: 2 },
  cardBtnBid: { backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#C8E6C9" },
  cardBtnPrized: { backgroundColor: "#FFF8DC", borderWidth: 1, borderColor: "#FFE082" },
  cardBtnDetails: { backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#BBDEFB" },
  cardBtnIconCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  cardBtnTitle: { fontSize: 10, fontWeight: "bold" },
  cardBtnSub: { fontSize: 7, color: Colors.textLight },

  // --- Summary Card Styles ---
  summaryCard: { backgroundColor: Colors.card, borderRadius: 18, marginBottom: 14, overflow: "hidden", elevation: 8 },
  summaryGradientHeader: { paddingVertical: 18, paddingHorizontal: 16, paddingBottom: 14 },
  summaryStripe1: { position: "absolute", width: 160, height: 160, backgroundColor: "rgba(255,255,255,0.04)", transform: [{ rotate: "35deg" }], top: -70, right: -30 },
  summaryStripe2: { position: "absolute", width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.03)", transform: [{ rotate: "35deg" }], bottom: -30, left: 40 },
  summaryHeaderTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryEyebrow: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" },
  summaryPrizedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  summaryPrizedText: { fontSize: 9, fontWeight: "900", color: "#7B0D1E" },
  summaryGroupName: { fontSize: 15, fontWeight: "900", color: Colors.card, marginTop: -2 },
  summaryDetailsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: -2 },
  summaryTicketText: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  summaryTicketNum: { fontSize: 15, fontWeight: "900", color: Colors.card },
  summaryGroupValueInline: { fontSize: 20, fontWeight: "900", color: "#7FFFD4" },

  // Stats Body
  summaryStatsBody: { backgroundColor: Colors.card, paddingVertical: 16, paddingHorizontal: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: "space-between", gap: 8 },
  statBox: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, elevation: 2 },
  statLabel: { fontSize: 8, fontWeight: '500', marginTop: 3, textAlign:'center' },
  statBoxTotal: { backgroundColor: "#E0F2F1", borderColor: "#B2DFDB" }, statValueTotal: { fontSize: 18, fontWeight: '900', color: "#00695C" },
  statBoxNormal: { backgroundColor: "#E3F2FD", borderColor: "#BBDEFB" }, statValueNormal: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  statBoxFree: { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" }, statValueFree: { fontSize: 18, fontWeight: '900', color: Colors.accentOrange },
  statBoxCommence: { backgroundColor: "#F3E5F5", borderColor: "#E1BEE7" }, statValueCommence: { fontSize: 18, fontWeight: '900', color: "#7B1FA2" },

  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 12 },
  sectionLabelLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  sectionLabelText: { fontSize: 9, fontWeight: "700", color: Colors.textLight, textTransform: "uppercase" },

  // --- COMMENCEMENT CARD STYLES (NEW DESIGN) ---
  commencementCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FFCCBC", // Light Orange border
  },
  commencementHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  commencementHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commencementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commencementTitleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  recordOneBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  recordOneText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  urgentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  urgentText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  commencementBody: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  timelineContainer: {
    position: "relative",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timelineIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFCCBC",
  },
  timelineLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textLight,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textDark,
  },
  timelineLine: {
    position: "absolute",
    left: 17, // center of icon box (36/2) - 1
    top: 36,
    bottom: 36,
    width: 2,
    backgroundColor: "#FFCCBC",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#FFCCBC",
  },
  commencementFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#FFE0B2",
    alignItems: "center",
  },
  commencementTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  commencementTypeText: {
    fontSize: 11,
    fontWeight: "700",
  },


  // --- Record Card Styles (Standard) ---
  recordCard: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, overflow: "hidden", elevation: 5, borderWidth: 1, borderColor: Colors.border },
  
  // 1. Header Styles
  recordChipBar: { 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordNumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRightBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  headerTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  // 2. Date Styles (Middle)
  recordDatesRow: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  recordDateBox: { flex: 1, flexDirection: "row", alignItems: "center" },
  recordDateIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  recordDateDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 6 },
  recordDateLabel: { fontSize: 8, fontWeight: "600", color: Colors.textLight, textTransform: "uppercase" },
  recordDateValue: { fontSize: 11, fontWeight: "800", marginTop: 2 },

  // 3. Footer Styles (Last Line)
  recordFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderTopWidth: 1,
  },
  footerMetric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
  },
  footerDivider: {
    width: 1,
    height: 30,
  },

  // Legacy Styles
  recordInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14 },
  recordInfoLabel: { fontSize: 13, fontWeight: "500", color: Colors.textMedium },
  recordTypePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  recordTypePillText: { fontSize: 11, fontWeight: "800" },

  recordsContainer: { flex: 1 },
  recordsScrollContent: { paddingBottom: 30 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, marginBottom: 14, elevation: 3 },
  backBtnText: { fontSize: 13, fontWeight: "700", color: Colors.primary },

  footerNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  footerNoteText: { fontSize: 11, color: Colors.textMedium, fontStyle: "italic" },

  noDataContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 50 },
  noDataImage: { width: 150, height: 140, marginBottom: 14 },
  noDataText: { fontSize: 14, fontWeight: "600", color: Colors.textMedium },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  groupListContent: { paddingBottom: 20 },
});

export default AuctionList;