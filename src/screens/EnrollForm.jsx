import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { AntDesign, MaterialIcons, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import url from "../data/url";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import Toast from "react-native-toast-message";
import { ContextProvider } from "../context/UserProvider";

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      const formatted = date.toLocaleDateString('en-GB', options);
      return formatted.replace(/ /g, '-').replace(',', '');
    }
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
  }
  return "N/A";
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = num.toString().split('.');
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? '.' + parts[1] : '';
  let isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.substring(1);

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (isNegative ? '-' : '') + formattedOtherNumbers + ',' + lastThree + decimalPart;
  } else {
    return (isNegative ? '-' : '') + lastThree + decimalPart;
  }
};

const Colors = {
  primary: "#053B90",
  secondary: "#28A745",
  danger: "#DC3545",
  lightGray: "#F8F9FA",
  mediumGray: "#E9ECEF",
  darkGray: "#6C757D",
  white: "#FFFFFF",
  black: "#212529",
  primaryBackground: "#E0F2F7",
  whiteAccent: "#F0F8FF",
  textGray: "#495057",
  disabledGray: "#A0A0A0",
  linkBlue: "#007BFF",
  warningOrange: "#FF9800",
  primaryText: "#343A40",
  textMedium: "#757575",
  lightDivider: "#EEEEEE",
  chitBackground: "#FFFFFF",
  chitLabel: "#757575",
  chitValue: "#343A40",
  chitLink: "#DC3545",
  accentBlue: "#17A2B8",
  shadowBlue: "rgba(5, 59, 144, 0.2)",
};

