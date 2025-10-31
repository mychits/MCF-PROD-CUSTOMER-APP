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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import { ContextProvider } from "../context/UserProvider";
import Toast from "react-native-toast-message";
import url from "../data/url";
import axios from "axios";

// --- Stylistic Color Palette ---
const Colors = {
  primaryBlue: "#053B90", // Deep Primary Brand Color
  lightBackground: "#F5F8FA", // Very light, clean background
  cardBackground: "#FFFFFF",
  darkText: "#212529", // Near-black for strong contrast
  mediumText: "#6C757D", // Muted secondary text
  accentColor: "#28A745", // A bright, inviting accent (Orange/Red for CTA)
  shadowColor: "rgba(0,0,0,0.2)", // Darker shadow for more lift
  vibrantBlue: "#17A2B8", // Teal/Cyan for values
  lightGrayBorder: "#E9ECEF", // Light separator
  softGrayBackground: "#FAFAFC", // Used for detail list background
  paginationActive: "#053B90",
  paginationInactive: "#DEE2E6",
  paginationActiveText: "#FFFFFF",
  paginationInactiveText: "#495057",
  successGreen: "#28A745", // Green for Success/Call
  softBlueAccent: "#E6F0FF",
  // New Color for secondary highlight
  secondaryHighlight: "#FFC107", // Yellow/Orange for "Total Paid"
};

