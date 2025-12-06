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
    Modal, // <== ADDED: Import Modal
} from 'react-native';

import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContextProvider } from '../context/UserProvider';
import Group400 from '../../assets/Group400.png';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height; // <== ADDED: Screen Height for Modal

// -------------------------------------------------------------
// ⭐ CONFIGURATION
// -------------------------------------------------------------
// UI Colors
const PRIMARY_COLOR = '#1976D2'; // Deeper, standard blue
const ACCENT_COLOR = '#FFC107'; // Gold/Amber for highlights
const LIGHT_BACKGROUND = '#F5F8FA'; // Very light grey/off-white

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
const SCROLL_ITEM_WIDTH = 175; // 160 (Image width) + 15 (margin)

// -------------------------------------------------------------
// ⭐ MODAL COMPONENT (NEW)
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
    const [greeting, setGreeting] = useState('');
    
    // <== ADDED STATE FOR MODAL
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const scrollRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    // Auto-Scrolling Logic (Unchanged)
    useEffect(() => {
        let intervalId;

        const autoScroll = () => {
            const nextIndex = (currentIndex + 1) % SCROLL_IMAGES.length;
            const offset = nextIndex * SCROLL_ITEM_WIDTH;
            scrollRef.current?.scrollTo({ x: offset, animated: true });
            setCurrentIndex(nextIndex);
        };

        intervalId = setInterval(autoScroll, 1500);

        return () => clearInterval(intervalId);
    }, [currentIndex]);
    
    // <== NEW: Handler to open the modal
    const handleImagePress = (imgSource) => {
        setSelectedImage(imgSource);
        setIsModalVisible(true);
    };

    // <== NEW: Handler to close the modal
    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedImage(null);
    };

    const ADVANTAGES = [
        { id: 'a1', title: 'Security', description: 'Regulated and safe.', icon: 'shield' },
        { id: 'a2', title: 'Flexibility', description: 'Choose your term.', icon: 'clock' },
        { id: 'a3', title: 'High Returns', description: 'Better than savings.', icon: 'trending-up' },
    ];

    const REVIEWS = [
        { id: 'r1', name: 'John Doe', rating: 5, text: 'This platform made my investment easy and secure. Highly recommend!' },
        { id: 'r2', name: 'Jane Smith', rating: 4, text: 'Great rates and the dashboard is incredibly easy to navigate. Top-notch!' },
        { id: 'r3', name: 'Alex T.', rating: 5, text: 'Customer support is responsive, and the process is fully transparent.' },
    ];

    const renderAdvantage = ({ item }) => (
        <View style={styles.advantageCard}>
            <Feather name={item.icon} size={28} color={PRIMARY_COLOR} />
            <Text style={styles.advantageTitle}>{item.title}</Text>
            <Text style={styles.advantageDescription}>{item.description}</Text>
        </View>
    );

    const renderReview = ({ item }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewRating}>
                {[...Array(item.rating)].map((_, i) => (
                    <Ionicons key={i} name="star" size={16} color={ACCENT_COLOR} />
                ))}
            </View>
            <Text style={styles.reviewText}>"{item.text}"</Text>
            <Text style={styles.reviewName}>- {item.name}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />

            {/* HEADER - Updated color and style */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.logoTitleContainer}>
                    <Image source={Group400} style={styles.headerLogo} resizeMode="contain" />
                    <Text style={styles.headerTitle}>MyChits</Text>
                </View>
                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => navigation.navigate("HelpCenter")}
                >
                    <Ionicons name="help-circle-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.scrollContent}>

                {/* ⭐ WELCOME SECTION - Moved to the top and enhanced */}
                <View style={styles.welcomeContainer}>
                    <Text style={styles.greetingText}>
                        {greeting},
                    </Text>
                    <Text style={styles.userNameText}>
                        {appUser.full_name || "User"}
                    </Text>
                </View>

                {/* ⭐ YOUR HORIZONTAL SCROLLING IMAGES - Cleaned up */}
                <View style={{ marginBottom: 20 }}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scrollImageContainer}
                    >
                        {SCROLL_IMAGES.map((img, index) => (
                            // <== WRAPPED IN TOUCHABLEOPACITY
                            <TouchableOpacity 
                                key={index} 
                                style={styles.scrollItemContainer}
                                onPress={() => handleImagePress(img)} // <== ADDED HANDLER
                            >
                                <Image
                                    source={img}
                                    style={styles.scrollImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>


                {/* ⭐ DASHBOARD CARDS - Refined look with shadows */}
                <View style={styles.sectionPadding}>
                    <Text style={styles.sectionTitle}>My Overview</Text>

                    <TouchableOpacity style={styles.dashboardCard}>
                        <Feather name="credit-card" size={24} color={PRIMARY_COLOR} />
                        <Text style={styles.dashboardCardText}>Wallet Balance</Text>
                        <MaterialIcons name="chevron-right" size={24} color="#555" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dashboardCard}>
                        <Feather name="users" size={24} color={PRIMARY_COLOR} />
                        <Text style={styles.dashboardCardText}>Active Chits</Text>
                        <MaterialIcons name="chevron-right" size={24} color="#555" />
                    </TouchableOpacity>
                </View>

                {/* ⭐ ADVANTAGES SECTION - Card focus */}
                <View style={styles.sectionPadding}>
                    <Text style={styles.sectionTitle}>Why MyChits?</Text>
                    <FlatList
                        data={ADVANTAGES}
                        renderItem={renderAdvantage}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 5 }}
                    />
                </View>

                {/* ⭐ REVIEWS SECTION - Focused, styled carousel */}
                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitleCenter}>What Customers Say</Text>
                    <FlatList
                        data={REVIEWS}
                        renderItem={renderReview}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={screenWidth * 0.8 + 20} // Adjusted snap interval
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingHorizontal: 15 }}
                    />
                </View>

            </ScrollView>
            
            {/* <== ADDED MODAL */}
            <EnlargedImageModal
                isVisible={isModalVisible}
                imageSource={selectedImage}
                onClose={handleModalClose}
            />
            
        </SafeAreaView>
    );
};

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LIGHT_BACKGROUND,
    },

    // --- HEADER STYLES ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: PRIMARY_COLOR,
    },

    logoTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    headerLogo: {
        width: 30,
        height: 30,
        marginRight: 8,
        tintColor: ACCENT_COLOR, 
    },

    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    
    helpButton: {
        padding: 5,
    },

    mainScrollView: { flex: 1 },
    scrollContent: { paddingBottom: 30 },
    sectionPadding: {
        paddingHorizontal: 15,
        marginBottom: 20,
    },

    // --- WELCOME STYLES ---
    welcomeContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginTop: 10,
    },
    greetingText: {
        fontSize: 16,
        color: '#616161',
        fontWeight: '500',
    },
    userNameText: {
        fontWeight: '800',
        fontSize: 26,
        color: PRIMARY_COLOR,
    },
    
    // --- SCROLLING IMAGES STYLES ---
    scrollImageContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15, 
    },

    scrollItemContainer: {
        width: 160,
        height: 160,
        marginRight: 15, 
        borderRadius: 12, 
        backgroundColor: '#fff', 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, 
    },

    scrollImage: {
        width: 160, 
        height: 160, 
        borderRadius: 12,
    },

    // --- SECTION TITLE STYLES ---
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: PRIMARY_COLOR,
        marginBottom: 15,
    },
    sectionTitleCenter: {
        fontSize: 20,
        fontWeight: '700',
        color: PRIMARY_COLOR,
        marginBottom: 15,
        textAlign: 'center',
    },


    // --- DASHBOARD CARD STYLES ---
    dashboardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },

    dashboardCardText: {
        flex: 1,
        marginLeft: 15,
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },

    // --- ADVANTAGES STYLES ---
    advantagesContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        width: '100%',
        marginBottom: 20,
    },

    advantageCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginRight: 15,
        alignItems: 'center',
        width: screenWidth * 0.38,
        height: 140, 
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 1,
    },

    advantageTitle: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '700',
        color: PRIMARY_COLOR,
        textAlign: 'center',
    },
    advantageDescription: {
        fontSize: 12,
        marginTop: 4,
        color: '#616161',
        textAlign: 'center',
    },


    // --- REVIEWS STYLES ---
    reviewsSection: { 
        paddingVertical: 15,
        backgroundColor: '#E3F2FD', 
    },

    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 10,
        width: screenWidth * 0.8, 
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
    },

    reviewRating: {
        flexDirection: 'row',
        marginBottom: 10,
    },

    reviewText: { 
        fontSize: 15, 
        fontStyle: 'italic', 
        color: '#333',
        lineHeight: 22,
    },

    reviewName: { 
        fontSize: 14, 
        fontWeight: '700', 
        color: PRIMARY_COLOR, 
        textAlign: 'right', 
        marginTop: 10,
    },
});


// -------------------------------------------------------------
// ⭐ MODAL STYLES (NEW)
// -------------------------------------------------------------
const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.95)', // Dark transparent background
    },
    enlargedImage: {
        width: screenWidth * 0.95, // Image takes up most of the screen width
        height: screenHeight * 0.95, // Image takes up most of the screen height
        
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10, // Ensure the cross mark is on top of the image
        // Optional: Add background to make the icon easier to tap
        backgroundColor: 'rgba(0,0,0,0.5)', 
        borderRadius: 20, 
        padding: 2,
    },
});

export default Home;