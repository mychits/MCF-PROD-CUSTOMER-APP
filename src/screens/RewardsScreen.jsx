import React, { useState, useContext, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    StatusBar, Alert, ActivityIndicator, RefreshControl, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios from 'axios';

// Import configurations
import url from "../data/url"; 
import { ContextProvider } from "../context/UserProvider";

const { width } = Dimensions.get('window');
const PRIMARY_BLUE = "#053B90"; 
const DEEP_NAVY = "#03255a";
const ACCENT_GOLD = "#FFD700";

const RewardsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [appUser] = useContext(ContextProvider);
    
    const userId = appUser?.userId || 'Guest'; 

    const [rewardData, setRewardData] = useState(null);
    const [rewardSettings, setRewardSettings] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('earn'); 

    const GET_URL = `${url}/customer-rewards/customer-reward-points/${userId}`;
    const SETTINGS_URL = `${url}/reward-points/reward-settings`; 

    const fetchData = async () => {
        try {
            const [pointsRes, settingsRes] = await Promise.all([
                axios.get(GET_URL),
                axios.get(SETTINGS_URL)
            ]);

            if (pointsRes.data.success) setRewardData(pointsRes.data);
            if (settingsRes.data.success) setRewardSettings(settingsRes.data.settings);
        } catch (err) {
            console.error("Fetch Error:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, [userId]);

    const renderEarnRules = () => {
        const rules = [
            { 
                id: 1, 
                name: 'Refer a Friend', 
                desc: 'Earn points for every new customer you refer.', 
                pts: rewardSettings?.customer_reward_point || 0, 
                icon: 'account-multiple-plus', 
                color: '#10b981' 
            },
            { 
                id: 2, 
                name: 'Payment Link', 
                desc: 'Earn points by paying via our secure links.', 
                pts: rewardSettings?.payment_link_reward_point || 0, 
                icon: 'link-variant', 
                color: '#3b82f6' 
            },
            { 
                id: 3, 
                name: 'Early Auction Pay', 
                desc: 'Pay before the auction date for bonus points.', 
                pts: rewardSettings?.auction_pay_reward_point || 0, 
                icon: 'clock-fast', 
                color: '#f59e0b' 
            },
        ];

        return (
            <View style={styles.contentSection}>
                {/* Simple 1-line explanation box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                         Collect points by inviting friends, using payment links, or paying your dues before the auction date!
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Ways to Earn</Text>
                {rules.map(item => (
                    <View key={item.id} style={styles.ruleCard}>
                        <View style={[styles.rewardIconBadge, { backgroundColor: item.color + '15' }]}>
                            <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rewardName}>{item.name}</Text>
                            <Text style={styles.rewardDesc}>{item.desc}</Text>
                        </View>
                        <View style={styles.pointsBadge}>
                            <Text style={[styles.pointsValue, { color: item.color }]}>+{item.pts}</Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderHistory = () => (
        <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {rewardData?.reward_breakup?.length > 0 ? (
                rewardData.reward_breakup.map((log, i) => (
                    <View key={i} style={styles.historyCard}>
                        <View style={styles.historyIcon}><MaterialIcons name="receipt-long" size={20} color={PRIMARY_BLUE} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.historyName}>{log.source_type || "Point Redemption"}</Text>
                            <Text style={styles.historyDate}>Ref: {log.reward_id?.slice(-8).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.historyPoints}>-{log.points_used} pts</Text>
                    </View>
                ))
            ) : (
                <Text style={styles.emptyText}>No redemption history available.</Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={[PRIMARY_BLUE, DEEP_NAVY]} style={[styles.heroHeader, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerNav}>
                    <Text style={styles.brandText}>ChitRewards</Text>
                    <TouchableOpacity style={styles.roundBtn}><Ionicons name="notifications-outline" size={22} color="#fff" /></TouchableOpacity>
                </View>
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Total available points</Text>
                    {/* Unified Balance Row */}
                    <View style={styles.balanceRow}>
                        <Text style={styles.pointsTotal}>{rewardData?.balance_points || 0}</Text>
                        <MaterialCommunityIcons name="trophy-variant" size={24} color={ACCENT_GOLD} style={{ marginLeft: 10 }} />
                    </View>
                    <View style={styles.cashBadge}><Text style={styles.cashText}>Value: ₹{rewardData?.total_redeemed_amount || 0}</Text></View>
                </View>
            </LinearGradient>

            <View style={styles.tabWrapper}>
                <View style={styles.tabBar}>
                    {['earn', 'history'].map((tab) => (
                        <TouchableOpacity 
                            key={tab} 
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                        >
                            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
                                {tab === 'earn' ? 'Earn' : 'History'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollBody}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor={PRIMARY_BLUE} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={PRIMARY_BLUE} style={{ marginTop: 40 }} />
                ) : activeTab === 'earn' ? renderEarnRules() : renderHistory()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    heroHeader: { paddingHorizontal: 25, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    brandText: { fontSize: 18, fontWeight: '800', color: '#fff' },
    roundBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 15 },
    balanceContainer: { alignItems: 'center', marginTop: 10 },
    balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },
    balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    pointsTotal: { fontSize: 60, fontWeight: '900', color: '#fff' },
    cashBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 5 },
    cashText: { color: '#fff', fontWeight: '600' },
    tabWrapper: { alignItems: 'center', marginTop: -30 },
    tabBar: { flexDirection: 'row', backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 6, elevation: 12 },
    tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 15 },
    activeTabItem: { backgroundColor: PRIMARY_BLUE },
    tabLabel: { fontSize: 14, color: '#64748B', fontWeight: '700' },
    activeTabLabel: { color: '#fff' },
    scrollBody: { padding: 25, paddingTop: 40 },
    infoBox: { backgroundColor: '#E0E7FF', padding: 12, borderRadius: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: PRIMARY_BLUE },
    infoText: { color: '#3730A3', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
    ruleCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 18, borderRadius: 24, marginBottom: 15, alignItems: 'center', elevation: 2 },
    rewardIconBadge: { padding: 12, borderRadius: 18, marginRight: 15 },
    rewardName: { fontSize: 16, fontWeight: '700', color: '#334155' },
    rewardDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
    pointsBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 10 },
    pointsValue: { fontWeight: '800', fontSize: 14 },
    historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: PRIMARY_BLUE },
    historyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    historyName: { fontSize: 15, fontWeight: '700', color: '#334155' },
    historyPoints: { color: '#EF4444', fontWeight: '800' },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 50 }
});

export default RewardsScreen;