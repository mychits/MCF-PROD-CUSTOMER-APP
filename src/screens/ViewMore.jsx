import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  StatusBar,
  SafeAreaView,
  Platform, // Don't forget Platform for platform-specific styles/logic
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import url from "../data/url";
import Header from "../components/layouts/Header";
import axios from "axios";
import NoDataIllustration from "../../assets/9264885.jpg";
import { ContextProvider } from "../context/UserProvider";

const ViewMore = ({ route, navigation }) => {
  const { groupId, ticket } = route.params;
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [selectedCardIndex, setSelectedCardIndex] = useState(null); // This state isn't currently used, consider removing if not needed later.
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [isFromDatePickerVisible, setFromDatePickerVisible] = useState(false);
  const [isToDatePickerVisible, setToDatePickerVisible] = useState(false);
  const [groups, setGroups] = useState({});
  const [allPaymentData, setAllPaymentData] = useState([]); // Store all fetched data
  const [filteredPaymentData, setFilteredPaymentData] = useState([]); // Data to display
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState("all"); // Default to "all"
  const statusOptions = [
    { label: "All Transactions", value: "all" },
    { label: "Paid", value: "paid" },
    { label: "Pending", value: "pending" },
  ];

  const handleFromDateChange = (event, selectedDate) => {
    setFromDatePickerVisible(false);
    if (selectedDate) {
      setFromDate(selectedDate);
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    setToDatePickerVisible(false);
    if (selectedDate) {
      // Set the "To Date" to the end of the selected day for inclusive filtering
      const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);
      setToDate(endOfDay);
    }
  };

  const applyFilters = (data, statusFilter, from, to) => {
    let tempFilteredData = data;

    if (from && to) {
      const fromTime = from.getTime();
      const toTime = to.getTime(); // toDate is already set to end of day in handleToDateChange
      tempFilteredData = tempFilteredData.filter((item) => {
        const itemDate = new Date(item.pay_date).getTime();
        return itemDate >= fromTime && itemDate <= toTime;
      });
    }

    // Applying status filter
    if (statusFilter !== "all") {
      tempFilteredData = tempFilteredData.filter((item) => {
        // IMPORTANT: Adjust these conditions based on your actual data structure
        // and how "paid" and "pending" are truly determined in your backend.
        // For example, if there's a 'status' field like item.status === 'completed'
        if (statusFilter === "paid") {
          return item.amount > 0; // Assuming any payment with amount > 0 is "paid"
        }
        if (statusFilter === "pending") {
          return item.amount === 0; // Assuming payment with amount === 0 is "pending"
          // Or if you have a 'pending' status from the backend: item.status === 'pending'
        }
        return true;
      });
    }

    return tempFilteredData;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const groupResponse = await fetch(
          `${url}/group/get-by-id-group/${groupId}`
        );
        if (groupResponse.ok) {
          const groupData = await groupResponse.json();
          setGroups(groupData);
        } else {
          console.error("Failed to fetch groups.");
        }

        const paymentResponse = await fetch(`${url}/payment/payment-list`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupId: groupId,
            userId: userId,
            ticket: ticket,
          }),
        });

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          setError(
            errorData.message || "An error occurred fetching payment data"
          );
          setAllPaymentData([]);
          setFilteredPaymentData([]);
        } else {
          const data = await paymentResponse.json();
          if (data.success) {
            // Sort data by pay_date descending immediately after fetching
            const sortedData = data.data.sort((a, b) => new Date(b.pay_date) - new Date(a.pay_date));
            setAllPaymentData(sortedData);

            // Apply initial filters
            const currentFilteredData = applyFilters(
              sortedData,
              selectedStatus,
              fromDate,
              toDate
            );
            setFilteredPaymentData(currentFilteredData);
            setError(null);
          } else {
            setError(data.message || "No data available");
            setAllPaymentData([]);
            setFilteredPaymentData([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, userId, ticket]); // Only re-fetch when these params change

  useEffect(() => {
    // Re-apply filters whenever selectedStatus, fromDate, toDate, or allPaymentData changes
    const currentFilteredData = applyFilters(
      allPaymentData,
      selectedStatus,
      fromDate,
      toDate
    );
    setFilteredPaymentData(currentFilteredData);
  }, [selectedStatus, fromDate, toDate, allPaymentData]); // Re-run when filters or raw data changes

  // Helper function to format numbers with commas in Indian style (e.g., 2,51,500)
  const formatNumberIndianStyle = (num) => {
    if (num === null || num === undefined) {
      return "0";
    }
    const parts = num.toString().split('.');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    let isNegative = false;
    if (integerPart.startsWith('-')) {
      isNegative = true;
      integerPart = integerPart.substring(1);
    }

    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      return (isNegative ? '-' : '') + formattedOtherNumbers + ',' + lastThree + decimalPart;
    } else {
      return (isNegative ? '-' : '') + lastThree + decimalPart;
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.loaderSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#053B90" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Header userId={userId} navigation={navigation} />
      <View style={styles.mainContentWrapper}>
        <View style={styles.contentCard}>
          <View style={styles.dropdownContainer}>
            <Text style={styles.headerText}>Transactions</Text>

            

            {/* Date Filters */}
            <View style={styles.dateContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateLabel}>From Date</Text>
                <TouchableOpacity
                  onPress={() => setFromDatePickerVisible(true)}
                  style={styles.dateInput}
                >
                  <TextInput
                    placeholder="From Date"
                    // Format date for display as YYYY-MM-DD
                    value={fromDate.toISOString().split("T")[0]}
                    editable={false}
                    style={styles.dateTextInput}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateLabel}>To Date</Text>
                <TouchableOpacity
                  onPress={() => setToDatePickerVisible(true)}
                  style={styles.dateInput}
                >
                  <TextInput
                    placeholder="To Date"
                    // Format date for display as YYYY-MM-DD
                    value={toDate.toISOString().split("T")[0]}
                    editable={false}
                    style={styles.dateTextInput}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Transaction List ScrollView */}
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={true} // Ensure scroll indicator is visible
          >
            {filteredPaymentData.length > 0 ? (
              filteredPaymentData.map((card, index) => (
                <View
                  key={card._id}
                  style={[
                    styles.cards,
                    // If you want to highlight a selected card, you can use this:
                    // selectedCardIndex === index && styles.selectedCard,
                  ]}
                >
                  <View style={styles.leftSide}>
                    <Text style={styles.receiptText}>
                      
                      {card.receipt_no
                        ? card.receipt_no
                        : card.old_receipt_no || ""}
                    </Text>
                  </View>
                  <View style={styles.centerSide}>
                    <Text style={styles.dateDisplayProfitText}>
                      {new Date(card.pay_date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.rightSide}>
                    <Text style={styles.amountText}>
                      ₹{formatNumberIndianStyle(card.amount)}
                    </Text>
                  </View>
                </View>
              ))
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <View style={styles.noTransactionsContainer}>
                <Image
                  source={NoDataIllustration}
                  style={styles.noTransactionsImage}
                  resizeMode="contain"
                />
                <Text style={styles.noTransactionsFoundText}>
                  No transactions found 
                </Text>
              </View>
            )}
          </ScrollView>

          {/* From Date Picker */}
          {isFromDatePickerVisible && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'} // 'spinner' for iOS is usually better
              onChange={handleFromDateChange}
            />
          )}

          {/* To Date Picker */}
          {isToDatePickerVisible && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleToDateChange}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loaderSafeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: "#053B90",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  contentCard: {
    flex: 1, // Allows this card to expand and take available space
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  dropdownContainer: {
    backgroundColor: "transparent",
    marginBottom: 20,
    alignItems: "center", // Center items horizontally
  },
  headerText: {
    marginVertical: 10,
    fontWeight: "900",
    fontSize: 20,
    textAlign: "center",
    color: "#333",
  },
  pickerLabel: {
    fontSize: 15,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
    alignSelf: "flex-start", // Align left within its parent
    marginLeft: 10, // Indent slightly
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: "100%",
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  pickerItem: {
    fontSize: 16,
    color: "#333",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    width: "90%",
  },
  dateInputWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 15,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  dateInput: {
    paddingVertical: 10, // Increased padding for touch area
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginTop: 5,
    minHeight: 40, // Ensure a minimum height
  },
  dateTextInput: {
    fontSize: 14,
    color: "#333",
  },
  // --- Adjusted this style for more space ---
  scrollContainer: {
    paddingBottom: 70, // Increased padding at the bottom
  },
  // --- End of adjustment ---
  cards: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15, // Slightly less padding to fit more on screen
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  selectedCard: {
    backgroundColor: "#e6f2ff", // Light blue highlight for selected
    borderColor: "#053B90", // Darker blue border
  },
  leftSide: {
    flex: 1.2, // Give more space to receipt number
    justifyContent: "center",
    alignItems: "flex-start",
  },
  centerSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rightSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  amountText: { // Renamed from groupName for clarity
    fontWeight: "700",
    fontSize: 18,
    color: "#053B90", // Highlight amount with theme color
  },
  receiptText: { // Renamed from profitText for clarity
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dateDisplayProfitText: { // Renamed from profitText for clarity
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  noTransactionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noTransactionsImage: {
    width: 200,
    height: 200,
    marginBottom: 20, // Adjusted margin bottom for the image
    // Removed marginLeft: 60 as it seemed arbitrary and might misalign on smaller screens.
    // Centering with alignItems: "center" on parent is usually sufficient.
  },
  noTransactionsFoundText: { // Added a specific style for this text
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 10,
  },
});

export default ViewMore;