import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    ScrollView,
    FlatList,
    Modal,
    Linking, 
    // New: Platform for platform-specific styling
    Platform, 
} from 'react-native';

import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContextProvider } from '../context/UserProvider';
import Group400 from '../../assets/Group400.png';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// -------------------------------------------------------------
// ⭐ CONFIGURATION
// UI Colors (Matching Home.jsx theme)
const PRIMARY_COLOR = '#042f74ff'; 
const SECONDARY_COLOR = '#EF6C00'; 
const LIGHT_ACCENT_COLOR = '#B3E5FC'; // The color to enhance
const BACKGROUND_COLOR = '#FFFFFF'; 
const CARD_LIGHT_BG = '#E3F2FD'; // Lighter blue background
// New color for subtle text and shadows
const GREY_TEXT = '#666666'; 
// -------------------------------------------------------------

// (SCROLL_IMAGES data is unchanged)
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
    require('../../assets/50kgreen.png'),
    require('../../assets/1lakhgreen.png'),
    require('../../assets/2lakhgrren.png'),
    require('../../assets/3lahkgreen.png'),
    require('../../assets/5lakhgreen.png'),
    require('../../assets/10lakhgreen.png'),
    require('../../assets/25lakhgreen.png'),
    require('../../assets/50lakhgreen.png'),
    require('../../assets/1croregreen.png'),
];
const SCROLL_ITEM_WIDTH = 175;

// (ADVANTAGES data is unchanged)
const ADVANTAGES = [
    {
        icon: 'lock-clock',
        text1: 'Join a Chit ',
        text2: 'in Minutes',
        iconColor: '#EF6C00',
        action: 'navigate',
        targetScreen: 'Enrollment'
    },
    {
        icon: 'gavel',
        text1: 'In app ',
        text2: 'Auctions',
        iconColor: '#795548',
        action: 'navigate',
        targetScreen: 'AuctionList'
    },
    {
        icon: 'event-note',
        text1: ' Auctions ',
        text2: 'every month',
        iconColor: '#FBC02D',
        action: 'navigate',
        targetScreen: 'AuctionList'
    },
    {
        icon: 'support-agent',
        text1: '1 Click customer ',
        text2: 'support',
        iconColor: '#607D8B',
        action: 'call',
        phoneNumber: '+919483900777'
    },
    {
        icon: 'verified',
        text1: 'Fully Compliant as ',
        text2: 'per Chit Act 1998',
        iconColor: '#3F51B5'
    },
    {
        icon: 'groups',
        text1: 'Chit Plans for ',
        text2: 'everyone',
        iconColor: '#4CAF50',
        action: 'navigate',
        targetScreen: 'Enrollment'
    },
];

