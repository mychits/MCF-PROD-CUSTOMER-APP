import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
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
  Linking,
  TextInput,
  Alert,
  Animated,
  Easing,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";
import Modal from "react-native-modal";

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F9FCFF",
  cardBackground: "#FFFFFF",
  darkText: "#263238",
  mediumText: "#546E7A",
  lightText: "#B0BEC5",
  cardGradientStart: "#FFFFFF",
  cardGradientEnd: "#F5F8FA",
  excessBackgroundStart: "#E8F5E9",
  excessBackgroundEnd: "#F2FAF2",
  duesBackgroundStart: "#FBE9E7",
  duesBackgroundEnd: "#FFF6F5",
  successColor: "#388E3C",
  warningColor: "#D32F2F",
  payNowButtonBackground: "#007BFF",
  payNowButtonText: "#FFFFFF",
  shadowColor: "rgba(0,0,0,0.08)",
  borderColor: "#ECEFF1",
  groupNameColor: "#1976D2",
  logoBackgroundColor: "#FFFFFF",
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";
  let isNegative = false;
  if (integerPart.startsWith("-")) {
    isNegative = true;
    integerPart = integerPart.substring(1);
  }
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return (isNegative ? "-" : "") + formattedOtherNumbers + "," + lastThree + decimalPart;
  } else {
    return (isNegative ? "-" : "") + lastThree + decimalPart;
  }
};

