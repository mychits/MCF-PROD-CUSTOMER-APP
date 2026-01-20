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
  const monthlyInstallmentValue = data.monthly_installment ? `₹ ${formatNumberIndianStyle(data.monthly_installment)} /Month` : 'N/A';
  
  let rawCommencementDate = data.group_commencement_date;
  const firstAuction = data.auction && Array.isArray(data.auction) && data.auction.length > 0 ? data.auction[0] : null;

  if (!rawCommencementDate && firstAuction?.commencement_date) rawCommencementDate = firstAuction.commencement_date;
  if (!rawCommencementDate && firstAuction?.auction_date) rawCommencementDate = firstAuction.auction_date;
  if (!rawCommencementDate && data.group_first_auction_date) rawCommencementDate = data.group_first_auction_date;

  const commencementDateValue = rawCommencementDate ? formatDate(rawCommencementDate) : 'Pending';

  const details = [
    { label: "Monthly Installment", value: monthlyInstallmentValue },
    { label: "First Auction Date", value: commencementDateValue }, 
    { label: "Duration", value: `${data.group_duration || 'N/A'} Months` },
    { label: "Group Name", value: data.group_name || 'N/A' },
    { label: "Group Members", value: data.group_members || 'N/A' },
    { label: "Start Date", value: data.start_date ? formatDate(data.start_date) : 'N/A' },
    { label: "End Date", value: data.end_date ? formatDate(data.end_date) : 'N/A' },
  ];

  return (
    <View style={styles.chitDetailsCard}>
      <View style={styles.chitValueHeader}>
        <Text style={styles.chitValueLabel}>Chit Value</Text>
        <Text style={styles.chitValueHeaderText}>{chitValue}</Text>
      </View>
      <View style={{ padding: 16 }}>
        <View style={styles.chitDetailsGridContainer}>
          {details.map((item, index) => (
            <ChitDetailItem key={index} label={item.label} value={item.value} index={index} totalItems={details.length} />
          ))}
          {details.length % 2 !== 0 && (
            <View style={[styles.detailItem, styles.detailItemEmpty, styles.detailItemNoRightBorder, styles.detailItemNoBottomBorder]} />
          )}
        </View>
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
      const ticketsResponse = await axios.post(`${url}/enroll/get-next-tickets/${groupId}`);
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
    const payload = { group_id: groupId, user_id: userId, no_of_tickets: ticketsCountInt, chit_asking_month: 0 };
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
    
    // Updated confirmation text to a statement
    const confirmationText = `Dear ${userName}, you are currently enrolling in the group ${groupName}. This plan features a monthly installment of ₹ ${installmentAmount} over a duration of ${durationMonths} months for your selected ${ticketCount} ticket(s).`;

    return (
      <Modal animationType="slide" transparent={true} visible={isConfirmModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.styledModalContent}>
            <View style={styles.modalAnimationPlaceholder}>
              <Ionicons name="people-circle" size={80} color="#053B90" />
            </View>
            <Text style={styles.styledModalTitle}>Confirm Enrollment</Text>
            <Text style={styles.styledModalMessage}>{confirmationText}</Text>
            <Text style={styles.styledModalAgreement}>By proceeding, you agree to the group terms and conditions.</Text>
            <View style={styles.styledModalButtonContainer}>
              <TouchableOpacity style={[styles.styledModalButton, styles.styledModalCancelButton]} onPress={() => setIsConfirmModalVisible(false)}>
                <Text style={styles.styledModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.styledModalButton, styles.styledModalConfirmButton]} 
                onPress={() => { setIsConfirmModalVisible(false); performEnrollment(parseInt(ticketCount, 10)); }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.styledModalConfirmButtonText}>Agree & Join</Text>}
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
          <Text style={styles.groupInfoTitle}>Group Enrollment Details</Text>
          <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            {cardsData && <ChitDetailsGrid data={cardsData} />}
            
            <View style={styles.ticketSelectionBox}>
              <Text style={styles.ticketSelectionBoxTitle}>Select Tickets</Text>
              
              <View style={styles.unifiedTicketControlRow}>
                <Text style={styles.quantityLabel}>Selected Tickets:</Text>
                <View style={styles.ticketCountDisplay}>
                  <Text style={styles.ticketCountText}>{ticketCount}</Text>
                </View>
              </View>

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                    onPress={handleRemoveTicket} 
                    style={[styles.actionButtonBox, { borderColor: Colors.danger }]}
                >
                  <AntDesign name="minuscircleo" size={16} color={Colors.danger} />
                  <Text style={[styles.actionButtonText, { color: Colors.danger }]}> Remove Ticket</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={handleAddMoreTickets} 
                    style={[styles.actionButtonBox, { borderColor: Colors.linkBlue }]}
                >
                  <AntDesign name="pluscircleo" size={16} color={Colors.linkBlue} />
                  <Text style={[styles.actionButtonText, { color: Colors.linkBlue }]}> Add More Tickets</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.checkboxSection}>
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => setTermsAccepted(!termsAccepted)}>
                <MaterialIcons name={termsAccepted ? "check-box" : "check-box-outline-blank"} size={24} color={termsAccepted ? Colors.primary : Colors.darkGray} />
                <Text style={styles.checkboxLabel}>I agree to the <Text style={styles.linkText}>Terms & Conditions</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.</Text>
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
  mainContentWrapper: { flex: 1, paddingHorizontal: 3, paddingBottom: 3 },
  contentCard: { flex: 1, backgroundColor: Colors.primaryBackground, borderRadius: 15, marginTop: 3, paddingVertical: 8, paddingHorizontal: 5 },
  groupInfoTitle: { fontSize: 18, fontWeight: "bold", color: Colors.primary, marginBottom: 5, textAlign: "center" },
  scrollContentContainer: { paddingHorizontal: 0 },
  chitDetailsCard: { width: '98%', alignSelf: 'center', backgroundColor: Colors.white, borderRadius: 15, marginVertical: 10, overflow: 'hidden', elevation: 10 },
  chitValueHeader: { paddingVertical: 15, backgroundColor: Colors.primary, alignItems: 'center' },
  chitValueLabel: { fontSize: 14, color: Colors.whiteAccent, textTransform: 'uppercase' },
  chitValueHeaderText: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  chitDetailsGridContainer: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 3, borderTopColor: Colors.primaryBackground },
  detailItem: { width: '50%', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.lightDivider, borderRightWidth: 1, borderRightColor: Colors.lightDivider },
  detailItemNoRightBorder: { borderRightWidth: 0 },
  detailItemNoBottomBorder: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 11, color: Colors.chitLabel, textTransform: 'uppercase' },
  detailValue: { fontSize: 15, fontWeight: '700', color: Colors.chitValue },
  detailValueCurrency: { fontSize: 16, fontWeight: 'bold', color: Colors.primaryText },
  ticketSelectionBox: { backgroundColor: Colors.white, borderRadius: 15, padding: 15, marginHorizontal: 5, marginBottom: 15, elevation: 8 },
  ticketSelectionBoxTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  unifiedTicketControlRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  quantityLabel: { fontSize: 16, fontWeight: "600", color: Colors.primaryText },
  ticketCountDisplay: { backgroundColor: Colors.primaryBackground, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  ticketCountText: { fontSize: 22, fontWeight: "bold", color: Colors.primary },
  
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionButtonBox: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1.5, borderRadius: 10, borderStyle: 'dashed' },
  actionButtonText: { fontWeight: 'bold', fontSize: 13 },

  checkboxSection: { paddingHorizontal: 10, marginVertical: 10 },
  checkboxContainer: { flexDirection: "row", alignItems: "flex-start" },
  checkboxLabel: { marginLeft: 8, fontSize: 13, flex: 1 },
  linkText: { color: Colors.linkBlue, fontWeight: "bold", textDecorationLine: "underline" },
  enrollButton: { backgroundColor: Colors.secondary, paddingVertical: 15, borderRadius: 12, alignItems: "center", marginHorizontal: 10, elevation: 12 },
  enrollButtonDisabled: { backgroundColor: Colors.disabledGray, opacity: 0.7 },
  enrollButtonText: { color: Colors.white, fontSize: 18, fontWeight: "bold" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  styledModalContent: { backgroundColor: Colors.white, borderRadius: 15, padding: 25, width: '85%', alignItems: 'center', borderWidth: 2, borderColor: '#053B90' },
  modalAnimationPlaceholder: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderRadius: 50, backgroundColor: '#E0EFFF', borderWidth: 2, borderColor: '#053B90' },
  styledModalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  styledModalMessage: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 10 },
  styledModalButtonContainer: { flexDirection: "row", width: "100%" },
  styledModalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  styledModalCancelButton: { backgroundColor: Colors.lightGray, marginRight: 10 },
  styledModalConfirmButton: { backgroundColor: Colors.primary, marginLeft: 10 },
  styledModalConfirmButtonText: { color: Colors.white, fontWeight: "bold" },
  styledModalAgreement:{ textAlign: 'center', fontStyle:'italic', fontSize:13},
  bottomSpacer: { height: 60 }
});

export default EnrollForm;