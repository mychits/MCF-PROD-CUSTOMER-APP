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
                    <Text style={accordionStyles.contentValue}>{card.tickets}</Text>
                </View>
                <View style={accordionStyles.contentRow}>
                    <Text style={accordionStyles.contentLabel}>Group Value:</Text>
                    <Text style={accordionStyles.contentValue}>₹ {formatNumberIndianStyle(card.group_id.group_value)}</Text>
                </View>
                <TouchableOpacity 
                    style={accordionStyles.navigateButton}
                    onPress={() => onScrollToCard(index)} // Calls the scroll function
                >
                    <Text style={accordionStyles.navigateButtonText}>View Detailed Card</Text>
                    <Ionicons name="arrow-down" size={16} color="#fff" style={{ marginLeft: 5 }} />
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

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setCardsData([]);
      return;
    }
    try {
      const response = await axios.get(`${url}/enroll/users/${userId}`);
      setCardsData(response.data || []);
      // console.log(response.data, "fdsdgfjdfjhsdgfjsdgf"); // Keep for debugging if needed
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
  // *** KEY CHANGE: Use filteredCards (which includes deleted) for rendering to see all dates ***
  const cardsToRender = filteredCards; 
  // Keep activeCards only for the active count/specific logic
  const activeCards = filteredCards.filter(c => !c.deleted); 

  const handleScrollToCard = (index) => {
    const cardId = `card-${index}`;
    const offset = cardLayouts.current[cardId];

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
        // Use cardsToRender for the correct index mapping
        if (cardsToRender[index]?.group_id?._id) {
            handleCardPress(cardsToRender[index].group_id._id, cardsToRender[index].tickets);
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

  // Check against 0 when calculating display profit to avoid showing '0' if total paid is null/loading
  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit; 

  const calculatePaidPercentage = (group_value, paid_amount) => {
    if (!group_value || !paid_amount) return 0;
    return Math.min(100, Math.round((paid_amount / group_value) * 100));
  };
  
  // Only display the currency prefix/number if the value is not null (i.e., loaded)
  const paidDisplay = Totalpaid !== null ? `₹ ${formatNumberIndianStyle(Totalpaid)}` : '';
  const profitDisplay = Totalprofit !== null ? `₹ ${formatNumberIndianStyle(displayTotalProfit)}` : '';
  

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
                    {/* Shows count of ACTIVE groups */}
                    <Text style={styles.enrolledGroupsCount}>{activeCards.length}</Text>
                    <Text style={styles.enrolledGroupsLabel}>Active Groups</Text>
                  </View>
                  <Ionicons name="people" size={32} color="#fff" style={styles.enrolledGroupsIcon} />
                </LinearGradient>
              </View>
              
              {/* --- Accordion List Component (Uses cardsToRender) --- */}
              {cardsToRender.length > 0 && (
                <View style={accordionStyles.listContainer}>
                    {/* Title updated to reflect all enrollments are shown for indexing */}
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
                <View style={styles.noGroupWrapper}>
                  <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
                  <Text style={styles.noGroupText}>No groups found for this user.</Text>
                </View>
              ) : (cardsToRender.map((card, index) => { 
                  const groupIdFromCard = card.group_id?._id || card.group_id;
                  const groupReportKey = `${groupIdFromCard}-${card.tickets}`;
                  const individualPaidAmount = individualGroupReports[groupReportKey]?.totalPaid || 0;
                  const paidPercentage = calculatePaidPercentage(card.group_id.group_value, individualPaidAmount);
                  const isDeleted = card.deleted; 
                  const isCompleted = card.completed;

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
                            <View style={[styles.iconCircle, { backgroundColor: isDeleted ? "#BDC3C7" : isCompleted ? Colors.completedText : Colors.secondaryBlue }]}>
                              <MaterialCommunityIcons name="currency-inr" size={28} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.cardTitle, { color: isDeleted ? Colors.removedText : isCompleted ? Colors.completedText : Colors.darkText }]}>
                                {card.group_id.group_name}
                              </Text>
                              <Text style={styles.ticketText}>Ticket: {card.tickets}</Text>
                              {isDeleted && <Text style={styles.removalReason}>Removed: {card.removal_reason?.toUpperCase() !== "OTHERS" ? card.removal_reason : "Unknown"}</Text>}
                              {isCompleted && <Text style={styles.completedText}>Completed</Text>}
                            </View>
                          </View>

                          {/* --- Start and End Dates Block (Now includes the desired dates) --- */}
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
                              <View style={{ width: `${paidPercentage}%`, height: 8, borderRadius: 10, backgroundColor: Colors.accentColor }} />
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
                          
                          {/* --- Animated Payments Button with intensified animation --- */}
                          <View style={styles.paymentsButton}>
                              <Text style={styles.paymentsButtonText}>View Payments & Details</Text>
                              <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: slideAnim }] }}>
                                <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                              </Animated.View>
                          </View>
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
    navigateButton: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        marginTop: 10,
        backgroundColor: Colors.accentColor,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
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
  
  // --- NEW: Style for full screen loader ---
  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ------------------------------------------

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
  summaryAmount: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 5 },
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
    fontSize: 14,
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

  noGroupWrapper: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  noGroupImage: { width: 180, height: 180, marginBottom: 20 },
  noGroupText: { fontSize: 20, fontWeight: "bold", color: Colors.darkText, textAlign: "center" },
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

  // --- Styles for Date Display ---
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
  // --------------------------------------
});

export default Mygroups;