// (REVIEWS data is unchanged)
const REVIEWS = [
    {
        id: '1',
        name: 'Prakash',
        rating: 5,
        review: 'Great service! The app is easy to use, and I got my money on time. I recommend this fund.',
        location: 'Bangalore'
    },
    {
        id: '2',
        name: 'Geetha Kumari',
        rating: 4,
        review: 'Very transparent and trustworthy. The team is always available to help and the process is seamless. A great way to save and invest.',
        location: 'Chamarajanagr'
    },
    {
        id: '3',
        name: 'Ravi Kumar',
        rating: 5,
        review: 'A good app for managing my investments. The interface is easy to understand. One small suggestion would be to add more payment options.',
        location: 'Bangalore'
    },
    {
        id: '4',
        name: 'Nisha Singh',
        rating: 4,
        review: 'The best chit fund experience I’ve had. Secure, simple, and transparent. The digital process saves a lot of time.',
        location: 'Davanagere'
    },
    {
        id: '5',
        name: 'Raja Reddy',
        rating: 5,
        review: 'I was not sure at first, but the good service and clear papers made me trust this app. I am very happy I chose it.',
        location: 'Mysore'
    },
    {
        id: '6',
        name: 'Sangeeta Rao',
        rating: 4,
        review: 'The app is good and the people who help customers answer fast. It is a good way to save money and get it when you need it.',
        location: 'Mandya'
    },
    {
        id: '7',
        name: 'Vikram Patel',
        rating: 5,
        review: 'The process of joining and managing my chit fund is so simple. Highly recommend MyChits to everyone looking for a reliable chit fund.',
        location: 'Bidar'
    },
    {
        id: '8',
        name: 'Anjali Desai',
        rating: 5,
        review: 'Excellent app! It’s simple, secure, and I can manage everything from my phone. The customer support is also very responsive and helpful.',
        location: 'Bangalore'
    },
    {
        id: '9',
        name: 'Mukesh Choudhary',
        rating: 4,
        review: 'A reliable and easy-to-use platform. The process for joining a chit and making payments is very straightforward. Highly satisfied with my experience.',
        location: 'Davanagere'
    },
    {
        id: '10',
        name: 'Priya Reddy',
        rating: 5,
        review: 'The best way to save money for my future goals. The entire process is transparent. I recommend this app to my friends and family.',
        location: 'Bangalore'
    },
    {
        id: '11',
        name: 'Suresh Kumar',
        rating: 5,
        review: 'I love how easy it is to track my chit progress and auction status. Great job!',
        location: 'Mandya'
    },
    {
        id: '12',
        name: 'Kavita Singh',
        rating: 4,
        review: 'A very good overall.',
        location: 'Bangalore'
    },
    {
        id: '13',
        name: 'Rajesh Nair',
        rating: 5,
        review: 'Superb platform for my savings needs. The app is fast and reliable, and I never faced any issues. The team is also very supportive.',
        location: 'Mysore'
    },
    {
        id: '14',
        name: 'Sneha Sharma',
        rating: 4,
        review: 'I appreciate the transparency and the constant support from the team.',
        location: 'Bangalore'
    },
];

