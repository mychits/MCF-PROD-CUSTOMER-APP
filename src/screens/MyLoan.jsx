// MyLoan.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import { ContextProvider } from "../context/UserProvider";
import Toast from "react-native-toast-message";
import url from "../data/url";
import axios from "axios";

// Add a color palette for consistency
const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#E8F0F7",
  cardBackground: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  lightText: "#BDC3C7",
  accentColor: "#3498DB",
  shadowColor: "rgba(0,0,0,0.1)",
};

const MyLoan = ({ route, navigation }) => {
  const {  groupFilter,loanId } = route.params;
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;
  //const loanId = 
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroup] = useState(groupFilter);
  const [loans, setLoans] = useState([]);

  // NEW: State for payments summary data
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);

  // NEW: State to hold the selected loan ID for specific payments summary
  const [_id, set_id] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchLoans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = `${url}/loans/get-borrower-by-user-id/${userId}`;
        const response = await axios.get(apiUrl);
        setLoans(response.data);
      } catch (err) {
        console.error("Axios fetch error: ", err);
        setError("Failed to fetch loan data. Please try again.");
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not load loan data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [userId]);

  // NEW: useEffect hook to fetch payments summary data for a specific loan
  useEffect(() => {
    if (!userId || !_id) return;

    // const fetchPaymentsSummary = async () => {
    //   setIsPaymentsLoading(true);
    //   setPaymentsError(null);
    //   try {
    //     const apiUrl = `${url}/payments/user/${userId}/loan/${_id}/summary`;
    //     const response = await axios.get(apiUrl);
    //     console.log(response?.data, "sfsgsdg");
    //     setPaymentsSummary(response.data);
    //   } catch (err) {
    //     console.error("Axios loan payments summary error: ", err);
    //     setPaymentsError("Failed to fetch loan payments summary.");
    //     Toast.show({
    //       type: "error",
    //       text1: "Payments Error",
    //       text2: "Could not load loan payments summary.",
    //     });
    //   } finally {
    //     setIsPaymentsLoading(false);
    //   }
    // };
    const fetchPaymentsSummary = async () => {
  setIsPaymentsLoading(true);
  setPaymentsError(null);
  try {
    const apiUrl = `${url}/payments/user/${userId}/loan/${loanId}/summary`;
    console.log("Fetching summary from:",
  `${url}/payments/user/${userId}/loan/${_id}/summary`,
  "userId:", userId,
  "loanId:", loanId,
);
    const response = await axios.get(apiUrl);

    console.log("Payments summary response:", response.data);

    // handle aggregation array
    const summary = Array.isArray(response.data) ? response.data[0] : response.data;
    setPaymentsSummary(summary);
    console.log(summary);
  } catch (err) {
    console.error("Axios loan payments summary error: ", err);
    setPaymentsError("Failed to fetch loan payments summary.");
    Toast.show({
      type: "error",
      text1: "Payments Error",
      text2: "Could not load loan payments summary.",
    });
  } finally {
    setIsPaymentsLoading(false);
  }
};
    fetchPaymentsSummary();
  }, [userId, _id]);

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
      const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
      return (isNegative ? "-" : "") + formattedOtherNumbers + "," + lastThree + decimalPart;
    } else {
      return (isNegative ? "-" : "") + lastThree + decimalPart;
    }
  };

  // const handleViewPayments = () => {
  // set_id();
  // };

  const handleViewPayments = (loanId) => {
  set_id(loanId); // update the state with the loan’s ObjectId
  console.log(loanId, "testing my loanid");
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.outerBoxContainer}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#DC143C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {}}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.innerContentArea}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.sectionTitle}>My Loan</Text>
              <Text style={styles.subHeading}>Your current loan details and payment status.</Text>
            </View>

            {/* NEW: Display Payments Summary */}
            {_id && (
              <View style={[styles.loanCard, { backgroundColor: "#f0f8ff" }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: Colors.accentColor }]}>
                    <Ionicons name="stats-chart-outline" size={28} color={Colors.cardBackground} />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Total Payments for Loan</Text>
                    <Text style={styles.cardSubtitle}>Payments made for the selected loan.</Text>
                  </View>
                </View>
                {isPaymentsLoading ? (
                  <ActivityIndicator size="small" color={Colors.primaryBlue} />
                ) : paymentsError ? (
                  <Text style={{ color: "#DC143C" }}>{paymentsError}</Text>
                ) : (
                 <View style={styles.summaryItem}>
  <Text style={styles.detailValue}>
    ₹ {paymentsSummary ? formatNumberIndianStyle(paymentsSummary.totalPaidAmount || 0) : "N/A"}
  </Text>
</View>
                )}
              </View>
            )}

            {loans.length > 0 ? (
              loans.map((loan) => (
                <View key={loan.loan_id} style={styles.loanCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="wallet-outline"
                        size={28}
                        color={Colors.cardBackground}
                      />
                    </View>
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>Loan ID: {loan.loan_id.substring(0, 10)}...</Text>
                      <Text style={styles.cardSubtitle}>
                        Tenure: {loan.tenure} days
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Loan Amount</Text>
                      <Text style={styles.detailValue}>₹ {formatNumberIndianStyle(loan.loan_amount)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Start Date</Text>
                      <Text style={styles.detailValue}>{new Date(loan.start_date).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewPaymentsButton}
                    onPress={() => handleViewPayments(loan._id)}
                  >
                    <Text style={styles.viewPaymentsButtonText}>View Payments</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="documents-outline" size={60} color="#888" />
                <Text style={styles.emptyText}>No loans found.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.darkText,
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 14,
    color: Colors.mediumText,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: "#DC143C",
    textAlign: "center",
    marginTop: 14,
    fontWeight: "bold",
  },
  retryButton: {
    marginTop: 28,
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 16,
    paddingHorizontal: 34,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    marginHorizontal: 10,
    marginBottom: 50,
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
  innerContentArea: {
    flexGrow: 1,
    backgroundColor: Colors.cardBackground,
    paddingVertical: 35,
    paddingHorizontal: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loanCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.darkText,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.mediumText,
    marginTop: 2,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.mediumText,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.darkText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 240,
  },
  emptyText: {
    marginTop: 14,
    fontSize: 20,
    color: "#888",
    fontWeight: "bold",
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  viewPaymentsButton: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  viewPaymentsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MyLoan;