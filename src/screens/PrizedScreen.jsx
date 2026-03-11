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
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>groups won</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.gold, fontSize: 14 }]}>
              ₹{formatNumberIndianStyle(totalAmount)}
            </Text>
            <Text style={styles.statLabel}>total earned</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Rank Badge
const RankBadge = ({ rank }) => {
  const gradMap = {
    1: [Colors.gold, Colors.goldDark],
    2: ["#D0D0D0", "#A0A0A0"],
    3: ["#D4895A", "#A05020"],
  };
  const gradColors = gradMap[rank] || [Colors.primaryLight, Colors.primary];
  return (
    <LinearGradient colors={gradColors} start={[0, 0]} end={[1, 1]} style={styles.rankBadge}>
      <Text style={styles.rankText}>#{rank}</Text>
    </LinearGradient>
  );
};

// Prize Card — compact
const PrizeCard = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, delay: index * 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 80, easing: Easing.out(Easing.exp), useNativeDriver: true }),
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
    <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.prizeCard}>

        {/* Gold accent bar */}
        <View style={styles.goldAccentBar} />

        {/* Header */}
        <LinearGradient
          colors={[Colors.deepBlue, "#0A2255"]}
          start={[0, 0]} end={[1, 1]}
          style={styles.cardHeaderBlock}
        >
          <View style={styles.headerDecorDot1} />

          <View style={styles.headerTopRow}>
            <RankBadge rank={rank} />
            <View style={styles.headerTitleBlock}>
              <Text style={styles.groupName} numberOfLines={1}>{groupName}</Text>
              <View style={styles.headerChip}>
                <MaterialCommunityIcons name="medal" size={9} color={Colors.gold} />
                <Text style={styles.headerChipText}>PRIZED GROUP</Text>
              </View>
            </View>
            <View style={styles.headerValueBlock}>
              <Text style={styles.chitValueLabel}>chit value</Text>
              <Text style={styles.chitValueAmount}>₹ {formatNumberIndianStyle(groupValue)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Ticket row */}
        <LinearGradient
          colors={["#FFFBEA", "#FFF3C0"]}
          start={[0, 0]} end={[1, 0]}
          style={styles.ticketBlock}
        >
          <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.ticketCircle}>
            <FontAwesome5 name="ticket-alt" size={10} color={Colors.deepBlue} />
            <Text style={styles.ticketNum}>{ticket}</Text>
          </LinearGradient>

          <View style={styles.ticketMidBlock}>
            <Text style={styles.winningTicketLabel}>🏆 Winning Ticket</Text>
            <Text style={styles.receiptSmall}>receipt · {receiptNo}</Text>
          </View>

          <View style={styles.prizeAmountBlock}>
            <Text style={styles.prizeAmountLabel}>prize won</Text>
            <Text style={styles.prizeAmountValue}>₹ {formatNumberIndianStyle(amount)}</Text>
          </View>
        </LinearGradient>

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.footerInfoBox}>
            <View style={styles.footerIconCircle}>
              <MaterialCommunityIcons name="calendar-check" size={12} color={Colors.primary} />
            </View>
            <Text style={styles.footerInfoLabel}>payment date</Text>
            <Text style={styles.footerInfoValue}>{formatDate(payDate)}</Text>
          </View>
          <View style={styles.footerBoxDivider} />
          <View style={styles.footerInfoBox}>
            <View style={styles.footerIconCircle}>
              <MaterialCommunityIcons name="file-document-outline" size={12} color={Colors.primary} />
            </View>
            <Text style={styles.footerInfoLabel}>receipt no</Text>
            <Text style={[styles.footerInfoValue, { color: Colors.primary }]}>{receiptNo}</Text>
          </View>
          <View style={styles.footerBoxDivider} />
          <View style={styles.footerInfoBox}>
            <View style={[styles.footerIconCircle, { backgroundColor: "#ECFDF5" }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={12} color={Colors.successGreen} />
            </View>
            <Text style={styles.footerInfoLabel}>status</Text>
            <Text style={[styles.footerInfoValue, { color: Colors.successGreen }]}>Paid</Text>
          </View>
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
const PrizedScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;
  const [prizedData, setPrizedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchPrizedDetails = useCallback(async () => {
    if (!userId) { setIsLoading(false); setError("User session expired."); return; }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${url}/payment-out/prized-group/${userId}`);
      if (response.data) {
        const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setPrizedData(data);
      }
    } catch (err) {
      setError("No prized group records found.");
      setPrizedData([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { fetchPrizedDetails(); }, [fetchPrizedDetails]));

  const totalAmount = prizedData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBox}>

        {/* Top Bar */}
        <View style={styles.topBar}>
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
                    <SummaryBanner count={prizedData.length} totalAmount={totalAmount} />
                    <Text style={styles.listHeader}>
                      {prizedData.length} prize{prizedData.length !== 1 ? "s" : ""} found
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

  // Prize Card — compact
  cardWrapper: { marginBottom: 14 },
  prizeCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: Colors.deepBlue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 14 },
      android: { elevation: 10 },
    }),
  },
  goldAccentBar: { height: 3, backgroundColor: Colors.gold },

  // Card header
  cardHeaderBlock: { paddingVertical: 12, paddingHorizontal: 14, overflow: "hidden" },
  headerDecorDot1: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.03)", top: -30, right: 0 },
  headerTopRow: { flexDirection: "row", alignItems: "center" },
  rankBadge: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 10 },
  rankText: { fontSize: 12, fontWeight: "900", color: Colors.deepBlue },
  headerTitleBlock: { flex: 1 },
  groupName: { fontSize: 14, fontWeight: "800", color: Colors.card, letterSpacing: 0.1, marginBottom: 4 },
  headerChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(245,197,24,0.12)",
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1, borderColor: "rgba(245,197,24,0.25)",
    alignSelf: "flex-start",
  },
  headerChipText: { fontSize: 7, fontWeight: "800", color: Colors.gold, marginLeft: 3, letterSpacing: 0.8 },
  headerValueBlock: { alignItems: "flex-end" },
  chitValueLabel: { fontSize: 8, fontWeight: "600", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 },
  chitValueAmount: { fontSize: 13, fontWeight: "800", color: Colors.gold },

  // Ticket row — compact
  ticketBlock: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderColor: Colors.lightDivider,
  },
  ticketCircle: {
    width: 50, height: 50, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.goldDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 5 },
      android: { elevation: 5 },
    }),
  },
  ticketNum: { fontSize: 16, fontWeight: "900", color: Colors.deepBlue, marginTop: 1 },
  ticketMidBlock: { flex: 1 },
  winningTicketLabel: { fontSize: 13, fontWeight: "800", color: Colors.textDark, marginBottom: 3 },
  receiptSmall: { fontSize: 10, color: Colors.textMedium, fontWeight: "500", letterSpacing: 0.2 },
  prizeAmountBlock: { alignItems: "flex-end" },
  prizeAmountLabel: { fontSize: 8, fontWeight: "600", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  prizeAmountValue: { fontSize: 16, fontWeight: "900", color: Colors.successGreen, letterSpacing: -0.3 },

  // Footer — compact
  footerRow: { flexDirection: "row", backgroundColor: "#F8FAFC" },
  footerInfoBox: { flex: 1, alignItems: "center", paddingVertical: 11, paddingHorizontal: 4 },
  footerIconCircle: { width: 26, height: 26, borderRadius: 8, backgroundColor: "#EEF3FF", alignItems: "center", justifyContent: "center", marginBottom: 5 },
  footerInfoLabel: { fontSize: 7, fontWeight: "600", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, textAlign: "center" },
  footerInfoValue: { fontSize: 11, fontWeight: "800", color: Colors.textDark, textAlign: "center" },
  footerBoxDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },

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