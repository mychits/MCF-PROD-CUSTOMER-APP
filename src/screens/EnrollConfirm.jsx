import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import Toast from "react-native-toast-message";
import { ContextProvider } from "../context/UserProvider";

const EnrollConfirm = ({ navigation, route }) => {
  const { group_name, tickets, installmentAmount } = route?.params || {};
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  const [scaleValue] = useState(new Animated.Value(0));

  const { isConnected, isInternetReachable } = useContext(NetworkContext);
  
  const phoneNumber = '+919483900777';

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();

    if (!isConnected || !isInternetReachable) {
      Toast.show({
        type: "info",
        text1: "Offline Mode",
        text2: "Some features might be limited without internet.",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  }, [scaleValue, isConnected, isInternetReachable]);

  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleGoToMyGroups = () => {
    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Navigation Error",
        text2: "User ID is missing. Cannot navigate to My Groups.",
        position: "bottom",
        visibilityTime: 3000,
      });
      return; 
    }

    navigation.navigate("BottomTab", {
      screen: "PaymentScreen",
      params: { userId: userId }, 
    });
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#053B90" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header userId={userId} navigation={navigation} />
      <View style={styles.mainContentWrapper}>
        <View style={styles.contentCard}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <AntDesign name="checkcircle" size={80} color="#28A745" />
          </Animated.View>

          <Text style={styles.congratulationsText}>
            Enrollment Confirmed!
          </Text>
          
          <Text style={styles.favorableStatement}>
            You've taken the first step toward achieving your goals! Welcome aboard.
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Feather name="layers" size={16} color="#053B90" style={styles.detailIcon} />
              <Text style={styles.detailItem}>
                Group: <Text style={styles.detailValue}>{group_name}</Text>
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="tag" size={16} color="#053B90" style={styles.detailIcon} />
              <Text style={styles.detailItem}>
                Tickets Enrolled: <Text style={styles.detailValue}>{tickets}</Text>
              </Text>
            </View>
            {installmentAmount && (
              <View style={styles.detailRow}>
                <Feather name="dollar-sign" size={16} color="#28A745" style={styles.detailIcon} />
                <Text style={styles.detailItem}>
                  Installment: <Text style={[styles.detailValue, styles.installmentValue]}>${installmentAmount}</Text>
                </Text>
              </View>
            )}
            
            <View style={styles.pendingRow}>
                <Ionicons name="time-outline" size={16} color="#FFC107" style={styles.detailIcon} />
                <Text style={styles.pendingText}>Status: Activation Pending</Text>
            </View>

          </View>
          
          <Text style={styles.infoText}>
            Our team is reviewing your details now! We'll notify you as soon as your group is fully active.
          </Text>

          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Quick Support Line</Text>
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <Feather name="phone-call" size={16} color="#fff" />
              <Text style={styles.contactButtonText}>Call Us: {phoneNumber}</Text>
            </TouchableOpacity>
          </View>

          {!isConnected && (
            <View style={styles.offlineBox}>
              <Text style={styles.offlineIndicator}>
                You are currently offline.
              </Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.button} onPress={handleGoToMyGroups}>
            <Text style={styles.buttonText}>VIEW MY GROUPS</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  mainContentWrapper: {
    flex: 1,
    alignItems: "center",
    // MODIFICATION: Changed alignment to push content towards the top
    justifyContent: "flex-start", 
    paddingTop: 40, // Added vertical padding to give some space from the header
    paddingBottom: 20,
  },
  contentCard: {
    // MODIFICATION: Removed flex: 1 to allow the card to take only the required space
    backgroundColor: "#fff",
    width: "95%",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    alignItems: "center",
  },
  congratulationsText: {
    fontSize: 26, 
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 5,
    color: "#053B90",
  },
  favorableStatement: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 15,
    maxWidth: '90%',
  },
  detailsContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1, 
    borderColor: '#E0E7FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 1)',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    marginTop: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFC107',
  },
  detailIcon: {
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  detailItem: {
    fontSize: 16,
    color: "#333",
  },
  detailValue: {
    fontWeight: '700',
    color: '#000',
  },
  installmentValue: {
    color: '#28A745', 
    fontSize: 16,
    fontWeight: '900',
  },
  pendingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFC107',
  },
  infoText: { 
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
    fontWeight: '500',
  },
  contactCard: {
    backgroundColor: '#E6EEF9', 
    padding: 12,
    borderRadius: 10,
    width: '95%',
    alignItems: 'center',
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#053B90',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#053B90',
    marginBottom: 5,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#053B90',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  offlineBox: {
    borderWidth: 1,
    borderColor: 'orange',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#FFF8E1', 
  },
  offlineIndicator: {
    fontSize: 13,
    color: "orange",
    textAlign: "center",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#28A745",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EnrollConfirm;