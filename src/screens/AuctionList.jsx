
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

// ─── Page Banner (matches Home sky blue section) ────────────────────────────
// FIXED: Added filter and setFilter to props
const AuctionBanner = ({ userName, totalGroups, prizedCount, filter, setFilter }) => (
  <FadeSlide delay={0}>
    <View style={styles.bannerCard}>
      <View style={styles.bannerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerGreeting}>Your Auctions</Text>
          <Text style={styles.bannerName}>{userName || "Member"}</Text>
          <Text style={styles.bannerSub}>Track bids, records & commencements</Text>
        </View>
        <View style={styles.bannerIconCircle}>
          <MaterialIcons name="gavel" size={34} color={Colors.primary} />
        </View>
      </View>
      
      {/* Quick Actions Bar inside Banner */}
      <View style={styles.quickActionsBar}>
        <TouchableOpacity
          style={[styles.quickActionItem, filter === 'ALL' && styles.selectedFilter]}
          onPress={() => setFilter("ALL")}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "#B3E5FC" }]}>
            <MaterialIcons name="layers" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.quickActionText}>Groups</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionItem, filter === 'PRIZED' && styles.selectedFilter]}
          onPress={() => setFilter("PRIZED")}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "#FFF8DC" }]}>
            <MaterialIcons name="emoji-events" size={22} color={Colors.goldDark} />
          </View>
          <Text style={styles.quickActionText}>Prized</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionItem, filter === 'ACTIVE' && styles.selectedFilter]}
          onPress={() => setFilter("ACTIVE")}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "#E8F5E9" }]}>
            <MaterialIcons name="bolt" size={22} color={Colors.darkGreen} />
          </View>
          <Text style={styles.quickActionText}>Unprized</Text>
        </TouchableOpacity>
      </View>

    </View>
 
  </FadeSlide >
);

