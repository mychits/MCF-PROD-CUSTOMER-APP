import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Image, StyleSheet, LayoutAnimation, Platform, UIManager, Animated, Linking,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import Header from "../components/layouts/Header";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import NoGroupImage from "../../assets/Nogroup.png";
import GirlImage from "../../assets/girlimage.png";
import { ContextProvider } from "../context/UserProvider";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const Colors = {
  primaryBlue: "#053B90",
  secondaryBlue: "#053B90",
  lightBackground: "#F5F8FA",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  accentColor: "#053B90",
  removedText: "#E74C3C",
  completedText: "#27AE60",
  tableHeaderBlue: "#042D75",
  tableBorderColor: "#E0E0E0",
  warningText: "#F39C12",
  prizedColor: "#F1C40F",
  prizedBadgeBg: "#FFF8DC",
  prizedBadgeText: "#9A6F00",
};

const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";
  const formattedNum = parseFloat(num).toFixed(2);
  const parts = formattedNum.toString().split(".");
  let integerPart = parts[0];
  let decimalPart = parts.length > 1 ? "." + parts[1] : "";
  let isNegative = false;
  if (integerPart.startsWith("-")) {
    isNegative = true;
    integerPart = integerPart.substring(1);
  }
  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, 0 - 3);
  const formattedOther = otherNumbers ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "";
  return (isNegative ? "-" : "") + formattedOther + lastThree + decimalPart;
};

