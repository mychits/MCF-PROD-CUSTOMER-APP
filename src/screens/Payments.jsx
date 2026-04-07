import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    StatusBar,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Image,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import url from '../data/url';
import { LinearGradient } from 'expo-linear-gradient';
import { ContextProvider } from '../context/UserProvider';
import Group400 from '../../assets/Group400.png';

const { width } = Dimensions.get('window');

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const COLORS = {
    primary: "#053B90",
    accent: "#f8c009ff",
    bgBlue: "#1aa2ccff",
    success: "#27AE60",
    cardBg: "rgba(255, 255, 255, 0.98)",
    white: "#FFFFFF",
    muted: "#8898AA",
    background: "#0f2a44",
};

// ─── UTILS ──────────────────────────────────────────────────────────────────
const formatNumberIndianStyle = (num) => {
    if (!num) return "0.00";
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── COMPONENTS ────────────────────────────────────────────────────────────

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || "N/A"}</Text>
    </View>
);

const TransactionCard = React.memo(({ item, onPress, showCategoryBadge, serialNumber }) => {
    let icon, iconBg, title, subtitle, accentColor;

    switch (item.pay_for) {
        case 'Chit':
            icon = <MaterialCommunityIcons name="wallet-membership" size={16} color={COLORS.primary} />;
            iconBg = "#E8EAF6"; 
            accentColor = COLORS.primary;
            title = item.group_name || "Chit Plan";
            subtitle = `Ticket: #${item.ticket || 'N/A'}`;
            break;
        case 'Pigmy':
            icon = <FontAwesome5 name="piggy-bank" size={12} color="#009688" />;
            iconBg = "#E0F2F1"; 
            accentColor = "#009688";
            title = `Pigmy Savings`;
            subtitle = `ID: ${item.pigme_id || 'N/A'}`;
            break;
        case 'Loan':
            icon = <MaterialIcons name="speed" size={16} color="#FF9800" />;
            iconBg = "#FFF3E0"; 
            accentColor = "#FF9800";
            title = `Loan Installment`;
            subtitle = `Ref: ${item.loan_id || 'N/A'}`;
            break;
        default:
            icon = <MaterialIcons name="payment" size={16} color={COLORS.muted} />;
            iconBg = "#F1F5F9";
            accentColor = COLORS.muted;
            title = "General Payment";
            subtitle = item.receipt_no;
    }

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(item)} style={styles.cardContainer}>
            <View style={styles.serialBadge}>
                <Text style={styles.serialText}>{serialNumber}</Text>
            </View>

            <View style={styles.cardInner}>
                <View style={styles.cardTopRow}>
                    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                        {icon}
                    </View>
                    <View style={styles.headerText}>
                        <View style={styles.titleRow}>
                            <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
                            {showCategoryBadge && (
                                <View style={[styles.inlineCategoryTag, { backgroundColor: iconBg }]}>
                                    <Text style={[styles.inlineCategoryText, { color: accentColor }]}>{item.pay_for}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.subtitleText}>{subtitle}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>SUCCESS</Text>
                    </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.cardBottomRow}>
                    <View style={styles.detailsCol}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={10} color={COLORS.muted} />
                            <Text style={styles.infoText}>{formatDate(item.pay_date)}</Text>
                        </View>
                    </View>
                    <View style={styles.amountCol}>
                        <Text style={styles.currencySymbol}>₹<Text style={styles.amountMain}>{formatNumberIndianStyle(item.amount)}</Text></Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const Payments = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [appUser] = useContext(ContextProvider);
    const [allPayments, setAllPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchPayments = useCallback(async () => {
        if (!appUser?.userId) {
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get(`${url}/payment/get-user-payments/${appUser.userId}`);
            if (response.data?.data) {
                const sorted = response.data.data.sort((a, b) => new Date(b.pay_date) - new Date(a.pay_date));
                setAllPayments(sorted);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [appUser?.userId]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    const filteredData = useMemo(() => {
        return allPayments.filter(i => activeTab === 'All' || i.pay_for === activeTab);
    }, [allPayments, activeTab]);

    const totalAmount = useMemo(() => {
        return filteredData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    }, [filteredData]);

    const handleMaximize = useCallback((item) => {
        setSelectedItem(item);
        setModalVisible(true);
    }, []);

    const ListHeader = () => (
        <View style={styles.headerFullWidth}>
            <LinearGradient colors={[COLORS.primary, COLORS.background]} style={styles.summaryCard}>
                <Image source={Group400} style={styles.watermark} />
                <Text style={styles.summaryLabel}>Total Contribution</Text>
                <Text style={styles.summaryAmount}>
                    {loading ? "••••••" : `₹${formatNumberIndianStyle(totalAmount)}`}
                </Text>
                <View style={styles.summaryFooter}>
                    <View style={styles.stat}>
                        <Text style={styles.statVal}>{loading ? "--" : filteredData.length}</Text>
                        <Text style={styles.statLabel}>Receipts</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statVal}>{activeTab}</Text>
                        <Text style={styles.statLabel}>Category</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.tabWrapper}>
                {['All', 'Chit', 'Pigmy', 'Loan'].map((tab) => (
                    <TouchableOpacity 
                        key={tab} 
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                    >
                        <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.sectionHeader}>
                <View style={styles.yellowLabel}>
                    <Text style={styles.yellowLabelText}>TRANSACTION LOG</Text>
                </View>
                <View style={styles.lineDecorator} />
            </View>
        </View>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="database-off-outline" size={40} color={COLORS.muted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>{`No data for ${activeTab}`}</Text>
            <TouchableOpacity onPress={fetchPayments} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Transactions History</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.body}>
                {loading && !refreshing ? (
                    <View style={styles.loaderWrapper}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.loaderText}>Syncing your payments...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <TransactionCard 
                                item={item} 
                                serialNumber={index + 1}
                                onPress={handleMaximize} 
                                showCategoryBadge={activeTab === 'All'} 
                            />
                        )}
                        ListHeaderComponent={ListHeader}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<EmptyState />}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} tintColor={COLORS.primary} />
                        }
                    />
                )}
            </View>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        {selectedItem && (
                            <View style={styles.receiptBody}>
                                <Text style={styles.modalTitle}>Payment Receipt</Text>
                                <Text style={styles.receiptMainAmount}>₹{formatNumberIndianStyle(selectedItem.amount)}</Text>
                                <View style={styles.receiptInfoGrid}>
                                    <DetailRow label="Receipt No" value={selectedItem.receipt_no} />
                                    <DetailRow label="Date" value={formatDate(selectedItem.pay_date)} />
                                    <DetailRow label="Category" value={selectedItem.pay_for} />
                                </View>
                                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.closeModalBtnText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: COLORS.primary },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
    topBarTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
    iconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    body: { flex: 1, backgroundColor: "#F8F9FA", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    loaderWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 8, color: COLORS.primary, fontWeight: '600', fontSize: 11 },
    listContent: { paddingHorizontal: 12, paddingBottom: 20 },
    headerFullWidth: { marginTop: 10 },

    // --- COMPACT SUMMARY CARD ---
    summaryCard: { 
        borderRadius: 12, 
        paddingVertical: 12, 
        paddingHorizontal: 15, 
        marginBottom: 12, 
        elevation: 4,
        overflow: 'hidden' 
    },
    watermark: { 
        position: 'absolute', 
        right: -5, 
        bottom: -5, 
        width: 70, 
        height: 70, 
        opacity: 0.1, 
        tintColor: COLORS.white 
    },
    summaryLabel: { 
        color: COLORS.bgBlue, 
        fontSize: 10, 
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    summaryAmount: { 
        color: COLORS.white, 
        fontSize: 22, 
        fontWeight: '800', 
        marginVertical: 2 
    },
    summaryFooter: { 
        flexDirection: 'row', 
        marginTop: 8, 
        paddingTop: 8, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255,255,255,0.1)' 
    },
    stat: { flex: 1 },
    statVal: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: -2 },
    statDivider: { width: 1, height: 15, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
    
    // --- COMPACT TABS ---
    tabWrapper: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 2, marginBottom: 12 },
    tabBtn: { flex: 1, paddingVertical: 5, alignItems: 'center', borderRadius: 6 },
    tabBtnActive: { backgroundColor: COLORS.white, elevation: 1 },
    tabBtnText: { fontSize: 10, fontWeight: '600', color: COLORS.muted },
    tabBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
    
    sectionHeader: { marginBottom: 10, height: 20, justifyContent: 'center' },
    yellowLabel: { backgroundColor: COLORS.accent, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3, alignSelf: 'flex-start', zIndex: 2 },
    yellowLabelText: { color: COLORS.primary, fontWeight: '900', fontSize: 8 },
    lineDecorator: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.primary, opacity: 0.1, top: 10 },
    
    // --- COMPACT TRANSACTION CARDS ---
    cardContainer: { backgroundColor: COLORS.white, borderRadius: 10, marginBottom: 8, elevation: 2, marginHorizontal: 2 },
    serialBadge: {
        position: 'absolute',
        top: -5,
        left: -5,
        backgroundColor: COLORS.accent,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    serialText: { fontSize: 8, fontWeight: '900', color: COLORS.primary },
    cardInner: { padding: 8 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    headerText: { flex: 1, marginLeft: 8 },
    titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    titleText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
    subtitleText: { fontSize: 9, color: COLORS.muted },
    inlineCategoryTag: { marginLeft: 5, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
    inlineCategoryText: { fontSize: 7, fontWeight: '800' },
    statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
    statusText: { color: COLORS.success, fontSize: 7, fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: 9, color: COLORS.muted, marginLeft: 3 },
    amountMain: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
    currencySymbol: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },

    // Empty State
    emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
    emptyText: { color: COLORS.muted, marginTop: 10, fontSize: 11, fontWeight: '600' },
    refreshBtn: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: COLORS.primary },
    refreshBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 10 },
    
    // Modal (Receipt Detail)
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHandle: { width: 30, height: 4, backgroundColor: '#CBD5E1', borderRadius: 5, alignSelf: 'center', marginBottom: 10 },
    receiptBody: { alignItems: 'center' },
    modalTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 5 },
    receiptMainAmount: { fontSize: 26, fontWeight: '900', color: COLORS.primary, marginBottom: 15 },
    receiptInfoGrid: { width: '100%', backgroundColor: "#F8F9FA", borderRadius: 12, padding: 12, marginBottom: 15 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    detailLabel: { color: COLORS.muted, fontWeight: '600', fontSize: 11 },
    detailValue: { color: COLORS.primary, fontWeight: '700', fontSize: 11 },
    closeModalBtn: { backgroundColor: COLORS.primary, width: '100%', padding: 12, borderRadius: 10, alignItems: 'center' },
    closeModalBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 }
});

export default Payments;