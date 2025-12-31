import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    FlatList,
    ImageBackground,
    Animated,
} from 'react-native';

import { MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContextProvider } from '../context/UserProvider';
import Group400 from '../../assets/Group400.png';
import url from "../data/url"; 
import axios from 'axios';

const { width: screenWidth } = Dimensions.get('window');

// --- PREMIUM DESIGN SYSTEM ---
const PRIMARY_COLOR = '#042f74';
const SECONDARY_COLOR = '#EF6C00';
const ACCENT_BLUE = '#E3F2FD';
const TEXT_MAIN = '#0F172A';
const TEXT_SUB = '#64748B';
const WHITE = '#FFFFFF';

const SCHEME_CARD_WIDTH = screenWidth * 0.82; 
const SCHEME_MARGIN = 16;

const SCROLL_IMAGES = [
    require('../../assets/50k blue.png'),
    require('../../assets/1lakhblue.png'),
    require('../../assets/2lakhblue.png'),
    require('../../assets/3lakgblue.png'),
    require('../../assets/5lakhblue.png'),
    require('../../assets/10lakhblue.png'),
    require('../../assets/25lakhblue.png'),
    require('../../assets/50lakhblue.png'),
    require('../../assets/1croreblue.png'),
];

const REVIEWS = [
    { id: '1', name: 'Prakash', review: 'Great service! The app is incredibly easy to navigate, and the digital process saved me so much time.', location: 'Bangalore' },
    { id: '2', name: 'Geetha Kumari', review: 'Very transparent and trustworthy company. I appreciate the regular updates.', location: 'Chamarajanagr' },
    { id: '3', name: 'Ravi Kumar', review: 'The interface is simple to understand even for beginners.', location: 'Bangalore' },
    { id: '4', name: 'Nisha Singh', review: 'Secure, simple, and transparent. It makes chit fund investments feel modern.', location: 'Davanagere' },
    { id: '5', name: 'Suresh Raina', review: 'I have been using this for 6 months now. The auction process is very fair and clear.', location: 'Mysuru' },
    { id: '6', name: 'Anjali Devi', review: 'Customer support is very helpful. They guided me through my first enrollment perfectly.', location: 'Hubli' },
    { id: '7', name: 'Karthik S.', review: 'Best way to save money for long-term goals. Highly recommended for families.', location: 'Mangalore' },
    { id: '8', name: 'Meena Iyer', review: 'Finally a digital chit fund that feels safe. The documentation is very professional.', location: 'Chennai' },
    { id: '9', name: 'Vijay B.', review: 'The passbook feature is excellent. I can track my savings anytime, anywhere.', location: 'Tumakuru' },
    { id: '10', name: 'Priyanka M.', review: 'Very convenient and reliable. It helped me save up for my new scooter easily!', location: 'Belagavi' },
];

const QUICK_ACTIONS = [
    { id: '1', icon: 'payments', label: 'New Groups', color: '#10B981', target: 'Enrollment' },
    { id: '2', icon: 'gavel', label: 'Auction', color: '#F59E0B', target: 'AuctionList' },
    { id: '3', icon: 'history', label: 'Passbook', color: '#3B82F6', target: 'MyPassbookScreen' },
    { id: '4', icon: 'group-add', label: 'Refer', color: '#8B5CF6', target: 'IntroduceNewCustomers' },
    { id: '5', icon: 'account-balance', label: 'Bank Info', color: '#64748B', target: 'QrCodePage' },
    { id: '6', icon: 'description', label: 'Legal', color: '#EF4444', target: 'LicenseAndCertificate' },
];

const GOALS = [
    { title: 'Dream Home', icon: 'home', desc: 'Save for your downpayment', bgColor: '#ECFDF5', iconColor: '#059669' },
    { title: 'Education', icon: 'school', desc: 'Secure your child’s future', bgColor: '#FFF7ED', iconColor: '#D97706' },
    { title: 'Wedding', icon: 'favorite', desc: 'Plan the perfect ceremony', bgColor: '#FFF1F2', iconColor: '#E11D48' },
];

