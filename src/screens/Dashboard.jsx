import React, { useEffect, useRef, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Linking,
  Animated,
  StatusBar,
  Image,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import url from "../data/url";
import { ContextProvider } from "../context/UserProvider";

const { width, height } = Dimensions.get("window");

const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/Mychitfund",
  instagram: "https://www.instagram.com/my_chits/",
  youtube: "https://www.youtube.com/@MyChit-z6d",
  whatsapp: "https://wa.me/+919483900777",
};

const joinSteps = [
  {
    id: 1,
    title: 'Select a Chit Plan',
    desc: 'Browse our diverse range of chit plans tailored to your financial goals.',
    icon: 'list'
  },
  {
    id: 2,
    title: 'Check Eligibility',
    desc: 'Instantly check your eligibility based on your income and credit score.',
    icon: 'checkmark-circle'
  },
  {
    id: 3,
    title: 'Secure Payment',
    desc: 'Pay via our encrypted banking gateway. 100% Safe.',
    icon: 'card'
  },
  {
    id: 4,
    title: 'E-Sign Agreement',
    desc: 'Securely Enroll the Group.',
    icon: 'document-text'
  }
];

const growthStats = [
  { id: 1, label: 'In Savings', value: '100 Cr+', icon: 'briefcase', color: '#053B90' },
  { id: 2, label: 'Auction Turnover', value: '50 Cr+', icon: 'chart-line', color: '#00897B' },
  { id: 3, label: 'Happy Families', value: '10,000+', icon: 'users', color: '#FF6F00' },
  { id: 4, label: 'Years of Trust', value: '12+', icon: 'calendar-alt', color: '#C62828' },
  { id: 5, label: 'Physical Branches', value: '2+', icon: 'map-marker-alt', color: '#AD1457' },
  { id: 6, label: 'Application Users', value: '500+', icon: 'mobile-alt', color: '#4527A0' },
];

const customerReviews = [
  {
    id: '1', name: 'Prakash ', rating: 5, verified: true,
    review: 'Great service! The app is easy to use, and I got my money on time.',
    location: 'Bangalore'
  },
  {
    id: '2', name: 'Geetha Kumari', rating: 4, verified: true,
    review: 'Very transparent and trustworthy. The team is always available to help.',
    location: 'Chamarajanagr'
  },
  {
    id: '3', name: 'Ravi Kumar', rating: 5, verified: true,
    review: 'A good app for managing my investments. The interface is easy to understand.',
    location: 'Bangalore'
  },
  {
    id: '4', name: 'Nisha Singh', rating: 4, verified: true,
    review: 'The best chit fund experience I’ve had. Secure, simple, and transparent.',
    location: 'Davanagere'
  },
  {
    id: '5', name: 'Raja Reddy', rating: 5, verified: true,
    review: 'I was not sure at first, but good service and clear papers made me trust this app.',
    location: 'Mysore'
  },
];

const mychitsAdvantages = [
  {
    icon: 'lock-clock', text1: 'Join a Chit ', text2: 'in Minutes', iconColor: '#EF6C00', action: 'navigate', targetScreen: 'Enrollment'
  },
  {
    icon: 'gavel', text1: 'In app ', text2: 'Auctions', iconColor: '#795548', action: 'navigate', targetScreen: 'AuctionList'
  },
  {
    icon: 'verified-user', text1: '100% ', text2: 'Secure Data', iconColor: '#2E7D32' }, 
  {
    icon: 'support-agent', text1: '24/7 Customer', text2: 'support', iconColor: '#607D8B', action: 'call', phoneNumber: '+919483900777'
  },
  { icon: 'gavel', text1: 'Compliant as', text2: 'per Chit Act', iconColor: '#3F51B5' },
  {
    icon: 'groups', text1: 'Chit Plans for', text2: 'everyone', iconColor: '#4CAF50', action: 'navigate', targetScreen: 'Enrollment'
  },
];

