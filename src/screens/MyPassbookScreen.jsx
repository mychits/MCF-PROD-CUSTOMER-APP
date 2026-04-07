import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  ActivityIndicator, Platform, Dimensions, TouchableOpacity,
  Vibration, Animated, Easing, RefreshControl, Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Header from "../components/layouts/Header";
import url from "../data/url";
import axios from "axios";
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get("window");

const C = {
  deepBlue:     "#020E2C",
  navy:         "#053B90",
  navyLight:    "#1F55A4",
  gold:         "#F5C518",
  goldDark:     "#D4A017",
  teal:         "#0C7596",
  tealLight:    "#14A0C8",
  orange:       "#E67E22",
  orangeLight:  "#F39C12",
  green:        "#10B981",
  card:         "#FFFFFF",
  bg:           "#F0F4FA",
  textDark:     "#1A1A2E",
  textMid:      "#6B7280",
  textLight:    "#9CA3AF",
  border:       "#E5E7EB",
  divider:      "#F3F4F6",
};

const fmt = (n) => {
  if (!n && n !== 0) return "0";
  return Number(n).toLocaleString("en-IN");
};

// ─── Fade-slide entrance ──────────────────────────────────────────────────────
const FadeSlide = ({ children, delay = 0, style }) => {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(32)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 480, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 480, delay, easing: Easing.out(Easing.exp),  useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[style, { opacity: fade, transform: [{ translateY: slide }] }]}>{children}</Animated.View>;
};

// ─── Shimmer skeleton ────────────────────────────────────────────────────────
const Shimmer = ({ style }) => {
  const op = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 0.55, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(op, { toValue: 0.25, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[{ backgroundColor: "#D1D9E8", borderRadius: 10 }, style, { opacity: op }]} />;
};

// ─── Scale-press wrapper ──────────────────────────────────────────────────────
const ScalePress = ({ onPress, children, style }) => {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity onPress={onPress} onPressIn={() => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true }).start()} onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true }).start()} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale: sc }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

// ─── Pulsing "View All" chip ──────────────────────────────────────────────────
const PulseChip = ({ onPress, label = "View All" }) => {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 0.55, duration: 900, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.pulseChip, { opacity: op }]}>
        <Text style={styles.pulseChipText}>{label}</Text>
        <MaterialIcons name="chevron-right" size={14} color="#fff" />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionEyebrow = ({ label }) => (
  <Text style={styles.eyebrow}>{label}</Text>
);

// ─── Finance Card (data exists) ───────────────────────────────────────────────
const FinanceCard = ({ gradColors, icon, title, label, amount, sub1Label, sub1Value, sub1Color, badgeText, onPress, accentColor }) => (
  <ScalePress onPress={onPress} style={styles.finCard}>
    <LinearGradient colors={gradColors} start={[0, 0]} end={[1, 1]} style={styles.finCardGradient}>
      {/* decorative circles */}
      <View style={[styles.decCircle1, { borderColor: "rgba(255,255,255,0.06)" }]} />
      <View style={styles.decCircle2} />

      {/* top row */}
      <View style={styles.finCardTop}>
        <View style={styles.finCardIconWrap}>{icon}</View>
        <View style={styles.finCardTitleBlock}>
          <Text style={styles.finCardEyebrow}>PORTFOLIO</Text>
          <Text style={styles.finCardTitle}>{title}</Text>
        </View>
        <PulseChip onPress={onPress} />
      </View>

      {/* amount */}
      <View style={styles.finCardAmountBlock}>
        <Text style={styles.finCardAmountLabel}>{label}</Text>
        <Text style={styles.finCardAmount}>₹ {amount}</Text>
      </View>

      {/* divider */}
      <View style={styles.finCardDivider} />

      {/* bottom row */}
      <View style={styles.finCardBottom}>
        {sub1Label ? (
          <View>
            <Text style={styles.finCardSubLabel}>{sub1Label}</Text>
            <Text style={[styles.finCardSubValue, sub1Color && { color: sub1Color }]}>{sub1Value}</Text>
          </View>
        ) : <View />}
        <View style={styles.finBadge}>
          <Text style={styles.finBadgeText}>{badgeText}</Text>
        </View>
      </View>
    </LinearGradient>
  </ScalePress>
);

// ─── Empty / Apply card ───────────────────────────────────────────────────────
const ApplyCard = ({ iconBg, icon, title, titleColor, sub, children, onPress }) => (
  <ScalePress onPress={onPress} style={styles.applyCard}>
    <View style={[styles.applyIconCircle, { backgroundColor: iconBg }]}>{icon}</View>
    <View style={styles.applyContent}>
      <Text style={[styles.applyTitle, { color: titleColor }]}>{title}</Text>
      <Text style={styles.applySub}>{sub}</Text>
      {children}
    </View>
    <MaterialIcons name="chevron-right" size={20} color={C.textLight} />
  </ScalePress>
);

