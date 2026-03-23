
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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";
import url from "../data/url";
import axios from "axios";

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F5F8FA",
  cardBackground: "#FFFFFF",
  darkText: "#212529",
  mediumText: "#6C757D",
  vibrantBlue: "#17A2B8",
  lightGrayBorder: "#E9ECEF",
  softGrayBackground: "#FAFAFC",
  successGreen: "#28A745",
  softBlueAccent: "#E6F0FF",
  errorRed: "#DC3545",
  errorBg: "#FFF5F5",
  errorBorder: "#FFCDD2",
  gold: "#F59E0B",
  goldLight: "#FEF3C7",
  pendingOrange: "#F97316",
  pendingBg: "#FFF7ED",
  rejectedRed: "#EF4444",
  rejectedBg: "#FEF2F2",
  approvedGreen: "#16A34A",
  approvedBg: "#F0FDF4",
  whatsappGreen: "#25D366",
  callBlue: "#34B7F1",
};

const LoanReqScreen = ({ navigation }) => {
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const SUPPORT_PHONE = "919483900777"; 

  const handleCallSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch((err) => {
      Alert.alert("Error", "Could not open phone dialer.");
      console.error(err);
    });
  };

  const openWhatsApp = async () => {
    const message = "Hello, I need assistance with My Loan Application.";
    const whatsappUrl = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on this device.");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  useEffect(() => {
    if (!userId) return;
    const fetchRequests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${url}/loans/get-loan-request-by-user/${userId}`);
        const sortedData = (res.data?.data || []).sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setRequests(sortedData);
      } catch (err) {
        setError("Could not load loan requests.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [userId]);

  const ContactSupportCard = () => (
    <View style={styles.contactContainer}>
      <View style={styles.contactHeaderRow}>
        <View style={styles.contactIconCircle}>
            <Ionicons name="headset" size={20} color="#fff" />
        </View>
        <Text style={styles.helpSentence}>Need Help?</Text>
      </View>
      <Text style={styles.helpSubSentence}>Please contact our support team regarding your application.</Text>
      
      <View style={styles.contactButtonsRow}>
        <TouchableOpacity 
            style={[styles.contactBtn, styles.callBtn]} 
            onPress={handleCallSupport}
            activeOpacity={0.8}
        >
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>Call Us</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.contactBtn, styles.whatsappBtn]} 
            onPress={openWhatsApp}
            activeOpacity={0.8}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Reusable Row Component for the new vertical layout
  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <View style={styles.rowIconCircle}>
            <Ionicons name={icon} size={18} color={Colors.primaryBlue} />
        </View>
        <View style={styles.rowTextContainer}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      <Header userId={userId} navigation={navigation} />
      
      <View style={styles.mainContentWrapper}>
        <View style={styles.innerContentArea}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Application History</Text>
              <Text style={styles.pageSubtitle}>Track the status of your loan requests</Text>
            </View>

            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={Colors.primaryBlue} />
                <Text style={styles.stateText}>Loading history...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerState}>
                 <View style={styles.messageBox}>
                    <View style={styles.messageIconBox}>
                        <Ionicons name="alert-circle" size={45} color={Colors.errorRed} />
                    </View>
                    <Text style={styles.messageTitle}>Oops!</Text>
                    <Text style={styles.messageText}>{error}</Text>
                    <TouchableOpacity style={styles.primaryActionBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.primaryActionBtnText}>Go Back</Text>
                    </TouchableOpacity>
                 </View>
                <ContactSupportCard />
              </View>
            ) : requests.length === 0 ? (
              <View style={styles.centerState}>
                 <View style={styles.messageBox}>
                    <View style={[styles.messageIconBox, { backgroundColor: Colors.softBlueAccent }]}>
                        <Ionicons name="file-tray-outline" size={45} color={Colors.primaryBlue} />
                    </View>
                    <Text style={styles.messageTitle}>No Applications Yet</Text>
                    <Text style={styles.messageText}>You haven't submitted any loan requests. Start your journey today!</Text>
                    <TouchableOpacity style={styles.primaryActionBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="add-circle" size={20} color="#fff" />
                        <Text style={styles.primaryActionBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                 </View>
                 <ContactSupportCard />
              </View>
            ) : (
              <>
                <View style={styles.historyBoxHeader}>
                  <View>
                    <Text style={styles.headerTitle}>Requests Log</Text>
                    <Text style={styles.headerSubtitle}>{requests.length} Total Request(s)</Text>
                  </View>
                  <TouchableOpacity 
                      onPress={() => setIsExpanded(!isExpanded)}
                      style={styles.toggleBtn}
                  >
                      <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={24} 
                          color={Colors.primaryBlue} 
                      />
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <View style={styles.cardsList}>
                    {requests.map((req) => {
                      const status = (req.approval_status || "").toLowerCase();
                      let statusConfig = {
                          color: Colors.mediumText,
                          bg: "#F1F3F5",
                          icon: "help-circle",
                          label: "Unknown"
                      };

                      if (status === "approved") {
                          statusConfig = { color: Colors.approvedGreen, bg: Colors.approvedBg, icon: "checkmark-circle", label: "Approved" };
                      } else if (status === "pending") {
                          statusConfig = { color: Colors.pendingOrange, bg: Colors.pendingBg, icon: "time", label: "Pending" };
                      } else if (status === "rejected") {
                          statusConfig = { color: Colors.rejectedRed, bg: Colors.rejectedBg, icon: "close-circle", label: "Rejected" };
                      }

                      return (
                        <View key={req._id} style={styles.stylishCard}>
                          
                          {/* Top Accent Line */}
                          <View style={[styles.cardTopAccent, { backgroundColor: statusConfig.color }]} />

                          {/* Top Section: Amount & Status */}
                          <View style={styles.cardTopSection}>
                            <View>
                                <Text style={styles.cardLabel}>Loan Amount</Text>
                                <Text style={styles.cardAmount}>
                                    ₹{Number(req.loan_amount || 0).toLocaleString("en-IN")}
                                </Text>
                            </View>
                            {/* Floating Status Badge */}
                            <View style={[styles.floatingStatusBadge, { backgroundColor: statusConfig.bg }]}>
                                <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
                                <Text style={[styles.floatingStatusText, { color: statusConfig.color }]}>
                                    {statusConfig.label}
                                </Text>
                            </View>
                          </View>

                          {/* Middle Section: Vertical List (Date, Purpose) */}
                          <View style={styles.detailsListContainer}>
                             <InfoRow 
                                icon="calendar-outline" 
                                label="Applied On" 
                                value={req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"} 
                             />
                             
                             {/* Divider Line inside list */}
                             <View style={styles.listDivider} />

                             <InfoRow 
                                icon="flag-outline" 
                                label="Purpose" 
                                value={req.loan_purpose || "General Loan"} 
                             />
                          </View>

                          {/* Bottom Section: Remarks */}
                          {!!req.remarks && (
                              <View style={styles.remarksStylishContainer}>
                                  <View style={styles.remarksHeader}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.mediumText} />
                                    <Text style={styles.remarksLabel}>Remarks</Text>
                                  </View>
                                  <Text style={styles.remarksValueText}>{req.remarks}</Text>
                              </View>
                          )}

                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {!isLoading && <ContactSupportCard />}

          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBlue, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 12, 
    paddingTop: 5, 
  },
  innerContentArea: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20, 
    overflow: "hidden", 
    marginBottom: 5, 
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingBottom: 30, 
    paddingHorizontal: 15,
  },
  pageHeader: { 
    paddingHorizontal: 5, 
    paddingVertical: 20, 
    marginBottom: 5, 
  },
  pageTitle: { fontSize: 26, fontWeight: "900", color: Colors.darkText, marginBottom: 4, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: Colors.mediumText, fontWeight: "500" },
  
  // Center States
  centerState: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40, gap: 25 },
  stateText: { fontSize: 16, color: Colors.mediumText, fontWeight: "500", textAlign: 'center' },
  
  // Message Box
  messageBox: {
      backgroundColor: "#FFFFFF",
      width: "90%",
      borderRadius: 28,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 6,
      borderWidth: 1,
      borderColor: Colors.lightGrayBorder,
  },
  messageIconBox: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#FFF5F5",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
  },
  messageTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: Colors.darkText,
      marginBottom: 8,
      textAlign: "center"
  },
  messageText: {
      fontSize: 15,
      color: Colors.mediumText,
      textAlign: "center",
      lineHeight: 23,
      marginBottom: 25,
  },
  primaryActionBtn: {
      flexDirection: "row",
      backgroundColor: Colors.primaryBlue,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 30,
      alignItems: "center",
      gap: 8,
      shadowColor: Colors.primaryBlue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
  },
  primaryActionBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
  },

  // History Header
  historyBoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 10,
    marginBottom: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.darkText, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: Colors.mediumText, marginTop: 2, fontWeight: "500" },
  toggleBtn: { padding: 5, backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: Colors.lightGrayBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  
  cardsList: {
    gap: 20,
    paddingBottom: 10
  },

  // --- PREMIUM CARD DESIGN ---
  stylishCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
    position: "relative",
  },
  cardTopAccent: {
      height: 4,
      width: "100%",
  },
  cardTopSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 24,
      paddingBottom: 15,
  },
  cardLabel: {
      fontSize: 12,
      color: Colors.mediumText,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: "700",
      marginBottom: 6,
      opacity: 0.8,
  },
  cardAmount: {
      fontSize: 32,
      fontWeight: "900",
      color: Colors.primaryBlue,
      letterSpacing: -1,
      lineHeight: 36,
  },
  floatingStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 25,
      gap: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  floatingStatusText: {
      fontSize: 13,
      fontWeight: "800",
      textTransform: "capitalize",
  },
  
  // Vertical Details List
  detailsListContainer: {
      paddingHorizontal: 20,
      paddingBottom: 10,
  },
  infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 15,
  },
  rowIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: Colors.softBlueAccent,
      justifyContent: "center",
      alignItems: "center",
  },
  rowTextContainer: {
      flex: 1,
      justifyContent: "center",
  },
  rowLabel: {
      fontSize: 11,
      color: Colors.mediumText,
      fontWeight: "700",
      textTransform: "uppercase",
      marginBottom: 2,
      letterSpacing: 0.5,
  },
  rowValue: {
      fontSize: 15,
      color: Colors.darkText,
      fontWeight: "600",
  },
  listDivider: {
      height: 1,
      backgroundColor: "#F0F2F5",
      marginLeft: 59, // Indent to align with text
  },

  // Remarks Section
  remarksStylishContainer: {
      backgroundColor: "#FAFBFC",
      borderTopWidth: 1,
      borderTopColor: "#F0F2F5",
      paddingVertical: 16,
      paddingHorizontal: 24,
      marginTop: 5,
  },
  remarksHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
  },
  remarksLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: Colors.mediumText,
      textTransform: "uppercase",
  },
  remarksValueText: {
      fontSize: 14,
      color: Colors.darkText,
      lineHeight: 22,
      fontWeight: "500",
      fontStyle: "italic",
  },

  // Contact Section Styles
  contactContainer: {
    marginHorizontal: 0,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 3,
    alignItems: "center",
  },
  contactHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 5,
  },
  contactIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.primaryBlue,
      justifyContent: "center",
      alignItems: "center",
  },
  helpSentence: {
      fontSize: 20,
      fontWeight: "800",
      color: Colors.darkText,
  },
  helpSubSentence: {
      fontSize: 14,
      color: Colors.mediumText,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 21,
  },
  contactButtonsRow: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      gap: 15,
  },
  contactBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 14,
      gap: 8,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  },
  callBtn: { backgroundColor: Colors.callBlue },
  whatsappBtn: { backgroundColor: Colors.whatsappGreen },
  contactBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});

export default LoanReqScreen;
