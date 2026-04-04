import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import url from "../data/url";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import Toast from "react-native-toast-message";

import NoDataIllustration from "../../assets/9264885.jpg";
import { ContextProvider } from "../context/UserProvider";

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = num.toString().split('.');
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? '.' + parts[1] : '';
  let isNegative = false;
  if (integerPart.startsWith('-')) { isNegative = true; integerPart = integerPart.substring(1); }
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (isNegative ? '-' : '') + formattedOtherNumbers + ',' + lastThree + decimalPart;
  } else {
    return (isNegative ? '-' : '') + lastThree + decimalPart;
  }
};

const EnrollGroup = ({ route, navigation }) => {
  const { groupId, ticket } = route.params;
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const [groups, setGroups] = useState({});
  const [paymentData, setPaymentData] = useState([]);
  const [error, setError] = useState(null);
  const [singleOverview, setSingleOverview] = useState({});
  const [loading, setLoading] = useState(true);

  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  const handleViewMore = () => {
    navigation.navigate('ViewMore', { groupId, ticket, userId });
  };

  const statBoxBorderColors = {
    toBePaid: "#FF6347",
    totalPaid: "#800080",
    balance: "#E74C3C",
    balanceExcess: "#2ECC71",
  };
  const statBoxTextColors = {
    toBePaid: "#FF6347",
    totalPaid: "#800080",
    balance: "#E74C3C",
    balanceExcess: "#2ECC71",
  };

  const fetchData = async () => {
    if (!isConnected || !isInternetReachable) {
      setLoading(false);
      setError("No internet connection. Please check your network and try again.");
      setGroups({}); setPaymentData([]); setSingleOverview({});
      Toast.show({ type: "error", text1: "Offline", text2: "Cannot load data without internet connection.", position: "bottom", visibilityTime: 4000 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const groupResponse = await fetch(`${url}/group/get-by-id-group/${groupId}`);
      if (groupResponse.ok) { setGroups(await groupResponse.json()); }
      else { setError("Failed to load group details."); }

      const paymentResponse = await fetch(`${url}/payment/payment-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ 
          groupId, 
          userId, 
          ticket,
          source: "mychits-customer-app"
        }),
      });
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        setError(errorData.message || "An error occurred fetching payment data.");
        setPaymentData([]);
      } else {
        const paymentListData = await paymentResponse.json();
        if (paymentListData.success) {
          setPaymentData(paymentListData.data.sort((a, b) => new Date(b.pay_date) - new Date(a.pay_date)));
          setError(null);
        } else {
          setError(paymentListData.message || "No payment data available");
          setPaymentData([]);
        }
      }

      const overviewResponse = await axios.get(`${url}/overview/single?user_id=${userId}&group_id=${groupId}&ticket=${ticket}`);
      setSingleOverview(overviewResponse.data);

    } catch (err) {
      setError("An error occurred while fetching data. Please try again.");
      Toast.show({ type: "error", text1: "Data Load Error", text2: "Could not fetch all details. Please retry.", position: "bottom", visibilityTime: 4000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId, groupId, ticket, isConnected, isInternetReachable]);

  const toBePaidAmount =  singleOverview?.total_payable || 0
   

  const balanceAmount = singleOverview?.total_balance || 0;
  const isBalanceExcess = balanceAmount < 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header userId={userId} navigation={navigation} />
      <StatusBar
        barStyle={loading ? "dark-content" : "light-content"}
        backgroundColor={loading ? "#fff" : "#053B90"}
      />

      {loading ? (
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color="#053B90" />
        </View>
      ) : !isConnected || !isInternetReachable ? (
        <View style={styles.loaderContainer}>
          <Text style={styles.networkStatusText}>You are currently offline. Please check your internet connection.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : error ? (
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContentWrapper}>
          <View style={styles.contentCard}>

            {/* ── FIXED HEADER — stays pinned, does not scroll ── */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.numericGroupValue}>
                ₹ {formatNumberIndianStyle(groups.group_value || 0)}
              </Text>
              <Text style={styles.groupTitle}>{groups.group_name}</Text>
              <Text style={styles.ticketNumberText}>
                Ticket: <Text style={styles.ticketNumberValue}>{ticket}</Text>
              </Text>
            </View>

            {/* ── SCROLLABLE AREA — everything below ticket scrolls ── */}
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContentContainer}
            >
              {/* ── Top two summary cards (Investment / Profit) ── */}
              <View style={styles.row}>
                <View style={[styles.summaryCard, styles.investmentCardBackground]}>
                  {/* Icon size reduced to 18 */}
                  <Ionicons name="wallet-outline" size={18} color="#E0E0E0" style={styles.summaryIcon} />
                  <Text style={styles.summaryAmount}>₹ {formatNumberIndianStyle(singleOverview?.total_investment || 0)}</Text>
                  <Text style={styles.summaryLabel}>Investment</Text>
                </View>
                <View style={[styles.summaryCard, styles.profitCardBackground]}>
                  {/* Icon size reduced to 18 */}
                  <Ionicons name="trending-up-outline" size={18} color="#E0E0E0" style={styles.summaryIcon} />
                  <Text style={styles.summaryAmount}>₹ {formatNumberIndianStyle(singleOverview?.total_profit || 0)}</Text>
                  <Text style={styles.summaryLabel}>Divident / Profit</Text>
                </View>
              </View>

              {/* ── Bottom three stat cards ── */}
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.summaryCard, { borderColor: statBoxBorderColors.toBePaid, backgroundColor: "#fff" }, styles.summaryCardBordered]}
                >
                  {/* Icon size reduced to 18 */}
                  <Ionicons name="wallet-outline" size={18} color={statBoxTextColors.toBePaid} style={styles.summaryIcon} />
                  <Text style={[styles.summaryAmountAlt, { color: statBoxTextColors.toBePaid }]}>₹ {formatNumberIndianStyle(toBePaidAmount)}</Text>
                  <Text style={[styles.summaryLabelAlt, { color: statBoxTextColors.toBePaid }]}>TO BE PAID</Text>
                </TouchableOpacity>

                <View style={[styles.summaryCard, { borderColor: statBoxBorderColors.totalPaid, backgroundColor: "#fff" }, styles.summaryCardBordered]}>
                  {/* Icon size reduced to 18 */}
                  <Ionicons name="receipt-outline" size={18} color={statBoxTextColors.totalPaid} style={styles.summaryIcon} />
                  <Text style={[styles.summaryAmountAlt, { color: statBoxTextColors.totalPaid }]}>₹ {formatNumberIndianStyle(singleOverview?.total_investment || 0)}</Text>
                  <Text style={[styles.summaryLabelAlt, { color: statBoxTextColors.totalPaid }]}>TOTAL PAID</Text>
                </View>

                {paymentData.length > 0 && (
                  <View style={[styles.summaryCard, { borderColor: isBalanceExcess ? statBoxBorderColors.balanceExcess : statBoxBorderColors.balance, backgroundColor: "#fff" }, styles.summaryCardBordered]}>
                    <Ionicons
                      name={isBalanceExcess ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                      size={18} // Icon size reduced to 18
                      color={isBalanceExcess ? statBoxTextColors.balanceExcess : statBoxTextColors.balance}
                      style={styles.summaryIcon}
                    />
                    <Text style={[styles.summaryAmountAlt, { color: isBalanceExcess ? statBoxTextColors.balanceExcess : statBoxTextColors.balance }]}>
                      ₹ {formatNumberIndianStyle(Math.abs(balanceAmount))}
                    </Text>
                    <Text style={[styles.summaryLabelAlt, { color: isBalanceExcess ? statBoxTextColors.balanceExcess : statBoxTextColors.balance }]}>
                      BALANCE {isBalanceExcess ? "EXCESS" : "OUTSTANDING"}
                    </Text>
                  </View>
                )}
              </View>

              {/* ── Transactions header ── */}
              <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Last 10 Transactions</Text>
                <TouchableOpacity onPress={handleViewMore}>
                  <View style={styles.viewMoreBoxContainer}>
                    <Text style={styles.viewMoreText} numberOfLines={1} ellipsizeMode="tail">View More</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ── Transaction rows ── */}
              {paymentData.length > 0 ? (
                paymentData.slice(0, 10).map((card) => (
                  <View key={card._id} style={styles.transactionCard}>
                    <View style={styles.transactionLeftSide}>
                      <Text style={styles.transactionReceiptText}>
                        {card.receipt_no ? card.receipt_no : card.old_receipt_no || ""}
                      </Text>
                    </View>
                    <View style={styles.transactionCenterSide}>
                      <Text style={styles.transactionDateText}>
                        {new Date(card.pay_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                    <View style={styles.transactionRightSide}>
                      <Text style={styles.transactionAmountText}>₹{formatNumberIndianStyle(card.amount)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noTransactionsContainer}>
                  <Image source={NoDataIllustration} style={styles.noTransactionsImage} resizeMode="contain" />
                  <Text style={styles.noTransactionsText}>No transactions found.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  fullScreenLoader: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff",
  },
  loaderContainer: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#053B90",
  },
  mainContentWrapper: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 3,
    backgroundColor: "#053B90",
  },
  contentCard: {
    flex: 1,
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  scrollContentContainer: {
    padding: 15,
    paddingBottom: 120,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    gap: 8, // Reduced gap
  },
  summaryCard: {
    flex: 1, 
    padding: 8, // Reduced padding
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center", 
    minHeight: 75, // Reduced height
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  investmentCardBackground: { backgroundColor: "#004775" },
  profitCardBackground: { backgroundColor: "#357500" },
  summaryIcon: { marginBottom: 4, color: "#E0E0E0" }, // Reduced margin
  summaryAmount: { fontSize: 14, fontWeight: "bold", color: "#FFFFFF" }, // Reduced font size
  summaryLabel: { fontSize: 9, color: "#E0E0E0", marginTop: 2, textAlign: "center", fontWeight: "600" }, // Reduced font size
  summaryCardBordered: { borderWidth: 1 },
  summaryAmountAlt: { fontSize: 11, fontWeight: "900", textAlign: "center" }, // Reduced font size
  summaryLabelAlt: { fontSize: 7, fontWeight: "700", textAlign: "center", marginTop: 2 }, // Reduced font size
  dropdownContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  numericGroupValue: { fontSize: 25, fontWeight: "bold", color: "#0b7a09ff", textAlign: "center", marginBottom: -4 },
  groupTitle: { marginVertical: 4, fontWeight: "900", fontSize: 22, color: "#333", textAlign: "center" },
  ticketNumberText: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 4 },
  ticketNumberValue: { fontWeight: "bold", color: "#053B90", fontSize: 18 },
  transactionsHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginVertical: 18, marginHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 8,
  },
  transactionsTitle: { fontWeight: "800", fontSize: 15, color: "#333" },
  viewMoreText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  viewMoreBoxContainer: {
    marginTop: 5, borderRadius: 8, backgroundColor: '#053B90',
    width: 95, height: 35, alignItems: 'center', justifyContent: 'center',
  },
  transactionCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 18, paddingHorizontal: 15, marginVertical: 4,
    borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 10,
    width: '100%', backgroundColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  transactionLeftSide: { flex: 1.2, justifyContent: "center", alignItems: "flex-start" },
  transactionCenterSide: { flex: 1, justifyContent: "center", alignItems: "center" },
  transactionRightSide: { flex: 1, justifyContent: "center", alignItems: "flex-end" },
  transactionReceiptText: { fontSize: 14, fontWeight: "700", color: "#333" },
  transactionDateText: { fontSize: 12, color: "#666" },
  transactionAmountText: { fontWeight: "800", fontSize: 18, color: "#053B90" },
  errorText: { color: "#fff", textAlign: "center", marginTop: 30, fontSize: 16, paddingHorizontal: 20 },
  networkStatusText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF", textAlign: "center", paddingHorizontal: 20 },
  retryButton: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 20 },
  retryButtonText: { color: "#053B90", fontSize: 16, fontWeight: "bold" },
  noTransactionsContainer: { justifyContent: "center", alignItems: "center", paddingVertical: 50 },
  noTransactionsImage: { width: 200, height: 200, marginBottom: 20 },
  noTransactionsText: { textAlign: "center", color: "#666", fontSize: 16, fontWeight: "500" },
});

export default EnrollGroup;