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
  Animated,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import Header from "../components/layouts/Header";
import url from "../data/url";
import { ContextProvider } from "../context/UserProvider";
import NoGroupImage from "../../assets/Nogroup.png";
import Toast from "react-native-toast-message";

const Colors = {
  primaryBlue: "#053B90",
  secondaryBlue: "#0C53B3",
  lightBackground: "#F5F8FA",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  accentColor: "#05a7dd",
  warningText: "#F39C12",
  successText: "#27AE60",
  dueText: "#E74C3C",
  excessText: "#27AE60",
  pendingText: "#F39C12",
  approvedText: "#27AE60",
  rejectedText: "#E74C3C",
  bidButtonColor: "#FF6B6B",
  softGrayBackground: "#FAFAFC",
  lightGrayBorder: "#E9ECEF",
  softBlueAccent: "#E6F0FF",
  cardBackground: "#FFFFFF",
  clearDueGradientStart: "#FF416C",
  clearDueGradientEnd: "#FF4B2B",
  dueWarningText: "#E74C3C",
};

const BID_PURPOSE_OPTIONS = ["Investment", "Business", "Personal", "Others"];

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
  const otherNumbers = integerPart.slice(0, -3);
  const formattedOther = otherNumbers
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ","
    : "";
  return (isNegative ? "-" : "") + formattedOther + lastThree + decimalPart;
};

const calculatePaidPercentage = (group_value, paid_amount) => {
  if (!group_value || !paid_amount) return 0;
  return Math.min(100, Math.round((paid_amount / group_value) * 100));
};

const formatTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
};