// -------------------------------------------------------------
// ⭐ MODAL COMPONENT 
// -------------------------------------------------------------
const EnlargedImageModal = ({ isVisible, imageSource, onClose }) => {
    if (!imageSource) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={modalStyles.centeredView}>
                {/* Full-screen Image */}
                <Image
                    source={imageSource}
                    style={modalStyles.enlargedImage}
                    resizeMode="contain"
                />

                {/* Close Button (Cross Mark) */}
                <TouchableOpacity
                    style={modalStyles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="close-circle" size={40} color="#fff" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
};
// -------------------------------------------------------------


// -------------------------------------------------------------
// ⭐ HOME SCREEN
// -------------------------------------------------------------
const Home = ({ navigation }) => {
    const [appUser] = useContext(ContextProvider);
    const insets = useSafeAreaInsets();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const scrollRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Auto-scroll effect
    useEffect(() => {
        let intervalId;
        const autoScroll = () => {
            setCurrentIndex(prevIndex => {
                const nextIndex = (prevIndex + 1) % SCROLL_IMAGES.length;
                const offset = nextIndex * SCROLL_ITEM_WIDTH;
                scrollRef.current?.scrollTo({ x: offset, animated: true });
                return nextIndex;
            });
        };
        intervalId = setInterval(autoScroll, 3000); 
        return () => clearInterval(intervalId);
    }, []); 
    
    const handleScroll = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        // Calculate the closest index: Round (Offset / Item Width)
        const newIndex = Math.round(contentOffsetX / SCROLL_ITEM_WIDTH); 
        setCurrentIndex(newIndex);
    };

    // Handler to open the modal
    const handleImagePress = (imgSource) => {
        setSelectedImage(imgSource);
        setIsModalVisible(true);
    };

    // Handler to close the modal
    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedImage(null);
    };

    // Handler for advantage actions (navigate or call)
    const handleAdvantageAction = (item) => {
        if (item.action === 'navigate' && item.targetScreen) {
            navigation.navigate(item.targetScreen);
        } else if (item.action === 'call' && item.phoneNumber) {
            Linking.openURL(`tel:${item.phoneNumber}`);
        }
    };

    const StarRating = ({ rating }) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? "star" : "star-outline"}
                    size={20} 
                    color={i <= rating ? SECONDARY_COLOR : '#ccc'} 
                    style={styles.reviewStar}
                />
            );
        }
        return <View style={styles.reviewRating}>{stars}</View>;
    };

    const ReviewCard = ({ item }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                {/* Refined: Use bold/primary for name, GREY_TEXT for location */}
                <Text style={styles.reviewName}>{item.name}</Text>
                <Text style={[styles.reviewLocation, {color: GREY_TEXT}]}>{item.location}</Text>
            </View>
            <Text style={[styles.reviewText, styles.baseText]}>{item.review}</Text>
            <StarRating rating={item.rating} />
        </View>
    );

    // ⭐ DASHBOARD ITEM RENDER FUNCTION (Added activeOpacity)
    const DashboardItem = ({ iconName, text, targetScreen }) => (
        <TouchableOpacity 
            style={styles.dashboardCard} 
            onPress={() => navigation.navigate(targetScreen)}
            activeOpacity={0.7} // Added activeOpacity for better feedback
        >
            {/* Inner text/icon color is now PRIMARY_COLOR for contrast */}
            <View style={[styles.iconCircle, { backgroundColor: LIGHT_ACCENT_COLOR }]}>
                <Feather name={iconName} size={26} color={PRIMARY_COLOR} /> 
            </View>
            <Text style={styles.dashboardCardText}>{text}</Text>
        </TouchableOpacity>
    );

    // ⭐ DASHBOARD DATA (Only Active Chits and Refer & Earn remain)
    const dashboardItems = [
        { iconName: 'users', text: 'Active Chits', targetScreen: 'Enrollment' },
        { iconName: 'gift', text: 'Refer & Earn', targetScreen: 'IntroduceNewCustomers' },
    ];
    
    // ⭐ NEW BENEFITS DATA
    const benefitsData = [
        {
            icon: 'touch-app',
            heading: 'Easy Accessibility',
            description: 'Use our online presence and companion mobile app to keep track of your chits anytime, anywhere.',
            iconBg: '#FFEDEE',
            iconColor: '#D32F2F',
        },
        {
            icon: 'currency-rupee',
            heading: 'Large Choice of Chits',
            description: 'From ₹50,000 to ₹1 Crore, our subscriber-friendly plans are designed to suit your financial goals.',
            iconBg: '#E1F5FE',
            iconColor: '#1565C0',
        },
        {
            icon: 'verified-user',
            heading: 'Most Trusted',
            description: 'MY CHITS has been trusted since 1998, operating as a safest registered chits company.',
            iconBg: '#E8F5E9',
            iconColor: '#388E3C',
        },
    ];

    // ⭐ NEW BENEFIT ITEM RENDER FUNCTION
    const BenefitItem = ({ icon, heading, description, iconBg, iconColor }) => (
        <View style={styles.benefitItem}>
            <View style={[styles.benefitIconCircle, { backgroundColor: iconBg }]}>
                <MaterialIcons name={icon} size={28} color={iconColor} />
            </View>
            <View style={styles.benefitTextContent}>
                <Text style={styles.benefitHeading}>{heading}</Text>
                {/* Refined: Using GREY_TEXT for benefit description */}
                <Text style={[styles.benefitDescription, {color: GREY_TEXT}]}>{description}</Text>
            </View>
        </View>
    );
    
    // ⭐ NEW PAGINATION DOTS COMPONENT - MODIFIED TO SHOW ONLY 6 DOTS
    const PaginationDots = () => {
        // Limit the array to the first 6 elements to render only 6 dots
        const limitedScrollImages = SCROLL_IMAGES.slice(0, 6); 
        
        return (
            <View style={styles.paginationContainer}>
                {limitedScrollImages.map((_, index) => (
                    <View
                        key={index}
                        // Use modulo operator (%) to map the full 18-image index (currentIndex) 
                        // back to the 6 dots, ensuring the active dot cycles correctly.
                        style={[
                            styles.paginationDot,
                            index === currentIndex % limitedScrollImages.length ? styles.activeDot : styles.inactiveDot,
                        ]}
                    />
                ))}
            </View>
        );
    };
    
    // ⭐ NEW: Section Divider Component
    const SectionDivider = () => <View style={styles.sectionDivider} />;


    return (
        <SafeAreaView style={[styles.container, styles.screenContainer]}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} /> 
            
            {/* ⭐ HEADER - MODIFIED PADDING HERE */}
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 15), paddingBottom: 10 }]}>
                <View style={styles.logoTitleContainer}>
                    <Image source={Group400} style={styles.headerLogo} resizeMode="contain" />
                    {/* Refined: Added subtle shadow for the title text */}
                    <Text style={styles.headerTitle}>MyChits</Text>
                </View>
                <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate("Help")} >
                    <Ionicons name="help-circle-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.scrollContent}>
                
                {/* ⭐ NEW: MAIN CONTENT BOX WRAPPER */}
                <View style={styles.mainContentBox}>
                
                    {/* ⭐ YOUR HORIZONTAL SCROLLING IMAGES - Chit Schemes (CLEANED UP BOX) */}
                    {/* MODIFICATION 1: Changed marginBottom from 25 to 10 */}
                    <View style={[styles.innerSectionPadding, { marginBottom: 10 }]}>
                        <Text style={styles.sectionTitle}>Explore Chit Schemes</Text>
                        <ScrollView 
                            ref={scrollRef} 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.scrollImageContainerClean}
                            onScroll={handleScroll}
                            scrollEventThrottle={16} 
                            pagingEnabled 
                        >
                            {SCROLL_IMAGES.map((img, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.scrollItemContainer} 
                                    onPress={() => handleImagePress(img)}
                                    activeOpacity={0.8} // Added activeOpacity for feedback
                                >
                                    <Image source={img} style={styles.scrollImage} resizeMode="contain" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        
                        <PaginationDots />
                    </View>
                    
                    {/* NEW DIVIDER - REMOVED the divider that was here */}
                    {/* REMOVED: <SectionDivider /> */}

                    {/* ⭐ NEW SECTION: Benefits & License Link */}
                    {/* MODIFIED: Added benefitsSectionNoTopPadding to pull the section up */}
                    <View style={[styles.innerSectionPadding, styles.benefitsSection, styles.benefitsSectionNoTopPadding]}>
                        <Text style={styles.sectionTitleCenter}>Why Choose MyChits?</Text>
                        
                        {benefitsData.map((item, index) => (
                            <BenefitItem key={index} {...item} />
                        ))}
                        
                        {/* View License Link - STYLIST BUTTON STYLE */}
                        <TouchableOpacity
                            style={styles.viewLicenseLink} 
                            onPress={() => navigation.navigate('LicenseAndCertificate')}
                            activeOpacity={0.8} 
                        >
                            <View style={styles.viewLicenseContent}>
                                {/* Icon color changed to white to match new background */}
                                <MaterialIcons name="link" size={18} color="#fff" />
                                <Text style={styles.viewLicenseText}>View License and Certificate</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    
                    {/* NEW DIVIDER */}
                    <SectionDivider />

                    {/* ⭐ DASHBOARD CARDS - My Dashboard (Grid of 2) */}
                    <View style={styles.innerSectionPadding}>
                        <Text style={styles.sectionTitle}>My Dashboard</Text>
                        
                        <FlatList
                            key={'dashboard-grid-2'}
                            data={dashboardItems}
                            keyExtractor={item => item.text}
                            numColumns={2} 
                            scrollEnabled={false}
                            columnWrapperStyle={styles.dashboardRow}
                            renderItem={({ item }) => (
                                <DashboardItem {...item} />
                            )}
                        />
                    </View>
                    
                    {/* NEW DIVIDER */}
                    <SectionDivider />

                    {/* ⭐ ADVANTAGES - App Advantages (Grid of 3) */}
                    <View style={[styles.innerSectionPadding, { marginTop: 25 }]}>
                        <Text style={styles.sectionTitleCenter}>App Advantages</Text>
                        <FlatList
                            key={'advantage-grid-3'} 
                            data={ADVANTAGES}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={3} 
                            scrollEnabled={false}
                            columnWrapperStyle={styles.advantageRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.advantageContainer} 
                                    onPress={() => handleAdvantageAction(item)}
                                    activeOpacity={0.7} // Added activeOpacity for feedback
                                >
                                    <View style={[styles.advantageIconCircle, { backgroundColor: item.iconColor + '20' }]}>
                                        <MaterialIcons name={item.icon} size={28} color={item.iconColor} />
                                    </View>
                                    <Text style={[styles.advantageText, styles.baseText]}>
                                        <Text style={{fontWeight: '700', color: PRIMARY_COLOR}}>{item.text1}</Text>
                                        <Text>{item.text2}</Text>
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                    
                    {/* NEW DIVIDER */}
                    <SectionDivider />

                    {/* ⭐ CUSTOMER REVIEWS */}
                    <View style={[styles.innerSectionPadding, { marginTop: 20, paddingBottom: 15 }]}>
                        <Text style={styles.sectionTitleCenter}>What Our Customers Say</Text>
                        <FlatList
                            data={REVIEWS}
                            renderItem={({ item }) => <ReviewCard item={item} />}
                            keyExtractor={item => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.reviewsList}
                        />
                    </View>
                
                </View>
                {/* ⭐ END: MAIN CONTENT BOX WRAPPER */}

                {/* ⭐ START SAVING BUTTON (Placed below the main box) - ENHANCED LIFT */}
                <TouchableOpacity
                    style={styles.bottomButton} 
                    onPress={() => navigation.navigate('Enrollment')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.floatingButtonText}>
                        <Feather name="trending-up" size={18} color="#fff" />
                        {'  '} START SAVING NOW
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Enlarged Image Modal */}
            <EnlargedImageModal
                isVisible={isModalVisible}
                imageSource={selectedImage}
                onClose={handleModalClose}
            />
            
        </SafeAreaView>
    );
};

