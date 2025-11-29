import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Image,
  Platform,
  Vibration,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import axios from 'axios';

import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import { ContextProvider } from "../context/UserProvider";
import url from "../data/url";

import NoDataIllustration from "../../assets/9264885.jpg";
import NoGroupImage from "../../assets/Nogroup.png";

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F0F5F9",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentGreen: "#2ECC71",
  accentBlue: "#3499DB",
  gradientStart: "#FFFFFF",
  gradientEnd: "#E3F2FD",
  shadowColor: "rgba(0,0,0,0.1)",
  borderColor: "#E0E0E0",
  summaryCardInvestment: "#053B90",
  summaryCardProfit: "#2ECC71",
  summaryCardText: "#FFFFFF",
  profitText: "#2ECC71", // Green for profit
  lossText: "#E74C3C", // Red for loss
};

const MyGroupsAndDues = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const currentUserId = appUser?.userId;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupsData, setGroupsData] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [groupDuesOverview, setGroupDuesOverview] = useState({}); // New state for group-specific dues/profit
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyGroupsAndDues = useCallback(async () => {
    if (!currentUserId) {
      setError("User ID is not available. Please ensure you are logged in.");
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const groupsFetchUrl = `${url}/enroll/get-user-tickets/${currentUserId}`;
      const overviewFetchUrl = `${url}/enroll/get-user-tickets-report/${currentUserId}`;

      console.log("Attempting to fetch groups from URL (POST):", groupsFetchUrl);
      console.log("Attempting to fetch overview from URL (POST):", overviewFetchUrl);

      const [groupsResponse, overviewResponse] = await Promise.allSettled([
        axios.post(groupsFetchUrl), // Changed to POST request
        axios.post(overviewFetchUrl),
      ]);
      if (groupsResponse.status === 'fulfilled' && groupsResponse.value.data) {
        const rawGroupsData = Array.isArray(groupsResponse.value.data) ? groupsResponse.value.data : [];
        const transformedGroups = rawGroupsData
          .filter(card => card && card.group_id && card._id) // Ensure group_id and ticket ID exist
          .map(ticketDetail => ({
            _id: ticketDetail.group_id._id, // Use group_id's _id as the primary group identifier
            ticketId: ticketDetail._id, // Store the ticket ID for navigation to EnrollGroup.jsx
            chitGroupName: ticketDetail.group_id?.group_name,
            chitValue: ticketDetail.group_id.chitValue,
            numberOfMembers: ticketDetail.group_id.numberOfMembers,
            nextPaymentDate: ticketDetail.next_payment_date,
            status: ticketDetail.status || 'Active', 
          }));
        setGroupsData(transformedGroups);
      } else {
        console.error("Failed to fetch groups:", groupsResponse.reason || "Unknown error");
        setError("Failed to load your groups. Please check network and endpoint.");
        setGroupsData([]);
      }
      if (overviewResponse.status === 'fulfilled' && overviewResponse.value.data) {
        const overviewData = Array.isArray(overviewResponse.value.data) ? overviewResponse.value.data : [];
        
        let calculatedTotalPaid = 0;
        let calculatedTotalProfit = 0;
        const groupDuesMap = {}; 
        overviewData.forEach(groupReport => {
          if (groupReport && groupReport._id) { // _id here is the group ID from the report
            calculatedTotalPaid += (groupReport?.payments?.totalPaidAmount || 0);
            calculatedTotalProfit += (groupReport?.profit?.totalProfit || 0);
            groupDuesMap[groupReport._id] = { // Map by group ID
              totalPaidAmount: groupReport.payments?.totalPaidAmount || 0,
              totalProfit: groupReport.profit?.totalProfit || 0,
            };
          }
        });

        setTotalPaid(calculatedTotalPaid);
        setTotalProfit(calculatedTotalProfit);
        setGroupDuesOverview(groupDuesMap); // Set the new state
      } else {
        console.error("Failed to fetch overview data:", overviewResponse.reason || "Unknown error");
        Toast.show({
          type: "info",
          text1: "Overview Load Info",
          text2: "Could not load passbook summary. Data may be incomplete.",
          position: "bottom",
          visibilityTime: 4000,
        });
        setTotalPaid(0);
        setTotalProfit(0);
        setGroupDuesOverview({});
      }

    } catch (err) {
      console.error("Error during overall data fetching:", err);
      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.statusText}`);
      } else {
        setError("Network error or server issue. Could not load data.");
      }
      setGroupsData([]);
      setTotalPaid(0);
      setTotalProfit(0);
      setGroupDuesOverview({});
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      fetchMyGroupsAndDues();
    }, [fetchMyGroupsAndDues])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Vibration.vibrate(50); // Small vibration feedback
    fetchMyGroupsAndDues();
  }, [fetchMyGroupsAndDues]);

  const formatNextPaymentDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `₹ ${amount?.toLocaleString('en-IN') || '0'}`;
  };

  const getProfitLossStyle = (amount) => {
    return {
      color: amount >= 0 ? Colors.profitText : Colors.lossText,
      fontWeight: 'bold',
    };
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.loaderScreen}>
        <ActivityIndicator size="large" color={Colors.primaryBlue} />
        <Text style={styles.loadingText}>Loading your groups and dues...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      <Header
        userId={currentUserId}
        navigation={navigation}
        title="My Groups & Dues"
      />

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primaryBlue]} tintColor={Colors.primaryBlue} />
        }
      >
        <View style={styles.contentArea}>
          <Text style={styles.mainTitle}>Your Chit Groups & Dues</Text>
          <Text style={styles.subtitle}>
            Manage your active groups and track upcoming payments.
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchMyGroupsAndDues} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.summaryCardsContainer}>
            <LinearGradient
              colors={['#053B90', '#1C5B9B']} // Darker blue gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <Ionicons name="wallet-outline" size={30} color={Colors.summaryCardText} />
              <View style={styles.summaryCardContent}>
                <Text style={styles.summaryCardTitle}>Total Invested</Text>
                <Text style={styles.summaryCardValue}>{formatCurrency(totalPaid)}</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#2ECC71', '#3DCC87']} // Green gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <Ionicons name="trending-up-outline" size={30} color={Colors.summaryCardText} />
              <View style={styles.summaryCardContent}>
                <Text style={styles.summaryCardTitle}>Total Profit</Text>
                <Text style={styles.summaryCardValue}>{formatCurrency(totalProfit)}</Text>
              </View>
            </LinearGradient>
          </View>


          {groupsData.length === 0 && !isLoading && !error ? (
            <View style={styles.noGroupsContainer}>
              <Image source={NoGroupImage} style={styles.noGroupImage} />
              <Text style={styles.noGroupsText}>No Active Groups!</Text>
              <Text style={styles.noGroupsSubText}>
                It looks like you haven't joined any active chit groups yet.
                Explore available chits and start your journey!
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("Discover")}
              >
                <Text style={styles.actionButtonText}>Explore Chits</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.groupsListContainer}>
              {groupsData.map((group) => {
                const duesDetail = groupDuesOverview[group._id] || { totalPaidAmount: 0, totalProfit: 0 };
                return (
                  <TouchableOpacity
                    key={group.ticketId} 
                    style={styles.groupCard}
              
                    onPress={() => navigation.navigate("GroupDetails", { groupId: group._id, groupName: group.chitGroupName, ticket: group.ticketId })}
                  >
                    <LinearGradient
                      colors={['#f0f8ff', '#e0e8f5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardGradient}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.groupName}>{group.chitGroupName}</Text>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>{group.status || 'Active'}</Text>
                        </View>
                      </View>

                      <View style={styles.cardBody}>
                        <View style={styles.detailRow}>
                          <Ionicons name="cash-outline" size={18} color={Colors.primaryBlue} />
                          <Text style={styles.detailText}>
                            Chit Value: <Text style={styles.highlightText}>₹ {group.chitValue?.toLocaleString('en-IN') || 'N/A'}</Text>
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="people-outline" size={18} color={Colors.primaryBlue} />
                          <Text style={styles.detailText}>
                            Members: <Text style={styles.highlightText}>{group.numberOfMembers || 'N/A'}</Text>
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="date-range" size={18} color={Colors.primaryBlue} />
                          <Text style={styles.detailText}>
                            Next Due: <Text style={styles.highlightText}>{formatNextPaymentDate(group.nextPaymentDate)}</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={styles.groupDuesSection}>
                        <View style={styles.detailRow}>
                            <Ionicons name="receipt-outline" size={18} color={Colors.darkText} />
                            <Text style={styles.detailText}>
                                Your Total Paid: <Text style={styles.highlightText}>{formatCurrency(duesDetail.totalPaidAmount)}</Text>
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="stats-chart-outline" size={18} color={Colors.darkText} />
                            <Text style={styles.detailText}>
                                Your Profit/Loss: <Text style={getProfitLossStyle(duesDetail.totalProfit)}>
                                    {formatCurrency(duesDetail.totalProfit)}
                                </Text>
                            </Text>
                        </View>
                      </View>

                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loaderScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primaryBlue,
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
  },
  mainScrollView: {
    flex: 1,
    width: "100%",
  },
  mainScrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingBottom: 20,
  },
  contentArea: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primaryBlue,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.05)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.mediumText,
    marginBottom: 25,
    textAlign: "center",
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 18,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 25,
    borderColor: "#EF5350",
    borderWidth: 1,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#EF5350",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 120,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  summaryCardContent: {
    marginTop: 10,
  },
  summaryCardTitle: {
    fontSize: 15,
    color: Colors.summaryCardText,
    fontWeight: '600',
    marginBottom: 5,
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.summaryCardText,
  },
  noGroupsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    marginVertical: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  noGroupImage: {
    width: 160,
    height: 160,
    marginBottom: 15,
  },
  noGroupsText: {
    textAlign: "center",
    color: Colors.darkText,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noGroupsSubText: {
    textAlign: "center",
    color: Colors.mediumText,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
  },
  actionButton: {
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  actionButtonText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontWeight: "bold",
  },
  groupsListContainer: {
    width: '100%',
    paddingHorizontal: 5,
    marginTop: 20,
  },
  groupCard: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardGradient: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
    flexShrink: 1,
  },
  statusBadge: {
    backgroundColor: Colors.accentGreen,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
  },
  statusText: {
    color: Colors.cardBackground,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 15,
    color: Colors.mediumText,
    marginLeft: 8,
  },
  highlightText: {
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  groupDuesSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    paddingTop: 10,
    marginTop: 10,
  },
});

export default MyGroupsAndDues;