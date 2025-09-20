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

// Indian-style number formatter
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";
  const isNegative = integerPart.startsWith("-");
  if (isNegative) integerPart = integerPart.substring(1);

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  if (otherNumbers !== "") {
    integerPart =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  } else {
    integerPart = lastThree;
  }

  return (isNegative ? "-" : "") + integerPart + decimalPart;
};

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
  lightDivider: "#EBEBEB",
  lightGray: "#F5F5F5",
  darkInvestment: "#0A2647",
  darkProfit: "#196F3D",
};

export default function Mygroups({ navigation }) {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const { userId } = appUser || {};

  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [Totalpaid, setTotalPaid] = useState(0);
  const [Totalprofit, setTotalProfit] = useState(0);

  const fetchUserTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${url}/enroll/users/${userId}`);
      const data = response.data || [];
      setCardsData(data);

      const paid = data.reduce(
        (sum, g) => sum + (g.payments?.totalPaidAmount || 0),
        0
      );
      const profit = data.reduce(
        (sum, g) => sum + (g.profit?.totalProfit || 0),
        0
      );
      setTotalPaid(paid);
      setTotalProfit(profit);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setCardsData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserTickets();
  }, [fetchUserTickets]);

  useFocusEffect(
    useCallback(() => {
      fetchUserTickets();
    }, [fetchUserTickets])
  );

  const filteredCards = cardsData.filter((c) => c.group_id);
  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit;

  const renderGroupCards = () =>
    filteredCards.map((card, index) => {
      const individualPaidAmount = card.payments?.totalPaidAmount || 0;
      const totalGroupValue = card.group_id?.group_value || 0;
      const progressPercentage =
        (individualPaidAmount / totalGroupValue) * 100 || 0;

      const isDeleted = card.is_removed;
      const removalReason = card.removal_reason;

      return (
        <View key={card._id || index} style={[styles.dashboardCard, isDeleted && styles.deletedCard]}>
          <View style={styles.topSection}>
            <Text style={styles.groupTitle}>{card.group_id.group_name}</Text>
            {isDeleted && removalReason && (
              <View style={styles.removalReasonContainer}>
                <MaterialIcons name="cancel" size={20} color="red" />
                <Text style={styles.removalReasonText}>
                  Reason: {removalReason}
                </Text>
              </View>
            )}
            <View style={styles.amountRow}>
              <Text style={styles.mainAmount}>
                ₹ {formatNumberIndianStyle(individualPaidAmount)}
              </Text>
              <Text style={styles.subAmount}>
                ₹ {formatNumberIndianStyle(totalGroupValue)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      progressPercentage > 100 ? 100 : progressPercentage
                    }%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.actionButtonsRow}>
            {["View Payments", "Pay Now", "View Profit"].map((label, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionButton}
                onPress={() => {
                  Vibration.vibrate(50);
                  navigation.navigate("EnrollTab", {
                    screen: "EnrollGroup",
                    params: {
                      userId,
                      groupId: card.group_id?._id,
                      ticket: card.tickets,
                    },
                  });
                }}
                activeOpacity={0.8}
              >
                {i === 0 && (
                  <MaterialIcons
                    name="payments"
                    size={30}
                    color={Colors.primaryBlue}
                  />
                )}
                {i === 1 && (
                  <MaterialCommunityIcons
                    name="currency-inr"
                    size={30}
                    color={Colors.primaryBlue}
                  />
                )}
                {i === 2 && (
                  <FontAwesome5
                    name="chart-line"
                    size={30}
                    color={Colors.primaryBlue}
                  />
                )}
                <Text style={styles.actionButtonLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.cardDivider} />

          <TouchableOpacity
            style={styles.transactionSummaryRow}
            onPress={() => {
              Vibration.vibrate(50);
              navigation.navigate("EnrollTab", {
                screen: "EnrollGroup",
                params: {
                  userId,
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
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              color={Colors.mediumText}
            />
          </TouchableOpacity>
        </View>
      );
    });

  const renderNoGroups = () => (
    <View style={styles.noGroupsContainer}>
      <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
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
          <Text style={styles.sectionTitle}>My Groups</Text>

          <View style={styles.summaryCardsRow}>
            <View style={[styles.summaryCard, { backgroundColor: Colors.darkInvestment }]}>
              <FontAwesome5 name="wallet" size={20} color={Colors.buttonText} />
              <Text style={styles.summaryAmount}>
                ₹ {formatNumberIndianStyle(Totalpaid || 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Investment</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: Colors.darkProfit }]}>
              <FontAwesome5 name="chart-line" size={20} color={Colors.buttonText} />
              <Text style={styles.summaryAmount}>
                ₹ {formatNumberIndianStyle(displayTotalProfit || 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Dividend / Profit</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryBlue} style={styles.loader} />
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
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: Colors.primaryBlue },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    margin: 10,
    borderRadius: 20,
    ...Platform.select({
      ios: { shadowColor: Colors.shadowColor, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  mainContentWrapper: { flex: 1, backgroundColor: Colors.cardBackground, padding: 20 },
  sectionTitle: { fontWeight: "bold", fontSize: 24, color: Colors.darkText, textAlign: "center", marginBottom: 15 },
  summaryCardsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 15 },
  summaryCard: {
    flex: 1,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
    ...Platform.select({ ios: { shadowColor: Colors.shadowColor, shadowOpacity: 0.18, shadowRadius: 8 }, android: { elevation: 8 } }),
  },
  summaryAmount: { fontSize: 20, fontWeight: "bold", color: Colors.buttonText },
  summaryLabel: { fontSize: 12, color: Colors.buttonText, marginTop: 5, textAlign: "center", fontWeight: "600" },
  groupListContentContainer: { paddingBottom: 20 },
  dashboardCard: {
    backgroundColor: Colors.cardBackground,
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 20,
    ...Platform.select({ ios: { shadowColor: Colors.shadowColor, shadowOpacity: 0.2, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  deletedCard: {
    borderColor: 'red',
    backgroundColor: '#ffe6e6',
  },
  topSection: { marginBottom: 20 },
  groupTitle: { fontSize: 16, color: Colors.mediumText, marginBottom: 5 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  mainAmount: { fontSize: 32, fontWeight: "bold", color: Colors.darkText },
  subAmount: { fontSize: 18, color: Colors.mediumText },
  progressBar: { height: 8, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: Colors.accentBlue },
  actionButtonsRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10, gap: 10 },
  actionButton: { flex: 1, alignItems: "center", paddingVertical: 15, borderRadius: 15, backgroundColor: Colors.lightGray },
  actionButtonLabel: { marginTop: 8, fontSize: 12, fontWeight: "600", color: Colors.darkText, textAlign: "center" },
  transactionSummaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15 },
  transactionSummaryText: { fontSize: 16, color: Colors.darkText, flex: 1, marginLeft: 10 },
  cardDivider: { height: 1, backgroundColor: Colors.lightDivider },
  removalReasonContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FDE7E7", padding: 8, borderRadius: 10, marginBottom: 10 },
  removalReasonText: { color: "red", fontStyle: "italic", marginLeft: 5, fontSize: 12 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  noGroupsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    margin: 20,
    ...Platform.select({ ios: { shadowColor: Colors.primaryBlue, shadowOpacity: 0.15, shadowRadius: 15 }, android: { elevation: 12 } }),
  },
  noGroupImage: { width: 200, height: 200, marginBottom: 25 },
  noGroupsText: { textAlign: "center", color: Colors.primaryBlue, fontSize: 22, fontWeight: "800", marginBottom: 10 },
  noGroupsSubText: { textAlign: "center", color: Colors.darkText, fontSize: 16, lineHeight: 25, maxWidth: "80%", marginBottom: 30 },
  joinGroupButton: {
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({ ios: { shadowColor: Colors.primaryBlue, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 8 } }),
  },
  joinGroupButtonText: { color: Colors.buttonText, fontSize: 18, fontWeight: "bold", marginLeft: 10 },
});