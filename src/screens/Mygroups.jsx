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
  // ADDED: Warning color for pending status
  warningText: "#F39C12", 
};

// --- MODIFIED FUNCTION: formatNumberIndianStyle ---
const formatNumberIndianStyle = (num) => {
  if (num === null || num === undefined) return "0";

  // Convert to number, fix to 2 decimal places, and get as a string
  const formattedNum = parseFloat(num).toFixed(2);

  const parts = formattedNum.toString().split(".");
  let integerPart = parts[0];
  // The decimal part will now reliably be the two fixed digits
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
// --------------------------------------------------

// --- AccordionListItem Component ---
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
                <Text style={accordionStyles.groupNameText} numberOfLines={1}>{card.group_id?.group_name}</Text>
                {/* Visual cue for pending approval in the index list */}
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
                {/* --- Date Display in Accordion --- */}
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
                {/* --- Existing Rows --- */}
                <View style={accordionStyles.contentRow}>
                    <Text style={accordionStyles.contentLabel}>Ticket Number:</Text>
                    {/* MODIFIED: Use the harmonized 'tickets' key */}
                    <Text style={accordionStyles.contentValue}>{card.tickets}</Text>
                </View>
                <View style={accordionStyles.contentRow}>
                    <Text style={accordionStyles.contentLabel}>Group Value:</Text>
                    <Text style={accordionStyles.contentValue}>₹ {formatNumberIndianStyle(card.group_id.group_value)}</Text>
                </View>
                {/* Pending text in accordion */}
                {card.isPendingApproval && (
                    <Text style={accordionStyles.pendingApprovalText}>
                        Pending Approval by MyChits team.
                    </Text>
                )}
                
                <TouchableOpacity
                    style={[accordionStyles.navigateButton, card.isPendingApproval && { backgroundColor: Colors.mediumText }]}
                    onPress={() => onScrollToCard(index)} // Calls the scroll function
                    // DISABLED if pending approval
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
// ---------------------------------------------------------------------

const Mygroups = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize to null to hide values until loaded
  const [Totalpaid, setTotalPaid] = useState(null);
  const [Totalprofit, setTotalProfit] = useState(null);

  const [individualGroupReports, setIndividualGroupReports] = useState({});
  const [enrolledGroupsCount, setEnrolledGroupsCount] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(null);

  const scrollViewRef = useRef(null);
  const cardLayouts = useRef({});

  // --- Animation Refs and Logic (Intensified) ---
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAndSlide = () => {
      Animated.loop(
        Animated.parallel([
          // Scale animation: Pulses from 1 to 1.3
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Slide animation: Slides 5 units to the right
          Animated.sequence([
            Animated.timing(slideAnim, {
              toValue: 5,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    pulseAndSlide();
  }, [scaleAnim, slideAnim]);
  // ------------------------------------

  // MODIFIED: Function to fetch and process both enrollment types
  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setCardsData([]);
      return;
    }
    try {
      // Use the mobile endpoint which returns both pending and approved groups
      const response = await axios.get(`${url}/enroll/mobile-enrolls/users/${userId}`);
      
      const responseData = response.data.data || [];
      let allCards = [];

      responseData.forEach(groupBlock => {
        // Collect mobileAppEnrolls (Pending Approval)
        if (groupBlock.mobileAppEnrolls && groupBlock.mobileAppEnrolls.length > 0) {
            const mobileCards = groupBlock.mobileAppEnrolls.map(card => ({
                ...card,
                // Harmonize ticket key for consistency in Accordion and Card (enrollments uses 'tickets', mobile uses 'no_of_tickets')
                tickets: card.no_of_tickets, 
                isPendingApproval: true, 
            }));
            allCards.push(...mobileCards);
        }
        // Collect regular enrollments (Approved/Active)
        if (groupBlock.enrollments && groupBlock.enrollments.length > 0) {
            const approvedCards = groupBlock.enrollments.map(card => ({
                ...card,
                // Ensure approved cards have isPendingApproval: false
                isPendingApproval: false,
            }));
            allCards.push(...approvedCards);
        }
      });

      setCardsData(allCards);

    } catch (error) {
      console.error("Error fetching tickets:", error);
      setCardsData([]);
    }
  }, [userId]);


  const fetchAllOverview = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axios.post(`${url}/enroll/get-user-tickets-report/${userId}`);
      const data = response.data;
      setEnrolledGroupsCount(data.length);

      // Set values after successful fetch
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
      if (error.response?.status === 404) {
        setTotalPaid(0);
        setTotalProfit(0);
        setIndividualGroupReports({});
        setEnrolledGroupsCount(0);
      } else {
        console.error(error);
      }
    }
  }, [userId]);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        if (userId) {
          await Promise.all([fetchTickets(), fetchAllOverview()]);
        } else {
          setCardsData([]);
          setEnrolledGroupsCount(0);
          setTotalPaid(null);
          setTotalProfit(null);
        }
        setLoading(false);
    };

    loadData();
  }, [userId, fetchTickets, fetchAllOverview]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        if (userId) {
            await Promise.all([fetchTickets(), fetchAllOverview()]);
        } else {
            setCardsData([]);
            setEnrolledGroupsCount(0);
            setTotalPaid(null);
            setTotalProfit(null);
        }
        setLoading(false);
      };

    loadData();
    }, [userId, fetchTickets, fetchAllOverview])
  );

  const filteredCards = cardsData.filter((card) => card.group_id !== null);
  // MODIFIED: Filter for cards that are NOT deleted AND are NOT pending approval.
  const activeCards = filteredCards.filter(c => !c.deleted && !c.isPendingApproval);
  // cardsToRender includes all non-deleted cards (pending or approved)
  const cardsToRender = filteredCards.filter(c => !c.deleted); 

  const handleScrollToCard = (index) => {
    const cardId = `card-${index}`;
    const offset = cardLayouts.current[cardId];
    
    // Check if card is pending, if so, do not allow navigation
    if (cardsToRender[index].isPendingApproval) return; 

    if (offset && scrollViewRef.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        setHighlightedCardIndex(index);

        scrollViewRef.current.scrollTo({
            y: offset - 100,
            animated: true
        });
        setExpandedIndex(null);

        setTimeout(() => {
            setHighlightedCardIndex(null);
        }, 3000);

    } else {
        // MODIFIED: Use the harmonized 'tickets' key
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

  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit;

  const calculatePaidPercentage = (group_value, paid_amount) => {
    if (!group_value || !paid_amount) return 0;
    return Math.min(100, Math.round((paid_amount / group_value) * 100));
  };

  const paidDisplay = Totalpaid !== null ? `₹ ${formatNumberIndianStyle(Totalpaid)}` : '';
  const profitDisplay = Totalprofit !== null ? `₹ ${formatNumberIndianStyle(displayTotalProfit)}` : '';

  // *** MODIFIED: Enroll Navigation Handler ***
  const handleEnrollNow = () => {
    // This navigation directs to the Enrollment screen via the BottomTab Navigator
    navigation.navigate("BottomTab", { screen: "Enrollment" });
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      {/* Header is always shown */}
      <Header userId={userId} navigation={navigation} />

      <View style={styles.mainWrapper}>
        {/* Conditional rendering for loading state */}
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
                <Text style={styles.summaryText}>Total Dividend / Profit</Text>
              </LinearGradient>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollWrapper}
              contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.enrolledGroupsCardContainer}>
                <LinearGradient colors={["#6A1B9A", "#883EBF"]} style={styles.enrolledGroupsCard}>
                  <View>
                    {/* Shows count of ACTIVE groups (excluding pending) */}
                    <Text style={styles.enrolledGroupsCount}>{activeCards.length}</Text>
                    <Text style={styles.enrolledGroupsLabel}>Active Groups</Text>
                  </View>
                  <Ionicons name="people" size={32} color="#fff" style={styles.enrolledGroupsIcon} />
                </LinearGradient>
              </View>

              {/* --- Accordion List Component (Now uses all non-deleted cards) --- */}
              {cardsToRender.length > 0 && (
                <View style={accordionStyles.listContainer}>
                    <Text style={accordionStyles.listTitle}>All Enrollments Index</Text>
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
              {/* ---------------------------------------------------- */}

              {cardsToRender.length === 0 ? (
                // *** STYLE ADJUSTED HERE: marginTop: 30 ***
                <View style={styles.noGroupWrapper}>
                  <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
                  <Text style={styles.noGroupText}>No active groups found for this user.</Text>

                  {/* ******************************* */}
                </View>
              ) : (cardsToRender.map((card, index) => {
                  // MODIFIED: Use the harmonized 'tickets' key
                  const ticketKey = card.tickets; 

                  const groupIdFromCard = card.group_id?._id || card.group_id;
                  const groupReportKey = `${groupIdFromCard}-${ticketKey}`;
                  
                  const isDeleted = card.deleted;
                  const isCompleted = card.completed;
                  // NEW: Pending check
                  const isPending = card.isPendingApproval; 

                  // MODIFIED: Paid amount is 0 if pending
                  const individualPaidAmount = isPending ? 0 : individualGroupReports[groupReportKey]?.totalPaid || 0;
                  const paidPercentage = calculatePaidPercentage(card.group_id.group_value, individualPaidAmount);


                  // --- Date Formatting for Main Card ---
                  const startDate = card.group_id?.start_date
                    ? new Date(card.group_id?.start_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';
                  const endDate = card.group_id?.end_date
                    ? new Date(card.group_id.end_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';
                  // ------------------------------------------

                  let gradientColors;
                  if (isDeleted) {
                    gradientColors = ["#F5F5F5", "#E0E0E0"];
                  } else if (isPending) {
                    // NEW: Unique color for pending approval
                    gradientColors = ["#FEF9E7", Colors.warningText]; 
                  } else if (isCompleted) {
                    gradientColors = ["#E8F6F3", Colors.completedText];
                  } else {
                    gradientColors = ["#E0F0FF", Colors.secondaryBlue];
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleCardPress(card.group_id._id, ticketKey)}
                      // MODIFIED: Disable if deleted OR pending
                      disabled={isDeleted || isPending} 
                      style={[
                        styles.cardTouchable,
                        index === highlightedCardIndex && styles.highlightedCard
                      ]}
                      onLayout={event => {
                        const { y } = event.nativeEvent.layout;
                        // Store the y position of the card relative to the ScrollView content
                        cardLayouts.current[`card-${index}`] = y;
                      }}
                    >
                      <LinearGradient colors={gradientColors} style={styles.cardGradient}>
                        <View style={[styles.cardInner, { backgroundColor: isDeleted ? "#F0F0F0" : "#fff" }]}>
                          <View style={styles.cardHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: isDeleted ? "#BDC3C7" : isPending ? Colors.warningText : isCompleted ? Colors.completedText : Colors.secondaryBlue }]}>
                              <MaterialCommunityIcons name="currency-inr" size={28} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.cardTitle, { color: isDeleted ? Colors.removedText : isPending ? Colors.warningText : isCompleted ? Colors.completedText : Colors.darkText }]}>
                                {card.group_id.group_name}
                              </Text>
                              {/* MODIFIED: Use ticketKey */}
                              <Text style={styles.ticketText}>Ticket: {ticketKey}</Text> 
                              {isDeleted && <Text style={styles.removalReason}>Removed: {card.removal_reason?.toUpperCase() !== "OTHERS" ? card.removal_reason : "Unknown"}</Text>}
                              {isCompleted && <Text style={styles.completedText}>Completed</Text>}
                              {/* NEW: Pending Approval Text */}
                              {isPending && (
                                <Text style={styles.pendingApprovalText}>
                                   Approval Pending
                                </Text>
                              )}
                              {/* ---------------------------------- */}
                            </View>
                          </View>

                          {/* --- Start and End Dates Block --- */}
                          <View style={styles.dateRow}>
                              <View style={styles.dateColumn}>
                                  <Text style={styles.dateLabel}>Start Date</Text>
                                  <Text style={styles.dateValue}>{startDate}</Text>
                              </View>
                              <View style={styles.dateColumn}>
                                  <Text style={styles.dateLabel}>End Date</Text>
                                  <Text style={styles.dateValue}>{endDate}</Text>
                              </View>
                          </View>
                          {/* -------------------------------------- */}

                          <View>
                            <View style={styles.progressHeader}>
                              <Text style={styles.progressText}>Paid</Text>
                              <Text style={styles.progressTextBold}>{paidPercentage}%</Text>
                            </View>
                            <View style={styles.progressBar}>
                              {/* MODIFIED: Change progress bar color if pending */}
                              <View style={{ width: `${paidPercentage}%`, height: 8, borderRadius: 10, backgroundColor: isPending ? Colors.mediumText : Colors.accentColor }} /> 
                            </View>
                            <View style={styles.amountRow}>
                              <View style={styles.amountColumn}>
                                <Text style={styles.amountLabel}>Total Value</Text>
                                <Text style={styles.amountValue}>₹ {formatNumberIndianStyle(card.group_id.group_value)}</Text>
                              </View>
                              <View style={styles.amountColumn}>
                                <Text style={styles.amountLabel}>Paid</Text>
                                {/* MODIFIED: Change paid amount color if pending */}
                                <Text style={[styles.amountValue, { color: isPending ? Colors.mediumText : Colors.accentColor }]}>₹ {formatNumberIndianStyle(individualPaidAmount)}</Text>
                              </View>
                            </View>
                          </View>

                          {/* --- Animated Payments Button --- */}
                          {/* MODIFIED: Conditionally render the button (remove if pending) */}
                          {!isPending && (
                            <View style={styles.paymentsButton}>
                                <Text style={styles.paymentsButtonText}>View Payments & Details</Text>
                                <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }}>
                                  <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                                </Animated.View>
                            </View>
                          )}
                          {/* ----------------------------------------- */}

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

// --- Styles for the Accordion List (Unchanged) ---
const accordionStyles = StyleSheet.create({
    listContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: Colors.tableBorderColor,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2.84,
        elevation: 3,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primaryBlue,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.tableBorderColor,
        backgroundColor: Colors.lightBackground,
    },
    itemWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#fff',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    indexText: {
        fontSize: 14,
        color: Colors.mediumText,
        marginRight: 10,
        fontWeight: '500',
    },
    groupNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.darkText,
        flexShrink: 1,
    },
    content: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        backgroundColor: '#F9F9F9',
    },
    contentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 2,
    },
    contentLabel: {
        fontSize: 13,
        color: Colors.mediumText,
    },
    contentValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.darkText,
    },
    // NEW: Style for pending approval text in Accordion
    pendingApprovalText: {
        fontSize: 12,
        color: Colors.warningText,
        fontWeight: '500',
        marginTop: 5,
    },
    navigateButton: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        marginTop: 10,
        backgroundColor: Colors.accentColor,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
    },
    navigateButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    }
});
// ------------------------------------


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryBlue },
  mainWrapper: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    margin: 10,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom:50,
  },

  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 10,
    color: Colors.darkText,
  },

  fixedSummaryWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 1,
    alignItems: 'stretch',
  },

  summaryCardLeft: {
    flex: 1,
    marginRight: 5,
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  summaryCardRight: {
    flex: 1,
    marginLeft: 5,
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  summaryAmount: { color: "#fff", fontSize: 15, fontWeight: "bold", marginTop: 5 },
  summaryText: { color: "#fff", fontSize: 11, textAlign: "center", marginTop: 3 },
  scrollWrapper: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  enrolledGroupsCardContainer: {
    marginBottom: 15,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  enrolledGroupsCard: {
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  enrolledGroupsCount: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  enrolledGroupsLabel: {
    color: "#E0E0E0",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  enrolledGroupsIcon: {
    fontSize: 32,
  },

  highlightedCard: {
    borderWidth: 3,
    borderColor: Colors.accentColor, // Bold border to highlight
    borderRadius: 22,
    shadowColor: Colors.accentColor, // Add shadow for extra pop
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
  },

  paymentsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primaryBlue,
  },
  paymentsButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
      marginRight: 8,
  },

  // *** MODIFIED: marginTop reduced from 50 to 30 to move content up ***
  noGroupWrapper: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, marginTop: -20 },
  
  noGroupImage: { width: 180, height: 180, marginBottom: -10 },
  noGroupText: { fontSize: 16, fontWeight: "bold", color: Colors.darkText, textAlign: "center", marginBottom: 20 },
  
  enrollNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.completedText, // Green for a positive action
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  enrollNowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  
  cardTouchable: { marginVertical: 8 },
  cardGradient: { borderRadius: 20, padding: 2 },
  cardInner: {
    borderRadius: 18,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 15 },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  ticketText: { fontSize: 14, color: Colors.mediumText },
  removalReason: { fontSize: 12, color: Colors.removedText, marginTop: 2 },
  completedText: { fontSize: 12, color: Colors.completedText, fontWeight: "bold", marginTop: 2 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressText: { fontSize: 14, color: Colors.mediumText },
  progressTextBold: { fontSize: 14, fontWeight: "bold" },
  progressBar: { height: 8, backgroundColor: "#E0E0E0", borderRadius: 10, marginBottom: 10 },
  amountRow: { flexDirection: "row", justifyContent: "space-between" },
  amountColumn: { alignItems: "center" },
  amountLabel: { fontSize: 12, color: Colors.mediumText },
  amountValue: { fontSize: 16, fontWeight: "bold" },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.lightBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.tableBorderColor,
  },
  dateColumn: {
    alignItems: "center",
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.mediumText,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.darkText,
  },
  // NEW: Style for pending approval text in the main card
  pendingApprovalText: {
    fontSize: 12,
    color: Colors.warningText,
    fontWeight: '600',
    marginTop: 5,
    fontStyle: 'italic',
  }
});

export default Mygroups;