const ChitDetailItem = ({ label, value, isLink = false, index, totalItems }) => {
  const isRightItem = index % 2 !== 0;
  const isLastRow = index >= totalItems - (totalItems % 2 === 0 ? 2 : 1);

  return (
    <View style={[
      styles.detailItem,
      isRightItem && styles.detailItemNoRightBorder,
      isLastRow && styles.detailItemNoBottomBorder,
    ]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={[
          styles.detailValue,
          isLink && styles.detailValueLink,
          (label === 'Monthly Installment' || label.includes('Value')) && styles.detailValueCurrency
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const ChitDetailsGrid = ({ data }) => {
  const chitValue = data.group_value ? `₹ ${formatNumberIndianStyle(data.group_value)}` : 'N/A';
  const monthlyInstallmentValue = data.monthly_installment ? `₹ ${formatNumberIndianStyle(data.monthly_installment)} ` : 'N/A'; // Shortened /Month to /Mo

  let rawCommencementDate = data.group_commencement_date;
  const firstAuction = data.auction && Array.isArray(data.auction) && data.auction.length > 0 ? data.auction[0] : null;

  if (!rawCommencementDate && firstAuction?.commencement_date) rawCommencementDate = firstAuction.commencement_date;
  if (!rawCommencementDate && firstAuction?.auction_date) rawCommencementDate = firstAuction.auction_date;
  if (!rawCommencementDate && data.group_first_auction_date) rawCommencementDate = data.group_first_auction_date;

  const commencementDateValue = rawCommencementDate ? formatDate(rawCommencementDate) : 'Pending';

  const details = [
    { label: "Installment Amount", value: monthlyInstallmentValue }, // Shortened Label
    { label: "1st Auction", value: commencementDateValue }, // Shortened Label
    { label: "Duration", value: `${data.group_duration || 'N/A'} ` }, // Shortened Label
    { label: "Group", value: data.group_name || 'N/A' }, // Shortened Label
    { label: "Members", value: data.group_members || 'N/A' }, // Shortened Label
    { label: "Starts", value: data.start_date ? formatDate(data.start_date) : 'N/A' }, // Shortened Label
    { label: "Ends", value: data.end_date ? formatDate(data.end_date) : 'N/A' }, // Shortened Label
  ];

  return (
    <View style={styles.chitDetailsCard}>
      <View style={styles.chitValueHeader}>
        <Text style={styles.chitValueLabel}>Chit Value</Text>
        <Text style={styles.chitValueHeaderText}>{chitValue}</Text>
      </View>
      <View style={styles.chitDetailsGridContainer}>
        {details.map((item, index) => (
          <ChitDetailItem key={index} label={item.label} value={item.value} index={index} totalItems={details.length} />
        ))}
        {details.length % 2 !== 0 && (
          <View style={[styles.detailItem, styles.detailItemEmpty, styles.detailItemNoRightBorder, styles.detailItemNoBottomBorder]} />
        )}
      </View>
    </View>
  );
};

const EnrollForm = ({ navigation, route }) => {
  const [appUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const { groupId } = route.params || {};
  const [ticketCount, setTicketCount] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cardsData, setCardsData] = useState(null);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  const fetchData = useCallback(async () => {
    if (!isConnected || !isInternetReachable) {
      setLoading(false);
      setError("No internet connection.");
      return;
    }
    setLoading(true);
    try {
      const groupResponse = await fetch(`${url}/group/${groupId}`);
      if (groupResponse.ok) {
        const responseBody = await groupResponse.json();
        const groupData = (responseBody.data && Array.isArray(responseBody.data)) ? responseBody.data[0] : responseBody;
        setCardsData(groupData);
      }
      const ticketsResponse = await axios.post(`${url}/enroll/get-next-tickets/${groupId}`, {
        source: "mychits-customer-app"
      });
      const fetchedTickets = Array.isArray(ticketsResponse.data.availableTickets) ? ticketsResponse.data.availableTickets : [];
      setAvailableTickets(fetchedTickets);
      setTicketCount(fetchedTickets.length > 0 ? 1 : 0);
    } catch (err) {
      setError("Failed to load group details.");
    } finally {
      setLoading(false);
    }
  }, [groupId, isConnected, isInternetReachable]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddMoreTickets = () => {
    if (ticketCount < availableTickets.length) {
      setTicketCount(prev => prev + 1);
    } else {
      Toast.show({
        type: "info",
        text1: "Maximum Reached",
        text2: `Only ${availableTickets.length} tickets available.`,
      });
    }
  };

  const handleRemoveTicket = () => {
    if (ticketCount > 1) {
      setTicketCount(prev => prev - 1);
    }
  };

  const performEnrollment = useCallback(async (ticketsCountInt) => {
    setIsSubmitting(true);
    const payload = {
      group_id: groupId,
      user_id: userId,
      no_of_tickets: ticketsCountInt,
      chit_asking_month: "",
      source: "mychits-customer-app" // <--- ADDED THIS LINE
    };
    try {
      await axios.post(`${url}/mobile-app-enroll/add-mobile-app-enroll`, payload);
      Toast.show({ type: "success", text1: "Enrollment Successful!" });
      navigation.navigate("EnrollConfirm", { group_name: cardsData?.group_name, tickets: ticketsCountInt, userId: userId });
    } catch (err) {
      Toast.show({ type: "error", text1: "Enrollment Failed" });
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, userId, cardsData, navigation]);

  const handleEnroll = () => {
    if (!termsAccepted) {
      Toast.show({ type: "error", text1: "Required", text2: "Please accept terms." });
      return;
    }
    setIsConfirmModalVisible(true);
  };

  const renderConfirmModal = () => {
    const groupName = cardsData?.group_name || "the group";
    const installmentAmount = cardsData?.monthly_installment
      ? formatNumberIndianStyle(cardsData.monthly_installment)
      : 'N/A';
    const durationMonths = cardsData?.group_duration || "N/A";
    const userName = appUser.name || 'User';

    const confirmationText = `Dear ${userName}, You Are Enrolling In ${groupName}.`;

    return (
      <Modal animationType="fade" transparent={true} visible={isConfirmModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.styledModalContent}>
            {/* Decorative top bar */}
            <View style={styles.colorBar} />

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsConfirmModalVisible(false)}
            >
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>

            {/* Icon Container */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="people" size={45} color="#FFF" />
              </View>
            </View>

            <Text style={styles.styledModalTitle}>Confirm Enrollment </Text>

            <Text style={styles.styledModalMessage}>{confirmationText}</Text>

            {/* Details in separate lines */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="ticket-outline" size={16} color="#667eea" />
                <Text style={styles.detailLabel}>Tickets:</Text>
                <Text style={styles.detailValue}>{ticketCount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#667eea" />
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{durationMonths} months</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#667eea" />
                <Text style={styles.detailLabel}>Per Installment:</Text>
                <Text style={styles.detailValue}>₹{installmentAmount}</Text>
              </View>
            </View>

            <View style={styles.termsContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.styledModalAgreement}>
                By proceeding, you agree to terms
              </Text>
            </View>
            <View style={styles.styledModalButtonContainer}>
              <TouchableOpacity
                style={[styles.styledModalButton, styles.styledModalCancelButton]}
                onPress={() => setIsConfirmModalVisible(false)}
              >
                <Text style={styles.styledModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.styledModalButton, styles.styledModalConfirmButton]}
                onPress={() => {
                  setIsConfirmModalVisible(false);
                  performEnrollment(parseInt(ticketCount, 10));
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ?
                  <ActivityIndicator size="small" color="#FFF" /> :
                  <Text style={styles.styledModalConfirmButtonText}>Confirm Join </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  if (loading) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Header userId={userId} navigation={navigation} />
      <View style={styles.mainContentWrapper}>
        <View style={styles.contentCard}>
          <Text style={styles.groupInfoTitle}>Enrollment Details</Text>
          <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            {cardsData && <ChitDetailsGrid data={cardsData} />}

            <View style={styles.ticketSelectionBoxCompact}>
              <Text style={styles.ticketSelectionBoxTitleCompact}>Select Tickets</Text>

              <View style={styles.ticketRow}>
                <View style={styles.ticketCountSection}>
                  <Text style={styles.quantityLabelCompact}>Tickets:</Text>
                  <View style={styles.ticketCountDisplayCompact}>
                    <Text style={styles.ticketCountTextCompact}>{ticketCount}</Text>
                  </View>
                </View>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    onPress={handleRemoveTicket}
                    style={[styles.actionButtonBoxCompact, { borderColor: Colors.danger }]}
                  >
                    <AntDesign name="minuscircleo" size={12} color={Colors.danger} />
                    <Text style={[styles.actionButtonTextCompact, { color: Colors.danger }]}>Remove</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddMoreTickets}
                    style={[styles.actionButtonBoxCompact, { borderColor: Colors.linkBlue }]}
                  >
                    <AntDesign name="pluscircleo" size={12} color={Colors.linkBlue} />
                    <Text style={[styles.actionButtonTextCompact, { color: Colors.linkBlue }]}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.checkboxSection}>
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => setTermsAccepted(!termsAccepted)}>
                <MaterialIcons name={termsAccepted ? "check-box" : "check-box-outline-blank"} size={20} color={termsAccepted ? Colors.primary : Colors.darkGray} />
                <Text style={styles.checkboxLabel}>I agree to <Text style={styles.linkText}>Terms</Text> & <Text style={styles.linkText}>Privacy</Text>.</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.enrollButton, (!termsAccepted || availableTickets.length === 0) && styles.enrollButtonDisabled]}
              onPress={handleEnroll}
              disabled={!termsAccepted || availableTickets.length === 0}
            >
              <Text style={styles.enrollButtonText}>Enroll Now</Text>
            </TouchableOpacity>
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </View>
      {renderConfirmModal()}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1, backgroundColor: Colors.primary, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  mainContentWrapper: { flex: 1, paddingHorizontal: 2, paddingBottom: 2 }, // Reduced padding
  contentCard: { flex: 1, backgroundColor: Colors.primaryBackground, borderRadius: 10, marginTop: 2, paddingVertical: 5, paddingHorizontal: 3 }, // Reduced padding & radius
  groupInfoTitle: { fontSize: 16, fontWeight: "bold", color: Colors.primary, marginBottom: 5, textAlign: "center" }, // Reduced font
  scrollContentContainer: { paddingHorizontal: 0 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  styledModalContent: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  colorBar: {
    height: 6,
    backgroundColor: '#667eea',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  styledModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  styledModalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  detailsContainer: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginLeft: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',   // important
    justifyContent: 'center',
  
    marginBottom: 20,
  },

  styledModalAgreement: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,          // spacing instead of gap
    lineHeight: 16,         // match icon size
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center',
  },

  styledModalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  styledModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styledModalCancelButton: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  styledModalCancelButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  styledModalConfirmButton: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  styledModalConfirmButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  ticketSelectionBoxCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  ticketSelectionBoxTitleCompact: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketCountSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabelCompact: {
    fontSize: 13,
    marginRight: 8,
  },
  ticketCountDisplayCompact: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  ticketCountTextCompact: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonBoxCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
  },
  actionButtonTextCompact: {
    fontSize: 12,
    marginLeft: 4,
  },

  // --- SMALL CHIT DETAILS CARD ---
  chitDetailsCard: { width: '99%', alignSelf: 'center', backgroundColor: Colors.white, borderRadius: 10, marginVertical: 5, overflow: 'hidden', elevation: 5 }, // Smaller radius & elevation
  chitValueHeader: { paddingVertical: 8, backgroundColor: Colors.primary, alignItems: 'center' }, // Reduced padding
  chitValueLabel: { fontSize: 11, color: Colors.whiteAccent, textTransform: 'uppercase' }, // Reduced font
  chitValueHeaderText: { fontSize: 20, fontWeight: 'bold', color: Colors.white }, // Reduced font
  chitDetailsGridContainer: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 2, borderTopColor: Colors.primaryBackground }, // Thinner border
  detailItem: { width: '50%', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.lightDivider, borderRightWidth: 1, borderRightColor: Colors.lightDivider }, // Reduced padding
  detailItemNoRightBorder: { borderRightWidth: 0 },
  detailItemNoBottomBorder: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 9, color: Colors.chitLabel, textTransform: 'uppercase' }, // Reduced font
  detailValue: { fontSize: 12, fontWeight: '700', color: Colors.chitValue }, // Reduced font
  detailValueCurrency: { fontSize: 13, fontWeight: 'bold', color: Colors.primaryText }, // Reduced font
  // -------------------------------

  // --- SMALL TICKET BOX ---
  ticketSelectionBox: { backgroundColor: Colors.white, borderRadius: 10, padding: 10, marginHorizontal: 3, marginBottom: 10, elevation: 5 }, // Reduced padding/radius
  ticketSelectionBoxTitle: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 12 }, // Reduced margin/font
  unifiedTicketControlRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  quantityLabel: { fontSize: 14, fontWeight: "600", color: Colors.primaryText }, // Reduced font
  ticketCountDisplay: { backgroundColor: Colors.primaryBackground, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, minWidth: 40, alignItems: 'center' }, // Smaller box
  ticketCountText: { fontSize: 18, fontWeight: "bold", color: Colors.primary }, // Reduced font

  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }, // Reduced margin
  actionButtonBox: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderWidth: 1.5, borderRadius: 8, borderStyle: 'dashed' }, // Reduced padding
  actionButtonText: { fontWeight: 'bold', fontSize: 11, marginLeft: 4 }, // Reduced font
  // ------------------------

  checkboxSection: { paddingHorizontal: 5, marginVertical: 5 }, // Reduced margins
  checkboxContainer: { flexDirection: "row", alignItems: "flex-start" },
  checkboxLabel: { marginLeft: 6, fontSize: 12, flex: 1 }, // Reduced font & margin
  linkText: { color: Colors.linkBlue, fontWeight: "bold", textDecorationLine: "underline" },
  enrollButton: { backgroundColor: Colors.secondary, paddingVertical: 12, borderRadius: 10, alignItems: "center", marginHorizontal: 5, elevation: 8 }, // Reduced padding
  enrollButtonDisabled: { backgroundColor: Colors.disabledGray, opacity: 0.7 },
  enrollButtonText: { color: Colors.white, fontSize: 16, fontWeight: "bold" }, // Reduced font
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  styledModalContent: { backgroundColor: Colors.white, borderRadius: 12, padding: 20, width: '85%', alignItems: 'center', borderWidth: 2, borderColor: '#053B90' }, // Reduced padding
  modalAnimationPlaceholder: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 35, backgroundColor: '#E0EFFF', borderWidth: 2, borderColor: '#053B90' }, // Smaller placeholder
  styledModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 }, // Reduced font
  styledModalMessage: { fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 8 }, // Reduced font
  styledModalButtonContainer: { flexDirection: "row", width: "100%" },
  styledModalButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, // Reduced padding
  styledModalCancelButton: { backgroundColor: Colors.lightGray, marginRight: 8 }, // Reduced margin
  styledModalConfirmButton: { backgroundColor: Colors.primary, marginLeft: 8 }, // Reduced margin
  styledModalConfirmButtonText: { color: Colors.white, fontWeight: "bold" },
// Reduced font
  bottomSpacer: { height: 40 }
});

export default EnrollForm;