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
  ImageBackground,
  StatusBar,
  Image,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
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

// --- REVIEW DATA ---
const customerReviews = [
  { id: '1', name: 'Prakash ', rating: 5, review: 'Great service! The app is easy to use, and I got my money on time.', location: 'Bangalore' },
  { id: '2', name: 'Geetha Kumari', rating: 4, review: 'Very transparent and trustworthy. The team is always available to help.', location: 'Chamarajanagr' },
  { id: '3', name: 'Ravi Kumar', rating: 5, review: 'A good app for managing my investments. The interface is easy to understand.', location: 'Bangalore' },
  { id: '4', name: 'Nisha Singh', rating: 4, review: 'The best chit fund experience I’ve had. Secure, simple, and transparent.', location: 'Davanagere' },
  { id: '5', name: 'Raja Reddy', rating: 5, review: 'The good service and clear papers made me trust this app. Very happy.', location: 'Mysore' },
  { id: '6', name: 'Sangeeta Rao', rating: 4, review: 'The app is good and the people who help customers answer fast.', location: 'Mandya' },
  { id: '7', name: 'Vikram Patel', rating: 5, review: 'The process of joining and managing my chit fund is so simple.', location: 'Bidar' },
  { id: '8', name: 'Anjali Desai', rating: 5, review: 'Excellent app! It’s simple, secure, and I can manage everything from my phone.', location: 'Bangalore' },
  { id: '9', name: 'Mukesh Choudhary', rating: 4, review: 'A reliable and easy-to-use platform. Highly satisfied with my experience.', location: 'Davanagere' },
  { id: '10', name: 'Priya Reddy', rating: 5, review: 'The best way to save money for my future goals. Highly recommended.', location: 'Bangalore' },
  { id: '11', name: 'Suresh Kumar', rating: 5, review: 'I love how easy it is to track my chit progress and auction status. Great job!', location: 'Mandya' },
  { id: '12', name: 'Kavita Singh', rating: 4, review: 'A very good overall experience with the team.', location: 'Bangalore' },
  { id: '13', name: 'Rajesh Nair', rating: 5, review: 'Superb platform for my savings needs. The app is fast and reliable.', location: 'Mysore' },
  { id: '14', name: 'Sneha Sharma', rating: 4, review: 'I appreciate transparency and constant support from the team.', location: 'Bangalore' },
];

// --- MOVED OUTSIDE DASHBOARDSCREEN TO PREVENT HOOK ERRORS ---
const ToolCard = ({ title, icon, color1, color2, index, onPress, pulseAnim }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
    if (onPress) onPress();
  };

  return (
    <Animated.View style={{ marginRight: 20, transform: [{ scale }] }}>
      <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.9}>
        <LinearGradient
          colors={[color1, color2]}
          style={styles.toolCardNew}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.toolCardBorder} />
          <View style={[styles.toolGlow, { backgroundColor: color1 }]} />
          <View style={[styles.toolGlowRight, { backgroundColor: color2 }]} />
          <View style={styles.toolIconContainerNew}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name={icon} size={26} color="#FFF" />
            </Animated.View>
          </View>
          <Text style={styles.toolTextNew}>{title}</Text>
          <View style={styles.toolActionIndicator}>
             <Ionicons name="arrow-forward" size={14} color="#FFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
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
          size={14}
          color={i <= rating ? "#FFA500" : "#e0e0e0"}
          style={styles.reviewStar}
        />
      );
    }
    return <View style={styles.reviewRatingContainer}>{stars}</View>;
  };

  const renderReviewCard = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
           <View style={styles.reviewAvatar}>
              <Text style={styles.reviewAvatarText}>{item.name.charAt(0)}</Text>
           </View>
           <View style={{ flex: 1 }}> 
             <Text style={styles.reviewName}>{item.name}</Text>
             <Text style={styles.reviewLocation}>{item.location}</Text>
             {renderStarRating(item.rating)}
           </View>
        </View>
      </View>
      <Text style={styles.reviewText}>{item.review}</Text>
    </View>
  );

  return (
    <View style={styles.reviewsContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
        </View>
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#053B90" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={customerReviews}
        renderItem={renderReviewCard}
        keyExtractor={item => item.id}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 5, paddingRight: 20 }}
      />
    </View>
  );
};

