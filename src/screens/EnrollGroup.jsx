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
    totalPenalty: "#DC143C",
    totalLateFee: "#FF6347",
  };
  const statBoxTextColors = {
    toBePaid: "#FF6347",
    totalPaid: "#800080",
    balance: "#E74C3C",
    balanceExcess: "#2ECC71",
    totalPenalty: "#DC143C",
    totalLateFee: "#FF6347",
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
        const [groupResponse, paymentResponse, overviewResponse] = await Promise.all([
            axios.get(`${url}/group/get-by-id-group/${groupId}`),
            axios.post(`${url}/payment/payment-list`, {
                groupId,
                userId,
                ticket,
                source: "mychits-customer-app"
            }),
            axios.get(`${url}/overview/single?user_id=${userId}&group_id=${groupId}&ticket=${ticket}`)
        ]);

        setGroups(groupResponse.data);

        const paymentListData = paymentResponse.data;
        if (paymentListData.success) {
            setPaymentData(paymentListData.data.sort((a, b) => new Date(b.pay_date) - new Date(a.pay_date)));
        } else {
            setError(paymentListData.message || "No payment data available");
            setPaymentData([]);
        }

        setSingleOverview(overviewResponse.data);
        console.log(JSON.stringify(overviewResponse.data, null, 2));

    } catch (err) {
      setError("An error occurred while fetching data. Please try again.");
      Toast.show({ type: "error", text1: "Data Load Error", text2: "Could not fetch all details. Please retry.", position: "bottom", visibilityTime: 4000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId, groupId, ticket, isConnected, isInternetReachable]);

  const toBePaidAmount = singleOverview?.total_payable || 0;

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
              <View style={styles.ticketPill}>
                <Text style={styles.ticketNumberText}>TICKET</Text>
                <Text style={styles.ticketNumberValue}>{ticket}</Text>
              </View>
            </View>

            {/* ── SCROLLABLE AREA — everything below ticket scrolls ── */}
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContentContainer}
            >
              {/* ── Top two summary cards (Investment / Profit) ── */}
              <View style={styles.row}>
                <View style={[styles.summaryCard, styles.investmentCardBackground]}>
                  <Ionicons name="wallet-outline" size={18} color="#E0E0E0" style={styles.summaryIcon} />
                  <Text style={styles.summaryAmount}>₹ {formatNumberIndianStyle(singleOverview?.total_investment || 0)}</Text>
                  <Text style={styles.summaryLabel}>Investment</Text>
                </View>
                <View style={[styles.summaryCard, styles.profitCardBackground]}>
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
                  <Ionicons name="wallet-outline" size={18} color={statBoxTextColors.toBePaid} style={styles.summaryIcon} />
                  <Text style={[styles.summaryAmountAlt, { color: statBoxTextColors.toBePaid }]}>₹ {formatNumberIndianStyle(toBePaidAmount)}</Text>
                  <Text style={[styles.summaryLabelAlt, { color: statBoxTextColors.toBePaid }]}>TO BE PAID</Text>
                </TouchableOpacity>

                <View style={[styles.summaryCard, { borderColor: statBoxBorderColors.totalPaid, backgroundColor: "#fff" }, styles.summaryCardBordered]}>
                  <Ionicons name="receipt-outline" size={18} color={statBoxTextColors.totalPaid} style={styles.summaryIcon} />
                  <Text style={[styles.summaryAmountAlt, { color: statBoxTextColors.totalPaid }]}>₹ {formatNumberIndianStyle(singleOverview?.total_investment || 0)}</Text>
                  <Text style={[styles.summaryLabelAlt, { color: statBoxTextColors.totalPaid }]}>TOTAL PAID</Text>
                </View>

                {paymentData.length > 0 && (
                  <View style={[styles.summaryCard, { borderColor: isBalanceExcess ? statBoxBorderColors.balanceExcess : statBoxBorderColors.balance, backgroundColor: "#fff" }, styles.summaryCardBordered]}>
                    <Ionicons
                      name={isBalanceExcess ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                      size={18}
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

              {(singleOverview?.total_penalty > 0 || singleOverview?.total_late_fee > 0) && (
                <View style={styles.row}>
                  {singleOverview?.total_penalty > 0 && (
                    <View style={[styles.summaryCard, { borderColor: statBoxBorderColors.totalPenalty, backgroundColor: "#fff" }, styles.summaryCardBordered]}>
                      <Ionicons name="alert-circle-outline" size={18} color={statBoxTextColors.totalPenalty} style={styles.summaryIcon} />
                      <Text style={[styles.summaryAmountAlt, { color: statBoxTextColors.totalPenalty }]}>
                        ₹ {formatNumberIndianStyle(singleOverview?.total_penalty)}
                      </Text>
                      <Text style={[styles.summaryLabelAlt, { color: statBoxTextColors.totalPenalty }]}>
                        TOTAL PENALTY
                      </Text>
                    </View>
                  )}
                  {singleOverview?.total_late_fee > 0 && (
                    <View style={[styles.summaryCard, { borderColor: statBoxBorderColors.totalLateFee, backgroundColor: "#fff" }, styles.summaryCardBordered]}>
                      <Ionicons name="time-outline" size={18} color={statBoxTextColors.totalLateFee} style={styles.summaryIcon} />
                      <Text style={[styles.summaryAmountAlt, { color: statBoxTextColors.totalLateFee }]}>
                        ₹ {formatNumberIndianStyle(singleOverview?.total_late_fee)}
                      </Text>
                      <Text style={[styles.summaryLabelAlt, { color: statBoxTextColors.totalLateFee }]}>
                        TOTAL LATE FEE
                      </Text>
                    </View>
                  )}
                </View>
              )}

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
  // ─── Layout & Safe Area ───────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: "#0D2D6B",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  fullScreenLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0D2D6B",
    paddingHorizontal: 24,
  },
  mainContentWrapper: {
    flex: 1,
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 0,
    backgroundColor: "#0D2D6B",
  },

  // ─── Main Card Shell ──────────────────────────────────────────────
  contentCard: {
    flex: 1,
    width: "94%",
    backgroundColor: "#F5F7FF",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },

  // ─── Fixed Header ─────────────────────────────────────────────────
  dropdownContainer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#0D2D6B",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  numericGroupValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#4ECBA0",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  ticketPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 50,
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  ticketNumberText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  ticketNumberValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },

  // ─── Scroll Body ──────────────────────────────────────────────────
  scrollContentContainer: {
    padding: 14,
    paddingBottom: 110,
    gap: 10,
  },

  // ─── Card Rows ────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 0,
  },

  // ─── Summary Cards (colored) ──────────────────────────────────────
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 82,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  investmentCardBackground: {
    backgroundColor: "#0D2D6B",
  },
  profitCardBackground: {
    backgroundColor: "#0A6645",
  },
  summaryIcon: {
    marginBottom: 5,
    opacity: 0.85,
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.60)",
    marginTop: 3,
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ─── Stat Cards (white bordered) ──────────────────────────────────
  summaryCardBordered: {
    borderWidth: 1.5,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  summaryAmountAlt: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  summaryLabelAlt: {
    fontSize: 7.5,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // ─── Transactions Section ─────────────────────────────────────────
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F4",
  },
  transactionsTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: "#0D2D6B",
    letterSpacing: 0.2,
  },
  viewMoreBoxContainer: {
    borderRadius: 20,
    backgroundColor: "#0D2D6B",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  viewMoreText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ─── Transaction Row Cards ────────────────────────────────────────
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E4EAF4",
    borderRadius: 12,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#0D2D6B", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  transactionLeftSide: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  transactionCenterSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionRightSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  transactionReceiptText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3A5A",
  },
  transactionDateText: {
    fontSize: 11,
    color: "#8896B3",
    fontWeight: "500",
  },
  transactionAmountText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#0D2D6B",
    letterSpacing: -0.3,
  },

  // ─── Error / Offline States ───────────────────────────────────────
  errorText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 15,
    paddingHorizontal: 20,
    lineHeight: 22,
    opacity: 0.9,
  },
  networkStatusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
    opacity: 0.9,
  },
  retryButton: {
    backgroundColor: "#fff",
    paddingVertical: 11,
    paddingHorizontal: 32,
    borderRadius: 50,
    marginTop: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  retryButtonText: {
    color: "#0D2D6B",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // ─── Empty State ──────────────────────────────────────────────────
  noTransactionsContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noTransactionsImage: {
    width: 180,
    height: 180,
    marginBottom: 16,
    opacity: 0.85,
  },
  noTransactionsText: {
    textAlign: "center",
    color: "#8896B3",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default EnrollGroup;