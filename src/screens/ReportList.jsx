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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContextProvider } from "../context/UserProvider";
import Toast from "react-native-toast-message";
import axios from "axios";
import url from "../data/url"; 

// --- STYLISTIC COLORS MATCHING MyLoan.jsx, but with Pigme Accent ---
const Colors = {
  primaryBlue: "#053B90", // Deep Primary Brand Color
  lightBackground: "#F5F8FA", // Very light, clean background
  cardBackground: "#FFFFFF",
  darkText: "#212529", // Near-black for strong contrast
  mediumText: "#6C757D", // Muted secondary text
  accentColor: "#0c7596ff", // 💥 Pigme Accent (Vibrant Orange)
  shadowColor: "rgba(0,0,0,0.2)", // Darker shadow for more lift
  vibrantBlue: "#17A2B8", // Teal/Cyan for secondary values
  lightGrayBorder: "#E9ECEF", // Light separator
  softGrayBackground: "#FAFAFC", // Used for detail list background
  paginationActive: "#053B90",
  paginationInactive: "#DEE2E6",
  paginationActiveText: "#FFFFFF",
  paginationInactiveText: "#495057",
  successGreen: "#28A745", // Green for Success/Call
  softPigmeAccent: "#ecded2ff", // 💥 Light background for Pigme card header
};

const DOCS_PER_PAGE = 7;

// --- Contact Constants ---
const CONTACT_EMAIL = 'info.mychits@gmail.com';
const CONTACT_PHONE = '+919483900777';

