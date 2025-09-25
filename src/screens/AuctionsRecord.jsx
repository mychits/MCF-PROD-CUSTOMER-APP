import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import url from "../data/url";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import { ContextProvider } from "../context/UserProvider";
import NoDataIllustration from "../../assets/9264885.jpg";

const AuctionsRecord = ({ route, navigation }) => {
  const { groupId, ticket } = route.params;
  const [appUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [groups, setGroups] = useState({});
  const [auctionData, setAuctionData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  // Fetch group info and auction list
  const fetchData = async () => {
    if (!isConnected || !isInternetReachable) {
      setLoading(false);
      setError("No internet connection. Please check your network.");
      setAuctionData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Group details
      const groupRes = await fetch(`${url}/group/get-by-id-group/${groupId}`);
      if (groupRes.ok) {
        setGroups(await groupRes.json());
      } else {
        setError("Failed to load group details.");
      }

      // Auctions with bid_amount & bid_percentage
      const auctionRes = await fetch(`${url}/auction/group/${groupId}`);
      if (auctionRes.ok) {
        const data = await auctionRes.json();
        setAuctionData(Array.isArray(data) ? data : []);
      } else {
        setError("NO_AUCTION_DATA");
        setAuctionData([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId, isConnected, isInternetReachable]);

  const totalPayableAmount =
    groups.group_type === "double"
      ? parseInt(groups.group_install || 0) * (auctionData.length + 1)
      : parseInt(groups.group_install || 0) +
        auctionData.reduce((t, a) => t + parseInt(a.payable || 0), 0) +
        (auctionData[0]?.divident_head
          ? parseInt(auctionData[0].divident_head)
          : 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeAreaLoader}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!isConnected || !isInternetReachable) {
    return (
      <SafeAreaView style={styles.safeAreaLoader}>
        <Text style={styles.networkStatusText}>
          You are offline. Check your internet connection.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Header userId={userId} navigation={navigation} />

      <View style={styles.mainContentWrapper}>
        <View style={styles.contentCard}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Auctions</Text>
            <Text style={[styles.headerText, { color: "green" }]}>
              ₹{totalPayableAmount}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Commencement card */}
            <View key="commencement" style={styles.cards}>
              <View style={styles.row}>
                <Text style={styles.leftText}>Commencement</Text>
                <Text style={[styles.rightText, { fontWeight: "900", color: "green" }]}>
                  Payable: ₹{groups.group_install || 0}
                </Text>
              </View>
            </View>

            {/* Auction records */}
            {auctionData.length > 0 ? (
              auctionData.map((item) => (
                <View key={item._id} style={styles.cards}>
                  <View style={styles.row}>
                    <Text style={styles.leftText}>
                      Auction Date:{" "}
                      {item.auction_date
                        ? item.auction_date.split("-").reverse().join("-")
                        : "N/A"}
                    </Text>
                    <Text style={styles.rightText}>
                      Next Date:{" "}
                      {item.next_date
                        ? item.next_date.split("-").reverse().join("-")
                        : "N/A"}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.leftText}>
                      Win Ticket: {item.ticket || "N/A"}
                    </Text>
                    <Text style={[styles.rightText, { fontWeight: "900", color: "green" }]}>
                      Payable: ₹
                      {groups.group_type === "double"
                        ? groups.group_install || 0
                        : parseInt(item.payable || 0)}
                    </Text>
                  </View>

                  {/* 🔑 NEW Fields */}
                  <View style={styles.row}>
                    <Text style={[styles.leftText, { fontWeight: "bold" }]}>Bid Amount:</Text>
                    <Text style={styles.rightText}>₹{item.bid_amount ?? 0}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.leftText, { fontWeight: "bold" }]}>Bid Percentage:</Text>
                    <Text style={styles.rightText}>
                      {item.bid_percentage ?? 0}%
                    </Text>
                  </View>
                </View>
              ))
            ) : error === "NO_AUCTION_DATA" ? (
              <View style={styles.noDataContainer}>
                <Image source={NoDataIllustration} style={styles.noDataImage} resizeMode="contain" />
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: "#053B90" }]}
                  onPress={fetchData}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.errorText}>{error || "No auction data."}</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Styles unchanged except for a small headerRow helper ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#053B90", paddingTop: StatusBar.currentHeight || 0 },
  safeAreaLoader: {
    flex: 1,
    backgroundColor: "#053B90",
    justifyContent: "center",
    alignItems: "center",
  },
  mainContentWrapper: { flex: 1, alignItems: "center", paddingVertical: 10 },
  contentCard: {
    flex: 1,
    backgroundColor: "#fff",
    width: "95%",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  headerText: { marginVertical: 10, fontWeight: "900", fontSize: 18, color: "#333" },
  scrollContainer: { paddingBottom: 15, flexGrow: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  leftText: { flex: 1, textAlign: "left", fontSize: 14, color: "#333" },
  rightText: { flex: 1, textAlign: "right", fontSize: 14, color: "#333" },
  cards: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
  errorText: { color: "red", textAlign: "center", marginTop: 20, fontSize: 16 },
  networkStatusText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  noDataContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 50 },
  noDataImage: { width: 300, height: 300, marginBottom: 50 },
});

export default AuctionsRecord;
