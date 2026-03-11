import React, { useState, useCallback, useContext, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, StatusBar, Image, Platform, Vibration,
  LayoutAnimation, NativeModules, Dimensions, Alert, Animated, Easing,
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

if (Platform.OS === "android" && NativeModules.UIManager) {
  NativeModules.UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const Colors = {
  primary: "#053B90",
  primaryLight: "#1F55A4",
  backgroundLight: "#F0F4FA",
  card: "#FFFFFF",
  textDark: "#1A1A2E",
  textMedium: "#6B7280",
  textLight: "#9CA3AF",
  accentOrange: "#F48024",
  accentBlue: "#3F51B5",
  successGreen: "#10B981",
  gold: "#F5C518",
  goldDark: "#D4A017",
  error: "#EF4444",
  border: "#E5E7EB",
  lightDivider: "#F3F4F6",
  deepBlue: "#020E2C",
  dataPanelBg: "#F8FAFC",
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
  } catch (e) {}
  return "N/A";
};

const calcCommencementDate = (ds) => {
  if (!ds) return "";
  try {
    const d = new Date(ds);
    if (!isNaN(d.getTime())) { d.setDate(d.getDate() - 10); return d.toISOString().split("T")[0]; }
  } catch (e) {}
  return "";
};

// ─── Fade-Slide entrance ──────────────────────────────────────────────────────
const FadeSlide = ({ children, delay = 0 }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 360, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, delay, easing: Easing.out(Easing.exp), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>{children}</Animated.View>;
};

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
    <TouchableOpacity
      style={[styles.recordCard, styles.commencementCard, isClose && styles.commencementCardClose, isPassed && styles.commencementCardPassed]}
      onPress={onPress} activeOpacity={0.8}
    >
      <View style={[styles.chipRow, { backgroundColor: Colors.accentOrange }]}>
        <MaterialCommunityIcons name="rocket-launch" size={12} color={Colors.card} />
        <Text style={styles.chipText}>RECORD 1 · COMMENCEMENT</Text>
      </View>
      <View style={styles.datePanelRow}>
        <View style={styles.datePanel}>
          <MaterialCommunityIcons name="calendar-start" size={17} color={Colors.accentBlue} />
          <Text style={styles.datePanelLabel}>commencement date</Text>
          <Text style={[styles.datePanelValue, { color: Colors.primary }]}>
            {firstAuctionDate ? formatDate(commencementStr) : "Not Set"}
          </Text>
        </View>
        <View style={styles.datePanelDivider} />
        <View style={styles.datePanel}>
          <MaterialCommunityIcons name="calendar-end" size={17} color={Colors.accentBlue} />
          <Text style={styles.datePanelLabel}>next auction date</Text>
          <Text style={styles.datePanelValue}>{firstAuctionDate ? formatDate(firstAuctionDate) : "N/A"}</Text>
        </View>
      </View>
      <View style={styles.infoBlock}>
        <View style={styles.infoRowBlock}>
          <Text style={styles.infoRowLabel}>Auction Type</Text>
          <Text style={[styles.infoRowValue, { color: Colors.accentOrange, fontWeight: "800" }]}>COMMENCEMENT</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── GroupCard ────────────────────────────────────────────────────────────────
const GroupCard = ({ card, onSelect, isHighlighted, onBidRequest, index }) => {
  const { group_id, tickets, _id } = card;
  const { group_name, group_value, auction_type } = group_id || {};
  const safeType = auction_type || "";
  const formattedType = safeType ? safeType.charAt(0).toUpperCase() + safeType.slice(1) : "";
  const isFree = safeType.toLowerCase() === "free";

  return (
    <FadeSlide delay={index * 80}>
      <View style={[styles.groupCard, isHighlighted && styles.groupCardHighlighted]}>
        {/* Header */}
        <LinearGradient colors={[Colors.deepBlue, Colors.primary]} start={[0, 0]} end={[1, 1]} style={styles.groupCardHeader}>
          <View style={styles.groupCardHeaderRow}>
            <Text style={styles.groupCardName} numberOfLines={1}>{group_name || "—"}</Text>
            {formattedType ? (
              <View style={[styles.typeTag, isFree && styles.typeTagFree]}>
                <Text style={[styles.typeTagText, isFree && { color: Colors.accentOrange }]}>{formattedType}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        {/* Value row */}
        <View style={styles.groupCardValueRow}>
          <Text style={styles.groupCardValueLabel}>group value</Text>
          <Text style={styles.groupCardValue}>₹ {formatNumberIndianStyle(group_value)}</Text>
        </View>

        <View style={styles.cardDivider} />

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onSelect(_id, group_id?._id, tickets, group_name, group_value)} activeOpacity={0.8}>
            <View style={styles.actionIconWrap}><MaterialIcons name="list-alt" size={24} color={Colors.primary} /></View>
            <Text style={styles.actionBtnLabel}>View Auctions</Text>
          </TouchableOpacity>
          <View style={styles.actionSep} />
          <TouchableOpacity style={styles.actionBtn} onPress={onBidRequest} activeOpacity={0.8}>
            <View style={styles.actionIconWrap}><MaterialCommunityIcons name="handshake" size={24} color={Colors.primary} /></View>
            <Text style={styles.actionBtnLabel}>Bid Request</Text>
          </TouchableOpacity>
          <View style={styles.actionSep} />
          <TouchableOpacity style={styles.actionBtn} onPress={() => onSelect(_id, group_id?._id, tickets, group_name, group_value)} activeOpacity={0.8}>
            <View style={styles.actionIconWrap}><MaterialIcons name="timeline" size={24} color={Colors.primary} /></View>
            <Text style={styles.actionBtnLabel}>Auction Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeSlide>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const StatRow = ({ label, value, valueColor, isFirst }) => (
  <>
    {!isFirst && <View style={styles.statDivider} />}
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  </>
);

const SummaryCard = ({ groupName, groupValue, totalRecords, normalCount, freeCount, commencementCount }) => (
  <FadeSlide delay={0}>
    <View style={styles.summaryCard}>
      <LinearGradient colors={[Colors.deepBlue, Colors.primary]} start={[0, 0]} end={[1, 1]} style={styles.summaryCardHeader}>
        <View style={styles.summaryHeaderDecor1} />
        <View style={styles.summaryHeaderDecor2} />
        <View style={styles.summaryHeaderInner}>
          <MaterialCommunityIcons name="trophy-outline" size={20} color={Colors.gold} style={{ marginRight: 8 }} />
          <Text style={styles.summaryGroupName} numberOfLines={1}>{groupName}</Text>
        </View>
        <Text style={styles.summaryGroupValue}>{groupValue ? `₹ ${formatNumberIndianStyle(groupValue)}` : ""}</Text>
      </LinearGradient>
      <View style={styles.summaryStatsBlock}>
        <StatRow label="Total Records"   value={totalRecords}      valueColor={Colors.textDark}    isFirst />
        <StatRow label="Auction Normal"  value={normalCount}       valueColor={Colors.primary} />
        <StatRow label="Auction Free"    value={freeCount}         valueColor={Colors.accentOrange} />
        <StatRow label="Commencement"    value={commencementCount} valueColor={Colors.accentBlue} />
      </View>
    </View>
  </FadeSlide>
);

// ─── Auction Record Card ───────────────────────────────────────────────────────
const AuctionRecordCard = ({ record, recordNumber, index }) => {
  const isFree = record.auction_type?.toLowerCase() === "free";
  const typeLabel = record.auction_type ? record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1) : "Normal";
  return (
    <FadeSlide delay={index * 70}>
      <View style={styles.recordCard}>
        <View style={styles.chipRow}>
          <MaterialCommunityIcons name="gavel" size={12} color={Colors.card} />
          <Text style={styles.chipText}>RECORD {recordNumber}</Text>
        </View>
        <View style={styles.datePanelRow}>
          <View style={styles.datePanel}>
            <MaterialCommunityIcons name="calendar-start" size={17} color={Colors.accentBlue} />
            <Text style={styles.datePanelLabel}>auction date</Text>
            <Text style={styles.datePanelValue}>{formatDate(record.auction_date)}</Text>
          </View>
          <View style={styles.datePanelDivider} />
          <View style={styles.datePanel}>
            <MaterialCommunityIcons name="calendar-end" size={17} color={Colors.accentBlue} />
            <Text style={styles.datePanelLabel}>next date</Text>
            <Text style={styles.datePanelValue}>{formatDate(record.next_date)}</Text>
          </View>
        </View>
        <View style={styles.infoBlock}>
          <View style={styles.infoRowBlock}>
            <Text style={styles.infoRowLabel}>Auction Type</Text>
            <Text style={[styles.infoRowValue, { color: isFree ? Colors.accentOrange : Colors.textDark }]}>{typeLabel}</Text>
          </View>
          <View style={styles.infoBlockDivider} />
          <View style={styles.infoRowBlock}>
            <Text style={styles.infoRowLabel}>Bid Percentage</Text>
            <Text style={styles.infoRowValue}>{record.bid_percentage || "0"}%</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>winning ticket</Text>
            <Text style={styles.metricValueDark}>{record.ticket || "N/A"}</Text>
          </View>
          <LinearGradient colors={[Colors.primary, Colors.primaryLight]} start={[0, 0]} end={[1, 0]} style={styles.metricBoxHighlight}>
            <Text style={styles.metricLabelLight}>bid amount</Text>
            <Text style={styles.metricValueGold}>₹ {formatNumberIndianStyle(record.bid_amount)}</Text>
          </LinearGradient>
        </View>
      </View>
    </FadeSlide>
  );
};

// ─── AuctionRecordsView ────────────────────────────────────────────────────────
const AuctionRecordsView = ({ records, onBack, isLoading, error, commencementData, onCommencementPress, selectedGroupName, selectedGroupValue }) => {
  if (isLoading) return <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />;

  const hasCommencement = !!(commencementData && (commencementData.group_name || commencementData.commencement_date));
  const totalRecords  = records.length + (hasCommencement ? 1 : 0);
  const normalCount   = records.filter(r => (r.auction_type || "").toLowerCase() === "normal").length;
  const freeCount     = records.filter(r => (r.auction_type || "").toLowerCase() === "free").length;
  const commencementCount = hasCommencement ? 1 : 0;

  return (
    <View style={styles.recordsContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
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
          />

          <Text style={styles.sectionDividerLabel}>Auction Records</Text>

          {records.map((record, index) => (
            <AuctionRecordCard key={record._id || `rec-${index}`} record={record} recordNumber={totalRecords - index} index={index} />
          ))}

          {hasCommencement && (
            <CommencementRecordCard groupName={commencementData.group_name} firstAuctionDate={commencementData.commencement_date} onPress={onCommencementPress} />
          )}

          {records.length === 0 && hasCommencement && (
            <View style={styles.noDataPlaceholder}>
              <MaterialCommunityIcons name="information-outline" size={24} color={Colors.primaryLight} />
              <Text style={styles.noDataPlaceholderText}>This group's auctions have not started yet. See the commencement card above for details.</Text>
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
  const [userTickets, setUserTickets] = useState([]);
  const [isShowingRecords, setIsShowingRecords] = useState(false);
  const [auctionData, setAuctionData] = useState({
    records: [], loading: false, error: null,
    selectedGroupId: null, highlightedCardId: null,
    selectedGroupName: "", selectedGroupValue: null,
  });
  const [commencementAuctionData, setCommencementAuctionData] = useState(null);

  const fetchUserTickets = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await axios.post(`${url}/enroll/get-user-tickets/${userId}`);
      if (res.status === 200) setUserTickets(res.data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
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
      setAuctionData(prev => ({ ...prev, error: "No auction records found. Auction may not have started yet." }));
      setCommencementAuctionData({ group_name: groupName || "Selected Group", commencement_date: null });
    } finally {
      setAuctionData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchUserTickets();
    setIsShowingRecords(false);
    setAuctionData({ records: [], loading: false, error: null, selectedGroupId: null, highlightedCardId: null, selectedGroupName: "", selectedGroupValue: null });
  }, [fetchUserTickets]));

  const handleViewDetails = (enrollmentId, groupId, tickets, groupName, groupValue) => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAuctionData(prev => ({ ...prev, selectedGroupId: groupId, highlightedCardId: enrollmentId, selectedGroupName: groupName, selectedGroupValue: groupValue }));
    setIsShowingRecords(true);
    fetchAuctionDetails(groupId, groupName);
  };

  const handleBack = () => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsShowingRecords(false);
    setAuctionData(prev => ({ ...prev, records: [], selectedGroupName: "", selectedGroupValue: null }));
  };

  const handleBidRequest = useCallback((card) => {
    navigation.navigate("BidRequest", {
      userId,
      selectedGroupId: card.group_id?._id,
      selectedEnrollmentId: card._id,
      preselectedGroup: { group_id: card.group_id, tickets: card.tickets, _id: card._id, group_name: card.group_id?.group_name },
    });
  }, [navigation, userId]);

  const handleCommencementPress = () => {
    Vibration.vibrate(50);
    if (!commencementAuctionData?.commencement_date) {
      Alert.alert("Auction Not Started", `The first auction date for ${commencementAuctionData?.group_name} has not been set yet.`);
    }
  };

  const filteredCards = userTickets.filter(c => c.group_id !== null);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBox}>
        <View style={styles.innerBox}>
          {!isShowingRecords ? (
            <>
              {/* Page header */}
              <View style={styles.pageHeaderRow}>
                <View>
                  <Text style={styles.pageEyebrow}>auction activities</Text>
                  <Text style={styles.pageTitle}>Auctions</Text>
                </View>
                <MaterialCommunityIcons name="gavel" size={34} color={Colors.primary} style={{ opacity: 0.85 }} />
              </View>
              <Text style={styles.pageSubtitle}>Explore all your auction activities, past and present, right here.</Text>

              {/* Prized Groups banner */}
              <TouchableOpacity style={styles.prizedBanner} onPress={() => navigation.navigate("PrizedScreen")} activeOpacity={0.88}>
                <LinearGradient colors={[Colors.deepBlue, Colors.primary]} start={[0, 0]} end={[1, 1]} style={styles.prizedBannerGradient}>
                  <View style={styles.prizedBannerDecor} />
                  <MaterialCommunityIcons name="trophy" size={20} color={Colors.gold} />
                  <Text style={styles.prizedBannerText}>VIEW YOUR PRIZED GROUPS</Text>
                  <MaterialIcons name="chevron-right" size={20} color={Colors.card} />
                </LinearGradient>
              </TouchableOpacity>

              {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
              ) : filteredCards.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Image source={NoGroupImage} style={styles.noDataImage} resizeMode="contain" />
                  <Text style={styles.noDataText}>No groups found for this user.</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.groupListContent} showsVerticalScrollIndicator={false}>
                  {filteredCards.map((card, index) => (
                    <GroupCard
                      key={card._id} card={card} index={index}
                      onSelect={handleViewDetails}
                      isHighlighted={auctionData.highlightedCardId === card._id}
                      onBidRequest={() => handleBidRequest(card)}
                    />
                  ))}
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
    marginHorizontal: 12, marginBottom: 50, borderRadius: 30, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  innerBox: { flex: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },

  // Page header
  pageHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  pageEyebrow: { fontSize: 9, fontWeight: "700", color: Colors.textLight, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 2 },
  pageTitle: { fontSize: 26, fontWeight: "900", color: Colors.primary, letterSpacing: -0.4 },
  pageSubtitle: { fontSize: 13, color: Colors.textMedium, marginBottom: 16, lineHeight: 20 },

  // Prized banner
  prizedBanner: {
    marginBottom: 16, borderRadius: 14, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.22, shadowRadius: 10 },
      android: { elevation: 7 },
    }),
  },
  prizedBannerGradient: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, overflow: "hidden" },
  prizedBannerDecor: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.04)", top: -25, right: 30 },
  prizedBannerText: { flex: 1, fontSize: 13, fontWeight: "800", color: Colors.card, marginLeft: 12, letterSpacing: 0.5 },

  // ─── GROUP CARD (LARGER) ───────────────────────────────────────────────────
  groupCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.13, shadowRadius: 14 },
      android: { elevation: 9 },
    }),
  },
  groupCardHighlighted: { borderWidth: 2, borderColor: Colors.gold },

  groupCardHeader: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  groupCardHeaderRow: { flexDirection: "row", alignItems: "center" },

  groupCardName: {
    flex: 1,
    fontSize: 19,
    fontWeight: "800",
    color: Colors.card,
    letterSpacing: 0.2,
  },

  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.card,
    marginLeft: 10,
  },
  typeTagFree: { backgroundColor: "#FFF4E6" },
  typeTagText: { fontSize: 12, fontWeight: "700", color: Colors.textDark },

  groupCardValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  groupCardValueLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textLight,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  groupCardValue: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: -0.4,
  },

  cardDivider: { height: 1, backgroundColor: Colors.lightDivider },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dataPanelBg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textDark,
    textAlign: "center",
  },
  actionSep: { width: 1, height: 42, backgroundColor: Colors.border },

  // Summary card
  summaryCard: {
    backgroundColor: Colors.card, borderRadius: 16, marginBottom: 14, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  summaryCardHeader: { paddingVertical: 14, paddingHorizontal: 16, overflow: "hidden" },
  summaryHeaderDecor1: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.04)", top: -25, right: 10 },
  summaryHeaderDecor2: { position: "absolute", width: 55, height: 55, borderRadius: 28, backgroundColor: "rgba(245,197,24,0.07)", bottom: -8, left: 70 },
  summaryHeaderInner: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  summaryGroupName: { flex: 1, fontSize: 14, fontWeight: "800", color: Colors.card, textTransform: "uppercase", letterSpacing: 0.4 },
  summaryGroupValue: { fontSize: 22, fontWeight: "900", color: Colors.gold, letterSpacing: -0.4 },
  summaryStatsBlock: { backgroundColor: Colors.dataPanelBg },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 11 },
  statDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 18 },
  statLabel: { fontSize: 13, fontWeight: "600", color: Colors.textDark },
  statValue: { fontSize: 17, fontWeight: "900" },

  sectionDividerLabel: { fontSize: 9, fontWeight: "700", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 1.6, textAlign: "center", marginBottom: 12 },

  // Record card
  recordCard: {
    backgroundColor: Colors.card, borderRadius: 14, marginBottom: 12, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 9 },
      android: { elevation: 6 },
    }),
  },
  commencementCard: { borderWidth: 1, borderColor: Colors.accentOrange },
  commencementCardClose: { borderColor: Colors.error, backgroundColor: "#FFF8F8" },
  commencementCardPassed: { opacity: 0.72, borderColor: Colors.textLight },

  chipRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: Colors.primary, paddingVertical: 5, paddingHorizontal: 11, borderBottomRightRadius: 11 },
  chipText: { marginLeft: 5, fontSize: 9, fontWeight: "800", color: Colors.card, letterSpacing: 0.9 },

  datePanelRow: { flexDirection: "row", backgroundColor: Colors.dataPanelBg, borderBottomWidth: 1, borderColor: Colors.lightDivider },
  datePanel: { flex: 1, alignItems: "center", paddingVertical: 12 },
  datePanelDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },
  datePanelLabel: { fontSize: 9, fontWeight: "600", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 1.1, marginTop: 4 },
  datePanelValue: { fontSize: 13, fontWeight: "800", color: Colors.primary, marginTop: 3 },

  infoBlock: { paddingHorizontal: 14, paddingVertical: 2, backgroundColor: Colors.card },
  infoRowBlock: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9 },
  infoBlockDivider: { height: 1, backgroundColor: Colors.lightDivider },
  infoRowLabel: { fontSize: 13, fontWeight: "500", color: Colors.textMedium },
  infoRowValue: { fontSize: 13, fontWeight: "700", color: Colors.textDark },

  metricsRow: { flexDirection: "row" },
  metricBox: { flex: 1, alignItems: "center", paddingVertical: 12, backgroundColor: Colors.dataPanelBg },
  metricBoxHighlight: { flex: 1, alignItems: "center", paddingVertical: 12 },
  metricLabel: { fontSize: 9, fontWeight: "700", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  metricLabelLight: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  metricValueDark: { fontSize: 14, fontWeight: "900", color: Colors.textDark },
  metricValueGold: { fontSize: 14, fontWeight: "900", color: Colors.gold },

  // Records view
  recordsContainer: { flex: 1 },
  recordsScrollContent: { paddingBottom: 30 },
  backBtn: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    paddingVertical: 8, paddingHorizontal: 13, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  backBtnText: { marginLeft: 7, fontSize: 13, fontWeight: "700", color: Colors.primary },

  noDataContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 50 },
  noDataImage: { width: 150, height: 140, marginBottom: 14 },
  noDataText: { fontSize: 14, fontWeight: "600", color: Colors.textMedium, textAlign: "center" },
  noDataPlaceholder: { alignItems: "center", padding: 16, backgroundColor: Colors.dataPanelBg, borderRadius: 12, marginTop: 4 },
  noDataPlaceholderText: { textAlign: "center", marginTop: 7, fontSize: 12, color: Colors.textMedium },

  groupListContent: { paddingBottom: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
});

export default AuctionList;