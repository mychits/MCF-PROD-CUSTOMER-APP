import React, { useState, useEffect, useContext, useRef } from "react";
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
  Linking,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/layouts/Header";
import { NetworkContext } from "../context/NetworkProvider";
import { ContextProvider } from "../context/UserProvider";
import Toast from "react-native-toast-message";
import url from "../data/url";
import axios from "axios";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Colors = {
  primaryBlue: "#053B90",
  lightBackground: "#F5F8FA",
  cardBackground: "#FFFFFF",
  darkText: "#212529",
  mediumText: "#6C757D",
  accentColor: "#28A745",
  shadowColor: "rgba(0,0,0,0.2)",
  vibrantBlue: "#17A2B8",
  lightGrayBorder: "#E9ECEF",
  softGrayBackground: "#FAFAFC",
  paginationActive: "#053B90",
  paginationInactive: "#DEE2E6",
  paginationActiveText: "#FFFFFF",
  paginationInactiveText: "#495057",
  successGreen: "#28A745",
  softBlueAccent: "#E6F0FF",
  secondaryHighlight: "#FFC107",
  errorRed: "#DC3545",
  errorBg: "#FFF5F5",
  errorBorder: "#FFCDD2",
  gold: "#F59E0B",
  goldLight: "#FEF3C7",
  pendingOrange: "#F97316",
  pendingBg: "#FFF7ED",
  rejectedRed: "#EF4444",
  rejectedBg: "#FEF2F2",
  approvedGreen: "#16A34A",
  approvedBg: "#F0FDF4",
  whatsappGreen: "#25D366",
  callBlue: "#34B7F1",
};

const CONTACT_EMAIL = "info.mychits@gmail.com";
const CONTACT_PHONE = "+919483900777";
const CONTACT_WHATSAPP = "+919483900777";

const PURPOSE_OPTIONS = [
  { label: "Medical", icon: "medkit-outline" },
  { label: "Education", icon: "school-outline" },
  { label: "Business", icon: "briefcase-outline" },
  { label: "Others", icon: "ellipsis-horizontal-circle-outline" },
];