// -------------------------------------------------------------
// ⭐ STYLES 
// -------------------------------------------------------------
const styles = StyleSheet.create({
    // --- UNIQUE/GENERIC STYLES ADDED ---
    screenContainer: {
        flex: 1,
        backgroundColor: PRIMARY_COLOR, 
    },
    baseText: {
        // Dark grey for improved readability/stylishness
        color: GREY_TEXT, 
        fontSize: 12,      
        fontWeight: '400', 
    },
    // --- EXISTING STYLES ---
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR, 
    },
    mainScrollView: {
        flex: 1,
        backgroundColor: PRIMARY_COLOR, 
    },
    // MODIFICATION 2: Changed paddingTop from 18 to 10
    scrollContent: {
        paddingTop: 10, 
        paddingBottom: 20, 
    },
    // --- HEADER STYLES (Refined title shadow) ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: PRIMARY_COLOR, 
    },
    logoTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 35,
        height: 35,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff', 
        // Refined: Subtle text shadow for a polished look
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    helpButton: {
        padding: 5,
    },
    // ⭐ MAIN CONTENT BOX (Border Removed, Stronger Shadow)
    mainContentBox: {
        backgroundColor: BACKGROUND_COLOR, // White content box
        marginHorizontal: 5,              
        borderRadius: 20, // Rounded corners
        paddingVertical: 0, 
        // Stronger shadow to lift it off the background (No border)
        shadowColor: PRIMARY_COLOR, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, 
        shadowRadius: 10, // Wider radius for softer falloff
        elevation: 10, 
        // Removed border to let the primary color background blend more smoothly
    },
    
    // ⭐ NEW: PADDING STYLE FOR SECTIONS INSIDE THE BOX
    innerSectionPadding: {
        paddingHorizontal: 15,
        paddingVertical: 15, 
    },
    
    // --- SCROLL IMAGES STYLES (Enhanced Styling using LIGHT_ACCENT_COLOR) ---
    scrollImageContainerClean: {
        flexDirection: 'row',
    },
    scrollItemContainer: {
        width: SCROLL_ITEM_WIDTH,
        height: 160,
        marginRight: 15,
        borderRadius: 12, 
        backgroundColor: BACKGROUND_COLOR, 
        justifyContent: 'center',
        alignItems: 'center',
        
        // ⭐ ENHANCED STYLING for LIGHT_ACCENT_COLOR usage: Soft shadow and blue highlight
        shadowColor: LIGHT_ACCENT_COLOR, 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8, 
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 2, 
        borderColor: LIGHT_ACCENT_COLOR, 
    },
    scrollImage: {
        width: 160,
        height: 160,
        borderRadius: 10,
    },
    // --- SECTION TITLE STYLES (Refined weight) ---
    sectionTitle: {
        fontSize: 20, 
        fontWeight: '800', 
        color: PRIMARY_COLOR,
        marginBottom: 15,
    },
    sectionTitleCenter: {
        fontSize: 20, 
        fontWeight: '800', 
        color: PRIMARY_COLOR,
        marginBottom: 15,
        textAlign: 'center',
    },
    // --- DASHBOARD CARDS STYLES (Floating/Subtle Lift) ---
    dashboardRow: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dashboardCard: {
        width: '48%', 
        alignItems: 'center', 
        paddingVertical: 15, 
        paddingHorizontal: 10,
        borderRadius: 15, 
        backgroundColor: BACKGROUND_COLOR, // Pure white
        borderWidth: 1, // Minimal border
        borderColor: LIGHT_ACCENT_COLOR + '60', 
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.08, // Very subtle lift
        shadowRadius: 3, 
        elevation: 3, 
    },
    iconCircle: {
        width: 50, 
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: LIGHT_ACCENT_COLOR, // Overridden in component
        marginBottom: 8,
    },
    dashboardCardText: {
        fontSize: 14, 
        fontWeight: '700', 
        color: PRIMARY_COLOR, 
        textAlign: 'center',
        marginTop: 5, 
    },
    // --- ADVANTAGE STYLES (Border Enhanced) ---
    advantageRow: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    advantageContainer: {
        width: '31%', 
        alignItems: 'center',
        paddingVertical: 10, 
        paddingHorizontal: 5,
        borderRadius: 12, 
        
        borderWidth: 1.5,
        borderColor: LIGHT_ACCENT_COLOR, 
        
        backgroundColor: BACKGROUND_COLOR, 
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, 
        shadowRadius: 3,
        elevation: 3,
    },
    advantageIconCircle: {
        width: 40, 
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    advantageText: {
        fontSize: 10, 
        color: GREY_TEXT, 
        textAlign: 'center',
        lineHeight: 14, 
    },
    // --- REVIEW STYLES (Floating Card Effect) ---
    reviewsList: {
        paddingVertical: 10,
        marginLeft: -15, 
        paddingLeft: 15,
        paddingRight: 15, 
    },
    reviewCard: {
        backgroundColor: CARD_LIGHT_BG, 
        borderRadius: 18, // Slightly more rounded
        padding: 18, // Slightly more padding
        marginRight: 15, 
        width: screenWidth * 0.75, 
        
        // ⭐ FLOATING EFFECT (Border removed, shadow strengthened)
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 6 }, // Stronger vertical lift
        shadowOpacity: 0.1, // Softer opacity
        shadowRadius: 10, // Wider, softer glow
        elevation: 6,
    },
    reviewHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    reviewName: {
        fontSize: 16,
        fontWeight: '800', 
        color: PRIMARY_COLOR,
        textAlign: 'left',
    },
    reviewLocation: {
        fontSize: 11, 
        color: GREY_TEXT, // Controlled by component now
        textAlign: 'left',
        fontStyle: 'italic',
        marginBottom: 5,
    },
    reviewRating: {
        flexDirection: 'row',
        marginTop: 8, 
    },
    reviewStar: {
        marginRight: 2,
    },
    reviewText: {
        fontSize: 13, 
        fontStyle: 'normal',
        lineHeight: 19, 
    },
    // --- NEW BENEFIT STYLES (Border Enhanced) ---
    benefitsSection: {
        marginBottom: 0, 
    },
    // ⭐ NEW STYLE: Removes top padding from the section
    benefitsSectionNoTopPadding: {
        paddingHorizontal: 15,
        paddingTop: 0, // Removed top padding
        paddingBottom: 15, // Kept bottom padding
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor:"#cee6f0ff", 
        borderRadius: 12, 
        padding: 12, 
        marginBottom: 10,
        borderWidth: 1.5, 
        borderColor: PRIMARY_COLOR + '20', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, 
        shadowRadius: 1,
        elevation: 1,
    },
    benefitIconCircle: {
        width: 45, 
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    benefitTextContent: {
        flex: 1,
    },
    benefitHeading: {
        fontSize: 15, 
        fontWeight: '700',
        color: PRIMARY_COLOR,
        marginBottom: 2,
    },
    benefitDescription: {
        fontSize: 11.5, 
        color: GREY_TEXT, // Controlled by component now
        lineHeight: 17,
    },
    // ⭐ VIEW LICENSE LINK (STYLIST BUTTON)
    viewLicenseLink: {
        alignSelf: 'center', // Center the button
        marginTop: 15,
        marginBottom: 10,
        paddingVertical: 10, 
        paddingHorizontal: 25, 
        borderRadius: 30, // True pill shape
        
        // Set background to secondary color
        backgroundColor: SECONDARY_COLOR,
        borderWidth: 0, 
        
        // Strong glow effect using secondary color
        shadowColor: SECONDARY_COLOR, 
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.7, 
        shadowRadius: 12, // Wide glow
        elevation: 8,
    },
    viewLicenseContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewLicenseText: {
        marginLeft: 8, // Increased margin for icon separation
        fontSize: 15, // Slightly larger font
        fontWeight: '700',
        color: '#fff', // White text
        textDecorationLine: 'none',
    },
    // ⭐ BOTTOM BUTTON STYLE (High Priority CTA)
    bottomButton: {
        marginHorizontal: 15, 
        marginTop: 35, // Increased margin to separate from the main box
        marginBottom: 100,   
        backgroundColor: SECONDARY_COLOR, 
        paddingVertical: 20, // Increased padding
        borderRadius: 30, 
        alignItems: 'center',
        justifyContent: 'center',
        
        // Stronger glow and lift
        shadowColor: SECONDARY_COLOR, 
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5, 
        shadowRadius: 15, // Max soft glow
        elevation: 15,
    },
    floatingButtonText: {
        fontSize: 18,
        fontWeight: '800', 
        color: '#fff',
    },
    
    // --- NEW PAGINATION DOTS STYLES ---
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10, 
    },
    paginationDot: {
        height: 7, 
        width: 7,
        borderRadius: 3.5,
        marginHorizontal: 3,
        backgroundColor: LIGHT_ACCENT_COLOR, 
    },
    activeDot: {
        height: 8, 
        width: 8,
        backgroundColor: PRIMARY_COLOR, 
    },
    // --- NEW: SECTION DIVIDER STYLE ---
    // MODIFICATION 3: Changed marginVertical from 10 to 5
    sectionDivider: {
        height: 1,
        backgroundColor: LIGHT_ACCENT_COLOR, 
        marginHorizontal: 15,
        marginVertical: 5,
    }
});


// -------------------------------------------------------------
// ⭐ MODAL STYLES
// -------------------------------------------------------------
const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    enlargedImage: {
        width: screenWidth * 0.95,
        height: screenHeight * 0.95,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        padding: 10,
        zIndex: 1,
    },
});

export default Home;