const ReportList = ({ route, navigation }) => {
  console.log("🚀 ReportList Component Initialized");
  console.log("📍 Route params:", route?.params);
  console.log("🧭 Navigation object:", navigation ? "Available" : "Not Available");
  
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  console.log("👤 User Context - appUser:", appUser);
  console.log("🆔 User ID:", userId);

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
  
  // Custom property to calculate current savings (Total Paid Amount)
  const currentSavings = paymentsSummary ? parseFloat(paymentsSummary.totalPaidAmount || 0) : 0;

  // Helper functions to handle linking
  const handleEmailPress = () => {
    console.log("📧 Email link pressed - Opening:", CONTACT_EMAIL);
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  const handlePhonePress = () => {
    console.log("📞 Phone link pressed - Calling:", CONTACT_PHONE);
    Linking.openURL(`tel:${CONTACT_PHONE}`);
  };

  // ✅ 1. Fetch Pigme accounts list
  useEffect(() => {
    console.log("🔄 [Effect 1] Fetch Pigme Accounts triggered");
    console.log("🔍 [Effect 1] Current userId:", userId);
    
    if (!userId) {
      console.log("⚠️ [Effect 1] No userId found, skipping fetch");
      return;
    }
    
    const fetchPigme = async () => {
      console.log("🌐 [Fetch Pigme] Starting API call...");
      setIsLoading(true);
      
      try {
        const apiUrl = `${url}/pigme/get-pigme-customer-by-user-id/${userId}`;
        console.log("🔗 [Fetch Pigme] API URL:", apiUrl);
        
        const response = await axios.get(apiUrl);
        console.log("✅ [Fetch Pigme] Response received:", response.data);
        console.log("📊 [Fetch Pigme] Response status:", response.status);
        console.log("📦 [Fetch Pigme] Raw data:", JSON.stringify(response.data, null, 2));
        
        // Normalize the structure
        const accounts = (response.data || []).map(item => ({
            ...item,
            _id: item._id || item.pigme?._id,
            pigme_id: item.pigme_id || item.pigme?.pigme_id,
        }));
        
        console.log("🔄 [Fetch Pigme] Normalized accounts:", accounts);
        console.log("📈 [Fetch Pigme] Total accounts found:", accounts.length);
        
        setPigmeAccounts(accounts);
        console.log("✅ [Fetch Pigme] State updated with accounts");
        
      } catch (err) {
        console.error("❌ [Fetch Pigme] Error occurred:", err);
        console.error("❌ [Fetch Pigme] Error message:", err.message);
        console.error("❌ [Fetch Pigme] Error response:", err.response?.data);
        console.error("❌ [Fetch Pigme] Error status:", err.response?.status);
        
        setError("Failed to fetch Pigme data.");
        Toast.show({ type: "error", text1: "Error", text2: "Could not load Pigme accounts." });
      } finally {
        console.log("🏁 [Fetch Pigme] Request completed, setting isLoading to false");
        setIsLoading(false);
      }
    };
    
    fetchPigme();
  }, [userId]);

  // ✅ 2. Fetch Pigme summary and payments
  useEffect(() => {
    console.log("🔄 [Effect 2] Fetch Pigme Summary & Payments triggered");
    console.log("🔍 [Effect 2] Current userId:", userId);
    console.log("🔍 [Effect 2] Selected Pigme:", selectedPigme);
    console.log("🔍 [Effect 2] Current Page:", currentPage);
    
    if (!userId || !selectedPigme) {
      console.log("⚠️ [Effect 2] Missing userId or selectedPigme, skipping fetch");
      return;
    }
    
    const fetchData = async () => {
      console.log("🌐 [Fetch Summary] Starting API calls...");
      setIsDataLoading(true);
      
      const pigmeId = selectedPigme._id;
      console.log("🆔 [Fetch Summary] Using Pigme ID:", pigmeId);
      
      try {
        const summaryApiUrl = `${url}/payment/user/${userId}/pigme/${pigmeId}/summary`;
        const paymentsApiUrl = `${url}/payment/pigme/${pigmeId}/user/${userId}/total-docs/${DOCS_PER_PAGE}/page/${currentPage}`;

        console.log("🔗 [Fetch Summary] Summary API URL:", summaryApiUrl);
        console.log("🔗 [Fetch Summary] Payments API URL:", paymentsApiUrl);

        const [summaryResponse, paymentsResponse] = await Promise.all([
          axios.get(summaryApiUrl),
          axios.get(paymentsApiUrl),
        ]);

        console.log("✅ [Fetch Summary] Summary response:", summaryResponse.data);
        console.log("✅ [Fetch Summary] Payments response:", paymentsResponse.data);
        console.log("📊 [Fetch Summary] Summary status:", summaryResponse.status);
        console.log("📊 [Fetch Summary] Payments status:", paymentsResponse.status);

        const summary = Array.isArray(summaryResponse.data) ? summaryResponse.data[0] : summaryResponse.data;
        console.log("🔄 [Fetch Summary] Processed summary:", summary);
        setPaymentsSummary(summary);

        const payments = paymentsResponse.data || [];
        console.log("🔄 [Fetch Summary] Processed payments:", payments);
        console.log("📈 [Fetch Summary] Total payments on this page:", payments.length);
        setTotalPayments(payments);

        if (payments.length > 0) {
          const sorted = [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          console.log("🔄 [Fetch Summary] Sorted payments by date");
          console.log("📌 [Fetch Summary] Latest payment:", sorted[0]);
          setLatestPayment(sorted[0]);
        } else {
          console.log("⚠️ [Fetch Summary] No payments found");
          setLatestPayment(null);
        }
        
        console.log("✅ [Fetch Summary] All states updated successfully");
        
      } catch (err) {
        console.error("❌ [Fetch Summary] Error occurred:", err);
        console.error("❌ [Fetch Summary] Error message:", err.message);
        console.error("❌ [Fetch Summary] Error response:", err.response?.data);
        console.error("❌ [Fetch Summary] Error status:", err.response?.status);
        
        Toast.show({ type: "error", text1: "Error", text2: "Failed to load Pigme payment history." });
      } finally {
        console.log("🏁 [Fetch Summary] Request completed, setting isDataLoading to false");
        setIsDataLoading(false);
      }
    };
    
    fetchData();
  }, [userId, selectedPigme, currentPage]);

  // ✅ 3. Fetch total pages
  useEffect(() => {
    console.log("🔄 [Effect 3] Fetch Total Pages triggered");
    console.log("🔍 [Effect 3] Current userId:", userId);
    console.log("🔍 [Effect 3] Selected Pigme:", selectedPigme);
    
    if (!userId || !selectedPigme) {
      console.log("⚠️ [Effect 3] Missing userId or selectedPigme, skipping fetch");
      return;
    }
    
    const fetchTotalPages = async () => {
      console.log("🌐 [Fetch Pages] Starting API call...");
      const pigmeId = selectedPigme._id;
      console.log("🆔 [Fetch Pages] Using Pigme ID:", pigmeId);
      
      try {
        const apiUrl = `${url}/payment/pigme/totalPages/user/${userId}/pigme/${pigmeId}/total-docs/${DOCS_PER_PAGE}`;
        console.log("🔗 [Fetch Pages] API URL:", apiUrl);
        
        const res = await axios.get(apiUrl);
        console.log("✅ [Fetch Pages] Response received:", res.data);
        console.log("📊 [Fetch Pages] Response status:", res.status);
        console.log("📄 [Fetch Pages] Total pages:", res.data.totalPages);
        
        setTotalPages(res.data.totalPages || 0);
        console.log("✅ [Fetch Pages] State updated with total pages");
        
      } catch (err) {
        console.error("❌ [Fetch Pages] Error occurred:", err);
        console.error("❌ [Fetch Pages] Error message:", err.message);
        console.error("❌ [Fetch Pages] Error response:", err.response?.data);
        console.error("❌ [Fetch Pages] Error status:", err.response?.status);
      }
    };
    
    fetchTotalPages();
  }, [userId, selectedPigme]);

  // ✅ Format number in Indian style (UNTOUCHED)
  const formatNumberIndianStyle = (num) => {
    console.log("💰 [Format Number] Input:", num);
    if (num === null || num === undefined) {
      console.log("⚠️ [Format Number] Null/undefined input, returning 0.00");
      return "0.00";
    }
    const safeNum = isNaN(parseFloat(num)) ? 0 : parseFloat(num);
    console.log("🔢 [Format Number] Parsed number:", safeNum);
    const number = safeNum.toFixed(2);
    const parts = number.toString().split(".");
    let integerPart = parts[0];
    const decimalPart = parts[1] ? "." + parts[1] : "";
    const isNegative = integerPart.startsWith("-");
    if (isNegative) integerPart = integerPart.substring(1);
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);
    const formatted =
      otherNumbers !== ""
        ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
        : lastThree;
    const result = (isNegative ? "-" : "") + formatted + decimalPart;
    console.log("✅ [Format Number] Formatted result:", result);
    return result;
  };

  const getPaginationNumbers = () => {
    console.log("📄 [Pagination] Calculating pagination numbers");
    console.log("📄 [Pagination] Current page:", currentPage);
    console.log("📄 [Pagination] Total pages:", totalPages);
    
    const pages = [];
    const limit = 3;
    const start = Math.max(1, currentPage - Math.floor(limit / 2));
    const end = Math.min(totalPages, start + limit - 1);
    
    console.log("📄 [Pagination] Start page:", start);
    console.log("📄 [Pagination] End page:", end);
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    
    const result = pages.filter((v, i, a) => a.indexOf(v) === i);
    console.log("✅ [Pagination] Generated pages:", result);
    return result;
  };
  
  // Renders a single Pigme account card (STYLED LIKE MyLoan CARD)
  const renderPigmeAccountCard = (pigme) => {
    console.log("🎨 [Render Card] Rendering Pigme account card");
    console.log("🎨 [Render Card] Pigme data:", pigme);
    
    return (
      <View
        key={pigme._id}
        style={styles.loanCard}
      >
          {/* Loan Card Header Bar */}
          <View style={[styles.loanCardHeaderBar, { backgroundColor: Colors.softPigmeAccent }]}>
              <Ionicons name="save-outline" size={24} color={Colors.accentColor} style={{ marginRight: 10 }} />
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Pigmy Account</Text>
                <Text style={styles.cardSubtitle}>ID: {pigme.pigme_id || "N/A"}</Text>
              </View>
          </View>
          
          {/* Vertical Details List */}
          <View style={styles.detailsList}>
              {/* Account ID Row */}
              <View style={styles.detailItemVertical}>
                  <Ionicons name="finger-print-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                  <Text style={styles.detailLabelVertical}>Account ID</Text>
                  <Text style={styles.detailValueVertical}>
                    {pigme.pigme_id || "N/A"}
                  </Text>
              </View>
             
              <View style={styles.detailItemVertical}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.vibrantBlue} style={styles.detailIcon}/>
                  <Text style={styles.detailLabelVertical}>Status</Text>
                  <Text style={styles.detailValueVertical}>
                      Active
                  </Text>
              </View>
          </View>
          
          <TouchableOpacity
            style={[styles.viewPaymentsButton, { backgroundColor: Colors.accentColor }]}
            onPress={() => {
              console.log("👆 [Button Press] View Deposits button pressed");
              console.log("👆 [Button Press] Selected Pigme:", pigme);
              setSelectedPigme(pigme);
              setCurrentPage(1);
              console.log("✅ [Button Press] State updated - selectedPigme and currentPage reset");
            }}
          >
            <Text style={styles.viewPaymentsButtonText}>View Deposits & Summary</Text>
          </TouchableOpacity>
      </View>
    );
  };

  // Renders the summary details view (STYLED LIKE MyLoan Summary Card)
  const renderPigmeDetails = () => {
    console.log("🎨 [Render Details] Rendering Pigme details view");
    console.log("🎨 [Render Details] Current savings:", currentSavings);
    console.log("🎨 [Render Details] Total payments:", totalPayments.length);
    console.log("🎨 [Render Details] Total pages:", totalPages);
    
    return (
      <>
        {/* UPDATED TOTAL SAVINGS SUMMARY CARD */}
        <View style={[styles.loanCard, styles.summaryCard, { borderColor: Colors.accentColor }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.accentColor }]}>
              <Ionicons name="trending-up-outline" size={28} color={Colors.cardBackground} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Total Savings</Text>
            </View>
          </View>
          <Text style={[styles.detailValue, styles.summaryValue, { color: Colors.accentColor }]}>
            ₹ {formatNumberIndianStyle(currentSavings)}
          </Text>
        </View>
        {/* END UPDATED TOTAL SAVINGS SUMMARY CARD */}

        {/* Payment History */}
        <View>
          <Text style={styles.paymentHistoryTitle}>Deposit History</Text>
          {totalPayments.length > 0 ? (
            totalPayments.map((pay, index) => {
              console.log(`🎨 [Render Payment ${index}] Receipt:`, pay.receipt_no);
              return (
                <View key={pay._id} style={styles.paymentCard}>
                  <Ionicons name="wallet-outline" size={22} color={Colors.accentColor} />
                  <View style={styles.paymentDetailsRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.receiptText} numberOfLines={1}>Receipt: {pay.receipt_no}</Text>
                      <Text style={styles.dateText}>{new Date(pay.pay_date).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <Text style={[styles.amountText, { color: Colors.accentColor }]}>₹ {formatNumberIndianStyle(pay.amount)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No deposits found for this Pigmy account.</Text>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => {
                  console.log("◀️ [Pagination] Previous button pressed");
                  const newPage = Math.max(1, currentPage - 1);
                  console.log("◀️ [Pagination] Moving to page:", newPage);
                  setCurrentPage(newPage);
                }}
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
                    style={[ styles.paginationBox, currentPage === pageNumber && styles.paginationBoxActive, ]}
                    onPress={() => {
                      console.log("🔢 [Pagination] Page button pressed:", pageNumber);
                      setCurrentPage(pageNumber);
                    }}
                  >
                    <Text
                      style={[ styles.paginationBoxText, currentPage === pageNumber && styles.paginationBoxTextActive, ]}
                    >
                      {pageNumber}
                    </Text>
                  </TouchableOpacity>
                )
              )}

              <TouchableOpacity
                disabled={currentPage === totalPages}
                onPress={() => {
                  console.log("▶️ [Pagination] Next button pressed");
                  const newPage = Math.min(totalPages, currentPage + 1);
                  console.log("▶️ [Pagination] Moving to page:", newPage);
                  setCurrentPage(newPage);
                }}
                style={styles.paginationArrowButton}
              >
                <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages ? Colors.mediumText : Colors.darkText} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </>
    );
  };
  
  // Renders the no Pigme account section (STYLED LIKE MyLoan NO LOAN SECTION)
  const renderNoPigmeFound = () => {
    console.log("🎨 [Render No Pigme] Rendering 'No Pigme Found' section");
    
    return (
      <View style={[styles.noLoanContainer, {backgroundColor: Colors.accentColor, shadowColor: Colors.accentColor}]}>
          <View style={[styles.noLoanHeader, {backgroundColor: Colors.accentColor, borderBottomColor: 'rgba(255, 255, 255, 0.2)'}]}>
        <Ionicons name="wallet-outline" size={60} color={Colors.cardBackground} />

            <Text style={styles.noLoanTitle}>Start Your Savings Journey</Text>
          </View>
          
          <Text style={styles.noLoanMessage}>
              You currently have no active Pigmy savings accounts. Start saving now and see your money grow.
          </Text>

          <Text style={[styles.requestLoanSentence, {backgroundColor: Colors.primaryBlue}]}>
              Request your new Pigmy account by contacting our executive now!
          </Text>
          
          <View style={styles.contactGroup}>
              <Text style={styles.noLoanSubMessage}>
                  Contact our executive to get started:
              </Text>
              
              <TouchableOpacity onPress={handlePhonePress} style={styles.contactButtonPhone}>
                  <Ionicons name="call-outline" size={20} color={Colors.cardBackground} />
                  <Text style={styles.contactButtonText}>
                      Request Pigmy: {CONTACT_PHONE}
                  </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleEmailPress} style={[styles.contactButtonEmail, {borderColor: Colors.accentColor}]}>
                  <Ionicons name="mail-outline" size={20} color={Colors.accentColor} />
                  <Text style={styles.contactButtonTextEmail}>
                      Email: {CONTACT_EMAIL}
                  </Text>
              </TouchableOpacity>
          </View>
      </View>
    );
  };

  console.log("🎨 [Main Render] Component rendering...");
  console.log("📊 [Main Render] Current state - isLoading:", isLoading);
  console.log("📊 [Main Render] Current state - error:", error);
  console.log("📊 [Main Render] Current state - pigmeAccounts count:", pigmeAccounts.length);
  console.log("📊 [Main Render] Current state - selectedPigme:", selectedPigme ? "Selected" : "None");
  console.log("📊 [Main Render] Current state - isDataLoading:", isDataLoading);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      
      {!selectedPigme && <Header userId={userId} navigation={navigation} />}

      <View style={styles.outerBoxContainer}>
        
        {/* FIXED CONTENT: Title and Subheading */}
        <View style={styles.fixedTitleContainer}>
              {selectedPigme && (
                <TouchableOpacity
                  onPress={() => {
                    console.log("🔙 [Back Button] Back button pressed");
                    console.log("🔙 [Back Button] Clearing selectedPigme");
                    setSelectedPigme(null);
                    setCurrentPage(1);
                    console.log("✅ [Back Button] State reset complete");
                  }}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back-outline" size={28} color={Colors.darkText} />
                </TouchableOpacity>
              )}
              <Text style={styles.sectionTitle}>Pigmy Reports</Text>
              <Text style={styles.subHeading}>
                {selectedPigme ? "Your recent deposit and summary details." : "Your current Pigmy savings accounts."}
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
          <ScrollView contentContainerStyle={styles.scrollableContentArea} showsVerticalScrollIndicator={false}>
            {selectedPigme ? (
              isDataLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryBlue} />
                </View>
              ) : (
                renderPigmeDetails()
              )
            ) : (
              // Pigme Account List
              pigmeAccounts.length > 0 ? (
                pigmeAccounts.map(renderPigmeAccountCard)
              ) : (
                renderNoPigmeFound()
              )
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </View>
      <Toast />
    </SafeAreaView>
  );
};

