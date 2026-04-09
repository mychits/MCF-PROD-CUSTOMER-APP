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
  lightBackground: "#F9FCFF",
  cardBackground: "#FFFFFF",
  darkText: "#263238",
  mediumText: "#546E7A",
  lightText: "#B0BEC5",
  cardGradientStart: "#FFFFFF",
  cardGradientEnd: "#F5F8FA",
  duesBackgroundStart: "#FBE9E7",
  duesBackgroundEnd: "#FFF6F5",
  successColor: "#388E3C",
  warningColor: "#D32F2F",
  payNowButtonBackground: "#007BFF",
  payNowButtonText: "#FFFFFF",
  shadowColor: "rgba(0,0,0,0.08)",
  borderColor: "#ECEFF1",
};

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

  const [isModalVisible, setModalVisible] = useState(false);
  const [modalDetails, setModalDetails] = useState({
    groupId: null,
    ticket: null,
    amount: 0,
    groupName: "",
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const amountInputRef = useRef(null);

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
  }, [userId, fetchTicketsData, fetchIndividualGroupOverview]);

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

  // Filter cards to only show those with balance > 0
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

      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <Text style={styles.sectionTitle}>Pay Your Dues</Text>
          <Text style={styles.subSectionTitle}>
            Stay on top of your chit payments!
          </Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primaryBlue}
              style={styles.loader}
            />
          ) : activeDuesCards.length > 0 ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {activeDuesCards.map((card, index) => {
                const overview =
                  groupOverviews[`${card.group_id._id}_${card.tickets}`];

                const totalPayable = overview?.total_payable || 0;
                const totalPaid = overview?.total_investment || 0;
                const totalProfit = overview?.total_profit || 0;
                const totalBalance = overview?.total_balance || 0;
                const totalPenalty = overview?.total_penalty || 0;
                const totalLateFee = overview?.total_late_fee || 0;

                return (
                  <TouchableOpacity
                    key={card._id || index}
                    style={styles.groupCardEnhanced}
                    onPress={() =>
                      navigation.navigate("EnrollGroup", {
                        groupId: card.group_id._id,
                        ticket: card.tickets,
                      })
                    }
                  >
                    <LinearGradient
                      colors={[
                        Colors.cardGradientStart,
                        Colors.cardGradientEnd,
                      ]}
                      style={styles.cardContentWrapper}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.groupCardNameEnhanced}>
                          {card.group_id.group_name}
                        </Text>
                        <Text style={styles.groupCardTicketEnhanced}>
                          Ticket: {card.tickets}
                        </Text>
                      </View>

                      <View style={styles.financialDetailsSection}>
                        <DetailRow label="Total Payable" value={totalPayable} />
                        <DetailRow label="Total Paid" value={totalPaid} />
                        <DetailRow
                          label="Profit/Dividend"
                          value={totalProfit}
                        />
                        <DetailRow
                          label="Total Penalty"
                          value={totalPenalty}
                          color={Colors.warningColor}
                        />
                        <DetailRow
                          label="Total Late Fee"
                          value={totalLateFee}
                          color={Colors.warningColor}
                        />
                      </View>

                      <LinearGradient
                        colors={[
                          Colors.duesBackgroundStart,
                          Colors.duesBackgroundEnd,
                        ]}
                        style={styles.balanceStatusBox}
                      >
                        <View style={styles.balanceSummary}>
                          <MaterialIcons
                            name="error-outline"
                            size={22}
                            color={Colors.warningColor}
                          />
                          <Text style={styles.balanceMessage}>
                            Pending Payment
                          </Text>
                          <Text
                            style={[
                              styles.balanceAmount,
                              { color: Colors.warningColor },
                            ]}
                          >
                            ₹ {formatNumberIndianStyle(totalBalance)}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.payNowButton}
                          onPress={() =>
                            handlePayNow(
                              card.group_id._id,
                              card.tickets,
                              totalBalance,
                              card.group_id.group_name,
                            )
                          }
                        >
                          <Text style={styles.payNowButtonText}>Pay Now</Text>
                          <MaterialIcons
                            name="payment"
                            size={18}
                            color="white"
                            style={{ marginLeft: 8 }}
                          />
                        </TouchableOpacity>
                      </LinearGradient>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noGroupsContainer}>
              <Image
                source={NoGroupImage}
                style={styles.noGroupImage}
                resizeMode="contain"
              />
              <Text style={styles.noGroupsText}>No Active Dues</Text>
              <Text style={styles.noGroupsSubText}>You are all caught up!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Payment Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
        avoidKeyboard={true}
      >
        <View style={styles.modalContent}>
          <Text style={styles.companyName}>Confirm Payment</Text>
          <Text style={styles.duePaymentText}>
            {modalDetails.groupName} (Ticket {modalDetails.ticket})
          </Text>

          <View style={styles.outstandingAmountBox}>
            <Text style={styles.outstandingAmountLabel}>Total Due:</Text>
            <Text style={styles.outstandingAmountTextModal}>
              ₹ {formatNumberIndianStyle(modalDetails.amount)}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                ref={amountInputRef}
                style={styles.textInput}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder={modalDetails.amount.toString()}
              />
            </View>
            <Text style={styles.inputHint}>Min: ₹100 | Max: ₹50,000</Text>
          </View>

          <TouchableOpacity
            style={styles.payNowButtonModal}
            onPress={handlePaymentInitiate}
          >
            <Text style={styles.payNowButtonTextModal}>
              Pay ₹
              {formatNumberIndianStyle(paymentAmount || modalDetails.amount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.modalCloseButton}
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value, color = "#263238" }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={[styles.detailAmount, { color: color }]}>
      ₹ {formatNumberIndianStyle(value)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#053B90" },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: "#F9FCFF",
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 25,
    overflow: "hidden",
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#263238",
    textAlign: "center",
  },
  subSectionTitle: {
    fontSize: 13,
    color: "#546E7A",
    textAlign: "center",
    marginBottom: 20,
  },
  loader: { marginTop: 50 },
  groupCardEnhanced: {
    marginVertical: 10,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECEFF1",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContentWrapper: { padding: 15 },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFF1",
    paddingBottom: 8,
    marginBottom: 10,
  },
  groupCardNameEnhanced: { fontWeight: "bold", fontSize: 17, color: "#1976D2" },
  groupCardTicketEnhanced: { fontSize: 13, color: "#546E7A", marginTop: 2 },
  financialDetailsSection: { marginBottom: 10 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: { color: "#546E7A", fontSize: 13 },
  detailAmount: { fontWeight: "bold", fontSize: 13 },
  balanceStatusBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 5,
    alignItems: "center",
  },
  balanceSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  balanceMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#263238",
    marginHorizontal: 8,
  },
  balanceAmount: { fontSize: 16, fontWeight: "bold" },
  payNowButton: {
    flexDirection: "row",
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  payNowButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  noGroupsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  noGroupImage: { width: 180, height: 180 },
  noGroupsText: {
    fontSize: 20,
    color: "#263238",
    fontWeight: "bold",
    marginTop: 15,
  },
  noGroupsSubText: { fontSize: 14, color: "#546E7A", marginTop: 5 },
  modal: { justifyContent: "center", alignItems: "center", margin: 0 },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 25,
    borderRadius: 25,
    width: "90%",
    alignItems: "center",
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 5,
  },
  duePaymentText: {
    fontSize: 14,
    color: "#546E7A",
    marginBottom: 20,
    textAlign: "center",
  },
  outstandingAmountBox: {
    backgroundColor: "#FFF1F0",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  outstandingAmountLabel: { fontSize: 14, color: "#D32F2F", marginRight: 10 },
  outstandingAmountTextModal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D32F2F",
  },
  inputContainer: { width: "100%", marginBottom: 10 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#053B90",
    borderRadius: 12,
    width: "100%",
    height: 55,
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 20,
    color: "#053B90",
    fontWeight: "bold",
    marginRight: 8,
  },
  textInput: { flex: 1, fontSize: 18, color: "#263238", fontWeight: "600" },
  inputHint: {
    fontSize: 11,
    color: "#90A4AE",
    marginTop: 5,
    textAlign: "center",
  },
  payNowButtonModal: {
    backgroundColor: "#007BFF",
    paddingVertical: 16,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  payNowButtonTextModal: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  modalCloseButton: { marginTop: 20, padding: 10 },
  modalCloseButtonText: { color: "#546E7A", fontWeight: "600", fontSize: 14 },
});

export default PayYourDues;
