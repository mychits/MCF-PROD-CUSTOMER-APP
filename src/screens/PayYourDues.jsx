import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Vibration,
  Linking,
  TextInput,
  Alert,
  Animated,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";
import Modal from "react-native-modal";

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F0F2F5",
  cardBackground: "#FFFFFF",
  darkText: "#1C2A38",
  mediumText: "#586878",
  lightText: "#8F9BB3",
  warningColor: "#FF3D71", // Red Color for Buttons
  successColor: "#00BFA5",
  infoColor: "#397AFF",
  shadowColor: "rgba(0,0,0,0.08)",
};

// Unique Theme Palettes to differentiate cards (Colors are still unique)
const CARD_THEMES = [
  { id: 1, colors: ["#4facfe", "#00f2fe"], btn: "#00C6FB" },
  { id: 2, colors: ["#43e97b", "#38f9d7"], btn: "#2AF598" },
  { id: 3, colors: ["#fa709a", "#fee140"], btn: "#FEC163" },
  { id: 4, colors: ["#667eea", "#764ba2"], btn: "#7F53AC" },
  { id: 5, colors: ["#ff9a9e", "#fecfef"], btn: "#FF9A9E" },
];

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = Math.abs(num).toString().split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";
  let isNegative = num < 0;

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  const formatted =
    otherNumbers !== ""
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;

  return (isNegative ? "-" : "") + formatted + decimalPart;
};

