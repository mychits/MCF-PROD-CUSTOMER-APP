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
  Linking, // 💥 Added Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContextProvider } from "../context/UserProvider";
import Toast from "react-native-toast-message";
import axios from "axios";
import url from "../data/url"; // must export "https://mychits.online/api"

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F5F8FA",
  cardBackground: "#FFFFFF",
  darkText: "#212529",
  mediumText: "#6C757D",
  accentColor: "#28A745",
  shadowColor: "rgba(0,0,0,0.15)",
  vibrantBlue: "#17A2B8",
  lightGrayBorder: "#E9ECEF",
  paginationActive: "#053B90",
  paginationInactive: "#DEE2E6",
  paginationActiveText: "#FFFFFF",
  paginationInactiveText: "#495057",
  successGreen: "#28A745",
  pigmeAccent: "#FFC107", // Pigme Accent (Yellow/Orange)
};

const DOCS_PER_PAGE = 7;

// --- Contact Constants (Copied from MyLoan.jsx) ---
const CONTACT_EMAIL = 'info.mychits@gmail.com';
const CONTACT_PHONE = '+919483900777';

const ReportList = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pigmeAccounts, setPigmeAccounts] = useState([]);
  const [selectedPigme, setSelectedPigme] = useState(null);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [totalPayments, setTotalPayments] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [latestPayment, setLatestPayment] = useState(null);

  // Helper functions to handle linking 💥 Added
  const handleEmailPress = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  const handlePhonePress = () => {
    Linking.openURL(`tel:${CONTACT_PHONE}`);
  };

  // ✅ 1. Fetch Pigme accounts list
  useEffect(() => {
    if (!userId) return;
    const fetchPigme = async () => {
      setIsLoading(true);
      try {
        const apiUrl = `${url}/pigme/get-pigme-customer-by-user-id/${userId}`;
        console.log("Fetching Pigme accounts:", apiUrl);
        const response = await axios.get(apiUrl);
        console.log("Pigme Accounts Data:", response.data);
        setPigmeAccounts(response.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch Pigme list:", err.message);
        setError("Failed to fetch Pigme data.");
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not load Pigme accounts.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPigme();
  }, [userId]);

  // ✅ 2. Fetch Pigme summary and payments
  useEffect(() => {
    if (!userId || !selectedPigme) return;
    const fetchData = async () => {
      setIsDataLoading(true);
      // detect whether selectedPigme has nested pigme object or direct id
      const pigmeId = selectedPigme.pigme?._id || selectedPigme._id;
      try {
        const summaryApiUrl = `${url}/payment/user/${userId}/pigme/${pigmeId}/summary`;
        const paymentsApiUrl = `${url}/payment/pigme/${pigmeId}/user/${userId}/total-docs/${DOCS_PER_PAGE}/page/${currentPage}`;
        console.log("SUMMARY URL:", summaryApiUrl);
        console.log("PAYMENTS URL:", paymentsApiUrl);

        const [summaryResponse, paymentsResponse] = await Promise.all([
          axios.get(summaryApiUrl),
          axios.get(paymentsApiUrl),
        ]);

        const summary = Array.isArray(summaryResponse.data)
          ? summaryResponse.data[0]
          : summaryResponse.data;
        setPaymentsSummary(summary);

        const payments = paymentsResponse.data || [];
        setTotalPayments(payments);

        if (payments.length > 0) {
          const sorted = [...payments].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setLatestPayment(sorted[0]);
        } else {
          setLatestPayment(null);
        }
      } catch (err) {
        console.error("❌ Failed to fetch Pigme payment data:", err.message);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load Pigme payment history.",
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [userId, selectedPigme, currentPage]);

  // ✅ 3. Fetch total pages
  useEffect(() => {
    if (!userId || !selectedPigme) return;
    const fetchTotalPages = async () => {
      const pigmeId = selectedPigme.pigme?._id || selectedPigme._id;
      try {
        const apiUrl = `${url}/payment/pigme/totalPages/user/${userId}/pigme/${pigmeId}/total-docs/${DOCS_PER_PAGE}`;
        console.log("TOTAL PAGES URL:", apiUrl);
        const res = await axios.get(apiUrl);
        setTotalPages(res.data.totalPages || 0);
      } catch (err) {
        console.error("❌ Failed to fetch total pages:", err.message);
      }
    };
    fetchTotalPages();
  }, [userId, selectedPigme]);

  // ✅ Format number in Indian style
  const formatNumberIndianStyle = (num) => {
    if (!num) return "0";
    const number = parseFloat(num).toFixed(2);
    const parts = number.toString().split(".");
    let integerPart = parts[0];
    const decimalPart = parts[1] ? "." + parts[1] : "";
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);
    const formatted =
      otherNumbers !== ""
        ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
        : lastThree;
    return formatted + decimalPart;
  };

  const getPaginationNumbers = () => {
    const pages = [];
    const limit = 3;
    const start = Math.max(1, currentPage - Math.floor(limit / 2));
    const end = Math.min(totalPages, start + limit - 1);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      
      {/* Ensures blue background is visible above the main content area */}
      <View style={styles.headerWrapper}>
        {/* Only show custom Header on the list screen */}
        {!selectedPigme && <Header userId={userId} navigation={navigation} />}
      </View>

      <View style={styles.outerBoxContainer}>
        <View style={styles.fixedTitleContainer}>
          {selectedPigme && (
            <TouchableOpacity
              onPress={() => {
                setSelectedPigme(null);
                setCurrentPage(1);
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back-outline" size={28} color={Colors.darkText} />
            </TouchableOpacity>
          )}
          <Text style={styles.sectionTitle}>Pigme Reports</Text>
          <Text style={styles.subHeading}>
            {selectedPigme
              ? "Your recent Pigme deposit details"
              : "Your current Pigme savings accounts"}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollableContentArea} showsVerticalScrollIndicator={false}>
            {selectedPigme ? (
              isDataLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryBlue} />
                </View>
              ) : (
                <>
                  {/* ✅ Summary Card */}
                  <View style={[styles.loanCard, styles.summaryCard]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconContainer, { backgroundColor: Colors.pigmeAccent }]}>
                        <Ionicons name="trending-up-outline" size={28} color={Colors.cardBackground} />
                      </View>
                      <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle}>Pigme Summary</Text>
                        <Text style={styles.cardSubtitle}>
                          Account ID: {(selectedPigme.pigme?.pigme_id || selectedPigme.pigme_id || "").substring(0, 8)}...
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.detailValue, styles.summaryValue, { color: Colors.vibrantBlue }]}>
                      ₹{" "}
                      {paymentsSummary
                        ? formatNumberIndianStyle(paymentsSummary.totalPaidAmount || 0)
                        : "0"}
                    </Text>

                    {latestPayment && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.detailLabel}>
                          Latest Payment Receipt:{" "}
                          <Text style={styles.detailValue}>{latestPayment.receipt_no}</Text>
                        </Text>
                        <Text style={styles.detailLabel}>
                          Latest Payment Date:{" "}
                          <Text style={styles.detailValue}>
                            {new Date(latestPayment.pay_date).toLocaleDateString()}
                          </Text>
                        </Text>
                        <Text style={styles.detailLabel}>
                          Total Payments:{" "}
                          <Text style={styles.detailValue}>{totalPayments.length}</Text>
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* ✅ Payment History */}
                  <View>
                    <Text style={styles.paymentHistoryTitle}>Deposit History</Text>
                    {totalPayments.length > 0 ? (
                      totalPayments.map((pay) => (
                        <View key={pay._id} style={styles.paymentCard}>
                          <Ionicons name="wallet-outline" size={22} color={Colors.pigmeAccent} />
                          <View style={styles.paymentDetailsRow}>
                            <View style={{ flex: 2 }}>
                              <Text style={styles.receiptText} numberOfLines={1}>
                                Receipt: {pay.receipt_no}
                              </Text>
                              <Text style={styles.dateText}>
                                {new Date(pay.pay_date).toLocaleDateString()}
                              </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: "flex-end" }}>
                              <Text style={styles.amountText}>
                                ₹ {formatNumberIndianStyle(pay.amount)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No deposits found for this Pigme account.</Text>
                    )}

                    {/* ✅ Pagination */}
                    {totalPages > 1 && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity
                          disabled={currentPage === 1}
                          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          style={styles.paginationArrowButton}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={24}
                            color={currentPage === 1 ? Colors.mediumText : Colors.darkText}
                          />
                        </TouchableOpacity>

                        {getPaginationNumbers().map((pageNumber, index) =>
                          pageNumber === "..." ? (
                            <Text key={`ellipsis-${index}`} style={styles.paginationEllipsis}>
                              ...
                            </Text>
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
                          <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={currentPage === totalPages ? Colors.mediumText : Colors.darkText}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )
            ) : (
              // ✅ Pigme Account List
              pigmeAccounts.length > 0 ? (
                pigmeAccounts.map((pigme) => (
                  <View
                    key={pigme._id}
                    style={[styles.loanCard, { borderLeftColor: Colors.pigmeAccent }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconContainer, { backgroundColor: Colors.pigmeAccent }]}>
                        <Ionicons name="save-outline" size={28} color={Colors.cardBackground} />
                      </View>
                      <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle}>Pigme Account</Text>
                        <Text style={styles.cardSubtitle}>
                          ID: {pigme.pigme_id || pigme.pigme?.pigme_id}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.viewPaymentsButton, { backgroundColor: Colors.pigmeAccent }]}
                      onPress={() => {
                        setSelectedPigme(pigme);
                        setCurrentPage(1);
                      }}
                    >
                      <Text style={styles.viewPaymentsButtonText}>View Deposits & Details</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                // 💥 REVISED STYLISTIC NO PIGME FOUND SECTION (Based on MyLoan.jsx)
                <View style={[styles.noPigmeContainer, { backgroundColor: Colors.pigmeAccent }]}>
                    <View style={styles.noPigmeHeader}>
                      {/* 💥 Changed Icon from piggy-bank-outline to add-circle-outline */}
                      <Ionicons name="add-circle-outline" size={60} color={Colors.cardBackground} /> 
                      <Text style={styles.noPigmeTitle}>Start Your Savings Journey</Text>
                    </View>
                    
                    <Text style={[styles.noPigmeMessage, { color: Colors.cardBackground }]}>
                        You currently have no active Pigme savings accounts. Start saving now and see your money grow.
                    </Text>

                    {/* SENTENCE FOR PIGME REQUEST */}
                    <Text style={[styles.requestPigmeSentence, {backgroundColor: Colors.primaryBlue}]}>
                        Request your new Pigme account by contacting our executive now!
                    </Text>
                    
                    <View style={styles.contactGroup}>
                        <Text style={styles.noPigmeSubMessage}>
                            Contact our executive to get started:
                        </Text>
                        
                        {/* Primary Call to Action: Phone */}
                        <TouchableOpacity onPress={handlePhonePress} style={[styles.contactButtonPhone, {backgroundColor: Colors.successGreen}]}>
                            <Ionicons name="call-outline" size={20} color={Colors.cardBackground} />
                            <Text style={styles.contactButtonText}>
                                Request Pigme: {CONTACT_PHONE}
                            </Text>
                        </TouchableOpacity>

                        {/* Secondary Call to Action: Email */}
                        <TouchableOpacity onPress={handleEmailPress} style={[styles.contactButtonEmail, {borderColor: Colors.accentColor}]}>
                            <Ionicons name="mail-outline" size={20} color={Colors.accentColor} />
                            <Text style={styles.contactButtonTextEmail}>
                                Email: {CONTACT_EMAIL}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                // 💥 END REVISED STYLISTIC NO PIGME FOUND SECTION
              )
            )}
          </ScrollView>
        )}
      </View>
      <Toast />
    </SafeAreaView>
  );
};

