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
  Vibration,
} from "react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import url from "../data/url";
import Header from "../components/layouts/Header";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

// Helper function to format numbers in Indian style
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) {
    return "0";
  }
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";
  const isNegative = integerPart.startsWith("-");
  if (isNegative) {
    integerPart = integerPart.substring(1);
  }

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  if (otherNumbers !== "") {
    integerPart =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  } else {
    integerPart = lastThree;
  }

  return isNegative ? "-" + integerPart + decimalPart : integerPart + decimalPart;
};

// Centralized color palette
const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F0F5F9",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentGreen: "#2ECC71",
  accentBlue: "#3499DB",
  buttonPrimary: "#00BCD4",
  buttonText: "#FFFFFF",
  shadowColor: "rgba(0,0,0,0.1)",
  gradientStartLight: "#F8FBFF",
  gradientEndLight: "#FFFFFF",
  actionBoxBackground: "#F8F8F8",
  borderColor: "#E0E0E0",
  amountHighlight: "#E74C3C",
  darkInvestment: "#0A2647",
  darkProfit: "#196F3D",
  accentGold: "#FFD700",
  lightGray: "#F5F5F5",
  darkGray: "#A9A9A9",
  iconBorderHighlight: "#FFFFFF",
  lightDivider: "#EBEBEB",
};