const PayYourDues = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  const [cardsData, setCardsData] = useState([]);
  const [groupOverviews, setGroupOverviews] = useState({});
  const [loading, setLoading] = useState(true);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [isModalVisible, setModalVisible] = useState(false);
  const [modalDetails, setModalDetails] = useState({
    groupId: null,
    ticket: null,
    amount: 0,
    groupName: "",
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const amountInputRef = useRef(null);

  useEffect(() => {
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startPulse();
  }, [pulseAnim]);

  const updateTimestamp = useCallback(() => {
    const now = new Date();
  }, []);

  const fetchTicketsData = useCallback(async (currentUserId) => {
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets/${currentUserId}`,
        { source: "mychits-customer-app" },
      );
      return response.data || [];
    } catch (error) {
      return [];
    }
  }, []);

  const fetchIndividualGroupOverview = useCallback(
    async (currentUserId, card) => {
      try {
        const response = await axios.get(
          `${url}/overview/single?user_id=${currentUserId}&group_id=${card.group_id._id}&ticket=${card.tickets}`,
        );
        return {
          key: `${card.group_id._id}_${card.tickets}`,
          data: response.data,
        };
      } catch (error) {
        return { key: null, data: null };
      }
    },
    [],
  );

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    updateTimestamp();
    try {
      const fetchedCards = await fetchTicketsData(userId);
      const filtered = fetchedCards.filter(
        (card) =>
          card.group_id &&
          !card.group_id.group_name?.toLowerCase().includes("loan"),
      );
      setCardsData(filtered);

      if (filtered.length > 0) {
        const results = await Promise.all(
          filtered.map((card) => fetchIndividualGroupOverview(userId, card)),
        );
        const newOverviews = {};
        results.forEach((res) => {
          if (res.key) newOverviews[res.key] = res.data;
        });
        setGroupOverviews(newOverviews);
      }
    } catch (error) {
      console.error("Data fetch error", error);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchTicketsData, fetchIndividualGroupOverview, updateTimestamp]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handlePayNow = (groupId, ticket, amount, groupName) => {
    Vibration.vibrate(50);
    setModalDetails({ groupId, ticket, amount: Math.abs(amount), groupName });
    setPaymentAmount("");
    setModalVisible(true);
  };

  useEffect(() => {
    if (isModalVisible) setTimeout(() => amountInputRef.current?.focus(), 300);
  }, [isModalVisible]);

  const handlePaymentInitiate = async () => {
    const amountToPay = parseFloat(paymentAmount || modalDetails.amount);
    if (amountToPay < 100 || amountToPay > 50000) {
      Alert.alert("Invalid Amount", "Please enter between ₹100 and ₹50,000.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${url}/paymentapi/app/add`, {
        user_id: userId,
        expiry: "3600",
        amount: `${amountToPay}`,
        purpose: "Due Payment",
        payment_group_tickets: [
          `chit-${modalDetails.groupId}|${modalDetails.ticket}`,
        ],
        source: "mychits-customer-app",
      });
      if (response.data?.link_url) {
        await Linking.openURL(response.data.link_url);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to initiate payment.");
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  const activeDuesCards = cardsData.filter((card) => {
    const overview = groupOverviews[`${card.group_id._id}_${card.tickets}`];
    return overview && (overview.total_balance || 0) > 0;
  });

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.contentArea}>
        
        {/* Compact Header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Pay Your Dues</Text>
            <Text style={styles.pageSubtitle}>Active Subscriptions</Text>
          </View>
          
          <View style={styles.liveBadgeContainer}>
             <Animated.View style={[styles.pulsingDot, { opacity: pulseAnim }]} />
             <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={Colors.primaryBlue} />
          </View>
        ) : activeDuesCards.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeDuesCards.map((card, index) => {
              const overview =
                groupOverviews[`${card.group_id._id}_${card.tickets}`];

              // Select Unique Theme based on Index
              const theme = CARD_THEMES[index % CARD_THEMES.length];

              const totalPayable = overview?.total_payable || 0;
              const totalPaid = overview?.total_investment || 0;
              const totalProfit = overview?.total_profit || 0;
              const totalBalance = overview?.total_balance || 0;
              const totalPenalty = overview?.total_penalty || 0;
              const totalLateFee = overview?.total_late_fee || 0;

              return (
                <View key={card._id || index} style={styles.cardContainer}>
                  {/* Unique Themed Header */}
                  <LinearGradient
                    colors={theme.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardHeaderStrip}
                  >
                    <View style={styles.cardHeaderContent}>
                      {/* Icon Circle - Uses 'account-balance-wallet' */}
                      <View style={[styles.iconCircle, { backgroundColor: theme.btn }]}>
                        <MaterialIcons name="account-balance-wallet" size={14} color="#FFF" />
                      </View>
                      
                      <View style={styles.headerTextContainer}>
                        {/* Icon + Group Name Row - Uses 'account-balance-wallet' */}
                        <View style={styles.textRow}>
                          <Text style={styles.cardGroupName} numberOfLines={1}>
                            {card.group_id.group_name}
                          </Text>
                        </View>

                        {/* Icon + Ticket Row - Uses 'account-balance-wallet' */}
                        <View style={styles.textRow}>
                          <Text style={styles.cardTicketLabel}>
                            Ticket: {card.tickets}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("EnrollGroup", {
                            groupId: card.group_id._id,
                            ticket: card.tickets,
                          })
                        }
                        style={styles.detailsArrowBtn}
                      >
                        <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>

                  {/* Card Body - Separated by Shadow/Border */}
                  <View style={[styles.cardBody, { borderTopColor: theme.colors[0] }]}>
                    
                    {/* 3 Items in 1 Line */}
                    <View style={styles.threeItemGrid}>
                      <StatItem label="Payable" value={totalPayable} />
                      <View style={[styles.verticalDivider, { backgroundColor: '#F0F0F0' }]} />
                      <StatItem label="Paid" value={totalPaid} color={Colors.successColor} />
                      <View style={[styles.verticalDivider, { backgroundColor: '#F0F0F0' }]} />
                      <StatItem label="Profit" value={totalProfit} color={Colors.infoColor} />
                    </View>

                    {/* Conditional Alerts */}
                    {(totalPenalty > 0 || totalLateFee > 0) && (
                        <View style={styles.alertsRow}>
                            {totalPenalty > 0 && (
                                <AlertBadge label="Penalty" value={totalPenalty} />
                            )}
                            {totalLateFee > 0 && (
                                <AlertBadge label="Late Fee" value={totalLateFee} />
                            )}
                        </View>
                    )}
                  </View>

                  {/* Themed Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.balanceInfo}>
                      <Text style={styles.pendingLabel}>Payment Pending</Text>
                      <Text style={styles.balanceAmount}>
                        ₹{formatNumberIndianStyle(totalBalance)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.payNowBtn, { backgroundColor: Colors.warningColor }]} // RED BUTTON
                      onPress={() =>
                        handlePayNow(
                          card.group_id._id,
                          card.tickets,
                          totalBalance,
                          card.group_id.group_name,
                        )
                      }
                    >
                      <MaterialIcons name="bolt" size={12} color="#FFF" />
                      <Text style={styles.payNowBtnText}>Pay Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Image
              source={NoGroupImage}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>No active dues.</Text>
          </View>
        )}
      </View>

      {/* Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
        avoidKeyboard={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
             <View style={[styles.modalIconCircle, { backgroundColor: Colors.primaryBlue + '20' }]}>
                <MaterialIcons name="receipt-long" size={20} color={Colors.primaryBlue} />
             </View>
             <Text style={styles.modalTitle}>Confirm Payment</Text>
          </View>
          
          <Text style={styles.modalGroupName}>{modalDetails.groupName}</Text>
          <Text style={styles.modalTicket}>Ticket {modalDetails.ticket}</Text>

          <View style={[styles.dueBox, { borderColor: Colors.primaryBlue + '40', backgroundColor: Colors.primaryBlue + '10' }]}>
             <Text style={[styles.dueBoxLabel, { color: Colors.primaryBlue }]}>Total Due</Text>
             <Text style={styles.dueBoxValue}>
                ₹ {formatNumberIndianStyle(modalDetails.amount)}
             </Text>
          </View>

          <Text style={styles.inputLabel}>Amount</Text>
          {/* Updated Input Wrapper with #053B90 Border */}
          <View style={[styles.inputWrapper, { borderColor: Colors.primaryBlue }]}>
            <Text style={[styles.rupeeSymbol, { color: Colors.primaryBlue }]}>₹</Text>
            <TextInput
              ref={amountInputRef}
              style={styles.inputField}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder={modalDetails.amount.toString()}
              placeholderTextColor="#A0AAB5"
            />
          </View>
          <Text style={styles.inputHelper}>Min ₹100 • Max ₹50,000</Text>

          <View style={styles.modalButtons}>
             <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
             >
                <Text style={styles.cancelBtnText}>Cancel</Text>
             </TouchableOpacity>
             <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: Colors.warningColor }]} // RED BUTTON
                onPress={handlePaymentInitiate}
             >
                <Text style={styles.confirmBtnText}>
                   Pay ₹{formatNumberIndianStyle(paymentAmount || modalDetails.amount)}
                </Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Components
