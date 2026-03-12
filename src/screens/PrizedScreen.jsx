import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get("window");

const Colors = {
  primary: "#053B90",
  primaryLight: "#1F55A4",
  backgroundLight: "#F0F4FA",
  card: "#FFFFFF",
  textDark: "#1A1A2E",
  textMedium: "#6B7280",
  textLight: "#9CA3AF",
  gold: "#F5C518",
  goldDark: "#D4A017",
  goldLight: "#FFE566",
  successGreen: "#10B981",
  error: "#EF4444",
  border: "#E5E7EB",
  shadow: "rgba(5, 59, 144, 0.15)",
  lightDivider: "#F3F4F6",
  deepBlue: "#020E2C",
  accentPurple: "#7C3AED",
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree + decimalPart;
  }
  return lastThree + decimalPart;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-IN", options);
};

// Animated shimmer trophy
const TrophyShimmer = ({ size = 32 }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scale = shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <MaterialCommunityIcons name="trophy" size={size} color={Colors.gold} />
    </Animated.View>
  );
};

// Summary Banner — compact
const SummaryBanner = ({ count, totalAmount }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.exp), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.summaryBanner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={[Colors.deepBlue, "#0B2260", Colors.primary]}
        start={[0, 0]} end={[1, 1]}
        style={styles.summaryGradient}
      >
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <View style={styles.bannerTopRow}>
          <View style={styles.bannerTrophyWrap}>
            <TrophyShimmer size={28} />
          </View>
          <View style={styles.bannerLabelBlock}>
            <Text style={styles.bannerEyebrow}>AUCTION VICTORIES</Text>
            <Text style={styles.bannerHeadline}>My Prizes</Text>
          </View>
        </View>

        <View style={styles.bannerStatRow}>
        
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.gold, fontSize: 24 }]}>
              ₹{formatNumberIndianStyle(totalAmount)}
            </Text>
            <Text style={styles.statLabel}>total earned</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// RankBadge removed — replaced by inline rankCircle in PrizeCard

// Prize Card — bold crimson/rose redesign
const PrizeCard = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, delay: index * 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, delay: index * 90, easing: Easing.out(Easing.exp), useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 420, delay: index * 90, easing: Easing.out(Easing.exp), useNativeDriver: true }),
    ]).start();
  }, []);

  const groupName = item.group_name || "Unknown Group";
  const groupValue = item.group_value || "0";
  const ticket = item.ticket || "0";
  const receiptNo = item.receipt_no || "N/A";
  const amount = item.amount || "0";
  const payDate = item.pay_date;
  const rank = index + 1;

  return (
    <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
      <View style={styles.prizeCard}>


        <LinearGradient colors={["#7B0D1E", "#C0392B", "#E74C3C"]} start={[0, 0]} end={[1, 1]} style={styles.cardTop}>
       
          <View style={styles.diagSlice1} />
          <View style={styles.diagSlice2} />

          <View style={styles.cardTopContent}>
          
            <View style={styles.rankCircle}>
              <Text style={styles.rankCircleText}>{rank}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              
              <Text style={styles.prizeGroupName} numberOfLines={1}>{groupName}</Text>
             
              <View style={styles.ticketPill}>
                <MaterialCommunityIcons name="ticket-outline" size={11} color="#FFD6D6" />
                <Text style={styles.ticketPillText}>Ticket <Text style={styles.ticketPillNum}>{ticket}</Text></Text>
              </View>
            </View>

          
            <View style={styles.prizedSlantTag}>
              <MaterialCommunityIcons name="trophy" size={9} color="#7B0D1E" style={{ marginRight: 3 }} />
              <Text style={styles.prizedSlantTagText}>PRIZED</Text>
            </View>
          </View>

         
          <View style={styles.groupValueStrip}>
            <Text style={styles.groupValueStripLabel}>CHIT VALUE</Text>
            <Text style={styles.groupValueStripAmount}>₹ {formatNumberIndianStyle(groupValue)}</Text>
          </View>
        </LinearGradient>

       
        <View style={styles.prizeHeroBlock}>
          <View style={styles.prizeHeroLeft}>
            <Text style={styles.prizeHeroLabel}>PRIZE WON</Text>
            <Text style={styles.prizeHeroAmount}>₹ {formatNumberIndianStyle(amount)}</Text>
          </View>
          <View style={styles.prizeHeroDivider} />
          <View style={styles.prizeHeroRight}>
            <View style={styles.prizeHeroStatRow}>
              <MaterialCommunityIcons name="file-document-outline" size={13} color={Colors.textMedium} />
              <Text style={styles.prizeHeroStatLabel}>Receipt</Text>
              <Text style={styles.prizeHeroStatValue}>{receiptNo}</Text>
            </View>
            <View style={[styles.prizeHeroStatRow, { marginTop: 6 }]}>
              <MaterialCommunityIcons name="calendar-check" size={13} color={Colors.textMedium} />
              <Text style={styles.prizeHeroStatLabel}>Date</Text>
              <Text style={styles.prizeHeroStatValue}>{formatDate(payDate)}</Text>
            </View>
          </View>
        </View>

        {/* Footer: paid status bar */}
        <View style={styles.paidBar}>
          <View style={styles.paidDot} />
          <Text style={styles.paidText}>PAYMENT COMPLETED</Text>
          <MaterialCommunityIcons name="check-circle" size={14} color={Colors.successGreen} />
        </View>

      </View>
    </Animated.View>
  );
};

