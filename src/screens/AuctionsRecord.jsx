import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image, // Import Image component
  StatusBar, // Import StatusBar for SafeAreaView
  SafeAreaView, // Import SafeAreaView
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import url from "../data/url";
import Header from "../components/layouts/Header";
import axios from "axios";
import { NetworkContext } from "../context/NetworkProvider";

import NoDataIllustration from "../../assets/9264885.jpg";
import { ContextProvider } from "../context/UserProvider";

const AuctionsRecord = ({ route, navigation }) => {
  const { groupId, ticket } = route.params;
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [isFromDatePickerVisible, setFromDatePickerVisible] = useState(false);
  const [isToDatePickerVisible, setToDatePickerVisible] = useState(false); // Corrected line
  const [groups, setGroups] = useState({});
  const [paymentData, setPaymentData] = useState([]); // This state holds auction records
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  const handleFromDateChange = (event, selectedDate) => {
    setFromDatePickerVisible(false);
    if (selectedDate) {
      setFromDate(selectedDate);
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    setToDatePickerVisible(false);
    if (selectedDate) {
      setToDate(selectedDate);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !isInternetReachable) {
        setLoading(false);
        setError("No internet connection. Please check your network.");
        setPaymentData([]); // Clear any old data
        return;
      }

      setLoading(true); // Start loading
      setError(null); // Clear previous errors
      try {
        const groupResponse = await fetch(
          `${url}/group/get-by-id-group/${groupId}`
        );
        if (groupResponse.ok) {
          const data = await groupResponse.json();
          setGroups(data);
        } else {
          console.error("Failed to fetch groups.");

          setError("Failed to load group details.");
        }

        const auctionResponse = await fetch(
          `${url}/auction/get-group-auction/${groupId}`
        );
        if (auctionResponse.ok) {
          const data = await auctionResponse.json();
          setPaymentData(data); // This state holds auction records
        } else {
          console.error("Failed to fetch auctions.");

          setError("NO_AUCTION_DATA");
          setPaymentData([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchData();
  }, [groupId, isConnected, isInternetReachable]); // Depend on groupId and network status

  const totalPayableAmount =
    groups.group_type === "double"
      ? parseInt(groups.group_install || 0) +
        parseInt(groups.group_install || 0) * paymentData.length
      : parseInt(groups.group_install || 0) +
        paymentData.reduce(
          (total, card) => total + parseInt(card.payable || 0),
          0
        ) +
        (paymentData[0]?.divident_head
          ? parseInt(paymentData[0].divident_head)
          : 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeAreaLoader}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isConnected || !isInternetReachable) {
    return (
      <SafeAreaView style={styles.safeAreaLoader}>
        <View style={styles.loaderContainer}>
          <Text style={styles.networkStatusText}>
            You are currently offline. Please check your internet connection.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null); // Clear error before retrying
              fetchData(); // Call fetchData again to retry
            }}
          >
          </TouchableOpacity>
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginHorizontal: 0,
            }}
          >
            <View style={styles.dropdownContainer}>
              <Text style={styles.headerText}>Auctions</Text>
            </View>
            <View style={styles.dropdownContainer}>
              <Text style={[styles.headerText, { color: "green" }]}>
                ₹{totalPayableAmount}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View
              key={groups._id || "commencement"} // Use a unique key for commencement
              style={[styles.cards]}
            >
              <View style={styles.row}>
                <Text style={styles.leftText}>Comencement</Text>
                <Text
                  style={[
                    styles.rightText,
                    { fontWeight: "900", color: "green" },
                  ]}
                >
                  Payable: ₹{groups.group_install || 0}
                </Text>
              </View>
            </View>
            {paymentData.length > 0 ? (
              paymentData.map((card, index) => (
                <View
                  key={card._id}
                  style={[
                    styles.cards,
                    selectedCardIndex === index && styles.selectedCard,
                  ]}
                >
                  <View style={styles.row}>
                    <Text style={styles.leftText}>
                      Auction Date:{" "}
                      {card.auction_date
                        ? card.auction_date.split("-").reverse().join("-")
                        : "N/A"}
                    </Text>
                    <Text style={styles.rightText}>
                      Next Date:{" "}
                      {card.next_date
                        ? card.next_date.split("-").reverse().join("-")
                        : "N/A"}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.leftText}>
                      Win Ticket: {card.ticket || "N/A"}
                    </Text>
                    <Text
                      style={[
                        styles.rightText,
                        { fontWeight: "900", color: "green" },
                      ]}
                    >
                      Payable: ₹
                      {groups.group_type === "double"
                        ? groups.group_install || 0
                        : index === 0
                        ? parseInt(card.payable || 0) +
                          parseInt(paymentData[0].divident_head || 0)
                        : parseInt(card.payable || 0)}
                    </Text>
                  </View>
                </View>
              ))
            ) : error === "NO_AUCTION_DATA" ? (
              <View style={styles.noDataContainer}>
                <Image
                  source={NoDataIllustration}
                  style={styles.noDataImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setError(null); // Clear error before retrying
                    fetchData(); // Call fetchData again to retry
                  }}
                >
                </TouchableOpacity>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <View style={styles.noDataContainer}>
                <Image
                  source={NoDataIllustration}
                  style={styles.noDataImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </ScrollView>
          {isFromDatePickerVisible && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display="default"
              onChange={handleFromDateChange}
            />
          )}

          {isToDatePickerVisible && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display="default"
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
    paddingTop: StatusBar.currentHeight || 0,
  },
  safeAreaLoader: {
    flex: 1,
    backgroundColor: "#053B90",
    paddingTop: StatusBar.currentHeight || 0,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: "",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#fff",
    width: "95%",
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
    backgroundColor: "#053B90",
  },
  dropdownContainer: {
    backgroundColor: "transparent",
    marginBottom: 0,
    alignItems: "center",
  },
  headerText: {
    marginVertical: 10,
    fontWeight: "900",
    fontSize: 18,
    textAlign: "center",
    color: "#333",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  dateInputWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateInput: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginTop: 5,
  },
  scrollContainer: {
    paddingBottom: 15,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  leftText: {
    flex: 1,
    textAlign: "left",
    fontSize: 14,
    color: "#333",
  },
  rightText: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    color: "#333",
  },
  cards: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
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
    borderWidth: 1,
    borderColor: "#007bff",
  },
  leftSide: {
    flex: 1,
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupName: {
    fontWeight: "700",
    fontSize: 18,
  },
  profitText: {
    fontSize: 12,
    marginRight: 10,
    color: "green",
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
  },

  networkStatusText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noDataImage: {
    width: 300,
    height: 300,
    marginBottom: 50,
  },
});

export default AuctionsRecord;