const Home = ({ navigation }) => {
    const [appUser] = useContext(ContextProvider);
    const insets = useSafeAreaInsets();
    const [activeChitsCount, setActiveChitsCount] = useState(0);
    const horizontalScrollRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;

    const HEADER_HEIGHT = 175 + insets.top; 

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(headerSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();

        const interval = setInterval(() => {
            let nextIndex = (currentIndex + 1) % SCROLL_IMAGES.length;
            horizontalScrollRef.current?.scrollTo({ 
                x: nextIndex * (SCHEME_CARD_WIDTH + SCHEME_MARGIN), 
                animated: true 
            });
            setCurrentIndex(nextIndex);
        }, 4000);
        return () => clearInterval(interval);
    }, [currentIndex]);

    useEffect(() => {
        const fetchActiveCounts = async () => {
            try {
                const [newRes, ongoingRes] = await Promise.all([
                    axios.get(`${url}/group/filter/NewGroups`),
                    axios.get(`${url}/group/filter/OngoingGroups`)
                ]);
                setActiveChitsCount((newRes.data?.groups?.length || 0) + (ongoingRes.data?.groups?.length || 0));
            } catch (error) { console.error(error); }
        };
        fetchActiveCounts();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* --- STYLIST BRAND HEADER --- */}
            <View style={[styles.brandHeader, { height: HEADER_HEIGHT, paddingTop: insets.top + 10 }]}>
                <View style={styles.headerOrb1} />
                <View style={styles.headerOrb2} />

                <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
                    <View style={styles.headerTopRow}>
                        <View style={styles.logoGroup}>
                            <View style={styles.logoWhiteBg}>
                                <Image source={Group400} style={styles.logoIcon} />
                            </View>
                            <View>
                                <Text style={styles.brandName}>MyChits</Text>
                                <Text style={styles.brandTagline}>TRUSTED INVESTMENTS</Text>
                            </View>
                        </View>
                        <View style={styles.headerIcons}>
                            <TouchableOpacity style={styles.iconCircleBtn}><Feather name="bell" size={20} color={WHITE} /></TouchableOpacity>
                            <TouchableOpacity style={[styles.iconCircleBtn, { marginLeft: 10 }]}><Feather name="help-circle" size={20} color={WHITE} /></TouchableOpacity>
                        </View>
                    </View>
                    
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeSmall}>Welcome,</Text>
                        <View style={styles.nameRow}>
                             <Text style={styles.welcomeLarge}>{appUser?.name || 'User'}</Text>
                             <MaterialIcons name="verified" size={20} color="#4FC3F7" style={{ marginLeft: 8 }} />
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* --- STATUS CARD (AUCTION MOVED LEFT) --- */}
            <View style={[styles.statusCard, { top: HEADER_HEIGHT - 38 }]}>
                <View style={styles.statusInfo}>
                    <View>
                        <Text style={styles.statusLabel}>Active Chits</Text>
                        <Text style={styles.statusValue}>{activeChitsCount}</Text>
                    </View>
                    <View style={styles.vDivider} />
                    <View>
                        <Text style={styles.statusLabel}>Auction Every</Text>
                        <Text style={styles.statusValue}>10 Days</Text>
                    </View>
                </View>
                <TouchableOpacity activeOpacity={0.8} style={styles.statusBtn} onPress={() => navigation.navigate('Enrollment')}>
                    <Text style={styles.statusBtnText}>Enroll Now</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ 
                    paddingTop: HEADER_HEIGHT + 55, 
                    paddingBottom: insets.bottom + 40 
                }}
            >
                {/* --- QUICK ACTIONS GRID --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderCenter}>
                        <View style={styles.headerLine} />
                        <Text style={styles.sectionTitleCenter}>Financial Hub</Text>
                        <View style={styles.headerLine} />
                    </View>
                    <View style={styles.actionGrid}>
                        {QUICK_ACTIONS.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                activeOpacity={0.7}
                                style={[styles.stylizedActionBox, { borderColor: item.color + '20' }]} 
                                onPress={() => navigation.navigate(item.target)}
                            >
                                <View style={[styles.boxCornerGlow, { backgroundColor: item.color }]} />
                                <View style={[styles.actionIconBg, { backgroundColor: item.color + '12' }]}>
                                    <MaterialIcons name={item.icon} size={28} color={item.color} />
                                </View>
                                <Text style={styles.actionText}>{item.label.toUpperCase()}</Text>
                                <View style={[styles.bottomLine, { backgroundColor: item.color }]} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* --- POPULAR SCHEMES --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Premium Schemes</Text>
                            <Text style={styles.sectionSubtitle}>Tailored for high growth</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Enrollment')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView 
                        ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false} 
                        snapToInterval={SCHEME_CARD_WIDTH + SCHEME_MARGIN} decelerationRate="fast"
                        contentContainerStyle={{ paddingLeft: 20 }}
                    >
                        {SCROLL_IMAGES.map((img, index) => (
                            <TouchableOpacity key={index} style={styles.schemeCard} activeOpacity={0.9} onPress={() => navigation.navigate('Enrollment')}>
                                <Image source={img} style={styles.schemeImg} resizeMode="cover" />
                                <View style={styles.schemeOverlay}>
                                    <View style={styles.glassBadge}>
                                        <FontAwesome5 name="bolt" size={10} color="#FFD700" />
                                        <Text style={styles.schemeTag}>HIGH DEMAND</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* --- ABOUT HIGHLIGHT --- */}
                <View style={styles.section}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('About')} style={styles.aboutHighlightCard}>
                        <ImageBackground source={require('../../assets/image.png')} style={styles.aboutBgImage} imageStyle={{ opacity: 0.1 }}>
                            <View style={styles.aboutContent}>
                                <View style={styles.aboutTextCol}>
                                    <View style={styles.aboutBadgeContainer}>
                                        <Text style={styles.aboutBadge}>GOVERNMENT REGISTERED</Text>
                                    </View>
                                    <Text style={styles.aboutTitle}>India's Digital Leader</Text>
                                    <Text style={styles.aboutDescription} numberOfLines={2}>
                                        Experience the most transparent and secure chit fund platform.
                                    </Text>
                                    <View style={styles.readMoreRow}>
                                        <Text style={styles.readMoreText}>Our Legacy</Text>
                                        <Feather name="chevron-right" size={16} color={PRIMARY_COLOR} />
                                    </View>
                                </View>
                                <View style={styles.aboutIconCircle}>
                                    <MaterialIcons name="security" size={32} color={PRIMARY_COLOR} />
                                </View>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                </View>

                {/* --- SAVING GOALS --- */}
                <View style={styles.sectionWithLargeSpace}>
                    <Text style={styles.sectionTitleSpaced}>Plan Your Future</Text>
                    {GOALS.map((goal, index) => (
                        <TouchableOpacity 
                            key={index} 
                            activeOpacity={0.8}
                            style={styles.goalCard}
                            onPress={() => navigation.navigate('Enrollment')}
                        >
                            <View style={[styles.goalIcon, { backgroundColor: goal.bgColor }]}>
                                <MaterialIcons name={goal.icon} size={24} color={goal.iconColor} />
                            </View>
                            <View style={styles.goalText}>
                                <Text style={styles.goalTitle}>{goal.title}</Text>
                                <Text style={styles.goalDesc}>{goal.desc}</Text>
                            </View>
                            <View style={styles.goalArrowContainer}>
                                <Feather name="arrow-right" size={18} color={TEXT_SUB} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* --- REVIEWS --- */}
                <View style={styles.sectionWithLargeSpace}>
                    <Text style={styles.sectionTitleSpaced}>Member Success Stories</Text>
                    <FlatList
                        data={REVIEWS} horizontal showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingLeft: 20 }}
                        renderItem={({ item }) => (
                            <View style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
                                    <View>
                                        <Text style={styles.reviewUser}>{item.name}</Text>
                                        <Text style={styles.reviewLoc}>{item.location}</Text>
                                    </View>
                                </View>
                                <Text style={styles.reviewBody}>"{item.review}"</Text>
                                <View style={styles.reviewStarRow}>
                                    {[1, 2, 3, 4, 5].map(s => <MaterialIcons key={s} name="star" size={14} color="#FBBF24" />)}
                                </View>
                            </View>
                        )}
                    />
                </View>

                {/* --- FINAL ACTION --- */}
                <View style={styles.finalActionSection}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.mainBtn} onPress={() => navigation.navigate('Enrollment')}>
                        <Text style={styles.mainBtnText}>VIEW INVESTMENT PLANS</Text>
                        <View style={styles.mainBtnIcon}>
                            <Feather name="trending-up" size={18} color={PRIMARY_COLOR} />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    brandHeader: { 
        position: 'absolute', top: 0, left: 0, right: 0, 
        backgroundColor: PRIMARY_COLOR, paddingHorizontal: 22, 
        borderBottomLeftRadius: 45, borderBottomRightRadius: 45, zIndex: 10,
        overflow: 'hidden'
    },
    headerOrb1: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.07)', top: -50, right: -50
    },
    headerOrb2: {
        position: 'absolute', width: 150, height: 150, borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.03)', bottom: 10, left: -30
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logoGroup: { flexDirection: 'row', alignItems: 'center' },
    logoWhiteBg: { backgroundColor: WHITE, padding: 6, borderRadius: 14, marginRight: 12, elevation: 6 },
    logoIcon: { width: 24, height: 24 },
    brandName: { color: WHITE, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    brandTagline: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginTop: -2 },
    headerIcons: { flexDirection: 'row' },
    iconCircleBtn: { backgroundColor: 'rgba(255,255,255,0.14)', padding: 10, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    welcomeSection: { marginTop: 25 },
    welcomeSmall: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '500' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    welcomeLarge: { color: WHITE, fontSize: 20, fontWeight: '800' },
    
    statusCard: { 
        position: 'absolute', left: 20, right: 20, 
        backgroundColor: WHITE, borderRadius: 28, padding: 22, 
        flexDirection: 'row', alignItems: 'center', elevation: 12, 
        shadowColor: PRIMARY_COLOR, shadowOpacity: 0.12, shadowRadius: 20, zIndex: 11,
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    statusInfo: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    statusLabel: { color: TEXT_SUB, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    statusValue: { color: PRIMARY_COLOR, fontSize: 15, fontWeight: '900' },
    vDivider: { 
        width: 1.5, 
        height: 35, 
        backgroundColor: '#F1F5F9', 
        marginHorizontal: 12, 
    },
    statusBtn: { backgroundColor: SECONDARY_COLOR, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 18, elevation: 4 },
    statusBtnText: { color: WHITE, fontWeight: '900', fontSize: 13 },
    
    section: { marginTop: 25, paddingHorizontal: 0 },
    sectionWithLargeSpace: { marginTop: 45, paddingHorizontal: 20 }, 
    sectionTitleSpaced: { fontSize: 20, fontWeight: '800', color: TEXT_MAIN, marginBottom: 22 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: TEXT_MAIN },
    sectionSubtitle: { fontSize: 13, color: TEXT_SUB, marginTop: 2 },
    sectionHeaderCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 25, paddingHorizontal: 20 },
    headerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
    sectionTitleCenter: { fontSize: 14, fontWeight: '900', color: TEXT_SUB, letterSpacing: 1.5 },
    seeAll: { color: SECONDARY_COLOR, fontWeight: '800', fontSize: 14 },

    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
    stylizedActionBox: { 
        width: (screenWidth - 60) / 3, backgroundColor: WHITE, paddingTop: 24, 
        paddingBottom: 20, borderRadius: 28, alignItems: 'center', marginBottom: 16, 
        elevation: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12,
        position: 'relative', overflow: 'hidden', borderWidth: 1
    },
    actionIconBg: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    actionText: { fontSize: 10, fontWeight: '900', color: TEXT_MAIN, textAlign: 'center', letterSpacing: 0.2 },
    boxCornerGlow: { position: 'absolute', top: -20, right: -20, width: 45, height: 45, borderRadius: 22, opacity: 0.12 },
    bottomLine: { position: 'absolute', bottom: 0, width: '35%', height: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 },

    schemeCard: { width: SCHEME_CARD_WIDTH, height: 195, marginRight: SCHEME_MARGIN, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: PRIMARY_COLOR, shadowOpacity: 0.1 },
    schemeImg: { width: '100%', height: '100%' },
    schemeOverlay: { position: 'absolute', top: 15, left: 15 },
    glassBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    schemeTag: { color: WHITE, fontSize: 10, fontWeight: '900', marginLeft: 6, letterSpacing: 0.5 },

    aboutHighlightCard: { marginHorizontal: 20, backgroundColor: WHITE, borderRadius: 32, overflow: 'hidden', elevation: 8, borderWidth: 1, borderColor: '#E3F2FD' },
    aboutBgImage: { padding: 25 },
    aboutContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    aboutTextCol: { flex: 1, paddingRight: 10 },
    aboutBadgeContainer: { backgroundColor: ACCENT_BLUE, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
    aboutBadge: { color: PRIMARY_COLOR, fontSize: 10, fontWeight: '900' },
    aboutTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY_COLOR, marginBottom: 6 },
    aboutDescription: { fontSize: 13, color: TEXT_SUB, lineHeight: 20, marginBottom: 14 },
    readMoreRow: { flexDirection: 'row', alignItems: 'center' },
    readMoreText: { color: PRIMARY_COLOR, fontWeight: '900', fontSize: 14, marginRight: 4 },
    aboutIconCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: ACCENT_BLUE, justifyContent: 'center', alignItems: 'center' },

    goalCard: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, 
        padding: 18, borderRadius: 28, marginBottom: 14,
        elevation: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15,
        borderWidth: 1, borderColor: '#F8FAFC'
    },
    goalIcon: { width: 54, height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    goalText: { flex: 1 },
    goalTitle: { fontSize: 16, fontWeight: '800', color: TEXT_MAIN },
    goalDesc: { fontSize: 13, color: TEXT_SUB, marginTop: 1 },
    goalArrowContainer: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
    
    reviewCard: { width: 310, backgroundColor: WHITE, padding: 25, borderRadius: 32, marginRight: 18, elevation: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarText: { color: WHITE, fontWeight: 'bold', fontSize: 16 },
    reviewUser: { fontWeight: '900', color: TEXT_MAIN, fontSize: 15 },
    reviewLoc: { fontSize: 12, color: TEXT_SUB },
    reviewBody: { fontSize: 14, color: TEXT_MAIN, fontStyle: 'italic', marginBottom: 15, lineHeight: 22 },
    reviewStarRow: { flexDirection: 'row' },

    finalActionSection: { marginTop: 45, marginBottom: 20, paddingHorizontal: 20 },
    mainBtn: { backgroundColor: PRIMARY_COLOR, height: 68, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 12, shadowColor: PRIMARY_COLOR, shadowOpacity: 0.3 },
    mainBtnText: { color: WHITE, fontWeight: '900', fontSize: 16, marginRight: 14, letterSpacing: 0.5 },
    mainBtnIcon: { backgroundColor: WHITE, padding: 6, borderRadius: 10 }
});

export default Home;