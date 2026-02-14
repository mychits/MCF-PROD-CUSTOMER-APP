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
    icon: 'list',
    gradient: ['#667eea', '#764ba2']
  },
  {
    id: 2,
    title: 'Check Eligibility',
    desc: 'Instantly check your eligibility based on your income and credit score.',
    icon: 'checkmark-circle',
    gradient: ['#f093fb', '#f5576c']
  },
  {
    id: 3,
    title: 'Secure Payment',
    desc: 'Pay via our encrypted banking gateway. 100% Safe.',
    icon: 'card',
    gradient: ['#4facfe', '#00f2fe']
  },
  {
    id: 4,
    title: 'E-Sign Agreement',
    desc: 'Securely Enroll the Group.',
    icon: 'document-text',
    gradient: ['#43e97b', '#38f9d7']
  }
];

const growthStats = [
  { id: 1, label: 'In Savings', value: '100 Cr+', icon: 'briefcase', gradient: ['#0F2027', '#203A43', '#2C5364'] },
  { id: 2, label: 'Auction Turnover', value: '50 Cr+', icon: 'chart-line', gradient: ['#134E5E', '#71B280'] },
  { id: 3, label: 'Happy Families', value: '10,000+', icon: 'users', gradient: ['#FC466B', '#3F5EFB'] },
  { id: 4, label: 'Years of Trust', value: '12+', icon: 'calendar-alt', gradient: ['#F857A6', '#FF5858'] },
  { id: 5, label: 'Physical Branches', value: '2+', icon: 'map-marker-alt', gradient: ['#A770EF', '#CF8BF3', '#FDB99B'] },
  { id: 6, label: 'Application Users', value: '500+', icon: 'mobile-alt', gradient: ['#4E54C8', '#8F94FB'] },
];

const customerReviews = [
  {
    id: '1', name: 'Prakash', rating: 5, verified: true,
    review: 'Great service! The app is easy to use, and I got my money on time.',
    location: 'Bangalore',
    avatar: '👨‍💼'
  },
  {
    id: '2', name: 'Geetha Kumari', rating: 4, verified: true,
    review: 'Very transparent and trustworthy. The team is always available to help.',
    location: 'Chamarajanagr',
    avatar: '👩‍💼'
  },
  {
    id: '3', name: 'Ravi Kumar', rating: 5, verified: true,
    review: 'A good app for managing my investments. The interface is easy to understand.',
    location: 'Bangalore',
    avatar: '👨'
  },
  {
    id: '4', name: 'Nisha Singh', rating: 4, verified: true,
    review: 'The best chit fund experience I have had. Secure, simple, and transparent.',
    location: 'Davanagere',
    avatar: '👩'
  },
  {
    id: '5', name: 'Raja Reddy', rating: 5, verified: true,
    review: 'I was not sure at first, but good service and clear papers made me trust this app.',
    location: 'Mysore',
    avatar: '🧑'
  },
];

const mychitsAdvantages = [
  {
    icon: 'lock-clock', text1: 'Join a Chit', text2: 'in Minutes', gradient: ['#FF6B6B', '#FFE66D'], action: 'navigate', targetScreen: 'Enrollment'
  },
  {
    icon: 'gavel', text1: 'In app', text2: 'Auctions', gradient: ['#4ECDC4', '#44A08D'], action: 'navigate', targetScreen: 'AuctionList'
  },
  {
    icon: 'verified-user', text1: '100%', text2: 'Secure Data', gradient: ['#00B4DB', '#0083B0']
  },
  {
    icon: 'support-agent', text1: '24/7 Customer', text2: 'support', gradient: ['#F2709C', '#FF9472'], action: 'call', phoneNumber: '+919483900777'
  },
  { icon: 'gavel', text1: 'Compliant as', text2: 'per Chit Act', gradient: ['#667eea', '#764ba2'] },
  {
    icon: 'groups', text1: 'Chit Plans for', text2: 'everyone', gradient: ['#56ab2f', '#a8e063'], action: 'navigate', targetScreen: 'Enrollment'
  },
];

