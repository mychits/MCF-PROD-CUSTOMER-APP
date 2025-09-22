import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  StyleSheet,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import Header from "../components/layouts/Header";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

const Colors = {
  primaryBlue: "#053B90",
  secondaryBlue: "#0C53B3",
  lightBackground: "#E8F0F7",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  accentColor: "#3498DB",
  removedText: "#E74C3C",
  completedText: "#27AE60",
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";
  let isNegative = false;
  if (integerPart.startsWith("-")) {
    isNegative = true;
    integerPart = integerPart.substring(1);
  }
  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  const formattedOther = otherNumbers
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ","
    : "";
  return (isNegative ? "-" : "") + formattedOther + lastThree + decimalPart;
};

const Mygroups = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [Totalpaid, setTotalPaid] = useState(0);
  const [Totalprofit, setTotalProfit] = useState(0);
  const [individualGroupReports, setIndividualGroupReports] = useState({});

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${url}/enroll/users/${userId}`);
      setCardsData(response.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setCardsData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchAllOverview = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets-report/${userId}`
      );
      const data = response.data;
      setTotalPaid(
        data.reduce((sum, g) => sum + (g?.payments?.totalPaidAmount || 0), 0)
      );
      setTotalProfit(
        data.reduce((sum, g) => sum + (g?.profit?.totalProfit || 0), 0)
      );

      const reportsMap = {};
      data.forEach((groupReport) => {
        if (
          groupReport.enrollment &&
          groupReport.enrollment.group &&
          groupReport.enrollment.tickets !== undefined
        ) {
          const key = `${groupReport.enrollment.group._id || groupReport.enrollment.group
            }-${groupReport.enrollment.tickets}`;
          reportsMap[key] = {
            totalPaid: groupReport.payments?.totalPaidAmount || 0,
            totalProfit: groupReport.profit?.totalProfit || 0,
          };
        }
      });
      setIndividualGroupReports(reportsMap);
    } catch (error) {
      if (error.response?.status === 404) {
        setTotalPaid(0);
        setTotalProfit(0);
        setIndividualGroupReports({});
      } else {
        console.error(error);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTickets();
      fetchAllOverview();
    }
  }, [userId, fetchTickets, fetchAllOverview]);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
      fetchAllOverview();
    }, [fetchTickets, fetchAllOverview])
  );

  const filteredCards = cardsData.filter((card) => card.group_id !== null);
  const handleCardPress = (groupId, ticket) => {
    navigation.navigate("BottomTab", {
      screen: "EnrollTab",
      params: { screen: "EnrollGroup", params: { userId, groupId, ticket } },
    });
  };
  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit;
  const calculatePaidPercentage = (group_value, paid_amount) => {
    if (!group_value || !paid_amount) return 0;
    return Math.min(100, Math.round((paid_amount / group_value) * 100));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.mainWrapper}>
        <View style={styles.innerWrapper}>
          <Text style={styles.title}>My Groups Payments</Text>

          {/* Summary Cards */}
          <View style={styles.summaryCards}>
            <LinearGradient
              colors={["#0A2647", "#0C53B3"]}
              style={styles.summaryCardLeft}
            >
              <FontAwesome5 name="wallet" size={20} color="#fff" />
              <Text style={styles.summaryAmount}>₹ {formatNumberIndianStyle(Totalpaid)}</Text>
              <Text style={styles.summaryText}>Total Investment</Text>
            </LinearGradient>
            <LinearGradient
              colors={["#196F3D", "#27AE60"]}
              style={styles.summaryCardRight}
            >
              <FontAwesome5 name="chart-line" size={20} color="#fff" />
              <Text style={styles.summaryAmount}>₹ {formatNumberIndianStyle(displayTotalProfit)}</Text>
              <Text style={styles.summaryText}>Total Dividend / Profit</Text>
            </LinearGradient>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryBlue} style={{ marginTop: 50 }} />
          ) : filteredCards.length === 0 ? (
            <View style={styles.noGroupWrapper}>
              <Image
                source={NoGroupImage}
                style={styles.noGroupImage}
                resizeMode="contain"
              />
              <Text style={styles.noGroupText}>
                No groups found for this user.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {filteredCards.map((card, index) => {
                const groupIdFromCard = card.group_id?._id || card.group_id;
                const groupReportKey = `${groupIdFromCard}-${card.tickets}`;
                const individualPaidAmount = individualGroupReports[groupReportKey]?.totalPaid || 0;
                const paidPercentage = calculatePaidPercentage(card.group_id.group_value, individualPaidAmount);

                const isDeleted = card.deleted;
                const isCompleted = card.completed;

                const gradientColors = isDeleted
                  ? ["#F5F5F5", "#E0E0E0"]
                  : isCompleted
                    ? ["#E8F6F3", "#27AE60"]
                    : ["#E0F0FF", "#0C53B3"];

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCardPress(card.group_id._id, card.tickets)}
                    disabled={isDeleted}
                    style={styles.cardTouchable}
                  >
                    <LinearGradient colors={gradientColors} style={styles.cardGradient}>
                      <View style={[styles.cardInner, { backgroundColor: isDeleted ? "#F0F0F0" : "#fff" }]}>
                        {/* Card Header */}
                        <View style={styles.cardHeader}>
                          <View
                            style={[
                              styles.iconCircle,
                              {
                                backgroundColor: isDeleted
                                  ? "#BDC3C7"
                                  : isCompleted
                                    ? Colors.completedText
                                    : Colors.secondaryBlue,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons name="currency-inr" size={28} color="#fff" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[
                              styles.cardTitle,
                              { color: isDeleted ? Colors.removedText : isCompleted ? Colors.completedText : Colors.darkText }
                            ]}>
                              {card.group_id.group_name}
                            </Text>
                            <Text style={styles.ticketText}>Ticket: {card.tickets}</Text>
                            {isDeleted && (
                              <Text style={styles.removalReason}>
                                Reason: {card.removal_reason?.toUpperCase() !== "OTHERS" ? card.removal_reason : "Unknown"}
                              </Text>
                            )}
                            {isCompleted && (
                              <Text style={styles.completedText}>
                                Completed
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Card Body */}
                        <View>
                          <View style={styles.progressHeader}>
                            <Text style={styles.progressText}>Paid</Text>
                            <Text style={styles.progressTextBold}>{paidPercentage}%</Text>
                          </View>
                          <View style={styles.progressBar}>
                            <View
                              style={{
                                width: `${paidPercentage}%`,
                                height: 8,
                                borderRadius: 10,
                                backgroundColor: Colors.accentColor,
                              }}
                            />
                          </View>
                          <View style={styles.amountRow}>
                            <View style={styles.amountColumn}>
                              <Text style={styles.amountLabel}>Total Value</Text>
                              <Text style={styles.amountValue}>₹ {formatNumberIndianStyle(card.group_id.group_value)}</Text>
                            </View>
                            <View style={styles.amountColumn}>
                              <Text style={styles.amountLabel}>Paid</Text>
                              <Text style={[styles.amountValue, { color: Colors.accentColor }]}>₹ {formatNumberIndianStyle(individualPaidAmount)}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    margin: 10,
    borderRadius: 20,
  },
  innerWrapper: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  summaryCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryCardLeft: {
    flex: 1,
    marginRight: 5,
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
  },
  summaryCardRight: {
    flex: 1,
    marginLeft: 5,
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
  },
  summaryAmount: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
  summaryText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
  },
  noGroupWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  noGroupImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  noGroupText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.darkText,
    textAlign: "center",
  },
  cardTouchable: {
    marginVertical: 10,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 2,
  },
  cardInner: {
    borderRadius: 18,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  ticketText: {
    fontSize: 14,
    color: Colors.mediumText,
  },
  removalReason: {
    fontSize: 12,
    color: Colors.removedText,
    marginTop: 2,
  },
  completedText: {
    fontSize: 12,
    color: Colors.completedText,
    fontWeight: "bold",
    marginTop: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: Colors.mediumText,
  },
  progressTextBold: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountColumn: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.mediumText,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Mygroups;
