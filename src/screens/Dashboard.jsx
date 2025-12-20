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

import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContextProvider } from '../context/UserProvider';
import Group400 from '../../assets/Group400.png';
import url from "../data/url"; 
import axios from 'axios';

const { width: screenWidth } = Dimensions.get('window');

// --- DESIGN SYSTEM ---
const PRIMARY_COLOR = '#042f74';
const SECONDARY_COLOR = '#EF6C00';
const ACCENT_BLUE = '#E3F2FD';
const TEXT_MAIN = '#1A1A1A';
const TEXT_SUB = '#666666';
const WHITE = '#FFFFFF';

const SCHEME_CARD_WIDTH = screenWidth * 0.8; 
const SCHEME_MARGIN = 12;

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
];

const QUICK_ACTIONS = [
    { id: '1', icon: 'payments', label: 'Pay Due', color: '#4CAF50', target: 'PayYourDues' },
    { id: '2', icon: 'gavel', label: 'Auction', color: '#EF6C00', target: 'AuctionList' },
    { id: '3', icon: 'history', label: 'Passbook', color: '#2196F3', target: 'MyPassbookScreen' },
    { id: '4', icon: 'group-add', label: 'Refer', color: '#9C27B0', target: 'IntroduceNewCustomers' },
    { id: '5', icon: 'account-balance', label: 'Bank Info', color: '#607D8B', target: 'QrCodePage' },
    { id: '6', icon: 'description', label: 'Legal', color: '#F44336', target: 'LicenseAndCertificate' },
];

// --- UPDATED GOALS WITH CUSTOM COLORS ---
const GOALS = [
    { 
        title: 'Dream Home', 
        icon: 'home', 
        desc: 'Save for your downpayment',
        bgColor: '#E8F5E9', // Light Green
        iconColor: '#2E7D32' 
    },
    { 
        title: 'Education', 
        icon: 'school', 
        desc: 'Secure your child’s future',
        bgColor: '#FFF3E0', // Light Orange
        iconColor: '#E65100' 
    },
    { 
        title: 'Wedding', 
        icon: 'favorite', 
        desc: 'Plan the perfect ceremony',
        bgColor: '#FCE4EC', // Light Pink
        iconColor: '#C2185B' 
    },
];