const AccordionListItem = ({ card, index, isExpanded, onToggle, onScrollToCard }) => (
  <View style={accordionStyles.itemWrapper}>
    <TouchableOpacity
      style={accordionStyles.header}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggle(index);
      }}
    >
      <View style={accordionStyles.headerLeft}>
        <Text style={accordionStyles.indexText}>{index + 1}.</Text>
        <LinearGradient
          colors={[Colors.primaryBlue, Colors.secondaryBlue]}
          style={accordionStyles.badgeBox}
        >
          <Text style={accordionStyles.badgeText} numberOfLines={1}>
            {card.group_id?.group_name}
          </Text>
        </LinearGradient>

        {card.isPendingApproval && (
          <Ionicons
            name="hourglass-outline"
            size={16}
            color={Colors.warningText}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
      <Ionicons
        name={isExpanded ? "chevron-up" : "chevron-down"}
        size={16}
        color={Colors.primaryBlue}
      />
    </TouchableOpacity>

    {isExpanded && (
      <View style={accordionStyles.content}>
        <View style={accordionStyles.contentRow}>
          <Text style={accordionStyles.contentLabel}>Start Date:</Text>
          <Text style={accordionStyles.contentValue}>
            {card.group_id.start_date
              ? new Date(card.group_id.start_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'N/A'}
          </Text>
        </View>
        <View style={accordionStyles.contentRow}>
          <Text style={accordionStyles.contentLabel}>End Date:</Text>
          <Text style={accordionStyles.contentValue}>
            {card.group_id.end_date
              ? new Date(card.group_id.end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'N/A'}
          </Text>
        </View>
        <View style={accordionStyles.contentRow}>
          <Text style={accordionStyles.contentLabel}>Ticket Number:</Text>
          <Text style={accordionStyles.contentValue}>{card.tickets}</Text>
        </View>

        {card.isPendingApproval && (
          <Text style={accordionStyles.pendingApprovalText}>
            Pending Approval by MyChits team.
          </Text>
        )}

        <TouchableOpacity
          style={[accordionStyles.navigateButton, card.isPendingApproval && { backgroundColor: Colors.mediumText }]}
          onPress={() => onScrollToCard(index)}
          disabled={card.isPendingApproval}
        >
          <Text style={accordionStyles.navigateButtonText}>
            {card.isPendingApproval ? "Approval Pending" : "View Detailed Card"}
          </Text>
          {!card.isPendingApproval && <Ionicons name="arrow-down" size={12} color="#fff" style={{ marginLeft: 4 }} />}
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const Mygroups = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [cardsData, setCardsData] = useState([]);
  const [heldGroupsData, setHeldGroupsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('active');
  const [Totalpaid, setTotalPaid] = useState(null);
  const [Totalprofit, setTotalProfit] = useState(null);
  const [individualGroupReports, setIndividualGroupReports] = useState({});
  const [enrolledGroupsCount, setEnrolledGroupsCount] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(null);
  const [prizedData, setPrizedData] = useState({});

  const scrollViewRef = useRef(null);
  const cardLayouts = useRef({});

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const girlWalkX = useRef(new Animated.Value(-50)).current;
  const girlWalkY = useRef(new Animated.Value(50)).current;
  const girlWalkRotation = useRef(new Animated.Value(-10)).current;

  const recipientEmail = 'info.mychits@gmail.com';
  const phoneNumber = '+919483900777';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(slideAnim, { toValue: 5, duration: 400, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scaleAnim, slideAnim]);

  useEffect(() => {
    if (viewMode === 'held') {
      triggerWalkAnimation();
    }
  }, [viewMode]);

  useEffect(() => {
    if (heldGroupsData.length === 0 && viewMode === 'held') {
      setViewMode('active');
    }
  }, [heldGroupsData, viewMode]);

  const triggerWalkAnimation = () => {
    girlWalkX.setValue(-50);
    girlWalkY.setValue(50);
    girlWalkRotation.setValue(-10);

    const step1 = Animated.parallel([
      Animated.timing(girlWalkX, { toValue: -15, duration: 300, useNativeDriver: true }),
      Animated.timing(girlWalkRotation, { toValue: 5, duration: 300, useNativeDriver: true }),
    ]);

    const step2 = Animated.parallel([
      Animated.timing(girlWalkX, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(girlWalkRotation, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]);

    const moveUp = Animated.timing(girlWalkY, { toValue: 0, duration: 600, useNativeDriver: true });

    Animated.sequence([step1, step2]).start();
    moveUp.start();
  };

  const handleContactPress = (type, value) => {
    let urlLink = '';
    if (type === 'email') {
      urlLink = `mailto:${value}`;
    } else if (type === 'phone') {
      urlLink = `tel:${value}`;
    }

    Linking.canOpenURL(urlLink)
      .then((supported) => {
        if (!supported) {
          console.log("Can't handle url: " + urlLink);
        } else {
          return Linking.openURL(urlLink);
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  const fetchHeldGroups = useCallback(async () => {
    if (!userId) {
      setHeldGroupsData([]);
      return;
    }
    try {
      const response = await axios.get(`${url}/enroll/holded-user/${userId}`);
      const responseData = response.data.data || response.data || [];
      const normalizedData = responseData.map(item => ({
        ...item,
        isPendingApproval: true,
        tickets: item.tickets || item.no_of_tickets || 'N/A',
        group_id: item.group,
      }));
      setHeldGroupsData(normalizedData);
    } catch (error) {
      setHeldGroupsData([]);
    }
  }, [userId]);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setCardsData([]);
      return;
    }
    try {
      const response = await axios.get(`${url}/enroll/mobile-enrolls/users/${userId}`);
      const responseData = response.data.data || [];
      let allCards = [];

      responseData.forEach(groupBlock => {
        if (groupBlock.mobileAppEnrolls && groupBlock.mobileAppEnrolls.length > 0) {
          const mobileCards = groupBlock.mobileAppEnrolls.map(card => ({
            ...card,
            tickets: card.no_of_tickets,
            isPendingApproval: true,
          }));
          allCards.push(...mobileCards);
        }
        if (groupBlock.enrollments && groupBlock.enrollments.length > 0) {
          const approvedCards = groupBlock.enrollments.map(card => ({
            ...card,
            isPendingApproval: false,
          }));
          allCards.push(...approvedCards);
        }
      });
      setCardsData(allCards);
    } catch (error) {
      setCardsData([]);
    }
  }, [userId]);

  const fetchPrizedInfo = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${url}/auction/enrolls-info/users/${userId}`);
      const data = response.data.data || response.data || [];

      const map = {};
      data.forEach(item => {
        const ticket = item.ticket || item.tickets || item.no_of_tickets;
        const gid = item.group_id?._id || item.group_id;

        if (gid && ticket) {
          const key = `${gid}-${ticket}`;
          const isPrized = item.isPrized === true || String(item.isPrized).toLowerCase() === 'true';
          if (isPrized) {
            map[key] = true;
          }
        }
      });
      setPrizedData(map);
    } catch (error) {
      console.log("Error fetching prized info", error);
    }
  }, [userId]);

  const fetchAllOverview = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axios.post(`${url}/enroll/get-user-tickets-report/${userId}`);
      const data = response.data;
      setEnrolledGroupsCount(data.length);
      setTotalPaid(data.reduce((sum, g) => sum + (g?.payments?.totalPaidAmount || 0), 0));
      setTotalProfit(data.reduce((sum, g) => sum + (g?.profit?.totalProfit || 0), 0));

      const reportsMap = {};
      data.forEach((groupReport) => {
        if (groupReport.enrollment && groupReport.enrollment.group && groupReport.enrollment.tickets !== undefined) {
          const key = `${groupReport.enrollment.group._id || groupReport.enrollment.group}-${groupReport.enrollment.tickets}`;
          reportsMap[key] = {
            totalPaid: groupReport.payments?.totalPaidAmount || 0,
            totalProfit: groupReport.profit?.totalProfit || 0,
          };
        }
      });
      setIndividualGroupReports(reportsMap);
    } catch (error) {
      setTotalPaid(0);
      setTotalProfit(0);
      setIndividualGroupReports({});
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        if (userId) {
          await Promise.all([fetchTickets(), fetchAllOverview(), fetchHeldGroups(), fetchPrizedInfo()]);
        }
        setLoading(false);
      };
      loadData();
    }, [userId, fetchTickets, fetchAllOverview, fetchHeldGroups, fetchPrizedInfo])
  );

  const filteredCards = cardsData.filter((card) => card.group_id !== null);
  const activeCards = filteredCards.filter(c => !c.deleted && !c.isPendingApproval);
  const heldCards = heldGroupsData;
  const cardsToRender = viewMode === 'held' ? heldCards : activeCards;

  const handleScrollToCard = (index) => {
    const cardId = `card-${index}`;
    const offset = cardLayouts.current[cardId];
    if (cardsToRender[index].isPendingApproval) return;

    if (offset && scrollViewRef.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setHighlightedCardIndex(index);
      scrollViewRef.current.scrollTo({ y: offset - 100, animated: true });
      setExpandedIndex(null);
      setTimeout(() => setHighlightedCardIndex(null), 3000);
    } else {
      const ticketKey = cardsToRender[index].tickets;
      if (cardsToRender[index]?.group_id?._id && ticketKey) {
        handleCardPress(cardsToRender[index].group_id._id, ticketKey);
      }
    }
  };

  const handleCardPress = (groupId, ticket) => {
    navigation.navigate("BottomTab", {
      screen: "EnrollTab",
      params: { screen: "EnrollGroup", params: { userId, groupId, ticket } },
    });
  };

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const calculatePaidPercentage = (group_value, paid_amount) => {
    if (!group_value || !paid_amount) return 0;
    return Math.min(100, Math.round((paid_amount / group_value) * 100));
  };

  const paidDisplay = Totalpaid !== null ? `₹ ${formatNumberIndianStyle(Totalpaid)}` : '₹ 0';
  const profitDisplay = Totalprofit !== null ? `₹ ${formatNumberIndianStyle(Totalprofit)}` : '₹ 0';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.mainWrapper}>
        {loading ? (
          <View style={styles.fullScreenLoader}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          </View>
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>My Groups</Text>
              <View style={styles.titleBadge}>
                <Text style={styles.titleBadgeText}>{activeCards.length}</Text>
              </View>
            </View>

            <View style={styles.fixedSummaryWrapper}>
              <LinearGradient colors={["#0A2647", "#0C53B3"]} style={styles.summaryCardLeft}>
                <FontAwesome5 name="wallet" size={10} color="#fff" />
                <Text style={styles.summaryAmount}>{paidDisplay}</Text>
                <Text style={styles.summaryText}>Total Investment</Text>
              </LinearGradient>

              <LinearGradient colors={["#196F3D", "#27AE60"]} style={styles.summaryCardRight}>
                <FontAwesome5 name="chart-line" size={10} color="#fff" />
                <Text style={styles.summaryAmount}>{profitDisplay}</Text>
                <Text style={styles.summaryText}>Total Dividend</Text>
              </LinearGradient>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollWrapper}
              contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {heldGroupsData.length > 0 && (
                <TouchableOpacity
                  style={[styles.heldGroupsButton, viewMode === 'held' && styles.heldGroupsButtonActive]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setViewMode(viewMode === 'active' ? 'held' : 'active');
                    setExpandedIndex(null);
                  }}
                >
                  <Ionicons name={viewMode === 'active' ? "hourglass-outline" : "list-outline"} size={14} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.heldGroupsButtonText}>
                    {viewMode === 'active' ? 'View Holded Groups' : 'Back to Active Groups'}
                  </Text>
                </TouchableOpacity>
              )}

              {viewMode === 'held' && (
                <View style={styles.convertBoxContainer}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F0F8FF']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.convertBoxInner}
                  >
                    <Animated.Image
                      source={GirlImage}
                      style={[
                        styles.girlImage,
                        {
                          transform: [
                            { translateX: girlWalkX },
                            { translateY: girlWalkY },
                            { rotate: girlWalkRotation.interpolate({
                              inputRange: [-10, 0, 5],
                              outputRange: ['-10deg', '0deg', '5deg']
                            })}
                          ]
                        }
                      ]}
                      resizeMode="contain"
                    />

                    <View style={styles.convertContent}>
                      <View style={styles.convertBadge}>
                        <Ionicons name="sparkles" size={12} color="#D35400" />
                        <Text style={styles.convertBadgeText}>Reactivate Now</Text>
                      </View>

                      <Text style={styles.convertTitle}>Convert Hold to Active</Text>
                      <Text style={styles.convertSubtitle}>
                        Your groups are on hold. Contact our support team to convert them back to active status instantly!
                      </Text>

                      <View style={styles.convertButtonsRow}>
                        <TouchableOpacity
                          style={styles.convertButtonEmail}
                          onPress={() => handleContactPress('email', recipientEmail)}
                        >
                          <MaterialCommunityIcons name="email-outline" size={16} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.convertButtonCall}
                          onPress={() => handleContactPress('phone', phoneNumber)}
                        >
                          <MaterialCommunityIcons name="phone-outline" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {cardsToRender.length === 0 ? (
                <View style={styles.noGroupWrapper}>
                  <Image source={NoGroupImage} style={styles.noGroupImage} />
                  <Text style={styles.noGroupText}>
                    {viewMode === 'held' ? 'No Held Groups Found' : 'No Active Groups'}
                  </Text>
                  {viewMode === 'active' && (
                    <Text style={styles.noGroupSubtitle}>
                      Explore our available groups and start your savings journey today!
                    </Text>
                  )}
                  {viewMode === 'active' && (
                    <TouchableOpacity
                      style={styles.enrollButton}
                      onPress={() => navigation.navigate("Enrollment")}
                    >
                      <Text style={styles.enrollButtonText}>Enrollment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (cardsToRender.map((card, index) => {
                const ticketKey = card.tickets;
                const groupIdFromCard = card.group_id?._id || card.group_id;
                const groupReportKey = `${groupIdFromCard}-${ticketKey}`;
                const isHeldMode = viewMode === 'held';
                const isDeleted = card.deleted;
                const isCompleted = card.completed;
                const isPending = card.isPendingApproval;

                const isPrized = prizedData[groupReportKey];

                const individualPaidAmount = isPending ? 0 : individualGroupReports[groupReportKey]?.totalPaid || 0;
                const paidPercentage = calculatePaidPercentage(card.group_id.group_value, individualPaidAmount);

                const startDate = card.group_id?.start_date ? new Date(card.group_id.start_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                const endDate = card.group_id?.end_date ? new Date(card.group_id.end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

                let gradientColors = isHeldMode ? ["#FADBD8", "#F5B7B1"] : (isDeleted ? ["#F5F5F5", "#E0E0E0"] : (isPending ? ["#FEF9E7", Colors.warningText] : (isCompleted ? ["#E8F6F3", Colors.completedText] : ["#E0F0FF", Colors.secondaryBlue])));

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => isHeldMode ? null : handleCardPress(card.group_id._id, ticketKey)}
                    disabled={isDeleted || isPending || isHeldMode}
                    style={[styles.cardTouchable, index === highlightedCardIndex && styles.highlightedCard]}
                    onLayout={event => { cardLayouts.current[`card-${index}`] = event.nativeEvent.layout.y; }}
                  >
                    <LinearGradient colors={gradientColors} style={styles.cardGradient}>
                      <View style={[styles.cardInner, { backgroundColor: isHeldMode ? "#FFF5F5" : (isDeleted ? "#F0F0F0" : "#fff") }]}>
                        <View style={styles.cardHeader}>
                          <View style={[styles.iconCircle, { backgroundColor: isHeldMode ? "#C0392B" : (isDeleted ? "#BDC3C7" : isPending ? Colors.warningText : isCompleted ? Colors.completedText : Colors.secondaryBlue) }]}>
                            <MaterialCommunityIcons name={isHeldMode ? "pause-circle" : "currency-inr"} size={18} color="#fff" />
                          </View>
                          <View style={{ flex: 1 }}>
                            {isHeldMode ? (
                              <LinearGradient colors={["#E74C3C", "#C0392B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heldGroupBox}>
                                <Ionicons name="alert-circle" size={12} color="#fff" style={{ marginRight: 3 }} />
                                <Text style={styles.heldGroupText}>{card.group_id?.group_name}</Text>
                              </LinearGradient>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={[styles.cardTitle, { color: isDeleted ? Colors.removedText : isPending ? Colors.warningText : isCompleted ? Colors.completedText : Colors.darkText }]}>{card.group_id?.group_name}</Text>

                                {isPrized && (
                                  <View style={[styles.statusBadge, { backgroundColor: Colors.prizedBadgeBg }]}>
                                    <MaterialCommunityIcons name="trophy" size={8} color={Colors.prizedBadgeText} />
                                    <Text style={[styles.statusBadgeText, { color: Colors.prizedBadgeText }]}>PRIZED</Text>
                                  </View>
                                )}
                              </View>
                            )}

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                              <Text style={styles.ticketText}>Ticket: {ticketKey}</Text>
                            </View>

                            {isHeldMode ? (
                              <View style={styles.heldDetailsContainer}>
                                {card.deleted_at && <View style={styles.heldInfoRow}><Text style={styles.heldInfoLabel}>Deleted At:</Text><Text style={styles.heldInfoText}>{new Date(card.deleted_at).toLocaleDateString('en-IN')}</Text></View>}
                                {card.removal_reason && <View style={styles.heldInfoRow}><Text style={styles.heldInfoLabel}>Reason:</Text><Text style={[styles.heldInfoText, { color: Colors.removedText }]}>{card.removal_reason}</Text></View>}
                              </View>
                            ) : (
                              <>
                                {isDeleted && <Text style={styles.removalReason}>Removed: {card.removal_reason}</Text>}
                                {isCompleted && <Text style={styles.completedText}>Completed</Text>}
                                {isPending && <Text style={styles.pendingApprovalText}>Approval Pending</Text>}
                              </>
                            )}
                          </View>
                        </View>

                        {!isHeldMode && (
                          <>
                            <View style={styles.detailsContainer}>
                              <View style={styles.detailBox}>
                                <Text style={styles.detailBoxLabel}>Group Value</Text>
                                <Text style={styles.detailBoxValue}>₹ {formatNumberIndianStyle(card.group_id?.group_value)}</Text>
                              </View>
                              <View style={styles.detailBox}>
                                <Text style={styles.detailBoxLabel}>Group type</Text>
                                <Text style={styles.detailBoxValue}>{card.group_id?.group_type}</Text>
                              </View>
                            </View>
                            <View style={styles.dateRow}>
                              <View style={styles.dateColumn}><Text style={styles.dateLabel}>Start Date</Text><Text style={styles.dateValue}>{startDate}</Text></View>
                              <View style={styles.dateColumn}><Text style={styles.dateLabel}>End Date</Text><Text style={styles.dateValue}>{endDate}</Text></View>
                            </View>

                            <View style={styles.paymentSection}>
                              <View style={styles.progressWrapper}>
                                <Text style={styles.progressText}>Paid Progress</Text>
                                <Text style={styles.progressTextBold}>{paidPercentage}%</Text>
                              </View>
                              <View style={styles.progressBar}><View style={{ width: `${paidPercentage}%`, height: 4, borderRadius: 2, backgroundColor: isPending ? Colors.mediumText : Colors.accentColor }} /></View>
                              <View style={styles.amountRow}>
                                <Text style={styles.amountLabel}>Paid Amount </Text>
                                <Text style={[styles.amountValue, { color: isPending ? Colors.mediumText : Colors.accentColor }]}>₹ {formatNumberIndianStyle(individualPaidAmount)}</Text>
                              </View>
                            </View>

                            {!isPending && (
                              <TouchableOpacity
                                style={styles.paymentsButton}
                                onPress={() => handleCardPress(card.group_id._id, ticketKey)}
                              >
                                <Text style={styles.paymentsButtonText}>View Payments & Details</Text>
                                <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }}><Ionicons name="arrow-forward-circle-outline" size={14} color="#fff" /></Animated.View>
                              </TouchableOpacity>
                            )}
                          </>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
};

const accordionStyles = StyleSheet.create({
  listContainer: { marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.tableBorderColor, overflow: 'hidden', elevation: 2 },
  listTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.primaryBlue, paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.tableBorderColor, backgroundColor: Colors.lightBackground },
  itemWrapper: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  indexText: { fontSize: 11, color: Colors.mediumText, marginRight: 6, fontWeight: '500' },
  badgeBox: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginRight: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  content: { paddingHorizontal: 10, paddingBottom: 10, backgroundColor: '#F9F9F9' },
  contentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  contentLabel: { fontSize: 9, color: Colors.mediumText },
  contentValue: { fontSize: 11, fontWeight: 'bold', color: Colors.darkText },
  pendingApprovalText: { fontSize: 10, color: Colors.warningText, fontWeight: '500', marginTop: 3 },
  navigateButton: { flexDirection: 'row', alignSelf: 'flex-start', marginTop: 6, backgroundColor: Colors.accentColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  navigateButtonText: { color: '#fff', fontSize: 10, fontWeight: '600' }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryBlue },
  mainWrapper: { flex: 1, backgroundColor: Colors.primaryBlue },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8 },
  title: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  titleBadge: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  titleBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  scrollWrapper: { flex: 1, backgroundColor: Colors.lightBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  fixedSummaryWrapper: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCardLeft: {
    width: 150,
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    elevation: 3
  },
  summaryCardRight: {
    width: 150,
    padding: 10,
    borderRadius: 10,
    elevation: 3
  },
  summaryAmount: { color: "#fff", fontSize: 10, fontWeight: "bold", marginTop: 3 },
  summaryText: { color: "rgba(255,255,255,0.8)", fontSize: 8 },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  enrolledGroupsCardContainer: { marginBottom: 15 },
  enrolledGroupsCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15 },
  enrolledGroupsCount: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  enrolledGroupsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  enrolledGroupsIcon: { opacity: 0.8 },
  heldGroupsButton: { flexDirection: 'row', backgroundColor: Colors.secondaryBlue, padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heldGroupsButtonActive: { backgroundColor: "#D35400" },
  heldGroupsButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },

  convertBoxContainer: { marginBottom: 12, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(5, 59, 144, 0.1)' },
  convertBoxInner: { padding: 12, position: 'relative', minHeight: 120 },
  girlImage: { position: 'absolute', bottom: -10, left: -10, width: 100, height: 140, zIndex: 1 },
  convertContent: { marginLeft: 80, zIndex: 2, flex: 1 },
  convertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(211, 84, 0, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 4 },
  convertBadgeText: { color: '#D35400', fontSize: 10, fontWeight: 'bold', marginLeft: 3 },
  convertTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.primaryBlue, marginBottom: 2 },
  convertSubtitle: { fontSize: 11, color: Colors.mediumText, lineHeight: 14, marginBottom: 10 },
  convertButtonsRow: { flexDirection: 'row', alignItems: 'center' },
  convertButtonEmail: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryBlue, paddingVertical: 6, borderRadius: 8, marginRight: 8, shadowColor: Colors.primaryBlue, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
  convertButtonCall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27AE60', paddingVertical: 6, borderRadius: 8, shadowColor: '#27AE60', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
  convertButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 9, marginLeft: 6 },

  // --- COMPACT CARD STYLES ---
  cardTouchable: { marginBottom: 8, borderRadius: 10, elevation: 2, backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  highlightedCard: { borderWidth: 1.5, borderColor: Colors.accentColor, transform: [{ scale: 1.01 }] },
  cardGradient: { borderRadius: 10 },
  cardInner: { borderRadius: 10, padding: 8, overflow: 'hidden' },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 8 },
  cardTitle: { fontSize: 12, fontWeight: "bold", flex: 1 },
  ticketText: { color: Colors.mediumText, fontSize: 10, marginTop: 1 },

  statusBadge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  statusBadgeText: { fontSize: 7, fontWeight: "800" },

  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(5, 59, 144, 0.04)',
    borderRadius: 6,
    padding: 6,
    marginVertical: 6,
  },
  detailBox: {
    alignItems: 'center',
  },
  detailBoxLabel: {
    fontSize: 8,
    color: Colors.mediumText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailBoxValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primaryBlue,
    marginTop: 2,
  },

  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  dateColumn: { alignItems: 'center' },
  dateLabel: { fontSize: 8, color: Colors.mediumText },
  dateValue: { fontSize: 10, fontWeight: "600", color: Colors.darkText, marginTop: 2 },

  paymentSection: {
    marginTop: 4,
    marginBottom: 6,
  },
  progressWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E9ECEF",
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: 9,
    color: Colors.mediumText
  },
  progressTextBold: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.darkText
  },

  amountRow: {
    flexDirection: "row",
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  amountLabel: {
    fontSize: 9,
    color: Colors.mediumText,
    fontWeight: '500'
  },
  amountValue: {
    fontSize: 12,
    fontWeight: "bold"
  },

  paymentsButton: {
    marginTop: 6,
    backgroundColor: Colors.primaryBlue,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    elevation: 2,
    shadowColor: Colors.primaryBlue,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  paymentsButtonText: { color: "#fff", fontWeight: "bold", marginRight: 6, fontSize: 11 },

  // --- NO GROUP & ENROLL STYLES ---
  noGroupWrapper: { alignItems: 'center', marginTop: 10, paddingVertical: 10, paddingHorizontal: 20 },
  noGroupImage: { width: 120, height: 120, marginBottom: 12 },
  noGroupText: { color: Colors.darkText, textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  noGroupSubtitle: {
    color: Colors.mediumText,
    textAlign: 'center',
    fontSize: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    lineHeight: 16,
  },
  enrollButton: {
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  heldGroupBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 2 },
  heldGroupText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  heldDetailsContainer: { marginTop: 4, padding: 6, backgroundColor: 'rgba(231, 76, 60, 0.05)', borderRadius: 4 },
  heldInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  heldInfoLabel: { fontSize: 9, color: Colors.mediumText },
  heldInfoText: { fontSize: 9, fontWeight: '600' },
  removalReason: { color: Colors.removedText, fontSize: 10, fontWeight: 'bold' },
  completedText: { color: Colors.completedText, fontSize: 10, fontWeight: 'bold' },
  pendingApprovalText: { color: Colors.warningText, fontSize: 10, fontWeight: 'bold' }
});

export default Mygroups;