// Define contact constants
const CONTACT_EMAIL = 'info.mychits@gmail.com';
const CONTACT_PHONE = '+919483900777';

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
  
  // NEW STATE: For Accordion-like behavior
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchLoans = async () => {
      setIsLoading(true);
      try {
        const apiUrl = `${url}/loans/get-borrower-by-user-id/${userId}`;
        const response = await axios.get(apiUrl);
        setLoans(response.data || []); 
      } catch (err) {
        console.error("Failed to fetch loan data:", err);
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
      // Reset expansion when new loan is selected
      setIsSummaryExpanded(false); 
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
    // Ensure the number is treated as a safe number before calculation/formatting
    const safeNum = isNaN(parseFloat(num)) ? 0 : parseFloat(num);
    const number = safeNum.toFixed(2);
    const parts = number.toString().split(".");
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
    const limit = 3; 
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
    return pages.filter((v, i, a) => a.indexOf(v) === i); 
  };
  
  // Helper functions to handle linking
  const handleEmailPress = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  const handlePhonePress = () => {
    Linking.openURL(`tel:${CONTACT_PHONE}`);
  };

  // --- START LOGIC FOR CALCULATING BALANCE ---
  let totalLoanBalance = 0;
  let loanAmount = 0;
  let totalRepayment = 0;

  if (loanId && !isDataLoading) {
    const currentLoan = loans.find(loan => loan._id === loanId);
    loanAmount = parseFloat(currentLoan?.loan_amount || 0);
    totalRepayment = parseFloat(paymentsSummary?.totalPaidAmount || 0);
    
    // Calculation: Loan Amount - Total Repayment
    totalLoanBalance = loanAmount - totalRepayment;
  }
  // --- END LOGIC FOR CALCULATING BALANCE ---

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      
      {!loanId && <Header userId={userId} navigation={navigation} />}

      <View style={styles.outerBoxContainer}>
        
        {/* FIXED CONTENT: Title and Subheading */}
        <View style={styles.fixedTitleContainer}>
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
                {loanId ? "Recent payment history." : "Your current loan details and payment status."}
              </Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          /* SCROLLABLE CONTENT */
          <ScrollView
            contentContainerStyle={styles.scrollableContentArea}
            showsVerticalScrollIndicator={false}
          >

            {loanId ? (
              isDataLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryBlue} />
                </View>
              ) : (
                <>
                  {/* UPDATED TOTAL LOAN BALANCE CARD (ACCORDIAN HOST) */}
                  <View style={[styles.loanCard, styles.summaryCard]}>
                    <TouchableOpacity
                      style={styles.accordionHeader}
                      onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primaryBlue }]}>
                          <Ionicons name="wallet-outline" size={28} color={Colors.cardBackground} />
                        </View>
                        <View style={styles.cardTitleContainer}>
                          <Text style={styles.cardTitle}>Remaining Loan Balance</Text>
                          {paymentsError ? (
                            <Text style={styles.errorText}>{paymentsError}</Text>
                          ) : (
                            <Text style={[styles.detailValue, styles.summaryValue, { color: Colors.primaryBlue }]}>
                              {/* Use the calculated balance */}
                              ₹ {formatNumberIndianStyle(totalLoanBalance)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                          name={isSummaryExpanded ? "chevron-up" : "chevron-down"}
                          size={24}
                          color={Colors.darkText}
                          style={styles.toggleIcon}
                      />
                    </TouchableOpacity>

                    {/* NEW ACCORDIAN CONTENT: Detailed Summary */}
                    {isSummaryExpanded && !paymentsError && (
                      <View style={styles.summaryDetailsContainer}>
                        
                        {/* Detail 1: Original Loan Amount */}
                        <View style={styles.summaryDetailItem}>
                          <Ionicons name="cash-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>Original Loan Amount</Text>
                          <Text style={[styles.detailValueVertical, { color: Colors.primaryBlue, fontWeight: '900' }]}>
                            ₹ {formatNumberIndianStyle(loanAmount)}
                          </Text>
                        </View>

                        {/* Detail 2: TOTAL PAID (New Required Field) */}
                        <View style={styles.summaryDetailItem}>
                          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.successGreen} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>TOTAL PAID</Text>
                          <Text style={[styles.detailValueVertical, { color: Colors.successGreen, fontWeight: '900' }]}>
                            ₹ {formatNumberIndianStyle(totalRepayment)}
                          </Text>
                        </View>
                        
                        {/* Detail 3: Remaining Balance (Repeat for clarity) */}
                        <View style={styles.summaryDetailItem}>
                          <Ionicons name="calculator-outline" size={20} color={Colors.primaryBlue} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>Remaining Balance</Text>
                          <Text style={[styles.detailValueVertical, { color: Colors.primaryBlue, fontWeight: '900' }]}>
                            ₹ {formatNumberIndianStyle(totalLoanBalance)}
                          </Text>
                        </View>

                      </View>
                    )}
                    {/* END ACCORDIAN CONTENT */}

                  </View>
                  {/* END UPDATED TOTAL LOAN BALANCE CARD */}

                  <View>
                    <Text style={styles.paymentHistoryTitle}>Payment History</Text>
                    {totalPaymentsError ? (
                      <Text style={styles.errorText}>{totalPaymentsError}</Text>
                    ) : totalPayments.length > 0 ? (
                      totalPayments.map((pay) => (
                        <View key={pay._id} style={styles.paymentCard}>
                          <Ionicons name="receipt-outline" size={22} color={Colors.primaryBlue} />
                          <View style={styles.paymentDetailsRow}>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.receiptText} numberOfLines={1}>Receipt: {pay.receipt_no}</Text>
                                <Text style={styles.dateText}>{new Date(pay.pay_date).toLocaleDateString()}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <Text style={styles.amountText}>₹ {formatNumberIndianStyle(pay.amount)}</Text>
                            </View>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No payments found for this loan.</Text>
                    )}
                    {totalPages > 1 && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity
                          disabled={currentPage === 1}
                          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          style={styles.paginationArrowButton}
                        >
                          <Ionicons name="chevron-back" size={24} color={currentPage === 1 ? Colors.mediumText : Colors.darkText} />
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
                          <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages ? Colors.mediumText : Colors.darkText} />
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
                  <View key={loan._id} style={styles.loanCard}>
                    {/* New Stylish Header */}
                    <View style={styles.loanCardHeaderBar}>
                      <Ionicons name="business-outline" size={24} color={Colors.primaryBlue} style={{ marginRight: 10 }} />
                      <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle}>Loan Account</Text>
                        <Text style={styles.cardSubtitle}>ID: {loan.loan_id.substring(0, 10)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailsList}>
                      {/* Amount Row: Value uses primaryBlue for emphasis */}
                      <View style={styles.detailItemVertical}>
                        <Ionicons name="cash-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                        <Text style={styles.detailLabelVertical}>Loan Amount</Text>
                        <Text style={[styles.detailValueVertical, styles.amountValueStyle]}>
                          ₹ {formatNumberIndianStyle(loan.loan_amount)}
                        </Text>
                      </View>
                      {/* Tenure Row */}
                      <View style={styles.detailItemVertical}>
                        <Ionicons name="calendar-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                        <Text style={styles.detailLabelVertical}>Tenure</Text>
                        <Text style={styles.detailValueVertical}>
                          {loan.tenure} days
                        </Text>
                      </View>
                      {/* Start Date Row */}
                      <View style={styles.detailItemVertical}>
                        <Ionicons name="time-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                        <Text style={styles.detailLabelVertical}>Start Date</Text>
                        <Text style={styles.detailValueVertical}>
                          {new Date(loan.start_date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.viewPaymentsButton}
                      onPress={() => { setLoanId(loan._id); setCurrentPage(1); }}
                    >
                      <Text style={styles.viewPaymentsButtonText}>View Payments & Details</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                // --- REVISED STYLISTIC NO LOAN FOUND SECTION ---
                <View style={styles.noLoanContainer}>
                    <View style={styles.noLoanHeader}>
                      <Ionicons name="rocket-outline" size={60} color={Colors.cardBackground} />
                      <Text style={styles.noLoanTitle}>Unlock Your Potential</Text>
                    </View>
                    
                    <Text style={styles.noLoanMessage}>
                        You currently have no active loans. Ready to make a move? Take a loan and enjoy the flexibility.
                    </Text>

                    {/* NEW SENTENCE FOR LOAN REQUEST */}
                    <Text style={styles.requestLoanSentence}>
                        Request your next loan instantly by contacting our executive now!
                    </Text>
                    
                    <View style={styles.contactGroup}>
                        <Text style={styles.noLoanSubMessage}>
                            Contact our executive to get started:
                        </Text>
                        
                        {/* Primary Call to Action: Phone (Updated with Icon and Number) */}
                        <TouchableOpacity onPress={handlePhonePress} style={styles.contactButtonPhone}>
                            <Ionicons name="call-outline" size={20} color={Colors.cardBackground} />
                            <Text style={styles.contactButtonText}>
                                Request Loan: {CONTACT_PHONE}
                            </Text>
                        </TouchableOpacity>

                        {/* Secondary Call to Action: Email */}
                        <TouchableOpacity onPress={handleEmailPress} style={styles.contactButtonEmail}>
                            <Ionicons name="mail-outline" size={20} color={Colors.accentColor} />
                            <Text style={styles.contactButtonTextEmail}>
                                Email: {CONTACT_EMAIL}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                // --- END REVISED STYLISTIC NO LOAN FOUND SECTION ---
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
  safeArea: { flex: 1, backgroundColor: Colors.primaryBlue, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 ,},
  outerBoxContainer: { 
    flex: 1, 
    backgroundColor: Colors.lightBackground, 
    margin: 10, 
    borderRadius: 20, 
    marginBottom:50, 
    overflow: 'hidden', 
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  
  // *** FIXED TITLE AREA ***
  fixedTitleContainer: { 
    backgroundColor: Colors.cardBackground, 
    paddingHorizontal: 25, 
    paddingTop: 25, 
    paddingBottom: 15, 
    alignItems: "center", 
    position: "relative",
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    borderBottomWidth: 1, 
    borderBottomColor: Colors.lightGrayBorder,
  },
  
  scrollableContentArea: { 
    flexGrow: 1, 
    backgroundColor: Colors.cardBackground, 
    paddingHorizontal: 25, 
    paddingBottom: 25,
  },
  
  titleContainer: { marginBottom: 20, alignItems: "center", position: "relative" }, 
  backButton: { position: "absolute", left: 30, top: 20, zIndex: 10 },
  sectionTitle: { fontSize: 26, fontWeight: "900", color: Colors.darkText, marginTop: 5 },
  subHeading: { fontSize: 13, color: Colors.mediumText, textAlign: "center" },
  errorText: { textAlign: "center", color: "#E74C3C", marginTop: 20, fontSize: 16, fontWeight: "600" },
  
  // *** PREMIUM Loan Card Styles ***
  loanCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15, // Increased radius for softer look
    padding: 0, // Removed card padding, will use inner paddings
    marginBottom: 20, // More space between cards
    elevation: 10, // Max shadow for max lift
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.15, // Softer opacity for elegance
    shadowRadius: 10, // Larger radius for a smoother shadow
    borderWidth: 3, // Subtle border
    borderColor: Colors.lightGrayBorder, // Subtle border color
    overflow: 'hidden', // Ensure header background respects radius
    marginTop: 10,
  },
  loanCardHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.softBlueAccent, // Light background for header bar
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
  },
  summaryCard: {
    borderLeftColor: Colors.vibrantBlue,
    marginBottom: 20,
    padding: 0, // Removed padding here, moved to accordionHeader
  },
  cardHeader: { flexDirection: "row", alignItems: "center", flex: 1 },
  
  // NEW STYLES FOR ACCORDION
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20, // Added padding to the touchable area
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
  },
  toggleIcon: {
    marginLeft: 10,
  },
  summaryDetailsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.softGrayBackground,
  },
  summaryDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: Colors.cardBackground, 
    borderRadius: 8, 
    marginBottom: 5, 
    borderLeftWidth: 3,
    borderLeftColor: Colors.lightGrayBorder,
  },
  // END NEW STYLES FOR ACCORDION

  iconContainer: { width: 45, height: 45, borderRadius: 8, backgroundColor: Colors.primaryBlue, justifyContent: "center", alignItems: "center", marginRight: 15 },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.darkText },
  cardSubtitle: { fontSize: 12, color: Colors.mediumText, marginTop: 2 },
  
  summaryValue: { fontSize: 30, fontWeight: "bold", color: Colors.successGreen, marginTop: 4 }, // Adjusted font size
  // Your original summaryValue style was: summaryValue: { fontSize: 32, fontWeight: "bold", color: Colors.successGreen, textAlign: 'center', marginTop: 1 },

  // *** STYLISH VERTICAL LOAN DETAILS (Used for list of loans and details inside accordion) ***
  detailsList: {
    flexDirection: 'column', 
    padding: 10, // Inner padding for the list container
    backgroundColor: Colors.softGrayBackground, // Slight contrast background
    borderRadius: 10,
    marginHorizontal: 15, // Space it from the card edges
    marginVertical: 15,
  },
  detailItemVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15, // More vertical space for clarity
    paddingHorizontal: 10,
    backgroundColor: Colors.cardBackground, // White background for the detail item itself
    borderRadius: 10, // Rounded corners for each detail item
    marginBottom: 5, // Space between list items
    borderLeftWidth: 3, // Accent color stripe
    borderLeftColor: Colors.vibrantBlue, 
  },
  detailIcon: {
    marginRight: 15,
  },
  detailLabelVertical: {
    fontSize: 15,
    color: Colors.mediumText,
    flex: 2, 
    fontWeight: '500', // Lighter weight for label
  },
  detailValueVertical: {
    fontSize: 15,
    fontWeight: "700", // Bold for value
    color: Colors.darkText,
    flex: 3, 
    textAlign: 'right', 
  },
  amountValueStyle: {
    fontSize: 15,
    fontWeight: "900", // Extra bold for amount
    color: Colors.primaryBlue, // Primary color for amount
  },
  // *** END STYLISH VERTICAL LOAN DETAILS ***
  
  viewPaymentsButton: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 14, // Increased padding
    borderRadius: 0, // Let the button use the card's radius
    borderBottomLeftRadius: 15, 
    borderBottomRightRadius: 15, 
    alignItems: "center",
    marginTop: 0, // Button flush with details
    elevation: 0,
  },
  viewPaymentsButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  
  // Payment List Styles (No changes needed for payment cards)
  paymentHistoryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.darkText,
    marginBottom: 10,
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
    paddingBottom: 5,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentDetailsRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", marginLeft: 15, alignItems: "center" },
  receiptText: { fontSize: 14, fontWeight: "600", color: Colors.darkText, marginBottom: 2 },
  amountText: { fontSize: 14, fontWeight: "bold", color: Colors.vibrantBlue },
  dateText: { fontSize: 12, color: Colors.mediumText },
  emptyText: { marginTop: 14, fontSize: 16, color: Colors.mediumText, textAlign: "center" },


  // Pagination styles (No changes here)
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  paginationArrowButton: {
    padding: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
    marginHorizontal: 2,
  },
  paginationBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.paginationInactive,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
  },
  paginationBoxActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  paginationBoxText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.paginationInactiveText,
  },
  paginationBoxTextActive: {
    color: Colors.paginationActiveText,
  },
  paginationEllipsis: {
    fontSize: 16,
    color: Colors.mediumText,
    marginHorizontal: 4,
  },
  
  // --- NO LOAN FOUND SECTION STYLES (No changes here) ---
  noLoanContainer: {
    alignItems: 'center',
    padding: 0, 
    backgroundColor: Colors.primaryBlue,
    borderRadius: 16,
    overflow: 'hidden', 
    marginTop: 5, 
    elevation: 8,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  noLoanHeader: {
    width: '100%',
    padding: 25,
    alignItems: 'center',
    backgroundColor: Colors.primaryBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  noLoanTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.cardBackground, 
    marginTop: 10,
  },
  noLoanMessage: {
    fontSize: 16,
    color: Colors.cardBackground,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  requestLoanSentence: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.cardBackground,
    textAlign: 'center',
    backgroundColor: Colors.vibrantBlue,
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
  noLoanSubMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mediumText,
    marginBottom: 15,
  },
  contactButtonPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successGreen, 
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
    borderColor: Colors.accentColor, 
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
});

export default MyLoan;