const BidRequest = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId || null;

  const params = route?.params || {};
  const {
    selectedGroupId,
    selectedEnrollmentId,
    preselectedGroup
  } = params;

  const [enrollmentsData, setEnrollmentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [individualGroupReports, setIndividualGroupReports] = useState({});
  const [balances, setBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState({});
  const [balanceError, setBalanceError] = useState({});
  const [existingBidRequests, setExistingBidRequests] = useState([]);
  const [loadingBidRequests, setLoadingBidRequests] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [auctionsMap, setAuctionsMap] = useState({});

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    bidAmount: "",
    bidPurpose: "",
    otherPurpose: "",
    termsAccepted: false, // Add this
  });

  const [highlightedGroupId, setHighlightedGroupId] = useState(selectedEnrollmentId || null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      try {
        const profileUrl = `${url}/user/get-user-by-id/${userId}`;
        const response = await axios.get(profileUrl);
        const userData = response.data;
        if (userData) {
          setFormData(prev => ({
            ...prev,
            fullName: userData.full_name || prev.fullName,
            phoneNumber: userData.phone_number || prev.phoneNumber,
          }));
        }
      } catch (err) { }
    };
    fetchUserProfile();
  }, [userId]);

  const fetchAuctionsForGroups = async (enrollments) => {
    if (!enrollments || enrollments.length === 0) return;
    const uniqueGroupIds = [...new Set(enrollments.map(e => e.group_id?._id).filter(Boolean))];
    const promises = uniqueGroupIds.map(async (groupId) => {
      try {
        const response = await axios.get(`${url}/auction/group/${groupId}`);
        return { groupId, data: response.data };
      } catch (error) {
        return { groupId, data: [] };
      }
    });
    const results = await Promise.all(promises);
    const newMap = {};
    results.forEach(({ groupId, data }) => {
      newMap[groupId] = Array.isArray(data) ? data : [];
    });
    setAuctionsMap(newMap);
  };

  const fetchEnrollments = useCallback(async () => {
    if (!userId) {
      setEnrollmentsData([]);
      return [];
    }
    try {
      const response = await axios.get(`${url}/enroll/mobile-enrolls/users/${userId}`);
      const responseData = response.data.data || [];
      let allEnrollments = [];
      responseData.forEach(groupBlock => {
        if (groupBlock.enrollments && groupBlock.enrollments.length > 0) {
          const approvedEnrollments = groupBlock.enrollments.map(enrollment => ({
            ...enrollment,
            isPendingApproval: false,
          }));
          allEnrollments.push(...approvedEnrollments);
        }
      });
      const activeEnrollments = allEnrollments.filter(e => !e.deleted);
      if (selectedEnrollmentId) {
        const filteredEnrollments = activeEnrollments.filter(e => e._id === selectedEnrollmentId);
        setEnrollmentsData(filteredEnrollments);
        return filteredEnrollments;
      }
      setEnrollmentsData(activeEnrollments);
      return activeEnrollments;
    } catch (error) {
      setEnrollmentsData([]);
      return [];
    }
  }, [userId, selectedEnrollmentId]);

  const fetchOverview = useCallback(async () => {
    if (!userId) return {};
    try {
      const response = await axios.post(`${url}/enroll/get-user-tickets-report/${userId}`, {
        source: "mychits-customer-app"
      });
      const data = response.data;
      const reportsMap = {};
      data.forEach((groupReport) => {
        if (groupReport.enrollment && groupReport.enrollment.group && groupReport.enrollment.tickets) {
          const key = `${groupReport.enrollment.group._id}-${groupReport.enrollment.tickets}`;
          reportsMap[key] = {
            totalPaid: groupReport.payments?.totalPaidAmount || 0,
            totalProfit: groupReport.profit?.totalProfit || 0,
          };
        }
      });
      setIndividualGroupReports(reportsMap);
      return reportsMap;
    } catch (error) {
      return {};
    }
  }, [userId]);

  const fetchExistingBidRequests = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingBidRequests(true);
      const response = await axios.get(`${url}/bid-request/get-all`);
      const allRequests = response.data?.data || [];
      const userRequests = allRequests.filter(req => {
        const reqUserId = req.subscriberId?._id || req.subscriberId;
        return reqUserId === userId;
      });
      setExistingBidRequests(userRequests);
    } catch (error) {
      setExistingBidRequests([]);
    } finally {
      setLoadingBidRequests(false);
    }
  }, [userId]);

  const hasPendingBidRequest = (enrollmentId) => {
    return existingBidRequests.some(req => req.enrollmentId === enrollmentId && req.status === 'Pending');
  };

  const fetchBalance = async (enrollmentId, enrollment) => {
    if (!enrollmentId) return 0;
    try {
      setLoadingBalances(prev => ({ ...prev, [enrollmentId]: true }));
      setBalanceError(prev => ({ ...prev, [enrollmentId]: false }));

      const response = await axios.get(`${url}/bid-request/get-balance/${enrollmentId}`);
      let balance = 0;

      if (response.data?.data?.[0]?.balance !== undefined) {
        balance = response.data.data[0].balance;
      } else if (response.data?.balance !== undefined) {
        balance = response.data.balance;
      } else {
        const reportKey = `${enrollment.group_id?._id}-${enrollment.tickets}`;
        const paidAmount = individualGroupReports[reportKey]?.totalPaid || 0;
        const groupValue = enrollment.group_id?.group_value || 0;
        balance = groupValue - paidAmount;
      }

      setBalances(prev => ({ ...prev, [enrollmentId]: balance }));
      return balance;
    } catch (error) {
      setBalanceError(prev => ({ ...prev, [enrollmentId]: true }));
      const reportKey = `${enrollment.group_id?._id}-${enrollment.tickets}`;
      const paidAmount = individualGroupReports[reportKey]?.totalPaid || 0;
      const groupValue = enrollment.group_id?.group_value || 0;
      const fallbackBalance = groupValue - paidAmount;
      setBalances(prev => ({ ...prev, [enrollmentId]: fallbackBalance }));
      return fallbackBalance;
    } finally {
      setLoadingBalances(prev => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const loadAllData = useCallback(async (showRefreshing = false) => {
    if (!userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const enrollments = await fetchEnrollments();

      await Promise.all([
        fetchOverview(),
        fetchExistingBidRequests()
      ]);

      if (enrollments && enrollments.length > 0) {
        const balancePromises = enrollments.map(enrollment =>
          fetchBalance(enrollment._id, enrollment)
        );
        await Promise.all(balancePromises);
        await fetchAuctionsForGroups(enrollments);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, fetchEnrollments, fetchOverview, fetchExistingBidRequests]);

  useEffect(() => {
    loadAllData(false);
  }, [loadAllData]);

  const onRefresh = useCallback(() => {
    loadAllData(true);
  }, [loadAllData]);

  const handleClearDue = async (enrollment) => {
    const balance = balances[enrollment._id] || 0;
    if (balance <= 0) return;
    navigation.navigate("PayYourDues", {
      enrollmentId: enrollment._id,
      groupId: enrollment.group_id?._id,
      ticket: enrollment.tickets,
      groupName: enrollment.group_id?.group_name,
      dueAmount: balance,
    });
  };

  const handleBidRequest = async (enrollment) => {
    if (hasPendingBidRequest(enrollment._id)) {
      Alert.alert("Pending Bid Request", "You already have a pending bid request for this group. Please wait for approval.", [{ text: "OK" }]);
      return;
    }

    const balance = balances[enrollment._id] || 0;

    if (balance > 0) {
      Alert.alert(
        "Due Balance Warning",
        `You have a due of ₹ ${formatNumberIndianStyle(balance)}.\n\nClear due otherwise your request will be rejected.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => {
              setSelectedEnrollment(enrollment);
              setIsFormVisible(true);
            }
          },
          {
            text: "Pay Now",
            onPress: () => handleClearDue(enrollment),
            style: "default"
          }
        ]
      );
      return;
    }

    setSelectedEnrollment(enrollment);
    setIsFormVisible(true);
  };

  const handleFormSubmit = async () => {
    const finalPurpose = formData.bidPurpose === "Others" ? formData.otherPurpose : formData.bidPurpose;

  if (!formData.fullName.trim()) {
    Toast.show({ type: "error", text1: "Error", text2: "Please enter your full name" });
    return;
  }
  if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
    Toast.show({ type: "error", text1: "Error", text2: "Please enter a valid phone number" });
    return;
  }
  if (!formData.bidPurpose) {
    Toast.show({ type: "error", text1: "Error", text2: "Please select the purpose of bid" });
    return;
  }
  if (!formData.termsAccepted) {
    Toast.show({ type: "error", text1: "Error", text2: "Please accept the Terms & Conditions to proceed" });
    return;
  }
  if (!selectedEnrollment) {
    Toast.show({ type: "error", text1: "Error", text2: "No enrollment selected" });
    return;
  }

    const balance = balances[selectedEnrollment._id] || 0;

    if (balance > 0) {
      Toast.show({
        type: "info",
        text1: "Due Balance Alert",
        text2: `You have ₹ ${formatNumberIndianStyle(balance)} due. Your request will be rejected unless dues are cleared.`,
        position: 'bottom',
        visibilityTime: 4000,
      });
    }

    setIsSubmitting(true);

    const payload = {
      subscriberId: userId,
      subscriberName: formData.fullName,
      mobileNumber: formData.phoneNumber,
      groupId: selectedEnrollment.group_id?._id,
      groupName: selectedEnrollment.group_id?.group_name,
      ticketNumber: selectedEnrollment.tickets.toString(),
      auctionDate: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      enrollmentId: selectedEnrollment._id,
      auction_time: formatTime(new Date()),
      referred_by: "",
      status: "Pending ",
      source: "mychits-customer-app"
    };

    try {
      const res = await axios.post(`${url}/bid-request/create`, payload);

      if (res.status === 201 || res.status === 200) {
        setIsFormVisible(false);
        setFormData({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          bidAmount: "",
          bidPurpose: "",
          otherPurpose: "",
        });
        setSelectedEnrollment(null);
        await fetchExistingBidRequests();

        Toast.show({
          type: "success",
          text1: "✅ Success",
          text2: res.data.message || "Your bid request was submitted successfully!",
          position: 'bottom',
          visibilityTime: 4000,
        });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Submission Failed", text2: err.response?.data?.message || "Something went wrong. Please try again.", position: 'bottom' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return Colors.dueText;
    if (balance === 0) return Colors.mediumText;
    return Colors.excessText;
  };

  // const getBalanceText = (balance) => {
  //   if (balance > 0) return `Due: ₹ ${formatNumberIndianStyle(balance)}`;
  //   if (balance === 0) return `Balance: ₹ 0`;
  //   return `Excess: ₹ ${formatNumberIndianStyle(Math.abs(balance))}`;
  // };
  const getBalanceText = (balance) => {
  if (balance > 0) return `Due: ₹ ${formatNumberIndianStyle(balance)}`;
  return null; // Return null for zero or negative balance
};

  const isBidButtonDisabled = (enrollmentId, balance) => {
    return hasPendingBidRequest(enrollmentId);
  };

  const getButtonText = (enrollmentId, balance) => {
    if (hasPendingBidRequest(enrollmentId)) return "Pending Request";
    if (balance > 0) return "Bid Request (Due Pending)";
    return "Bid Request";
  };

  const getButtonColors = (enrollmentId, balance) => {
    if (hasPendingBidRequest(enrollmentId)) {
      return ["#95A5A6", "#7F8C8D"];
    }
    if (balance > 0) {
      return ["#FF416C", "#FF4B2B"];
    }
    return ["#FF6B6B", "#FF5252"];
  };

  const renderNoGroupsMessage = () => {
    if (selectedEnrollmentId) {
      return (
        <View style={styles.noGroupWrapper}>
          <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
          <Text style={styles.noGroupText}>Selected group not found</Text>
          <Text style={styles.noGroupSubText}>The group you selected may no longer be active</Text>
          <TouchableOpacity style={styles.joinGroupButton} onPress={() => navigation.goBack()}>
            <Text style={styles.joinGroupButtonText}>Go Back</Text>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.noGroupWrapper}>
        <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
        <Text style={styles.noGroupText}>No active groups found</Text>
        <Text style={styles.noGroupSubText}>Join a group to start bidding</Text>
        <TouchableOpacity style={styles.joinGroupButton} onPress={() => navigation.navigate("BottomTab", { screen: "Enrollment" })}>
          <Text style={styles.joinGroupButtonText}>Join a Group</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.mainWrapper}>
        {loading ? (
          <View style={styles.fullScreenLoader}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading your groups...</Text>
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.primaryBlue} />
              </TouchableOpacity>
              <Text style={styles.title}>Bid Request</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.scrollWrapper}
              contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.primaryBlue]}
                  tintColor={Colors.primaryBlue}
                />
              }
            >
              {enrollmentsData.length > 0 ? (
                enrollmentsData.map((enrollment, index) => {
                  const groupIdFromCard = enrollment.group_id?._id;
                  const reportKey = `${groupIdFromCard}-${enrollment.tickets}`;
                  const individualPaidAmount = individualGroupReports[reportKey]?.totalPaid || 0;
                  const paidPercentage = calculatePaidPercentage(enrollment.group_id?.group_value, individualPaidAmount);

                  const balance = balances[enrollment._id] || 0;
                  const isLoadingBalance = loadingBalances[enrollment._id];
                  const hasBalanceError = balanceError[enrollment._id];
                  const hasPending = hasPendingBidRequest(enrollment._id);
                  const buttonDisabled = isBidButtonDisabled(enrollment._id, balance);
                  const isHighlighted = enrollment._id === highlightedGroupId;

                  const groupAuctions = auctionsMap[groupIdFromCard] || [];
                  let latestAuction = null;
                  if (groupAuctions.length > 0) {
                    latestAuction = groupAuctions.reduce((latest, current) => {
                      const dateA = new Date(latest.auction_date);
                      const dateB = new Date(current.auction_date);
                      return dateB > dateA ? current : latest;
                    });
                  }

                  const displayBidPercentage = latestAuction?.bid_percentage || 0;

                  return (
                    <View key={`card-${index}`} style={styles.cardWrapper}>
                      <LinearGradient
                        colors={isHighlighted ? ["#FFD700", "#FDB931"] : ["#FFFFFF", "#FFFFFF"]}
                        style={[styles.cardGradient, isHighlighted && styles.highlightedGradient]}
                      >
                        <View style={styles.cardInner}>
                          <View style={styles.cardHeader}>
                            <View style={[styles.iconCircleSmall, { backgroundColor: Colors.secondaryBlue }]}>
                              <MaterialCommunityIcons name="currency-inr" size={24} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cardTitle}>{enrollment.group_id?.group_name}</Text>
                              <Text style={styles.ticketText}>Ticket: {enrollment.tickets}</Text>
                            </View>
                            {hasPending && (
                              <View style={styles.pendingBadge}>
                                <Text style={styles.pendingBadgeText}>Pending</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.progressSection}>
                            <View style={styles.progressHeader}>
                              <Text style={styles.progressText}>Payment Progress</Text>
                              <Text style={styles.progressTextBold}>{paidPercentage}%</Text>
                            </View>
                            <View style={styles.progressBar}>
                              <View
                                style={{
                                  width: `${paidPercentage}%`,
                                  height: 8,
                                  borderRadius: 10,
                                  backgroundColor: Colors.accentColor
                                }}
                              />
                            </View>
                          </View>

                          <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Chit Value</Text>
                              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                                ₹ {formatNumberIndianStyle(enrollment.group_id?.group_value || 0)}
                              </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Paid Amount</Text>
                              <Text style={[styles.statValue, { color: Colors.successText }]} numberOfLines={1} adjustsFontSizeToFit>
                                ₹ {formatNumberIndianStyle(individualPaidAmount)}
                              </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Bid %</Text>
                              <Text style={styles.statValue} numberOfLines={1}>
                                {displayBidPercentage ? `${displayBidPercentage}%` : "N/A"}
                              </Text>
                            </View>
                          </View>

                          {/* Show due amount only for customers with due balance */}
                          {isLoadingBalance ? (
                            <View style={styles.balanceContainer}>
                              <ActivityIndicator size="small" color={Colors.primaryBlue} />
                            </View>
                          ) : balance > 0 ? (
                            <View style={[styles.balanceContainer, { backgroundColor: Colors.dueText + '10' }]}>
                              <Text style={[styles.balanceText, { color: Colors.dueText, fontWeight: 'bold' }]}>
                                Due: ₹ {formatNumberIndianStyle(balance)}
                              </Text>
                              <Text style={styles.cantParticipateText}>
                                * Clear due otherwise your request will be rejected
                              </Text>
                            </View>
                          ) : null}

                          <TouchableOpacity
                            style={[styles.bidRequestButton, buttonDisabled && styles.bidRequestButtonDisabled]}
                            onPress={() => handleBidRequest(enrollment)}
                            activeOpacity={0.8}
                            disabled={buttonDisabled}
                          >
                            <LinearGradient
                              colors={getButtonColors(enrollment._id, balance)}
                              style={styles.bidRequestGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              <View style={styles.buttonContentWrapper}>
                                <View style={styles.buttonTextContainer}>
                                  <Text style={styles.bidRequestButtonText}>{getButtonText(enrollment._id, balance)}</Text>
                                </View>
                                {!buttonDisabled && (
                                  <MaterialCommunityIcons name={balance > 0 ? "credit-card" : "gavel"} size={20} color="#fff" />
                                )}
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </View>
                  );
                })
              ) : (
                renderNoGroupsMessage()
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          </>
        )}
      </View>

      <Modal
  animationType="slide"
  transparent={true}
  visible={isFormVisible}
  onRequestClose={() => {
    setIsFormVisible(false);
    setSelectedEnrollment(null);
  }}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Bid Request Form</Text>
        <TouchableOpacity onPress={() => { setIsFormVisible(false); setSelectedEnrollment(null); }}>
          <Ionicons name="close-circle" size={30} color={Colors.mediumText} />
        </TouchableOpacity>
      </View>

      {selectedEnrollment && (
        <View style={styles.selectedGroupInfo}>
          <Text style={styles.selectedGroupText}>Group: {selectedEnrollment.group_id?.group_name}</Text>
          <Text style={styles.selectedGroupText}>Ticket: {selectedEnrollment.tickets}</Text>
          {balances[selectedEnrollment._id] > 0 && (
            <Text style={styles.dueWarningText}>⚠️ Due: ₹ {formatNumberIndianStyle(balances[selectedEnrollment._id])} - Clear due otherwise request will be rejected</Text>
          )}
          {balances[selectedEnrollment._id] <= 0 && (
            <Text style={styles.eligibleText}>✓ You are eligible to bid</Text>
          )}
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.modalScrollContent}
      >
        <Text style={styles.formSectionLabel}>Personal Details:</Text>

        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput style={styles.input} value={formData.fullName} onChangeText={(txt) => setFormData({ ...formData, fullName: txt })} placeholder="Enter Full Name" editable={!isSubmitting} />

        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput style={styles.input} keyboardType="phone-pad" value={formData.phoneNumber} onChangeText={(txt) => setFormData({ ...formData, phoneNumber: txt })} placeholder="Mobile Number" maxLength={10} editable={!isSubmitting} />

        <Text style={styles.inputLabel}>Purpose of Bid *</Text>
        <View style={styles.purposeGrid}>
          {BID_PURPOSE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.purposeChip, formData.bidPurpose === option && styles.purposeChipSelected]}
              onPress={() => { setFormData({ ...formData, bidPurpose: option }); }}
              disabled={isSubmitting}
            >
              <Text style={[styles.purposeChipText, formData.bidPurpose === option && styles.purposeChipTextSelected]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {formData.bidPurpose === "Others" && (
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.inputLabel}>Please specify:</Text>
            <TextInput style={styles.input} value={formData.otherPurpose} onChangeText={(txt) => setFormData({ ...formData, otherPurpose: txt })} placeholder="Enter your specific reason" editable={!isSubmitting} />
          </View>
        )}

        {/* Terms & Conditions Section */}
        <View style={styles.termsContainer}>
          <View style={styles.termsHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color={Colors.primaryBlue} />
            <Text style={styles.termsTitle}> Terms & Conditions</Text>
          </View>
          
          {/* Separate ScrollView for Terms Content */}
          <ScrollView 
            style={styles.termsScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <Text style={styles.termsText}>
              <Text style={styles.termsBold}>1. Eligibility Requirements:</Text>{'\n'}
              • To be eligible to make a bid, the subscriber should have paid all the instalments and not have any pending ones.{'\n'}
              • If any balance is pending towards instalment amount, the participant will not be allowed to participate in the auction.{'\n'}
              • If instalment balance is more than one month, full payment must be made one day prior to the auction date. Only after 30 days from full payment, the subscriber will be allowed to participate.{'\n\n'}
              
              <Text style={styles.termsBold}>2. Auction Participation:</Text>{'\n'}
              • The member can either participate online or personally attend the auction in the Chit office on the date and time specified in the Chit Fund agreement.{'\n'}
              • For online auction, customers can call the auction helpline number.{'\n'}
              • The bid form can be sent via WhatsApp: 483900777{'\n'}
              • Email: info.mychit@gmail.com{'\n'}
              • For online auctions, the link will be sent to your registered mobile number on the auction day.{'\n\n'}
              
              <Text style={styles.termsBold}>3. Proxy Participation:</Text>{'\n'}
              • The customer can send a proxy to participate in the auction on their behalf.{'\n'}
              • The proxy must carry the authorisation letter & valid ID proof to participate in the auction.{'\n'}
              • The subscriber needs to fill in all the details in the letter before signing and sending it to the Chit's office.{'\n\n'}
              
              <Text style={styles.termsBold}>4. Bidding Process:</Text>{'\n'}
              • From the second month onwards, members will be able to bid for the Prize Money from the collected funds through a reverse auction.{'\n'}
              • The highest bidder/prized subscriber wins the Prize Money for that month.{'\n'}
              • If more than one customer bids the maximum discounted amount, a lucky draw will be conducted among them, and the winner will be allowed to take the chit.{'\n\n'}
              
              <Text style={styles.termsBold}>5. Prize Money & Security:</Text>{'\n'}
              • As per Section 31 of The Chit Fund Act, 1982, every subscriber who wins the prize must furnish sufficient security to take it.{'\n'}
              • Section 22 allows the company to collect sufficient security for the due payment of future subscriptions.{'\n'}
              • After deducting the foreman's commission with tax, the balance amount will be paid.{'\n\n'}
              
              <Text style={styles.termsBold}>6. Payment Terms:</Text>{'\n'}
              • To participate in the auction, payment should be made one day prior to the auction date.{'\n'}
              • The prize winner must furnish sufficient security to claim it.{'\n\n'}
              
              <Text style={styles.termsBold}>7. Default & Termination:</Text>{'\n'}
              • If any subscriber has not paid instalments continuously for 90 days, the chit will be terminated 30 days from the notice period date.{'\n'}
              • Cancellation/withdrawal of chit is not allowed under any circumstances.{'\n'}
              • If a subscriber discontinues the chit (non-payment or failure to provide security), a foreman commission of 5–7% + GST will be deducted.{'\n'}
              • Remaining balance will be settled after substitution or completion of the chit period, whichever is earlier.{'\n'}
              • A defaulting subscriber is liable to be penalised.{'\n\n'}
              
              <Text style={styles.termsBold}>8. Declaration:</Text>{'\n'}
              By submitting this bid request, I confirm that I have read, understood, and agree to abide by all the terms and conditions mentioned above. I understand that providing false information may lead to disqualification and legal action.
            </Text>
          </ScrollView>

          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })}
            disabled={isSubmitting}
          >
            <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
              {formData.termsAccepted && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read, understood, and agree to all the Terms & Conditions mentioned above
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.certificationBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.mediumText} />
          <Text style={styles.certificationText}>I certify that the information provided is true and accurate.</Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitFormButton, (isSubmitting || !formData.termsAccepted) && styles.submitFormButtonDisabled]} 
          onPress={handleFormSubmit} 
          disabled={isSubmitting || !formData.termsAccepted}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitFormButtonText}>Submit Bid Request</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  </View>
</Modal>
      <Toast position="bottom" bottomOffset={60} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryBlue },
  mainWrapper: { flex: 1, backgroundColor: Colors.lightBackground, margin: 10, borderRadius: 20, overflow: "hidden", marginBottom: 50 },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: Colors.mediumText, fontSize: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 15 },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(5, 57, 144, 0.1)' },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", color: Colors.darkText },
  scrollWrapper: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 10 },
  iconCircleSmall: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardWrapper: { marginVertical: 8 },
  cardGradient: { borderRadius: 20, padding: 2, backgroundColor: '#fff' },
  highlightedGradient: { borderWidth: 2, borderColor: "#FFD700" },
  cardInner: { borderRadius: 18, padding: 15, backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: Colors.darkText },
  ticketText: { fontSize: 13, color: Colors.mediumText, marginTop: 2 },
  pendingBadge: { backgroundColor: Colors.pendingText, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginLeft: 8 },
  pendingBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  progressSection: { marginBottom: 15 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressText: { fontSize: 13, color: Colors.mediumText },
  progressTextBold: { fontSize: 14, fontWeight: "bold", color: Colors.primaryBlue },
  progressBar: { height: 8, backgroundColor: "#E0E0E0", borderRadius: 10, overflow: 'hidden' },
  // Updated styles for stats container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.softGrayBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0, // Important for text truncation
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.lightGrayBorder,
    height: 40,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.mediumText,
    marginBottom: 6,
    textAlign: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.darkText,
    textAlign: "center",
    flexWrap: "wrap",
  },
  balanceContainer: { 
  paddingVertical: 8, 
  paddingHorizontal: 12, 
  borderRadius: 10, 
  marginBottom: 10, 
  alignItems: 'center',
  backgroundColor: Colors.dueText + '10', // Light red background for due
},
balanceText: { 
  fontSize: 14, 
  fontWeight: 'bold',
  marginBottom: 4,
},
  estimatedText: { fontSize: 10, color: Colors.mediumText, marginLeft: 5, fontStyle: 'italic' },
 cantParticipateText: { 
  fontSize: 11, 
  color: Colors.dueText, 
  fontWeight: '500', 
  textAlign: 'center' 
},
  bidRequestButton: { marginVertical: 5, borderRadius: 12, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  bidRequestButtonDisabled: { opacity: 0.7 },
  bidRequestGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, minHeight: 50 },
  bidRequestButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  buttonContentWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  buttonTextContainer: { flex: 1, alignItems: 'center' },
  noGroupWrapper: { alignItems: 'center', padding: 30 },
  noGroupImage: { width: 180, height: 180, marginBottom: 10 },
  noGroupText: { fontSize: 18, fontWeight: "bold", color: Colors.darkText, textAlign: "center" },
  noGroupSubText: { fontSize: 14, color: Colors.mediumText, textAlign: "center", marginTop: 5, marginBottom: 20 },
  joinGroupButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accentColor, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 10 },
  joinGroupButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.lightGrayBorder, paddingBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.primaryBlue },
  selectedGroupInfo: { backgroundColor: Colors.softBlueAccent, padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: Colors.primaryBlue },
  selectedGroupText: { fontSize: 14, color: Colors.primaryBlue, fontWeight: '600', marginBottom: 2 },
  eligibleText: { fontSize: 12, color: Colors.successText, fontWeight: 'bold', marginTop: 5 },
  dueWarningText: { fontSize: 12, color: Colors.dueText, fontWeight: 'bold', marginTop: 5 },
  formSectionLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: Colors.darkText },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.mediumText, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: Colors.lightGrayBorder, borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 15, color: Colors.darkText, backgroundColor: Colors.softGrayBackground },
  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  purposeChip: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: Colors.lightGrayBorder, backgroundColor: Colors.softGrayBackground, marginRight: 8, marginBottom: 8 },
  purposeChipSelected: { borderColor: Colors.primaryBlue, backgroundColor: Colors.softBlueAccent },
  purposeChipText: { color: Colors.mediumText, fontWeight: '600', fontSize: 13 },
  purposeChipTextSelected: { color: Colors.primaryBlue, fontWeight: 'bold' },
  submitFormButton: { backgroundColor: Colors.primaryBlue, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  submitFormButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  certificationBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 15, backgroundColor: Colors.softGrayBackground, padding: 12, borderRadius: 8 },
  certificationText: { fontSize: 12, color: Colors.mediumText, marginLeft: 10, flex: 1 },


modalScrollContent: {
  paddingBottom: 20,
},
termsContainer: {
  marginBottom: 20,
  backgroundColor: Colors.softGrayBackground,
  borderRadius: 12,
  padding: 15,
  borderWidth: 1,
  borderColor: Colors.lightGrayBorder,
},
termsHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
  paddingBottom: 10,
  borderBottomWidth: 1,
  borderBottomColor: Colors.lightGrayBorder,
},
termsTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: Colors.primaryBlue,
  marginLeft: 10,
},
termsScrollView: {
  maxHeight: 280, // Set a fixed max height for the terms scroll area
  marginBottom: 12,
  backgroundColor: Colors.white,
  borderRadius: 8,
  padding: 10,
},
termsText: {
  fontSize: 12,
  color: Colors.darkText,
  lineHeight: 20,
  textAlign: 'justify',
},
termsBold: {
  fontWeight: 'bold',
  color: Colors.primaryBlue,
  fontSize: 13,
},
checkboxContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 5,
  paddingVertical: 10,
  paddingHorizontal: 5,
  backgroundColor: Colors.white,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: Colors.lightGrayBorder,
},
checkbox: {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 2,
  borderColor: Colors.primaryBlue,
  backgroundColor: '#fff',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
checkboxChecked: {
  backgroundColor: Colors.primaryBlue,
  borderColor: Colors.primaryBlue,
},
checkboxLabel: {
  flex: 1,
  fontSize: 12,
  color: Colors.darkText,
  fontWeight: '500',
  lineHeight: 18,
},
submitFormButtonDisabled: {
  opacity: 0.5,
},
  
});

export default BidRequest;