const PayYourDues = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [TotalToBepaid, setTotalToBePaid] = useState(0);
  const [Totalpaid, setTotalPaid] = useState(0);
  const [Totalprofit, setTotalProfit] = useState(0);
  const [groupOverviews, setGroupOverviews] = useState({});

  const [isModalVisible, setModalVisible] = useState(false);
  const [modalDetails, setModalDetails] = useState({
    groupId: null,
    ticket: null,
    amount: 0,
    penalty: 0,
    lateCharge: 0,
    groupName: "",
  });
  const [paymentAmount, setPaymentAmount] = useState("");

  const amountInputRef = useRef(null);
  const scaleAnims = useRef({}).current;

  // --- Warning Animations ---
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous loop: Pulse Scale + Opacity + Periodic Shake
    const runAnimation = () => {
      Animated.loop(
        Animated.parallel([
          // Scale Pulse
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          ]),
          // Opacity Pulse (Glow effect)
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ]),
          // Periodic Shake (Wiggle)
          Animated.sequence([
            Animated.delay(2000),
            Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.delay(2000),
          ])
        ])
      ).start();
    };
    runAnimation();
  }, []);

  const rotation = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg']
  });

  // -------------------------

  const focusInput = () => {
    if (amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current.focus();
      }, 200);
    }
  };

  const openLinkOnBrowser = useCallback(async (paymentUrl) => {
    const supported = await Linking.canOpenURL(paymentUrl);
    if (supported) await Linking.openURL(paymentUrl);
    else throw new Error("Failed to Open Url");
  }, []);

  const fetchTicketsData = useCallback(async (currentUserId) => {
    if (!currentUserId) return [];
    try {
      const response = await axios.post(`${url}/enroll/get-user-tickets/${currentUserId}`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching tickets:", error);
      return [];
    }
  }, []);

  const fetchAllOverviewData = useCallback(async (currentUserId) => {
    if (!currentUserId) return { totalToBePaid: 0, totalPaid: 0, totalProfit: 0 };
    try {
      const response = await axios.post(`${url}/enroll/get-user-tickets-report/${currentUserId}`);
      const data = response.data;
      const totalToBePaidAmount = data.reduce((sum, group) => sum + (group?.payable?.totalPayable + (parseInt(group?.enrollment?.group?.group_install) || 0) || 0), 0);
      const totalPaidAmount = data.reduce((sum, group) => sum + (group?.payments?.totalPaidAmount || 0), 0);
      const totalProfitAmount = data.reduce((sum, group) => sum + (group?.profit?.totalProfit || 0), 0);
      return { totalToBePaid: totalToBePaidAmount, totalPaid: totalPaidAmount, totalProfit: totalProfitAmount };
    } catch (error) {
      console.error("Error fetching overview:", error);
      return { totalToBePaid: 0, totalPaid: 0, totalProfit: 0 };
    }
  }, []);

  const fetchIndividualGroupOverview = useCallback(async (currentUserId, card) => {
    try {
      if (!currentUserId || !card.group_id?._id || !card.tickets) return { key: null, data: null };

      const penaltyUrl = `${url}/penalty/outstanding/${currentUserId}`;
      const [overviewRes, penaltyRes] = await Promise.all([
        axios.get(`${url}/single-overview?user_id=${currentUserId}&group_id=${card.group_id._id}&ticket=${card.tickets}`),
        axios.get(penaltyUrl)
      ]);

      const groupData = overviewRes.data;
      const penaltyListData = penaltyRes.data?.data || [];
      const specificTicketPenalty = penaltyListData.find(item => String(item.ticket_number) === String(card.tickets));

      return {
        key: `${card.group_id._id}_${card.tickets}`,
        data: {
          ...groupData,
          totalToBePaidAmount: groupData?.totalInvestment || 0,
          penaltyAmount: specificTicketPenalty?.summary?.total_penalty || 0,
          lateChargeAmount: specificTicketPenalty?.summary?.total_late_payment_charges || 0,
        },
      };
    } catch (error) {
      console.error(`Error fetching group details:`, error);
      return { key: null, data: null };
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [fetchedCards, overviewSummary] = await Promise.all([
        fetchTicketsData(userId),
        fetchAllOverviewData(userId),
      ]);

      setCardsData(fetchedCards);
      setTotalToBePaid(overviewSummary.totalToBePaid);
      setTotalPaid(overviewSummary.totalPaid);
      setTotalProfit(overviewSummary.totalProfit);

      if (fetchedCards.length > 0) {
        const overviewPromises = fetchedCards.map((card) => fetchIndividualGroupOverview(userId, card));
        const results = await Promise.all(overviewPromises);
        const newGroupOverviews = {};
        const animations = [];

        results.forEach((result, index) => {
          if (result.key && result.data) {
            newGroupOverviews[result.key] = result.data;
            if (!scaleAnims[result.key]) scaleAnims[result.key] = new Animated.Value(0);
            animations.push(Animated.spring(scaleAnims[result.key], { toValue: 1, friction: 8, tension: 40, delay: index * 100, useNativeDriver: true }));
          }
        });
        setGroupOverviews(newGroupOverviews);
        Animated.parallel(animations).start();
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchTicketsData, fetchAllOverviewData, fetchIndividualGroupOverview]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const filteredCardsToDisplay = cardsData.filter((card) => {
    const isLoanGroup = card.group_id?.group_name ? card.group_id?.group_name.toLowerCase().includes("loan") : false;
    return card.group_id !== null && !isLoanGroup;
  });

  const handleViewDetails = (groupId, ticket) => {
    Vibration.vibrate(50);
    navigation.navigate("BottomTab", {
      screen: "EnrollTab",
      params: { screen: "EnrollGroup", params: { userId: userId, groupId: groupId, ticket: ticket } },
    });
  };

  const handlePayNow = (groupId, ticket, amount, groupName, penalty, lateCharge) => {
    Vibration.vibrate(50);
    setModalDetails({ groupId, ticket, amount, penalty: penalty || 0, lateCharge: lateCharge || 0, groupName });
    setPaymentAmount("");
    setModalVisible(true);
  };

  const handleModalClose = () => { setModalVisible(false); };

  const handlePaymentInitiate = async () => {
    Vibration.vibrate(50);
    const baseAmount = parseFloat(modalDetails.amount) || 0;
    const penaltyAmount = parseFloat(modalDetails.penalty) || 0;
    const lateChargeAmount = parseFloat(modalDetails.lateCharge) || 0;
    const totalDue = baseAmount + penaltyAmount + lateChargeAmount;
    
    const amountToPay = parseFloat(paymentAmount || totalDue);

    if (amountToPay > 20000) {
      Alert.alert("Limit Reached", "You can pay up to ₹20,000 at a time.");
      return;
    }
    if (isNaN(amountToPay) || amountToPay < 100) {
      Alert.alert("Invalid Amount", "Minimum amount is ₹100.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${url}/paymentapi/app/add`, {
        user_id: userId,
        amount: `${amountToPay}`,
        purpose: "Due Payment (Inc. Penalty & Late Charges)",
        payment_group_tickets: [`chit-${modalDetails.groupId}|${modalDetails.ticket}`],
      });
      const data = response.data;
      Alert.alert("Payment Initiated", `A payment of ₹${formatNumberIndianStyle(amountToPay)} for ${modalDetails.groupName} is being processed.`, [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: async () => { await openLinkOnBrowser(data?.link_url); } },
      ]);
    } catch (error) {
      Alert.alert("Failed", "Something Went Wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (text) => {
    const filteredText = text.replace(/[^0-9]/g, "");
    if (parseFloat(filteredText) > 20000) {
      Alert.alert("Limit Reached", "You can pay up to ₹20,000 at a time.");
      return;
    }
    setPaymentAmount(filteredText);
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      <Header userId={userId} navigation={navigation} />
      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <Text style={styles.sectionTitle}>Pay Your Outstanding Amount</Text>
          <Text style={styles.subSectionTitle}>Stay on top of your group payments!</Text>

          {/* Enhanced Animated Warning */}
          <Animated.View style={[
            styles.globalWarningContainer, 
            { 
              transform: [{ scale: pulseAnim }, { rotate: rotation }], 
              opacity: opacityAnim 
            }
          ]}>
            <MaterialCommunityIcons name="alert-decagram" size={20} color="#92400E" style={{ marginRight: 8 }} />
            <Text style={styles.globalWarningText}>
           Pay on time to stay penalty-free. Late dues incur daily charges.
            </Text>
          </Animated.View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryBlue} style={styles.loader} />
          ) : filteredCardsToDisplay.length > 0 ? (
            <ScrollView contentContainerStyle={styles.groupListContentContainer} showsVerticalScrollIndicator={false}>
              {filteredCardsToDisplay.map((card, index) => {
                const cardKey = `${card.group_id._id}_${card.tickets}`;
                const groupOverview = groupOverviews[cardKey];
                if (!groupOverview) return null;

                const totalPaid = groupOverview?.totalPaid || 0;
                const totalProfit = groupOverview?.totalProfit || 0;
                const penaltyAmount = groupOverview?.penaltyAmount || 0;
                const lateChargeAmount = groupOverview?.lateChargeAmount || 0;
                const totalToBePaidAmount = groupOverview?.totalInvestment || 0;
                
                const balance = totalPaid - totalToBePaidAmount;
                const isBalanceExcess = balance > 0;
                
                const finalOutstanding = Math.abs(balance) + penaltyAmount + lateChargeAmount;

                const balanceBoxColors = isBalanceExcess ? [Colors.excessBackgroundStart, Colors.excessBackgroundEnd] : [Colors.duesBackgroundStart, Colors.duesBackgroundEnd];
                const balanceIcon = isBalanceExcess ? "check-circle" : "credit-card-off";
                const balanceIconColor = isBalanceExcess ? Colors.successColor : Colors.warningColor;
                const balanceMessage = isBalanceExcess ? "You have an excess balance." : "Total Outstanding Due";

                return (
                  <Animated.View key={card._id || index} style={{ transform: [{ scale: scaleAnims[cardKey] || 1 }] }}>
                    <TouchableOpacity onPress={() => handleViewDetails(card.group_id._id, card.tickets)} style={styles.groupCardEnhanced}>
                      <LinearGradient colors={[Colors.cardGradientStart, Colors.cardGradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardContentWrapper}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.groupCardNameEnhanced}>{card.group_id?.group_name}</Text>
                          <Text style={styles.groupCardTicketEnhanced}>Ticket: {card.tickets}</Text>
                        </View>
                        <View style={styles.financialDetailsSection}>
                          <View style={styles.detailRow}><Text style={styles.detailLabel}>Total Paid:</Text><Text style={styles.detailAmount}>₹ {formatNumberIndianStyle(totalPaid)}</Text></View>
                          <View style={styles.detailRow}><Text style={styles.detailLabel}>Profit/Dividend:</Text><Text style={styles.detailAmount}>₹ {formatNumberIndianStyle(totalProfit)}</Text></View>
                          <View style={styles.detailRow}><Text style={styles.detailLabel}>Base Dues:</Text><Text style={styles.detailAmount}>₹ {formatNumberIndianStyle(Math.abs(balance))}</Text></View>
                          
                          {!isBalanceExcess && (
                            <>
                              <View style={styles.detailRow}>
                                <Text style={styles.negligibleLabel}>Penalty:</Text>
                                <Text style={styles.negligibleAmount}>₹ {formatNumberIndianStyle(penaltyAmount)}</Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Text style={styles.negligibleLabel}>Late Payment Charges:</Text>
                                <Text style={styles.negligibleAmount}>₹ {formatNumberIndianStyle(lateChargeAmount)}</Text>
                              </View>
                            </>
                          )}
                        </View>

                        <LinearGradient colors={balanceBoxColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceStatusBox}>
                          <View style={styles.balanceSummary}>
                            <MaterialIcons name={balanceIcon} size={24} color={balanceIconColor} style={styles.balanceIcon} />
                            <Text style={styles.balanceMessage}>{balanceMessage}</Text>
                            <Text style={[styles.balanceAmount, isBalanceExcess ? styles.excessAmountText : styles.duesAmountText]}>
                              ₹ {formatNumberIndianStyle(isBalanceExcess ? Math.abs(balance) : finalOutstanding)}
                            </Text>
                          </View>
                          {!isBalanceExcess && (finalOutstanding > 0) && (
                            <TouchableOpacity onPress={() => handlePayNow(card.group_id._id, card.tickets, Math.abs(balance), card.group_id?.group_name, penaltyAmount, lateChargeAmount)} style={styles.payNowButton}>
                              <Text style={styles.payNowButtonText}>Pay Now</Text>
                              <MaterialIcons name="payment" size={18} color={Colors.payNowButtonText} style={{ marginLeft: 5 }} />
                            </TouchableOpacity>
                          )}
                        </LinearGradient>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noGroupsContainer}>
              <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
              <Text style={styles.noGroupsText}>No groups to display.</Text>
            </View>
          )}
        </View>
      </View>

      <Modal 
        isVisible={isModalVisible} 
        onBackdropPress={handleModalClose} 
        onModalShow={focusInput} 
        style={styles.modal} 
        useNativeDriverForBackdrop={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.companyHeader}>
            <Image source={require("../../assets/Group400.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.companyName}>MyChits</Text>
          </View>
          <Text style={styles.duePaymentText}>Complete Your Chit Payment</Text>
          <Text style={styles.minAmountText}>Breakdown of outstanding amount:</Text>
          <View style={styles.outstandingAmountBox}>
            <View style={{ width: '100%' }}>
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalAmountLabel}>Unpaid Dues:</Text>
                <Text style={styles.modalAmountValue}>₹ {formatNumberIndianStyle(modalDetails.amount)}</Text>
              </View>
              <View style={styles.modalAmountRow}>
                <Text style={styles.negligibleModalLabel}>Penalty:</Text>
                <Text style={styles.negligibleModalValue}>₹ {formatNumberIndianStyle(modalDetails.penalty)}</Text>
              </View>
              <View style={styles.modalAmountRow}>
                <Text style={styles.negligibleModalLabel}>Late Charges:</Text>
                <Text style={styles.negligibleModalValue}>₹ {formatNumberIndianStyle(modalDetails.lateCharge)}</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalAmountRow}>
                <Text style={[styles.modalAmountLabel, { fontWeight: 'bold', color: Colors.darkText }]}>Total Payable:</Text>
                <Text style={styles.outstandingAmountTextModal}>
                    ₹ {formatNumberIndianStyle(parseFloat(modalDetails.amount) + parseFloat(modalDetails.penalty) + parseFloat(modalDetails.lateCharge))}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter Amount to Pay</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput 
                style={styles.textInput} 
                keyboardType="numeric" 
                value={paymentAmount} 
                onChangeText={handleAmountChange} 
                placeholder="Enter amount" 
                placeholderTextColor={Colors.mediumText} 
                ref={amountInputRef}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.payNowButtonModal} onPress={handlePaymentInitiate} activeOpacity={0.8}>
            {loading ? <ActivityIndicator size={"large"} color={"white"} /> : 
            <Text style={styles.payNowButtonTextModal}>
                Pay ₹{formatNumberIndianStyle(paymentAmount || (parseFloat(modalDetails.amount) + parseFloat(modalDetails.penalty) + parseFloat(modalDetails.lateCharge)))} Now
            </Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleModalClose} style={styles.modalCloseButton}><Text style={styles.modalCloseButtonText}>Cancel</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: Colors.primaryBlue },
  outerBoxContainer: { flex: 1, backgroundColor: Colors.lightBackground, marginHorizontal: 15, marginBottom: 55, borderRadius: 25, overflow: "hidden" },
  mainContentWrapper: { flex: 1, backgroundColor: Colors.cardBackground, paddingHorizontal: 25, paddingTop: 18, paddingBottom: 20 },
  sectionTitle: { fontWeight: "bold", fontSize: 24, color: Colors.darkText, textAlign: "center" },
  subSectionTitle: { fontSize: 13, color: Colors.mediumText, textAlign: "center", marginBottom: 10, fontWeight: "bold" },
  globalWarningContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  globalWarningText: { fontSize: 12, color: '#92400E', fontWeight: 'bold', textAlign: 'center', flex: 1 },
  groupListContentContainer: { paddingBottom: 30 },
  groupCardEnhanced: { marginVertical: 12, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.borderColor },
  cardContentWrapper: { padding: 20 },
  cardHeader: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: Colors.borderColor, paddingBottom: 10 },
  groupCardNameEnhanced: { fontWeight: "bold", fontSize: 22, color: Colors.groupNameColor, marginBottom: 5 },
  groupCardTicketEnhanced: { fontSize: 16, color: Colors.mediumText },
  financialDetailsSection: { marginBottom: 20 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  detailLabel: { fontWeight: "500", color: Colors.mediumText, flexShrink: 1, marginRight: 10, fontSize: 14 },
  detailAmount: { fontSize: 15, fontWeight: "bold", color: Colors.darkText },
  negligibleLabel: { fontSize: 12, color: Colors.lightText },
  negligibleAmount: { fontSize: 12, color: Colors.lightText },
  balanceStatusBox: { padding: 15, borderRadius: 15, marginTop: 10, alignItems: "center" },
  balanceSummary: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 5, flexWrap: "wrap" },
  balanceIcon: { marginRight: 8 },
  balanceMessage: { fontSize: 16, fontWeight: "600", color: Colors.darkText },
  balanceAmount: { fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  excessAmountText: { color: Colors.successColor },
  duesAmountText: { color: Colors.warningColor },
  payNowButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: Colors.payNowButtonBackground, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, marginTop: 5, width: "80%" },
  payNowButtonText: { color: Colors.payNowButtonText, fontSize: 16, fontWeight: "bold" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  noGroupsContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 50 },
  noGroupImage: { width: 200, height: 200, marginBottom: 25 },
  noGroupsText: { textAlign: "center", color: Colors.darkText, fontSize: 24, fontWeight: "bold" },
  modal: { justifyContent: "center", margin: 0, alignItems: "center", paddingTop: 100 },
  modalContent: { backgroundColor: Colors.cardBackground, padding: 20, borderRadius: 20, borderWidth: 3, borderColor: "#053B90", width: "90%", alignItems: "center" },
  companyHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, justifyContent: "center" },
  logo: { width: 50, height: 50, marginRight: 10 },
  companyName: { fontSize: 28, fontWeight: "bold", color: Colors.darkText },
  duePaymentText: { fontSize: 20, color: Colors.mediumText, marginBottom: 5, textAlign: "center", fontWeight: "bold" },
  minAmountText: { fontSize: 16, color: Colors.mediumText, marginBottom: 20, textAlign: "center", fontWeight: "bold" },
  outstandingAmountBox: { marginBottom: 25, padding: 15, borderRadius: 10, backgroundColor: Colors.lightBackground, width: '100%' },
  modalAmountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  modalAmountLabel: { fontSize: 15, color: Colors.mediumText },
  modalAmountValue: { fontSize: 16, fontWeight: 'bold', color: Colors.darkText },
  negligibleModalLabel: { fontSize: 13, color: Colors.lightText },
  negligibleModalValue: { fontSize: 13, color: Colors.lightText },
  modalDivider: { height: 1, backgroundColor: Colors.borderColor, marginVertical: 10 },
  outstandingAmountTextModal: { fontSize: 22, fontWeight: "bold", color: Colors.warningColor },
  inputContainer: { width: "100%", alignItems: "center", marginBottom: 30 },
  inputLabel: { fontSize: 16, fontWeight: "600", color: Colors.darkText, marginBottom: 10 },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: "#053B90", borderRadius: 10, paddingHorizontal: 15, backgroundColor: Colors.lightBackground, width: "80%", height: 50 },
  currencySymbol: { fontSize: 18, color: Colors.mediumText, marginRight: 5 },
  textInput: { flex: 1, fontSize: 18, color: Colors.darkText },
  payNowButtonModal: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: Colors.payNowButtonBackground, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, width: "80%" },
  payNowButtonTextModal: { color: Colors.payNowButtonText, fontSize: 18, fontWeight: "bold" },
  modalCloseButton: { marginTop: 10, padding: 10 },
  modalCloseButtonText: { fontSize: 16, color: Colors.mediumText, fontWeight: "600" },
});

export default PayYourDues;