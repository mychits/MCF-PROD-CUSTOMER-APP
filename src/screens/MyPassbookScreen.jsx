import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  ActivityIndicator, Platform, Dimensions, TouchableOpacity,
  Vibration, Animated, Easing, RefreshControl,
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
    <Text style={styles.loaderText}>loading your passbook...</Text>
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
        const r = await axios.post(`${url}/enroll/get-user-tickets-report/${userId}`);
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
                    <Text style={styles.contactLabel}>contact to apply</Text>
                    <Text style={styles.contactVal}>info.mychits@gmail.com</Text>
                    <Text style={styles.contactVal}>+91 94839 00777</Text>
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

            {/* ── Bottom stats ── */}
            <FadeSlide delay={300}>
              <Text style={styles.bottomLabel}>active services</Text>
              <StatBar
                chit={enrolledCount}
                pigmy={activePigmy}
                loan={activeLoan}
                pigmyCount={pigmeAccounts.length}
                loanCount={loans.length}
              />
            </FadeSlide>

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

  // Full-height outer box — same pattern as PrizedScreen
  outerBox: {
    flex: 1,
    backgroundColor: C.bg,
    marginHorizontal: 12,
    marginBottom: 50,
    borderRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },

  // Page header
  pageHeader:  { alignItems: "center", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14 },
  pageEyebrow: { fontSize: 9, fontWeight: "700", color: C.textLight, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 3 },
  pageTitle:   { fontSize: 24, fontWeight: "900", color: C.textDark, letterSpacing: -0.4, marginBottom: 4 },
  pageSub:     { fontSize: 12, color: C.textMid, textAlign: "center" },

  // Section eyebrow
  eyebrow: { fontSize: 8, fontWeight: "700", color: C.textLight, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 8, marginTop: 4, marginLeft: 2 },

  // Finance card
  finCard: {
    borderRadius: 20, marginBottom: 16, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  finCardGradient: { padding: 16, borderRadius: 20, overflow: "hidden" },
  decCircle1: { position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 1, top: -40, right: -20 },
  decCircle2: { position: "absolute", width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(245,197,24,0.06)", bottom: -15, left: 30 },

  finCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  finCardIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  finCardTitleBlock: { flex: 1 },
  finCardEyebrow: { fontSize: 8, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 2 },
  finCardTitle:   { fontSize: 15, fontWeight: "800", color: "#fff" },

  finCardAmountBlock: { marginBottom: 12 },
  finCardAmountLabel: { fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 },
  finCardAmount:      { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.8 },

  finCardDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 12 },

  finCardBottom:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  finCardSubLabel:  { fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  finCardSubValue:  { fontSize: 16, fontWeight: "800", color: "#fff" },
  finBadge: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  finBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff", letterSpacing: 0.4 },

  // Pulse chip
  pulseChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  pulseChipText: { fontSize: 10, fontWeight: "700", color: "#fff", marginRight: 2 },

  // Apply card
  applyCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 18, marginBottom: 16,
    padding: 16,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  applyIconCircle: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 },
  applyContent: { flex: 1 },
  applyTitle:   { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  applySub:     { fontSize: 12, color: C.textMid },
  contactBox:   { backgroundColor: C.bg, padding: 10, borderRadius: 10, marginTop: 8 },
  contactLabel: { fontSize: 8, fontWeight: "700", color: C.textMid, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 },
  contactVal:   { fontSize: 11, fontWeight: "600", color: C.textDark, marginBottom: 1 },

  // Bottom section
  bottomLabel: { fontSize: 9, fontWeight: "700", color: C.textLight, textTransform: "uppercase", letterSpacing: 1.8, textAlign: "center", marginBottom: 10, marginTop: 8 },

  // Loader
  loaderContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  loaderText: { marginTop: 12, fontSize: 12, fontWeight: "600", color: C.textMid, textTransform: "lowercase", letterSpacing: 0.3 },

  // Stat bar
  statBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 10,
    ...Platform.select({
      ios: { shadowColor: C.deepBlue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14 },
      android: { elevation: 10 },
    }),
  },
  statItem:       { flex: 1, alignItems: "center" },
  statIconCircle: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue:      { fontSize: 20, fontWeight: "900", color: C.textDark, letterSpacing: -0.5 },
  statLbl:        { fontSize: 8, fontWeight: "600", color: C.textLight, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 2 },
  statSep:        { width: 1, height: 40, backgroundColor: C.border },
});

export default MyPassbookScreen;