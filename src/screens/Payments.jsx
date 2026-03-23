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
            icon = <MaterialCommunityIcons name="wallet-membership" size={20} color={COLORS.primary} />;
            iconBg = "#E8EAF6"; 
            accentColor = COLORS.primary;
            title = item.group_name || "Chit Plan";
            subtitle = `Ticket: #${item.ticket || 'N/A'}`;
            break;
        case 'Pigmy':
            icon = <FontAwesome5 name="piggy-bank" size={16} color="#009688" />;
            iconBg = "#E0F2F1"; 
            accentColor = "#009688";
            title = `Pigmy Savings`;
            subtitle = `ID: ${item.pigme_id || 'N/A'}`;
            break;
        case 'Loan':
            icon = <MaterialIcons name="speed" size={20} color="#FF9800" />;
            iconBg = "#FFF3E0"; 
            accentColor = "#FF9800";
            title = `Loan Installment`;
            subtitle = `Ref: ${item.loan_id || 'N/A'}`;
            break;
        default:
            icon = <MaterialIcons name="payment" size={20} color={COLORS.muted} />;
            iconBg = "#F1F5F9";
            accentColor = COLORS.muted;
            title = "General Payment";
            subtitle = item.receipt_no;
    }

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(item)} style={styles.cardContainer}>
            {/* Serial Number Badge */}
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
                            <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
                            <Text style={styles.infoText}>{formatDate(item.pay_date)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="document-text-outline" size={12} color={COLORS.muted} />
                            <Text style={styles.infoText}>{item.receipt_no}</Text>
                        </View>
                    </View>
                    <View style={styles.amountCol}>
                        <Text style={styles.currencySymbol}>₹ <Text style={styles.amountMain}>{formatNumberIndianStyle(item.amount)}</Text></Text>
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
                    {loading ? "••••••" : `₹ ${formatNumberIndianStyle(totalAmount)}`}
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
            <MaterialCommunityIcons name="database-off-outline" size={70} color={COLORS.muted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>{`No transactions found for ${activeTab}`}</Text>
            <TouchableOpacity onPress={fetchPayments} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>Refresh Data</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Transactions History</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.body}>
                {loading && !refreshing ? (
                    <View style={styles.loaderWrapper}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loaderText}>Syncing your payments...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item, index) => item.receipt_no ? `${item.pay_for}-${item.receipt_no}-${index}` : index.toString()}
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
                                <Text style={styles.receiptMainAmount}>₹ {formatNumberIndianStyle(selectedItem.amount)}</Text>
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
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
    topBarTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    body: { flex: 1, backgroundColor: "#F8F9FA", borderTopLeftRadius: 35, borderTopRightRadius: 35 },
    loaderWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
    loaderText: { marginTop: 12, color: COLORS.primary, fontWeight: '600', fontSize: 14 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    headerFullWidth: { marginTop: 25 },
    summaryCard: { borderRadius: 25, padding: 25, marginBottom: 25, elevation: 8 },
    watermark: { position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, opacity: 0.1, tintColor: COLORS.white },
    summaryLabel: { color: COLORS.bgBlue, fontSize: 13, fontWeight: '600' },
    summaryAmount: { color: COLORS.white, fontSize: 32, fontWeight: '800', marginVertical: 8 },
    summaryFooter: { flexDirection: 'row', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    stat: { flex: 1 },
    statVal: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    statLabel: { color: COLORS.muted, fontSize: 11 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 15 },
    tabWrapper: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 15, padding: 5, marginBottom: 25 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabBtnActive: { backgroundColor: COLORS.white, elevation: 2 },
    tabBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
    tabBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
    sectionHeader: { marginBottom: 20, height: 35, justifyContent: 'center' },
    yellowLabel: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', zIndex: 2 },
    yellowLabelText: { color: COLORS.primary, fontWeight: '900', fontSize: 10 },
    lineDecorator: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.primary, opacity: 0.1, top: 17 },
    
    // Updated Card Container
    cardContainer: { backgroundColor: COLORS.white, borderRadius: 20, marginBottom: 20, elevation: 3, marginHorizontal: 4 },
    serialBadge: {
        position: 'absolute',
        top: -8,
        left: -8,
        backgroundColor: COLORS.accent,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 4,
        borderWidth: 1.5,
        borderColor: COLORS.white,
    },
    serialText: { fontSize: 10, fontWeight: '900', color: COLORS.primary },
    
    cardInner: { padding: 16 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerText: { flex: 1, marginLeft: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    titleText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    subtitleText: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
    inlineCategoryTag: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    inlineCategoryText: { fontSize: 9, fontWeight: '900' },
    statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { color: COLORS.success, fontSize: 9, fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    infoText: { fontSize: 11, color: COLORS.muted, marginLeft: 5 },
    amountMain: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { color: COLORS.muted, marginTop: 15, fontSize: 14, textAlign: 'center', fontWeight: '600' },
    refreshBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary },
    refreshBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
    modalHandle: { width: 40, height: 5, backgroundColor: '#CBD5E1', borderRadius: 10, alignSelf: 'center', marginBottom: 15 },
    receiptBody: { alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 10 },
    receiptMainAmount: { fontSize: 36, fontWeight: '900', color: COLORS.primary, marginBottom: 20 },
    receiptInfoGrid: { width: '100%', backgroundColor: "#F8F9FA", borderRadius: 20, padding: 20, marginBottom: 25 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    detailLabel: { color: COLORS.muted, fontWeight: '600', fontSize: 13 },
    detailValue: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
    closeModalBtn: { backgroundColor: COLORS.primary, width: '100%', padding: 16, borderRadius: 15, alignItems: 'center' },
    closeModalBtnText: { color: COLORS.white, fontWeight: '700' }
});

export default Payments;