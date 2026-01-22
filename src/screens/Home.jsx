import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    Linking,
    StatusBar,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    BackHandler,
    ScrollView,
    Platform,
    Modal,
    Alert,
    Animated,
    PanResponder,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import url from '../data/url';
import { NetworkContext } from '../context/NetworkProvider';
import Toast from 'react-native-toast-message';
import { useFocusEffect, StackActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ContextProvider } from '../context/UserProvider';
import Group400 from '../../assets/Group400.png';

const screenWidth = Dimensions.get('window').width;

const Home = ({ route, navigation }) => {
    const [appUser, setAppUser] = useContext(ContextProvider);
    const userId = appUser.userId || {};
    const [activeIndex, setActiveIndex] = useState(0);
    const insets = useSafeAreaInsets();
    const [greeting, setGreeting] = useState('');
    const [userData, setUserData] = useState({
        full_name: '', phone_number: '', address: '',
    });
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);
    const [userDataError, setUserDataError] = useState(null);
    const { isConnected, isInternetReachable } = useContext(NetworkContext);
    const [isHelpModalVisible, setHelpModalVisible] = useState(false);
    const [isSideMenuVisible, setSideMenuVisible] = useState(false);
    const openLink = async (url) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", "Don't know how to open this URL: " + url);
            }
        } catch (error) {
            console.error("An error occurred", error);
        }
    };

    // Animation and PanResponder setup
    const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return isSideMenuVisible && gestureState.dx < -10;
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dx < 0) {
                    slideAnim.setValue(Math.max(gestureState.dx, -screenWidth));
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx < -screenWidth / 2) {
                    closeSideMenu();
                } else {
                    openSideMenu();
                }
            },
        })
    ).current;

    const openSideMenu = () => {
        if (!isConnected || !isInternetReachable) {
            Toast.show({
                type: 'error',
                text1: 'Offline',
                text2: 'Please connect to the internet to access menu options.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            return;
        }
        setSideMenuVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeSideMenu = () => {
        Animated.timing(slideAnim, {
            toValue: -screenWidth,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setSideMenuVisible(false));
    };

    // Change state to an array to hold multiple relationship managers
    const [relationshipManagers, setRelationshipManagers] = useState([]);

    const handleWhatsAppPress = async () => {
        const countryCode = '91';
        const localPhoneNumber = '9483900777';
        const fullPhoneNumber = `${countryCode}${localPhoneNumber}`;

        const message = "Hello, I need assistance with MyChits App.";

        const whatsappUrl = `https://wa.me/${fullPhoneNumber}?text=${encodeURIComponent(message)}`;

        try {
            const supported = await Linking.canOpenURL(whatsappUrl);

            if (supported) {
                await Linking.openURL(whatsappUrl);
            } else {
                Alert.alert(
                    "WhatsApp Not Found",
                    "WhatsApp is not installed on your device, or we could not open it. Please ensure WhatsApp is installed and try again.",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error("Error opening WhatsApp:", error);
            Alert.alert(
                "Error",
                "Could not open WhatsApp. Please check your internet connection and ensure WhatsApp is installed. If the issue persists, please contact support directly.",
                [{ text: "OK" }]
            );
        }
    };

    const handleRateApp = async () => {
        // Replace 'com.mychits.app' and 'com.mychits' with your actual app bundle IDs
        const appId = Platform.OS === 'ios' ? 'com.mychits.app' : 'com.mychits';
        const appStoreLink = Platform.OS === 'ios'
            ? `itms-apps://itunes.apple.com/app/id${appId}`
            : `market://details?id=${appId}`;

        if (!isConnected || !isInternetReachable) {
            Toast.show({
                type: 'error',
                text1: 'Offline',
                text2: 'Please connect to the internet to rate the app.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            return;
        }

        try {
            const supported = await Linking.canOpenURL(appStoreLink);
            if (supported) {
                await Linking.openURL(appStoreLink);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Cannot Open Store',
                    text2: 'Could not open app store. Please check your settings.',
                    position: 'bottom',
                    visibilityTime: 4000,
                });
            }
        } catch (error) {
            console.error('An error occurred opening app store:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'An unexpected error occurred.',
                position: 'bottom',
                visibilityTime: 4000,
            });
        }
    };

    const menuItems = [
        { title: "About Us", icon: "info", link: "About" },
        { title: "Privacy Policy", icon: "privacy-tip", link: "Privacy" },
        { title: "Help", icon: "help-outline", link: "Help" },
        { title: "F&Q", icon: "question-answer", link: "Fq" },
        { title: "WhatsApp", icon: "whatsapp", onPress: handleWhatsAppPress },
    ];

    const sideMenuItems = [
        { title: "Chat with MyChit", icon: "chatbubbles-outline", onPress: handleWhatsAppPress },
        { title: "Get Help", icon: "help-circle-outline", link: "Help" },
        // START OF MODIFICATION TO PREVENT NAVIGATION ON 'EARN REWARDS'
        {
            title: "Earn Rewards",
            icon: "gift-outline",
            featureTitle: "Rewards",
            link: "RewardsScreen" // Changed from manual Toast to navigation link
        },
        // END OF MODIFICATION
        // START OF MODIFICATION: Added My Profile to Side Menu
        { title: "My Profile", icon: "person-outline", link: "ProfileScreen" },
        // END OF MODIFICATION
    ];

    const handleNeedHelp = () => {
        if (!isConnected || !isInternetReachable) {
            Toast.show({
                type: 'error',
                text1: 'Offline',
                text2: 'Please connect to the internet to access help options.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            return;
        }
        setHelpModalVisible(true);
    };

    const handleOpenSideMenu = () => {
        if (!isConnected || !isInternetReachable) {
            Toast.show({
                type: 'error',
                text1: 'Offline',
                text2: 'Please connect to the internet to access menu options.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            return;
        }
        openSideMenu();
    };

    const handleCallUs = () => {
        const phoneNumber = '9483900777';
        Linking.canOpenURL(`tel:${phoneNumber}`)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(`tel:${phoneNumber}`).catch((error) => {
                        console.error('Error opening phone dialer:', error);
                        Toast.show({
                            type: 'error',
                            text1: 'Call Error',
                            text2: 'Could not open phone dialer.',
                            position: 'bottom',
                            visibilityTime: 4000,
                        });
                    });
                } else {
                    Toast.show({
                        type: 'info',
                        text1: 'Not Supported',
                        text2: 'Phone calls are not supported on this device.',
                        position: 'bottom',
                        visibilityTime: 4000,
                    });
                }
            })
            .catch((error) => {
                console.error('Error checking phone dialer availability:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'An error occurred while checking phone call availability.',
                    position: 'bottom',
                    visibilityTime: 4000,
                });
            });
    };

    // Updated function to handle calls to a specific RM phone number
    const handleRelationshipManagerCall = (phoneNumber) => {
        if (!phoneNumber) {
            Toast.show({
                type: 'error',
                text1: 'Call Error',
                text2: 'Relationship Manager phone number is not available.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            return;
        }
        Linking.canOpenURL(`tel:${phoneNumber}`)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(`tel:${phoneNumber}`).catch((error) => {
                        console.error('Error opening phone dialer:', error);
                        Toast.show({
                            type: 'error',
                            text1: 'Call Error',
                            text2: 'Could not open phone dialer.',
                            position: 'bottom',
                            visibilityTime: 4000,
                        });
                    });
                } else {
                    Toast.show({
                        type: 'info',
                        text1: 'Not Supported',
                        text2: 'Phone calls are not supported on this device.',
                        position: 'bottom',
                        visibilityTime: 4000,
                    });
                }
            })
            .catch((error) => {
                console.error('Error checking phone dialer availability:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'An error occurred while checking phone call availability.',
                    position: 'bottom',
                    visibilityTime: 4000,
                });
            });
    };

    const handleWebsiteLink = async () => {
        const websiteUrl = 'https://mychits.co.in/';
        if (!isConnected || !isInternetReachable) {
            Toast.show({
                type: 'error',
                text1: 'Offline',
                text2: 'Please connect to the internet to open the website.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            return;
        }
        try {
            const supported = await Linking.canOpenURL(websiteUrl);
            if (supported) {
                await Linking.openURL(websiteUrl);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Cannot Open URL',
                    text2: `Don't know how to open this URL: ${websiteUrl}`,
                    position: 'bottom',
                    visibilityTime: 4000,
                });
            }
        } catch (error) {
            console.error('Error opening website:', error);
            Toast.show({
                type: 'error',
                text1: 'Error Opening Website',
                text2: 'An error occurred while trying to open the website.',
                position: 'bottom',
                visibilityTime: 4000,
            });
        }
    };

    const handleMenuItemPress = (item) => {
        setHelpModalVisible(false);
        setSideMenuVisible(false);
        if (item.onPress) {
            item.onPress();
        } else if (typeof item.link === 'string' && item.link.length > 0) {
            navigation.navigate(item.link, { user: route.params.user || {} });
        } else {
            console.warn("Invalid navigation item:", item);
            Alert.alert("Navigation Error", `Could not navigate to ${item.title}. Link is invalid or missing.`);
        }
    };

    const handleLogout = () => {
        closeSideMenu();
        navigation.dispatch(StackActions.replace('Login'));
    };

    const handleCustomerSupportCall = (phoneNumber) => {
        if (!phoneNumber) {
            Toast.show({
                type: 'error',
                text1: 'Call Error',
                text2: 'Phone number not provided for customer support.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            return;
        }

        Linking.canOpenURL(`tel:${phoneNumber}`)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(`tel:${phoneNumber}`).catch((error) => {
                        console.error('Error opening phone dialer:', error);
                        Toast.show({
                            type: 'error',
                            text1: 'Call Error',
                            text2: 'Could not open phone dialer for customer support.',
                            position: 'bottom',
                            visibilityTime: 4000,
                        });
                    });
                } else {
                    Toast.show({
                        type: 'info',
                        text1: 'Not Supported',
                        text2: 'Phone calls are not supported on this device.',
                        position: 'bottom',
                        visibilityTime: 4000,
                    });
                }
            })
            .catch((error) => {
                console.error('Error checking phone dialer availability:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'An error occurred while checking phone call availability.',
                    position: 'bottom',
                    visibilityTime: 4000,
                });
            });
    };

    const fetchUserData = async () => {
        if (!isConnected || !isInternetReachable) {
            setIsLoadingUserData(false);
            setUserDataError("No internet connection.");
            setUserData({ full_name: '', phone_number: '', address: '' });
            return;
        }
        setIsLoadingUserData(true);
        setUserDataError(null);
        try {
            if (!userId) {
                console.warn("userId is undefined. Cannot fetch user data.");
                setUserDataError("User ID not found. Please log in again.");
                setIsLoadingUserData(false);
                return;
            }
            const response = await axios.get(`${url}/user/get-user-by-id/${userId}`);
            setUserData(response.data);
            setIsLoadingUserData(false);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setUserDataError("Failed to fetch user data. Please try again.");
            Toast.show({
                type: 'error',
                text1: 'User Data Error',
                text2: 'Could not fetch user information.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            setIsLoadingUserData(false);
        }
    };

    // Update fetch function to handle multiple relationship managers
    const fetchRelationshipManagerDetails = async () => {
        if (!isConnected || !isInternetReachable || !userId) {
            return;
        }

        try {
            const response = await axios.post(`${url}/enroll/get-user-tickets/${userId}`);
            console.log('API Response for RM:', JSON.stringify(response.data, null, 2));

            if (response.data && response.data.length > 0) {
                const uniqueGroups = new Map();

                response.data.forEach(ticket => {
                    const rmDetails = ticket.group_id?.relationship_manager;
                    const groupName = ticket.group_id?.group_name;
                    const groupId = ticket.group_id?._id;

                    if (rmDetails && rmDetails.phone_number && groupName && groupId) {
                        uniqueGroups.set(groupId, {
                            groupName: groupName,
                            name: rmDetails.name,
                            phoneNumber: rmDetails.phone_number
                        });
                    }
                });

                const groupManagers = Array.from(uniqueGroups.values());

                setRelationshipManagers(groupManagers);
            } else {
                console.warn("No user tickets found for this userId.");
                setRelationshipManagers([]);
            }
        } catch (error) {

            Toast.show({
                type: 'error',
                text1: 'RM Data Error',
                text2: 'Could not fetch Relationship Manager details.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            setRelationshipManagers([]);
        }
    };

    useEffect(() => {
        fetchUserData();
        fetchRelationshipManagerDetails();
    }, [userId, isConnected, isInternetReachable]);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'android') {
                const onBackPress = () => {
                    if (isHelpModalVisible) {
                        setHelpModalVisible(false);
                        return true;
                    }
                    if (isSideMenuVisible) {
                        closeSideMenu();
                        return true;
                    }
                    BackHandler.exitApp();
                    return true;
                };

                const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

                return () => {
                    subscription.remove();
                };
            }
            return undefined;
        }, [isHelpModalVisible, isSideMenuVisible])
    );

    const services = [
        { navigateTo: 'Mygroups', icon: 'group', title: 'My Groups', bgColor: '#E8F5E9', iconBg: '#2E7D32', disabled: false },
        { navigateTo: 'EnrollTab', screen: 'EnrollScreenMain', icon: 'group-add', title: 'New Groups', bgColor: '#E3F2FD', iconBg: '#053B90', filter: 'New Groups', disabled: false },
        { navigateTo: 'MyPassbookScreen', icon: 'book', title: 'My Passbook', bgColor: '#E0F7FA', iconBg: '#006064', disabled: false },
        { navigateTo: 'ReportScreen', icon: 'bar-chart', title: 'My Pigmy', bgColor: '#F3E5F5', iconBg: '#7c36a8ff', disabled: false },
        { navigateTo: 'PaymentScreen', icon: 'payment', title: 'My Payments', bgColor: '#FFF3E0', iconBg: '#EF6C00', disabled: false },
        { navigateTo: 'AuctionList', icon: 'gavel', title: 'Auction', bgColor: '#F1F8E9', iconBg: '#558B2F', disabled: false, featureTitle: 'Auction' },
        { navigateTo: 'MyLoan', screen: 'MyLoan', icon: 'account-balance-wallet', title: 'My Loan', bgColor: '#EDE7F6', iconBg: '#3e09a7ff', filter: 'My Loan', disabled: false },
        { navigateTo: 'IntroduceNewCustomers', icon: 'person-add', title: 'Refer Now', bgColor: '#FFFDE7', iconBg: '#F9A825', disabled: false },
        { navigateTo: 'OnlineAuction', screen: 'OnlineAuction', icon: 'language', title: 'Online-Auction', bgColor: '#E0F2F1', iconBg: '#00796B', disabled: false },

    ];

    const mychitsAdvantages = [
        {
            icon: 'lock-clock', text1: 'Join a Chit ', text2: 'in Minutes', iconColor: '#EF6C00', action: 'navigate',
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
            text1: ' Auctions',
            text2: 'every month',
            iconColor: '#FBC02D',
            action: 'navigate',
            targetScreen: 'AuctionList'
        },
        {
            icon: 'support-agent',
            text1: '1 Click customer',
            text2: 'support',
            iconColor: '#607D8B',
            action: 'call',
            phoneNumber: '+919483900777'
        },
        { icon: 'verified', text1: 'Fully Compliant as', text2: 'per Chit Act 1998', iconColor: '#3F51B5' },
        {
            icon: 'groups', text1: 'Chit Plans for', text2: 'everyone', iconColor: '#4CAF50', action: 'navigate',
            targetScreen: 'Enrollment'
        },
    ];

    const customerReviews = [
        {
            id: '1',
            name: 'Prakash ',
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
            review: ' I appreciate the transparency and the constant support from the team.',

            location: 'Bangalore'
        },
    ];

    const ReviewsSection = () => {
        const renderStarRating = (rating) => {
            const stars = [];
            for (let i = 1; i <= 5; i++) {
                stars.push(
                    <Ionicons
                        key={i}
                        name={i <= rating ? "star" : "star-outline"}
                        size={24}
                        color={i <= rating ? "#FFA500" : "#ccc"}
                        style={styles.reviewStar}
                    />
                );
            }
            return <View style={styles.reviewRatingContainer}>{stars}</View>;
        };

        const renderReviewCard = ({ item }) => (
            <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <Text style={styles.reviewName}>{item.name}</Text>
                    <Text style={styles.reviewLocation}>{item.location}</Text>
                    {renderStarRating(item.rating)}
                </View>
                <Text style={styles.reviewText}>{item.review}</Text>
            </View>
        );

        return (
            <View style={styles.reviewsContainer}>
                <Text style={styles.reviewTitle}>What Our Customers Say</Text>
                <FlatList
                    data={customerReviews}
                    renderItem={renderReviewCard}
                    keyExtractor={item => item.id}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 5 }}
                />
            </View>
        );
    };

    if (isLoadingUserData) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <ActivityIndicator size="large" color="#053B90" />
            </SafeAreaView>
        );
    }

    if (!isConnected || !isInternetReachable) {
        return (
            <SafeAreaView style={styles.offlineContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.offlineContent}>
                    <MaterialIcons name="cloud-off" size={80} color="#999" />
                    <Text style={styles.offlineTextTitle}>No Internet Connection</Text>
                    <Text style={styles.offlineTextMessage}>
                        Please check your network settings and try again.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchUserData}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
                <Toast />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#053B90" />
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={handleOpenSideMenu} style={styles.hamburgerIconContainer}>
                    <View style={styles.hamburgerLine} />
                    <View style={styles.hamburgerLine} />
                    <View style={styles.hamburgerLine} />
                </TouchableOpacity>
                <View style={styles.logoAndTitleContainer}>
                    <Image
                        source={Group400}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>My Chits</Text>
                </View>
                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={handleNeedHelp}
                    activeOpacity={0.7}
                    disabled={!isConnected || !isInternetReachable}
                >
                    <Ionicons name="information-circle-outline" size={16} color="#053B90" style={{ marginRight: 5 }} />
                    <Text style={styles.helpText}>Need Help?</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.contentContainer}>
                <View style={styles.skyBlueSection}>
                    {userDataError ? (
                        <Text style={styles.errorTextSmall}>{userDataError}</Text>
                    ) : (
                        <>
                            <View style={styles.welcomeContainer}>
                                <View style={styles.welcomeTextColumn}>
                                    <Text style={styles.welcomeText}>{greeting}!</Text>
                                    <Text style={styles.userNameText}>
                                        {userData.full_name || 'User'}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.onlinePayButton}
                                    onPress={() => navigation.navigate('PayOnline', { userId: userId })}
                                >
                                    <MaterialIcons name="payment" size={16} color="#FFFFFF" />
                                    <Text style={styles.onlinePayButtonText}>Pay Online</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
                <View style={styles.servicesSection}>
                    <Text style={styles.servicesTitle}>Services</Text>
                    <FlatList
                        data={services}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    if (!item.disabled) {
                                        if (item.screen) {
                                            navigation.navigate(item.navigateTo, {
                                                screen: item.screen,
                                                params: {
                                                    userId: userId,
                                                    ...(item.filter && { groupFilter: item.filter })
                                                }
                                            });
                                        } else {
                                            navigation.navigate(item.navigateTo, {
                                                userId: userId,
                                                featureTitle: item.featureTitle || item.title
                                            });
                                        }
                                    }
                                }}
                                style={[
                                    styles.gridItemBox,
                                    { backgroundColor: item.bgColor },
                                    item.disabled && { opacity: 0.6 }
                                ]}
                                disabled={item.disabled}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                                    <MaterialIcons name={item.icon} size={26} color="#fff" />
                                </View>
                                <Text style={styles.serviceTitle}>{item.title}</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={3}
                        scrollEnabled={false}
                        columnWrapperStyle={styles.row}
                    />
                    {/* New Quick Pay Section */}
                    <View style={styles.quickPayContainer}>
                        <TouchableOpacity
                            style={[styles.payButton, styles.duesButton]}
                            onPress={() => navigation.navigate('PayYourDues', { userId: userId })}
                        >
                            <View style={styles.payIconCircle}>
                                <MaterialIcons name="history" size={24} color="#B71C1C" />
                            </View>
                            <View>
                                <Text style={styles.payButtonTitle}>Pay Dues</Text>
                                <Text style={styles.payButtonSub}>Pending Installments</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.payButton, styles.onlineButton]}
                            onPress={() => navigation.navigate('PayOnline', { userId: userId })}
                        >
                            <View style={styles.payIconCircle}>
                                <MaterialIcons name="bolt" size={24} color="#053B90" />
                            </View>
                            <View>
                                <Text style={styles.payButtonTitle}>Pay Online</Text>
                                <Text style={styles.payButtonSub}>Quick Payment</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.blueContainer}>
                        <TouchableOpacity
                            style={styles.blueGridItem}
                            onPress={() => navigation.navigate('RewardsScreen', { userId: userId, featureTitle: 'Rewards' })}
                        >
                            <View style={styles.iconCircleBlue}>
                                <MaterialIcons name="emoji-events" size={30} color="#053B90" />
                            </View>
                            <Text style={styles.blueGridItemText}>Rewards</Text>
                        </TouchableOpacity>
                        {/* MODIFICATION: Offers onPress changed to an empty function */}
                        <TouchableOpacity
                            style={styles.blueGridItem}
                            onPress={() => console.log('Offers button disabled by user request.')}
                        >
                            <View style={styles.iconCircleBlue}>
                                <MaterialIcons name="local-offer" size={30} color="#053B90" />
                            </View>
                            <Text style={styles.blueGridItemText}>Offers</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.blueGridItem}
                            onPress={() => navigation.navigate('EligibilityScreen', { userId: userId, featureTitle: 'Eligibility' })}
                        >
                            <View style={styles.iconCircleBlue}>
                                <MaterialIcons name="check-circle" size={30} color="#053B90" />
                            </View>
                            <Text style={styles.blueGridItemText}>Eligibility</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.blueGridItem}
                            onPress={() => navigation.navigate('MoreInformation', { userId: userId, featureTitle: 'More Features' })}
                        >
                            <View style={styles.iconCircleBlue}>
                                <MaterialIcons name="more-horiz" size={30} color="#053B90" />
                            </View>
                            <Text style={styles.blueGridItemText}>More</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bottomContainer}>
                        {/* START OF MODIFICATION: Swapped My Passbook with My Profile for the bottom grid */}
                        <TouchableOpacity
                            style={styles.bottomGridItem}
                            onPress={() => navigation.navigate('ProfileScreen', { userId: userId })}
                        >
                            <View style={styles.bottomIcon}>
                                <MaterialIcons name="event-note" size={34} color="#053B90" />
                            </View>
                            <Text style={styles.bottomServiceTitle}> My </Text>
                            <Text style={styles.bottomServiceTitle}>  Profile</Text>
                        </TouchableOpacity>
                        {/* END OF MODIFICATION */}
                        <TouchableOpacity
                            style={styles.bottomGridItem}
                            onPress={() => navigation.navigate('MoreInformation', { userId: userId, featureTitle: 'More Information' })}
                        >
                            <View style={styles.bottomIcon}>
                                <MaterialIcons name="more" size={34} color="#053B90" />
                            </View>
                            <Text style={styles.bottomServiceTitle}>More Information</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.bottomGridItem}
                            onPress={() => navigation.navigate('Insurance', { userId: userId })}
                        >
                            <View style={styles.bottomIcon}>
                                <MaterialIcons name="health-and-safety" size={34} color="#053B90" />
                            </View>
                            <Text style={styles.bottomServiceTitle}>My Insurance</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.bottomGridItem}
                            onPress={() => navigation.navigate('Becomeanagent', { userId: userId })}
                        >
                            <View style={styles.bottomIcon}>
                                <MaterialCommunityIcons name="account-tie" size={34} color="#053B90" />
                            </View>
                            <Text style={styles.bottomServiceTitle}>Become an Agent</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.benefitsSection}>
                        <Text style={styles.benefitsTitle}>Why Choose MyChits?</Text>
                        <View style={styles.benefitItem}>
                            <View style={[styles.benefitIconCircle, { backgroundColor: '#FFEDEE' }]}>
                                <MaterialIcons name="touch-app" size={28} color="#D32F2F" />
                            </View>
                            <View style={styles.benefitTextContent}>
                                <Text style={styles.benefitHeading}>Easy Accessibility</Text>
                                <Text style={styles.benefitDescription}>
                                    Use our online presence and companion mobile app to keep track of your chits anytime, anywhere.
                                </Text>
                            </View>
                        </View>
                        <View style={styles.benefitItem}>
                            <View style={[styles.benefitIconCircle, { backgroundColor: '#E1F5FE' }]}>
                                <MaterialIcons name="currency-rupee" size={28} color="#1565C0" />
                            </View>
                            <View style={styles.benefitTextContent}>
                                <Text style={styles.benefitHeading}>Large Choice of Chits</Text>
                                <Text style={styles.benefitDescription}>
                                    From ₹50,000 to ₹1 Crore, our subscriber-friendly plans are designed to suit your financial goals.
                                </Text>
                            </View>
                        </View>
                        <View style={styles.benefitItem}>
                            <View style={[styles.benefitIconCircle, { backgroundColor: '#E8F5E9' }]}>
                                <MaterialIcons name="verified-user" size={28} color="#388E3C" />
                            </View>
                            <View style={styles.benefitTextContent}>
                                <Text style={styles.benefitHeading}>Most Trusted</Text>
                                <Text style={styles.benefitDescription}>
                                    MY CHITS has been trusted since 1998, operating as a safest registered chits company.
                                </Text>
                            </View>
                        </View>
                        <ReviewsSection />
                        <View style={styles.advantagesBox}>
                            <Text style={styles.advantagesHeadline}>Advantages of MyChits</Text>
                            <View style={styles.advantagesGrid}>
                                {mychitsAdvantages.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.advantageItem}
                                        onPress={() => {
                                            if (item.action === 'call' && item.phoneNumber) {
                                                handleCustomerSupportCall(item.phoneNumber);
                                            } else if (item.action === 'navigate' && item.targetScreen) {
                                                navigation.navigate(item.targetScreen);
                                            }
                                        }}
                                    >
                                        <View style={[styles.advantageIconContainer, { borderColor: '#FFFFFF' }]}>
                                            <MaterialIcons name={item.icon} size={30} color={item.iconColor} />
                                        </View>
                                        <Text style={styles.advantageText1}>{item.text1}</Text>
                                        <Text style={styles.advantageText2}>{item.text2}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.viewLicenseLink}
                            onPress={() => navigation.navigate('LicenseAndCertificate')}
                        >
                            <View style={styles.viewLicenseContent}>
                                <MaterialIcons name="link" size={14} color="#053B90" />
                                <Text style={styles.viewLicenseText}>View License and Certificate</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <LinearGradient
                        colors={['#F0F8FF', '#F8F8F8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.appInfoFooter}
                    >
                        <TouchableOpacity
                            onPress={handleWebsiteLink}
                            disabled={!isConnected || !isInternetReachable}
                        >
                            <Text style={styles.appInfoWebsiteLink}>
                                Visit our Website: <Text style={{ fontWeight: 'bold' }}>mychits.co.in</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Social Media Section */}
                        <View style={styles.socialMediaContainer}>
                            <TouchableOpacity onPress={() => openLink('https://www.facebook.com/MyChits')} style={styles.socialIcon} activeOpacity={0.7}>
                                <LinearGradient
                                    colors={['#3b5998', '#4267B2']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.gradientIcon}
                                >
                                    <FontAwesome name="facebook" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => openLink('https://www.instagram.com/my_chits/')} style={styles.socialIcon} activeOpacity={0.7}>
                                <LinearGradient
                                    colors={['#833AB4', '#C13584', '#FD1D1D', '#F56040', '#FFDC80']}
                                    start={{ x: 0.0, y: 1.0 }}
                                    end={{ x: 1.0, y: 0.0 }}
                                    style={styles.gradientIcon}
                                >
                                    <FontAwesome name="instagram" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleWhatsAppPress} style={styles.socialIcon} activeOpacity={0.7}>
                                <LinearGradient
                                    colors={['#25D366', '#128C7E']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.gradientIcon}
                                >
                                    <FontAwesome name="whatsapp" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.madeWithLoveContainer}>
                            <Text style={styles.appInfoMadeWithLove}>
                                Made with <Text style={{ color: '#E53935' }}>❤️</Text> in India
                            </Text>
                            <MaterialIcons name="public" size={16} color="#4CAF50" style={styles.madeInIndiaIcon} />
                        </View>
                    </LinearGradient>
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isHelpModalVisible}
                onRequestClose={() => {
                    setHelpModalVisible(!isHelpModalVisible);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setHelpModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>How can we help?</Text>
                            <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#585858" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {menuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={`help-item-${index}`}
                                    style={styles.modalMenuItem}
                                    onPress={() => handleMenuItemPress(item)}
                                >
                                    <View style={styles.modalMenuItemLeft}>
                                        {item.icon === "whatsapp" ? (
                                            <Ionicons name="logo-whatsapp" size={24} color="#053B90" />
                                        ) : (
                                            <MaterialIcons name={item.icon} size={24} color="#053B90" />
                                        )}
                                        <Text style={styles.modalMenuText}>{item.title}</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color="#585858" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.modalCallSection}>
                            <Text style={styles.modalCallText}>
                                Still need help? Give us a call.
                            </Text>
                            <TouchableOpacity
                                style={styles.modalCallButton}
                                onPress={handleCallUs}
                            >
                                <MaterialIcons name="phone" size={20} color="#fff" style={styles.modalCallIcon} />
                                <Text style={styles.modalCallButtonText}>Call Us Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {isSideMenuVisible && (
                <TouchableOpacity
                    style={styles.modalOverlaySideMenu}
                    activeOpacity={1}
                    onPress={closeSideMenu}
                >
                    <Animated.View
                        style={[
                            styles.sideMenuContent,
                            { transform: [{ translateX: slideAnim }] },
                        ]}
                        {...panResponder.panHandlers}
                        onStartShouldSetResponder={() => true}
                    >
                        <TouchableOpacity onPress={closeSideMenu} style={styles.sideMenuCloseButton}>
                            <MaterialIcons name="close" size={24} color="#585858" />
                        </TouchableOpacity>

                        {/* 🔽 Wrap content in a ScrollView */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.sideMenuScrollContent}
                        >
                            {/* Header */}
                            <View style={styles.sideMenuHeader}>
                                <Image
                                    source={Group400}
                                    style={styles.headerImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.headerTextContainer}>
                                    <Text style={styles.sideMenuUserName}>{userData.full_name || 'User'}</Text>
                                    <Text style={styles.sideMenuOnTrackText}>
                                        You're on track, {userData.full_name.split(' ')[0] || 'User'}!
                                    </Text>
                                </View>

                                {/* RM list */}
                                {relationshipManagers.length > 0 && (
                                    <View style={styles.rmListBox}>
                                        {relationshipManagers.map((rm, index) => (
                                            <View key={index} style={styles.relationshipManagerCard}>
                                                <Text style={styles.rmGroupName}>{rm.groupName}</Text>
                                                <View style={styles.managerDetailsRow}>
                                                    <Text style={styles.rmManagerName}>Manager: {rm.name}</Text>
                                                    <Text style={styles.rmPhoneNumberText}> {rm.phoneNumber}</Text>
                                                    <TouchableOpacity
                                                        onPress={() => handleRelationshipManagerCall(rm.phoneNumber)}
                                                        style={styles.inlineCallButton}
                                                    >
                                                        <MaterialIcons name="phone" size={16} color="#053B90" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Menu items */}
                            {sideMenuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={`side-menu-item-${index}`}
                                    style={styles.sideMenuItem}
                                    onPress={() => {
                                        closeSideMenu();
                                        if (item.onPress) {
                                            item.onPress();
                                        } else if (item.link) {
                                            if (item.featureTitle) {
                                                navigation.navigate(item.link, {
                                                    userId: userId,
                                                    featureTitle: item.featureTitle,
                                                });
                                            } else {
                                                navigation.navigate(item.link, {
                                                    userId: userId
                                                });
                                            }
                                        }
                                    }}
                                >
                                    <Ionicons name={item.icon} size={24} color="#333" style={styles.sideMenuIcon} />
                                    <Text style={styles.sideMenuText}>{item.title}</Text>
                                </TouchableOpacity>
                            ))}

                            <View style={styles.sideMenuSeparator} />

                            {/* Sign Out */}
                            <TouchableOpacity style={styles.sideMenuItem} onPress={handleLogout}>
                                <Ionicons name="log-out-outline" size={24} color="red" style={styles.sideMenuIcon} />
                                <Text style={[styles.sideMenuText, { color: 'red' }]}>Sign Out</Text>
                            </TouchableOpacity>

                            {/* Footer */}
                            <View style={styles.sideMenuFooter}>
                                <TouchableOpacity onPress={handleRateApp} disabled={!isConnected || !isInternetReachable}>
                                    <Text style={styles.sideMenuFooterText}>
                                        Love us? Rate the app! <Ionicons name="star" size={16} color="#F7C641" />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </TouchableOpacity>
            )}


            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#053B90' },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, paddingHorizontal: 15, justifyContent: 'space-between', backgroundColor: '#053B90' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 10, marginTop: 10 },
    hamburgerIconContainer: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 10, marginLeft: 7 },
    hamburgerLine: { width: 23, height: 2, backgroundColor: '#fff', borderRadius: 2, marginVertical: 3 },
    helpButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 9, backgroundColor: '#B3E5FC', borderRadius: 15, marginTop: 10 },
    helpText: { color: '#053B90', fontSize: 12 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    mainScrollView: { flex: 1 },
    contentContainer: { overflow: 'hidden', paddingBottom: 85 },
    skyBlueSection: {
        backgroundColor: '#B3E5FC',
        borderRadius: 20,
        marginTop: 15,
        width: '92%',
        alignSelf: 'center',
        padding: 20,
        // Adds a soft depth to the card
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    quickPayContainer: {
        flexDirection: 'row',
        width: '93%',
        justifyContent: 'space-between',
        marginTop: 15,
        marginBottom: 10,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    duesButton: {
        backgroundColor: '#FFEBEE', // Light Red
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    onlineButton: {
        backgroundColor: '#E3F2FD', // Light Blue
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    payIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    payButtonTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
    },
    payButtonSub: {
        fontSize: 8,
        color: '#666',
        marginTop: 1,
    },
    welcomeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    welcomeTextColumn: {
        flex: 1,
    },

    servicesSection: { borderColor: '#053B90', borderWidth: 5, marginTop: 25, backgroundColor: '#FFFFFF', borderRadius: 15, paddingTop: 30, width: '97%', alignSelf: 'center', alignItems: 'center', paddingBottom: 13, borderColor: '#053B90' },
    servicesTitle: { position: 'absolute', top: -20, alignSelf: 'center', backgroundColor: '#d9dbb6ff', width: 230, height: 40, borderRadius: 11, textAlign: 'center', textAlignVertical: 'center', color: '#053B90', fontWeight: '900', fontSize: 20, lineHeight: 22, textTransform: 'capitalize', borderWidth: 1, borderColor: '#053B90' },
    gridItemBox: { width: '27%', alignItems: 'center', marginBottom: 8, paddingVertical: 8, paddingHorizontal: 5, borderRadius: 12, marginHorizontal: 5.8, marginLeft: 14, borderWidth: 3, borderColor: '#ddd' },
    iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: -2 },
    serviceTitle: { fontSize: 10, textAlign: 'center', fontWeight: '800', color: '#000', marginTop: 1 },
    blueContainer: { backgroundColor: '#053B90', borderRadius: 10, marginTop: 5, paddingVertical: 8, paddingHorizontal: 3, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', width: '93%' },
    blueGridItem: { width: '20%', alignItems: 'center', marginBottom: 1, borderRadius: 8, paddingVertical: 5, marginHorizontal: 2 },
    iconCircleBlue: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#B3E5FC', justifyContent: 'center', alignItems: 'center', marginBottom: -2 },
    blueGridItemText: { marginTop: 2, fontSize: 10, color: '#fff', textAlign: 'center', fontWeight: '600' },
    bottomContainer: { marginTop: -1, paddingVertical: 12, paddingHorizontal: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', width: '102%', alignSelf: 'center' },
    bottomGridItem: { width: '22%', alignItems: 'center', marginBottom: 10, paddingHorizontal: 8, justifyContent: 'center', borderWidth: 1, borderRadius: 12, borderColor: '#ddd' },
    bottomIcon: { justifyContent: 'center', alignItems: 'center', marginBottom: 0 },
    bottomServiceTitle: { marginTop: -2, fontSize: 10, color: '#000', textAlign: 'center', fontWeight: '600' },
    sideMenuScrollContent: {
        paddingBottom: 30, // avoid cut-off at bottom
    },
    welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#053B90', marginBottom: 0, textAlign: 'left', marginLeft: 15 },
    userNameText: { fontSize: 19, fontWeight: '600', color: '#053B90', textAlign: 'left', marginTop: 4, marginLeft: 15 },
    errorTextSmall: { fontSize: 12, color: 'red', textAlign: 'center' },
    offlineContainer: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
    offlineContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    offlineTextTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 15, textAlign: 'center' },
    offlineTextMessage: { fontSize: 16, color: '#666', marginTop: 10, textAlign: 'center', lineHeight: 22 },
    retryButton: { marginTop: 30, backgroundColor: '#053B90', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(12,12,12,0.6)' },
    modalContent: { width: '97%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingBottom: 0, shadowColor: 'transparent', elevation: 0 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A237E' },
    logoAndTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Takes up available space
        marginLeft: 55,
        marginTop: 10,
    },
    // New style for the header image
    headerLogo: {
        width: 30,
        height: 30,
    },
    // Updated headerTitle (removed marginLeft)
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 8, // Small gap between logo and text
    },
    socialMediaContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 15,
    },
    socialIcon: {
        marginHorizontal: 10,
    },
    gradientIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    modalMenuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', backgroundColor: 'transparent' },
    modalMenuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    modalMenuText: { fontSize: 17, color: '#424242', marginLeft: 20, fontWeight: '500' },
    modalCallSection: { marginTop: 30, alignItems: 'center', paddingTop: 20, borderTopColor: '#f0f0f0', marginBottom: 30 },
    modalCallText: { fontSize: 17, color: '#616161', marginBottom: 18, textAlign: 'center' },
    modalCallButton: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 26, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    modalCallIcon: { marginRight: 12 },
    modalCallButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
    modalOverlaySideMenu: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(12,12,12,0.6)',
        zIndex: 10,
    },
    sideMenuContent: {
        width: '80%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderTopRightRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 0,
        shadowColor: '#000',
        elevation: 5,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    sideMenuCloseButton: {
        position: 'absolute',
        right: 20,
        top: 50,
        zIndex: 1,
        backgroundColor: '#c9d2daff',   // white background
        borderRadius: 20,          // makes it circular
        padding: 8,                // space around the icon
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        elevation: 5,              // shadow for Android
    },
    sideMenuHeader: {
        width: '100%',
        backgroundColor: '#7cc4eeff',
        borderTopRightRadius: 30,
        paddingHorizontal: 25,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
        paddingTop: 30,
        paddingBottom: 20
    },
    onlinePayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#109c3a',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        // High elevation makes it look "clickable"
        elevation: 8,
        shadowColor: '#053B90',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    onlinePayButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#053B90',
        opacity: 0.8
    },
    userNameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#053B90',
        marginTop: 2
    },
    headerImage: {
        width: 50,
        height: 50,
        alignSelf: 'center',
        marginTop: 50, // increase value to move further down
    },
    sideMenuUserName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        textAlign: 'center', // centers text
    },
    sideMenuOnTrackText: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'center', // centers text
    },
    rmListBox: {
        backgroundColor: '#FFECB3',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFD54F',
        marginTop: 15,
        marginBottom: 5,
        marginHorizontal: 15,
        padding: 5,
        width: '100%',
        alignSelf: 'center',
    },
    rmListScrollView: {
        maxHeight: 300,
        paddingHorizontal: 5,
    },
    relationshipManagerCard: {
        flexDirection: 'column',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
        marginBottom: 4,

        alignSelf: 'center',
        width: '100%',
    },
    rmGroupName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: -2,
    },
    managerDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    rmManagerName: {
        fontSize: 14,
        color: '#555',
        fontWeight: 800,
        marginRight: 5,
    },
    rmPhoneNumberText: {
        fontSize: 13,
        color: '#555',
        marginRight: 8,
    },
    inlineCallButton: {
        backgroundColor: '#B3E5FC',
        padding: 5,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        backgroundColor: '#B3E5FC',
        padding: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemsScrollView: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sideMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    sideMenuIcon: {
        marginRight: 20,
        marginLeft: 20,
    },
    sideMenuText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    sideMenuSeparator: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 10,
    },
    sideMenuFooter: {
        paddingVertical: 12,
        paddingBottom: 40, // <--- Add this line to create extra space at the bottom
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    sideMenuFooterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    sideMenuVersionText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    benefitsSection: {
        marginTop: 15,
        paddingTop: 50,
        paddingBottom: 40,
        paddingHorizontal: 25,
        width: '99%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 18,
        position: 'relative',
        overflow: 'visible'
    },
    benefitsTitle: { position: 'absolute', top: -20, left: '60%', transform: [{ translateX: -150 }], backgroundColor: '#053B90', width: 300, height: 55, borderRadius: 30, textAlign: 'center', textAlignVertical: 'center', color: 'white', fontWeight: '900', fontSize: 16, lineHeight: 22, textTransform: 'uppercase', letterSpacing: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 12, zIndex: 10, borderWidth: 2, borderColor: '#F8F9FA' },
    benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 12, backgroundColor: '#F8F9FA', borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 6, borderWidth: 1, borderColor: '#EFEFEF' },
    benefitIconCircle: { width: 45, height: 45, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', marginRight: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
    benefitTextContent: { flex: 1 },
    benefitHeading: { fontSize: 15, fontWeight: 'bold', color: '#212121', marginBottom: 6 },
    benefitDescription: { fontSize: 10, color: '#424242', lineHeight: 16 },
    viewLicenseLink: { alignSelf: 'flex-start', marginTop: 15, paddingVertical: 5, marginLeft: 20, },
    viewLicenseContent: { flexDirection: 'row', alignItems: 'center', marginLeft: 13 },
    viewLicenseText: { color: '#053B90', fontSize: 16, fontWeight: '600', textDecorationLine: 'underline', marginLeft: 5 },
    appInfoFooter: {
        alignItems: 'center',
        marginTop: -15,
        marginBottom: 30,
        paddingVertical: 25,
        paddingHorizontal: 25,
        width: '85%',
        alignSelf: 'center',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 18,
        overflow: 'hidden'
    },
    appInfoWebsiteLink: { fontSize: 17, color: '#004', textDecorationLine: 'underline', marginBottom: 8, textAlign: 'center', fontWeight: '500', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.05)', textShadowOffset: { width: 0.5, height: 0.5 }, textShadowRadius: 1 },
    madeWithLoveContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'center' },
    appInfoMadeWithLove: { fontSize: 15, color: '#4A4A4A', fontStyle: 'normal', fontWeight: 'normal', letterSpacing: 0.3 },
    madeInIndiaIcon: { marginLeft: 8 },
    advantagesHeadline: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#053B90',
        marginBottom: 15,
        textAlign: 'center',
        marginTop: 20,
    },
    advantagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginBottom: 5,
    },
    advantageItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 10,
        paddingHorizontal: 5,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        elevation: 3,
    },
    advantageIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 25,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    advantageText1: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    advantageText2: {
        fontSize: 9,
        textAlign: 'center',
        color: '#555',
    },
    reviewsContainer: {
        marginTop: 20,
        paddingVertical: 15,
        width: '97%',
        alignSelf: 'center',
    },
    reviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#053B90',
        marginBottom: 15,
        textAlign: 'center',
    },
    reviewCard: {
        backgroundColor: '#E3F2FD',
        borderRadius: 15,
        padding: 15,
        marginHorizontal: 10,
        width: 250,
        borderWidth: 1,
        borderColor: '#B3E5FC',
    },
    reviewHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1A237E',
        textAlign: 'center',
    },
    reviewLocation: {
        fontSize: 13,
        color: '#555',
        marginBottom: 5,
        textAlign: 'center',
    },
    reviewRatingContainer: {
        flexDirection: 'row',
    },
    reviewStar: {
        marginHorizontal: 1,
    },
    reviewText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#455A64',
        fontWeight: 600,
        fontStyle: 'italic'
    },
    row: {
        justifyContent: 'space-around',
        paddingHorizontal: 5,
    },
});

export default Home;