// --- ANIMATED PARTICLES ---
const FloatingParticle = ({ delay = 0, size = 4, color = '#FFF', duration = 8000 }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -height,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 100,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: duration * 0.2,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.3,
            delay: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        translateY.setValue(0);
        translateX.setValue(0);
        opacity.setValue(0);
        animate();
      });
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          backgroundColor: color,
          opacity: opacity,
          transform: [{ translateY }, { translateX }],
          left: Math.random() * width,
          bottom: 0,
        },
      ]}
    />
  );
};

const ReviewsSection = () => {
  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= rating ? "star" : "star-outline"} 
          size={16} 
          color={i <= rating ? "#FFD700" : "#DDD"} 
          style={{ marginRight: 2 }} 
        />
      );
    }
    return <View style={{ flexDirection: 'row', marginTop: 6 }}>{stars}</View>;
  };

  const renderReviewCard = ({ item }) => (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FA']}
      style={styles.reviewCard}
    >
      <View style={styles.reviewerInfo}>
        <View style={styles.reviewAvatarEmoji}>
          <Text style={{ fontSize: 28 }}>{item.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.reviewName}>{item.name}</Text>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              </View>
            )}
          </View>
          <Text style={styles.reviewLocation}>
            <Ionicons name="location" size={11} color="#9CA3AF" /> {item.location}
          </Text>
          {renderStarRating(item.rating)}
        </View>
      </View>
      <Text style={styles.reviewText}>"{item.review}"</Text>
      <View style={styles.reviewDecorLine} />
    </LinearGradient>
  );

  return (
    <View style={styles.reviewsContainer}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>What Our Users Say</Text>
          <Text style={styles.sectionSubtitle}>Trusted by 10,000+ families across India</Text>
        </View>
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="arrow-forward" size={16} color="#667eea" />
        </TouchableOpacity>
      </View>
      <FlatList 
        data={customerReviews} 
        renderItem={renderReviewCard} 
        keyExtractor={item => item.id} 
        horizontal={true} 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }} 
      />
    </View>
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
    if (item.action === 'call' && item.phoneNumber) { 
      Linking.openURL(`tel:${item.phoneNumber}`); 
    }
    else if (item.action === 'navigate' && item.targetScreen) { 
      navigation.navigate(item.targetScreen); 
    }
  };

  useEffect(() => {
    fetchUserData();
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 7 }).start();
    
    const cardAnims = cardAnimations.map((anim, index) => 
      Animated.spring(anim, { 
        toValue: 1, 
        delay: index * 80, 
        useNativeDriver: true,
        tension: 50,
        friction: 8
      })
    );
    Animated.stagger(80, cardAnims).start();
    
    Animated.loop(Animated.sequence([
      Animated.timing(floatingAnim, { toValue: 1, duration: 2500, useNativeDriver: true }), 
      Animated.timing(floatingAnim, { toValue: 0, duration: 2500, useNativeDriver: true })
    ])).start();
    
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 25000, useNativeDriver: true })).start();
    
    const statsSequence = statsAnims.map((anim, i) => 
      Animated.spring(anim, { 
        toValue: 1, 
        delay: i * 120, 
        useNativeDriver: true,
        tension: 45,
        friction: 7
      })
    );
    Animated.stagger(120, statsSequence).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ])
    ).start();
    
    Animated.timing(progressAnim, { 
      toValue: 25, 
      duration: 2000, 
      delay: 800, 
      useNativeDriver: false 
    }).start();
    
    let currentIndex = 0;
    const interval = setInterval(() => { 
      currentIndex = (currentIndex + 1) % cardData.length; 
      scrollRef.current?.scrollTo({ x: currentIndex * CARD_WIDTH, animated: true }); 
    }, 4500);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    if (userId) {
      try { 
        const response = await axios.get(`${url}/user/get-user-by-id/${userId}`); 
        setUserData(response.data); 
      } catch (error) { 
        console.error('Error:', error); 
      }
    }
  };

  const toggleProfileModal = () => {
    if (isProfileVisible) { 
      Animated.spring(slideAnim, { 
        toValue: height, 
        tension: 40, 
        friction: 8,
        useNativeDriver: true 
      }).start(() => setProfileVisible(false)); 
    }
    else { 
      setProfileVisible(true); 
      Animated.spring(slideAnim, { 
        toValue: 0, 
        tension: 40, 
        friction: 8,
        useNativeDriver: true 
      }).start(); 
    }
  };

  const translateY = floatingAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 25], outputRange: ['0%', '25%'] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E27" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          
          {/* HERO HEADER */}
          <LinearGradient 
            colors={["#0A0E27", "#1a1f3a", "#2d3561"]} 
            style={styles.headerCurve}
          >
            {/* Floating Particles */}
            {[...Array(12)].map((_, i) => (
              <FloatingParticle 
                key={i} 
                delay={i * 800} 
                size={Math.random() * 3 + 2}
                color={i % 2 === 0 ? '#667eea' : '#FFD700'}
                duration={8000 + Math.random() * 4000}
              />
            ))}
            
            <Animated.View style={[styles.bgOrb1, { transform: [{ rotate }] }]} />
            <Animated.View style={[styles.bgOrb2, { transform: [{ rotate }] }]} />
            
            <Animated.View style={[styles.headerRow, { 
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0]
                })
              }]
            }]}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.logoGradientBg}
                >
                  <Image 
                    source={require("../../assets/splash-icon.png")} 
                    style={styles.logoImage} 
                    resizeMode="contain" 
                  />
                </LinearGradient>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.logo}>MyChits</Text>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.regBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="shield-checkmark" size={10} color="#FFF" />
                      <Text style={styles.regBadgeText}>GOVT REG.</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.headerTagText}>India's Trusted Chit Platform</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.iconCircleHeader} 
                onPress={toggleProfileModal}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                  style={styles.profileIconGradient}
                >
                  <Ionicons name="person-outline" size={22} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={[styles.welcomeSection, {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }]}>
              <Text style={styles.welcome}>Welcome Back,</Text>
              <Text style={styles.userName}>{userData.full_name || 'User'} 👋</Text>
              <Text style={styles.subWelcome}>Let's grow your wealth together</Text>
            </Animated.View>
          </LinearGradient>

          {/* FLOATING CARDS */}
          <Animated.View style={[styles.floatingWrapper, { transform: [{ translateY }] }]}>
            <ScrollView 
              ref={scrollRef} 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              snapToInterval={CARD_WIDTH} 
              decelerationRate="fast" 
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {cardData.map((card, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.floatingCard} 
                  onPress={() => setZoomImage(card.image)} 
                  activeOpacity={0.95}
                >
                  <Image source={card.image} style={styles.bgImage} resizeMode="stretch" />
                  <View style={styles.cardGloss} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <View style={styles.contentPadding}>
            
            {/* TRUST INDICATORS */}
            <LinearGradient
              colors={['#FFFFFF', '#F8F9FA']}
              style={styles.trustBarContainer}
            >
              <View style={styles.trustItem}>
                <View style={[styles.trustIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                </View>
                <Text style={styles.trustText}>100% Secure</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <View style={[styles.trustIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <MaterialIcons name="verified-user" size={20} color="#667eea" />
                </View>
                <Text style={styles.trustText}>Govt. Registered</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <View style={[styles.trustIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <FontAwesome5 name="award" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.trustText}>Award Winning</Text>
              </View>
            </LinearGradient>

            {/* COMPLIANCE CARD */}
            <LinearGradient
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.complianceCard}
            >
              <View style={styles.complianceHeaderRow}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.complianceIconCircle}
                >
                  <Ionicons name="document-text" size={22} color="#FFF" />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.complianceTitle}>Fully Licensed & Compliant</Text>
                  <Text style={styles.complianceSubtitle}>Registered under The Chit Funds Act, 1982</Text>
                </View>
              </View>
              
              <View style={styles.complianceRow}>
                <View style={styles.complianceColumn}>
                  <LinearGradient
                    colors={['#F3F4F6', '#E5E7EB']}
                    style={styles.complianceIconBox}
                  >
                    <FontAwesome5 name="landmark" size={26} color="#667eea" />
                  </LinearGradient>
                  <Text style={styles.complianceLabel}>Registered with</Text>
                  <Text style={styles.complianceValue}>Ministry of Corporate Affairs</Text>
                </View>
                
                <View style={styles.complianceDivider} />
                
                <View style={styles.complianceColumn}>
                  <LinearGradient
                    colors={['#F3F4F6', '#E5E7EB']}
                    style={styles.complianceIconBox}
                  >
                    <FontAwesome5 name="certificate" size={26} color="#10B981" />
                  </LinearGradient>
                  <Text style={styles.complianceLabel}>Certified By</Text>
                  <Text style={styles.complianceValue}>Bharti Inclusion Initiative</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.viewLicenseBtn} 
                onPress={() => navigation.navigate('LicenseAndCertificateScreen')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.viewLicenseBtnGradient}
                >
                  <MaterialIcons name="assignment" size={18} color="#FFF" />
                  <Text style={styles.viewLicenseText}>View Licenses & Certificates</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            {/* PARTNERS */}
            <View style={styles.partnersCard}>
              <Text style={styles.partnersTitle}>TRUSTED PAYMENT PARTNERS</Text>
              <View style={styles.partnerLogoBox}>
                <Image 
                  source={require("../../assets/b.png")} 
                  style={styles.partnerLogoImage} 
                  resizeMode="contain" 
                />
              </View>
            </View>

            {/* HOW IT WORKS */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionMainTitle}>How It Works</Text>
                <Text style={styles.sectionSubtitleCenter}>Get started in 4 simple steps</Text>
                <View style={styles.titleUnderline} />
              </View>
              
              <View style={styles.stepsContainer}>
                {joinSteps.map((step, index) => (
                  <Animated.View 
                    key={step.id}
                    style={[
                      styles.stepCard,
                      {
                        opacity: statsAnims[index] || 1,
                        transform: [{
                          scale: statsAnims[index]?.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1]
                          }) || 1
                        }]
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={step.gradient}
                      style={styles.stepIconCircle}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.stepNumber}>{step.id}</Text>
                    </LinearGradient>
                    
                    <View style={styles.stepContent}>
                      <View style={styles.stepTitleRow}>
                        <Ionicons name={step.icon} size={18} color="#667eea" />
                        <Text style={styles.stepTitle}>{step.title}</Text>
                      </View>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                    
                    {index !== joinSteps.length - 1 && (
                      <View style={styles.stepConnector}>
                        <Ionicons name="chevron-down" size={20} color="#E5E7EB" />
                      </View>
                    )}
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* STATS GRID */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionMainTitle}>Our Track Record</Text>
                <Text style={styles.sectionSubtitleCenter}>Numbers that speak for themselves</Text>
                <View style={styles.titleUnderline} />
              </View>
              
              <View style={styles.statsGrid}>
                {growthStats.map((item, index) => (
                  <Animated.View 
                    key={item.id} 
                    style={[
                      styles.statBox,
                      {
                        opacity: statsAnims[index],
                        transform: [{ 
                          scale: statsAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1]
                          })
                        }]
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={item.gradient}
                      style={styles.statGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.statIconBox}>
                        <FontAwesome5 name={item.icon} size={18} color="#FFF" />
                      </View>
                      <Text style={styles.statValue}>{item.value}</Text>
                      <Text style={styles.statLabel}>{item.label}</Text>
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* ADVANTAGES */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionMainTitle}>Why Choose MyChits?</Text>
                <Text style={styles.sectionSubtitleCenter}>Everything you need in one place</Text>
                <View style={styles.titleUnderline} />
              </View>
              
              <View style={styles.advantagesGrid}>
                {mychitsAdvantages.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.advantageBox} 
                    onPress={() => handleAdvantagePress(item)} 
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={item.gradient}
                      style={styles.advantageGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialIcons name={item.icon} size={24} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.advantageTextBold}>{item.text1}</Text>
                    <Text style={styles.advantageTextLight}>{item.text2}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* APPLICATION STATUS */}
            <Animated.View style={[styles.statusCard, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.statusGradientBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statusRow}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.statusIcon}
                  >
                    <Ionicons name="time-outline" size={26} color="#FFF" />
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.statusTitle}>Application Under Review</Text>
                    <Text style={styles.statusSub}>We're verifying your KYC documents</Text>
                  </View>
                </View>
                
                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      style={{ flex: 1, borderRadius: 6 }}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </Animated.View>
                </View>
                
                <Text style={styles.progressText}>25% Complete</Text>
              </LinearGradient>
            </Animated.View>

            {/* REVIEWS */}
            <ReviewsSection />

            {/* HEAD OFFICE */}
            <LinearGradient 
              colors={["#0A0E27", "#1a1f3a"]} 
              style={styles.addressCard}
            >
              <View style={styles.addressHeader}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.locationIconCircle}
                >
                  <Ionicons name="location" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.addressTitle}>Head Office</Text>
              </View>
              
              <Text style={styles.addressText}>
                11/36-25, Third Floor, Kathriguppe Main Road,{'\n'}
                Banashankari Stage 3, Bengaluru - 560085
              </Text>
              
              <View style={styles.contactRow}>
                <TouchableOpacity 
                  style={styles.contactBtn} 
                  onPress={() => Linking.openURL(`tel:+919483900777`)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.contactBtnGradient}
                  >
                    <Ionicons name="call" size={16} color="#FFF" />
                    <Text style={styles.contactBtnText}>Call Us</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.contactBtn} 
                  onPress={() => Linking.openURL('mailto:support@mychits.com')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.contactBtnGradient}
                  >
                    <Ionicons name="mail" size={16} color="#FFF" />
                    <Text style={styles.contactBtnText}>Email Us</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* FOOTER */}
            <View style={styles.appInfoFooter}>
              <TouchableOpacity onPress={handleWebsiteLink} activeOpacity={0.7}>
                <Text style={styles.websiteLink}>
                  Visit: <Text style={styles.websiteLinkBold}>mychits.co.in</Text>
                </Text>
              </TouchableOpacity>
              
              <View style={styles.socialMediaContainer}>
                <TouchableOpacity 
                  onPress={() => openLink('https://www.facebook.com/MyChits')} 
                  activeOpacity={0.8}
                >
                  <LinearGradient 
                    colors={['#3b5998', '#4267B2']} 
                    style={styles.socialIconGradient}
                  >
                    <FontAwesome name="facebook" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => openLink('https://www.instagram.com/my_chits/')} 
                  activeOpacity={0.8}
                >
                  <LinearGradient 
                    colors={['#833AB4', '#C13584', '#E1306C', '#FD1D1D']} 
                    style={styles.socialIconGradient}
                  >
                    <FontAwesome name="instagram" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleWhatsAppPress} 
                  activeOpacity={0.8}
                >
                  <LinearGradient 
                    colors={['#25D366', '#128C7E']} 
                    style={styles.socialIconGradient}
                  >
                    <FontAwesome name="whatsapp" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <View style={styles.madeWithLoveContainer}>
                <Text style={styles.madeWithLove}>Made with </Text>
                <Text style={styles.heartIcon}>❤️</Text>
                <Text style={styles.madeWithLove}> in India</Text>
              </View>
            </View>
            
          </View>
        </ScrollView>

        {/* FIXED CTA BUTTON */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => navigation.navigate('Enrollment')}
          >
            <LinearGradient 
              colors={["#667eea", "#764ba2"]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.fixedButton}
            >
              <Text style={styles.fixedButtonText}>Explore Chit Plans</Text>
              <Ionicons name="arrow-forward-circle" size={24} color="#FFF" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* PROFILE MODAL */}
      <Modal visible={isProfileVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={toggleProfileModal} activeOpacity={1} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>My Profile</Text>
                <Text style={styles.profileName}>{userData.full_name || 'Guest User'}</Text>
              </View>
              <TouchableOpacity onPress={toggleProfileModal} style={styles.modalCloseBtn}>
                <Ionicons name="close-circle" size={32} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <Animated.View style={[styles.statusCard, { transform: [{ scale: pulseAnim }], marginBottom: 20 }]}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.statusGradientBg}
              >
                <View style={styles.statusRow}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.statusIcon}
                  >
                    <Ionicons name="time-outline" size={24} color="#FFF" />
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.statusTitle}>Under Review</Text>
                    <Text style={styles.statusSub}>Verifying your details</Text>
                  </View>
                </View>
                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      style={{ flex: 1, borderRadius: 6 }}
                    />
                  </Animated.View>
                </View>
              </LinearGradient>
            </Animated.View>
            
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={() => { 
                toggleProfileModal(); 
                setAppUser(null); 
                navigation.replace('Login'); 
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.logoutBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="logout" size={22} color="#FFF" />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* IMAGE ZOOM MODAL */}
      <Modal visible={!!zoomImage} transparent={true} animationType="fade">
        <View style={styles.zoomContainer}>
          <TouchableOpacity 
            style={styles.closeZoomBtn} 
            onPress={() => setZoomImage(null)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
              style={styles.closeZoomBtnGradient}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
          <Image source={zoomImage} style={styles.zoomedImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  
  // === HEADER ===
  headerCurve: { 
    paddingTop: 50, 
    paddingHorizontal: 20, 
    paddingBottom: 100, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40, 
    overflow: 'hidden',
    shadowColor: "#000", 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 15,
    position: 'relative'
  },
  
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
  
  bgOrb1: { 
    position: 'absolute', 
    top: -100, 
    right: -80, 
    width: 300, 
    height: 300, 
    borderRadius: 150, 
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  
  bgOrb2: { 
    position: 'absolute', 
    bottom: -150, 
    left: -100, 
    width: 350, 
    height: 350, 
    borderRadius: 175, 
    backgroundColor: 'rgba(118, 75, 162, 0.08)',
  },
  
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    zIndex: 2,
    marginBottom: 30
  },
  
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  
  logoGradientBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  
  logoImage: { 
    width: 40, 
    height: 40 
  },
  
  logo: { 
    fontSize: 28, 
    fontWeight: "900", 
    color: "#FFF", 
    letterSpacing: -0.5
  },
  
  regBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginLeft: 10
  },
  
  regBadgeText: { 
    color: "#FFF", 
    fontSize: 9, 
    fontWeight: "800", 
    marginLeft: 4,
    letterSpacing: 0.5
  },
  
  headerTagText: { 
    color: "#CBD5E1", 
    fontSize: 12, 
    fontWeight: "600", 
    marginTop: 4,
    letterSpacing: 0.3
  },
  
  iconCircleHeader: { 
    borderRadius: 14, 
    overflow: 'hidden'
  },
  
  profileIconGradient: {
    padding: 12,
    borderRadius: 14
  },
  
  welcomeSection: { 
    zIndex: 2 
  },
  
  welcome: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#CBD5E1",
    letterSpacing: 0.3
  },
  
  userName: { 
    fontSize: 32, 
    color: "#FFF", 
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 4
  },
  
  subWelcome: { 
    fontSize: 15, 
    color: "#94A3B8", 
    marginTop: 8,
    fontWeight: "500"
  },

  // === FLOATING CARDS ===
  floatingWrapper: { 
    marginTop: -70, 
    zIndex: 10 
  },
  
  floatingCard: { 
    width: 340, 
    height: 200, 
    marginRight: 18, 
    borderRadius: 24, 
    backgroundColor: '#FFF', 
    elevation: 20, 
    shadowColor: "#667eea", 
    shadowOpacity: 0.3, 
    shadowRadius: 25, 
    shadowOffset: { width: 0, height: 12 }, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)'
  },
  
  bgImage: { 
    width: '100%', 
    height: '100%' 
  },
  
  cardGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },

  // === CONTENT ===
  contentPadding: { 
    paddingHorizontal: 20, 
    marginTop: 30,
    paddingBottom: 40
  },
  
  // === TRUST BAR ===
  trustBarContainer: { 
    flexDirection: 'row', 
    borderRadius: 20, 
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 25, 
    elevation: 8, 
    shadowColor: '#667eea', 
    shadowOpacity: 0.15, 
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }
  },
  
  trustItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  
  trustIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  
  trustText: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 0.3
  },
  
  trustDivider: { 
    width: 1, 
    height: '70%', 
    backgroundColor: '#E5E7EB',
    alignSelf: 'center'
  },
  
  // === COMPLIANCE ===
  complianceCard: { 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 25, 
    elevation: 8, 
    shadowColor: "#667eea", 
    shadowOpacity: 0.12, 
    shadowRadius: 20, 
    shadowOffset: { width: 0, height: 8 }
  },
  
  complianceHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  
  complianceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  
  complianceTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#111827",
    letterSpacing: -0.3
  },
  
  complianceSubtitle: { 
    fontSize: 13, 
    color: '#6B7280', 
    lineHeight: 20,
    fontWeight: "500"
  },
  
  complianceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 20,
    marginBottom: 20
  },
  
  complianceColumn: { 
    flex: 1, 
    alignItems: 'center' 
  },
  
  complianceDivider: { 
    width: 1, 
    height: '80%', 
    backgroundColor: '#E5E7EB' 
  },
  
  complianceIconBox: { 
    width: 72, 
    height: 72, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4
  },
  
  complianceLabel: { 
    fontSize: 11, 
    color: '#9CA3AF', 
    fontWeight: '600', 
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  complianceValue: { 
    fontSize: 12, 
    color: '#1F2937', 
    fontWeight: '800', 
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16
  },
  
  viewLicenseBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10
  },
  
  viewLicenseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  
  viewLicenseText: { 
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: 14, 
    marginLeft: 10,
    marginRight: 10,
    letterSpacing: 0.3
  },
  
  // === PARTNERS ===
  partnersCard: { 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    padding: 25, 
    marginBottom: 30, 
    borderRadius: 20,
    elevation: 6, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 }
  },
  
  partnersTitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#9CA3AF', 
    marginBottom: 20, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  },
  
  partnerLogoBox: { 
    width: '100%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F9FAFB', 
    paddingVertical: 20, 
    borderRadius: 16
  },
  
  partnerLogoImage: { 
    width: 280, 
    height: 50 
  },
  
  // === SECTIONS ===
  sectionBlock: { 
    marginBottom: 35 
  },
  
  sectionHeaderCenter: {
    alignItems: 'center',
    marginBottom: 30
  },
  
  sectionMainTitle: { 
    fontSize: 26, 
    fontWeight: "900", 
    color: '#111827',
    letterSpacing: -0.5,
    textAlign: 'center'
  },
  
  sectionSubtitleCenter: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center'
  },
  
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#667eea',
    borderRadius: 2,
    marginTop: 12
  },
  
  // === STEPS ===
  stepsContainer: {
    paddingHorizontal: 10
  },
  
  stepCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative'
  },
  
  stepIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    left: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  
  stepNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF'
  },
  
  stepContent: {
    marginLeft: 76
  },
  
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
    letterSpacing: -0.3
  },
  
  stepDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500'
  },
  
  stepConnector: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    marginLeft: -10
  },
  
  // === STATS ===
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between'
  },
  
  statBox: { 
    width: '48%', 
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 }
  },
  
  statGradient: {
    padding: 20,
    alignItems: 'center'
  },
  
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  
  statValue: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#FFF',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  
  statLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  // === ADVANTAGES ===
  advantagesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  
  advantageBox: { 
    width: '31%', 
    backgroundColor: '#FFF', 
    borderRadius: 18, 
    padding: 16, 
    alignItems: 'center', 
    marginBottom: 14, 
    elevation: 6, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  
  advantageGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4
  },
  
  advantageTextBold: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#111827', 
    textAlign: 'center',
    letterSpacing: 0.2
  },
  
  advantageTextLight: { 
    fontSize: 11, 
    fontWeight: '500', 
    color: '#6B7280', 
    textAlign: 'center',
    marginTop: 2
  },
  
  // === STATUS ===
  statusCard: { 
    borderRadius: 20, 
    marginBottom: 30, 
    elevation: 10, 
    shadowColor: '#F59E0B', 
    shadowOpacity: 0.25, 
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    overflow: 'hidden'
  },
  
  statusGradientBg: {
    padding: 20
  },
  
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  
  statusIcon: { 
    width: 54, 
    height: 54, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4
  },
  
  statusTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#92400E',
    letterSpacing: -0.3
  },
  
  statusSub: { 
    fontSize: 13, 
    color: '#B45309', 
    marginTop: 4,
    fontWeight: '500'
  },
  
  progressBarTrack: { 
    height: 10, 
    backgroundColor: 'rgba(255,255,255,0.5)', 
    borderRadius: 6, 
    overflow: 'hidden',
    marginBottom: 10
  },
  
  progressBarFill: { 
    height: '100%', 
    borderRadius: 6 
  },
  
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'right'
  },
  
  // === REVIEWS ===
  reviewsContainer: { 
    marginBottom: 35 
  },
  
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 20
  },
  
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: "900", 
    color: "#111827",
    letterSpacing: -0.5
  },
  
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500'
  },
  
  seeAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  
  seeAllText: { 
    color: '#667eea', 
    fontWeight: '700', 
    marginRight: 4,
    fontSize: 13
  },
  
  reviewCard: { 
    width: 290, 
    borderRadius: 20, 
    padding: 20, 
    marginRight: 15,
    elevation: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 }
  },
  
  reviewerInfo: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },
  
  reviewAvatarEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  
  reviewName: { 
    fontWeight: '800', 
    color: '#111827', 
    fontSize: 16,
    letterSpacing: -0.3
  },
  
  verifiedBadge: {
    marginLeft: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 3
  },
  
  reviewLocation: { 
    fontSize: 12, 
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500'
  },
  
  reviewText: { 
    fontSize: 14, 
    color: '#4B5563', 
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500'
  },
  
  reviewDecorLine: {
    width: 40,
    height: 3,
    backgroundColor: '#667eea',
    borderRadius: 2,
    marginTop: 16
  },
  
  // === ADDRESS ===
  addressCard: { 
    borderRadius: 24, 
    padding: 28, 
    marginBottom: 30, 
    elevation: 12, 
    shadowColor: '#667eea', 
    shadowOpacity: 0.3, 
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }
  },
  
  addressHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  
  locationIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6
  },
  
  addressTitle: { 
    fontSize: 22, 
    color: '#FFF', 
    fontWeight: '900',
    letterSpacing: -0.3
  },
  
  addressText: { 
    color: '#CBD5E1', 
    lineHeight: 24, 
    marginBottom: 24, 
    fontSize: 14,
    fontWeight: '500'
  },
  
  contactRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around' 
  },
  
  contactBtn: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden'
  },
  
  contactBtnGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  
  contactBtnText: { 
    color: '#FFF', 
    fontWeight: '700', 
    marginLeft: 8,
    fontSize: 13
  },
  
  // === FOOTER ===
  appInfoFooter: { 
    marginTop: 20, 
    paddingTop: 30, 
    paddingBottom: 30, 
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  
  websiteLink: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginBottom: 25,
    fontWeight: '500'
  },
  
  websiteLinkBold: {
    fontWeight: '800',
    color: '#667eea'
  },
  
  socialMediaContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 25 
  },
  
  socialIconGradient: { 
    width: 52, 
    height: 52, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: 8,
    elevation: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.25, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  
  madeWithLoveContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  madeWithLove: { 
    fontSize: 13, 
    color: '#9CA3AF',
    fontWeight: '500'
  },
  
  heartIcon: {
    fontSize: 14
  },
  
  // === MODALS ===
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'flex-end' 
  },
  
  modalContent: { 
    backgroundColor: '#FFF', 
    padding: 28, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20
  },
  
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  
  modalTitle: { 
    fontSize: 24, 
    fontWeight: "900", 
    color: '#111827',
    letterSpacing: -0.5
  },
  
  profileName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#6B7280', 
    marginTop: 4 
  },
  
  modalCloseBtn: { 
    padding: 4 
  },
  
  logoutBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  
  logoutBtnGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14
  },
  
  logoutText: { 
    marginLeft: 12, 
    fontSize: 16, 
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3
  },
  
  zoomContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.95)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  zoomedImage: { 
    width: width, 
    height: height * 0.75 
  },
  
  closeZoomBtn: { 
    position: 'absolute', 
    top: 50, 
    right: 20, 
    zIndex: 1,
    borderRadius: 12,
    overflow: 'hidden'
  },
  
  closeZoomBtnGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  // === FIXED BUTTON ===
  fixedButtonContainer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(255,255,255,0.98)', 
    paddingHorizontal: 20, 
    paddingVertical: 18, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    shadowColor: '#667eea', 
    shadowOffset: { width: 0, height: -6 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    elevation: 25,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  
  fixedButton: { 
    paddingVertical: 18, 
    borderRadius: 16, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 10, 
    shadowColor: '#667eea', 
    shadowOpacity: 0.4, 
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 }
  },
  
  fixedButtonText: { 
    color: "#FFF", 
    fontSize: 18, 
    fontWeight: "900", 
    letterSpacing: 0.3
  },
});

export default DashboardScreen;