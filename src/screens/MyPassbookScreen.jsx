import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  TouchableOpacity,
  Vibration,
  Animated,
  Easing,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Header from "../components/layouts/Header";

import url from "../data/url";
import axios from "axios";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get("window");

// --- ANIMATION HELPERS ---

// 1. Reusable Component for Staggered Entry Animation
const FadeInUp = ({ children, delay = 0, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current; 

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        delay: delay,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// 2. Reusable Component for Shimmer Loading Skeleton
const ShimmerPlaceholder = ({ style }) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.shimmer, style, { opacity: opacityAnim }]} />;
};

// 3. Reusable Pressable Scale Component for Cards
const ScalePress = ({ onPress, children, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// 4. UPDATED Animated Component for "View All" Buttons (Added Blinking)
const AnimatedButton = ({ onPress, children, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current; // For Press
  const blinkAnim = useRef(new Animated.Value(1)).current; // For Blinking

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Start Blinking Animation Loop
  useEffect(() => {
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.6, // Fade to 60% opacity
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1, // Fade to 100% opacity
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    blinkLoop.start();

    // Cleanup
    return () => blinkLoop.stop();
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View 
        style={[
          style, 
          { 
            transform: [{ scale: scaleAnim }], 
            opacity: blinkAnim // Apply blinking animation
          }
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- MAIN SCREEN ---

const MyPassbookScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || null; 

  const [currentUserId, setCurrentUserId] = useState(userId || null);
  
  // Chit States
  const [chitGroups, setChitGroups] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [enrolledGroupsCount, setEnrolledGroupsCount] = useState(0);
  
  // Pigmy States
  const [pigmeAccounts, setPigmeAccounts] = useState([]);
  const [totalPigmySavings, setTotalPigmySavings] = useState(0);
  const [activePigmeCount, setActivePigmeCount] = useState(0);
  
  // Loan States
  const [loans, setLoans] = useState([]);
  const [totalLoanAmount, setTotalLoanAmount] = useState(0);
  const [totalLoanPaid, setTotalLoanPaid] = useState(0);
  const [activeLoanCount, setActiveLoanCount] = useState(0);
  
  // Loading & Error States
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataError, setDataError] = useState(null);

  const fetchAllOverview = useCallback(async () => {
    if (!currentUserId) {
      setIsLoadingData(false);
      setDataError("User ID not found.");
      return;
    }
    if (!isRefreshing) setIsLoadingData(true);
    setDataError(null);
    
    try {
      // 1. Fetch Chit Groups
      try {
        const chitResponse = await axios.post(`${url}/enroll/get-user-tickets-report/${currentUserId}`);
        const chitData = Array.isArray(chitResponse.data) ? chitResponse.data : [];
        setTotalPaid(chitData.reduce((sum, g) => sum + (g?.payments?.totalPaidAmount || 0), 0));
        setTotalProfit(chitData.reduce((sum, g) => sum + (g?.profit?.totalProfit || 0), 0));
        setChitGroups(chitData);
        setEnrolledGroupsCount(chitData.length);
      } catch (err) { console.error(err); }

      // 2. Fetch Pigme Accounts
      try {
        const pigmeResponse = await axios.get(`${url}/pigme/get-pigme-customer-by-user-id/${currentUserId}`);
        const pigmeData = Array.isArray(pigmeResponse.data) ? pigmeResponse.data : [];
        const normalized = pigmeData.map(item => ({ ...item, _id: item._id || item.pigme?._id }));
        setPigmeAccounts(normalized);
        setActivePigmeCount(normalized.length);
        
        if (normalized.length > 0) {
          const promises = normalized.map(async (acc) => {
            try {
              const res = await axios.get(`${url}/payment/user/${currentUserId}/pigme/${acc._id}/summary`);
              const data = Array.isArray(res.data) ? res.data[0] : res.data;
              return parseFloat(data?.totalPaidAmount || 0);
            } catch { return 0; }
          });
          const amounts = await Promise.all(promises);
          setTotalPigmySavings(amounts.reduce((sum, a) => sum + a, 0));
        }
      } catch (err) { console.error(err); }

      // 3. Fetch Loans
      try {
        const loanResponse = await axios.get(`${url}/loans/get-borrower-by-user-id/${currentUserId}`);
        const loanData = Array.isArray(loanResponse.data) ? loanResponse.data : [];
        setLoans(loanData);
        setActiveLoanCount(loanData.filter(l => l.status !== 'completed' && l.status !== 'rejected').length);
        const tAmount = loanData.reduce((sum, l) => sum + (parseFloat(l.loan_amount) || 0), 0);
        setTotalLoanAmount(tAmount);
        
        if (loanData.length > 0) {
            const promises = loanData.map(async (l) => {
                try {
                    const res = await axios.get(`${url}/payment/user/${currentUserId}/loan/${l._id}/summary`);
                    const s = Array.isArray(res.data) ? res.data[0] : res.data;
                    return parseFloat(s?.totalPaidAmount || 0);
                } catch { return 0; }
            });
            const paid = await Promise.all(promises);
            setTotalLoanPaid(paid.reduce((sum, v) => sum + v, 0));
        }
      } catch (err) { console.error(err); }

      setIsLoadingData(false);
    } catch (error) {
      setDataError("Unable to load data.");
      setIsLoadingData(false);
    }
  }, [currentUserId, isRefreshing]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAllOverview().then(() => setIsRefreshing(false));
  }, [fetchAllOverview]);

  useFocusEffect(useCallback(() => {
    setCurrentUserId(userId);
    if (userId) fetchAllOverview();
  }, [userId, fetchAllOverview]));

  const handleViewAllChits = () => { Vibration.vibrate(50); navigation.navigate("Mygroups", { userId: currentUserId }); };
  const handleViewAllPigme = () => { Vibration.vibrate(50); navigation.navigate("ReportList", { userId: currentUserId }); };
  const handleViewAllLoans = () => { Vibration.vibrate(50); navigation.navigate("MyLoan", { userId: currentUserId }); };

  // --- SKELETON LOADING UI ---
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Loading Header Text */}
      <ShimmerPlaceholder style={{ height: 26, width: 200, borderRadius: 4, marginBottom: 8, alignSelf: 'center' }} />
      <ShimmerPlaceholder style={{ height: 14, width: 250, borderRadius: 4, marginBottom: 30, alignSelf: 'center' }} />
      
      {/* Cards */}
      <ShimmerPlaceholder style={{ height: 160, borderRadius: 20, marginBottom: 20 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
         <ShimmerPlaceholder style={{ height: 160, width: (width - 60) / 2, borderRadius: 20 }} />
         <ShimmerPlaceholder style={{ height: 160, width: (width - 60) / 2, borderRadius: 20 }} />
      </View>
      <ShimmerPlaceholder style={{ height: 160, borderRadius: 20, marginBottom: 20 }} />
      <ShimmerPlaceholder style={{ height: 90, borderRadius: 20 }} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Header userId={currentUserId} navigation={navigation} title="My Passbook" />

      <ScrollView 
        style={styles.mainScrollView} 
        contentContainerStyle={styles.mainScrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#053B90", "#0c7596ff"]}
            tintColor="#053B90"
          />
        }
      >
        {isLoadingData ? (
          <View style={styles.contentArea}>
             {renderSkeleton()}
          </View>
        ) : (
          <>
            {/* SECTION 1: WHITE CONTAINER (CARDS) */}
            <View style={styles.contentArea}>
              <FadeInUp delay={0}>
                <Text style={styles.mainTitle}>Your Financial Snapshot</Text>
                <Text style={styles.subtitle}>Track your investments, savings, and loans.</Text>
              </FadeInUp>

              {/* SECTION 1: CHIT PORTFOLIO */}
              <FadeInUp delay={100}>
                {chitGroups.length > 0 ? (
                  <ScalePress style={[styles.financeCard, styles.chitCard]} onPress={handleViewAllChits}>
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        <View style={styles.iconWrapper}>
                          <MaterialIcons name="account-balance-wallet" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.cardTitle}>Chit Portfolio</Text>
                      </View>
                      {/* ANIMATED BUTTON */}
                      <AnimatedButton onPress={handleViewAllChits} style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All</Text>
                      </AnimatedButton>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardLabel}>Total Investment</Text>
                      <Text style={styles.cardAmount}>₹ {totalPaid.toLocaleString("en-IN")}</Text>
                      
                      {totalProfit > 0 ? (
                         <>
                            <View style={styles.cardDivider} />
                            <View style={styles.subStats}>
                              <View>
                                <Text style={styles.subLabel}>Total Profit</Text>
                                <Text style={[styles.subAmount, { color: '#4ade80' }]}>+ ₹ {totalProfit.toLocaleString("en-IN")}</Text>
                              </View>
                              <View style={styles.activeBadge}>
                                 <Text style={styles.activeBadgeText}>{enrolledGroupsCount} Active</Text>
                              </View>
                            </View>
                         </>
                      ) : (
                        <View style={[styles.subStats, { justifyContent: 'flex-end', marginTop: 10 }]}>
                          <View style={styles.activeBadge}>
                             <Text style={styles.activeBadgeText}>{enrolledGroupsCount} Active</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </ScalePress>
                ) : (
                  <ScalePress style={styles.actionCardChit} onPress={() => navigation.navigate("Discover")}>
                    <View style={styles.actionIconBg}>
                        <MaterialIcons name="add-circle-outline" size={36} color="#FFFFFF" />
                    </View>
                    <View style={styles.actionTextContent}>
                      <Text style={styles.actionTitle}>Join a Chit Group</Text>
                      <Text style={styles.actionSub}>Invest today to grow your savings.</Text>
                    </View>
                  </ScalePress>
                )}
              </FadeInUp>

              {/* SECTION 2: PIGMY SAVINGS */}
              <FadeInUp delay={200}>
                {pigmeAccounts.length > 0 ? (
                  <ScalePress style={[styles.financeCard, styles.pigmyCard]} onPress={handleViewAllPigme}>
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        <View style={styles.iconWrapper}>
                          <FontAwesome5 name="piggy-bank" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.cardTitle}>Pigmy Savings</Text>
                      </View>
                      {/* ANIMATED BUTTON */}
                      <AnimatedButton onPress={handleViewAllPigme} style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All</Text>
                      </AnimatedButton>
                    </View>
                    <View style={[styles.cardBody, styles.centerBody]}>
                      <Text style={styles.cardLabel}>Total Savings</Text>
                      <Text style={styles.cardAmount}>₹ {totalPigmySavings.toLocaleString("en-IN")}</Text>
                      <View style={styles.activeBadgeInline}>
                          <Text style={styles.activeBadgeText}>{activePigmeCount} Active Accounts</Text>
                      </View>
                    </View>
                  </ScalePress>
                ) : (
                  <ScalePress style={styles.actionCardPigmy}>
                    <View style={[styles.actionIconBg, { backgroundColor: '#0c7596ff' }]}>
                        <FontAwesome5 name="piggy-bank" size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.actionTextContent}>
                      <Text style={[styles.actionTitle, { color: '#0c7596ff' }]}>Apply for Pigmy</Text>
                      <Text style={styles.actionSub}>Start your daily savings journey.</Text>
                      
                      <View style={styles.contactBlock}>
                        <Text style={styles.contactLabel}>Contact to Apply:</Text>
                        <Text style={styles.contactDetails}>info.mychits@gmail.com</Text>
                        <Text style={styles.contactDetails}>+91 94839 00777</Text>
                      </View>
                    </View>
                  </ScalePress>
                )}
              </FadeInUp>

              {/* SECTION 3: LOAN SUMMARY */}
              <FadeInUp delay={300}>
                {loans.length > 0 ? (
                  <ScalePress style={[styles.financeCard, styles.loanCard]} onPress={handleViewAllLoans}>
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        <View style={styles.iconWrapper}>
                          <Ionicons name="cash-outline" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.cardTitle}>Loan Summary</Text>
                      </View>
                      {/* ANIMATED BUTTON */}
                      <AnimatedButton onPress={handleViewAllLoans} style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All</Text>
                      </AnimatedButton>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardLabel}>Outstanding Balance</Text>
                      <Text style={styles.cardAmount}>₹ {(totalLoanAmount - totalLoanPaid).toLocaleString("en-IN")}</Text>
                      <View style={styles.cardDivider} />
                      <View style={styles.subStats}>
                        <View>
                          <Text style={styles.subLabel}>Total Repaid</Text>
                          <Text style={styles.subAmount}>₹ {totalLoanPaid.toLocaleString("en-IN")}</Text>
                        </View>
                        <View style={styles.activeBadge}>
                           <Text style={styles.activeBadgeText}>{activeLoanCount} Active</Text>
                        </View>
                      </View>
                    </View>
                  </ScalePress>
                ) : (
                  <ScalePress style={styles.actionCardLoan} onPress={handleViewAllLoans}>
                    <View style={[styles.actionIconBg, { backgroundColor: '#E67E22' }]}>
                        <Ionicons name="cash-outline" size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.actionTextContent}>
                      <Text style={[styles.actionTitle, { color: '#E67E22' }]}>Apply for a Loan</Text>
                      <Text style={styles.actionSub}>Quick financial assistance when you need it.</Text>
                    </View>
                  </ScalePress>
                )}
              </FadeInUp>
            </View>

            {/* SECTION 2: BOTTOM BLUE AREA (STATS) */}
            <View style={styles.bottomBlueArea}>
               <FadeInUp delay={400}>
                  <Text style={styles.summarySentenceBlue}>Your Active Services</Text>
                  <View style={styles.statsContainerBlue}>
                    <View style={styles.statItem}>
                      <MaterialIcons name="group" size={28} color="#053B90" />
                      <Text style={styles.statValue}>{enrolledGroupsCount}</Text>
                      <Text style={styles.statLabel}>Chit Groups</Text>
                    </View>
                    {pigmeAccounts.length > 0 && (
                      <View style={styles.statDivider} />
                    )}
                    {pigmeAccounts.length > 0 && (
                      <View style={styles.statItem}>
                        <FontAwesome5 name="piggy-bank" size={24} color="#0c7596ff" />
                        <Text style={styles.statValue}>{activePigmeCount}</Text>
                        <Text style={styles.statLabel}>Pigmy </Text>
                      </View>
                    )}
                    {pigmeAccounts.length > 0 && loans.length > 0 && (
                      <View style={styles.statDivider} />
                    )}
                    {loans.length > 0 && (
                      <View style={styles.statItem}>
                        <MaterialIcons name="account-balance" size={28} color="#E67E22" />
                        <Text style={styles.statValue}>{activeLoanCount}</Text>
                        <Text style={styles.statLabel}>Loans</Text>
                      </View>
                    )}
                  </View>
               </FadeInUp>
            </View>

          </>
        )}
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex:1, backgroundColor: "#053B90" },
  mainScrollView: { flex: 1 },
  mainScrollViewContent: { flexGrow: 1, paddingBottom: 20 },
  
  // --- Layout & Typography ---
  contentArea: { 
    backgroundColor: "#F8FAFC", 
    marginHorizontal: 15, 
    marginTop: 15, 
    borderRadius: 30, 
    padding: 25, 
    minHeight: 200, // Minimum height even if empty
    marginBottom: 20,
  },
  
  // --- NEW: Bottom Blue Area Styles ---
  bottomBlueArea: {
    backgroundColor: "#053B90", // Matches header background
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -10, // Slight overlap or pull up
    marginHorizontal: 0,
  },

  mainTitle: { fontSize: 26, fontWeight: "800", color: "#1e293b", marginBottom: 5, textAlign: "center", letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 30, textAlign: "center" },

  // --- Skeleton Styles ---
  skeletonContainer: { paddingVertical: 15 },
  shimmer: { backgroundColor: "#E2E8F0", borderRadius: 12 },

  // --- Finance Cards ---
  financeCard: { 
    borderRadius: 22, 
    marginBottom: 20, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
    overflow: "hidden"
  },
  chitCard: { 
    backgroundColor: "#c761db", 
    borderTopWidth: 1, borderTopColor: "#68348a", 
    borderBottomWidth: 1, borderBottomColor: "#6e1057"
  },
  pigmyCard: { 
    backgroundColor: "#0c7596ff", 
    borderTopWidth: 1, borderTopColor: "#109bbf", 
    borderBottomWidth: 1, borderBottomColor: "#065a72" 
  },
  loanCard: { 
    backgroundColor: "#E67E22", 
    borderTopWidth: 1, borderTopColor: "#F39C12", 
    borderBottomWidth: 1, borderBottomColor: "#C06014" 
  },

  // Card Header
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 5 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: {
    width: 50, height: 50,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255, 0.15)",
    justifyContent: "center", alignItems: "center",
    marginRight: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)"
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5 },
  viewAllBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  viewAllText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },

  // Card Body
  cardBody: { padding: 20, paddingTop: 10 },
  centerBody: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  cardLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  cardAmount: { fontSize: 36, fontWeight: "800", color: "#FFFFFF", marginTop: 5, marginBottom: 15, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 4 },
  cardDivider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.15)", marginVertical: 15 },

  // Stats inside Cards
  subStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subLabel: { fontSize: 14, color: "rgba(255, 255, 255, 0.8)", fontWeight: "600", marginBottom: 4 },
  subAmount: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  activeBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  activeBadgeText: { fontSize: 12, color: "#FFF", fontWeight: "700", letterSpacing: 0.5 },
  activeBadgeInline: { marginTop: 12, alignSelf: 'center' },

  // --- Action / Apply Cards ---
  actionCardChit: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 25, borderRadius: 22, marginBottom: 20, shadowColor: "#053B90", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  actionCardPigmy: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 25, borderRadius: 22, marginBottom: 20, shadowColor: "#0c7596ff", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  actionCardLoan: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 25, borderRadius: 22, marginBottom: 20, shadowColor: "#E67E22", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#E2E8F0' },

  actionIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#053B90', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  actionTextContent: { flex: 1 },
  actionTitle: { fontSize: 18, fontWeight: "800", color: '#053B90', marginBottom: 2 },
  actionSub: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  contactBlock: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 12, marginTop: 5 },
  contactLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 3, textTransform: 'uppercase' },
  contactDetails: { fontSize: 12, color: '#334155', fontWeight: '600', marginBottom: 1 },

  // --- Bottom Summary Section (Updated for Blue Background) ---
  summarySentenceBlue: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 15, marginTop: 0 }, // Changed color to White
  statsContainerBlue: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    backgroundColor: "#FFFFFF", // Solid white for contrast
    borderRadius: 25, 
    padding: 20, 
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 24, fontWeight: "800", marginTop: 8, marginBottom: 2, color: "#0f172a" },
  statLabel: { fontSize: 8, color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: "#E2E8F0" },
});

export default MyPassbookScreen;