// 💅 STYLES COPIED AND ADAPTED FROM MyLoan.jsx
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
    
    // *** PREMIUM Pigme Card Styles (Matching loanCard) ***
    loanCard: {
      backgroundColor: Colors.cardBackground,
      borderRadius: 15,
      padding: 0,
      marginBottom: 20,
      elevation: 10,
      shadowColor: Colors.shadowColor,
      shadowOffset: { width: 0, height: 5 }, 
      shadowOpacity: 0.15,
      shadowRadius: 10,
      borderWidth: 3,
      borderColor: Colors.lightGrayBorder,
      overflow: 'hidden',
      marginTop: 10,
    },
    loanCardHeaderBar: { // ADAPTED COLOR
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: Colors.softPigmeAccent, // Light Pigme background
      borderBottomWidth: 1,
      borderBottomColor: Colors.lightGrayBorder,
    },
    summaryCard: { // ADAPTED BORDER COLOR
      borderLeftColor: Colors.accentColor, // Pigme Orange
      marginBottom: 20,
      padding: 20,
      borderWidth: 3, // Ensure this card has the full border style
    },
    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
    iconContainer: { width: 45, height: 45, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 15 }, // Background set inline/in summary card
    cardTitleContainer: { flex: 1 },
    cardTitle: { fontSize: 17, fontWeight: "700", color: Colors.darkText },
    cardSubtitle: { fontSize: 12, color: Colors.mediumText, marginTop: 2 },
    
    summaryValue: { fontSize: 32, fontWeight: "bold", textAlign: 'center', marginTop: 1 }, // Color set inline to accentColor

    // *** STYLISH VERTICAL PIGME DETAILS (Matching detailsList) ***
    detailsList: {
      flexDirection: 'column', 
      padding: 10, 
      backgroundColor: Colors.softGrayBackground, 
      borderRadius: 10,
      marginHorizontal: 15, 
      marginVertical: 15,
    },
    detailItemVertical: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 10,
      backgroundColor: Colors.cardBackground,
      borderRadius: 10,
      marginBottom: 5,
      borderLeftWidth: 3, 
      borderLeftColor: Colors.accentColor, // Pigme Accent
    },
    detailIcon: {
      marginRight: 15,
    },
    detailLabelVertical: {
      fontSize: 15,
      color: Colors.mediumText,
      flex: 2, 
      fontWeight: '500',
    },
    detailValueVertical: {
      fontSize: 15,
      fontWeight: "700",
      color: Colors.darkText,
      flex: 3, 
      textAlign: 'right', 
    },
    amountValueStyle: {
      fontSize: 15,
      fontWeight: "900",
      color: Colors.primaryBlue,
    },
    // *** END STYLISH VERTICAL PIGME DETAILS ***
    
    viewPaymentsButton: { // ADAPTED COLOR
      backgroundColor: Colors.accentColor,
      paddingVertical: 14,
      borderRadius: 0,
      borderBottomLeftRadius: 15, 
      borderBottomRightRadius: 15, 
      alignItems: "center",
      marginTop: 0,
      elevation: 0,
    },
    viewPaymentsButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    
    // Payment List Styles (ADAPTED COLORS)
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
    amountText: { fontSize: 14, fontWeight: "bold" }, // Color set inline to accentColor
    dateText: { fontSize: 12, color: Colors.mediumText },
    emptyText: { marginTop: 14, fontSize: 16, color: Colors.mediumText, textAlign: "center" },


    // Pagination styles (Matching MyLoan)
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
    
    // --- NO PIGME FOUND SECTION STYLES (MATCHING MyLoan NO LOAN) ---
    noLoanContainer: { // Renamed from noPigmeContainer
      alignItems: 'center',
      padding: 0, 
      backgroundColor: Colors.primaryBlue, // Background set inline to accentColor
      borderRadius: 16,
      overflow: 'hidden', 
      marginTop: 5, 
      elevation: 8,
      shadowColor: Colors.primaryBlue, // Shadow set inline to accentColor
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
    },
    noLoanHeader: { // Renamed from noPigmeHeader
      width: '100%',
      padding: 25,
      alignItems: 'center',
      // Background set inline to accentColor
      borderBottomWidth: 1,
      // Border color set inline
    },
    noLoanTitle: { // Renamed from noPigmeTitle
      fontSize: 24,
      fontWeight: '900',
      color: Colors.cardBackground, 
      marginTop: 10,
      textAlign: 'center',
    },
    noLoanMessage: { // Renamed from noPigmeMessage
      fontSize: 16,
      color: Colors.cardBackground,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    requestLoanSentence: { // Renamed from requestPigmeSentence
      fontSize: 15,
      fontWeight: '600',
      color: Colors.cardBackground,
      textAlign: 'center',
      // Background set inline
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
    noLoanSubMessage: { // Renamed from noPigmeSubMessage
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
      // Border color set inline
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
      // Color set inline
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 10,
    },
});

export default ReportList;