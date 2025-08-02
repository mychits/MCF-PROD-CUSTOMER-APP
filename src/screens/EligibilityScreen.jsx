import React, { useContext } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons"; // Already imported for MaterialIcons
import { FontAwesome } from "@expo/vector-icons"; // Import FontAwesome for WhatsApp icon
import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";

const EligibilityScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();

  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  const handleWebsiteLink = async () => {
    const websiteUrl = "https://mychits.co.in/";
    try {
      const supported = await Linking.canOpenURL(websiteUrl);
      if (supported) {
        await Linking.openURL(websiteUrl);
      } else {
        console.warn(`Don't know how to open this URL: ${websiteUrl}`);
      }
    } catch (error) {
      console.error("Error opening website:", error);
    }
  };

  const handleWhatsAppLink = async () => {
    const whatsappNumber = "+919900088888"; // Example: +919876543210
    const whatsappMessage =
      "Hello, I have a question about chit fund eligibility.";
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(
      whatsappMessage
    )}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert("WhatsApp is not installed on your device.");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      alert("Could not open WhatsApp. Please ensure it is installed.");
    }
  };

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
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <Header userId={userId} navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.mainContentContainer}>
          <Text style={styles.mainTitle}>Chit Fund Eligibility Criteria</Text>
          <Text style={styles.description}>
            To ensure a smooth and secure experience for all our subscribers,
            please review the following eligibility requirements before joining
            a chit group. Adherence to these guidelines ensures a transparent
            and mutually beneficial arrangement for all participants.
          </Text>
          <Text style={styles.sectionTitle}>1. Basic Eligibility Criteria</Text>
          <Text style={styles.sectionDescription}>
            These are the fundamental requirements for all our potential
            subscribers.
          </Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Age:</Text> Applicants must be
              18 years of age or older.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Indian Resident:</Text>{" "}
              Available only to Indian citizens residing in Karnataka.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Sound Mind:</Text> Applicants
              must be of sound mind and capable of entering into a legal
              contract.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>
                Not an Undischarged Insolvent:
              </Text>{" "}
              Applicants must not be an undischarged insolvent.
            </Text>
          </View>
          <Text style={styles.sectionTitle}>
            2. Financial Stability & Ability to Pay
          </Text>
          <Text style={styles.sectionDescription}>
            Your ability to consistently make payments is crucial for the
            success of the chit group.
          </Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Income Proof:</Text> Proof of
              regular income (e.g., salary slips for the last 3-6 months, bank
              statements, ITRs for businesspersons/professionals).
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Minimum Income:</Text> A minimum
              monthly income of ₹10000 is generally required. (This will vary
              based on your chosen chit plan).
            </Text>
          </View>

          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>
                Comfortable Chit Installment:
              </Text>{" "}
              We recommend choosing a chit plan where the monthly installment is
              comfortable for your budget. Ensure your balance available after
              essential expenses can cover the installment.
            </Text>
          </View>
          <Text style={styles.sectionTitle}>
            3. KYC (Know Your Customer) Documents
          </Text>
          <Text style={styles.sectionDescription}>
            To complete your application and comply with regulatory
            requirements, please provide self-attested copies of the following
            documents:
          </Text>
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>
              Identity Proof (Any one):
            </Text>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItemText}>PAN Card (Mandatory)</Text>
            </View>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>Aadhar Card</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>Voter ID</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>Passport</Text>
          </View>
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>
              Address Proof (Any one, usually recent):
            </Text>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItemText}>
                Aadhar Card / Voter ID / Passport (if current address)
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItemText}>
                Latest Utility Bills (Electricity Bill, Gas Bill, Mobile Bill -
                not older than 3 months)
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItemText}>
                Bank Statement (with current address)
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItemText}>
                House Tax Receipt (for property owners)
              </Text>
            </View>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>
                Recent Passport-sized Photograph
              </Text>
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Bank Account Details:</Text> For
              monthly payments and prize money disbursement.
            </Text>
          </View>
          <Text style={styles.sectionTitle}>
            4. Conditions for Prize Money Disbursement
          </Text>
          <Text style={styles.sectionDescription}>
            After winning an auction, certain conditions must be met to receive
            your prize money:
          </Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>No Pending Dues:</Text> All your
              previous installments must be paid up to date.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Security Requirements:</Text>{" "}
              You must fulfill the security requirements as per your chit
              agreement. This may include providing post-dated cheques, or a
              suitable guarantor.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Guarantor Eligibility:</Text> If
              a guarantor is required, they must meet our eligibility criteria
              (e.g., age, income proof, credit score, KYC documents).
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>
                Minimum Installments Paid:
              </Text>{" "}
              (If applicable) You must have paid a minimum of [X] installments
              to be eligible to bid for the prize money.
            </Text>
          </View>
          <Text style={styles.sectionTitle}>
            5. Important Disclaimers & Advice
          </Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>
                Read Terms and Conditions:
              </Text>{" "}
              Please read the complete Terms and Conditions of our chit schemes
              carefully before enrolling.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>Financial Planning:</Text>{" "}
              Choose a chit value and installment that comfortably aligns with
              your financial capacity to avoid discontinuation.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>
              <Text style={styles.listItemBold}>
                Consequences of Discontinuation:
              </Text>{" "}
              Be aware that defaulting on installments or discontinuing a chit
              can have financial implications as per the chit agreement.
            </Text>
          </View>

          <Text style={styles.footerText}>
            Meeting these eligibility criteria is essential for a successful and
            compliant participation in our chit fund schemes. For any further
            clarifications or assistance, please contact our customer support.
          </Text>

          <LinearGradient
            colors={["#F0F8FF", "#F8F8F8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.appInfoFooter}
          >
            {/* WhatsApp Button */}
            <TouchableOpacity
              onPress={handleWhatsAppLink}
              style={styles.whatsappButton}
            >
              <FontAwesome name="whatsapp" size={24} color="#25D366" />
              <Text style={styles.whatsappButtonText}>
                Chat with us on WhatsApp
              </Text>
            </TouchableOpacity>

            {/* Website Link */}
            <TouchableOpacity onPress={handleWebsiteLink}>
              <Text style={styles.appInfoWebsiteLink}>
                Visit our Website:{" "}
                <Text style={{ fontWeight: "bold" }}>mychits.co.in</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.madeWithLoveContainer}>
              <Text style={styles.appInfoMadeWithLove}>
                Made with <Text style={{ color: "#E53935" }}>❤️</Text> in India
              </Text>
              <MaterialIcons
                name="public"
                size={16}
                color="#4CAF50"
                style={styles.madeInIndiaIcon}
              />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 1,
    paddingBottom: 30,
    backgroundColor: "#053B90",
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 18,
      },
    }),
    borderWidth: 5,
    borderColor: "#053B90",
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#053B90",
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#555555",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#053B90",
    marginTop: 25,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EBF5",
    paddingBottom: 5,
    paddingLeft: 5,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    paddingVertical: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionDescription: {
    fontSize: 15,
    color: "#666666",
    marginBottom: 15,
    lineHeight: 22,
  },
  subSection: {
    marginLeft: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: "#053B90",
    marginRight: 8,
    lineHeight: 22,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: "#444444",
    lineHeight: 22,
  },
  listItemBold: {
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 14,
    color: "#777777",
    marginTop: 30,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
  appInfoFooter: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 0,
    paddingVertical: 25,
    paddingHorizontal: 25,
    width: "95%",
    alignSelf: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 18,
    overflow: "hidden",
  },
  appInfoWebsiteLink: {
    fontSize: 17,
    color: "#004",
    textDecorationLine: "underline",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.05)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  madeWithLoveContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "center",
  },
  appInfoMadeWithLove: {
    fontSize: 15,
    color: "#4A4A4A",
    fontStyle: "normal",
    fontWeight: "normal",
    letterSpacing: 0.3,
  },
  madeInIndiaIcon: {
    marginLeft: 8,
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 15, // Added margin-bottom to separate from the website link
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  whatsappButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
  },
});

export default EligibilityScreen;