// ============================================================
// BLOCKED MODAL (Stylish Center Modal)
// ============================================================
const BlockedModal = ({ visible, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Shake animation for attention
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 8,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -8,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 5,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -5,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 60,
            useNativeDriver: true,
          }),
        ]).start();

        // Icon bounce in
        Animated.spring(iconBounce, {
          toValue: 1,
          tension: 60,
          friction: 5,
          delay: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      scaleAnim.setValue(0.6);
      opacityAnim.setValue(0);
      shakeAnim.setValue(0);
      iconBounce.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={blockedStyles.overlay}>
        {/* Animated background blobs */}
        <View style={blockedStyles.blob1} />
        <View style={blockedStyles.blob2} />
        <View style={blockedStyles.blob3} />

        <Animated.View
          style={[
            blockedStyles.card,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Top gradient bar */}
          <View style={blockedStyles.topBar}>
            <View style={blockedStyles.topBarPattern1} />
            <View style={blockedStyles.topBarPattern2} />
            <View style={blockedStyles.topBarPattern3} />
          </View>

          {/* Icon section */}
          <Animated.View
            style={[
              blockedStyles.iconContainer,
              {
                transform: [
                  {
                    scale: iconBounce.interpolate({
                      inputRange: [0, 0.6, 1],
                      outputRange: [0, 1.15, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={blockedStyles.iconOuterRing} />
            <View style={blockedStyles.iconInnerRing}>
              <Ionicons name="warning" size={34} color="#fff" />
            </View>
          </Animated.View>

          {/* Text content */}
          <Text style={blockedStyles.title}>Action Blocked</Text>
          <Text style={blockedStyles.subtitle}>
            You already have an unapproved loan request pending.
          </Text>

          {/* Info card */}
          <View style={blockedStyles.infoCard}>
            <View style={blockedStyles.infoRow}>
              <View style={blockedStyles.infoIconWrap}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={Colors.pendingOrange}
                />
              </View>
              <View style={blockedStyles.infoTextWrap}>
                <Text style={blockedStyles.infoLabel}>
                  Pending Request Found
                </Text>
                <Text style={blockedStyles.infoValue}>
                  You can only have 1 active loan request at a time.
                </Text>
              </View>
            </View>
            <View style={blockedStyles.infoDivider} />
            <View style={blockedStyles.infoRow}>
              <View style={[blockedStyles.infoIconWrap, { backgroundColor: Colors.softBlueAccent }]}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={Colors.primaryBlue}
                />
              </View>
              <View style={blockedStyles.infoTextWrap}>
                <Text style={blockedStyles.infoLabel}>What to do?</Text>
                <Text style={blockedStyles.infoValue}>
                  Please wait for your current request to be approved or contact support for help.
                </Text>
              </View>
            </View>
          </View>

          {/* Support section */}
          <View style={blockedStyles.supportRow}>
            <TouchableOpacity
              style={blockedStyles.supportChip}
              onPress={() => {
                Linking.openURL(`tel:${CONTACT_PHONE}`);
              }}
            >
              <Ionicons name="call-outline" size={15} color={Colors.callBlue} />
              <Text style={blockedStyles.supportChipText}>Call Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={blockedStyles.supportChip}
              onPress={() => {
                Linking.openURL(
                  `whatsapp://send?phone=${CONTACT_WHATSAPP}&text=Hello, I have a query regarding my pending loan request.`
                );
              }}
            >
              <Ionicons name="logo-whatsapp" size={15} color={Colors.whatsappGreen} />
              <Text style={[blockedStyles.supportChipText, { color: Colors.whatsappGreen }]}>
                WhatsApp Us
              </Text>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={blockedStyles.closeButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={blockedStyles.closeButtonText}>Got It</Text>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const blockedStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 15, 40, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  blob1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    top: "15%",
    left: "-5%",
  },
  blob2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(249, 115, 22, 0.06)",
    bottom: "18%",
    right: "-3%",
  },
  blob3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(5, 59, 144, 0.06)",
    top: "35%",
    right: "10%",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    elevation: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 35,
    alignItems: "center",
    paddingBottom: 24,
  },
  topBar: {
    width: "100%",
    height: 6,
    backgroundColor: "linear-gradient(90deg, #DC3545, #F97316)",
    position: "relative",
    overflow: "hidden",
  },
  topBarPattern1: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    top: -25,
    left: 15,
  },
  topBarPattern2: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -45,
    left: 110,
  },
  topBarPattern3: {
    position: "absolute",
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -25,
    right: 25,
  },
  iconContainer: {
    marginTop: 28,
    marginBottom: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  iconOuterRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: "rgba(220, 53, 69, 0.15)",
  },
  iconInnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.errorRed,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: Colors.errorRed,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    borderWidth: 4,
    borderColor: "#FFE0E3",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.darkText,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mediumText,
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 19,
    marginBottom: 18,
  },
  infoCard: {
    width: "100%",
    backgroundColor: Colors.softGrayBackground,
    marginHorizontal: 0,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.pendingBg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.darkText,
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 12,
    color: Colors.mediumText,
    lineHeight: 18,
    fontWeight: "500",
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.lightGrayBorder,
    marginHorizontal: 14,
  },
  supportRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 20,
    width: "100%",
  },
  supportChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.lightGrayBorder,
    backgroundColor: Colors.cardBackground,
  },
  supportChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.callBlue,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.darkText,
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 16,
    marginTop: 18,
    elevation: 6,
    shadowColor: Colors.darkText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

// ============================================================
// CONFIRMATION MODAL
// ============================================================
const ConfirmationModal = ({
  visible,
  onClose,
  formData,
  onConfirm,
  isSubmitting,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.spring(checkAnim, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }).start();
      });
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      checkAnim.setValue(0);
    }
  }, [visible]);

  const finalPurpose =
    formData.loanPurpose === "Others"
      ? formData.otherPurpose
      : formData.loanPurpose;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={confirmStyles.overlay}>
        <Animated.View
          style={[
            confirmStyles.container,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={confirmStyles.topBand}>
            <View style={confirmStyles.patternDot1} />
            <View style={confirmStyles.patternDot2} />
            <View style={confirmStyles.patternDot3} />
          </View>
          <Animated.View
            style={[
              confirmStyles.iconBadge,
              {
                transform: [
                  {
                    scale: checkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={confirmStyles.iconRing}>
              <Ionicons name="shield-checkmark" size={36} color="#fff" />
            </View>
          </Animated.View>
          <Text style={confirmStyles.title}>Confirm Application</Text>
          <Text style={confirmStyles.subtitle}>
            Please review your loan details before submitting
          </Text>
          <View style={confirmStyles.summaryCard}>
            <View style={confirmStyles.summaryRow}>
              <View style={confirmStyles.summaryIcon}>
                <Ionicons
                  name="person-outline"
                  size={15}
                  color={Colors.primaryBlue}
                />
              </View>
              <Text style={confirmStyles.summaryLabel}>Full Name</Text>
              <Text style={confirmStyles.summaryValue} numberOfLines={1}>
                {formData.fullName || "—"}
              </Text>
            </View>
            <View style={confirmStyles.divider} />
            <View style={confirmStyles.summaryRow}>
              <View style={confirmStyles.summaryIcon}>
                <Ionicons
                  name="call-outline"
                  size={15}
                  color={Colors.primaryBlue}
                />
              </View>
              <Text style={confirmStyles.summaryLabel}>Phone</Text>
              <Text style={confirmStyles.summaryValue}>
                {formData.phoneNumber || "—"}
              </Text>
            </View>
            <View style={confirmStyles.divider} />
            <View style={confirmStyles.summaryRow}>
              <View style={confirmStyles.summaryIcon}>
                <Ionicons name="cash-outline" size={15} color={Colors.gold} />
              </View>
              <Text style={confirmStyles.summaryLabel}>Loan Amount</Text>
              <Text
                style={[
                  confirmStyles.summaryValue,
                  confirmStyles.amountHighlight,
                ]}
              >
                ₹{Number(formData.loanAmount || 0).toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={confirmStyles.divider} />
            <View style={confirmStyles.summaryRow}>
              <View style={confirmStyles.summaryIcon}>
                <Ionicons
                  name="flag-outline"
                  size={15}
                  color={Colors.vibrantBlue}
                />
              </View>
              <Text style={confirmStyles.summaryLabel}>Purpose</Text>
              <Text style={confirmStyles.summaryValue}>
                {finalPurpose || "—"}
              </Text>
            </View>
          </View>
          <View style={confirmStyles.noticeBox}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={Colors.gold}
            />
            <Text style={confirmStyles.noticeText}>
              Our team will review and contact you within 24–48 hours.
            </Text>
          </View>
          <View style={confirmStyles.buttonRow}>
            <TouchableOpacity
              style={confirmStyles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Ionicons
                name="arrow-back-outline"
                size={16}
                color={Colors.mediumText}
              />
              <Text style={confirmStyles.cancelBtnText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                confirmStyles.confirmBtn,
                isSubmitting && { opacity: 0.75 },
              ]}
              onPress={onConfirm}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={confirmStyles.confirmBtnText}>Submit Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const confirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 15, 40, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    elevation: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    alignItems: "center",
    paddingBottom: 24,
  },
  topBand: {
    width: "100%",
    height: 8,
    backgroundColor: Colors.primaryBlue,
    position: "relative",
    overflow: "hidden",
  },
  patternDot1: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -30,
    left: 20,
  },
  patternDot2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -50,
    left: 120,
  },
  patternDot3: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -30,
    right: 30,
  },
  iconBadge: { marginTop: 24, marginBottom: 16 },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryBlue,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 4,
    borderColor: Colors.softBlueAccent,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.darkText,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mediumText,
    marginTop: 4,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: Colors.softGrayBackground,
    marginHorizontal: 0,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.lightGrayBorder,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    gap: 10,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.softBlueAccent,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.mediumText,
    fontWeight: "600",
  },
  summaryValue: {
    flex: 1.5,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.darkText,
    textAlign: "right",
  },
  amountHighlight: {
    color: Colors.primaryBlue,
    fontSize: 15,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGrayBorder,
    marginLeft: 38,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCD34D",
    width: "100%",
    alignSelf: "stretch",
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 17,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 20,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.lightGrayBorder,
    backgroundColor: Colors.softGrayBackground,
  },
  cancelBtnText: { color: Colors.mediumText, fontWeight: "700", fontSize: 14 },
  confirmBtn: {
    flex: 1.6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primaryBlue,
    elevation: 6,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});

// ============================================================
// SUCCESS MODAL
// ============================================================
const SuccessModal = ({ visible, onClose, message }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      });
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={successStyles.overlay}>
        <Animated.View
          style={[
            successStyles.container,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={successStyles.dot1} />
          <View style={successStyles.dot2} />
          <View style={successStyles.dot3} />
          <View style={successStyles.dot4} />
          <Animated.View
            style={[
              successStyles.iconWrap,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={successStyles.outerRing} />
            <View style={successStyles.innerCircle}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </View>
          </Animated.View>
          <Text style={successStyles.title}>Application Sent! 🎉</Text>
          <Text style={successStyles.desc}>
            {message ||
              "Your loan application has been submitted. Our team will review and get back to you shortly."}
          </Text>
          <View style={successStyles.badgeRow}>
            <View style={successStyles.badge}>
              <Ionicons
                name="time-outline"
                size={14}
                color={Colors.primaryBlue}
              />
              <Text style={successStyles.badgeText}>24-48 hrs review</Text>
            </View>
            <View style={successStyles.badge}>
              <Ionicons
                name="notifications-outline"
                size={14}
                color={Colors.successGreen}
              />
              <Text style={successStyles.badgeText}>You'll be notified</Text>
            </View>
          </View>
          <TouchableOpacity
            style={successStyles.doneBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={successStyles.doneBtnText}>Done</Text>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const successStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 15, 40, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: "center",
    overflow: "hidden",
    elevation: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  dot1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.softBlueAccent,
    top: -30,
    right: -20,
  },
  dot2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0FFF4",
    bottom: 20,
    left: -15,
  },
  dot3: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.goldLight,
    top: 40,
    left: 20,
  },
  dot4: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    bottom: 60,
    right: 25,
  },
  outerRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(5,59,144,0.15)",
  },
  iconWrap: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  innerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.successGreen,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: Colors.successGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.darkText,
    textAlign: "center",
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    color: Colors.mediumText,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
  },
  badgeRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.softGrayBackground,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: Colors.darkText },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.successGreen,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 16,
    elevation: 6,
    shadowColor: Colors.successGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