// --- COMPONENT: ANIMATED SLANT LINE ---
const SlantLine = ({ delay = 0, color = '#FFF', opacity = 0.05 }) => {
  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    const animate = () => {
      Animated.timing(translateX, {
        toValue: width + 300,
        duration: 4000 + Math.random() * 2000,
        delay: delay,
        useNativeDriver: true,
      }).start(() => {
        translateX.setValue(-300);
        animate();
      });
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.slantLineStyle,
        {
          backgroundColor: color,
          opacity: opacity,
          transform: [{ translateX }, { rotate: '25deg' }],
        },
      ]}
    />
  );
};

const ReviewsSection = () => {
  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={14} color={i <= rating ? "#FFA500" : "#e0e0e0"} style={{ marginRight: 2 }} />);
    }
    return <View style={{ flexDirection: 'row', marginTop: 4 }}>{stars}</View>;
  };

  const renderReviewCard = ({ item }) => (
    <View style={styles.reviewCard}>
      {/* Decorative Quote Background */}
      <FontAwesome name="quote-left" size={100} color="#E3F2FD" style={styles.reviewQuoteBg} />
      
      <View style={styles.reviewerInfo}>
        <View style={[styles.reviewAvatar, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.reviewAvatarText, { color: '#1565C0' }]}>{item.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.reviewName}>{item.name}</Text>
            {item.verified && <FontAwesome name="check-circle" size={12} color="#2E7D32" style={{ marginLeft: 5 }} />}
          </View>
          <Text style={styles.reviewLocation}>{item.location}</Text>
          {renderStarRating(item.rating)}
        </View>
      </View>
      <Text style={styles.reviewText}>{item.review}</Text>
    </View>
  );

  return (
    <View style={styles.reviewsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trusted by 10,000+ Families</Text>
        <TouchableOpacity style={styles.seeAllBtn}><Text style={styles.seeAllText}>See All</Text><Ionicons name="chevron-forward" size={16} color="#053B90" /></TouchableOpacity>
      </View>
      <FlatList data={customerReviews} renderItem={renderReviewCard} keyExtractor={item => item.id} horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 5, paddingRight: 20 }} />
    </View>
  );
};

