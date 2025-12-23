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
  Modal,
  TextInput,
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
  primaryBlue: "#053B90", 
  lightBackground: "#F5F8FA", 
  cardBackground: "#FFFFFF",
  darkText: "#212529", 
  mediumText: "#6C757D", 
  accentColor: "#28A745", 
  shadowColor: "rgba(0,0,0,0.2)", 
  vibrantBlue: "#17A2B8", 
  lightGrayBorder: "#E9ECEF", 
  softGrayBackground: "#FAFAFC", 
  paginationActive: "#053B90",
  paginationInactive: "#DEE2E6",
  paginationActiveText: "#FFFFFF",
  paginationInactiveText: "#495057",
  successGreen: "#28A745", 
  softBlueAccent: "#E6F0FF",
  secondaryHighlight: "#FFC107", 
};

const CONTACT_EMAIL = 'info.mychits@gmail.com';
const CONTACT_PHONE = '+919483900777';

// --- PURPOSE OPTIONS ---
const PURPOSE_OPTIONS = ["Personal", "Medical", "Education", "Business", "Others"];

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
  
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // --- STATE FOR LOAN FORM ---
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    loanAmount: "", 
    loanPurpose: "",
    otherPurpose: "", // To store the custom reason if "Others" is selected
  });

  // --- 1. AUTO-FILL USER DATA ---
  useEffect(() => {
    const fetchFreshProfile = async () => {
      if (!userId || !url) return;
      try {
        const profileUrl = `${url}/user/get-user-by-id/${userId}`;
        const response = await axios.get(profileUrl);
        const userData = response.data;

        if (userData) {
          setFormData(prev => ({
            ...prev,
            fullName: userData.full_name || prev.fullName,
            phoneNumber: userData.phone_number || prev.phoneNumber,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch fresh user profile:", err);
      }
    };

    fetchFreshProfile();
  }, [userId]);

  // --- 2. FETCH LOAN HISTORY ---
  useEffect(() => {
    if (!userId) return;
    const fetchLoans = async () => {
      setIsLoading(true);
      try {
        const apiUrl = `${url}/loans/get-borrower-by-user-id/${userId}`;
        const response = await axios.get(apiUrl);
        setLoans(response.data || []); 
      } catch (err) {
        setError("Failed to fetch loan data.");
        Toast.show({ type: "error", text1: "Error", text2: "Could not load loan data.", position: 'bottom' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoans();
  }, [userId]);

  // --- 3. FETCH SPECIFIC LOAN SUMMARY & PAYMENTS ---
  useEffect(() => {
    if (!userId || !loanId) return;
    const fetchData = async () => {
      setIsDataLoading(true);
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
        setPaymentsError("Failed to fetch loan data.");
        setTotalPaymentsError("Failed to fetch total payments.");
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [userId, loanId, currentPage]);

  // --- 4. FETCH PAGINATION ---
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
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages.filter((v, i, a) => a.indexOf(v) === i); 
  };

  const handlePhonePress = () => {
    Linking.openURL(`tel:${CONTACT_PHONE}`);
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  // --- 5. API SUBMISSION LOGIC ---
  const handleFormSubmit = async () => {
    // Determine the final purpose string
    const finalPurpose = formData.loanPurpose === "Others" 
        ? formData.otherPurpose 
        : formData.loanPurpose;

    if(!formData.loanAmount || !finalPurpose || !formData.fullName || !formData.phoneNumber) {
      Toast.show({ 
        type: "error", 
        text1: "Required Details", 
        text2: "Please fill in all the fields and select a purpose.",
        position: 'bottom' 
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      user_id: userId,
      loan_amount: Number(formData.loanAmount),
      loan_purpose: finalPurpose,
    };

    // --- CONSOLE LOG FOR TERMINAL ---
    console.log("----------------------------");
    console.log("LOAN APPLICATION SUBMITTED");
    console.log("Data:", JSON.stringify(payload, null, 2));
    console.log("----------------------------");

    try {
      const res = await axios.post(`${url}/loans/loan-approval-request`, payload);
      if (res.status === 201 || res.status === 200) {
        setIsFormVisible(false);
        setTimeout(() => {
            Toast.show({ 
                type: "success", 
                text1: "✅ Application Sent", 
                text2: res.data.message || "Your loan request was submitted successfully!",
                position: 'bottom',
                visibilityTime: 4000,
            });
        }, 500);
        setFormData({ ...formData, loanAmount: "", loanPurpose: "", otherPurpose: "" });
      }
    } catch (err) {
      Toast.show({ 
        type: "error", 
        text1: "Submission Failed", 
        text2: "Something went wrong. Please try again.",
        position: 'bottom'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  let totalLoanBalance = 0;
  let loanAmount = 0;
  let totalRepayment = 0;

  if (loanId && !isDataLoading) {
    const currentLoan = loans.find(loan => loan._id === loanId);
    loanAmount = parseFloat(currentLoan?.loan_amount || 0);
    totalRepayment = parseFloat(paymentsSummary?.totalPaidAmount || 0);
    totalLoanBalance = loanAmount - totalRepayment;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      
      {!loanId && <Header userId={userId} navigation={navigation} />}

      <View style={styles.outerBoxContainer}>
        <View style={styles.fixedTitleContainer}>
              {loanId && (
                <TouchableOpacity
                  onPress={() => {
                    setLoanId(null);
                    setCurrentPage(1);
                  }}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back-outline" size={28} color={Colors.darkText} />
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
          <ScrollView contentContainerStyle={styles.scrollableContentArea} showsVerticalScrollIndicator={false}>

            {loanId ? (
              isDataLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryBlue} />
                </View>
              ) : (
                <>
                  {/* Summary Card with Accordion */}
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
                              ₹ {formatNumberIndianStyle(totalLoanBalance)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                          name={isSummaryExpanded ? "chevron-up" : "chevron-down"}
                          size={24}
                          color={Colors.darkText}
                      />
                    </TouchableOpacity>

                    {isSummaryExpanded && !paymentsError && (
                      <View style={styles.summaryDetailsContainer}>
                        <View style={styles.summaryDetailItem}>
                          <Ionicons name="cash-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>Original Loan Amount</Text>
                          <Text style={[styles.detailValueVertical, { color: Colors.primaryBlue, fontWeight: '900' }]}>
                            ₹ {formatNumberIndianStyle(loanAmount)}
                          </Text>
                        </View>
                        <View style={styles.summaryDetailItem}>
                          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.successGreen} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>TOTAL PAID</Text>
                          <Text style={[styles.detailValueVertical, { color: Colors.successGreen, fontWeight: '900' }]}>
                            ₹ {formatNumberIndianStyle(totalRepayment)}
                          </Text>
                        </View>
                        <View style={styles.summaryDetailItem}>
                          <Ionicons name="calculator-outline" size={20} color={Colors.primaryBlue} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>Remaining Balance</Text>
                          <Text style={[styles.detailValueVertical, { color: Colors.primaryBlue, fontWeight: '900' }]}>
                            ₹ {formatNumberIndianStyle(totalLoanBalance)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Payment History List */}
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

                    {/* Pagination */}
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
                              style={[styles.paginationBox, currentPage === pageNumber && styles.paginationBoxActive]}
                              onPress={() => setCurrentPage(pageNumber)}
                            >
                              <Text style={[styles.paginationBoxText, currentPage === pageNumber && styles.paginationBoxTextActive]}>
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
              <>
                {loans.length > 0 && (
                   <TouchableOpacity 
                     style={styles.applyAnotherLoanHeaderBtn}
                     onPress={() => setIsFormVisible(true)}
                   >
                     <Ionicons name="add-circle-outline" size={22} color={Colors.cardBackground} />
                     <Text style={styles.applyAnotherLoanHeaderText}>Need another loan? Apply Here</Text>
                   </TouchableOpacity>
                )}

                {loans.length > 0 ? (
                  loans.map((loan) => (
                    <View key={loan._id} style={styles.loanCard}>
                      <View style={styles.loanCardHeaderBar}>
                        <Ionicons name="business-outline" size={24} color={Colors.primaryBlue} style={{ marginRight: 10 }} />
                        <View style={styles.cardTitleContainer}>
                          <Text style={styles.cardTitle}>Loan Account</Text>
                          <Text style={styles.cardSubtitle}>ID: {loan.loan_id.substring(0, 10)}</Text>
                        </View>
                      </View>
                      <View style={styles.detailsList}>
                        <View style={styles.detailItemVertical}>
                          <Ionicons name="cash-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>Loan Amount</Text>
                          <Text style={[styles.detailValueVertical, styles.amountValueStyle]}>
                            ₹ {formatNumberIndianStyle(loan.loan_amount)}
                          </Text>
                        </View>
                        <View style={styles.detailItemVertical}>
                          <Ionicons name="calendar-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>Tenure</Text>
                          <Text style={styles.detailValueVertical}>{loan.tenure} days</Text>
                        </View>
                        <View style={styles.detailItemVertical}>
                          <Ionicons name="time-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                          <Text style={styles.detailLabelVertical}>Start Date</Text>
                          <Text style={styles.detailValueVertical}>{new Date(loan.start_date).toLocaleDateString()}</Text>
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
                  <View style={styles.noLoanContainer}>
                      <View style={styles.noLoanHeader}>
                        <Ionicons name="rocket-outline" size={60} color={Colors.cardBackground} />
                        <Text style={styles.noLoanTitle}>Unlock Your Potential</Text>
                      </View>
                      <Text style={styles.noLoanMessage}>
                          You currently have no active loans. Ready to make a move? Take a loan and enjoy the flexibility.
                      </Text>
                      <Text style={styles.requestLoanSentence}>
                        Request your next loan instantly by applying below!
                      </Text>
                      <View style={styles.contactGroup}>
                          <TouchableOpacity onPress={() => setIsFormVisible(true)} style={styles.contactButtonPhone}>
                              <Ionicons name="document-text-outline" size={20} color={Colors.cardBackground} />
                              <Text style={styles.contactButtonText}>Apply for Personal Loan</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={handlePhonePress} style={styles.contactButtonEmail}>
                              <Ionicons name="call-outline" size={20} color={Colors.accentColor} />
                              <Text style={styles.contactButtonTextEmail}>Call Us: {CONTACT_PHONE}</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>

      {/* --- FORM MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={isFormVisible} onRequestClose={() => setIsFormVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personal Loan Request Form</Text>
              <TouchableOpacity onPress={() => setIsFormVisible(false)}>
                <Ionicons name="close-circle" size={30} color={Colors.mediumText} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formSectionLabel}>Applicant Details:</Text>
              
              <Text style={styles.inputLabel}>Full Name:</Text>
              <TextInput style={styles.input} value={formData.fullName} onChangeText={(txt) => setFormData({...formData, fullName: txt})} placeholder="Enter Full Name" />
              
              <Text style={styles.inputLabel}>Phone Number:</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={formData.phoneNumber} onChangeText={(txt) => setFormData({...formData, phoneNumber: txt})} placeholder="Mobile Number" />
              
              <Text style={styles.inputLabel}>Required Loan Amount (₹):</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.loanAmount} onChangeText={(txt) => setFormData({...formData, loanAmount: txt})} placeholder="e.g. 250000" />
              
              <Text style={styles.inputLabel}>Purpose of Loan:</Text>
              <View style={styles.purposeGrid}>
                {PURPOSE_OPTIONS.map((option) => (
                  <TouchableOpacity 
                    key={option} 
                    style={[
                      styles.purposeChip, 
                      formData.loanPurpose === option && styles.purposeChipSelected
                    ]}
                    onPress={() => setFormData({...formData, loanPurpose: option})}
                  >
                    <Text style={[
                      styles.purposeChipText, 
                      formData.loanPurpose === option && styles.purposeChipTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input field if "Others" is selected */}
              {formData.loanPurpose === "Others" && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={styles.inputLabel}>Please specify:</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.otherPurpose} 
                    onChangeText={(txt) => setFormData({...formData, otherPurpose: txt})} 
                    placeholder="Enter your specific reason" 
                  />
                </View>
              )}

              <View style={styles.certificationBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.mediumText} />
                <Text style={styles.certificationText}>I certify that information provided is true and accurate.</Text>
              </View>
              <TouchableOpacity style={[styles.submitFormButton, isSubmitting && { opacity: 0.7 }]} onPress={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitFormButtonText}>Submit Application</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast position="bottom" bottomOffset={60} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBlue, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  outerBoxContainer: { flex: 1, backgroundColor: Colors.lightBackground, margin: 10, borderRadius: 20, marginBottom:50, overflow: 'hidden' },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  fixedTitleContainer: { backgroundColor: Colors.cardBackground, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 15, alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.lightGrayBorder },
  scrollableContentArea: { flexGrow: 1, backgroundColor: Colors.cardBackground, paddingHorizontal: 25, paddingBottom: 25 },
  backButton: { position: "absolute", left: 30, top: 20, zIndex: 10 },
  sectionTitle: { fontSize: 26, fontWeight: "900", color: Colors.darkText, marginTop: 5 },
  subHeading: { fontSize: 13, color: Colors.mediumText, textAlign: "center" },
  errorText: { textAlign: "center", color: "#E74C3C", marginTop: 20, fontSize: 16, fontWeight: "600" },
  applyAnotherLoanHeaderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.vibrantBlue, padding: 12, borderRadius: 12, marginTop: 15, marginBottom: 5 },
  applyAnotherLoanHeaderText: { color: Colors.cardBackground, fontWeight: 'bold', marginLeft: 10, fontSize: 14 },
  loanCard: { backgroundColor: Colors.cardBackground, borderRadius: 15, marginBottom: 20, elevation: 10, borderWidth: 3, borderColor: Colors.lightGrayBorder, overflow: 'hidden', marginTop: 10 },
  loanCardHeaderBar: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: Colors.softBlueAccent, borderBottomWidth: 1, borderBottomColor: Colors.lightGrayBorder },
  summaryCard: { borderLeftColor: Colors.vibrantBlue },
  cardHeader: { flexDirection: "row", alignItems: "center", flex: 1 },
  accordionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.lightGrayBorder },
  summaryDetailsContainer: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: Colors.softGrayBackground },
  summaryDetailItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10, backgroundColor: Colors.cardBackground, borderRadius: 8, marginBottom: 5 },
  iconContainer: { width: 45, height: 45, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 15 },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.darkText },
  cardSubtitle: { fontSize: 12, color: Colors.mediumText, marginTop: 2 },
  summaryValue: { fontSize: 30, fontWeight: "bold", marginTop: 4 }, 
  detailsList: { flexDirection: 'column', padding: 10, backgroundColor: Colors.softGrayBackground, borderRadius: 10, marginHorizontal: 15, marginVertical: 15 },
  detailItemVertical: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 10, backgroundColor: Colors.cardBackground, borderRadius: 10, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: Colors.vibrantBlue },
  detailLabelVertical: { fontSize: 15, color: Colors.mediumText, flex: 2, fontWeight: '500' },
  detailValueVertical: { fontSize: 15, fontWeight: "700", color: Colors.darkText, flex: 3, textAlign: 'right' },
  amountValueStyle: { fontSize: 15, fontWeight: "900", color: Colors.primaryBlue },
  viewPaymentsButton: { backgroundColor: Colors.accentColor, paddingVertical: 14, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, alignItems: "center" },
  viewPaymentsButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  paymentHistoryTitle: { fontSize: 18, fontWeight: "800", color: Colors.darkText, marginBottom: 10, marginTop: 5, borderBottomWidth: 1, borderBottomColor: Colors.lightGrayBorder, paddingBottom: 5 },
  paymentCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.cardBackground, borderRadius: 10, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  paymentDetailsRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", marginLeft: 15, alignItems: "center" },
  receiptText: { fontSize: 14, fontWeight: "600", color: Colors.darkText },
  amountText: { fontSize: 14, fontWeight: "bold", color: Colors.vibrantBlue },
  dateText: { fontSize: 12, color: Colors.mediumText },
  emptyText: { marginTop: 14, fontSize: 16, color: Colors.mediumText, textAlign: "center" },
  paginationContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 20 },
  paginationArrowButton: { padding: 8, backgroundColor: Colors.cardBackground, borderRadius: 6, borderWidth: 1, borderColor: Colors.lightGrayBorder, marginHorizontal: 2 },
  paginationBox: { width: 32, height: 32, borderRadius: 6, backgroundColor: Colors.paginationInactive, justifyContent: "center", alignItems: "center", marginHorizontal: 3 },
  paginationBoxActive: { backgroundColor: Colors.primaryBlue, borderColor: Colors.primaryBlue },
  paginationBoxText: { fontSize: 14, fontWeight: "bold", color: Colors.paginationInactiveText },
  paginationBoxTextActive: { color: Colors.paginationActiveText },
  paginationEllipsis: { fontSize: 16, color: Colors.mediumText, marginHorizontal: 4 },
  noLoanContainer: { alignItems: 'center', backgroundColor: Colors.primaryBlue, borderRadius: 16, overflow: 'hidden', marginTop: 5, elevation: 8 },
  noLoanHeader: { width: '100%', padding: 25, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.2)' },
  noLoanTitle: { fontSize: 24, fontWeight: '900', color: Colors.cardBackground, marginTop: 10 },
  noLoanMessage: { fontSize: 16, color: Colors.cardBackground, textAlign: 'center', padding: 20 },
  requestLoanSentence: { fontSize: 15, fontWeight: '600', color: Colors.cardBackground, textAlign: 'center', backgroundColor: Colors.vibrantBlue, padding: 8, width: '100%' },
  contactGroup: { width: '100%', padding: 20, backgroundColor: Colors.cardBackground, alignItems: 'center' },
  contactButtonPhone: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successGreen, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, width: '100%', justifyContent: 'center', marginBottom: 10 },
  contactButtonEmail: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: Colors.accentColor, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, width: '100%', justifyContent: 'center' },
  contactButtonText: { color: Colors.cardBackground, fontSize: 16, fontWeight: '700', marginLeft: 10 },
  contactButtonTextEmail: { color: Colors.accentColor, fontSize: 16, fontWeight: '700', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.cardBackground, borderRadius: 20, width: '100%', maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.lightGrayBorder, paddingBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.primaryBlue },
  formSectionLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: Colors.darkText },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.mediumText, marginBottom: 5 },
  input: { borderBottomWidth: 1, borderBottomColor: Colors.lightGrayBorder, paddingVertical: 8, marginBottom: 20, fontSize: 15, color: Colors.darkText },
  
  // New Styles for Option Boxes (Chips)
  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  purposeChip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.lightGrayBorder, backgroundColor: Colors.softGrayBackground, minWidth: '30%', alignItems: 'center' },
  purposeChipSelected: { borderColor: Colors.primaryBlue, backgroundColor: Colors.softBlueAccent },
  purposeChipText: { color: Colors.mediumText, fontWeight: '600', fontSize: 12 },
  purposeChipTextSelected: { color: Colors.primaryBlue, fontWeight: 'bold' },
  
  submitFormButton: { backgroundColor: Colors.primaryBlue, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitFormButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  certificationBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 15, backgroundColor: Colors.softGrayBackground, padding: 10, borderRadius: 8 },
  certificationText: { fontSize: 12, color: Colors.mediumText, marginLeft: 10, fontStyle: 'italic' }
});

export default MyLoan;