// ─── Stats bar at bottom ──────────────────────────────────────────────────────
const StatBar = ({ chit, pigmy, loan, pigmyCount, loanCount }) => (
  <View style={styles.statBar}>
    <View style={styles.statItem}>
      <View style={[styles.statIconCircle, { backgroundColor: "#EEF3FF" }]}>
        <MaterialIcons name="group" size={18} color={C.navy} />
      </View>
      <Text style={styles.statValue}>{chit}</Text>
      <Text style={styles.statLbl}>chit groups</Text>
    </View>
    {pigmyCount > 0 && <>
      <View style={styles.statSep} />
      <View style={styles.statItem}>
        <View style={[styles.statIconCircle, { backgroundColor: "#E0F5FA" }]}>
          <FontAwesome5 name="piggy-bank" size={15} color={C.teal} />
        </View>
        <Text style={styles.statValue}>{pigmy}</Text>
        <Text style={styles.statLbl}>pigmy</Text>
      </View>
    </>}
    {loanCount > 0 && <>
      <View style={styles.statSep} />
      <View style={styles.statItem}>
        <View style={[styles.statIconCircle, { backgroundColor: "#FEF3E7" }]}>
          <MaterialIcons name="account-balance" size={18} color={C.orange} />
        </View>
        <Text style={styles.statValue}>{loan}</Text>
        <Text style={styles.statLbl}>loans</Text>
      </View>
    </>}
  </View>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonView = () => (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="large" color={C.navy} />
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MyPassbookScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId || null;

  const [chitGroups,       setChitGroups]       = useState([]);
  const [totalPaid,        setTotalPaid]         = useState(0);
  const [totalProfit,      setTotalProfit]       = useState(0);
  const [enrolledCount,    setEnrolledCount]     = useState(0);
  const [pigmeAccounts,    setPigmeAccounts]     = useState([]);
  const [totalPigmy,       setTotalPigmy]        = useState(0);
  const [activePigmy,      setActivePigmy]       = useState(0);
  const [loans,            setLoans]             = useState([]);
  const [totalLoan,        setTotalLoan]         = useState(0);
  const [totalLoanPaid,    setTotalLoanPaid]     = useState(0);
  const [activeLoan,       setActiveLoan]        = useState(0);
  const [isLoading,        setIsLoading]         = useState(true);
  const [isRefreshing,     setIsRefreshing]      = useState(false);

  const fetchAll = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    if (!isRefreshing) setIsLoading(true);
    try {
      // Chit
      try {
       const r = await axios.post(`${url}/enroll/get-user-tickets-report/${userId}`, {
          source: "mychits-customer-app" // Added source field here
        });
        const d = Array.isArray(r.data) ? r.data : [];
        setChitGroups(d);
        setEnrolledCount(d.length);
        setTotalPaid(d.reduce((s, g) => s + (g?.payments?.totalPaidAmount || 0), 0));
        setTotalProfit(d.reduce((s, g) => s + (g?.profit?.totalProfit || 0), 0));
      } catch (e) {}

      // Pigmy
      try {
        const r = await axios.get(`${url}/pigme/get-pigme-customer-by-user-id/${userId}`);
        const d = (Array.isArray(r.data) ? r.data : []).map(i => ({ ...i, _id: i._id || i.pigme?._id }));
        setPigmeAccounts(d); setActivePigmy(d.length);
        if (d.length) {
          const amounts = await Promise.all(d.map(async (acc) => {
            try { const res = await axios.get(`${url}/payment/user/${userId}/pigme/${acc._id}/summary`); const s = Array.isArray(res.data) ? res.data[0] : res.data; return parseFloat(s?.totalPaidAmount || 0); } catch { return 0; }
          }));
          setTotalPigmy(amounts.reduce((s, a) => s + a, 0));
        }
      } catch (e) {}

      // Loans
      try {
        const r = await axios.get(`${url}/loans/get-borrower-by-user-id/${userId}`);
        const d = Array.isArray(r.data) ? r.data : [];
        setLoans(d);
        setActiveLoan(d.filter(l => l.status !== "completed" && l.status !== "rejected").length);
        setTotalLoan(d.reduce((s, l) => s + (parseFloat(l.loan_amount) || 0), 0));
        if (d.length) {
          const paid = await Promise.all(d.map(async (l) => {
            try { const res = await axios.get(`${url}/payment/user/${userId}/loan/${l._id}/summary`); const s = Array.isArray(res.data) ? res.data[0] : res.data; return parseFloat(s?.totalPaidAmount || 0); } catch { return 0; }
          }));
          setTotalLoanPaid(paid.reduce((s, v) => s + v, 0));
        }
      } catch (e) {}
    } catch (e) {}
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, [userId, isRefreshing]);

  useFocusEffect(useCallback(() => { if (userId) fetchAll(); }, [userId, fetchAll]));
  const onRefresh = () => { setIsRefreshing(true); fetchAll(); };

  const goChits = () => { Vibration.vibrate(40); navigation.navigate("Mygroups", { userId }); };
  const goPigmy = () => { Vibration.vibrate(40); navigation.navigate("ReportList", { userId }); };
  const goLoans = () => { Vibration.vibrate(40); navigation.navigate("MyLoan", { userId }); };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <Header userId={userId} navigation={navigation} title="My Passbook" />

      {/* Full-height rounded content area matching PrizedScreen pattern */}
      <View style={styles.outerBox}>

        {/* Page header — always visible inside the box */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageEyebrow}>overview</Text>
          <Text style={styles.pageTitle}>My Passbook</Text>
          <Text style={styles.pageSub}>Track your investments, savings & loans</Text>
        </View>

        {isLoading ? (
          <SkeletonView />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[C.navy]} tintColor={C.navy} />}
          >
            {/* ── WRAPPER BOX around all three sections ── */}
            <View style={styles.allCardsWrapper}>

              {/* ── CHIT PORTFOLIO ── */}
              <FadeSlide delay={60}>
                <SectionEyebrow label="chit fund" />
                {chitGroups.length > 0 ? (
                  <FinanceCard
                    gradColors={[C.deepBlue, "#0A2A6E", C.navy]}
                    icon={<MaterialIcons name="account-balance-wallet" size={24} color={C.gold} />}
                    title="Chit Portfolio"
                    label="total investment"
                    amount={fmt(totalPaid)}
                    sub1Label={totalProfit > 0 ? "total profit" : null}
                    sub1Value={totalProfit > 0 ? `+ ₹ ${fmt(totalProfit)}` : null}
                    sub1Color="#4ade80"
                    badgeText={`${enrolledCount} active`}
                    onPress={goChits}
                  />
                ) : (
                  <ApplyCard
                    iconBg={C.navy} icon={<MaterialIcons name="add-circle-outline" size={22} color="#fff" />}
                    title="Join a Chit Group" titleColor={C.navy}
                    sub="Invest today to grow your savings."
                    onPress={() => navigation.navigate("Discover")}
                  />
                )}
              </FadeSlide>

              {/* ── PIGMY SAVINGS ── */}
              <FadeSlide delay={140}>
                <SectionEyebrow label="pigmy savings" />
                {pigmeAccounts.length > 0 ? (
                  <FinanceCard
                    gradColors={["#052E40", "#0A5570", C.teal]}
                    icon={<FontAwesome5 name="piggy-bank" size={22} color={C.gold} />}
                    title="Pigmy Savings"
                    label="total savings"
                    amount={fmt(totalPigmy)}
                    badgeText={`${activePigmy} accounts`}
                    onPress={goPigmy}
                  />
                ) : (
                  <ApplyCard
                    iconBg={C.teal} icon={<FontAwesome5 name="piggy-bank" size={20} color="#fff" />}
                    title="Apply for Pigmy" titleColor={C.teal}
                    sub="Start your daily savings journey."
                    onPress={goPigmy}
                  >
                    <View style={styles.contactBox}>
                      <TouchableOpacity style={styles.contactIconBtn} onPress={() => Linking.openURL("mailto:info.mychits@gmail.com")}>
                        <MaterialIcons name="email" size={18} color={C.navy} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.contactIconBtn, { backgroundColor: "#E7F7EE" }]} onPress={() => Linking.openURL("whatsapp://send?phone=919483900777")}>
                        <FontAwesome5 name="whatsapp" size={18} color="#25D366" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.contactIconBtn, { backgroundColor: "#FEF3E7" }]} onPress={() => Linking.openURL("tel:+919483900777")}>
                        <MaterialIcons name="call" size={18} color={C.orange} />
                      </TouchableOpacity>
                    </View>
                  </ApplyCard>
                )}
              </FadeSlide>

              {/* ── LOAN SUMMARY ── */}
              <FadeSlide delay={220}>
                <SectionEyebrow label="loans" />
                {loans.length > 0 ? (
                  <FinanceCard
                    gradColors={["#3D1A00", "#7A3B00", C.orange]}
                    icon={<Ionicons name="cash-outline" size={24} color={C.gold} />}
                    title="Loan Summary"
                    label="outstanding balance"
                    amount={fmt(totalLoan - totalLoanPaid)}
                    sub1Label="total repaid"
                    sub1Value={`₹ ${fmt(totalLoanPaid)}`}
                    badgeText={`${activeLoan} active`}
                    onPress={goLoans}
                  />
                ) : (
                  <ApplyCard
                    iconBg={C.orange} icon={<Ionicons name="cash-outline" size={22} color="#fff" />}
                    title="Apply for a Loan" titleColor={C.orange}
                    sub="Quick financial assistance when you need it."
                    onPress={goLoans}
                  />
                )}
              </FadeSlide>

            </View>
            {/* ── END WRAPPER BOX ── */}

          </ScrollView>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.navy },
  scroll:      { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },

  outerBox: {
    flex: 1,
    backgroundColor: C.bg,
    marginHorizontal: 12,
    marginBottom: 50,
    borderRadius: 24, // smaller
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 18 }, // adjusted
      android: { elevation: 18 }, // adjusted
    }),
  },

  allCardsWrapper: {
    backgroundColor: C.card,
    borderRadius: 18, // smaller
    padding: 12, // smaller
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 }, // adjusted
      android: { elevation: 5 }, // adjusted
    }),
  },

  // Page header
  pageHeader:  { alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }, // smaller
  pageEyebrow: { fontSize: 8, fontWeight: "700", color: C.textLight, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }, // smaller
  pageTitle:   { fontSize: 22, fontWeight: "900", color: C.textDark, letterSpacing: -0.4, marginBottom: 3 }, // smaller
  pageSub:     { fontSize: 11, color: C.textMid, textAlign: "center" }, // smaller

  // Section eyebrow
  eyebrow: { fontSize: 7, fontWeight: "700", color: C.textLight, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, marginTop: 4, marginLeft: 2 }, // smaller

  // Finance card
  finCard: {
    borderRadius: 16, marginBottom: 12, overflow: "hidden", // smaller
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 }, // adjusted
      android: { elevation: 10 }, // adjusted
    }),
  },
  finCardGradient: { padding: 12, borderRadius: 16, overflow: "hidden" }, // smaller
  decCircle1: { position: "absolute", width: 110, height: 110, borderRadius: 55, borderWidth: 1, top: -30, right: -15 }, // smaller
  decCircle2: { position: "absolute", width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(245,197,24,0.06)", bottom: -10, left: 25 }, // smaller

  finCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 }, // smaller
  finCardIconWrap: {
    width: 40, height: 40, borderRadius: 12, // smaller
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    marginRight: 10, // smaller
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  finCardTitleBlock: { flex: 1 },
  finCardEyebrow: { fontSize: 7, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 1 }, // smaller
  finCardTitle:   { fontSize: 14, fontWeight: "800", color: "#fff" }, // smaller

  finCardAmountBlock: { marginBottom: 10 }, // smaller
  finCardAmountLabel: { fontSize: 8, fontWeight: "600", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }, // smaller
  finCardAmount:      { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.7 }, // smaller

  finCardDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 10 }, // smaller

  finCardBottom:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  finCardSubLabel:  { fontSize: 8, fontWeight: "600", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }, // smaller
  finCardSubValue:  { fontSize: 15, fontWeight: "800", color: "#fff" }, // smaller
  finBadge: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }, // smaller
  finBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.4 }, // smaller

  // Pulse chip
  pulseChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }, // smaller
  pulseChipText: { fontSize: 9, fontWeight: "700", color: "#fff", marginRight: 1 }, // smaller

  // Apply card
  applyCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 16, marginBottom: 12, // smaller
    padding: 12, // smaller
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 }, // adjusted
      android: { elevation: 3 }, // adjusted
    }),
  },
  applyIconCircle: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 }, // smaller
  applyContent: { flex: 1 },
  applyTitle:   { fontSize: 14, fontWeight: "800", marginBottom: 1 }, // smaller
  applySub:     { fontSize: 11, color: C.textMid }, // smaller
  contactBox:      { flexDirection: "row", gap: 6, marginTop: 8 }, // smaller
  contactIconBtn:  { width: 32, height: 32, borderRadius: 8, backgroundColor: "#EEF3FF", alignItems: "center", justifyContent: "center" }, // smaller

  // Bottom section
  bottomLabel: { fontSize: 8, fontWeight: "700", color: C.textLight, textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center", marginBottom: 8, marginTop: 6 }, // smaller

  // Loader
  loaderContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  loaderText: { marginTop: 10, fontSize: 11, fontWeight: "600", color: C.textMid, textTransform: "lowercase", letterSpacing: 0.3 }, // smaller

  // Stat bar
  statBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 8, // smaller
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 12 }, // adjusted
      android: { elevation: 8 }, // adjusted
    }),
  },
  statItem:       { flex: 1, alignItems: "center" },
  statIconCircle: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 }, // smaller
  statValue:      { fontSize: 18, fontWeight: "900", color: C.textDark, letterSpacing: -0.5 }, // smaller
  statLbl:        { fontSize: 7, fontWeight: "600", color: C.textLight, textTransform: "uppercase", letterSpacing: 1, marginTop: 1 }, // smaller
  statSep:        { width: 1, height: 36, backgroundColor: C.border }, // smaller
});

export default MyPassbookScreen;