// ✅ Styles (MODIFIED outerBoxContainer, added headerWrapper, plus new styles for No Pigme)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBlue },
  // Ensures the space *above* the main content is blue and respects insets
  headerWrapper: {
    backgroundColor: Colors.primaryBlue,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight, // Android needs the status bar height accounted for here
  },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    margin: 10,
    borderRadius: 20,
    marginBottom: 50,
    overflow: "hidden",
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  fixedTitleContainer: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
  },
  scrollableContentArea: { flexGrow: 1, backgroundColor: Colors.cardBackground, paddingHorizontal: 25, paddingBottom: 25 },
  backButton: { position: "absolute", left: 25, top: 25, zIndex: 10 },
  sectionTitle: { fontSize: 26, fontWeight: "900", color: Colors.darkText, marginTop: 5 },
  subHeading: { fontSize: 13, color: Colors.mediumText, textAlign: "center" },
  errorText: { textAlign: "center", color: "#E74C3C", marginTop: 20, fontSize: 16, fontWeight: "600" },
  loanCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderLeftWidth: 4,
  },
  summaryCard: { borderLeftColor: Colors.pigmeAccent, marginBottom: 20 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconContainer: { width: 45, height: 45, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 15 },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: Colors.darkText },
  cardSubtitle: { fontSize: 12, color: Colors.mediumText, marginTop: 2 },
  detailLabel: { fontSize: 12, color: Colors.mediumText, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: "bold", color: Colors.darkText },
  summaryValue: { fontSize: 32, fontWeight: "bold", textAlign: "center", marginTop: 10 },
  viewPaymentsButton: { paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 5, elevation: 2 },
  viewPaymentsButtonText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  paymentHistoryTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  paymentCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9f9f9", borderRadius: 8, padding: 12, marginBottom: 8 },
  paymentDetailsRow: { flexDirection: "row", flex: 1, justifyContent: "space-between", alignItems: "center" },
  receiptText: { fontWeight: "600", fontSize: 14, color: Colors.darkText },
  dateText: { fontSize: 12, color: Colors.mediumText },
  amountText: { fontSize: 15, fontWeight: "bold", color: Colors.vibrantBlue },
  emptyText: { textAlign: "center", color: Colors.mediumText, marginTop: 15 },
  paginationContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 20 },
  paginationBox: { padding: 8, minWidth: 35, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.paginationInactive, marginHorizontal: 3 },
  paginationBoxActive: { backgroundColor: Colors.paginationActive },
  paginationBoxText: { color: Colors.paginationInactiveText, fontWeight: "bold" },
  paginationBoxTextActive: { color: Colors.paginationActiveText },
  paginationArrowButton: { paddingHorizontal: 5 },
  paginationEllipsis: { fontSize: 18, marginHorizontal: 6, color: Colors.mediumText },
  
  // 💥 NEW STYLES for No Pigme Section (Based on MyLoan.jsx)
  noPigmeContainer: { // Renamed from noLoanContainer to be specific
    alignItems: 'center',
    padding: 0, 
    // backgroundColor handled inline: Colors.pigmeAccent
    borderRadius: 16,
    overflow: 'hidden', 
    marginTop: 5,
    elevation: 8,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  noPigmeHeader: { // Renamed from noLoanHeader
    width: '100%',
    padding: 25,
    alignItems: 'center',
    // backgroundColor handled inline
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  noPigmeTitle: { // Renamed from noLoanTitle
    fontSize: 24,
    fontWeight: '900',
    color: Colors.cardBackground, 
    marginTop: 10,
    textAlign: 'center',
  },
  noPigmeMessage: { // Renamed from noLoanMessage
    fontSize: 16,
    // color handled inline: Colors.cardBackground
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // NEW STYLE FOR PIGME REQUEST SENTENCE
  requestPigmeSentence: { 
    fontSize: 15,
    fontWeight: '600',
    color: Colors.cardBackground,
    textAlign: 'center',
    // backgroundColor handled inline: Colors.primaryBlue
    paddingHorizontal: 15,
    paddingVertical: 8,
    width: '100%',
    marginTop: 15,
  },
  contactGroup: {
    width: '100%',
    padding: 20,
    backgroundColor: Colors.cardBackground, 
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    alignItems: 'center',
  },
  noPigmeSubMessage: { // Renamed from noLoanSubMessage
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mediumText,
    marginBottom: 15,
  },
  contactButtonPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor handled inline: Colors.successGreen
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 4,
  },
  contactButtonEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    // borderColor handled inline: Colors.accentColor
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  contactButtonTextEmail: {
    color: Colors.accentColor, 
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  // Removed old simple noLoanContainer styles
});

export default ReportList;