// ============================================================
// MAIN COMPONENT
// ============================================================
const MyLoan = ({ route, navigation }) => {
  const { groupFilter } = route.params || {};
  const [appUser] = useContext(ContextProvider);
  const userId = appUser?.userId;
  const { isConnected, isInternetReachable } = useContext(NetworkContext);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loans, setLoans] = useState([]); // Approved Loans
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [paymentsError, setPaymentsError] = useState(null);
  const [totalPayments, setTotalPayments] = useState([]);
  const [totalPaymentsError, setTotalPaymentsError] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loanId, setLoanId] = useState(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Form States
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isBlockedModalVisible, setIsBlockedModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    loanAmount: "",
    loanPurpose: "",
    otherPurpose: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    phoneNumber: "",
    loanAmount: "",
    loanPurpose: "",
    otherPurpose: "",
  });

  // Toggle & Request States
  const [activeTab, setActiveTab] = useState("approved"); // 'approved' | 'unapproved'
  const [loanRequests, setLoanRequests] = useState([]); // Unapproved/Request Loans
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState(null);

  const modalScrollRef = useRef(null);
  const fullNameRef = useRef(null);
  const phoneRef = useRef(null);
  const amountRef = useRef(null);
  const otherPurposeRef = useRef(null);
  const fullNameContainerRef = useRef(null);
  const phoneContainerRef = useRef(null);
  const amountContainerRef = useRef(null);
  const purposeContainerRef = useRef(null);
  const otherPurposeContainerRef = useRef(null);

  const isApplyDisabled = loanRequests?.some(
    (req) => (req.approval_status || "").toLowerCase() === "pending",
  );

  // Fetch Approved Loans
  useEffect(() => {
    if (!userId) return;
    const fetchLoans = async () => {
      setIsLoading(true);
      try {
        const apiUrl = `${url}/loans/get-borrower-by-user-id/${userId}`;
        const response = await axios.get(apiUrl);
        setLoans(response.data || []);
      } catch (err) {
        setError("Failed to fetch loan data.");
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not load loan data.",
          position: "bottom",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoans();
  }, [userId]);

  // Fetch Unapproved Loans
  useEffect(() => {
    if (!userId) return;
    const fetchRequests = async () => {
      setIsRequestsLoading(true);
      setRequestsError(null);
      try {
        const res = await axios.get(
          `${url}/loans/get-loan-request-by-user/${userId}`,
        );
        const sortedData = (res.data?.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setLoanRequests(sortedData);
      } catch (err) {
        setRequestsError("Could not load loan requests.");
      } finally {
        setIsRequestsLoading(false);
      }
    };
    fetchRequests();
  }, [userId]);

  useEffect(() => {
    const fetchFreshProfile = async () => {
      if (!userId || !url) return;
      try {
        const profileUrl = `${url}/user/get-user-by-id/${userId}`;
        const response = await axios.get(profileUrl);
        const userData = response.data;
        if (userData) {
          setFormData((prev) => ({
            ...prev,
            fullName: userData.full_name || prev.fullName,
            phoneNumber: userData.phone_number || prev.phoneNumber,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err.message);
      }
    };
    fetchFreshProfile();
  }, [userId]);

  useEffect(() => {
    if (!userId || !loanId) return;
    const fetchData = async () => {
      setIsDataLoading(true);
      setIsSummaryExpanded(false);
      try {
        const summaryApiUrl = `${url}/payment/user/${userId}/loan/${loanId}/summary`;
        const summaryResponse = await axios.get(summaryApiUrl);
        const summary = Array.isArray(summaryResponse.data)
          ? summaryResponse.data[0]
          : summaryResponse.data;
        setPaymentsSummary(summary);
        const paymentsApiUrl = `${url}/payment/loan/${loanId}/user/${userId}/total-docs/7/page/${currentPage}`;
        const paymentsResponse = await axios.get(paymentsApiUrl);
        setTotalPayments(paymentsResponse.data);
      } catch (err) {
        setPaymentsError("Failed to fetch loan data.");
        setTotalPaymentsError("Failed to fetch total payments.");
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [userId, loanId, currentPage]);

  useEffect(() => {
    if (!userId || !loanId) return;
    const fetchTotalPages = async () => {
      try {
        const apiUrl = `${url}/payment/loan/totalPages/user/${userId}/loan/${loanId}/total-docs/7`;
        const res = await axios.get(apiUrl);
        setTotalPages(res.data.totalPages || 0);
      } catch (err) {
        console.error("Failed to fetch total pages", err.message);
      }
    };
    fetchTotalPages();
  }, [userId, loanId]);

  const formatNumberIndianStyle = (num) => {
    if (num === null || num === undefined) return "0";
    const safeNum = isNaN(parseFloat(num)) ? 0 : parseFloat(num);
    const number = safeNum.toFixed(2);
    const parts = number.toString().split(".");
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? "." + parts[1] : "";
    const isNegative = integerPart.startsWith("-");
    if (isNegative) integerPart = integerPart.substring(1);
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formatted =
      otherNumbers !== ""
        ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
        : lastThree;
    return (isNegative ? "-" : "") + formatted + decimalPart;
  };

  const getPaginationNumbers = () => {
    const pages = [];
    const limit = 3;
    const start = Math.max(1, currentPage - Math.floor(limit / 2));
    const end = Math.min(totalPages, start + limit - 1);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages.filter((v, i, a) => a.indexOf(v) === i);
  };

  const handlePhonePress = () => Linking.openURL(`tel:${CONTACT_PHONE}`);
  const handleWhatsAppPress = () =>
    Linking.openURL(
      `whatsapp://send?phone=${CONTACT_WHATSAPP}&text=Hello, I would like to apply for a loan.`,
    );
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateAndGetFirstError = () => {
    const errors = {};
    let firstErrorField = null;
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required.";
      if (!firstErrorField) firstErrorField = "fullName";
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
      if (!firstErrorField) firstErrorField = "phoneNumber";
    } else if (
      !/^\+?\d{10,13}$/.test(formData.phoneNumber.trim().replace(/\s/g, ""))
    ) {
      errors.phoneNumber = "Enter a valid phone number.";
      if (!firstErrorField) firstErrorField = "phoneNumber";
    }
    if (!formData.loanAmount.trim()) {
      errors.loanAmount = "Loan amount is required.";
      if (!firstErrorField) firstErrorField = "loanAmount";
    } else if (
      isNaN(Number(formData.loanAmount)) ||
      Number(formData.loanAmount) <= 0
    ) {
      errors.loanAmount = "Enter a valid loan amount.";
      if (!firstErrorField) firstErrorField = "loanAmount";
    }
    if (!formData.loanPurpose) {
      errors.loanPurpose = "Please select a loan purpose.";
      if (!firstErrorField) firstErrorField = "loanPurpose";
    }
    if (formData.loanPurpose === "Others" && !formData.otherPurpose.trim()) {
      errors.otherPurpose = "Please specify your loan purpose.";
      if (!firstErrorField) firstErrorField = "otherPurpose";
    }
    return { errors, firstErrorField };
  };

  const scrollToField = (fieldName) => {
    const refMap = {
      fullName: { containerRef: fullNameContainerRef, inputRef: fullNameRef },
      phoneNumber: { containerRef: phoneContainerRef, inputRef: phoneRef },
      loanAmount: { containerRef: amountContainerRef, inputRef: amountRef },
      loanPurpose: { containerRef: purposeContainerRef, inputRef: null },
      otherPurpose: {
        containerRef: otherPurposeContainerRef,
        inputRef: otherPurposeRef,
      },
    };
    const { containerRef, inputRef } = refMap[fieldName] || {};
    if (containerRef?.current && modalScrollRef?.current) {
      containerRef.current.measureLayout(
        modalScrollRef.current,
        (x, y) => {
          modalScrollRef.current.scrollTo({
            y: Math.max(0, y - 20),
            animated: true,
          });
        },
        () => {},
      );
    }
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 350);
  };

  const handleFormSubmit = () => {
    const { errors, firstErrorField } = validateAndGetFirstError();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (firstErrorField) scrollToField(firstErrorField);
      return;
    }
    setIsConfirmVisible(true);
  };

  const handleConfirmedSubmit = async () => {
    const finalPurpose =
      formData.loanPurpose === "Others"
        ? formData.otherPurpose
        : formData.loanPurpose;
    setIsSubmitting(true);
    const payload = {
      user_id: userId,
      loan_amount: Number(formData.loanAmount),
      loan_purpose: finalPurpose,
      source: "mychits-customer-app",
    };
    const hasPendingRequest = loanRequests?.some(
      (req) => (req.approval_status || "").toLowerCase() === "pending",
    );

    if (hasPendingRequest) {
      setIsSubmitting(false);
      setIsConfirmVisible(false);
      setTimeout(() => {
        setIsBlockedModalVisible(true);
      }, 300);
      return;
    }
    try {
      const res = await axios.post(
        `${url}/loans/loan-approval-request`,
        payload,
      );
      if (res.status === 201 || res.status === 200) {
        setIsConfirmVisible(false);
        setIsFormVisible(false);
        setTimeout(() => {
          setSuccessMessage(
            res.data.message ||
              "Your loan application has been submitted successfully!",
          );
          setIsSuccessVisible(true);
          const fetchRequests = async () => {
            try {
              const res = await axios.get(
                `${url}/loans/get-loan-request-by-user/${userId}`,
              );
              setLoanRequests(
                (res.data?.data || []).sort(
                  (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                ),
              );
            } catch (err) {
              console.log(err);
            }
          };
          fetchRequests();
        }, 300);
        setFormData((prev) => ({
          ...prev,
          loanAmount: "",
          loanPurpose: "",
          otherPurpose: "",
        }));
        setFieldErrors({});
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: "Something went wrong. Please try again.",
        position: "bottom",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessVisible(false);
    setActiveTab("unapproved");
  };

  const handleCloseModal = () => {
    setIsFormVisible(false);
    setFieldErrors({});
  };

  let totalLoanBalance = 0;
  let loanAmount = 0;
  let totalRepayment = 0;
  if (loanId && !isDataLoading) {
    const currentLoan = loans.find((loan) => loan._id === loanId);
    if (currentLoan) {
      loanAmount = parseFloat(currentLoan.loan_amount || 0);
      totalRepayment = parseFloat(paymentsSummary?.totalPaidAmount || 0);
      totalLoanBalance = loanAmount - totalRepayment;
    }
  }

  const FieldError = ({ message }) => {
    if (!message) return null;
    return (
      <View style={styles.fieldErrorContainer}>
        <Ionicons name="alert-circle" size={13} color={Colors.errorRed} />
        <Text style={styles.fieldErrorText}>{message}</Text>
      </View>
    );
  };
  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.rowIconCircle}>
        <Ionicons name={icon} size={18} color={Colors.primaryBlue} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
  const handleCallSupport = () => {
    Linking.openURL(`tel:${CONTACT_PHONE}`).catch((err) => {
      Alert.alert("Error", "Could not open phone dialer.");
      console.error(err);
    });
  };
  const openWhatsApp = async () => {
    const message = "Hello, I need assistance with My Loan Application.";
    const whatsappUrl = `https://wa.me/${CONTACT_PHONE.replace("+", "")}?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on this device.");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />
      {!loanId && <Header userId={userId} navigation={navigation} />}

      <View style={styles.outerBoxContainer}>
        <View style={styles.fixedTitleContainer}>
          {loanId && (
            <TouchableOpacity
              onPress={() => {
                setLoanId(null);
                setCurrentPage(1);
              }}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back-outline"
                size={28}
                color={Colors.darkText}
              />
            </TouchableOpacity>
          )}
          <Text style={styles.sectionTitle}>My Loan</Text>
          <Text style={styles.subHeading}>
            {loanId
              ? "Recent payment history."
              : "Your current loan details and payment status."}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
            <Text style={{ marginTop: 10, color: Colors.mediumText }}>
              Loading Loans...
            </Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollableContentArea}
            showsVerticalScrollIndicator={false}
          >
            {loanId ? (
              isDataLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryBlue} />
                  <Text style={{ marginTop: 10, color: Colors.mediumText }}>
                    Loading Details...
                  </Text>
                </View>
              ) : (
                <>
                  <View style={[styles.loanCard, styles.summaryCard]}>
                    <TouchableOpacity
                      style={styles.accordionHeader}
                      onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardHeader}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: Colors.primaryBlue },
                          ]}
                        >
                          <Ionicons
                            name="wallet-outline"
                            size={28}
                            color={Colors.cardBackground}
                          />
                        </View>
                        <View style={styles.cardTitleContainer}>
                          <Text style={styles.cardTitle}>
                            Remaining Loan Balance
                          </Text>
                          {paymentsError ? (
                            <Text style={styles.errorText}>
                              {paymentsError}
                            </Text>
                          ) : (
                            <Text
                              style={[
                                styles.detailValue,
                                styles.summaryValue,
                                { color: Colors.primaryBlue },
                              ]}
                            >
                              ₹{formatNumberIndianStyle(totalLoanBalance)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name={isSummaryExpanded ? "chevron-up" : "chevron-down"}
                        size={22}
                        color={Colors.darkText}
                      />
                    </TouchableOpacity>
                    {isSummaryExpanded && !paymentsError && (
                      <View style={styles.summaryDetailsContainer}>
                        <View style={styles.summaryDetailItem}>
                          <Ionicons
                            name="cash-outline"
                            size={20}
                            color={Colors.vibrantBlue}
                            style={styles.detailIcon}
                          />
                          <Text style={styles.detailLabelVertical}>
                            Original Loan Amount
                          </Text>
                          <Text
                            style={[
                              styles.detailValueVertical,
                              { color: Colors.primaryBlue, fontWeight: "900" },
                            ]}
                          >
                            ₹{formatNumberIndianStyle(loanAmount)}
                          </Text>
                        </View>
                        <View style={styles.summaryDetailItem}>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={Colors.successGreen}
                            style={styles.detailIcon}
                          />
                          <Text style={styles.detailLabelVertical}>
                            TOTAL PAID
                          </Text>
                          <Text
                            style={[
                              styles.detailValueVertical,
                              { color: Colors.successGreen, fontWeight: "900" },
                            ]}
                          >
                            ₹{formatNumberIndianStyle(totalRepayment)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={styles.paymentHistoryTitle}>
                      Payment History
                    </Text>
                    {totalPaymentsError ? (
                      <Text style={styles.errorText}>{totalPaymentsError}</Text>
                    ) : totalPayments.length > 0 ? (
                      totalPayments.map((pay) => (
                        <View key={pay._id} style={styles.paymentCard}>
                          <Ionicons
                            name="receipt-outline"
                            size={22}
                            color={Colors.primaryBlue}
                          />
                          <View style={styles.paymentDetailsRow}>
                            <View style={{ flex: 2 }}>
                              <Text
                                style={styles.receiptText}
                                numberOfLines={1}
                              >
                                Receipt: {pay.receipt_no}
                              </Text>
                              <Text style={styles.dateText}>
                                {new Date(pay.pay_date).toLocaleDateString()}
                              </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: "flex-end" }}>
                              <Text style={styles.amountText}>
                                ₹{formatNumberIndianStyle(pay.amount)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        No payments found for this loan.
                      </Text>
                    )}
                    {totalPages > 1 && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity
                          disabled={currentPage === 1}
                          onPress={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          style={styles.paginationArrowButton}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={24}
                            color={
                              currentPage === 1
                                ? Colors.mediumText
                                : Colors.darkText
                            }
                          />
                        </TouchableOpacity>
                        {getPaginationNumbers().map((pageNumber, index) =>
                          pageNumber === "..." ? (
                            <Text
                              key={`ellipsis-${index}`}
                              style={styles.paginationEllipsis}
                            >
                              ...
                            </Text>
                          ) : (
                            <TouchableOpacity
                              key={pageNumber}
                              style={[
                                styles.paginationBox,
                                currentPage === pageNumber &&
                                  styles.paginationBoxActive,
                              ]}
                              onPress={() => setCurrentPage(pageNumber)}
                            >
                              <Text
                                style={[
                                  styles.paginationBoxText,
                                  currentPage === pageNumber &&
                                    styles.paginationBoxTextActive,
                                ]}
                              >
                                {pageNumber}
                              </Text>
                            </TouchableOpacity>
                          ),
                        )}
                        <TouchableOpacity
                          disabled={currentPage === totalPages}
                          onPress={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1),
                            )
                          }
                          style={styles.paginationArrowButton}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={
                              currentPage === totalPages
                                ? Colors.mediumText
                                : Colors.darkText
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )
            ) : (
              <>
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === "approved" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("approved")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === "approved" && styles.activeTabText,
                      ]}
                    >
                      Approved Loans
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === "unapproved" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("unapproved")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === "unapproved" && styles.activeTabText,
                      ]}
                    >
                      Unapproved Loans
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeTab === "approved" ? (
                  <>
                    {loans.length > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.applyAnotherLoanHeaderBtn,
                          isApplyDisabled && { opacity: 0.5 },
                        ]}
                        onPress={() => {
                          if (isApplyDisabled) {
                            setIsBlockedModalVisible(true);
                            return;
                          }
                          setIsFormVisible(true);
                        }}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={22}
                          color={Colors.cardBackground}
                        />
                        <Text style={styles.applyAnotherLoanHeaderText}>
                          Need another loan? Apply Here
                        </Text>
                      </TouchableOpacity>
                    )}

                    {loans.length > 0 ? (
                      loans.map((loan) => (
                        <View key={loan._id} style={styles.loanCard}>
                          <View style={styles.loanCardHeaderBar}>
                            <Ionicons
                              name="business-outline"
                              size={24}
                              color={Colors.primaryBlue}
                              style={{ marginRight: 10 }}
                            />
                            <View style={styles.cardTitleContainer}>
                              <Text style={styles.cardTitle}>Loan Account</Text>
                              <Text style={styles.cardSubtitle}>
                                ID: {loan.loan_id.substring(0, 10)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.detailsList}>
                            <View style={styles.detailItemVertical}>
                              <Ionicons
                                name="cash-outline"
                                size={20}
                                color={Colors.vibrantBlue}
                                style={styles.detailIcon}
                              />
                              <Text style={styles.detailLabelVertical}>
                                Loan Amount
                              </Text>
                              <Text
                                style={[
                                  styles.detailValueVertical,
                                  styles.amountValueStyle,
                                ]}
                              >
                                ₹{formatNumberIndianStyle(loan.loan_amount)}
                              </Text>
                            </View>
                            <View style={styles.detailItemVertical}>
                              <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={Colors.vibrantBlue}
                                style={styles.detailIcon}
                              />
                              <Text style={styles.detailLabelVertical}>
                                Tenure
                              </Text>
                              <Text style={styles.detailValueVertical}>
                                {loan.tenure} days
                              </Text>
                            </View>
                            <View style={styles.detailItemVertical}>
                              <Ionicons
                                name="time-outline"
                                size={20}
                                color={Colors.vibrantBlue}
                                style={styles.detailIcon}
                              />
                              <Text style={styles.detailLabelVertical}>
                                Start Date
                              </Text>
                              <Text style={styles.detailValueVertical}>
                                {new Date(loan.start_date).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.viewPaymentsButton}
                            onPress={() => {
                              setLoanId(loan._id);
                              setCurrentPage(1);
                            }}
                          >
                            <Text style={styles.viewPaymentsButtonText}>
                              View Payments & Details
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <View style={styles.noLoanContainer}>
                        <View style={styles.noLoanHeader}>
                          <Ionicons
                            name="rocket-outline"
                            size={60}
                            color={Colors.cardBackground}
                          />
                          <Text style={styles.noLoanTitle}>
                            Unlock Your Potential
                          </Text>
                        </View>
                        <Text style={styles.noLoanMessage}>
                          You currently have no active loans. Ready to make a
                          move? Take a loan and enjoy the flexibility.
                        </Text>
                        <Text style={styles.requestLoanSentence}>
                          Request your next loan instantly by applying below!
                        </Text>
                        <View style={styles.contactGroup}>
                          <TouchableOpacity
                            style={[
                              styles.contactButtonPhone,
                              isApplyDisabled && { opacity: 0.5 },
                            ]}
                            onPress={() => {
                              if (isApplyDisabled) {
                                setIsBlockedModalVisible(true);
                                return;
                              }
                              setIsFormVisible(true);
                            }}
                          >
                            <Ionicons
                              name="document-text-outline"
                              size={20}
                              color={Colors.cardBackground}
                            />
                            <Text style={styles.contactButtonText}>
                              Apply for Loan
                            </Text>
                          </TouchableOpacity>
                          <View style={styles.contactRow}>
                            <TouchableOpacity
                              onPress={handlePhonePress}
                              style={styles.contactButtonHalf}
                            >
                              <Ionicons
                                name="call-outline"
                                size={20}
                                color={Colors.accentColor}
                              />
                              <Text style={styles.contactButtonTextCall}>
                                Call Us
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={handleWhatsAppPress}
                              style={styles.contactButtonWhatsApp}
                            >
                              <Ionicons
                                name="logo-whatsapp"
                                size={20}
                                color="#25D366"
                              />
                              <Text style={styles.contactButtonTextWhatsApp}>
                                WhatsApp
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {isRequestsLoading ? (
                      <View style={styles.centerState}>
                        <ActivityIndicator
                          size="large"
                          color={Colors.primaryBlue}
                        />
                        <Text style={styles.stateText}>
                          Loading requests...
                        </Text>
                      </View>
                    ) : requestsError ? (
                      <View style={styles.centerState}>
                        <Text style={styles.messageText}>{requestsError}</Text>
                      </View>
                    ) : loanRequests.length > 0 ? (
                      <View style={styles.cardsList}>
                        {loanRequests.map((req) => {
                          const status = (
                            req.approval_status || ""
                          ).toLowerCase();
                          let statusConfig = {
                            color: Colors.mediumText,
                            bg: "#F1F3F5",
                            icon: "help-circle",
                            label: "Unknown",
                          };
                          if (status === "approved")
                            statusConfig = {
                              color: Colors.approvedGreen,
                              bg: Colors.approvedBg,
                              icon: "checkmark-circle",
                              label: "Approved",
                            };
                          else if (status === "pending")
                            statusConfig = {
                              color: Colors.pendingOrange,
                              bg: Colors.pendingBg,
                              icon: "time",
                              label: "Pending",
                            };
                          else if (status === "rejected")
                            statusConfig = {
                              color: Colors.rejectedRed,
                              bg: Colors.rejectedBg,
                              icon: "close-circle",
                              label: "Rejected",
                            };
                          return (
                            <View key={req._id} style={styles.stylishCard}>
                              <View
                                style={[
                                  styles.cardTopAccent,
                                  { backgroundColor: statusConfig.color },
                                ]}
                              />
                              <View style={styles.cardTopSection}>
                                <View>
                                  <Text style={styles.cardLabel}>
                                    Loan Amount
                                  </Text>
                                  <Text style={styles.cardAmount}>
                                    ₹
                                    {Number(
                                      req.loan_amount || 0,
                                    ).toLocaleString("en-IN")}
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    styles.floatingStatusBadge,
                                    { backgroundColor: statusConfig.bg },
                                  ]}
                                >
                                  <Ionicons
                                    name={statusConfig.icon}
                                    size={14}
                                    color={statusConfig.color}
                                  />
                                  <Text
                                    style={[
                                      styles.floatingStatusText,
                                      { color: statusConfig.color },
                                    ]}
                                  >
                                    {statusConfig.label}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.detailsListContainer}>
                                <InfoRow
                                  icon="calendar-outline"
                                  label="Applied On"
                                  value={
                                    req.createdAt
                                      ? new Date(
                                          req.createdAt,
                                        ).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "—"
                                  }
                                />
                                <View style={styles.listDivider} />
                                <InfoRow
                                  icon="flag-outline"
                                  label="Purpose"
                                  value={req.loan_purpose || "General Loan"}
                                />
                              </View>
                              {!!req.remarks && (
                                <View style={styles.remarksStylishContainer}>
                                  <View style={styles.remarksHeader}>
                                    <Ionicons
                                      name="chatbubble-ellipses-outline"
                                      size={14}
                                      color={Colors.mediumText}
                                    />
                                    <Text style={styles.remarksLabel}>
                                      Remarks
                                    </Text>
                                  </View>
                                  <Text style={styles.remarksValueText}>
                                    {req.remarks}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.centerState}>
                        <View style={styles.emptyStateIconBox}>
                          <Ionicons
                            name="file-tray-outline"
                            size={50}
                            color={Colors.primaryBlue}
                          />
                        </View>
                        <Text style={styles.messageTitle}>
                          No Requested Loans Found
                        </Text>
                        <Text style={styles.messageText}>
                          You haven't submitted any loan requests yet.
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.primaryActionBtn,
                            isApplyDisabled && { opacity: 0.5 },
                          ]}
                          onPress={() => {
                            if (isApplyDisabled) {
                              setIsBlockedModalVisible(true);
                              return;
                            }
                            setIsFormVisible(true);
                          }}
                        >
                          <Ionicons name="add-circle" size={20} color="#fff" />
                          <Text style={styles.primaryActionBtnText}>
                            Request Loan
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>

      {/* Loan Application Form Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isFormVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.centeredModalContent}>
            <View style={styles.centeredModalBand}>
              <View style={styles.centeredBandCircle1} />
              <View style={styles.centeredBandCircle2} />
              <View style={styles.centeredModalHeaderRow}>
                <View style={styles.centeredModalHeaderIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color="#fff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.centeredModalTitle}>
                    Loan Application
                  </Text>
                  <Text style={styles.centeredModalSubtitle}>
                    Fill in the details below
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.centeredCloseBtn}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="rgba(255,255,255,0.85)"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              ref={modalScrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.centeredFormSection}>
                <View style={styles.formSectionHeader}>
                  <View style={styles.sectionIconDot} />
                  <Text style={styles.formSectionTitle}>
                    Applicant Information
                  </Text>
                </View>
                <View
                  ref={fullNameContainerRef}
                  collapsable={false}
                  style={styles.fieldWrapper}
                >
                  <Text style={styles.inputLabel}>
                    Full Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      fieldErrors.fullName ? styles.inputWrapperError : null,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={
                        fieldErrors.fullName
                          ? Colors.errorRed
                          : Colors.mediumText
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={fullNameRef}
                      style={styles.input}
                      value={formData.fullName}
                      onChangeText={(txt) => handleFieldChange("fullName", txt)}
                      placeholder="Enter your full name"
                      placeholderTextColor="#AAAAAA"
                      returnKeyType="next"
                      onSubmitEditing={() => phoneRef.current?.focus()}
                    />
                  </View>
                  <FieldError message={fieldErrors.fullName} />
                </View>
                <View
                  ref={phoneContainerRef}
                  collapsable={false}
                  style={styles.fieldWrapper}
                >
                  <Text style={styles.inputLabel}>
                    Phone Number <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      fieldErrors.phoneNumber ? styles.inputWrapperError : null,
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={
                        fieldErrors.phoneNumber
                          ? Colors.errorRed
                          : Colors.mediumText
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={phoneRef}
                      style={styles.input}
                      keyboardType="phone-pad"
                      value={formData.phoneNumber}
                      onChangeText={(txt) =>
                        handleFieldChange("phoneNumber", txt)
                      }
                      placeholder="Enter mobile number"
                      placeholderTextColor="#AAAAAA"
                      returnKeyType="next"
                      onSubmitEditing={() => amountRef.current?.focus()}
                    />
                  </View>
                  <FieldError message={fieldErrors.phoneNumber} />
                </View>
              </View>
              <View style={styles.centeredFormSection}>
                <View style={styles.formSectionHeader}>
                  <View
                    style={[
                      styles.sectionIconDot,
                      { backgroundColor: Colors.gold },
                    ]}
                  />
                  <Text style={styles.formSectionTitle}>Loan Details</Text>
                </View>
                <View
                  ref={amountContainerRef}
                  collapsable={false}
                  style={styles.fieldWrapper}
                >
                  <Text style={styles.inputLabel}>
                    Required Loan Amount{" "}
                    <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      fieldErrors.loanAmount ? styles.inputWrapperError : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyPrefix,
                        fieldErrors.loanAmount
                          ? { color: Colors.errorRed }
                          : null,
                      ]}
                    >
                      ₹
                    </Text>
                    <TextInput
                      ref={amountRef}
                      style={[styles.input, { paddingLeft: 4 }]}
                      keyboardType="numeric"
                      value={formData.loanAmount}
                      onChangeText={(txt) =>
                        handleFieldChange("loanAmount", txt)
                      }
                      placeholder="0.00"
                      placeholderTextColor="#AAAAAA"
                      returnKeyType="done"
                    />
                  </View>
                  <FieldError message={fieldErrors.loanAmount} />
                </View>
                <View
                  ref={purposeContainerRef}
                  collapsable={false}
                  style={styles.fieldWrapper}
                >
                  <Text style={styles.inputLabel}>
                    Purpose of Loan <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.purposeGrid}>
                    {PURPOSE_OPTIONS.map((option) => {
                      const isSelected = formData.loanPurpose === option.label;
                      return (
                        <TouchableOpacity
                          key={option.label}
                          style={[
                            styles.purposeChip,
                            isSelected && styles.purposeChipSelected,
                          ]}
                          onPress={() => {
                            handleFieldChange("loanPurpose", option.label);
                            if (option.label !== "Others") {
                              setFieldErrors((prev) => ({
                                ...prev,
                                otherPurpose: "",
                              }));
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={option.icon}
                            size={18}
                            color={
                              isSelected
                                ? Colors.primaryBlue
                                : Colors.mediumText
                            }
                          />
                          <Text
                            style={[
                              styles.purposeChipText,
                              isSelected && styles.purposeChipTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {isSelected && (
                            <View style={styles.purposeCheckmark}>
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color={Colors.primaryBlue}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <FieldError message={fieldErrors.loanPurpose} />
                </View>
                {formData.loanPurpose === "Others" && (
                  <View
                    ref={otherPurposeContainerRef}
                    collapsable={false}
                    style={styles.fieldWrapper}
                  >
                    <Text style={styles.inputLabel}>
                      Please specify <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        fieldErrors.otherPurpose
                          ? styles.inputWrapperError
                          : null,
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={
                          fieldErrors.otherPurpose
                            ? Colors.errorRed
                            : Colors.mediumText
                        }
                        style={styles.inputIcon}
                      />
                      <TextInput
                        ref={otherPurposeRef}
                        style={styles.input}
                        value={formData.otherPurpose}
                        onChangeText={(txt) =>
                          handleFieldChange("otherPurpose", txt)
                        }
                        placeholder="Describe your loan purpose"
                        placeholderTextColor="#AAAAAA"
                        returnKeyType="done"
                      />
                    </View>
                    <FieldError message={fieldErrors.otherPurpose} />
                  </View>
                )}
              </View>
              <View style={styles.centeredCertBox}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={Colors.primaryBlue}
                />
                <Text style={styles.certificationText}>
                  I certify that all information provided is true and accurate
                  to the best of my knowledge.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.centeredSubmitBtn}
                onPress={handleFormSubmit}
                activeOpacity={0.85}
              >
                <View style={styles.submitButtonInner}>
                  <Text style={styles.submitFormButtonText}>
                    Review & Submit
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={isConfirmVisible}
        onClose={() => setIsConfirmVisible(false)}
        formData={formData}
        onConfirm={handleConfirmedSubmit}
        isSubmitting={isSubmitting}
      />
      <SuccessModal
        visible={isSuccessVisible}
        message={successMessage}
        onClose={handleSuccessClose}
      />
      <BlockedModal
        visible={isBlockedModalVisible}
        onClose={() => setIsBlockedModalVisible(false)}
      />
      <Toast position="bottom" bottomOffset={60} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryBlue,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  outerBoxContainer: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    margin: 10,
    borderRadius: 20,
    marginBottom: 50,
    overflow: "hidden",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  fixedTitleContainer: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
  },
  scrollableContentArea: {
    flexGrow: 1,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  backButton: { position: "absolute", left: 30, top: 20, zIndex: 10 },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.darkText,
    marginTop: 5,
  },
  subHeading: { fontSize: 13, color: Colors.mediumText, textAlign: "center" },
  errorText: {
    textAlign: "center",
    color: "#E74C3C",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.softGrayBackground,
    borderRadius: 30,
    padding: 4,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: Colors.primaryBlue,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "700", color: Colors.mediumText },
  activeTabText: { color: "#fff" },
  applyAnotherLoanHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.vibrantBlue,
    padding: 12,
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 15,
  },
  applyAnotherLoanHeaderText: {
    color: Colors.cardBackground,
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 14,
  },
  loanCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 10,
    borderWidth: 3,
    borderColor: Colors.lightGrayBorder,
    overflow: "hidden",
    marginTop: 0,
  },
  loanCardHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.softBlueAccent,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
  },
  summaryCard: { borderLeftColor: Colors.vibrantBlue },
  cardHeader: { flexDirection: "row", alignItems: "center", flex: 1 },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
  },
  summaryDetailsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.softGrayBackground,
  },
  summaryDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    marginBottom: 5,
  },
  iconContainer: {
    width: 25,
    height: 25,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 12, fontWeight: "700", color: Colors.darkText },
  cardSubtitle: { fontSize: 12, color: Colors.mediumText, marginTop: 2 },
  summaryValue: { fontSize: 20, fontWeight: "bold", marginTop: 4 },
  detailValue: {},
  detailsList: {
    flexDirection: "column",
    padding: 10,
    backgroundColor: Colors.softGrayBackground,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 15,
  },
  detailItemVertical: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: Colors.vibrantBlue,
  },
  detailLabelVertical: {
    fontSize: 10,
    color: Colors.mediumText,
    flex: 2,
    fontWeight: "500",
  },
  detailValueVertical: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.darkText,
    flex: 3,
    textAlign: "right",
  },
  detailIcon: { marginRight: 10 },
  amountValueStyle: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.primaryBlue,
  },
  viewPaymentsButton: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 14,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: "center",
  },
  viewPaymentsButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  paymentHistoryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.darkText,
    marginBottom: 10,
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
    paddingBottom: 5,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  paymentDetailsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 15,
    alignItems: "center",
  },
  receiptText: { fontSize: 12, fontWeight: "600", color: Colors.darkText },
  amountText: { fontSize: 14, fontWeight: "bold", color: Colors.vibrantBlue },
  dateText: { fontSize: 12, color: Colors.mediumText },
  emptyText: {
    marginTop: 14,
    fontSize: 16,
    color: Colors.mediumText,
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  paginationArrowButton: {
    padding: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
    marginHorizontal: 2,
  },
  paginationBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.paginationInactive,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
  },
  paginationBoxActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  paginationBoxText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.paginationInactiveText,
  },
  paginationBoxTextActive: { color: Colors.paginationActiveText },
  paginationEllipsis: {
    fontSize: 16,
    color: Colors.mediumText,
    marginHorizontal: 4,
  },
  noLoanContainer: {
    alignItems: "center",
    backgroundColor: Colors.primaryBlue,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noLoanHeader: { width: "100%", alignItems: "center", marginBottom: 20 },
  noLoanTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.cardBackground,
    marginTop: 10,
  },
  noLoanMessage: {
    fontSize: 16,
    color: Colors.cardBackground,
    textAlign: "center",
    marginBottom: 20,
  },
  requestLoanSentence: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.cardBackground,
    textAlign: "center",
    backgroundColor: Colors.vibrantBlue,
    padding: 8,
    width: "100%",
    borderRadius: 8,
    marginBottom: 20,
  },
  contactGroup: { width: "100%", alignItems: "center" },
  contactButtonPhone: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successGreen,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
  },
  contactButtonText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
  },
  contactRow: { flexDirection: "row", width: "100%", gap: 10 },
  contactButtonHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.accentColor,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
    backgroundColor: "#fff",
  },
  contactButtonTextCall: {
    color: Colors.accentColor,
    fontSize: 15,
    fontWeight: "700",
  },
  contactButtonWhatsApp: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#25D366",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
    backgroundColor: "#fff",
  },
  contactButtonTextWhatsApp: {
    color: "#25D366",
    fontSize: 15,
    fontWeight: "700",
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 15, 50, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  centeredModalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 26,
    overflow: "hidden",
    maxHeight: SCREEN_HEIGHT * 0.85,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
  },
  centeredModalBand: {
    backgroundColor: Colors.primaryBlue,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
  },
  centeredBandCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -20,
  },
  centeredBandCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: 60,
  },
  centeredModalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  centeredModalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  centeredModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  centeredModalSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  centeredCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  centeredFormSection: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: Colors.softGrayBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.lightGrayBorder,
  },
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBorder,
  },
  sectionIconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryBlue,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryBlue,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldWrapper: { marginBottom: 14 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.darkText,
    marginBottom: 7,
  },
  requiredStar: { color: Colors.errorRed },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.lightGrayBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputWrapperError: {
    borderColor: Colors.errorRed,
    backgroundColor: Colors.errorBg,
  },
  inputIcon: { marginRight: 8 },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.mediumText,
    marginRight: 4,
  },
  input: { flex: 1, fontSize: 15, color: Colors.darkText, paddingVertical: 10 },
  fieldErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
    marginLeft: 2,
  },
  fieldErrorText: {
    fontSize: 12,
    color: Colors.errorRed,
    fontWeight: "500",
    flex: 1,
  },
  purposeGrid: { flexDirection: "row", flexWrap: "nowrap", gap: 4 },
  purposeChip: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.lightGrayBorder,
    backgroundColor: Colors.cardBackground,
    position: "relative",
    gap: 4,
  },
  purposeChipSelected: {
    borderColor: Colors.primaryBlue,
    backgroundColor: Colors.softBlueAccent,
  },
  purposeChipText: {
    color: Colors.mediumText,
    fontWeight: "600",
    fontSize: 10,
    textAlign: "center",
  },
  purposeChipTextSelected: { color: Colors.primaryBlue, fontWeight: "700" },
  purposeCheckmark: { position: "absolute", top: 6, right: 6 },
  centeredCertBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: Colors.softBlueAccent,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C8DCF8",
  },
  certificationText: {
    fontSize: 12,
    color: Colors.primaryBlue,
    fontStyle: "italic",
    flex: 1,
    lineHeight: 18,
  },
  centeredSubmitBtn: {
    backgroundColor: Colors.primaryBlue,
    marginHorizontal: 18,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 6,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  submitButtonInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  submitFormButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 20,
    minHeight: 300,
  },
  stateText: {
    fontSize: 16,
    color: Colors.mediumText,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyStateIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.softBlueAccent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  messageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.darkText,
    marginBottom: -8,
    textAlign: "center",
  },
  messageText: {
    fontSize: 15,
    color: Colors.mediumText,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: -5,
    paddingHorizontal: 20,
  },
  primaryActionBtn: {
    flexDirection: "row",
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cardsList: { gap: 20, paddingBottom: 10 },
  stylishCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
    position: "relative",
  },
  cardTopAccent: { height: 4, width: "100%" },
  cardTopSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 24,
    paddingBottom: 15,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.mediumText,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
    marginBottom: 6,
    opacity: 0.8,
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.primaryBlue,
    letterSpacing: -1,
    lineHeight: 36,
  },
  floatingStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 25,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingStatusText: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  detailsListContainer: { paddingHorizontal: 20, paddingBottom: 10 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 15,
  },
  rowIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.softBlueAccent,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTextContainer: { flex: 1, justifyContent: "center" },
  rowLabel: {
    fontSize: 11,
    color: Colors.mediumText,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  rowValue: { fontSize: 15, color: Colors.darkText, fontWeight: "600" },
  listDivider: { height: 1, backgroundColor: "#F0F2F5", marginLeft: 59 },
  remarksStylishContainer: {
    backgroundColor: "#FAFBFC",
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 5,
  },
  remarksHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.mediumText,
    textTransform: "uppercase",
  },
  remarksValueText: {
    fontSize: 14,
    color: Colors.darkText,
    lineHeight: 22,
    fontWeight: "500",
    fontStyle: "italic",
  },
});

export default MyLoan;
