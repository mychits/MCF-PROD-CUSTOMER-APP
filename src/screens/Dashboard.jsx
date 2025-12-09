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
const PRIMARY_COLOR = '#053B90'; 
const SECONDARY_COLOR = '#EF6C00'; 
const LIGHT_ACCENT_COLOR = '#B3E5FC'; // The color to enhance
const BACKGROUND_COLOR = '#FFFFFF'; 
const CARD_LIGHT_BG = '#E3F2FD'; // Lighter blue background
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

// -------------------------------------------------------------
// ⭐ REVIEWS data (UPDATED with new list)
// -------------------------------------------------------------
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
                {/* Ensure header text is bold and primary color for hierarchy */}
                <Text style={styles.reviewName}>{item.name}</Text>
                <Text style={styles.reviewLocation}>{item.location}</Text>
            </View>
            {/* APPLYING baseText HERE for stylish, readable body text */}
            <Text style={[styles.reviewText, styles.baseText]}>{item.review}</Text>
            <StarRating rating={item.rating} />
        </View>
    );

    // ⭐ DASHBOARD ITEM RENDER FUNCTION
    const DashboardItem = ({ iconName, text, targetScreen }) => (
        <TouchableOpacity 
            style={styles.dashboardCard} 
            onPress={() => navigation.navigate(targetScreen)}
        >
            <View style={[styles.iconCircle, { backgroundColor: SECONDARY_COLOR }]}>
                <Feather name={iconName} size={24} color="#fff" />
            </View>
            {/* Ensuring text uses PRIMARY_COLOR and the correct font style */}
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
                {/* Heading uses strong color for hierarchy */}
                <Text style={styles.benefitHeading}>{heading}</Text>
                {/* Description uses readable, lighter color */}
                <Text style={styles.benefitDescription}>{description}</Text>
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


    return (
        <SafeAreaView style={[styles.container, styles.screenContainer]}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} /> 
            
            {/* ⭐ HEADER - MODIFIED PADDING HERE */}
            <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 15 }]}>
                <View style={styles.logoTitleContainer}>
                    <Image source={Group400} style={styles.headerLogo} resizeMode="contain" />
                    <Text style={styles.headerTitle}>MyChits</Text>
                </View>
                <TouchableOpacity style={styles.helpButton} onPress={() => navigation.navigate("Help")} >
                    <Ionicons name="help-circle-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.scrollContent}>
                
                {/* ⭐ YOUR HORIZONTAL SCROLLING IMAGES - Chit Schemes (CLEANED UP BOX) */}
                <View style={[styles.sectionPadding, { marginBottom: 25 }]}>
                    <Text style={styles.sectionTitle}>Explore Chit Schemes</Text>
                    {/* The ScrollView itself acts as the box for scrolling */}
                    <ScrollView 
                        ref={scrollRef} 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollImageContainerClean}
                        // Added for dot synchronization
                        onScroll={handleScroll}
                        scrollEventThrottle={16} // Update scroll position frequently
                        pagingEnabled // Optional: Makes snapping to the next item easier
                    >
                        {SCROLL_IMAGES.map((img, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={styles.scrollItemContainer} // Style updated
                                onPress={() => handleImagePress(img)}
                            >
                                <Image source={img} style={styles.scrollImage} resizeMode="contain" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    
                    {/* ⭐ NEW: Pagination Dots Component */}
                    <PaginationDots />
                </View>
                
                {/* ⭐ NEW SECTION: Benefits & License Link */}
                <View style={[styles.sectionPadding, styles.benefitsSection]}>
                    <Text style={styles.sectionTitleCenter}>Why Choose MyChits?</Text>
                    
                    {benefitsData.map((item, index) => (
                        <BenefitItem key={index} {...item} />
                    ))}
                    
                    {/* View License Link */}
                    <TouchableOpacity
                        style={styles.viewLicenseLink} // Style updated
                        onPress={() => navigation.navigate('LicenseAndCertificate')}
                    >
                        <View style={styles.viewLicenseContent}>
                            <MaterialIcons name="link" size={14} color={PRIMARY_COLOR} />
                            <Text style={styles.viewLicenseText}>View License and Certificate</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ⭐ DASHBOARD CARDS - My Dashboard (Grid of 2) */}
                <View style={styles.sectionPadding}>
                    <Text style={styles.sectionTitle}>My Dashboard</Text>
                    
                    <FlatList
                        // FIX: Add key to force re-render when numColumns changes (2)
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

                {/* ⭐ ADVANTAGES - App Advantages (Grid of 3) */}
                <View style={[styles.sectionPadding, { marginTop: 25 }]}>
                    <Text style={styles.sectionTitleCenter}>App Advantages</Text>
                    <FlatList
                        // Change key to reflect 3 columns
                        key={'advantage-grid-3'} 
                        data={ADVANTAGES}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={3} 
                        scrollEnabled={false}
                        columnWrapperStyle={styles.advantageRow}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.advantageContainer} // Style updated
                                onPress={() => handleAdvantageAction(item)}
                            >
                                <View style={[styles.advantageIconCircle, { backgroundColor: item.iconColor + '20' }]}>
                                    <MaterialIcons name={item.icon} size={28} color={item.iconColor} />
                                </View>
                                {/* Using one text block with bolding for space saving */}
                                {/* APPLYING baseText HERE for stylish, readable body text */}
                                <Text style={[styles.advantageText, styles.baseText]}>
                                    <Text style={{fontWeight: '700'}}>{item.text1}</Text>
                                    <Text>{item.text2}</Text>
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* ⭐ CUSTOMER REVIEWS */}
                <View style={[styles.sectionPadding, { marginTop: 20 }]}>
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

                {/* ⭐ START SAVING BUTTON (Placed at the end of scroll content) */}
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
// ⭐ STYLES (Updated to make LIGHT_ACCENT_COLOR elements more stylish)
// -------------------------------------------------------------
const styles = StyleSheet.create({
    // --- UNIQUE/GENERIC STYLES ADDED ---
    screenContainer: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR, // Ensure the entire screen background is white
    },
    baseText: {
        // Dark grey for improved readability/stylishness
        color: '#444444', 
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
    },
    scrollContent: {
        paddingTop: 18, 
        paddingBottom: 20, 
    },
    // --- HEADER STYLES ---
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
    },
    helpButton: {
        padding: 5,
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
        shadowColor: LIGHT_ACCENT_COLOR, // Using LIGHT_ACCENT_COLOR for a beautiful, blue glow shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 2, 
        borderColor: LIGHT_ACCENT_COLOR, // Keep border for definition
    },
    scrollImage: {
        width: 160,
        height: 160,
        borderRadius: 10,
    },
    // --- SECTION TITLE STYLES ---
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: PRIMARY_COLOR,
        marginBottom: 15,
    },
    sectionTitleCenter: {
        fontSize: 22,
        fontWeight: '700',
        color: PRIMARY_COLOR,
        marginBottom: 15,
        textAlign: 'center',
    },
    // --- DASHBOARD CARDS STYLES (Border & Text Enhanced) ---
    sectionPadding: {
        paddingHorizontal: 15,
    },
    dashboardRow: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dashboardCard: {
        width: '48%', 
        alignItems: 'center', 
        paddingVertical: 20, 
        paddingHorizontal: 10,
        borderRadius: 12, 
        backgroundColor: CARD_LIGHT_BG, 
        borderWidth: 2, // Thicker border
        borderColor: PRIMARY_COLOR + '50', // More visible primary border
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    iconCircle: {
        width: 50, 
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: SECONDARY_COLOR, 
        marginBottom: 8,
    },
    dashboardCardText: {
        fontSize: 14, 
        fontWeight: '600',
        color: PRIMARY_COLOR, // Ensure strong text color
        textAlign: 'center',
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
        borderRadius: 10, 
        
        // ⭐ STYLIST BORDER COLOR: Defined border using a primary tint
        borderWidth: 1.5,
        borderColor: PRIMARY_COLOR + '40', // Semi-transparent Primary Color border
        
        // ⭐ ENHANCED STYLING: Smoother background and subtle shadow instead of border
        backgroundColor: LIGHT_ACCENT_COLOR + '90', 
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
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
        // Base text styles are applied in the component, augmenting these specific styles
        fontSize: 10, 
        color: PRIMARY_COLOR, // Keep primary color for text
        textAlign: 'center',
        lineHeight: 14, // Adjusted for better line spacing on small text
    },
    // --- REVIEW STYLES (Border Enhanced for pop) ---
    reviewsList: {
        paddingVertical: 10,
    },
    reviewCard: {
        backgroundColor: CARD_LIGHT_BG, 
        borderRadius: 15, 
        padding: 15,
        marginHorizontal: 10,
        width: screenWidth * 0.8,
        borderWidth: 1.5, // Slightly thicker border
        // ⭐ STYLIST BORDER COLOR: Secondary Color tint for contrast
        borderColor: SECONDARY_COLOR + '30', 
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 3 }, // Stronger shadow
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    reviewHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    reviewName: {
        fontSize: 16,
        fontWeight: '700',
        color: PRIMARY_COLOR,
        textAlign: 'left',
    },
    reviewLocation: {
        fontSize: 12,
        color: '#666',
        textAlign: 'left',
        fontStyle: 'italic',
        marginBottom: 5,
    },
    reviewRating: {
        flexDirection: 'row',
        marginTop: 5,
        marginBottom: 10,
    },
    reviewStar: {
        marginRight: 2,
    },
    reviewText: {
        // Base text styles are applied in the component, augmenting these specific styles
        fontSize: 14,
        fontStyle: 'normal',
        lineHeight: 20,
        // The color is now controlled by baseText for stylishness
    },
    // --- NEW BENEFIT STYLES (Border Enhanced) ---
    benefitsSection: {
        marginBottom: 25,
        paddingHorizontal: 15,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BACKGROUND_COLOR, 
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1.5, // Thicker border
        // ⭐ STYLIST BORDER COLOR: Primary Color tint for a strong, clean look
        borderColor: PRIMARY_COLOR + '40', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    benefitIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    benefitTextContent: {
        flex: 1,
    },
    benefitHeading: {
        fontSize: 16,
        fontWeight: '700',
        color: PRIMARY_COLOR,
        marginBottom: 2,
    },
    benefitDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    // --- VIEW LICENSE LINK (Enhanced Styling using SECONDARY_COLOR border) ---
    viewLicenseLink: {
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        
        // ⭐ STYLIST BORDER COLOR: Secondary Color border to pop
        borderWidth: 1,
        borderColor: SECONDARY_COLOR,
        
        // ⭐ ENHANCED STYLING: Floating appearance with a blue glow
        backgroundColor: LIGHT_ACCENT_COLOR,
        shadowColor: LIGHT_ACCENT_COLOR, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 6,
    },
    viewLicenseContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewLicenseText: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: '600',
        color: PRIMARY_COLOR,
        textDecorationLine: 'none',
    },
    // --- BOTTOM BUTTON STYLE (Non-Floating) ---
    bottomButton: {
        marginHorizontal: 20, 
        marginTop: 20,       
        marginBottom: 100,   
        backgroundColor: SECONDARY_COLOR, 
        paddingVertical: 15,
        borderRadius: 30, 
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    floatingButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    
    // --- NEW PAGINATION DOTS STYLES ---
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10, // Space between scroll view and dots
    },
    paginationDot: {
        height: 8,
        width: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        // Default color for inactive dot (like a lighter grey)
        backgroundColor: '#ccc', 
    },
    activeDot: {
        // Active dot color (Use the PRIMARY_COLOR or SECONDARY_COLOR)
        backgroundColor: PRIMARY_COLOR, 
    },
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