const SocialBtn = ({ icon, color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true }).start();
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    Linking.openURL(SOCIAL_LINKS[icon]);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
        <LinearGradient colors={[color, color + 'DD']} style={styles.socialBtn}>
          <FontAwesome5 name={icon} size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- MAIN COMPONENT ---
const DashboardScreen = ({ navigation }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser?.userId;

  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  const [isProfileVisible, setProfileVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  const toggleProfileModal = () => {
    if (isProfileVisible) {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setProfileVisible(false));
    } else {
      setProfileVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = () => {
    toggleProfileModal();
    setAppUser(null);
    navigation.replace('Login');
  };

  const fetchUserData = async () => {
    if (userId) {
      try {
        const response = await axios.get(`${url}/user/get-user-by-id/${userId}`);
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const MENU_ITEMS = [
    { title: "About Us", icon: "info", link: "About" },
    { title: "Privacy Policy", icon: "privacy-tip", link: "Privacy" },
    { title: "Help", icon: "help-outline", link: "Help" },
    { title: "F&Q", icon: "question-answer", link: "Fq" },
    { title: "Reset Password", icon: "lock-reset", link: "ConformNewPassword" },
  ];

  const scrollX = useRef(new Animated.Value(0)).current;
  const isApproved = false;

  const headerAnim = useRef(new Animated.Value(0)).current;
  // INCREASED TO 8 TO ACCOMMODATE ALL SECTIONS
  const cardAnimations = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const cardData = [
    { image: require("../../assets/1lakh.png"), },
    { image: require("../../assets/1lakhg.png"), gradient: ["#f093fb", "#f5576c"] },
    { image: require("../../assets/1lakhr.png"), gradient: ["#4facfe", "#00f2fe"] },
    { image: require("../../assets/2lakhb.png"), gradient: ["#43e97b", "#38f9d7"] },
    { image: require("../../assets/2lakhg.png"), gradient: ["#fa709a", "#fee140"] },
    { image: require("../../assets/2lakhr.png"), gradient: ["#30cfd0", "#330867"] },
    { image: require("../../assets/3lakhb.png"), gradient: ["#a8edea", "#fed6e3"] },
    { image: require("../../assets/3lakhg.png"), gradient: ["#ff9a56", "#ff6a88"] },
    { image: require("../../assets/3lakhr.png"), gradient: ["#ffecd2", "#fcb69f"] },
    { image: require("../../assets/5lakhb.png"), gradient: ["#667eea", "#764ba2"] },
    { image: require("../../assets/5lakhg.png"), gradient: ["#f093fb", "#f5576c"] },
    { image: require("../../assets/5lakhr.png"), gradient: ["#4facfe", "#00f2fe"] },
    { image: require("../../assets/10lakhb.png"), gradient: ["#43e97b", "#38f9d7"] },
    { image: require("../../assets/10lakhg.png"), gradient: ["#fa709a", "#fee140"] },
    { image: require("../../assets/10lakhr.png"), gradient: ["#30cfd0", "#330867"] },
    { image: require("../../assets/25lakhb.png"), gradient: ["#a8edea", "#fed6e3"] },
    { image: require("../../assets/25lakhg.png"), gradient: ["#ff9a56", "#ff6a88"] },
    { image: require("../../assets/25lakhr.png"), gradient: ["#ffecd2", "#fcb69f"] },
    { image: require("../../assets/50lakhb.png"), gradient: ["#f093fb", "#f5576c"] },
    { image: require("../../assets/50lakhg.png"), gradient: ["#4facfe", "#00f2fe"] },
    { image: require("../../assets/50lakhr.png"), gradient: ["#43e97b", "#38f9d7"] },
  ];

  const scrollRef = useRef(null);
  const CARD_WIDTH = 310;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();

    const cardAnims = cardAnimations.map((anim, index) =>
      Animated.spring(anim, { toValue: 1, delay: index * 100, friction: 7, tension: 50, useNativeDriver: true })
    );
    Animated.stagger(100, cardAnims).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatingAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(Animated.timing(shimmerAnim, { toValue: 1, duration: 2500, useNativeDriver: true })).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % cardData.length;
      scrollRef.current?.scrollTo({ x: currentIndex * CARD_WIDTH, animated: true });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const translateY = floatingAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
          <View>
            <LinearGradient colors={["#053B90", "#0d4ba8", "#1560c0"]} style={styles.headerCurve}>
              <Animated.View style={[styles.bgCircle1, { transform: [{ rotate }] }]} />
              <Animated.View style={[styles.bgCircle2, { transform: [{ rotate }] }]} />

              <Animated.View style={[styles.headerRow, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <View style={[styles.logoContainer, { flex: 1 }]}>
                  <Image
                    source={require("../../assets/splash-icon.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={styles.logo}>MyChits</Text>
                    <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.tagBadge}>
                      <Text style={styles.headerTagText}>TRUSTED PLATFORM</Text>
                    </LinearGradient>
                  </View>
                </View>
                <View style={styles.headerIcons}>
                  <TouchableOpacity style={[styles.iconCircleHeader, { marginRight: 12 }]}>
                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                    <Animated.View style={[styles.notificationDot, { opacity: pulseAnim }]} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconCircleHeader} onPress={toggleProfileModal}>
                    <Ionicons name="person-outline" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View style={[styles.welcomeSection, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <Text style={styles.welcome}>Welcome </Text>
                <Text style={styles.userName}>{userData.full_name || 'User'} ! 👋</Text>
                <Text style={styles.subWelcome}>Let's grow your wealth together</Text>
              </Animated.View>
            </LinearGradient>

            <Animated.View style={[styles.floatingWrapper, { transform: [{ translateY }] }]}>
              <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 5 }}
              >
                {cardData.map((card, index) => (
                  <TouchableOpacity key={index} style={styles.floatingCard} activeOpacity={0.95}>
                    <ImageBackground
                      source={card.image}
                      style={styles.bgImage}
                      resizeMode="cover"
                    >
                      <View style={styles.cardGradient}>
                        <View style={styles.cardTopRow}>
                          {card.popular && (
                            <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.badgePopular}>
                              <Text style={styles.badgeText}>⭐ POPULAR</Text>
                            </LinearGradient>
                          )}
                          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <Ionicons name="star" size={22} color="#FFD700" />
                          </Animated.View>
                        </View>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        <Text style={styles.cardSub}>{card.sub}</Text>
                        <View style={styles.cardFooter}>
                          <TouchableOpacity
                            style={styles.cardBtn}
                            onPress={() => navigation.navigate('Enrollment')}
                          >
                            <Text style={styles.cardBtnText}>View Details</Text>
                            <Ionicons name="arrow-forward" size={14} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>

            <View style={styles.contentPadding}>
              <Animated.View style={{ transform: [{ scale: cardAnimations[0] }] }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Journey</Text>
                  <Ionicons name="trending-up" size={22} color="#053B90" />
                </View>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: cardAnimations[1] }] }}>
                <View style={styles.statusCard}>
                  <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]} />

                  <View style={styles.statusHeader}>
                    <LinearGradient colors={["#FF9800", "#FF5722"]} style={styles.statusIconCircle}>
                      <Ionicons name="hourglass-outline" size={26} color="#FFF" />
                    </LinearGradient>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={styles.statusTitle}>Application Under Review</Text>
                      <View style={styles.statusBadge}>
                        <Animated.View style={[styles.pulseDot, { opacity: glowOpacity }]} />
                        <Text style={styles.statusSubTitle}>Processing in progress</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <LinearGradient colors={["#FF9800", "#FF5722"]} style={styles.progressFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    </View>
                    <Text style={styles.progressText}>20% Complete</Text>
                  </View>

                  <Text style={styles.statusDesc}>
                    Our team is carefully reviewing your application. You'll receive a notification once approved!
                  </Text>

                  <View style={styles.featureGrid}>
                    <View style={styles.featureItem}>
                      <LinearGradient colors={["#E3F2FD", "#BBDEFB"]} style={styles.featureIcon}>
                        <Ionicons name="shield-checkmark" size={24} color="#1976D2" />
                      </LinearGradient>
                      <Text style={styles.featureText}>Secure</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <LinearGradient colors={["#F3E5F5", "#E1BEE7"]} style={styles.featureIcon}>
                        <Ionicons name="flash" size={24} color="#7B1FA2" />
                      </LinearGradient>
                      <Text style={styles.featureText}>Fast</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <LinearGradient colors={["#E8F5E9", "#C8E6C9"]} style={styles.featureIcon}>
                        <Ionicons name="people" size={24} color="#388E3C" />
                      </LinearGradient>
                      <Text style={styles.featureText}>Trusted</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* --- HOW IT WORKS (Index 2) --- */}
              <Animated.View style={{ transform: [{ scale: cardAnimations[2] }] }}>
                <View style={styles.howItWorksCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <Ionicons name="information-circle" size={22} color="#053B90" />
                  </View>

                  {[
                    { step: "1", title: "Choose a Plan", desc: "Select a chit plan that fits your budget" },
                    { step: "2", title: "Complete KYC", desc: "Submit your documents for verification" },
                    { step: "3", title: "Start Saving", desc: "Begin your monthly contributions" },
                    { step: "4", title: "Grow Wealth", desc: "Watch your savings grow over time" },
                  ].map((item, idx) => (
                    <View key={idx} style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{item.step}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{item.title}</Text>
                        <Text style={styles.stepDesc}>{item.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>

              {!isApproved && (
                <Animated.View style={{ transform: [{ scale: cardAnimations[3] }] }}>
                  <View style={styles.afterCard}>
                    <Text style={[styles.sectionTitle, { fontSize: 18, marginBottom: 16, color: '#053B90' }]}>
                      After Approval, You'll Unlock:
                    </Text>
                    {[
                      { icon: "wallet", text: "Access to all premium chit plans" },
                      { icon: "bar-chart", text: "Real-time investment tracking" },
                      { icon: "gift", text: "Exclusive rewards & cashback" },
                      { icon: "headset", text: "Priority customer support" },
                    ].map((item, idx) => (
                      <View key={idx} style={styles.unlockItem}>
                        <View style={styles.unlockIconWrapper}>
                          <Ionicons name={item.icon} size={18} color="#053B90" />
                        </View>
                        <Text style={styles.unlockText}>{item.text}</Text>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}

              <Animated.View style={{ transform: [{ scale: cardAnimations[4] }] }}>
                <TouchableOpacity
                  style={styles.mainCTA}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Enrollment')}
                >
                  <LinearGradient colors={["#053B90", "#1560c0", "#2976d4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
                    <Ionicons name="rocket" size={24} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={styles.mainCTAText}>Explore All Chit Plans</Text>
                    <Ionicons name="arrow-forward" size={22} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: cardAnimations[5] }] }}>
                <View style={styles.toolsSectionWrapper}>
                  <View style={styles.toolsBgBlob} />
                  <View style={[styles.toolsBgBlob, styles.toolsBgBlob2]} />
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <Text style={styles.sectionTitle}>Financial Tools</Text>
                    </View>
                    <TouchableOpacity style={styles.seeAllBtn}>
                      <Text style={styles.seeAllText}>See All</Text>
                      <Ionicons name="chevron-forward" size={16} color="#053B90" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 5, paddingRight: 20, paddingTop: 10, paddingBottom: 5 }}>
                    <ToolCard
                      title="EMI Calculator"
                      icon="calculator"
                      color1="#FF9F1C"
                      color2="#FFBF69"
                      index={0}
                      pulseAnim={pulseAnim}
                      onPress={() => navigation.navigate('EMICalculator')}
                    />
                    <ToolCard title="Savings Tracker" icon="wallet" color1="#3D84A8" color2="#1E6091" index={1} pulseAnim={pulseAnim} />
                    <ToolCard title="Goal Planner" icon="flag" color1="#8338EC" color2="#7209B7" index={2} pulseAnim={pulseAnim} />
                    <ToolCard
                      title="Refer & Earn"
                      icon="share-social"
                      color1="#FF5C8D"
                      color2="#FF3F6C"
                      index={3}
                      pulseAnim={pulseAnim}
                      onPress={() => navigation.navigate('IntroduceNewCustomers')}
                    />
                  </ScrollView>
                </View>
              </Animated.View>

              {/* --- REVIEWS (Index 6) --- */}
              <Animated.View style={{ transform: [{ scale: cardAnimations[6] }] }}>
                 <ReviewsSection />
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: cardAnimations[7] }] }}>
                <LinearGradient colors={["#053B90", "#0d4ba8", "#1560c0"]} style={styles.addressCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.addressHeader}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <View style={styles.locationIconWrapper}>
                        <Ionicons name="location" size={32} color="#FFD700" />
                      </View>
                    </Animated.View>
                    <Text style={styles.addressTitle}>Head Office</Text>
                  </View>
                  <Text style={styles.addressText}>
                    11/36-25, Third Floor, 2nd Main, Kathriguppe Main Road, Banashankari Stage 3, Bengaluru Karnataka - 560085
                  </Text>
                  <View style={styles.divider} />
                  <Text style={styles.connectText}>Let's Connect</Text>
                  <View style={styles.socialRow}>
                    <SocialBtn icon="facebook" color="#3b5998" />
                    <SocialBtn icon="instagram" color="#E1306C" />
                    <SocialBtn icon="youtube" color="#FF0000" />
                    <SocialBtn icon="whatsapp" color="#25D366" />
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isProfileVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleProfileModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={toggleProfileModal}
          />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile</Text>
              <TouchableOpacity onPress={toggleProfileModal}>
                <Ionicons name="close-circle" size={28} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfoContainer}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={40} color="#053B90" />
              </View>
              <Text style={styles.profileName}>{userData.full_name || "Guest User"}</Text>

            </View>

            <View style={styles.modalDivider} />

            <View style={styles.menuContainer}>
              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    toggleProfileModal();
                    navigation.navigate(item.link);
                  }}
                >
                  <View style={styles.menuIconBox}>
                    <MaterialIcons name={item.icon} size={24} color="#053B90" />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.logoutContainer}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LinearGradient colors={["#FF416C", "#FF4B2B"]} style={styles.logoutGradient}>
                  <MaterialIcons name="logout" size={22} color="#FFF" />
                  <Text style={styles.logoutText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerCurve: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 80,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
  },
  bgCircle1: {
    position: 'absolute',
    top: -120,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 10 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 50, height: 50, marginRight: 12 },
  logo: { fontSize: 28, fontWeight: "900", color: "#FFF", letterSpacing: 1.8 },
  tagBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginTop: 5, alignSelf: 'flex-start' },
  headerTagText: { color: "#FFF", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  headerIcons: { flexDirection: 'row' },
  iconCircleHeader: {
    backgroundColor: "rgba(255,255,255,0.18)",
    padding: 11,
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)'
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FF4757',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  welcomeSection: { marginTop: 32, zIndex: 10 },
  welcome: { fontSize: 26, fontWeight: "900", color: "#FFF", letterSpacing: 0.5 },
  userName: { fontSize: 20, fontWeight: "800", color: "#FFF", marginTop: 4 },
  subWelcome: { fontSize: 15, color: "#E8E8E8", marginTop: 6, letterSpacing: 0.3 },
  floatingWrapper: { marginTop: -60, zIndex: 100 },
  floatingCard: {
    width: 340,
    height: 190,
    marginRight: 18,
    borderRadius: 24,
    backgroundColor: 'transparent',
    elevation: 15,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }
  },
  bgImage: {
    flex: 1,
    justifyContent: "flex-end",
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden'
  },
  cardGradient: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgePopular: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  cardTitle: { color: "#FFF", fontSize: 20, fontWeight: "900", marginTop: 6, letterSpacing: 0.3 },
  cardSub: { color: "#E8E8E8", fontSize: 13, marginTop: 5, fontWeight: '500' },
  cardFooter: { marginTop: 14 },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  cardBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginRight: 6 },
  contentPadding: { paddingHorizontal: 20, marginTop: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: "#1A237E", letterSpacing: 0.3 },
  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 26,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  shimmerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: 120, backgroundColor: 'rgba(255,255,255,0.4)' },
  statusHeader: { flexDirection: "row", alignItems: "center" },
  statusIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#FF9800",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  statusTitle: { fontSize: 18, fontWeight: "900", color: "#1A1A1A", letterSpacing: 0.2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  pulseDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF9800', marginRight: 7 },
  statusSubTitle: { fontSize: 13, color: "#FF9800", fontWeight: "700" },
  progressContainer: { marginTop: 24 },
  progressBar: { height: 11, backgroundColor: "#F5F5F5", borderRadius: 6, overflow: "hidden" },
  progressFill: { width: "20%", height: "100%", borderRadius: 6 },
  progressText: { fontSize: 13, color: "#888", marginTop: 10, textAlign: "right", fontWeight: '700' },
  statusDesc: { fontSize: 14, color: "#555", marginTop: 20, lineHeight: 22, fontWeight: '500' },
  featureGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 26 },
  featureItem: { alignItems: "center", flex: 1 },
  featureIcon: { padding: 14, borderRadius: 16, marginBottom: 10 },
  featureText: { fontSize: 13, fontWeight: "800", color: "#444", letterSpacing: 0.2 },
  
  // --- How It Works ---
  howItWorksCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#053B90',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 3,
    shadowColor: "#053B90",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  afterCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#E1E8FF",
    borderStyle: "dashed",
    marginBottom: 6
  },
  unlockItem: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  unlockIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  unlockText: { fontSize: 14, color: "#333", fontWeight: "700", marginLeft: 14, flex: 1 },
  mainCTA: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 18,
    elevation: 8,
    shadowColor: "#053B90",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  ctaGradient: {
    height: 62,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  mainCTAText: { color: "#FFF", fontSize: 18, fontWeight: "900", marginRight: 10, letterSpacing: 0.3 },
  toolsSectionWrapper: { marginBottom: 30, position: 'relative', zIndex: 1 },
  toolsBgBlob: {
    position: 'absolute',
    top: -20,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(5, 59, 144, 0.03)',
    zIndex: -1
  },
  toolsBgBlob2: { top: 50, left: -40, backgroundColor: 'rgba(255, 159, 28, 0.05)' },
  sectionTitleContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#053B90', marginRight: 4 },
  toolCardNew: {
    width: 160,
    height: 130,
    borderRadius: 24,
    justifyContent: 'space-between',
    padding: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  toolCardBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)'
  },
  toolGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.2,
  },
  toolGlowRight: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3,
  },
  toolIconContainerNew: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  toolTextNew: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  toolActionIndicator: {
    alignSelf: 'flex-end',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // --- Review Styles (Fixed) ---
  reviewsContainer: {
    marginBottom: 30,
  },
  reviewCard: {
    width: 280,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  reviewHeader: {
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2 // Slight adjustment to align with top of text
  },
  reviewAvatarText: {
    color: '#053B90',
    fontWeight: '800',
    fontSize: 14
  },
  reviewName: { fontSize: 16, fontWeight: '800', color: '#333' },
  reviewLocation: { fontSize: 12, color: '#888', fontWeight: '600' },
  reviewRatingContainer: {
    flexDirection: 'row',
    marginTop: 4, // Clean spacing from location text
  },
  reviewStar: { 
    marginRight: 2,
  },
  reviewText: { fontSize: 13, color: '#555', lineHeight: 20, fontWeight: '500' },

  addressCard: {
    borderRadius: 30,
    padding: 30,
    marginTop: 18,
    marginBottom: 45,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }
  },
  addressHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  locationIconWrapper: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)'
  },
  addressTitle: { fontSize: 22, fontWeight: "900", color: "#FFF", marginLeft: 14, letterSpacing: 0.3 },
  addressText: { color: "#E8E8E8", lineHeight: 24, fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 24 },
  connectText: { fontSize: 14, color: '#D0D0D0', marginBottom: 16, fontWeight: '700', letterSpacing: 0.5 },
  socialRow: { flexDirection: "row", justifyContent: 'flex-start' },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    height: '90%',
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 }
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1A237E' },
  profileInfoContainer: { alignItems: 'center', marginVertical: 10 },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BBDEFB'
  },
  profileName: { fontSize: 22, fontWeight: '800', color: '#333' },
  profileSub: { fontSize: 14, color: '#777', marginTop: 4, fontWeight: '500' },
  modalDivider: { height: 1, backgroundColor: '#EEE', marginVertical: 20 },
  menuContainer: { marginBottom: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#444' },
  logoutContainer: { marginTop: 10 },
  logoutBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#FF416C",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutText: { color: '#FFF', fontSize: 18, fontWeight: '800', marginLeft: 10 },
});

export default DashboardScreen;