// ─── GroupCard — Home service-card style ──────────────────────────────────────
const GroupCard = ({ card, onSelect, isHighlighted, onBidRequest, onPrizedInfo, index, isPrized }) => {
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

  // Pick icon bg color like Home service cards
  const accentColor = isPrized ? "#7c36a8ff" : isFree ? "#EF6C00" : Colors.primary;
  const lightBg = isPrized ? "#EDE7F6" : isFree ? "#FFF3E0" : "#E3F2FD";

  return (
    <FadeSlide delay={index * 90}>
      <View style={[styles.groupCard, isPrized && styles.groupCardPrized, isHighlighted && styles.groupCardHighlighted]}>
        {/* Top accent bar matching Home service cards */}
        <LinearGradient
          colors={isPrized ? ["#F5C518", "#D4A017"] : isFree ? ["#F48024", "#d05d00"] : [Colors.primary, Colors.primaryLight]}
          start={[0, 0]} end={[1, 0]}
          style={styles.cardTopStripe}
        />

        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: lightBg }]}>
              <MaterialIcons
                name={isPrized ? "emoji-events" : isFree ? "local-offer" : "gavel"}
                size={26}
                color={accentColor}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardGroupName} numberOfLines={1}>{groupName || "—"}</Text>
              {ticketNum !== undefined && ticketNum !== null && (
                <View style={styles.ticketPill}>
                  <MaterialCommunityIcons name="ticket-outline" size={12} color={Colors.primary} />
                  <Text style={styles.ticketPillText}>Ticket #{ticketNum}</Text>
                </View>
              )}
            </View>
            {/* Status badge */}
            {isPrized ? (
              <View style={[styles.statusBadge, { backgroundColor: "#FFF8DC" }]}>
                <MaterialCommunityIcons name="trophy" size={11} color="#9A6F00" />
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

          {/* Value row */}
          <View style={styles.cardValueSection}>
            <View style={styles.cardValueBox}>
              <Text style={styles.cardValueLabel}>GROUP VALUE</Text>
              <Text style={[styles.cardValueAmount, isPrized && { color: Colors.goldDark }]}>
                ₹ {formatNumberIndianStyle(groupValue)}
              </Text>
            </View>
            {displayNextAuction && !isPrized && (
              <View style={styles.cardDateBox}>
                <MaterialCommunityIcons name="calendar-clock" size={13} color={Colors.accentOrange} />
                <View style={{ marginLeft: 5 }}>
                  <Text style={styles.cardDateLabel}>Next Auction</Text>
                  <Text style={styles.cardDateValue}>{formatDate(displayNextAuction)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action buttons — styled like Home pay buttons */}
          <View style={styles.cardActionsRow}>
            {isPrized ? (
              <TouchableOpacity
                style={[styles.cardBtn, styles.cardBtnPrized]}
                onPress={onPrizedInfo}
                activeOpacity={0.8}
              >
                <View style={styles.cardBtnIconCircle}>
                  <MaterialCommunityIcons name="trophy" size={16} color="#9A6F00" />
                </View>
                <View>
                  <Text style={[styles.cardBtnTitle, { color: "#7A5500" }]}>Prized Info</Text>
                  <Text style={styles.cardBtnSub}>View details</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.cardBtn, styles.cardBtnBid]}
                onPress={onBidRequest}
                activeOpacity={0.8}
              >
                <View style={styles.cardBtnIconCircle}>
                  <MaterialCommunityIcons name="handshake" size={16} color={Colors.darkGreen} />
                </View>
                <View>
                  <Text style={[styles.cardBtnTitle, { color: Colors.darkGreen }]}>Bid Request</Text>
                  <Text style={styles.cardBtnSub}>Place a bid</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.cardBtn, styles.cardBtnDetails]}
              onPress={() => onSelect(_id, groupObjId, ticketNum, groupName, groupValue)}
              activeOpacity={0.8}
            >
              <View style={styles.cardBtnIconCircle}>
                <MaterialIcons name="timeline" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={[styles.cardBtnTitle, { color: Colors.primary }]}>Auction Details</Text>
                <Text style={styles.cardBtnSub}>Full history</Text>
              </View>
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
      <LinearGradient
        colors={isPrized ? ["#7c36a8ff", "#9C27B0", "#BA68C8"] : ["#0F4C3A", "#0E7C5B", "#14A87A"]}
        start={[0, 0]} end={[1, 1]}
        style={styles.summaryGradientHeader}
      >
        {/* decorative stripes */}
        <View style={styles.summaryStripe1} />
        <View style={styles.summaryStripe2} />

        <View style={styles.summaryHeaderTop}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={13} color="rgba(255,255,255,0.6)" style={{ marginRight: 4 }} />
            <Text style={styles.summaryEyebrow}>AUCTION OVERVIEW</Text>
          </View>
          {isPrized && (
            <View style={styles.summaryPrizedBadge}>
              <MaterialCommunityIcons name="trophy" size={9} color="#7B0D1E" />
              <Text style={styles.summaryPrizedText}>PRIZED</Text>
            </View>
          )}
        </View>

        <Text style={styles.summaryGroupName} numberOfLines={1}>{groupName}</Text>
        {selectedTicket !== undefined && selectedTicket !== null && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <MaterialCommunityIcons name="ticket-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.summaryTicketText}>
              Ticket <Text style={styles.summaryTicketNum}>{selectedTicket}</Text>
            </Text>
          </View>
        )}
        <Text style={styles.summaryGroupValue}>
          {groupValue ? `₹ ${formatNumberIndianStyle(groupValue)}` : ""}
        </Text>
      </LinearGradient>

      {/* Stats grid — like Home bottomContainer */}
      <View style={styles.summaryStatsGrid}>
        {[
          { label: "Auction Records", value: totalRecords, color: Colors.textDark },
          { label: "Normal Auction", value: normalCount, color: Colors.primary },
          { label: "Free Auction", value: freeCount, color: Colors.accentOrange },
          { label: "First Payment", value: commencementCount, color: Colors.accentBlue },
        ].map((item, i) => (
          <View key={i} style={styles.summaryStatBox}>
            <Text style={[styles.summaryStatValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.summaryStatLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  </FadeSlide>
);

// ─── CommencementRecordCard ────────────────────────────────────────────────────
const CommencementRecordCard = ({ groupName, firstAuctionDate, onPress }) => {
  const commencementStr = calcCommencementDate(firstAuctionDate);
  let remainingDays = "N/A", isClose = false, isPassed = false;
  if (commencementStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cDate = new Date(commencementStr); cDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((cDate - today) / 86400000);
    if (diff >= 0) { remainingDays = diff; isClose = diff <= 10; }
    else { remainingDays = "Passed"; isPassed = true; }
  }
  if (!firstAuctionDate && !groupName) return null;

  return (
    <FadeSlide delay={100}>
      <TouchableOpacity
        style={[styles.recordCard, { borderWidth: 1.5, borderColor: isClose ? Colors.error : Colors.accentOrange }]}
        onPress={onPress} activeOpacity={0.8}
      >
        <LinearGradient
          colors={isClose ? ["#FF6B35", "#F48024"] : ["#F48024", "#E8690A"]}
          start={[0, 0]} end={[1, 0]}
          style={styles.recordChipBar}
        >
          <MaterialCommunityIcons name="rocket-launch" size={12} color="#fff" />
          <Text style={styles.recordChipText}>RECORD 1 · COMMENCEMENT</Text>
        </LinearGradient>

        <View style={styles.recordDatesRow}>
          <View style={styles.recordDateBox}>
            <View style={[styles.recordDateIconCircle, { backgroundColor: "#E3F2FD" }]}>
              <MaterialCommunityIcons name="calendar-start" size={16} color={Colors.accentBlue} />
            </View>
            <Text style={styles.recordDateLabel}>Commencement Date</Text>
            <Text style={[styles.recordDateValue, { color: Colors.primary }]}>
              {firstAuctionDate ? formatDate(commencementStr) : "Not Set"}
            </Text>
          </View>
          <View style={styles.recordDateDivider} />
          <View style={styles.recordDateBox}>
            <View style={[styles.recordDateIconCircle, { backgroundColor: "#FFF3E0" }]}>
              <MaterialCommunityIcons name="calendar-end" size={16} color={Colors.accentOrange} />
            </View>
            <Text style={styles.recordDateLabel}>Next Auction Date</Text>
            <Text style={styles.recordDateValue}>{firstAuctionDate ? formatDate(firstAuctionDate) : "N/A"}</Text>
          </View>
        </View>

        <View style={styles.recordInfoRow}>
          <Text style={styles.recordInfoLabel}>Auction Type</Text>
          <View style={[styles.recordTypePill, { backgroundColor: "#FFF3E0" }]}>
            <Text style={[styles.recordTypePillText, { color: Colors.accentOrange }]}>COMMENCEMENT</Text>
          </View>
        </View>
      </TouchableOpacity>
    </FadeSlide>
  );
};

// ─── AuctionRecordCard ────────────────────────────────────────────────────────
const AuctionRecordCard = ({ record, recordNumber, index }) => {
  const isFree = record.auction_type?.toLowerCase() === "free";
  const typeLabel = record.auction_type
    ? record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1)
    : "Normal";
  const accentColor = isFree ? Colors.accentOrange : Colors.primary;
  const lightBg = isFree ? "#FFF3E0" : "#E3F2FD";

  return (
    <FadeSlide delay={index * 70}>
      <View style={styles.recordCard}>
        <LinearGradient
          colors={isFree ? ["#F48024", "#E8690A"] : [Colors.primary, Colors.primaryLight]}
          start={[0, 0]} end={[1, 0]}
          style={styles.recordChipBar}
        >
          <MaterialCommunityIcons name="gavel" size={12} color="#fff" />
          <Text style={styles.recordChipText}>RECORD {recordNumber}</Text>
        </LinearGradient>

        {/* Date panels */}
        <View style={styles.recordDatesRow}>
          <View style={styles.recordDateBox}>
            <View style={[styles.recordDateIconCircle, { backgroundColor: "#E3F2FD" }]}>
              <MaterialCommunityIcons name="calendar-start" size={16} color={Colors.accentBlue} />
            </View>
            <Text style={styles.recordDateLabel}>Auction Date</Text>
            <Text style={styles.recordDateValue}>{formatDate(record.auction_date)}</Text>
          </View>
          <View style={styles.recordDateDivider} />
          <View style={styles.recordDateBox}>
            <View style={[styles.recordDateIconCircle, { backgroundColor: "#E8F5E9" }]}>
              <MaterialCommunityIcons name="calendar-end" size={16} color={Colors.successGreen} />
            </View>
            <Text style={styles.recordDateLabel}>Next Date</Text>
            <Text style={styles.recordDateValue}>{formatDate(record.next_date)}</Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.recordInfoSection}>
          <View style={styles.recordInfoRow}>
            <Text style={styles.recordInfoLabel}>Auction Type</Text>
            <View style={[styles.recordTypePill, { backgroundColor: lightBg }]}>
              <Text style={[styles.recordTypePillText, { color: accentColor }]}>{typeLabel}</Text>
            </View>
          </View>
          <View style={styles.recordInfoDivider} />
          <View style={styles.recordInfoRow}>
            <Text style={styles.recordInfoLabel}>Bid Percentage</Text>
            <Text style={styles.recordInfoValue}>{record.bid_percentage || "0"}%</Text>
          </View>
        </View>

        {/* Metrics row — styled like Home pay button row */}
        <View style={styles.recordMetricsRow}>
          <View style={[styles.recordMetricBox, { backgroundColor: Colors.dataPanelBg }]}>
            <View style={styles.recordMetricIconCircle}>
              <MaterialCommunityIcons name="ticket-confirmation" size={16} color={Colors.textMedium} />
            </View>
            <Text style={styles.recordMetricLabel}>Winning Ticket</Text>
            <Text style={styles.recordMetricValue}>{record.ticket || "N/A"}</Text>
          </View>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={[0, 0]} end={[1, 0]}
            style={styles.recordMetricBoxHighlight}
          >
            <View style={[styles.recordMetricIconCircle, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <MaterialIcons name="currency-rupee" size={16} color="#fff" />
            </View>
            <Text style={styles.recordMetricLabelLight}>Bid Amount</Text>
            <Text style={styles.recordMetricValueGold}>₹ {formatNumberIndianStyle(record.bid_amount)}</Text>
          </LinearGradient>
        </View>
      </View>
    </FadeSlide>
  );
};

// ─── AuctionRecordsView ────────────────────────────────────────────────────────
const AuctionRecordsView = ({
  records, onBack, isLoading, error, commencementData,
  onCommencementPress, selectedGroupName, selectedGroupValue, selectedTicket, isPrized,
}) => {
  if (isLoading) return <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />;

  const hasCommencement = !!(commencementData && (commencementData.group_name || commencementData.commencement_date));
  const totalRecords = records.length + (hasCommencement ? 1 : 0);
  const normalCount = records.filter(r => (r.auction_type || "").toLowerCase() === "normal").length;
  const freeCount = records.filter(r => (r.auction_type || "").toLowerCase() === "free").length;
  const commencementCount = hasCommencement ? 1 : 0;

  return (
    <View style={styles.recordsContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <View style={[styles.cardBtnIconCircle, { backgroundColor: Colors.backgroundLight }]}>
          <MaterialIcons name="arrow-back" size={18} color={Colors.primary} />
        </View>
        <Text style={styles.backBtnText}>Back to Groups</Text>
      </TouchableOpacity>

      {records.length === 0 && !hasCommencement ? (
        <View style={styles.noDataContainer}>
          <Image source={NoRecordFoundImage} style={styles.noDataImage} resizeMode="contain" />
          <Text style={styles.noDataText}>{error || "No auction records found."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.recordsScrollContent} showsVerticalScrollIndicator={false}>
          <SummaryCard
            groupName={selectedGroupName}
            groupValue={selectedGroupValue}
            totalRecords={totalRecords}
            normalCount={normalCount}
            freeCount={freeCount}
            commencementCount={commencementCount}
            selectedTicket={selectedTicket}
            isPrized={isPrized}
          />

          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelLine} />
            <Text style={styles.sectionLabelText}>Auction Records</Text>
            <View style={styles.sectionLabelLine} />
          </View>

          {records.map((record, index) => (
            <AuctionRecordCard
              key={record._id || `rec-${index}`}
              record={record}
              recordNumber={totalRecords - index}
              index={index}
            />
          ))}

          {hasCommencement && (
            <CommencementRecordCard
              groupName={commencementData.group_name}
              firstAuctionDate={commencementData.commencement_date}
              onPress={onCommencementPress}
            />
          )}

          {records.length === 0 && hasCommencement && (
            <View style={styles.noDataPlaceholder}>
              <View style={[styles.cardIconCircle, { backgroundColor: "#E3F2FD", alignSelf: "center", marginBottom: 10 }]}>
                <MaterialCommunityIcons name="information-outline" size={24} color={Colors.primaryLight} />
              </View>
              <Text style={styles.noDataPlaceholderText}>
                This group's auctions have not started yet. See the commencement card above for details.
              </Text>
            </View>
          )}
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
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
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
    } catch (e) {
      console.error("fetchEnrollments error:", e.message);
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchAuctionDetails = useCallback(async (groupId, groupName) => {
    if (!groupId) return;
    setAuctionData(prev => ({ ...prev, loading: true, error: null, records: [] }));
    try {
      const res = await axios.get(`${url}/auction/group/${groupId}`);
      if (res.status === 200) {
        const records = res.data || [];
        const first = records.length > 0 ? records[0] : null;
        setCommencementAuctionData({
          group_name: first?.group_id?.group_name || groupName || "Selected Group",
          commencement_date: first?.auction_date || null,
        });
        setAuctionData(prev => ({ ...prev, records: records.slice().reverse() }));
      }
    } catch (e) {
      setAuctionData(prev => ({
        ...prev,
        error: "No auction records found. Auction may not have started yet.",
      }));
      setCommencementAuctionData({ group_name: groupName || "Selected Group", commencement_date: null });
    } finally {
      setAuctionData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchEnrollments();
    setIsShowingRecords(false);
    setAuctionData({
      records: [], loading: false, error: null,
      selectedGroupId: null, highlightedCardId: null,
      selectedGroupName: "", selectedGroupValue: null, selectedTicket: null,
    });
  }, [fetchEnrollments]));

  const handleViewDetails = (enrollmentId, groupId, ticket, groupName, groupValue) => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAuctionData(prev => ({
      ...prev,
      selectedGroupId: groupId,
      highlightedCardId: enrollmentId,
      selectedGroupName: groupName,
      selectedGroupValue: groupValue,
      selectedTicket: ticket,
    }));
    setIsShowingRecords(true);
    fetchAuctionDetails(groupId, groupName);
  };

  const handleBack = () => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsShowingRecords(false);
    setAuctionData(prev => ({
      ...prev, records: [], selectedGroupName: "", selectedGroupValue: null, selectedTicket: null,
    }));
  };

  const handleBidRequest = useCallback((card) => {
    const nextAuctionDate = card.next_auction_date || card.nextAuctionDate || null;
    if (!nextAuctionDate) {
      Alert.alert("Auction Not Scheduled", "Next auction date is not available.");
      return;
    }
    const now = new Date();
    const auctionDate = new Date(nextAuctionDate);
    const diffHours = (auctionDate - now) / (1000 * 60 * 60);
    if (diffHours > 48) {
      Alert.alert(
        "Bid Request Not Open",
        `Right now you can't raise a request.\n\nBid request opens 48 hours before auction.\n\nNext Auction Date: ${formatDate(nextAuctionDate)}`
      );
      return;
    }
    navigation.navigate("BidRequest", {
      userId,
      selectedGroupId: card.group_id?._id,
      selectedEnrollmentId: card._id,
      preselectedGroup: {
        group_id: card.group_id,
        tickets: card.ticket,
        _id: card._id,
        group_name: card.group_id?.group_name,
      },
    });
  }, [navigation, userId]);

  const handlePrizedInfo = useCallback((card) => {
    Vibration.vibrate(50);
    navigation.navigate("PrizedScreen", {
      userId,
      groupId: card.group_id?._id,
      ticket: card.ticket,
    });
  }, [navigation, userId]);

  const handleCommencementPress = () => {
    Vibration.vibrate(50);
    if (!commencementAuctionData?.commencement_date) {
      Alert.alert(
        "Auction Not Started",
        `The first auction date for ${commencementAuctionData?.group_name} has not been set yet.`
      );
    }
  };

  const isCardPrized = (card) => {
    const val = card.isPrized;
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.toLowerCase() === "true";
    return false;
  };

  const validCards = enrollments.filter(c => c.group_id && c.group_id._id);

  const filteredCards = validCards.filter(card => {
    const isPrized = isCardPrized(card);
    if (filter === "PRIZED") return isPrized;
    if (filter === "ACTIVE") return !isPrized;
    return true;
  });

  const prizedCount = validCards.filter(c => isCardPrized(c)).length;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBox}>
        <View style={styles.innerBox}>
          {!isShowingRecords ? (
            <>
              <View style={styles.sectionTitleWrapper}>
                <Text style={styles.sectionTitleText}>Auctions</Text>
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
              ) : validCards.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Image source={NoGroupImage} style={styles.noDataImage} resizeMode="contain" />
                  <Text style={styles.noDataText}>No groups found for this user.</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.groupListContent} showsVerticalScrollIndicator={false}>
                  {/* FIXED: Passing filter and setFilter as props here */}
                  <AuctionBanner
                    userName={userName}
                    totalGroups={validCards.length}
                    prizedCount={prizedCount}
                    filter={filter}
                    setFilter={setFilter}
                  />

                  {/* REMOVED DUPLICATE quickActionsBar block from here to prevent UI duplication */}

                  <View style={styles.groupsLabelRow}>
                    <MaterialCommunityIcons name="layers-outline" size={14} color={Colors.textLight} />
                    <Text style={styles.groupsLabelText}>YOUR ENROLLED GROUPS</Text>
                  </View>

                  {filteredCards.length > 0 ? (
                    filteredCards.map((card, index) => (
                      <GroupCard
                        key={card._id}
                        card={card}
                        index={index}
                        onSelect={handleViewDetails}
                        isHighlighted={auctionData.highlightedCardId === card._id}
                        isPrized={isCardPrized(card)}
                        onBidRequest={() => handleBidRequest(card)}
                        onPrizedInfo={() => handlePrizedInfo(card)}
                      />
                    ))
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No records found for this filter.</Text>
                    </View>
                  )}

                  <View style={styles.footerNote}>
                    <MaterialIcons name="verified-user" size={14} color={Colors.primary} />
                    <Text style={styles.footerNoteText}>
                      All auctions are fully compliant with the Chit Fund Act 1982
                    </Text>
                  </View>
                </ScrollView>
              )}
            </>
          ) : (
            <AuctionRecordsView
              records={auctionData.records}
              onBack={handleBack}
              isLoading={auctionData.loading}
              error={auctionData.error}
              commencementData={commencementAuctionData}
              onCommencementPress={handleCommencementPress}
              selectedGroupName={auctionData.selectedGroupName}
              selectedGroupValue={auctionData.selectedGroupValue}
              selectedTicket={auctionData.selectedTicket}
              isPrized={!!isCardPrized(
                validCards.find(c => c.group_id?._id === auctionData.selectedGroupId) || {}
              )}
            />
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
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  innerBox: { flex: 1, paddingHorizontal: 14, paddingTop: 0, paddingBottom: 10 },

  sectionTitleWrapper: {
    position: "relative",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: "#d9dbb6ff",
    width: 220,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    zIndex: 1,
  },
  sectionTitleText: {
    color: Colors.primary,
    fontWeight: "900",
    fontSize: 20,
    textTransform: "capitalize",
  },

  bannerCard: {
    backgroundColor: Colors.skyBlue,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  bannerGreeting: { fontSize: 13, fontWeight: "500", color: Colors.primary, opacity: 0.75, marginBottom: 2 },
  bannerName: { fontSize: 15, fontWeight: "bold", color: Colors.primary },
  bannerSub: { fontSize: 12, color: Colors.primaryLight, marginTop: 3 },
  bannerIconCircle: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    elevation: 2,
  },
  bannerStatsRow: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 12, paddingVertical: 10,
    elevation: 2, shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  bannerStatBox: { flex: 1, alignItems: "center" },
  bannerStatValue: { fontSize: 20, fontWeight: "900", color: Colors.primary },
  bannerStatLabel: { fontSize: 11, color: Colors.textMedium, marginTop: 2 },
  bannerStatDivider: { width: 1, backgroundColor: Colors.border },

  quickActionsBar: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  quickActionItem: { alignItems: "center", width: "30%" },
  selectedFilter: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  quickActionIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  quickActionText: { fontSize: 9, color: "#fff", textAlign: "center", fontWeight: "700" },

  groupsLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingHorizontal: 2 },
  groupsLabelText: {
    fontSize: 9, fontWeight: "700", color: Colors.textLight,
    letterSpacing: 1.6, textTransform: "uppercase",
  },

  groupCard: {
    backgroundColor: Colors.card,
    borderRadius: 18, marginBottom: 14, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  groupCardPrized: { borderColor: Colors.gold, borderWidth: 1.5 },
  groupCardHighlighted: { borderColor: Colors.primaryLight, borderWidth: 2 },
  cardTopStripe: { height: 5, width: "100%" },
  cardBody: { padding: 14 },

  cardHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  cardGroupName: { fontSize: 14, fontWeight: "800", color: Colors.textDark, letterSpacing: 0.1 },
  ticketPill: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4,
    backgroundColor: "#E3F2FD", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start",
  },
  ticketPillText: { fontSize: 11, fontWeight: "700", color: Colors.primary },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, alignSelf: "flex-start",
  },
  statusBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },

  cardValueSection: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.dataPanelBg, borderRadius: 10,
    padding: 10, marginBottom: 12,
  },
  cardValueBox: { flex: 1 },
  cardValueLabel: { fontSize: 9, fontWeight: "700", color: Colors.textLight, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 2 },
  cardValueAmount: { fontSize: 22, fontWeight: "900", color: Colors.primary, letterSpacing: -0.5 },
  cardDateBox: { flexDirection: "row", alignItems: "center" },
  cardDateLabel: { fontSize: 9, color: Colors.textLight, letterSpacing: 0.5 },
  cardDateValue: { fontSize: 11, fontWeight: "700", color: Colors.textDark },

  cardActionsRow: { flexDirection: "row", gap: 8 },
  cardBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 12, gap: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  cardBtnBid: { backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#C8E6C9" },
  cardBtnPrized: { backgroundColor: "#FFF8DC", borderWidth: 1, borderColor: "#FFE082" },
  cardBtnDetails: { backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#BBDEFB" },
  cardBtnIconCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  cardBtnTitle: { fontSize: 11, fontWeight: "bold" },
  cardBtnSub: { fontSize: 8, color: Colors.textLight, marginTop: 1 },

  summaryCard: {
    backgroundColor: Colors.card, borderRadius: 18, marginBottom: 14, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#0E7C5B", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  summaryGradientHeader: { paddingVertical: 18, paddingHorizontal: 16, overflow: "hidden", minHeight: 130 },
  summaryStripe1: { position: "absolute", width: 160, height: 160, backgroundColor: "rgba(255,255,255,0.04)", transform: [{ rotate: "35deg" }], top: -70, right: -30 },
  summaryStripe2: { position: "absolute", width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.03)", transform: [{ rotate: "35deg" }], bottom: -30, left: 40 },
  summaryHeaderTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  summaryEyebrow: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.55)", letterSpacing: 1.6, textTransform: "uppercase" },
  summaryPrizedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  summaryPrizedText: { fontSize: 9, fontWeight: "900", color: "#7B0D1E", letterSpacing: 0.9 },
  summaryGroupName: { fontSize: 20, fontWeight: "900", color: Colors.card, letterSpacing: 0.1, marginTop: 6 },
  summaryTicketText: { fontSize: 12, fontWeight: "500", color: "rgba(255,255,255,0.7)" },
  summaryTicketNum: { fontSize: 14, fontWeight: "900", color: Colors.card },
  summaryGroupValue: { fontSize: 26, fontWeight: "900", color: "#7FFFD4", letterSpacing: -0.5, marginTop: 6 },

  summaryStatsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingVertical: 8, paddingHorizontal: 4,
  },
  summaryStatBox: {
    width: "50%", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderRightWidth: 1, borderColor: Colors.lightDivider,
  },
  summaryStatValue: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  summaryStatLabel: { fontSize: 11, color: Colors.textMedium, marginTop: 3, textAlign: "center" },

  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 12 },
  sectionLabelLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  sectionLabelText: { fontSize: 9, fontWeight: "700", color: Colors.textLight, letterSpacing: 1.6, textTransform: "uppercase" },

  recordCard: {
    backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  recordChipBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 7, paddingHorizontal: 14,
  },
  recordChipText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.9 },
  recordDatesRow: { flexDirection: "row", backgroundColor: Colors.dataPanelBg, borderBottomWidth: 1, borderColor: Colors.lightDivider },
  recordDateBox: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  recordDateIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  recordDateDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 12 },
  recordDateLabel: { fontSize: 9, fontWeight: "600", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 1 },
  recordDateValue: { fontSize: 13, fontWeight: "800", color: Colors.textDark },
  recordInfoSection: { paddingHorizontal: 14, paddingVertical: 2 },
  recordInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  recordInfoDivider: { height: 1, backgroundColor: Colors.lightDivider },
  recordInfoLabel: { fontSize: 13, fontWeight: "500", color: Colors.textMedium },
  recordInfoValue: { fontSize: 13, fontWeight: "700", color: Colors.textDark },
  recordTypePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  recordTypePillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  recordMetricsRow: { flexDirection: "row" },
  recordMetricBox: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  recordMetricBoxHighlight: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  recordMetricIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  recordMetricLabel: { fontSize: 9, fontWeight: "700", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 1 },
  recordMetricLabelLight: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1 },
  recordMetricValue: { fontSize: 16, fontWeight: "900", color: Colors.textDark },
  recordMetricValueGold: { fontSize: 16, fontWeight: "900", color: Colors.gold },

  recordsContainer: { flex: 1 },
  recordsScrollContent: { paddingBottom: 30 },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 12, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  backBtnText: { fontSize: 13, fontWeight: "700", color: Colors.primary },

  footerNote: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, marginTop: 4,
  },
  footerNoteText: { fontSize: 11, color: Colors.textMedium, fontStyle: "italic" },

  noDataContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 50 },
  noDataImage: { width: 150, height: 140, marginBottom: 14 },
  noDataText: { fontSize: 14, fontWeight: "600", color: Colors.textMedium, textAlign: "center" },
  noDataPlaceholder: {
    alignItems: "center", padding: 18, backgroundColor: Colors.dataPanelBg,
    borderRadius: 14, marginTop: 4, borderWidth: 1, borderColor: Colors.border,
  },
  noDataPlaceholderText: { textAlign: "center", marginTop: 6, fontSize: 12, color: Colors.textMedium, lineHeight: 18 },

  groupListContent: { paddingBottom: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
});

export default AuctionList;