// Empty State
const EmptyState = () => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -12, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <MaterialCommunityIcons name="trophy-outline" size={80} color={Colors.gold} style={{ opacity: 0.2 }} />
      </Animated.View>
      <Text style={styles.emptyTitle}>No Prizes Yet</Text>
      <Text style={styles.emptySubtitle}>Your winning auction records will{"\n"}appear here once you win a bid.</Text>
      <View style={styles.emptyDivider} />
      <Text style={styles.emptyHint}>Keep bidding to secure your prize! 🎯</Text>
    </View>
  );
};

const CARD_HEIGHT = 260;

const DotIndicator = ({ count, activeIndex }) => (
  <View style={styles.dotRow}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
    ))}
  </View>
);

// Main Screen
const PrizedScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);

  // Support both context userId and param userId (from AuctionList navigation)
  const userId = route?.params?.userId || appUser?.userId;
  // groupId and ticket are passed when navigating from a specific group's "Prized Info" button
  const groupId = route?.params?.groupId || null;
  const ticket = route?.params?.ticket || null;

  const [prizedData, setPrizedData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizeToArray = (data) => {
    if (!data) return [];
    // Shape: { success, data: { payouts: [...], summary: {} } }
    if (data?.data?.payouts && Array.isArray(data.data.payouts)) return data.data.payouts;
    // Shape: { data: [...] }
    if (Array.isArray(data?.data)) return data.data;
    // Already an array
    if (Array.isArray(data)) return data;
    return [];
  };

  const extractSummary = (data) => {
    if (data?.data?.summary) return data.data.summary;
    return null;
  };

  const fetchPrizedDetails = useCallback(async () => {
    if (!userId) { setIsLoading(false); setError("User session expired."); return; }
    setIsLoading(true);
    setError(null);
    try {
      const params = { userId };
      if (groupId) params.groupId = groupId;
      if (ticket) params.ticket = ticket;

      console.log("=== PrizedScreen ===");
      console.log("route.params:", JSON.stringify(route?.params, null, 2));
      console.log("userId:", userId);
      console.log("groupId:", groupId);
      console.log("Request params:", JSON.stringify(params, null, 2));

      const response = await axios.get(`${url}/payment-out/prized-group`, { params });

      console.log("Response status:", response.status);
      console.log("Response data type:", typeof response.data);
      console.log("Is array:", Array.isArray(response.data));
      console.log("Response data:", JSON.stringify(response.data, null, 2));

      const normalized = normalizeToArray(response.data);
      console.log("Normalized length:", normalized.length);
      console.log("Normalized data:", JSON.stringify(normalized, null, 2));

      setSummary(extractSummary(response.data));
      setPrizedData(normalized);
    } catch (err) {
      console.log("=== PrizedScreen ERROR ===");
      console.log("Error message:", err.message);
      console.log("Error status:", err.response?.status);
      console.log("Error response data:", JSON.stringify(err.response?.data, null, 2));
      setError("No prized group records found.");
      setPrizedData([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, groupId]);

  useFocusEffect(useCallback(() => { fetchPrizedDetails(); }, [fetchPrizedDetails]));

  const totalAmount = summary?.payout_amount ?? prizedData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalCount = summary?.count ?? prizedData.length;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBox}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          {groupId && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
           
            </TouchableOpacity>
          )}
          <View style={styles.topBarTitleBlock}>
            <Text style={styles.topBarEyebrow}>auction victories</Text>
            <Text style={styles.topBarTitle}>My Prizes</Text>
          </View>
          <TrophyShimmer size={30} />
        </View>

        {/* Content */}
        <View style={styles.contentArea}>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.gold} />
              <Text style={styles.loadingText}>loading your prizes...</Text>
            </View>
          ) : prizedData.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <FlatList
                data={prizedData}
                keyExtractor={(item, i) => item._id || `prize-${i}`}
                renderItem={({ item, index }) => <PrizeCard item={item} index={index} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                snapToInterval={CARD_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.y / CARD_HEIGHT);
                  setActiveIndex(index);
                }}
                ListHeaderComponent={
                  <>
                    <SummaryBanner count={totalCount} totalAmount={totalAmount} />
                    <Text style={styles.listHeader}>
                      {totalCount} prize{totalCount !== 1 ? "s" : ""} found
                    </Text>
                  </>
                }
              />
              {prizedData.length > 1 && (
                <DotIndicator count={prizedData.length} activeIndex={activeIndex} />
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.primary },
  outerBox: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    marginHorizontal: 10,
    marginBottom: 46,
    borderRadius: 26,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },

  // Top Bar
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  backBtn: { marginRight: 10, padding: 4 },
  topBarTitleBlock: { flex: 1 },
  topBarEyebrow: { fontSize: 9, fontWeight: "700", color: Colors.textLight, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 1 },
  topBarTitle: { fontSize: 22, fontWeight: "900", color: Colors.primary, letterSpacing: -0.4 },

  // Summary Banner — compact
  summaryBanner: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14 },
      android: { elevation: 12 },
    }),
  },
  summaryGradient: { padding: 14, borderRadius: 18, overflow: "hidden" },
  bgCircle1: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.03)", top: -40, right: -20 },
  bgCircle2: { position: "absolute", width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(245,197,24,0.07)", bottom: -15, left: 10 },
  bannerTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  bannerTrophyWrap: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: "rgba(245,197,24,0.12)",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
    borderWidth: 1, borderColor: "rgba(245,197,24,0.2)",
  },
  bannerLabelBlock: { flex: 1 },
  bannerEyebrow: { fontSize: 8, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 2 },
  bannerHeadline: { fontSize: 20, fontWeight: "900", color: Colors.card, letterSpacing: -0.4 },
  bannerStatRow: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 11 },
  statValue: { fontSize: 22, fontWeight: "900", color: Colors.card, letterSpacing: -0.8 },
  statLabel: { fontSize: 8, fontWeight: "600", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 10 },

  // Content
  contentArea: { flex: 1, paddingHorizontal: 14 },
  listContent: { paddingBottom: 10 },
  listHeader: { fontSize: 9, fontWeight: "700", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 10, marginTop: 2 },
  dotRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 16, height: 5, borderRadius: 3, backgroundColor: Colors.primary },

  // Prize Card — crimson redesign
  cardWrapper: { marginBottom: 16 },
  prizeCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#C0392B", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },

  // Top crimson header
  cardTop: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 0, overflow: "hidden" },
  diagSlice1: {
    position: "absolute", width: 160, height: 160,
    backgroundColor: "rgba(255,255,255,0.05)",
    transform: [{ rotate: "40deg" }],
    top: -70, right: -30,
  },
  diagSlice2: {
    position: "absolute", width: 90, height: 90,
    backgroundColor: "rgba(0,0,0,0.08)",
    transform: [{ rotate: "40deg" }],
    bottom: 10, left: 50,
  },
  cardTopContent: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  rankCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  rankCircleText: { fontSize: 14, fontWeight: "900", color: Colors.card },
  prizeGroupName: { fontSize: 16, fontWeight: "900", color: Colors.card, letterSpacing: 0.1, marginBottom: 5 },
  ticketPill: { flexDirection: "row", alignItems: "center", gap: 4 },
  ticketPillText: { fontSize: 12, fontWeight: "500", color: "rgba(255,255,255,0.7)" },
  ticketPillNum: { fontWeight: "900", color: Colors.card, fontSize: 13 },

  // Slant PRIZED tag
  prizedSlantTag: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.gold,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 4,
    transform: [{ skewX: "-10deg" }],
    alignSelf: "flex-start",
    marginTop: 2,
  },
  prizedSlantTagText: {
    fontSize: 9, fontWeight: "900", color: "#7B0D1E",
    letterSpacing: 0.8, transform: [{ skewX: "10deg" }],
  },

  groupValueStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.15)",
    marginHorizontal: -16, paddingHorizontal: 16, paddingVertical: 9,
    marginTop: 4,
  },
  groupValueStripLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.5)", letterSpacing: 1.4, textTransform: "uppercase" },
  groupValueStripAmount: { fontSize: 15, fontWeight: "900", color: Colors.gold },

  // Prize hero middle
  prizeHeroBlock: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.card,
  },
  prizeHeroLeft: { flex: 1 },
  prizeHeroLabel: { fontSize: 9, fontWeight: "700", color: Colors.textLight, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 3 },
  prizeHeroAmount: { fontSize: 19, fontWeight: "900", color: Colors.successGreen, letterSpacing: -0.5 },
  prizeHeroDivider: { width: 1, height: 50, backgroundColor: Colors.border, marginHorizontal: 14 },
  prizeHeroRight: { flex: 1 },
  prizeHeroStatRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  prizeHeroStatLabel: { fontSize: 10, fontWeight: "500", color: Colors.textMedium, flex: 1 },
  prizeHeroStatValue: { fontSize: 11, fontWeight: "800", color: Colors.textDark },

  // Paid bar
  paidBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 8,
    backgroundColor: "#F0FDF4",
    borderTopWidth: 1, borderColor: "#D1FAE5",
  },
  paidDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.successGreen },
  paidText: { fontSize: 9, fontWeight: "800", color: Colors.successGreen, letterSpacing: 1.2, textTransform: "uppercase" },

  // Empty State
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: Colors.textDark, marginTop: 16, letterSpacing: -0.2 },
  emptySubtitle: { fontSize: 13, color: Colors.textMedium, textAlign: "center", lineHeight: 20, marginTop: 6 },
  emptyDivider: { width: 40, height: 2, backgroundColor: Colors.gold, borderRadius: 1, marginVertical: 14, opacity: 0.5 },
  emptyHint: { fontSize: 13, fontWeight: "700", color: Colors.primary, opacity: 0.7 },

  // Loader
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 12, fontWeight: "600", color: Colors.textMedium, textTransform: "lowercase", letterSpacing: 0.3 },
});

export default PrizedScreen;