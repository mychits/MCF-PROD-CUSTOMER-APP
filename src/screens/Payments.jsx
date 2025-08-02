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
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

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
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  } else {
    integerPart = lastThree;
  }

  return isNegative ? "-" + integerPart + decimalPart : integerPart + decimalPart;
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
  gradientStartLight: "#E3F2FD",
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
};

const Payments = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

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

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
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

  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit;

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />

      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBoxContainer}>
        <View style={styles.mainContentWrapper}>
          <Text style={styles.sectionTitle}>My Payment</Text>

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
                const correspondingOverview = allOverviewData.find(
                  (overviewItem) =>
                    overviewItem.enrollment?.tickets === card.tickets
                );
                const individualPaidAmount =
                  correspondingOverview?.payments?.totalPaidAmount || 0;

                const isExpanded = expandedCards[card._id]; // Check if this card is expanded

                return (
                  <TouchableOpacity
                    key={card._id || index}
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
                    style={styles.groupCardEnhanced}
                  >
                    <LinearGradient
                      colors={[Colors.gradientStartLight, Colors.gradientEndLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.cardContentBox}
                    >
                      <View style={styles.cardHeaderArea}>
                        <View style={styles.iconContainer}>
                          <MaterialCommunityIcons
                            name="currency-inr"
                            size={30}
                            color={Colors.accentGold}
                          />
                        </View>
                        <View style={styles.headerInfo}>
                          {card.group_id?.group_value !== undefined && (
                            <Text style={styles.groupValueProminent}>
                              ₹ {formatNumberIndianStyle(card.group_id.group_value)}
                            </Text>
                          )}
                          <Text style={styles.groupNameSubtitle}>
                            {card.group_id.group_name}
                          </Text>
                        </View>
                        {card.group_id?.members?.length > 0 && (
                          <View style={styles.membersIconContainer}>
                            <Ionicons name="people" size={24} color={Colors.primaryBlue} />
                            <Text style={styles.membersCountText}>
                              {card.group_id.members.length}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.ticketNumberTextBelowGroup}>
                        Ticket Number: {card.tickets}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleExpand(card._id)}
                        style={styles.expandButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.expandButtonText}>
                          {isExpanded ? "Expand less" : "Expand more"}
                        </Text>
                        <MaterialIcons
                          name={isExpanded ? "expand-less" : "expand-more"}
                          size={24}
                          color={Colors.primaryBlue}
                        />
                      </TouchableOpacity>
                      {isExpanded && (
                        <>
                          <View style={styles.cardDivider} />
                          <View style={styles.detailsGrid}>
                            {card.group_id?.start_date && (
                              <View style={[styles.detailItem, styles.halfWidthDetailItem]}>
                                <MaterialIcons name="date-range" size={16} color={Colors.mediumText} />
                                <View>
                                  <Text style={styles.detailText}>Start Date:</Text>
                                  <Text style={styles.detailDateText}>
                                    {new Date(card.group_id.start_date).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {card.group_id?.end_date && (
                              <View style={[styles.detailItem, styles.halfWidthDetailItem]}>
                                <MaterialIcons name="date-range" size={16} color={Colors.mediumText} />
                                <View>
                                  <Text style={styles.detailText}>End Date:</Text>
                                  <Text style={styles.detailDateText}>
                                    {new Date(card.group_id.end_date).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </Text>
                                </View>
                              </View>
                            )}
                            <View style={[styles.detailItem, styles.fullWidthDetailItem, styles.centeredDetailItem]}>
                              <MaterialIcons name="payments" size={18} color={Colors.mediumText} style={styles.iconBeforeText} />
                              <Text style={[styles.detailText, styles.noMarginLeft, { color: Colors.primaryBlue, fontWeight: 'bold' }]}>
                                Paid: ₹ {formatNumberIndianStyle(individualPaidAmount)}
                              </Text>
                            </View>

                            {card.group_id?.amount_due !== undefined && (
                              <View style={[styles.detailItem, styles.fullWidthDetailItem, styles.centeredDetailItem]}>
                                <MaterialIcons name="money" size={18} color={Colors.mediumText} style={styles.iconBeforeText} />
                                <Text style={[styles.detailText, styles.noMarginLeft, styles.highlightedAmountEnhanced]}>
                                  Due: ₹ {formatNumberIndianStyle(card.group_id.amount_due)}
                                </Text>
                              </View>
                            )}
                            {card.group_id?.members?.length > 0 && (
                              <View style={styles.detailItem}>
                                <Ionicons name="people" size={18} color={Colors.mediumText} />
                                <Text style={styles.detailText}>
                                  {card.group_id.members.length} Members
                                </Text>
                              </View>
                            )}
                          </View>
                        </>
                      )}
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
              <Text style={styles.noGroupsText}>
                No Groups Yet!
              </Text>
              <Text style={styles.noGroupsSubText}>
                It looks like you haven't joined any groups. Start your investment journey by exploring and enrolling in a new group!
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

  groupCardEnhanced: {
    backgroundColor: Colors.cardBackground,
    marginVertical: 10,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.lightGray,
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
  cardContentBox: {
    padding: 20,
    borderRadius: 15,
  },
  cardHeaderArea: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 2,
    borderColor: Colors.iconBorderHighlight,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerInfo: {
    flex: 1,
  },
  groupValueProminent: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.darkText,
    marginBottom: 2,
  },
  groupNameSubtitle: {
    fontSize: 16,
    color: Colors.mediumText,
    fontWeight: "600",
  },
  // New style for ticket number when placed below group name
  ticketNumberTextBelowGroup: {
    fontSize: 18,
    color: Colors.mediumText,
    fontWeight: '500',
    marginBottom: 15, // Space before the divider
    textAlign: 'center',
  },
  membersIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  membersCountText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.primaryBlue,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderColor,
    marginVertical: 15,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 10,
  },
  fullWidthDetailItem: {
    width: "100%",
  },
  centeredDetailItem: {
    justifyContent: "center",
  },
  detailText: {
    fontSize: 18,
    color: Colors.darkText,
    marginLeft: 8,
  },
  noMarginLeft: {
    marginLeft: 0,
  },
  iconBeforeText: {
    marginRight: 4,
  },
  highlightedAmountEnhanced: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.amountHighlight,
  },
  detailDateText: {
    fontSize: 16,
    color: Colors.mediumText,
    marginLeft: 6,
    marginTop: 2,
  },
  halfWidthDetailItem: {
    width: "49%",
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
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.buttonPrimary,
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
    fontWeight: 'bold',
    marginLeft: 10,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 10,
    backgroundColor: Colors.lightBackground,
  },
  expandButtonText: {
    color: Colors.primaryBlue,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
});

export default Payments;