const ReportList = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const { userId } = appUser || {};

  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [TotalToBepaid, setTotalToBePaid] = useState(0);
  const [Totalpaid, setTotalPaid] = useState(0);
  const [Totalprofit, setTotalProfit] = useState(0);
  const [allOverviewData, setAllOverviewData] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (cardId) => {
    Vibration.vibrate(50);
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const fetchUserTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${url}/enroll/get-user-tickets/${userId}`);
      setCardsData(response.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setCardsData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchUserOverview = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      const response = await axios.post(`${url}/enroll/get-user-tickets-report/${userId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setAllOverviewData(data);

      const totalToBePaidAmount = data.reduce(
        (sum, group) =>
          sum +
          (group?.payable?.totalPayable +
            (parseInt(group?.enrollment?.group?.group_install) || 0) || 0),
        0
      );
      setTotalToBePaid(totalToBePaidAmount);

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
    } catch (error) {
      console.error("Error fetching overview:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserTickets();
      fetchUserOverview();
    }
  }, [userId, fetchUserTickets, fetchUserOverview]);

  useFocusEffect(
    useCallback(() => {
      fetchUserTickets();
      fetchUserOverview();
    }, [fetchUserTickets, fetchUserOverview])
  );

  const filteredCards = cardsData.filter((card) => card.group_id !== null);
  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit;

  const renderGroupCards = () => {
    return filteredCards.map((card, index) => {
      const correspondingOverview = allOverviewData.find(
        (overviewItem) => overviewItem.enrollment?.tickets === card.tickets
      );
      const individualPaidAmount = correspondingOverview?.payments?.totalPaidAmount || 0;
      const totalGroupValue = card.group_id?.group_value || 0;
      const progressPercentage = (individualPaidAmount / totalGroupValue) * 100;
      const groupInstallment = parseInt(card.group_id?.group_install) || 0;
      const remainingDue = groupInstallment - individualPaidAmount;

      return (
        <View key={card._id || index} style={styles.dashboardCard}>
          {/* Top Section */}
          <View style={styles.topSection}>
            <Text style={styles.sectionTitleIcelandic}>
              {card.group_id.group_name}
            </Text>
            <View style={styles.amountRow}>
              <Text style={styles.mainAmount}>
                ₹ {formatNumberIndianStyle(individualPaidAmount)}
              </Text>
              <Text style={styles.subAmount}>
                ₹ {formatNumberIndianStyle(totalGroupValue)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage > 100 ? 100 : progressPercentage}%` }]} />
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardDivider} />

          {/* Action Buttons Section */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Vibration.vibrate(50);
                navigation.navigate("EnrollTab", {
                  screen: "EnrollGroup",
                  params: {
                    userId: userId,
                    groupId: card.group_id?._id,
                    ticket: card.tickets,
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="payments" size={30} color={Colors.primaryBlue} />
              <Text style={styles.actionButtonLabel}>View Payments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Vibration.vibrate(50);
                navigation.navigate("EnrollTab", {
                  screen: "EnrollGroup",
                  params: {
                    userId: userId,
                    groupId: card.group_id?._id,
                    ticket: card.tickets,
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="currency-inr" size={30} color={Colors.primaryBlue} />
              <Text style={styles.actionButtonLabel}>Pay Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Vibration.vibrate(50);
                navigation.navigate("EnrollTab", {
                  screen: "EnrollGroup",
                  params: {
                    userId: userId,
                    groupId: card.group_id?._id,
                    ticket: card.tickets,
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="chart-line" size={30} color={Colors.primaryBlue} />
              <Text style={styles.actionButtonLabel}>View Profit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Transaction Summary Button */}
          <TouchableOpacity
            style={styles.transactionSummaryRow}
            onPress={() => {
              Vibration.vibrate(50);
              navigation.navigate("EnrollTab", {
                screen: "EnrollGroup",
                params: {
                  userId: userId,
                  groupId: card.group_id?._id,
                  ticket: card.tickets,
                },
              });
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="list-alt" size={24} color={Colors.primaryBlue} />
            <Text style={styles.transactionSummaryText}>
              Ticket Number: {card.tickets}
            </Text>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.mediumText} />
          </TouchableOpacity>
        </View>
      );
    });
  };

  const renderNoGroups = () => (
    <View style={styles.noGroupsContainer}>
      <Image
        source={NoGroupImage}
        style={styles.noGroupImage}
        resizeMode="contain"
      />
      <Text style={styles.noGroupsText}>No Groups Yet!</Text>
      <Text style={styles.noGroupsSubText}>
        Start your investment journey by exploring and enrolling in a new group.
      </Text>
      <TouchableOpacity
        style={styles.joinGroupButton}
        onPress={() => navigation.navigate("GroupsTab")}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={24} color={Colors.buttonText} />
        <Text style={styles.joinGroupButtonText}>Explore Groups</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <Text style={styles.sectionTitle}>My Groups Report</Text>

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
              {renderGroupCards()}
            </ScrollView>
          ) : (
            renderNoGroups()
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
    marginBottom: 10,
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
    backgroundColor: Colors.darkInvestment,
  },
  profitCardBackground: {
    backgroundColor: Colors.darkProfit,
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

  // NEW STYLES FOR THE DASHBOARD-LIKE CARDS
  dashboardCard: {
    backgroundColor: Colors.cardBackground,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  topSection: {
    marginBottom: 20,
  },
  sectionTitleIcelandic: {
    fontSize: 16,
    color: Colors.mediumText,
    marginBottom: 5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mainAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  subAmount: {
    fontSize: 18,
    color: Colors.mediumText,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accentBlue,
    borderRadius: 4,
  },
  monthlyBillsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  billsTitle: {
    fontSize: 16,
    color: Colors.mediumText,
    marginBottom: 5,
  },
  billsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  countdownCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: Colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  countdownLabel: {
    fontSize: 10,
    color: Colors.mediumText,
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: Colors.lightGray,
  },
  actionButtonLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkText,
    textAlign: 'center',
  },
  transactionSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  transactionSummaryText: {
    fontSize: 16,
    color: Colors.darkText,
    flex: 1,
    marginLeft: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.lightDivider,
  },

  // EXISTING STYLES (kept for the rest of the file)
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
    paddingHorizontal: 20,
    paddingVertical: 60,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 20,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  noGroupImage: {
    width: 200,
    height: 200,
    marginBottom: 25,
  },
  noGroupsText: {
    textAlign: "center",
    color: Colors.primaryBlue,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  noGroupsSubText: {
    textAlign: "center",
    color: Colors.darkText,
    fontSize: 16,
    lineHeight: 25,
    maxWidth: "80%",
    marginBottom: 30,
  },
  joinGroupButton: {
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  joinGroupButtonText: {
    color: Colors.buttonText,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  expandButton: {
    padding: 5,
  },
  viewButton: {
    backgroundColor: Colors.accentBlue,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 'auto',
    ...Platform.select({
      ios: {
        shadowColor: Colors.accentBlue,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  viewButtonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportList;