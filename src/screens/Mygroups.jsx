import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Platform,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

const Colors = {
  // New color palette inspired by the provided image
  primaryBlue: "#053B90",
  secondaryBlue: "#0C53B3",
  lightBackground: "#E8F0F7",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentColor: "#3498DB",
  investmentCardBackground: "#0A2647",
  profitCardBackground: "#196F3D",
  buttonText: "#FFFFFF",
  shadowColor: "rgba(0,0,0,0.1)",
  progressFill: "#3498DB",
  progressBackground: "#E0E0E0",
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) {
    return "0";
  }
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";
  let isNegative = false;
  if (integerPart.startsWith("-")) {
    isNegative = true;
    integerPart = integerPart.substring(1);
  }

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return (isNegative ? "-" : "") + formattedOtherNumbers + "," + lastThree + decimalPart;
  } else {
    return (isNegative ? "-" : "") + lastThree + decimalPart;
  }
};

const Mygroups = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [appUser, setAppUser] = useContext(ContextProvider);
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
      const response = await axios.post(
        `${url}/enroll/get-user-tickets/${userId}`
      );
      setCardsData(response.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setCardsData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchAllOverview = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      const response = await axios.post(
        `${url}/enroll/get-user-tickets-report/${userId}`
      );
      const data = response.data;
      const totalPaidAmount = data.reduce(
        (sum, group) => sum + (group?.payments?.totalPaidAmount || 0),
        0
      );
      setTotalPaid(totalPaidAmount);

      const totalProfitAmount = data.reduce(
        (sum, group) => sum + (group?.profit?.totalProfit || 0),
        0
      );
      setTotalProfit(totalProfitAmount);
      const reportsMap = {};
      data.forEach((groupReport) => {
        if (
          groupReport.enrollment &&
          groupReport.enrollment.group &&
          groupReport.enrollment.tickets !== undefined
        ) {
          const groupIdFromReport =
            groupReport.enrollment.group._id || groupReport.enrollment.group;
          const key = `${groupIdFromReport}-${groupReport.enrollment.tickets}`;
          reportsMap[key] = {
            totalPaid: groupReport.payments?.totalPaidAmount || 0,
            totalProfit: groupReport.profit?.totalProfit || 0,
          };
        }
      });
      setIndividualGroupReports(reportsMap);
    } catch (error) {
      console.error("Error fetching overview:", error);
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
      params: {
        screen: "EnrollGroup",
        params: {
          userId: userId,
          groupId: groupId,
          ticket: ticket,
        },
      },
    });
  };

  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit;

  const calculatePaidPercentage = (group_value, paid_amount) => {
    if (!group_value || !paid_amount) return 0;
    const percentage = (paid_amount / group_value) * 100;
    return Math.min(100, Math.round(percentage));
  };


  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />
      
      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <Text style={styles.sectionTitle}>My Groups</Text>

          <View style={styles.summaryCardsRow}>
            <View style={[styles.summaryCard, styles.investmentCardBackground]}>
              <FontAwesome5
                name="wallet"
                size={20}
                color={Colors.buttonText}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryAmount}>
                ₹ {formatNumberIndianStyle(Totalpaid || 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Investment</Text>
            </View>
            <View style={[styles.summaryCard, styles.profitCardBackground]}>
              <FontAwesome5
                name="chart-line"
                size={20}
                color={Colors.buttonText}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryAmount}>
                ₹ {formatNumberIndianStyle(displayTotalProfit || 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Dividend / Profit </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primaryBlue}
              style={styles.loader}
            />
          ) : filteredCards.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.groupListContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {filteredCards.map((card, index) => {
                const groupIdFromCard = card.group_id?._id || card.group_id;
                const groupReportKey = `${groupIdFromCard}-${card.tickets}`;
                const individualPaidAmount =
                  individualGroupReports[groupReportKey]?.totalPaid || 0;
                const paidPercentage = calculatePaidPercentage(card.group_id.group_value, individualPaidAmount);

                return (
                  <TouchableOpacity
                    key={card._id || index}
                    style={styles.groupCardTouchable}
                    onPress={() =>
                      handleCardPress(card.group_id._id, card.tickets)
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.groupCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                          <MaterialCommunityIcons
                            name="currency-inr"
                            size={28}
                            color={Colors.buttonText}
                          />
                        </View>
                        <View style={styles.cardTitleContainer}>
                          <Text style={styles.cardTitle}>
                            {card.group_id.group_name}
                          </Text>
                          <Text style={styles.cardSubtitle}>
                            Ticket: {card.tickets}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardBody}>
                        <View style={styles.progressSection}>
                          <View style={styles.progressTextRow}>
                            <Text style={styles.progressLabel}>Paid</Text>
                            <Text style={styles.progressPercentage}>
                              {paidPercentage}%
                            </Text>
                          </View>
                          <View style={styles.progressBar}>
                            <View
                              style={[styles.progressBarFill, { width: `${paidPercentage}%` }]}
                            />
                          </View>
                        </View>
                        <View style={styles.amountDetails}>
                          <View style={styles.amountItem}>
                            <Text style={styles.amountLabel}>Total Value</Text>
                            <Text style={styles.amountValue}>
                              ₹ {formatNumberIndianStyle(card.group_id.group_value)}
                            </Text>
                          </View>
                          <View style={styles.amountItem}>
                            <Text style={styles.amountLabel}>Paid</Text>
                            <Text style={[styles.amountValue, { color: Colors.accentColor }]}>
                              ₹ {formatNumberIndianStyle(individualPaidAmount)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
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
              <Text style={styles.noGroupsText}>
                No groups found for this user.
              </Text>
              <Text style={styles.noGroupsSubText}>
                Join a group to track your payments here!
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
  },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    marginHorizontal: 10,
    marginBottom: 50,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 24,
    color: Colors.darkText,
    textAlign: "center",
    marginBottom: 15,
  },
  summaryCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  investmentCardBackground: {
    backgroundColor: Colors.investmentCardBackground,
  },
  profitCardBackground: {
    backgroundColor: Colors.profitCardBackground,
  },
  summaryIcon: {
    marginBottom: 10,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.buttonText,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.buttonText,
    marginTop: 5,
    textAlign: "center",
    fontWeight: "600",
  },
  groupListContentContainer: {
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  noGroupsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 60,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    marginVertical: 25,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  noGroupImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  noGroupsText: {
    textAlign: "center",
    color: Colors.darkText,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  noGroupsSubText: {
    textAlign: "center",
    color: Colors.mediumText,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: "90%",
  },

  // NEW STYLES FOR THE IMAGE-INSPIRED CARD
  groupCardTouchable: {
    marginVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  groupCard: {
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.darkText,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.mediumText,
    marginTop: 2,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 10,
  },
  progressSection: {
    marginBottom: 15,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.mediumText,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.accentColor,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.progressBackground,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.progressFill,
  },
  amountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  amountItem: {
    alignItems: 'flex-start',
    flex: 1,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.mediumText,
    fontWeight: '500',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
});

export default Mygroups;