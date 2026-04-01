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
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons } from "@expo/vector-icons";
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
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = Math.abs(num).toString().split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";
  let isNegative = num < 0;

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  const formatted = otherNumbers !== "" 
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree 
    : lastThree;

  return (isNegative ? "-" : "") + formatted + decimalPart;
};

const PayYourDues = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  const [cardsData, setCardsData] = useState([]);
  const [groupOverviews, setGroupOverviews] = useState({});
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setModalVisible] = useState(false);
  const [modalDetails, setModalDetails] = useState({ groupId: null, ticket: null, amount: 0, groupName: "" });
  const [paymentAmount, setPaymentAmount] = useState("");
  const amountInputRef = useRef(null);

  const fetchTicketsData = useCallback(async (currentUserId) => {
    try {
      const response = await axios.post(`${url}/enroll/get-user-tickets/${currentUserId}`, { source: "mychits-customer-app" });
      return response.data || [];
    } catch (error) {
      return [];
    }
  }, []);

  const fetchIndividualGroupOverview = useCallback(async (currentUserId, card) => {
    try {
      const response = await axios.get(`${url}/overview/single?user_id=${currentUserId}&group_id=${card.group_id._id}&ticket=${card.tickets}`);
      return { key: `${card.group_id._id}_${card.tickets}`, data: response.data };
    } catch (error) {
      return { key: null, data: null };
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fetchedCards = await fetchTicketsData(userId);
      const filtered = fetchedCards.filter(card => card.group_id && !card.group_id.group_name?.toLowerCase().includes("loan"));
      setCardsData(filtered);

      if (filtered.length > 0) {
        const results = await Promise.all(filtered.map(card => fetchIndividualGroupOverview(userId, card)));
        const newOverviews = {};
        results.forEach(res => { if (res.key) newOverviews[res.key] = res.data; });
        setGroupOverviews(newOverviews);
      }
    } catch (error) {
      console.error("Data fetch error", error);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchTicketsData, fetchIndividualGroupOverview]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handlePayNow = (groupId, ticket, amount, groupName) => {
    Vibration.vibrate(50);
    setModalDetails({ groupId, ticket, amount: Math.abs(amount), groupName });
    setPaymentAmount("");
    setModalVisible(true);
  };

  useEffect(() => {
    if (isModalVisible) setTimeout(() => amountInputRef.current?.focus(), 300);
  }, [isModalVisible]);

  const handlePaymentInitiate = async () => {
    const amountToPay = parseFloat(paymentAmount || modalDetails.amount);
    if (amountToPay < 100 || amountToPay > 20000) {
      Alert.alert("Invalid Amount", "Please enter between ₹100 and ₹20,000.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${url}/paymentapi/app/add`, {
        user_id: userId,
        expiry: "3600",
        amount: `${amountToPay}`,
        purpose: "Due Payment",
        payment_group_tickets: [`chit-${modalDetails.groupId}|${modalDetails.ticket}`],
        source: "mychits-customer-app",
      });
      if (response.data?.link_url) {
        await Linking.openURL(response.data.link_url);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to initiate payment.");
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      <Header userId={userId} navigation={navigation} />
      
      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <Text style={styles.sectionTitle}>Pay Your Dues</Text>
          <Text style={styles.subSectionTitle}>Stay on top of your chit payments!</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryBlue} style={styles.loader} />
          ) : cardsData.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {cardsData.map((card, index) => {
                const overview = groupOverviews[`${card.group_id._id}_${card.tickets}`];
                if (!overview) return null;

                const totalPayable = overview?.total_payable || 0;
                const totalPaid = overview?.total_investment || 0;
                const totalProfit = overview?.total_profit || 0;
                const totalBalance = overview?.total_balance || 0;

                const isBalanceExcess = totalBalance > 0;

                return (
                  <TouchableOpacity 
                    key={card._id || index} 
                    style={styles.groupCardEnhanced}
                    onPress={() => navigation.navigate("EnrollGroup", { groupId: card.group_id._id, ticket: card.tickets })}
                  >
                    <LinearGradient colors={[Colors.cardGradientStart, Colors.cardGradientEnd]} style={styles.cardContentWrapper}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.groupCardNameEnhanced}>{card.group_id.group_name}</Text>
                        <Text style={styles.groupCardTicketEnhanced}>Ticket: {card.tickets}</Text>
                      </View>

                      <View style={styles.financialDetailsSection}>
                        <DetailRow label="Total Payable" value={totalPayable} />
                        <DetailRow label="Total Paid" value={totalPaid} />
                        <DetailRow label="Profit/Dividend" value={totalProfit} />
                      </View>

                      <LinearGradient
                        colors={isBalanceExcess ? [Colors.excessBackgroundStart, Colors.excessBackgroundEnd] : [Colors.duesBackgroundStart, Colors.duesBackgroundEnd]}
                        style={styles.balanceStatusBox}
                      >
                        <View style={styles.balanceSummary}>
                          <MaterialIcons 
                            name={isBalanceExcess ? "check-circle" : "error-outline"} 
                            size={22} 
                            color={isBalanceExcess ? Colors.successColor : Colors.warningColor} 
                          />
                          <Text style={styles.balanceMessage}>{isBalanceExcess ? "Excess Balance" : "Pending Payment"}</Text>
                          <Text style={[styles.balanceAmount, { color: isBalanceExcess ? Colors.successColor : Colors.warningColor }]}>
                            ₹ {formatNumberIndianStyle(totalBalance)}
                          </Text>
                        </View>

                        {!isBalanceExcess && (
                          <TouchableOpacity 
                            style={styles.payNowButton} 
                            onPress={() => handlePayNow(card.group_id._id, card.tickets, totalBalance, card.group_id.group_name)}
                          >
                            <Text style={styles.payNowButtonText}>Pay Now</Text>
                            <MaterialIcons name="payment" size={18} color="white" style={{ marginLeft: 8 }} />
                          </TouchableOpacity>
                        )}
                      </LinearGradient>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noGroupsContainer}>
              <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
              <Text style={styles.noGroupsText}>No Active Dues</Text>
            </View>
          )}
        </View>
      </View>

      {/* Payment Modal */}
      <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)} style={styles.modal}>
        <View style={styles.modalContent}>
          <Text style={styles.companyName}>MyChits Payment</Text>
          <Text style={styles.duePaymentText}>{modalDetails.groupName}</Text>
          
          <View style={styles.outstandingAmountBox}>
            <Text style={styles.outstandingAmountLabel}>Outstanding:</Text>
            <Text style={styles.outstandingAmountTextModal}>₹ {formatNumberIndianStyle(modalDetails.amount)}</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                ref={amountInputRef}
                style={styles.textInput}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter amount"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.payNowButtonModal} onPress={handlePaymentInitiate}>
            <Text style={styles.payNowButtonTextModal}>Confirm ₹{formatNumberIndianStyle(paymentAmount || modalDetails.amount)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailAmount}>₹ {formatNumberIndianStyle(value)}</Text>
  </View>
);

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#053B90" },
  outerBoxContainer: { flex: 1, backgroundColor: "#F9FCFF", marginHorizontal: 15, marginBottom: 20, borderRadius: 25, overflow: "hidden" },
  mainContentWrapper: { flex: 1, backgroundColor: "#FFF", paddingHorizontal: 20, paddingTop: 18 },
  sectionTitle: { fontWeight: "bold", fontSize: 22, color: "#263238", textAlign: "center" },
  subSectionTitle: { fontSize: 13, color: "#546E7A", textAlign: "center", marginBottom: 20 },
  groupCardEnhanced: { marginVertical: 10, borderRadius: 15, overflow: "hidden", borderWidth: 1, borderColor: "#ECEFF1" },
  cardContentWrapper: { padding: 15 },
  cardHeader: { borderBottomWidth: 1, borderBottomColor: "#ECEFF1", paddingBottom: 8, marginBottom: 10 },
  groupCardNameEnhanced: { fontWeight: "bold", fontSize: 18, color: "#1976D2" },
  groupCardTicketEnhanced: { fontSize: 14, color: "#546E7A" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  detailLabel: { color: "#546E7A", fontSize: 14 },
  detailAmount: { fontWeight: "bold", color: "#263238", fontSize: 14 },
  balanceStatusBox: { padding: 12, borderRadius: 12, marginTop: 10, alignItems: "center" },
  balanceSummary: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  balanceMessage: { fontSize: 14, fontWeight: "600", color: "#263238", marginHorizontal: 8 },
  balanceAmount: { fontSize: 16, fontWeight: "bold" },
  payNowButton: { flexDirection: "row", backgroundColor: "#007BFF", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20 },
  payNowButtonText: { color: "#FFF", fontWeight: "bold" },
  noGroupsContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noGroupImage: { width: 150, height: 150 },
  noGroupsText: { fontSize: 18, color: "#263238", fontWeight: "bold", marginTop: 10 },
  modal: { justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFF", padding: 20, borderRadius: 20, width: "90%", alignItems: "center", borderWidth: 2, borderColor: "#053B90" },
  companyName: { fontSize: 24, fontWeight: "bold", color: "#263238", marginBottom: 5 },
  duePaymentText: { fontSize: 16, color: "#546E7A", marginBottom: 15 },
  outstandingAmountBox: { backgroundColor: "#F9FCFF", padding: 15, borderRadius: 10, width: "100%", flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  outstandingAmountLabel: { fontSize: 14, color: "#546E7A", marginRight: 10 },
  outstandingAmountTextModal: { fontSize: 18, fontWeight: "bold", color: "#D32F2F" },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#053B90", borderRadius: 10, width: "100%", height: 50, paddingHorizontal: 15 },
  currencySymbol: { fontSize: 18, color: "#546E7A", marginRight: 5 },
  textInput: { flex: 1, fontSize: 18 },
  payNowButtonModal: { backgroundColor: "#007BFF", paddingVertical: 15, borderRadius: 25, width: "100%", alignItems: "center", marginTop: 20 },
  payNowButtonTextModal: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  modalCloseButton: { marginTop: 15 },
  modalCloseButtonText: { color: "#546E7A", fontWeight: "600" },
});

export default PayYourDues;