const SocialBtn = ({ icon, color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true }).start();
  const handlePressOut = () => { Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start(); Linking.openURL(SOCIAL_LINKS[icon]); };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
        <View style={[styles.socialBtn, { backgroundColor: color }]}>
          <FontAwesome5 name={icon} size={20} color="#FFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const DashboardScreen = ({ navigation }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser?.userId;
  const [userData, setUserData] = useState({ full_name: '', email: '', phone: '' });
  const [isProfileVisible, setProfileVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const slideAnim = useRef(new Animated.Value(height)).current;

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current; 
  const progressAnim = useRef(new Animated.Value(0)).current; 
  const statsAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current; 

  const cardData = [
    { image: require("../../assets/1lakh.png") }, { image: require("../../assets/1lakhg.png") }, { image: require("../../assets/1lakhr.png") },
    { image: require("../../assets/2lakhb.png") }, { image: require("../../assets/2lakhg.png") }, { image: require("../../assets/2lakhr.png") },
    { image: require("../../assets/3lakhb.png") }, { image: require("../../assets/3lakhg.png") }, { image: require("../../assets/3lakhr.png") },
    { image: require("../../assets/5lakhb.png") }, { image: require("../../assets/5lakhg.png") }, { image: require("../../assets/5lakhr.png") },
    { image: require("../../assets/10lakhb.png") }, { image: require("../../assets/10lakhg.png") }, { image: require("../../assets/10lakhr.png") },
    { image: require("../../assets/25lakhb.png") }, { image: require("../../assets/25lakhg.png") }, { image: require("../../assets/25lakhr.png") },
  ];

  const scrollRef = useRef(null);
  const CARD_WIDTH = 340 + 18;

  const openLink = (url) => Linking.openURL(url);
  const handleWebsiteLink = () => openLink('https://mychits.co.in');
  const handleWhatsAppPress = () => openLink('https://wa.me/919483900777');

  const handleAdvantagePress = (item) => {
    if (item.action === 'call' && item.phoneNumber) { Linking.openURL(`tel:${item.phoneNumber}`); }
    else if (item.action === 'navigate' && item.targetScreen) { navigation.navigate(item.targetScreen); }
  };

  useEffect(() => {
    fetchUserData();
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true }).start();
    const cardAnims = cardAnimations.map((anim, index) => 
      Animated.spring(anim, { toValue: 1, delay: index * 100, useNativeDriver: true })
    );
    Animated.stagger(100, cardAnims).start();
    Animated.loop(Animated.sequence([
      Animated.timing(floatingAnim, { toValue: 1, duration: 3000, useNativeDriver: true }), 
      Animated.timing(floatingAnim, { toValue: 0, duration: 3000, useNativeDriver: true })
    ])).start();
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 20000, useNativeDriver: true })).start();
    const statsSequence = statsAnims.map((anim, i) => 
      Animated.timing(anim, { toValue: 1, duration: 400, delay: i * 100, useNativeDriver: true })
    );
    Animated.stagger(100, statsSequence).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();
    Animated.timing(progressAnim, { toValue: 25, duration: 1500, delay: 500, useNativeDriver: false }).start();
    let currentIndex = 0;
    const interval = setInterval(() => { currentIndex = (currentIndex + 1) % cardData.length; scrollRef.current?.scrollTo({ x: currentIndex * CARD_WIDTH, animated: true }); }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    if (userId) {
      try { const response = await axios.get(`${url}/user/get-user-by-id/${userId}`); setUserData(response.data); } catch (error) { console.error('Error:', error); }
    }
  };

  const toggleProfileModal = () => {
    if (isProfileVisible) { Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start(() => setProfileVisible(false)); }
    else { setProfileVisible(true); Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(); }
  };

  const translateY = floatingAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 25], outputRange: ['0%', '25%'] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          
          <LinearGradient colors={["#0A2463", "#053B90", "#3E64FF"]} style={styles.headerCurve}>
            <SlantLine delay={0} opacity={0.1} color="#FFFFFF" />
            <SlantLine delay={2000} opacity={0.08} />
            <Animated.View style={[styles.bgCircle1, { transform: [{ rotate }] }]} />
            <Animated.View style={[styles.headerRow, { opacity: headerAnim }]}>
              <View style={styles.logoContainer}>
                <Image source={require("../../assets/splash-icon.png")} style={styles.logoImage} resizeMode="contain" />
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.logo}>MyChits</Text>
                    <View style={styles.regBadge}>
                      <FontAwesome5 name="check-circle" size={10} color="#FFF" />
                      <Text style={styles.regBadgeText}>Govt Registered</Text>
                    </View>
                  </View>
                  <Text style={styles.headerTagText}>Trusted by 10,000+ Families</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.iconCircleHeader} onPress={toggleProfileModal}><Ionicons name="person-outline" size={24} color="#FFF" /></TouchableOpacity>
            </Animated.View>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcome}>Welcome </Text>
              <Text style={styles.userName}>{userData.full_name || 'User'} ! 👋</Text>
              <Text style={styles.subWelcome}>Secure your future with us.</Text>
            </View>
          </LinearGradient>

          <View style={styles.bgBlendOverlay} />
          <Animated.View style={[styles.floatingWrapper, { transform: [{ translateY }] }]}>
            <ScrollView ref={scrollRef} horizontal showsVerticalScrollIndicator={false} snapToInterval={CARD_WIDTH} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 20 }}>
              {cardData.map((card, index) => (
                <TouchableOpacity key={index} style={styles.floatingCard} onPress={() => setZoomImage(card.image)} activeOpacity={0.9}>
                  <Image source={card.image} style={styles.bgImage} resizeMode="stretch" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <View style={styles.contentPadding}>
            
            <View style={styles.trustBarContainer}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={22} color="#2E7D32" />
                <Text style={styles.trustText}>100% Secure</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <FontAwesome5 name="file-contract" size={20} color="#053B90" />
                <Text style={styles.trustText}>Chit Fund Act</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <FontAwesome5 name="university" size={20} color="#FF6F00" />
                <Text style={styles.trustText}>Bank Grade</Text>
              </View>
            </View>

            <View style={styles.complianceCard}>
              <View style={styles.complianceHeaderRow}>
                <Ionicons name="shield-checkmark" size={24} color="#053B90" />
                <Text style={styles.complianceTitle}>Fully Compliant & Registered</Text>
              </View>
              <Text style={styles.complianceSubtitle}>Registered under The Chit Funds Act, 1982. Your investments are legally protected.</Text>
              <View style={styles.complianceRow}>
                <View style={styles.complianceColumn}>
                  <View style={styles.complianceIconBox}>
                    <FontAwesome5 name="landmark" size={30} color="#053B90" />
                  </View>
                  <Text style={styles.complianceLabel}>Registered with</Text>
                  <Text style={styles.complianceValue}>Ministry of Corporate</Text>
                  <Text style={styles.complianceValue}>Affairs (MCA)</Text>
                </View>
                <View style={styles.complianceDivider} />
                <View style={styles.complianceColumn}>
                  <View style={styles.complianceIconBox}>
                    <FontAwesome5 name="hands-helping" size={30} color="#053B90" />
                  </View>
                  <Text style={styles.complianceLabel}>Recognised By</Text>
                  <Text style={styles.complianceValue}>Bharti Inclusion</Text>
                  <Text style={styles.complianceValue}>Initiative</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.viewLicenseBtnExternal} onPress={() => navigation.navigate('LicenseAndCertificateScreen')}>
              <View style={styles.viewLicenseContentRow}>
                <MaterialIcons name="open-in-new" size={20} color="#053B90" />
                <Text style={styles.viewLicenseText}>View Government Licenses & Certificates</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.partnersCard}>
               <Text style={styles.partnersTitle}>Our Banking & Payment Partners</Text>
               <View style={styles.partnerLogoBox}><Image source={require("../../assets/b.png")} style={styles.partnerLogoImage} resizeMode="contain" /></View>
            </View>

            {/* --- SECTION WITH BACKGROUND WASH --- */}
            <View style={[styles.sectionBlock, styles.sectionWithWash]}>
              <View style={styles.headerBlock}><Text style={styles.headerBlockText}>How It Works</Text><View style={styles.blockUnderline} /></View>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineLine} />
                {joinSteps.map((step, index) => (
                  <View key={step.id} style={styles.timelineItem}>
                    <View style={styles.timelineCircleWrapper}>
                      <View style={styles.timelineCircle}>
                        <Text style={styles.timelineNumber}>{step.id}</Text>
                      </View>
                      {index !== joinSteps.length - 1 && <View style={styles.timelineConnector} />}
                    </View>
                    <View style={styles.timelineContentCard}>
                      <View style={styles.timelineIconRow}>
                        <Ionicons name={step.icon} size={20} color="#6200EA" style={{ marginRight: 10 }} />
                        <Text style={styles.timelineTitle}>{step.title}</Text>
                      </View>
                      <Text style={styles.timelineDesc}>{step.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.headerBlock}><Text style={styles.headerBlockText}>Our Track Record</Text><View style={styles.blockUnderline} /></View>
              <View style={styles.statsGrid}>
                {growthStats.map((item, index) => (
                  <Animated.View 
                    key={item.id} 
                    style={[
                      styles.statBoxClean,
                      {
                        opacity: statsAnims[index],
                        transform: [{ scale: statsAnims[index] }],
                        // DYNAMIC STYLING: Colored Backgrounds
                        backgroundColor: item.color + '15', // Adds color to the box
                        borderColor: item.color + '30',    // Adds colored border
                        borderWidth: 1
                      }
                    ]}
                  >
                    <View style={[styles.statIconClean, { backgroundColor: item.color + '25' }]}>
                      <FontAwesome5 name={item.icon} size={14} color={item.color} />
                    </View>
                    <Text style={[styles.statValueClean, { color: item.color }]}>{item.value}</Text>
                    <Text style={styles.statLabelClean}>{item.label}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitleText}>Why Choose MyChits?</Text>
              <View style={styles.advantagesCleanGrid}>
                {mychitsAdvantages.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.advantageCleanBox} onPress={() => handleAdvantagePress(item)} activeOpacity={0.8}>
                    {/* GRADIENT ICON BACKGROUND */}
                    <LinearGradient 
                        colors={[item.iconColor, item.iconColor + '99']} 
                        start={{x:0, y:0}} end={{x:1, y:1}}
                        style={styles.advantageIconBox}
                    >
                       <MaterialIcons name={item.icon} size={22} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.advantageText}>{item.text1} <Text style={{fontWeight:'400'}}>{item.text2}</Text></Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Animated.View style={[styles.statusCleanCard, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.statusRow}>
                <View style={[styles.statusIcon, { backgroundColor: '#FF6F00' }]}><Ionicons name="hourglass-outline" size={24} color="#FFF" /></View>
                <View style={{flex:1, marginLeft: 15}}>
                  <Text style={[styles.statusTitle, { color: '#D84315' }]}>Application Under Review</Text>
                  <Text style={styles.statusSub}>We are verifying your KYC documents.</Text>
                </View>
              </View>
              <View style={styles.progressBarTrack}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: '#FF6F00' }]} />
              </View>
            </Animated.View>

            <ReviewsSection />

            <LinearGradient colors={["#053B90", "#6200EA"]} style={styles.addressCard}>
              <View style={styles.addressHeader}><Ionicons name="location" size={28} color="#FFD700" /><Text style={styles.addressTitle}>Head Office</Text></View>
              <Text style={styles.addressText}>11/36-25, Third Floor, Kathriguppe Main Road, Banashankari Stage 3, Bengaluru - 560085</Text>
              <View style={styles.contactRow}>
                 <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:+919483900777`)}>
                    <Ionicons name="call" size={16} color="#FFF" />
                    <Text style={styles.contactBtnText}>Call Us</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:support@mychits.com')}>
                    <Ionicons name="mail" size={16} color="#FFF" />
                    <Text style={styles.contactBtnText}>Email Us</Text>
                 </TouchableOpacity>
              </View>
            </LinearGradient>

            <LinearGradient colors={['#F0F8FF', '#F8F8F8']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.appInfoFooter}>
                <TouchableOpacity onPress={handleWebsiteLink} activeOpacity={0.7}>
                    <Text style={styles.appInfoWebsiteLink}>
                        Visit our Website: <Text style={{ fontWeight: 'bold', color: '#053B90' }}>mychits.co.in</Text>
                    </Text>
                </TouchableOpacity>
                <View style={styles.socialMediaContainer}>
                    <TouchableOpacity onPress={() => openLink('https://www.facebook.com/MyChits')} style={styles.socialIcon} activeOpacity={0.7}>
                        <LinearGradient colors={['#3b5998', '#4267B2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientIcon}>
                            <FontAwesome name="facebook" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink('https://www.instagram.com/my_chits/')} style={styles.socialIcon} activeOpacity={0.7}>
                        <LinearGradient colors={['#833AB4', '#C13584', '#FD1D1D', '#F56040', '#FFDC80']} start={{ x: 0.0, y: 1.0 }} end={{ x: 1.0, y: 0.0 }} style={styles.gradientIcon}>
                            <FontAwesome name="instagram" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleWhatsAppPress} style={styles.socialIcon} activeOpacity={0.7}>
                        <LinearGradient colors={['#25D366', '#128C7E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientIcon}>
                            <FontAwesome name="whatsapp" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                <View style={styles.madeWithLoveContainer}>
                    <Text style={styles.appInfoMadeWithLove}>Made with <Text style={{ color: '#E53935' }}>❤️</Text> in India</Text>
                    <MaterialIcons name="public" size={16} color="#4CAF50" style={styles.madeInIndiaIcon} />
                </View>
            </LinearGradient>
            
          </View>
        </ScrollView>

        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient colors={["#053B90", "#FF6F00"]} start={[0, 0]} end={[1, 0]} style={styles.fixedButton}>
              <Text style={styles.fixedButtonText}>Explore Chit Plans</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={isProfileVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={toggleProfileModal} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.profileHeaderInfo}>
                <Text style={styles.modalTitle}>My Profile</Text>
                <Text style={styles.profileName}>{userData.full_name || 'Guest User'}</Text>
              </View>
              <TouchableOpacity onPress={toggleProfileModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
             <Animated.View style={[styles.statusCleanCard, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.statusRow}>
                <View style={[styles.statusIcon, { backgroundColor: '#FF6F00' }]}><Ionicons name="hourglass-outline" size={24} color="#FFF" /></View>
                <View style={{flex:1, marginLeft: 15}}>
                  <Text style={[styles.statusTitle, { color: '#D84315' }]}>Application Under Review</Text>
                  <Text style={styles.statusSub}>We are verifying your details.</Text>
                </View>
              </View>
              <View style={styles.progressBarTrack}>
                 <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: '#FF6F00' }]} />
              </View>
            </Animated.View>
            <TouchableOpacity style={styles.menuItem} onPress={() => { toggleProfileModal(); setAppUser(null); navigation.replace('Login'); }}><MaterialIcons name="logout" size={24} color="#FF416C" /><Text style={[styles.menuText, { color: '#FF416C' }]}>Logout</Text></TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!zoomImage} transparent={true} animationType="fade">
        <View style={styles.zoomContainer}><TouchableOpacity style={styles.closeZoomBtn} onPress={() => setZoomImage(null)}><Ionicons name="close-circle" size={35} color="#FFF" /></TouchableOpacity><Image source={zoomImage} style={styles.zoomedImage} resizeMode="contain" /></View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  headerCurve: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 80, borderBottomLeftRadius: 45, borderBottomRightRadius: 45, overflow: 'hidden', shadowColor: "#053B90", shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  bgCircle1: { position: 'absolute', top: -120, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  slantLineStyle: { position: 'absolute', top: 0, bottom: 0, width: 40, zIndex: 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 2 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 50, height: 50, marginRight: 12 },
  logo: { fontSize: 26, fontWeight: "900", color: "#FFF", letterSpacing: 0.5 },
  regBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8, marginTop: 4 },
  regBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "700", marginLeft: 4 },
  headerTagText: { color: "#E3F2FD", fontSize: 11, fontWeight: "600", marginTop: 4, letterSpacing: 0.5 },
  iconCircleHeader: { backgroundColor: "rgba(255,255,255,0.15)", padding: 10, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  welcomeSection: { marginTop: 30, zIndex: 2 },
  welcome: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  userName: { fontSize: 24, color: "#FFF", fontWeight: "800" },
  subWelcome: { fontSize: 14, color: "#E3F2FD", marginTop: 5 },
  bgBlendOverlay: { position: 'absolute', top: 220, left: 0, right: 0, height: 300, backgroundColor: '#E3F2FD', opacity: 0.4, zIndex: -1, borderBottomLeftRadius: 100, borderBottomRightRadius: 100, transform: [{scaleY: 0.8}] },
  floatingWrapper: { marginTop: -60, zIndex: 10 },
  floatingCard: { width: 340, height: 190, marginRight: 18, borderRadius: 20, backgroundColor: '#FFF', elevation: 15, shadowColor: "#053B90", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E0E0' },
  bgImage: { width: '100%', height: '100%' },
  contentPadding: { paddingHorizontal: 20, marginTop: 30, paddingBottom: 40, zIndex: 1 },
  
  // --- TRUST BAR (Glassmorphism) ---
  trustBarContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, paddingVertical: 18, marginBottom: 25, elevation: 6, shadowColor: '#053B90', shadowOpacity: 0.1, shadowRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  trustItem: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  trustText: { fontSize: 12, fontWeight: '800', color: '#333', marginTop: 6, textAlign: 'center' },
  trustDivider: { width: 1, height: '60%', backgroundColor: 'rgba(0,0,0,0.05)' },
  
  // --- COMPLIANCE ---
  complianceCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 25, marginBottom: 25, elevation: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, borderTopWidth: 6, borderTopColor: '#053B90' },
  complianceHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  complianceTitle: { fontSize: 18, fontWeight: "800", color: "#053B90", marginLeft: 12, flex: 1 },
  complianceSubtitle: { fontSize: 13, color: '#666', marginLeft: 36, marginBottom: 25, lineHeight: 20 },
  complianceRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 10 },
  complianceColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  complianceDivider: { width: 1, height: '80%', backgroundColor: '#F0F0F0' },
  complianceIconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  complianceLabel: { fontSize: 11, color: '#888', fontWeight: '600', marginTop: 5 },
  complianceValue: { fontSize: 12, color: '#333', fontWeight: '800', textAlign: 'center' },
  viewLicenseBtnExternal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 0, marginBottom: 30, paddingVertical: 16, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 2, borderColor: '#053B90', elevation: 4, shadowColor: '#053B90', shadowOpacity: 0.15 },
  viewLicenseContentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  viewLicenseText: { color: '#053B90', fontWeight: '800', fontSize: 13, marginLeft: 8 },
  
  // --- PARTNERS ---
  partnersCard: { backgroundColor: '#FFF', alignItems: 'center', padding: 25, marginBottom: 35, borderRadius: 20, borderTopWidth: 6, borderTopColor: '#FF6F00', elevation: 5, shadowColor: '#FF6F00', shadowOpacity: 0.1, shadowRadius: 10 },
  partnersTitle: { fontSize: 12, fontWeight: '700', color: '#555555', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1.5 },
  partnerLogoBox: { width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  partnerLogoImage: { width: 280, height: 50 },
  
  // --- SECTION BLOCKS (WASH) ---
  sectionBlock: { marginBottom: 35 },
  sectionWithWash: {
    backgroundColor: 'rgba(5, 59, 144, 0.03)', // Very faint blue wash
    paddingTop: 20,
    paddingBottom: 10,
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(5, 59, 144, 0.05)'
  },
  headerBlock: { alignItems: 'center', marginBottom: 25 },
  headerBlockText: { fontSize: 22, fontWeight: "900", color: '#1A237E', textTransform: 'uppercase' },
  blockUnderline: { width: 50, height: 5, backgroundColor: '#6200EA', marginTop: 8, borderRadius: 3 },
  timelineContainer: { paddingHorizontal: 10 },
  timelineLine: { position: 'absolute', left: 24, top: 20, bottom: 20, width: 2, backgroundColor: '#E0E0E0', zIndex: 0 },
  timelineItem: { flexDirection: 'row', marginBottom: 25, zIndex: 1 },
  timelineCircleWrapper: { alignItems: 'center', width: 48 },
  timelineCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#6200EA', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#F0F4F8', zIndex: 2, elevation: 3 },
  timelineNumber: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  timelineConnector: { position: 'absolute', top: 34, bottom: -25, width: 2, backgroundColor: '#6200EA' },
  timelineContentCard: { flex: 1, backgroundColor: '#FFF', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  timelineIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timelineTitle: { fontSize: 16, fontWeight: '800', color: '#333' },
  timelineDesc: { fontSize: 13, color: '#666', lineHeight: 20, textAlign: 'justify' },
  
  // --- STATS (Styled Dynamically in JSX) ---
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 2 },
statBoxClean: { 
  width: '31%', 
  borderRadius: 16, 
  paddingVertical: 18, 
  paddingHorizontal: 5, 
  marginBottom: 12, 
  alignItems: 'center',
}
,
  statIconClean: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValueClean: { fontSize: 15, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  statLabelClean: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  
  // --- ADVANTAGES ---
  sectionTitleText: { fontSize: 20, fontWeight: "900", color: "#333", marginBottom: 20, textAlign: 'center' },
  advantagesCleanGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  advantageCleanBox: { width: '31%', backgroundColor: '#FFF', borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 12, elevation: 4, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  advantageIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  advantageText: { fontSize: 11, fontWeight: '700', color: '#444', textAlign: 'center', marginTop: 4, lineHeight: 15 },
  
  // --- STATUS ---
  statusCleanCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 30, elevation: 5, shadowColor: '#FF6F00', shadowOpacity: 0.15, shadowRadius: 10, borderWidth: 1, borderColor: '#FFE0B2', borderLeftWidth: 6, borderLeftColor: '#FF6F00' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statusTitle: { fontSize: 16, fontWeight: '800', color: '#333' },
  statusSub: { fontSize: 13, color: '#666', marginTop: 2 },
  progressBarTrack: { height: 8, backgroundColor: '#FFF3E0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  
  // --- REVIEWS ---
  reviewsContainer: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: "#333" },
  reviewCard: { 
    width: 270, 
    backgroundColor: "#FFF", 
    borderRadius: 20, 
    padding: 20, 
    marginRight: 15, 
    elevation: 6, 
    borderWidth: 1, 
    borderColor: '#F0F0F0', 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 10,
    borderTopWidth: 5,
    borderTopColor: '#2E7D32'
  },
  reviewQuoteBg: { position: 'absolute', top: 10, right: 15, zIndex: 0 },
  reviewerInfo: { flexDirection: 'row', marginBottom: 12, zIndex: 1 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, zIndex: 1 },
  reviewAvatarText: { fontWeight: '800' },
  reviewName: { fontWeight: '800', color: '#333', fontSize: 15 },
  reviewLocation: { fontSize: 11, color: '#888' },
  reviewText: { fontSize: 13, color: '#555', lineHeight: 20, zIndex: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { color: '#053B90', fontWeight: '700', marginRight: 2 },
  
  // --- ADDRESS ---
  addressCard: { borderRadius: 25, padding: 30, marginBottom: 25, elevation: 8, shadowColor: '#6200EA', shadowOpacity: 0.3, shadowRadius: 15 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  addressTitle: { fontSize: 20, color: '#FFF', fontWeight: '900', marginLeft: 12 },
  addressText: { color: '#E8E8E8', lineHeight: 24, marginBottom: 25, fontSize: 14 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-around' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  contactBtnText: { color: '#FFF', fontWeight: '700', marginLeft: 8 },
  
  // --- FOOTER ---
  appInfoFooter: { marginTop: 10, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingTop: 35, paddingBottom: 35, paddingHorizontal: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#FAFAFA' },
  appInfoWebsiteLink: { fontSize: 15, color: '#555', marginBottom: 25, textDecorationLine: 'underline' },
  socialMediaContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25 },
  socialIcon: { marginHorizontal: 10 },
  gradientIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6 },
  madeWithLoveContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  appInfoMadeWithLove: { fontSize: 13, color: '#777', marginRight: 6 },
  madeInIndiaIcon: { marginBottom: 2 },

  socialRow: { flexDirection: 'row', marginTop: 20 },
  socialBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dividerLine: { height: 1, width: '30%', backgroundColor: '#D0D0D0', marginVertical: 15, alignSelf: 'center' },
  madeWithLove: { fontSize: 12, color: '#999', fontWeight: '500', letterSpacing: 0.5, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  profileHeaderInfo: { flex: 1 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: '#333' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 },
  profilePhone: { fontSize: 14, fontWeight: '400', color: '#666', marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  menuText: { marginLeft: 15, fontSize: 16, fontWeight: '700' },
  zoomContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  zoomedImage: { width: width, height: height * 0.7 },
  closeZoomBtn: { position: 'absolute', top: 40, right: 20, zIndex: 1 },
  fixedButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 20, paddingVertical: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#053B90', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 20, zIndex: 1000, borderTopWidth: 1, borderTopColor: '#EEE' },
  fixedButton: { paddingVertical: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#FF6F00', shadowOpacity: 0.3, shadowRadius: 10 },
  fixedButtonText: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", letterSpacing: 0.5 },
});

export default DashboardScreen;