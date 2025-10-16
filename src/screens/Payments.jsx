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

// REMOVED WARNING BLOCK: setLayoutAnimationEnabledExperimental is a no-op in New Architecture.
// if (Platform.OS === 'android') {
//   if (UIManager.setLayoutAnimationEnabledExperimental) {
//     UIManager.setLayoutAnimationEnabledExperimental(true);
//   }
// }


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

// --- AccordionListItem Component REMOVED ---
// ---------------------------------------------------------------------

const Payments = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize to null to hide values until loaded
  const [Totalpaid, setTotalPaid] = useState(null); 
  const [Totalprofit, setTotalProfit] = useState(null); 
  
  const [individualGroupReports, setIndividualGroupReports] = useState({});
  // const [enrolledGroupsCount, setEnrolledGroupsCount] = useState(0); // REMOVED
  // const [expandedIndex, setExpandedIndex] = useState(null); // REMOVED
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(null);
  
    const scrollViewRef = useRef(null); 
    const cardLayouts = useRef({});
  
    // --- Animation Refs and Logic (Intensified) for Payments Button ---
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // --- NEW: Animation Refs for Auction/Insurance Buttons (Scale down on press) ---
    const auctionScaleAnim = useRef(new Animated.Value(1)).current;
    // const insuranceScaleAnim = useRef(new Animated.Value(1)).current; // REMOVED: insuranceScaleAnim

    const handleAuctionPressIn = () => {
      Animated.timing(auctionScaleAnim, {
        toValue: 0.95, // Scale down slightly on press in
        duration: 100,
        useNativeDriver: true,
      }).start();
    };

    const handleAuctionPressOut = () => {
      Animated.timing(auctionScaleAnim, {
        toValue: 1, // Scale back up on press out
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Add navigation logic here if you want to navigate on press out
        // navigation.navigate("AuctionScreen"); // Example
      });
    };

    // REMOVED: handleInsurancePressIn and handleInsurancePressOut
  
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


  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setCardsData([]);
      return;
    }
    try {
      const response = await axios.get(`${url}/enroll/users/${userId}`);
      setCardsData(response.data || []);
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
      // setEnrolledGroupsCount(data.length); // REMOVED
      
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
        // setEnrolledGroupsCount(0); // REMOVED
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
            // setEnrolledGroupsCount(0); // REMOVED
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
            // setEnrolledGroupsCount(0); // REMOVED
            setTotalPaid(null);
            setTotalProfit(null);
        }
        setLoading(false);
    };

    loadData();
    }, [userId, fetchTickets, fetchAllOverview])
  );

  const filteredCards = cardsData.filter((card) => card.group_id !== null);
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
        // setExpandedIndex(null); // REMOVED

        setTimeout(() => {
            setHighlightedCardIndex(null);
        }, 3000); 

    } else {
        if (activeCards[index]?.group_id?._id) {
            handleCardPress(activeCards[index].group_id._id, activeCards[index].tickets);
        }
    }
  };

  const handleCardPress = (groupId, ticket) => {
    // New Tap Animation Logic: Scale up and slide right, then quickly return to normal.
    Animated.sequence([
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
        ]),
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]),
    ]).start(() => {
        // Navigation runs only after the animation completes
        navigation.navigate("BottomTab", {
            screen: "EnrollTab",
            params: { screen: "EnrollGroup", params: { userId, groupId, ticket } },
        });
    });
  };
  
  // const toggleAccordion = (index) => { // REMOVED
  //   setExpandedIndex(expandedIndex === index ? null : index);
  // };

  // Check against 0 when calculating display profit to avoid showing '0' if total paid is null/loading
  const displayTotalProfit = Totalpaid === 0 ? 0 : Totalprofit; 

  const calculatePaidPercentage = (group_value, paid_amount) => {
    if (!group_value || !paid_amount) return 0;
    return Math.min(100, Math.round((paid_amount / group_value) * 100));
  };
  
  // Only display the currency prefix/number if the value is not null (i.e., loaded)
  const paidDisplay = Totalpaid !== null ? `₹ ${formatNumberIndianStyle(Totalpaid)}` : '';
  const profitDisplay = Totalprofit !== null ? `₹ ${formatNumberIndianStyle(displayTotalProfit)}` : '';
  
  // Animation styles for the new buttons
  const auctionAnimatedStyle = {
    transform: [{ scale: auctionScaleAnim }],
  };

  // REMOVED: insuranceAnimatedStyle
  

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
            <Text style={styles.title}>My Groups payments</Text>

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

            {/* New Buttons for Navigation (now placed after summary cards) */}
            {/* UPDATED STYLE: justifyContent: 'center' to center the single button */}
            <View style={[styles.navigationButtonsContainer, { paddingHorizontal: 20, justifyContent: 'center' }]}>
              <TouchableOpacity
                style={[styles.navButton, { maxWidth: 200 }]} // FIX: Removed comment from this line
                onPressIn={handleAuctionPressIn}
                onPressOut={handleAuctionPressOut}
                onPress={() => {
                  // Actual navigation for Auction goes here
                  // navigation.navigate("AuctionScreen"); 
                }}
              >
                <Animated.View style={[styles.navButtonGradient, auctionAnimatedStyle]}>
                  <LinearGradient
                    colors={['#0C53B3', '#053B90']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.navButtonText}>View </Text>
                  <Text style={styles.navButtonText}>Auction</Text>
                </Animated.View>
              </TouchableOpacity>
              {/* REMOVED: View Insurance Button */}
            </View>

            <ScrollView
              ref={scrollViewRef} 
              style={styles.scrollWrapper}
              contentContainerStyle={{ padding: 20, paddingBottom: 100 }} // Increased paddingBottom
              showsVerticalScrollIndicator={false}
            >
              
              {/* REMOVED: Enrolled Groups Card */}
              {/* REMOVED: Accordion List Component (Active Enrollments Index) */}

              {filteredCards.length === 0 ? (
                <View style={styles.noGroupWrapper}>
                  <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
                  <Text style={styles.noGroupText}>No groups found for this user.</Text>
                </View>
              ) : (activeCards.length === 0 ? (
                <View style={styles.noGroupWrapper}><Text style={styles.noGroupText}>No active groups found for this user.</Text></View>
              ) : activeCards.map((card, index) => { 
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
                              {isDeleted && <Text style={styles.removalReason}>Reason: {card.removal_reason?.toUpperCase() !== "OTHERS" ? card.removal_reason : "Unknown"}</Text>}
                              {isCompleted && <Text style={styles.completedText}>Completed</Text>}
                            </View>
                          </View>
                          
                          {/* --- Start and End Dates Block (ADDED) --- */}
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

// --- Styles for the Accordion List (REMOVED) ---
// ------------------------------------


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryBlue },
  mainWrapper: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    margin: 10,
    borderRadius: 20,
    overflow: "hidden",
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
  
  // --- NEW NAVIGATION BUTTON STYLES ---
  navigationButtonsContainer: {
    flexDirection: "row",
    // NOTE: justifyContent is now set to 'center' directly in the JSX
    // justifyContent: "space-between", 
    marginBottom: 25,
  },
  navButton: {
    // REMOVED: flex: 1 as there is only one button and it should not stretch full width
    // flex: 1, 
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  navButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 18,
  },
  // -----------------------------------
  
  scrollWrapper: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  
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
  
  // --- Styles for Date Display (ADDED from Mygroups.jsx) ---
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

export default Payments;