const Home = ({ navigation }) => {
    const [appUser] = useContext(ContextProvider);
    const insets = useSafeAreaInsets();
    const [activeChitsCount, setActiveChitsCount] = useState(0);
    const horizontalScrollRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-15)).current;

    const HEADER_HEIGHT = 165 + insets.top; 

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(headerSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();

        const interval = setInterval(() => {
            let nextIndex = (currentIndex + 1) % SCROLL_IMAGES.length;
            horizontalScrollRef.current?.scrollTo({ 
                x: nextIndex * (SCHEME_CARD_WIDTH + SCHEME_MARGIN), 
                animated: true 
            });
            setCurrentIndex(nextIndex);
        }, 3500);
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
            
            <View style={[styles.brandHeader, { height: HEADER_HEIGHT, paddingTop: insets.top + 10 }]}>
                <View style={styles.headerOrb1} />
                <View style={styles.headerOrb2} />

                <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
                    <View style={styles.headerTopRow}>
                        <View style={styles.logoGroup}>
                            <View style={styles.logoWhiteBg}>
                                <Image source={Group400} style={styles.logoIcon} />
                            </View>
                            <Text style={styles.brandName}>MyChits</Text>
                        </View>
                        <View style={styles.headerIcons}>
                            <TouchableOpacity style={styles.iconCircleBtn}><Feather name="bell" size={20} color={WHITE} /></TouchableOpacity>
                            <TouchableOpacity style={[styles.iconCircleBtn, { marginLeft: 10 }]}><Feather name="help-circle" size={20} color={WHITE} /></TouchableOpacity>
                        </View>
                    </View>
                    
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeSmall}>Welcome,</Text>
                        <View style={styles.nameRow}>
                             <Text style={styles.welcomeLarge}>{appUser?.name || 'Investor'}</Text>
                             <MaterialIcons name="verified" size={18} color="#4FC3F7" style={{ marginLeft: 6, marginTop: 4 }} />
                        </View>
                    </View>
                </Animated.View>
            </View>

            <View style={[styles.statusCard, { top: HEADER_HEIGHT - 35 }]}>
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
                <TouchableOpacity style={styles.statusBtn} onPress={() => navigation.navigate('Enrollment')}>
                    <Text style={styles.statusBtnText}>Enroll Now</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ 
                    paddingTop: HEADER_HEIGHT + 50, 
                    paddingBottom: insets.bottom + 40 
                }}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitleCenter}>Financial Services</Text>
                    <View style={styles.actionGrid}>
                        {QUICK_ACTIONS.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={[styles.stylizedActionBox, { borderColor: item.color + '30' }]} 
                                onPress={() => navigation.navigate(item.target)}
                            >
                                <View style={[styles.boxCornerGlow, { backgroundColor: item.color }]} />
                                <View style={[styles.actionIconBg, { backgroundColor: item.color + '15' }]}>
                                    <MaterialIcons name={item.icon} size={28} color={item.color} />
                                </View>
                                <Text style={styles.actionText}>{item.label.toUpperCase()}</Text>
                                <View style={[styles.bottomLine, { backgroundColor: item.color }]} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Popular Schemes</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Enrollment')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView 
                        ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false} 
                        snapToInterval={SCHEME_CARD_WIDTH + SCHEME_MARGIN} decelerationRate="fast"
                    >
                        {SCROLL_IMAGES.map((img, index) => (
                            <TouchableOpacity key={index} style={styles.schemeCard} activeOpacity={0.9} onPress={() => navigation.navigate('Enrollment')}>
                                <Image source={img} style={styles.schemeImg} resizeMode="cover" />
                                <View style={styles.schemeOverlay}>
                                    <Text style={styles.schemeTag}>Limited Slots</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('About')} style={styles.aboutHighlightCard}>
                        <ImageBackground source={require('../../assets/image.png')} style={styles.aboutBgImage} imageStyle={{ opacity: 0.12 }}>
                            <View style={styles.aboutContent}>
                                <View style={styles.aboutTextCol}>
                                    <Text style={styles.aboutBadge}>ABOUT US</Text>
                                    <Text style={styles.aboutTitle}>India's 100% Digital Chit Fund</Text>
                                    <Text style={styles.aboutDescription} numberOfLines={3}>
                                        We are a registered chit fund company offering financial independence across India.
                                    </Text>
                                    <View style={styles.readMoreRow}>
                                        <Text style={styles.readMoreText}>Explore Our Story</Text>
                                        <Feather name="arrow-right" size={16} color={PRIMARY_COLOR} />
                                    </View>
                                </View>
                                <View style={styles.aboutIconCircle}>
                                    <MaterialIcons name="verified-user" size={30} color={PRIMARY_COLOR} />
                                </View>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                </View>

                {/* --- SAVING GOALS WITH DIFFERENT COLORS --- */}
                <View style={styles.sectionWithLargeSpace}>
                    <Text style={styles.sectionTitleSpaced}>What are you saving for?</Text>
                    {GOALS.map((goal, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.goalCard}
                            onPress={() => navigation.navigate('Enrollment')}
                        >
                            {/* Dynamic Background and Icon Color */}
                            <View style={[styles.goalIcon, { backgroundColor: goal.bgColor }]}>
                                <MaterialIcons name={goal.icon} size={24} color={goal.iconColor} />
                            </View>
                            <View style={styles.goalText}>
                                <Text style={styles.goalTitle}>{goal.title}</Text>
                                <Text style={styles.goalDesc}>{goal.desc}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={TEXT_SUB} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sectionWithLargeSpace}>
                    <Text style={styles.sectionTitleSpaced}>Trusted by Thousands</Text>
                    <FlatList
                        data={REVIEWS} horizontal showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
                                    <View><Text style={styles.reviewUser}>{item.name}</Text><Text style={styles.reviewLoc}>{item.location}</Text></View>
                                </View>
                                <Text style={styles.reviewBody}>"{item.review}"</Text>
                                <View style={styles.reviewStarRow}>
                                    {[1, 2, 3, 4, 5].map(s => <MaterialIcons key={s} name="star" size={14} color="#FFD700" />)}
                                </View>
                            </View>
                        )}
                    />
                </View>

                <View style={styles.finalActionSection}>
                    <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.navigate('Enrollment')}>
                        <Text style={styles.mainBtnText}>EXPLORE ALL CHITS</Text>
                        <Feather name="trending-up" size={20} color={WHITE} />
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
        backgroundColor: PRIMARY_COLOR, paddingHorizontal: 20, 
        borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 10,
        overflow: 'hidden'
    },
    headerOrb1: {
        position: 'absolute', width: 180, height: 180, borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.08)', top: -40, right: -40
    },
    headerOrb2: {
        position: 'absolute', width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.04)', bottom: 20, left: -20
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logoGroup: { flexDirection: 'row', alignItems: 'center' },
    logoWhiteBg: { backgroundColor: WHITE, padding: 5, borderRadius: 10, marginRight: 10 },
    logoIcon: { width: 22, height: 22 },
    brandName: { color: WHITE, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
    headerIcons: { flexDirection: 'row' },
    iconCircleBtn: { backgroundColor: 'rgba(255,255,255,0.18)', padding: 10, borderRadius: 14 },
    welcomeSection: { marginTop: 20 },
    welcomeSmall: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '500' },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    welcomeLarge: { color: WHITE, fontSize: 26, fontWeight: '800' },
    
    statusCard: { 
        position: 'absolute', left: 20, right: 20, 
        backgroundColor: WHITE, borderRadius: 24, padding: 20, 
        flexDirection: 'row', alignItems: 'center', elevation: 15, 
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, zIndex: 11 
    },
    statusInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    statusLabel: { color: TEXT_SUB, fontSize: 11, marginBottom: 2 },
    statusValue: { color: PRIMARY_COLOR, fontSize: 16, fontWeight: '800' },
    vDivider: { width: 1, height: 35, backgroundColor: '#E2E8F0', marginHorizontal: 20 },
    statusBtn: { backgroundColor: SECONDARY_COLOR, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 15 },
    statusBtnText: { color: WHITE, fontWeight: 'bold', fontSize: 13 },
    
    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionWithLargeSpace: { marginTop: 40, paddingHorizontal: 20 }, 
    sectionTitleSpaced: { fontSize: 18, fontWeight: '800', color: TEXT_MAIN, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: TEXT_MAIN },
    sectionTitleCenter: { fontSize: 18, fontWeight: '800', color: TEXT_MAIN, textAlign: 'center', marginBottom: 20 },
    seeAll: { color: SECONDARY_COLOR, fontWeight: '700', fontSize: 13 },

    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    stylizedActionBox: { 
        width: (screenWidth - 55) / 3, backgroundColor: WHITE, paddingTop: 22, 
        paddingBottom: 18, borderRadius: 24, alignItems: 'center', marginBottom: 15, 
        elevation: 8, position: 'relative', overflow: 'hidden' 
    },
    actionIconBg: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionText: { fontSize: 10, fontWeight: '900', color: TEXT_MAIN, textAlign: 'center' },
    boxCornerGlow: { position: 'absolute', top: -15, right: -15, width: 40, height: 40, borderRadius: 20, opacity: 0.1 },
    bottomLine: { position: 'absolute', bottom: 0, width: '35%', height: 3 },

    schemeCard: { width: SCHEME_CARD_WIDTH, height: 180, marginRight: SCHEME_MARGIN, borderRadius: 24, overflow: 'hidden' },
    schemeImg: { width: '100%', height: '100%' },
    schemeOverlay: { position: 'absolute', top: 12, left: 12 },
    schemeTag: { backgroundColor: 'rgba(0,0,0,0.5)', color: WHITE, fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: 'bold' },

    aboutHighlightCard: { backgroundColor: WHITE, borderRadius: 24, overflow: 'hidden', elevation: 6, borderWidth: 1, borderColor: '#E3F2FD' },
    aboutBgImage: { padding: 20 },
    aboutContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    aboutTextCol: { flex: 1, paddingRight: 10 },
    aboutBadge: { backgroundColor: ACCENT_BLUE, color: PRIMARY_COLOR, fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
    aboutTitle: { fontSize: 16, fontWeight: '800', color: PRIMARY_COLOR, marginBottom: 4 },
    aboutDescription: { fontSize: 12, color: TEXT_SUB, lineHeight: 18, marginBottom: 10 },
    readMoreRow: { flexDirection: 'row', alignItems: 'center' },
    readMoreText: { color: PRIMARY_COLOR, fontWeight: 'bold', fontSize: 13, marginRight: 5 },
    aboutIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: ACCENT_BLUE, justifyContent: 'center', alignItems: 'center' },

    goalCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: WHITE, 
        padding: 15, 
        borderRadius: 22, // Slightly rounder for premium feel
        marginBottom: 12, 
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    goalIcon: { 
        width: 50, 
        height: 50, 
        borderRadius: 15, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 15 
    },
    goalText: { flex: 1 },
    goalTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN },
    goalDesc: { fontSize: 12, color: TEXT_SUB },
    
    reviewCard: { width: 300, backgroundColor: '#F1F5F9', padding: 20, borderRadius: 24, marginRight: 15 },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: WHITE, fontWeight: 'bold' },
    reviewUser: { fontWeight: 'bold', color: TEXT_MAIN },
    reviewLoc: { fontSize: 11, color: TEXT_SUB },
    reviewBody: { fontSize: 13, color: TEXT_MAIN, fontStyle: 'italic', marginBottom: 10, lineHeight: 18 },
    reviewStarRow: { flexDirection: 'row' },

    finalActionSection: { marginTop: 40, marginBottom: 20, paddingHorizontal: 20 },
    mainBtn: { backgroundColor: PRIMARY_COLOR, height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    mainBtnText: { color: WHITE, fontWeight: '800', fontSize: 15, marginRight: 10 },
});

export default Home;