const StatItem = ({ label, value, color = Colors.darkText }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color: color }]}>
      ₹ {formatNumberIndianStyle(value)}
    </Text>
  </View>
);

const AlertBadge = ({ label, value }) => (
    <View style={styles.alertBadge}>
        <MaterialIcons name="error-outline" size={9} color={Colors.warningColor} />
        <Text style={styles.alertLabel}>{label}:</Text>
        <Text style={styles.alertValue}>₹{formatNumberIndianStyle(value)}</Text>
    </View>
);

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: Colors.primaryBlue },
  contentArea: {
    flex: 1,
    backgroundColor: "#E8EAF0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 5,
    overflow: "hidden",
    borderWidth: 1, 
    borderColor: Colors.primaryBlue, 
  },
  // Header
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.darkText,
  },
  pageSubtitle: {
    fontSize: 10,
    color: Colors.mediumText,
    marginTop: 1,
  },
  liveBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6FFFA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B2F5EA",
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 2.5,
    backgroundColor: Colors.successColor,
    marginRight: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#2C7A7B",
  },
  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },

  // Unique Card Design (Smaller)
  cardContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardHeaderStrip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cardHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardGroupName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardTicketLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 9,
    fontWeight: "600",
  },
  detailsArrowBtn: {
    padding: 2,
  },
  
  // Body
  cardBody: {
    padding: 8,
    backgroundColor: "#FFF",
    borderTopWidth: 2, 
  },
  threeItemGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 7,
    color: Colors.lightText,
    marginBottom: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 10,
    fontWeight: "800",
  },
  verticalDivider: {
    width: 1,
    height: "60%",
  },
  
  // Alerts
  alertsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 2,
  },
  alertBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFF5F5",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 0.5,
      borderColor: "#FED7D7",
  },
  alertLabel: {
      fontSize: 8,
      color: Colors.warningColor,
      marginLeft: 3,
      fontWeight: "700",
  },
  alertValue: {
      fontSize: 9,
      color: Colors.darkText,
      fontWeight: "800",
      marginLeft: 2,
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  balanceInfo: {
    flexDirection: "column",
  },
  pendingLabel: {
    fontSize: 8,
    color: Colors.mediumText,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.darkText,
    marginTop: 1,
  },
  payNowBtn: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  payNowBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 15,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.mediumText,
    textAlign: "center",
  },

  // Modal (Compact)
  modal: {
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#FFF",
    width: "75%",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.darkText,
  },
  modalGroupName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryBlue,
    textAlign: "center",
  },
  modalTicket: {
    fontSize: 11,
    color: Colors.mediumText,
    marginBottom: 12,
  },
  dueBox: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  dueBoxLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  dueBoxValue: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.darkText,
  },
  inputLabel: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "700",
    color: Colors.darkText,
    marginBottom: 4,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    height: 40,
    width: "100%",
    paddingHorizontal: 10,
    backgroundColor: "#F8FAFF",
    paddingVertical: 0,
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 6,
    lineHeight: 40,
    paddingBottom: 2,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
    fontWeight: "700",
    height: 40,
    paddingVertical: 0,
    lineHeight: 40,
  },
  inputHelper: {
    alignSelf: "flex-start",
    fontSize: 9,
    color: Colors.lightText,
    marginTop: 4,
    marginLeft: 2,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },
  cancelBtnText: {
    color: Colors.mediumText,
    fontWeight: "700",
    fontSize: 12,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
  },
});

export default PayYourDues;