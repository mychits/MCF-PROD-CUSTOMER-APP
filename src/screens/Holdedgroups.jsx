import React, { useState, useEffect, useContext, useCallback } from "react";
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
  FlatList,
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
  warningText: "#F39C12",
  warningBackground: "#FEF9E7",
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

const Holdedgroups = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  
  const [heldCardsData, setHeldCardsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch data specifically for held groups
  const fetchHeldTickets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setHeldCardsData([]);
      return;
    }
    try {
      setLoading(true);
      // Reusing the same endpoint
      const response = await axios.get(`${url}/enroll/mobile-enrolls/users/${userId}`);
      const responseData = response.data.data || [];
      let allHeldCards = [];

      responseData.forEach(groupBlock => {
        // Only collecting mobileAppEnrolls (Pending Approval)
        if (groupBlock.mobileAppEnrolls && groupBlock.mobileAppEnrolls.length > 0) {
            const mobileCards = groupBlock.mobileAppEnrolls.map(card => ({
                ...card,
                tickets: card.no_of_tickets, 
                isPendingApproval: true, 
            }));
            allHeldCards.push(...mobileCards);
        }
      });

      setHeldCardsData(allHeldCards);
    } catch (error) {
      console.error("Error fetching held tickets:", error);
      setHeldCardsData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHeldTickets();
  }, [fetchHeldTickets]);

  useFocusEffect(
    useCallback(() => {
      fetchHeldTickets();
    }, [fetchHeldTickets])
  );

  const handleContactSupport = (groupName) => {
    // Placeholder functionality for contacting support
    alert(`Support request initiated for: ${groupName}`);
  };

  const renderHeldCard = ({ item, index }) => {
    const startDate = item.group_id?.start_date
      ? new Date(item.group_id?.start_date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'N/A';
    
    const endDate = item.group_id?.end_date
      ? new Date(item.group_id.end_date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'N/A';

    return (
      <View style={styles.cardWrapper}>
        <LinearGradient 
          colors={[Colors.warningBackground, "#FFF3E0"]} 
          style={styles.cardGradient}
        >
          <View style={styles.cardInner}>
            {/* Header Section */}
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="hourglass-outline" size={30} color={Colors.warningText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.group_id?.group_name}</Text>
                <Text style={styles.ticketText}>Ticket No: {item.tickets}</Text>
              </View>
            </View>

            {/* Status Banner */}
            <View style={styles.statusBanner}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.warningText} />
              <Text style={styles.statusText}>Approval Pending</Text>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Start Date</Text>
                    <Text style={styles.detailValue}>{startDate}</Text>
                </View>
                <View style={[styles.detailItem, styles.borderLeft]}>
                    <Text style={styles.detailLabel}>End Date</Text>
                    <Text style={styles.detailValue}>{endDate}</Text>
                </View>
            </View>
            
            <View style={styles.detailsGrid}>
                 <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Group Value</Text>
                    <Text style={styles.detailValue}>₹ {formatNumberIndianStyle(item.group_id.group_value)}</Text>
                </View>
                <View style={[styles.detailItem, styles.borderLeft]}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailValue, { color: Colors.warningText }]}>On Hold</Text>
                </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleContactSupport(item.group_id?.group_name)}
            >
                <FontAwesome5 name="headset" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>

          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
      
      {/* Standard Header */}
      <Header userId={userId} navigation={navigation} />

      <View style={styles.mainWrapper}>
        {loading ? (
          <View style={styles.fullScreenLoader}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          </View>
        ) : (
          <>
            <View style={styles.headerSection}>
                <Text style={styles.pageTitle}>Held Enrollments</Text>
                <Text style={styles.pageSubtitle}>
                    These groups are currently under review by the MyChits team.
                </Text>
            </View>

            <FlatList
              data={heldCardsData}
              renderItem={renderHeldCard}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Image source={NoGroupImage} style={styles.noGroupImage} resizeMode="contain" />
                  <Text style={styles.noGroupText}>No held groups found.</Text>
                  <Text style={styles.noGroupSubText}>All your groups have been approved!</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 10,
  },
  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
      padding: 20,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      backgroundColor: '#fff',
  },
  pageTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors.darkText,
      marginBottom: 5,
  },
  pageSubtitle: {
      fontSize: 14,
      color: Colors.mediumText,
      textAlign: 'center',
  },
  listContent: {
      padding: 20,
      paddingBottom: 30,
  },
  cardWrapper: {
    marginBottom: 20,
    borderRadius: 15,
    // Shadow for card
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  cardGradient: {
    borderRadius: 15,
    padding: 2, // Gradient border width
  },
  cardInner: {
    backgroundColor: "#fff",
    borderRadius: 13,
    padding: 15,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.warningBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: Colors.warningText
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.darkText,
  },
  ticketText: {
    fontSize: 14,
    color: Colors.mediumText,
    marginTop: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBackground,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  statusText: {
      color: Colors.warningText,
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 6,
  },
  detailsGrid: {
      flexDirection: 'row',
      marginBottom: 15,
  },
  detailItem: {
      flex: 1,
  },
  borderLeft: {
      borderLeftWidth: 1,
      borderLeftColor: '#F0F0F0',
      paddingLeft: 10,
  },
  detailLabel: {
      fontSize: 12,
      color: Colors.mediumText,
      marginBottom: 4,
  },
  detailValue: {
      fontSize: 15,
      fontWeight: 'bold',
      color: Colors.darkText,
  },
  contactButton: {
      flexDirection: 'row',
      backgroundColor: Colors.warningText,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 5,
  },
  contactButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noGroupImage: { width: 150, height: 150, marginBottom: 20 },
  noGroupText: { fontSize: 18, fontWeight: "bold", color: Colors.darkText, marginBottom: 10 },
  noGroupSubText: { fontSize: 14, color: Colors.mediumText, textAlign: "center" },
});

export default Holdedgroups;