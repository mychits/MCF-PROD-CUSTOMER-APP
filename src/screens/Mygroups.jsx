import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import Header from "../components/layouts/Header";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const Colors = {
  primaryBlue: "#053B90",
  secondaryBlue: "#0C53B3",
  lightBackground: "#F5F8FA",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  accentColor: "#3498DB",
  removedText: "#E74C3C",
  completedText: "#27AE60",
  tableHeaderBlue: "#042D75",
  tableBorderColor: "#E0E0E0",
  warningText: "#F39C12",
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
  const formattedOther = otherNumbers
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ","
    : "";
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
                        size={20} 
                        color={Colors.warningText} 
                        style={{ marginLeft: 10 }} 
                    />
                )}
            </View>
            <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
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
                    {!card.isPendingApproval && <Ionicons name="arrow-down" size={16} color="#fff" style={{ marginLeft: 5 }} />}
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

  const scrollViewRef = useRef(null);
  const cardLayouts = useRef({});

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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
            await Promise.all([fetchTickets(), fetchAllOverview(), fetchHeldGroups()]);
        }
        setLoading(false);
      };
      loadData();
    }, [userId, fetchTickets, fetchAllOverview, fetchHeldGroups])
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

  const topCardCount = viewMode === 'held' ? heldCards.length : activeCards.length;
  const topCardLabel = viewMode === 'held' ? "Holded Groups " : "Active Groups";
  const topCardGradient = viewMode === 'held' ? ["#D35400", "#E67E22"] : ["#6A1B9A", "#883EBF"]; 
  const topCardIcon = viewMode === 'held' ? "pause-circle-outline" : "people";

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
            <Text style={styles.title}>My Groups</Text>

            <View style={styles.fixedSummaryWrapper}>
              <LinearGradient colors={["#0A2647", "#0C53B3"]} style={styles.summaryCardLeft}>
                <FontAwesome5 name="wallet" size={20} color="#fff" />
                <Text style={styles.summaryAmount}>{paidDisplay}</Text>
                <Text style={styles.summaryText}>Total Investment</Text>
              </LinearGradient>

              <LinearGradient colors={["#196F3D", "#27AE60"]} style={styles.summaryCardRight}>
                <FontAwesome5 name="chart-line" size={20} color="#fff" />
                <Text style={styles.summaryAmount}>{profitDisplay}</Text>
                <Text style={styles.summaryText}>Total Dividend</Text>
              </LinearGradient>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollWrapper}
              contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.enrolledGroupsCardContainer}>
                <LinearGradient colors={topCardGradient} style={styles.enrolledGroupsCard}>
                  <View>
                    <Text style={styles.enrolledGroupsCount}>{topCardCount}</Text>
                    <Text style={styles.enrolledGroupsLabel}>{topCardLabel}</Text>
                  </View>
                  <Ionicons name={topCardIcon} size={32} color="#fff" style={styles.enrolledGroupsIcon} />
                </LinearGradient>
              </View>

              <TouchableOpacity
                style={[styles.heldGroupsButton, viewMode === 'held' && styles.heldGroupsButtonActive]}
                onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setViewMode(viewMode === 'active' ? 'held' : 'active');
                    setExpandedIndex(null);
                }}
              >
                <Ionicons name={viewMode === 'active' ? "hourglass-outline" : "list-outline"} size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.heldGroupsButtonText}>
                    {viewMode === 'active' ? 'View Holded Groups' : 'Back to Active Groups'}
                </Text>
              </TouchableOpacity>

              {viewMode === 'active' && cardsToRender.length > 0 && (
                <View style={accordionStyles.listContainer}>
                    <Text style={accordionStyles.listTitle}>Active Enrollments Index</Text>
                    {cardsToRender.map((card, index) => (
                        <AccordionListItem
                            key={index}
                            card={card}
                            index={index}
                            isExpanded={expandedIndex === index}
                            onToggle={toggleAccordion}
                            onScrollToCard={handleScrollToCard}
                        />
                    ))}
                </View>
              )}

              {cardsToRender.length === 0 ? (
                <View style={styles.noGroupWrapper}>
                  <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
                  <Text style={styles.noGroupText}>
                    {viewMode === 'held' ? "No holded groups found." : "No active groups found."}
                  </Text>
                </View>
              ) : (cardsToRender.map((card, index) => {
                  const ticketKey = card.tickets; 
                  const groupIdFromCard = card.group_id?._id || card.group_id;
                  const groupReportKey = `${groupIdFromCard}-${ticketKey}`;
                  const isHeldMode = viewMode === 'held';
                  const isDeleted = card.deleted;
                  const isCompleted = card.completed;
                  const isPending = card.isPendingApproval; 

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
                              <MaterialCommunityIcons name={isHeldMode ? "pause-circle" : "currency-inr"} size={28} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                              {isHeldMode ? (
                                  <LinearGradient colors={["#E74C3C", "#C0392B"]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.heldGroupBox}>
                                      <Ionicons name="alert-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                                      <Text style={styles.heldGroupText}>{card.group_id?.group_name}</Text>
                                  </LinearGradient>
                              ) : (
                                  <Text style={[styles.cardTitle, { color: isDeleted ? Colors.removedText : isPending ? Colors.warningText : isCompleted ? Colors.completedText : Colors.darkText }]}>{card.group_id?.group_name}</Text>
                              )}
                              <Text style={styles.ticketText}>Ticket: {ticketKey}</Text>
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
                                <View style={styles.dateRow}>
                                    <View style={styles.dateColumn}><Text style={styles.dateLabel}>Start Date</Text><Text style={styles.dateValue}>{startDate}</Text></View>
                                    <View style={styles.dateColumn}><Text style={styles.dateLabel}>End Date</Text><Text style={styles.dateValue}>{endDate}</Text></View>
                                </View>
                                <View style={styles.progressHeader}><Text style={styles.progressText}>Paid</Text><Text style={styles.progressTextBold}>{paidPercentage}%</Text></View>
                                <View style={styles.progressBar}><View style={{ width: `${paidPercentage}%`, height: 8, borderRadius: 10, backgroundColor: isPending ? Colors.mediumText : Colors.accentColor }} /></View>
                                <View style={styles.amountRow}><View style={[styles.amountColumn, { alignItems: 'flex-start', flex: 1, paddingLeft: 10 }]}><Text style={styles.amountLabel}>Paid Amount</Text><Text style={[styles.amountValue, { color: isPending ? Colors.mediumText : Colors.accentColor }]}>₹ {formatNumberIndianStyle(individualPaidAmount)}</Text></View></View>
                                {!isPending && (
                                  <View style={styles.paymentsButton}>
                                      <Text style={styles.paymentsButtonText}>View Payments & Details</Text>
                                      <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }}><Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" /></Animated.View>
                                  </View>
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
    listContainer: { marginBottom: 20, backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: Colors.tableBorderColor, overflow: 'hidden', elevation: 3 },
    listTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.primaryBlue, paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.tableBorderColor, backgroundColor: Colors.lightBackground },
    itemWrapper: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    indexText: { fontSize: 14, color: Colors.mediumText, marginRight: 10, fontWeight: '500' },
    badgeBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
    badgeText: { color: '#fff', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
    content: { paddingHorizontal: 15, paddingBottom: 15, backgroundColor: '#F9F9F9' },
    contentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    contentLabel: { fontSize: 13, color: Colors.mediumText },
    contentValue: { fontSize: 14, fontWeight: 'bold', color: Colors.darkText },
    pendingApprovalText: { fontSize: 12, color: Colors.warningText, fontWeight: '500', marginTop: 5 },
    navigateButton: { flexDirection: 'row', alignSelf: 'flex-start', marginTop: 10, backgroundColor: Colors.accentColor, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center' },
    navigateButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryBlue },
  mainWrapper: { flex: 1, backgroundColor: Colors.primaryBlue },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", paddingHorizontal: 20, paddingVertical: 10 },
  scrollWrapper: { flex: 1, backgroundColor: Colors.lightBackground, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  fixedSummaryWrapper: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 20, justifyContent: "space-between" },
  summaryCardLeft: { flex: 1, padding: 15, borderRadius: 15, marginRight: 10, elevation: 4 },
  summaryCardRight: { flex: 1, padding: 15, borderRadius: 15, elevation: 4 },
  summaryAmount: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 5 },
  summaryText: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  enrolledGroupsCardContainer: { marginBottom: 20 },
  enrolledGroupsCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 20 },
  enrolledGroupsCount: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  enrolledGroupsLabel: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  heldGroupsButton: { flexDirection: 'row', backgroundColor: Colors.secondaryBlue, padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heldGroupsButtonActive: { backgroundColor: "#D35400" },
  heldGroupsButtonText: { color: '#fff', fontWeight: 'bold' },
  cardTouchable: { marginBottom: 20, borderRadius: 20, elevation: 4, backgroundColor: "#fff" },
  highlightedCard: { borderWidth: 2, borderColor: Colors.accentColor, transform: [{ scale: 1.02 }] },
  cardGradient: { borderRadius: 20, padding: 2 },
  cardInner: { borderRadius: 18, padding: 15 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 15 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  ticketText: { color: Colors.mediumText, fontSize: 14 },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  dateColumn: { flex: 1 },
  dateLabel: { fontSize: 12, color: Colors.mediumText },
  dateValue: { fontSize: 14, fontWeight: "600", color: Colors.darkText },
  progressBar: { height: 8, backgroundColor: "#E0E0E0", borderRadius: 10, marginVertical: 10 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontSize: 12, color: Colors.mediumText },
  progressTextBold: { fontSize: 12, fontWeight: "bold", color: Colors.darkText },
  amountRow: { flexDirection: "row", justifyContent: "space-between" },
  amountLabel: { fontSize: 12, color: Colors.mediumText },
  amountValue: { fontSize: 15, fontWeight: "bold" },
  paymentsButton: { marginTop: 15, backgroundColor: Colors.primaryBlue, flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 12, borderRadius: 12 },
  paymentsButtonText: { color: "#fff", fontWeight: "bold", marginRight: 8 },
  noGroupWrapper: { alignItems: 'center', marginTop: 50 },
  noGroupImage: { width: 200, height: 200 },
  noGroupText: { marginTop: 20, color: Colors.mediumText, textAlign: 'center' },
  heldGroupBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4 },
  heldGroupText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  heldDetailsContainer: { marginTop: 8, padding: 10, backgroundColor: 'rgba(231, 76, 60, 0.05)', borderRadius: 8 },
  heldInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  heldInfoLabel: { fontSize: 12, color: Colors.mediumText },
  heldInfoText: { fontSize: 12, fontWeight: '600' },
  removalReason: { color: Colors.removedText, fontSize: 12, fontWeight: 'bold' }
});

export default Mygroups;