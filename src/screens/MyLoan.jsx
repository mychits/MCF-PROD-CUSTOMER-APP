import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import { ContextProvider } from "../context/UserProvider";
import Toast from "react-native-toast-message";
import url from "../data/url";
import axios from "axios";

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#E8F0F7",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentColor: "#3498DB",
  shadowColor: "rgba(0,0,0,0.1)",
  vibrantBlue: "#007BFF",
  lightGrayBorder: "#D3D3D3",
  paginationActive: "#053B90",
  paginationInactive: "#E8F0F7",
  paginationActiveText: "#FFFFFF",
  paginationInactiveText: "#2C3E50",
};

const MyLoan = ({ route, navigation }) => {
  const { groupFilter } = route.params;
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loans, setLoans] = useState([]);

  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [paymentsError, setPaymentsError] = useState(null);

  const [totalPayments, setTotalPayments] = useState([]);
  const [totalPaymentsError, setTotalPaymentsError] = useState(null);

  const [isDataLoading, setIsDataLoading] = useState(false);

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loanId, setLoanId] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchLoans = async () => {
      setIsLoading(true);
      try {
        const apiUrl = `${url}/loans/get-borrower-by-user-id/${userId}`;
        const response = await axios.get(apiUrl);
        setLoans(response.data);
      } catch (err) {
        setError("Failed to fetch loan data.");
        Toast.show({ type: "error", text1: "Error", text2: "Could not load loan data." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoans();
  }, [userId]);

  useEffect(() => {
    if (!userId || !loanId) return;
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const summaryApiUrl = `${url}/payment/user/${userId}/loan/${loanId}/summary`;
        const summaryResponse = await axios.get(summaryApiUrl);
        const summary = Array.isArray(summaryResponse.data) ? summaryResponse.data[0] : summaryResponse.data;
        setPaymentsSummary(summary);
        
        const paymentsApiUrl = `${url}/payment/loan/${loanId}/user/${userId}/total-docs/7/page/${currentPage}`;
        const paymentsResponse = await axios.get(paymentsApiUrl);
        setTotalPayments(paymentsResponse.data);
        
      } catch (err) {
        console.error("Failed to fetch loan data", err);
        setPaymentsError("Failed to fetch loan data.");
        setTotalPaymentsError("Failed to fetch total payments.");
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [userId, loanId, currentPage]);

  useEffect(() => {
    if (!userId || !loanId) return;
    const fetchTotalPages = async () => {
      try {
        const apiUrl = `${url}/payment/loan/totalPages/user/${userId}/loan/${loanId}/total-docs/7`;
        const res = await axios.get(apiUrl);
        setTotalPages(res.data.totalPages || 0);
      } catch (err) {
        console.error("Failed to fetch total pages", err);
      }
    };
    fetchTotalPages();
  }, [userId, loanId]);

  const formatNumberIndianStyle = (num) => {
    if (num === null || num === undefined) return "0";
    const parts = num.toString().split(".");
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? "." + parts[1] : "";
    const isNegative = integerPart.startsWith("-");
    if (isNegative) integerPart = integerPart.substring(1);
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formatted =
      otherNumbers !== ""
        ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
        : lastThree;
    return (isNegative ? "-" : "") + formatted + decimalPart;
  };

  const getPaginationNumbers = () => {
    const pages = [];
    const limit = 1;
    const start = Math.max(1, currentPage - Math.floor(limit / 2));
    const end = Math.min(totalPages, start + limit - 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push("...");
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      
      {/* Conditional rendering for Header */}
      {!loanId && <Header userId={userId} navigation={navigation} />}

      <View style={styles.outerBoxContainer}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView
            contentContainerStyle={styles.innerContentArea}
            showsVerticalScrollIndicator={false}
          >
            {/* Title section with back button */}
            <View style={styles.titleContainer}>
              {loanId && (
                <TouchableOpacity
                  onPress={() => {
                    setLoanId(null);
                    setCurrentPage(1);
                  }}
                  style={styles.backButton}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={28}
                    color={Colors.darkText}
                  />
                </TouchableOpacity>
              )}
              <Text style={styles.sectionTitle}>My Loan</Text>
              <Text style={styles.subHeading}>
                Your current loan details and payment status.
              </Text>
            </View>

            {/* Total payments summary and payment boxes section */}
            {loanId ? (
              isDataLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryBlue} />
                </View>
              ) : (
                <>
                  {/* Total payments summary */}
                  <View style={[styles.loanCard, { backgroundColor: "#f0f8ff" }]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconContainer, { backgroundColor: Colors.accentColor }]}>
                        <Ionicons name="stats-chart-outline" size={28} color={Colors.cardBackground} />
                      </View>
                      <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle}>Total Payments for Loan</Text>
                      </View>
                    </View>
                    {paymentsError ? (
                      <Text style={styles.errorText}>{paymentsError}</Text>
                    ) : (
                      <Text style={styles.detailValue}>
                        ₹ {paymentsSummary ? formatNumberIndianStyle(paymentsSummary.totalPaidAmount || 0) : "N/A"}
                      </Text>
                    )}
                  </View>

                  {/* Payment boxes */}
                  <View>
                    {totalPaymentsError ? (
                      <Text style={styles.errorText}>{totalPaymentsError}</Text>
                    ) : totalPayments.length > 0 ? (
                      totalPayments.map((pay) => (
                        <View key={pay._id} style={styles.paymentCard}>
                          <Ionicons name="receipt-outline" size={22} color={Colors.accentColor} />
                          <View style={styles.paymentDetailsRow}>
                            <Text style={styles.receiptText}>Receipt: {pay.receipt_no}</Text>
                            <Text style={styles.amountText}>₹ {formatNumberIndianStyle(pay.amount)}</Text>
                            <Text style={styles.dateText}>{new Date(pay.pay_date).toLocaleDateString()}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No payments found.</Text>
                    )}

                    {/* Pagination footer with numbered boxes */}
                    {totalPages > 1 && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity
                          disabled={currentPage === 1}
                          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          style={styles.paginationArrowButton}
                        >
                          <Ionicons name="chevron-back" size={24} color={currentPage === 1 ? "#ccc" : Colors.darkText} />
                        </TouchableOpacity>
                        {getPaginationNumbers().map((pageNumber, index) =>
                          pageNumber === "..." ? (
                            <Text key={`ellipsis-${index}`} style={styles.paginationEllipsis}>...</Text>
                          ) : (
                            <TouchableOpacity
                              key={pageNumber}
                              style={[
                                styles.paginationBox,
                                currentPage === pageNumber && styles.paginationBoxActive,
                              ]}
                              onPress={() => setCurrentPage(pageNumber)}
                            >
                              <Text
                                style={[
                                  styles.paginationBoxText,
                                  currentPage === pageNumber && styles.paginationBoxTextActive,
                                ]}
                              >
                                {pageNumber}
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                        <TouchableOpacity
                          disabled={currentPage === totalPages}
                          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          style={styles.paginationArrowButton}
                        >
                          <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages ? "#ccc" : Colors.darkText} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )
            ) : (
              // Loan list section
              loans.length > 0 ? (
                loans.map((loan) => (
                  <View key={loan.loan_id} style={[styles.loanCard, styles.loanCardBox]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="wallet-outline" size={28} color={Colors.cardBackground} />
                      </View>
                      <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle}>Loan ID: {loan.loan_id.substring(0, 10)}...</Text>
                        <Text style={styles.cardSubtitle}>Tenure: {loan.tenure} days</Text>
                      </View>
                    </View>
                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Loan Amount</Text>
                        <Text style={styles.detailValue}>₹ {formatNumberIndianStyle(loan.loan_amount)}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Start Date</Text>
                        <Text style={styles.detailValue}>{new Date(loan.start_date).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.viewPaymentsButton}
                      onPress={() => { setLoanId(loan._id); setCurrentPage(1); }}
                    >
                      <Text style={styles.viewPaymentsButtonText}>View Payments</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No loans found.</Text>
              )
            )}
          </ScrollView>
        )}
      </View>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBlue, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  outerBoxContainer: { flex: 1, backgroundColor: Colors.lightBackground, margin: 10, borderRadius: 20 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  innerContentArea: { flexGrow: 1, backgroundColor: Colors.cardBackground, padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  titleContainer: { marginBottom: 20, alignItems: "center", position: "relative" },
  backButton: { position: "absolute", left: 0, top: 10 },
  sectionTitle: { fontSize: 28, fontWeight: "800", color: Colors.darkText, marginTop: 5 },
  subHeading: { fontSize: 14, color: Colors.mediumText, textAlign: "center" },
  errorText: { textAlign: "center", color: "#DC143C", marginTop: 20, fontSize: 16 },
  
  loanCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    elevation: 8,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loanCardBox: {
    borderWidth: 1,
    borderColor: '#053B90',
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryBlue, justifyContent: "center", alignItems: "center", marginRight: 15 },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: Colors.darkText },
  cardSubtitle: { fontSize: 14, color: Colors.mediumText, marginTop: 2 },
  detailsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15, paddingHorizontal: 5 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 14, color: Colors.mediumText },
  detailValue: { fontSize: 18, fontWeight: "bold", color: Colors.vibrantBlue },
  emptyText: { marginTop: 14, fontSize: 20, color: "#888", textAlign: "center" },
  viewPaymentsButton: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewPaymentsButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  paymentDetailsRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", marginLeft: 15, alignItems: "center" },
  receiptText: { fontSize: 15, fontWeight: "600", color: Colors.darkText, flex: 1 },
  amountText: { fontSize: 16, fontWeight: "bold", color: Colors.vibrantBlue, flex: 1, textAlign: "center" },
  dateText: { fontSize: 13, color: Colors.mediumText, flex: 1, textAlign: "right" },

  // Pagination footer styles
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    flexWrap: "wrap",
  },
  paginationArrowButton: {
    padding: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
  },
  paginationBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.paginationInactive,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
  },
  paginationBoxActive: {
    backgroundColor: Colors.paginationActive,
    borderColor: Colors.paginationActive,
  },
  paginationBoxText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.paginationInactiveText,
  },
  paginationBoxTextActive: {
    color: Colors.paginationActiveText,
  },
  paginationEllipsis: {
    fontSize: 16,
    color: Colors.darkText,
    marginHorizontal: 4,
  },
});

export default MyLoan;