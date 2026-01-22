import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    StatusBar, Alert, ActivityIndicator, RefreshControl, Dimensions,
    Modal, TextInput, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios from 'axios';

import url from "../data/url"; 
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get('window');
const PRIMARY_BLUE = "#053B90"; 
const DEEP_NAVY = "#03255a";
const ACCENT_GOLD = "#FFD700";
const ERROR_RED = "#EF4444";
const SUCCESS_GREEN = "#10b981";

const RewardsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [appUser] = useContext(ContextProvider);
    const userId = appUser?.userId || appUser?._id; 

    const [rewardData, setRewardData] = useState(null);
    const [rewardHistory, setRewardHistory] = useState([]); 
    const [rewardSettings, setRewardSettings] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('earn'); 

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const successScale = useRef(new Animated.Value(0)).current;

    const [modalVisible, setModalVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [redeemPoints, setRedeemPoints] = useState('');
    const [description, setDescription] = useState('');
    const [redemptionType, setRedemptionType] = useState('Voucher'); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOverLimit, setIsOverLimit] = useState(false);

    // Endpoints
    const GET_URL = `${url}/customer-rewards/customer-reward-points/${userId}`;
    const SETTINGS_URL = `${url}/reward-points/reward-settings`; 
    const REDEEM_URL = `${url}/customer-rewards/customer-reward-points/redeem`;
    const HISTORY_URL = `${url}/customer-rewards/customer-reward-list/${userId}`;

    const balance = rewardData?.balance_points || 0;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ])
        ).start();
        if(userId) fetchData();
    }, [userId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pointsRes, settingsRes, historyRes] = await Promise.all([
                axios.get(GET_URL),
                axios.get(SETTINGS_URL),
                axios.get(HISTORY_URL)
            ]);
            if (pointsRes.data.success) setRewardData(pointsRes.data);
            if (settingsRes.data.success) setRewardSettings(settingsRes.data.settings);
            if (historyRes.data.success) setRewardHistory(historyRes.data.data);
        } catch (err) {
            console.error("🔴 Fetch Error:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePointsChange = (text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        const pointsInt = parseInt(numericValue);
        if (numericValue === '' || isNaN(pointsInt)) {
            setRedeemPoints('');
            setIsOverLimit(false);
        } else if (pointsInt > balance) {
            setRedeemPoints(balance.toString());
            setIsOverLimit(true);
            triggerShake();
            setTimeout(() => setIsOverLimit(false), 2000);
        } else {
            setRedeemPoints(numericValue);
            setIsOverLimit(false);
        }
    };

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const triggerSuccessAnimation = () => {
        setSuccessVisible(true);
        Animated.spring(successScale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true
        }).start();
    };

    const handleRedeem = async () => {
        const payload = {
            customer_id: String(userId),
            redeem_points: Number(redeemPoints),
            redemption_type: String(redemptionType),
            description: description || `Request for ${redemptionType}`
        };
        if (!redeemPoints || parseInt(redeemPoints) <= 0) return Alert.alert("Invalid", "Enter points.");
        
        setIsSubmitting(true);
        try {
            const response = await axios.post(REDEEM_URL, payload);
            if (response.data.success) {
                setModalVisible(false);
                setRedeemPoints('');
                setDescription('');
                fetchData(); 
                // Trigger stylish success instead of Alert
                triggerSuccessAnimation();
            }
        } catch (err) {
            Alert.alert("Error", "Transaction failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderEarnRules = () => {
        const rules = [
            { id: 1, name: 'Refer a Friend', desc: 'Get points for every referral.', pts: rewardSettings?.customer_reward_point || 0, icon: 'account-group', color: SUCCESS_GREEN },
            { id: 2, name: 'Payment Link', desc: 'Earn by paying through Pay Online option.', pts: rewardSettings?.payment_link_reward_point || 0, icon: 'flash', color: '#3b82f6' },
            { id: 3, name: 'Early Pay', desc: 'Reward for paying due before auction.', pts: rewardSettings?.auction_pay_reward_point || 0, icon: 'calendar-check', color: '#f59e0b' },
        ];
        return (
            <Animated.View style={{ opacity: fadeAnim }}>
                <Animated.View style={[styles.infoBox, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient colors={['#E0F2FE', '#DBEAFE']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.infoGradient}>
                        <MaterialCommunityIcons name="information" size={20} color={PRIMARY_BLUE} />
                        <Text style={styles.infoText}>Refer friends, Pay Online throught MyChits Mobile app, or Pay Dues before your auction to earn reward points!</Text>
                    </LinearGradient>
                </Animated.View>
                <Text style={styles.sectionTitle}>Ways to Earn</Text>
                {rules.map(item => (
                    <TouchableOpacity key={item.id} style={styles.ruleCard} activeOpacity={0.7}>
                        <View style={[styles.rewardIconBadge, { backgroundColor: item.color + '15' }]}>
                            <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rewardName}>{item.name}</Text>
                            <Text style={styles.rewardDesc}>{item.desc}</Text>
                        </View>
                        <View style={styles.pointsBadge}><Text style={[styles.pointsValue, { color: item.color }]}>+{item.pts}</Text></View>
                    </TouchableOpacity>
                ))}
            </Animated.View>
        );
    };

    const renderHistory = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Points Activity</Text>
                <Text style={styles.sectionSubtitle}>Keep track of your earnings and redemptions.</Text>
            </View>
            {rewardHistory && rewardHistory.length > 0 ? (
                rewardHistory.map((log, i) => {
                    const isDeducted = log.status === "Deducted";
                    return (
                        <View key={log._id || i} style={styles.historyCard}>
                            <View style={[styles.historyIcon, { backgroundColor: isDeducted ? '#FEE2E2' : '#D1FAE5' }]}>
                                <MaterialIcons name={isDeducted ? "remove-circle-outline" : "add-circle-outline"} size={22} color={isDeducted ? ERROR_RED : SUCCESS_GREEN} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.historyName}>{log.remarks || "Reward Points"}</Text>
                                <Text style={styles.historyDate}>{new Date(log.reward_date).toLocaleDateString()} • {log.source_type}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.historyPoints, { color: isDeducted ? ERROR_RED : SUCCESS_GREEN }]}>{isDeducted ? `-${log.reward_points}` : `+${log.reward_points}`}</Text>
                                <Text style={styles.statusText}>{log.status}</Text>
                            </View>
                        </View>
                    );
                })
            ) : (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="history" size={50} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No activity history found.</Text>
                </View>
            )}
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* FIXED HEADER AND TABS */}
            <View style={styles.fixedHeaderContainer}>
                <LinearGradient colors={[PRIMARY_BLUE, DEEP_NAVY]} style={[styles.heroHeader, { paddingTop: insets.top + 10 }]}>
                    <View style={styles.headerNav}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.brandText}>REWARDS CENTER</Text>
                        <TouchableOpacity style={styles.roundBtn}>
                            <Ionicons name="help-circle-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Rewards Points </Text>
                        <View style={styles.balanceRow}>
                            <Text style={styles.pointsTotal}>{balance}</Text>
                            <View style={styles.trophyCircle}>
                                <MaterialCommunityIcons name="trophy" size={24} color={ACCENT_GOLD} />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.redeemActionBtn} onPress={() => setModalVisible(true)}>
                            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.redeemGradient}>
                                <Text style={styles.redeemActionText}>Redeem Points</Text>
                                <MaterialIcons name="keyboard-arrow-right" size={20} color={DEEP_NAVY} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.tabWrapper}>
                    <View style={styles.tabBar}>
                        {['earn', 'history'].map((tab) => (
                            <TouchableOpacity 
                                key={tab} 
                                onPress={() => {
                                    setActiveTab(tab);
                                    fadeAnim.setValue(0);
                                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
                                }}
                                style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                            >
                                <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
                                    {tab === 'earn' ? 'Earn' : 'Activity'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* SCROLLABLE CONTENT */}
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 340 + insets.top }} 
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={() => { setRefreshing(true); fetchData(); }} 
                        tintColor={PRIMARY_BLUE} 
                    />
                }
            >
                <View style={styles.scrollBody}>
                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color={PRIMARY_BLUE} style={{ marginTop: 40 }} />
                    ) : activeTab === 'earn' ? renderEarnRules() : renderHistory()}
                </View>
            </ScrollView>

            {/* REDEEM MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Redeem Points</Text>
                                <Text style={styles.modalSubtitle}>Convert your hard-earned points</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close-circle" size={32} color="#CBD5E1" /></TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Choose Reward Type</Text>
                        <View style={styles.typeSelectorContainer}>
                            {['Voucher', 'Gift'].map((type) => (
                                <TouchableOpacity 
                                    key={type} 
                                    onPress={() => setRedemptionType(type)} 
                                    style={[styles.typeOption, redemptionType === type && styles.typeOptionSelected]}
                                >
                                    <MaterialCommunityIcons 
                                        name={type === 'Voucher' ? 'ticket-percent' : 'gift'} 
                                        size={20} 
                                        color={redemptionType === type ? '#fff' : '#64748B'} 
                                    />
                                    <Text style={[styles.typeOptionText, redemptionType === type && styles.typeOptionTextSelected]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalBalanceRow}>
                            <Text style={styles.inputLabel}>Points to Convert</Text>
                            <Text style={styles.miniBalanceText}>Available Points: {balance}</Text>
                        </View>

                        <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                            <TextInput 
                                style={[styles.input, isOverLimit && styles.inputError]} 
                                keyboardType="numeric" 
                                value={redeemPoints} 
                                onChangeText={handlePointsChange} 
                                placeholder="Enter reward points to Redeem.."
                                placeholderTextColor="#94A3B8"
                            />
                        </Animated.View>

                        <Text style={[styles.inputLabel, { marginTop: 20 }]}>Notes (Optional)</Text>
                        <TextInput 
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                            multiline 
                            value={description} 
                            onChangeText={setDescription} 
                            placeholder="Tell us more about your request..." 
                            placeholderTextColor="#94A3B8"
                        />

                        <TouchableOpacity 
                            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
                            onPress={handleRedeem} 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Redemption</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* STYLISH SUCCESS MODAL */}
            <Modal visible={successVisible} transparent animationType="fade">
                <View style={styles.successOverlay}>
                    <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
                        <LinearGradient colors={['#D1FAE5', '#F0FDF4']} style={styles.successCircle}>
                            <MaterialIcons name="check-circle" size={80} color={SUCCESS_GREEN} />
                        </LinearGradient>
                        <Text style={styles.successTitle}>Request Sent!</Text>
                        <Text style={styles.successMessage}>Your redemption request has been submitted successfully.</Text>
                        <TouchableOpacity 
                            style={styles.successBtn} 
                            onPress={() => {
                                setSuccessVisible(false);
                                successScale.setValue(0);
                            }}
                        >
                            <Text style={styles.successBtnText}>Great!</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    fixedHeaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: '#F1F5F9',
    },
    heroHeader: { paddingHorizontal: 25, paddingBottom: 60, borderBottomLeftRadius: 45, borderBottomRightRadius: 45 },
    headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    brandText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    roundBtn: { backgroundColor: 'rgba(255,255,255,0.12)', padding: 10, borderRadius: 12 },
    balanceContainer: { alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', marginBottom: 5 },
    balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    pointsTotal: { fontSize: 50, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    trophyCircle: { backgroundColor: 'rgba(255,215,0,0.2)', padding: 8, borderRadius: 20, marginLeft: 15 },
    redeemActionBtn: { marginTop: 15, borderRadius: 20, overflow: 'hidden', elevation: 5 },
    redeemGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 10 },
    redeemActionText: { color: DEEP_NAVY, fontWeight: '900', fontSize: 14, marginRight: 5 },
    tabWrapper: { alignItems: 'center', marginTop: -25, marginBottom: 10 },
    tabBar: { flexDirection: 'row', backgroundColor: '#fff', width: '85%', borderRadius: 25, padding: 6, elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15 },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20 },
    activeTabItem: { backgroundColor: PRIMARY_BLUE },
    tabLabel: { fontWeight: '800', color: '#94A3B8', fontSize: 13 },
    activeTabLabel: { color: '#fff' },
    scrollBody: { padding: 25 },
    infoBox: { marginBottom: 25, borderRadius: 18, overflow: 'hidden', elevation: 3 },
    infoGradient: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    infoText: { flex: 1, color: '#1E40AF', fontSize: 13, fontWeight: '700', marginLeft: 10, lineHeight: 18 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 15, letterSpacing: -0.5 },
    sectionSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500', marginTop: -10 },
    ruleCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 18, borderRadius: 24, marginBottom: 15, alignItems: 'center', elevation: 2 },
    rewardIconBadge: { padding: 12, borderRadius: 20, marginRight: 15 },
    rewardName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    rewardDesc: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
    pointsBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    pointsValue: { fontWeight: '900', fontSize: 14 },
    historyCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 22, marginBottom: 12, alignItems: 'center' },
    historyIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    historyName: { fontWeight: '800', fontSize: 14, color: '#334155' },
    historyDate: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
    historyPoints: { fontWeight: '900', fontSize: 16 },
    statusText: { fontSize: 9, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 10, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(3, 37, 90, 0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: PRIMARY_BLUE },
    modalSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500' },
    typeSelectorContainer: { flexDirection: 'row', marginBottom: 25 },
    typeOption: { flex: 1, flexDirection: 'row', padding: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F8FAFC', marginHorizontal: 5, borderWidth: 1, borderColor: '#E2E8F0' },
    typeOptionSelected: { backgroundColor: PRIMARY_BLUE, borderColor: PRIMARY_BLUE },
    typeOptionText: { color: '#64748B', fontWeight: '800', fontSize: 14, marginLeft: 8 },
    typeOptionTextSelected: { color: '#fff' },
    modalBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    miniBalanceText: { color: PRIMARY_BLUE, fontWeight: '800', fontSize: 13 },
    inputLabel: { fontWeight: '800', marginBottom: 8, color: '#475569', fontSize: 14 },
    input: { backgroundColor: '#F1F5F9', borderRadius: 20, padding: 18, fontSize: 15, color: '#1E293B', fontWeight: '700' },
    inputError: { borderWidth: 1, borderColor: ERROR_RED, backgroundColor: '#FFF5F5' },
    submitBtn: { backgroundColor: PRIMARY_BLUE, padding: 20, borderRadius: 22, marginTop: 30, alignItems: 'center', elevation: 8 },
    submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    // SUCCESS MODAL STYLES
    successOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', justifyContent: 'center', alignItems: 'center' },
    successCard: { width: width * 0.85, backgroundColor: '#fff', borderRadius: 35, padding: 30, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
    successCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
    successMessage: { textAlign: 'center', color: '#64748B', fontSize: 15, lineHeight: 22, marginBottom: 25 },
    successBtn: { backgroundColor: SUCCESS_GREEN, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 20, elevation: 5 },
    successBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 }
});

export default RewardsScreen;