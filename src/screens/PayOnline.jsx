import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
  TouchableOpacity,
  Vibration,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import url from "../data/url";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoGroupImage from "../../assets/Nogroup.png";
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get("window");

const Colors = {
  brandPrimary: "#053B90",
  brandSecondary: "#0062FF",
  success: "#00C853",
  background: "#F8FAFC",
  white: "#FFFFFF",
  textMain: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  chipBlue: "#E0E7FF",
  chipText: "#4338CA",
};

const PayOnline = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId || null;

  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${url}/enroll/get-user-tickets/${userId}`);
      const data = response.data || [];
      const filtered = data.filter((item) => item.group_id);
      setCardsData(filtered);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleMakePayment = async (groupId, ticketCount) => {
    if (isProcessing) return;
    
    Vibration.vibrate(40);
    setIsProcessing(true);

    try {
      // Ensure the keys match exactly what your backend 'req.body' expects
      const payload = {
        userId: userId,
        groupId: groupId,
        ticket: ticketCount, 
        amount:"1"
      };

      console.log("Sending Payload:", payload);

      const response = await axios.post(`${url}/paymentapi/generate-payment-link`, payload);

      if (response.data && response.data.linkUrl) {
        const remoteUrl = response.data.linkUrl;
        
        // Open the generated link
        const canOpen = await Linking.canOpenURL(remoteUrl);
        if (canOpen) {
          await Linking.openURL(remoteUrl);
        } else {
          Alert.alert("Link Error", "Device cannot open this URL type.");
        }
      } else {
        Alert.alert("Error", response.data.message || "Payment link not received.");
      }
    } catch (error) {
      // DETAILED ERROR LOGGING
      if (error.response) {
        // Server responded with 500 or other error code
        console.error("Backend Error Data:", error.response.data);
        console.error("Status Code:", error.response.status);
        Alert.alert("Server Error", `Status ${error.response.status}: ${JSON.stringify(error.response.data.message || "Internal Error")}`);
      } else if (error.request) {
        // Request was made but no response received (Network issue)
        console.error("Network Error:", error.request);
        Alert.alert("Network Error", "No response from server. Check your connection.");
      } else {
        console.error("Error:", error.message);
        Alert.alert("Error", error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <LinearGradient
        colors={[Colors.brandPrimary, Colors.brandSecondary]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <Header userId={userId} navigation={navigation} />
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Make Online Payment</Text>
          {!loading && (
            <Text style={styles.statsText}>{cardsData.length} active chit accounts</Text>
          )}
        </View>
      </LinearGradient>

      <View style={styles.contentLayer}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.brandPrimary} />
            <Text style={styles.loadingText}>Fetching your accounts...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {cardsData.length > 0 ? (
              cardsData.map((item, index) => (
                <View key={item._id || index} style={styles.cardContainer}>
                  <View style={styles.premiumCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.chitChip}>
                        <Text style={styles.chitChipText}>CHIT PLAN</Text>
                      </View>
                      <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
                    </View>

                    <View style={styles.identitySection}>
                      <Text style={styles.memberStatus}>Active Member</Text>
                      <Text style={styles.groupCode}>{item.group_id?.group_name || "N/A"}</Text>
                    </View>

                    <View style={styles.dataGrid}>
                      <View style={styles.dataBox}>
                        <Text style={styles.dataLabel}>TICKET NO</Text>
                        <Text style={styles.dataValue}>{item.tickets}</Text>
                      </View>
                      <View style={[styles.dataBox, styles.dataBoxRight]}>
                        <Text style={styles.dataLabel}>STATUS</Text>
                        <View style={styles.statusRow}>
                          <View style={styles.pulseDot} />
                          <Text style={styles.statusText}>Active</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity 
                      activeOpacity={0.85}
                      style={[styles.payButton, isProcessing && { opacity: 0.6 }]}
                      onPress={() => handleMakePayment(item.group_id._id, item.tickets)}
                      disabled={isProcessing}
                    >
                      <LinearGradient
                        colors={["#00AB66", "#008F58"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.payButtonGradient}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Text style={styles.payButtonText}>MAKE PAYMENT</Text>
                            <MaterialIcons name="chevron-right" size={22} color="white" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Image source={NoGroupImage} style={styles.emptyImg} resizeMode="contain" />
                <Text style={styles.emptyTitle}>No Accounts Found</Text>
                <Text style={styles.emptySub}>You aren't enrolled in any groups yet.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    height: 220,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { marginTop: 15 },
  welcomeText: { color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statsText: { color: 'rgba(255,255,255,0.75)', fontSize: 16, marginTop: 4, fontWeight: '500' },
  contentLayer: { flex: 1, marginTop: -30 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: Colors.textMuted, fontSize: 14, fontWeight: '500' },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 10 },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 24,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chitChip: { backgroundColor: Colors.chipBlue, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  chitChipText: { color: Colors.chipText, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  identitySection: { marginBottom: 18 },
  memberStatus: { fontSize: 26, fontWeight: '800', color: Colors.textMain, letterSpacing: -0.8 },
  groupCode: { fontSize: 15, color: Colors.textMuted, fontWeight: '600', marginTop: 3 },
  dataGrid: { 
    flexDirection: 'row', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 18, 
    padding: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7'
  },
  dataBox: { flex: 1 },
  dataBoxRight: { alignItems: 'flex-end' },
  dataLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '800', letterSpacing: 1.2 },
  dataValue: { fontSize: 22, fontWeight: '700', color: Colors.textMain, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: 6 },
  statusText: { fontSize: 18, fontWeight: '800', color: Colors.success },
  payButton: { width: '100%', borderRadius: 15, overflow: 'hidden' },
  payButtonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16 
  },
  payButtonText: { color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 1, marginRight: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyImg: { width: 160, height: 160, opacity: 0.8 },
  emptyTitle: { color: Colors.textMain, fontSize: 20, fontWeight: '800', marginTop: 20 },
  emptySub: { color: Colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 }
});

export default PayOnline;