import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform, Dimensions, Alert } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import the Header component and context
// import Header from "../components/layouts/Header"; 
import { ContextProvider } from "../context/UserProvider";

// Get screen width for responsive design
const { width } = Dimensions.get('window');
const PRIMARY_BLUE = "#053B90"; // Defined blue color
const LIGHT_TEXT = "#fff";

const RewardsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [rewardPoints, setRewardPoints] = useState(1500);
    const [activeTab, setActiveTab] = useState('redeem'); // 'redeem' or 'history'

    // Get user ID from context
    const [appUser] = useContext(ContextProvider);
    const userId = appUser.userId || 'GuestUser';

    const rewards = [
        { id: '1', title: 'Unlock a special chits group!', points: 1000, color: '#3182CE' },
        { id: '2', title: 'Get 5% off your next contribution (Voucher)', points: 2500, color: '#48BB78' },
        { id: '3', title: 'Join a lucky draw (Gift entry)', points: 500, color: '#D53F8C' },
        { id: '4', title: 'Gift a friend 100 points', points: 100, color: '#F6AD55' },
    ];

    const pointsActivity = [
        { id: 'a1', description: 'Joined new Chit Group', points: +250, type: 'credit', date: 'Nov 25, 2025' },
        { id: 'a2', description: 'Redeemed: Gift a friend', points: -100, type: 'debit', date: 'Nov 24, 2025' },
        { id: 'a3', description: 'Completed first contribution', points: +500, type: 'credit', date: 'Nov 20, 2025' },
        { id: 'a4', description: 'Daily login bonus', points: +50, type: 'credit', date: 'Nov 19, 2025' },
        { id: 'a5', description: 'Invited a friend', points: +300, type: 'credit', date: 'Nov 15, 2025' },
    ];

    const handleRedeem = (rewardId, pointsCost, rewardTitle) => {
        if (rewardPoints >= pointsCost) {
            // Deduct points
            setRewardPoints(prevPoints => prevPoints - pointsCost);
            
            // Navigate to the details screen for gift/voucher confirmation
            navigation.navigate('RedemptionDetails', {
                rewardTitle: rewardTitle,
                cost: pointsCost,
                // Conceptual data to pass for the next screen
                redemptionCode: `VOUCHER-${rewardId}-${Math.floor(Math.random() * 1000)}`,
                redemptionType: rewardTitle.includes('Voucher') || rewardTitle.includes('off') ? 'Voucher' : 'Gift/Item',
                userId: userId,
            });

        } else {
            Alert.alert('Not Enough Points', 'You do not have enough points to redeem this reward.', [{ text: "OK" }]);
        }
    };

    const renderPointsHistory = () => (
        <View style={styles.historyContainer}>
            <Text style={styles.sectionHeader}>Points History</Text>
            {pointsActivity.map(activity => (
                <View key={activity.id} style={styles.historyItem}>
                    <View style={styles.historyIconWrapper}>
                        <MaterialIcons 
                            name={activity.type === 'credit' ? 'add-circle-outline' : 'remove-circle-outline'} 
                            size={20} 
                            color={activity.type === 'credit' ? '#48BB78' : '#D53F8C'} 
                        />
                    </View>
                    <View style={styles.historyDetails}>
                        <Text style={styles.historyDescription}>{activity.description}</Text>
                        <Text style={styles.historyDate}>{activity.date}</Text>
                    </View>
                    <Text style={[
                        styles.historyPoints, 
                        { color: activity.type === 'credit' ? '#48BB78' : '#D53F8C' }
                    ]}>
                        {activity.type === 'credit' ? '+' : ''}{activity.points}
                    </Text>
                </View>
            ))}
        </View>
    );

    const renderRedeemRewards = () => (
        <View style={styles.redeemContainer}>
            <Text style={styles.sectionHeader}>Available Rewards</Text>
            {rewards.map(reward => (
                <View key={reward.id} style={styles.rewardCardNew}>
                    <LinearGradient
                        colors={[reward.color, reward.color + 'aa']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.rewardCardContentNew}
                    >
                        <View style={styles.rewardDetailsNew}>
                            <Text style={styles.rewardTitleNew}>{reward.title}</Text>
                            <Text style={styles.rewardPointsNew}>
                                <MaterialCommunityIcons name="trophy-award" size={14} color="#fff" /> {reward.points} Points
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.redeemButtonNew}
                            onPress={() => handleRedeem(reward.id, reward.points, reward.title)}
                        >
                            <Text style={styles.redeemButtonTextNew}>Redeem</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Set Status Bar style for dark background */}
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY_BLUE} /> 
            
            {/* --- Stylized Header Area --- */}
            <View style={[styles.customHeader, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : insets.top }]}>
                <View style={styles.profileSection}>
                    <View style={styles.profileAvatar}>
                        {/* Icon color changed to white */}
                        <MaterialCommunityIcons name="account-circle" size={40} color={PRIMARY_BLUE} />
                    </View>
                    <View style={styles.profileText}>
                        {/* Text color changed to white */}
                        <Text style={styles.profileGreeting}>Welcome, Chit User!</Text>
                       
                    </View>
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        {/* Icon color changed to white */}
                        <Feather name="settings" size={24} color={LIGHT_TEXT} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        {/* Icon color changed to white */}
                        <Feather name="bell" size={24} color={LIGHT_TEXT} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                {/* --- Points Card --- */}
                <View style={styles.pointsCardNew}>
                    <View>
                        <Text style={styles.pointsLabelNew}>Total Redeemable Points</Text>
                        <Text style={styles.pointsTextNew}>{rewardPoints}</Text>
                    </View>
                    <TouchableOpacity style={styles.redeemNowButton}>
                        <Text style={styles.redeemNowButtonText}>Redeem Now</Text>
                    </TouchableOpacity>
                </View>
                {/* ------------------------------------------ */}

                {/* --- Tab Selector --- */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'redeem' && styles.activeTab]}
                        onPress={() => setActiveTab('redeem')}
                    >
                        <Text style={[styles.tabText, activeTab === 'redeem' && styles.activeTabText]}>
                            Redeem Rewards
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                            Points History
                        </Text>
                    </TouchableOpacity>
                </View>
                {/* ------------------------------------------ */}
                
                {activeTab === 'redeem' ? renderRedeemRewards() : renderPointsHistory()}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: PRIMARY_BLUE, // Primary blue background
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
        backgroundColor: PRIMARY_BLUE, // Primary blue background
    },
    // --- Custom Header Styles ---
    customHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: PRIMARY_BLUE, // Primary blue background
        // Shadow/Elevation removed as the header blends with the main background
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: LIGHT_TEXT, // White background for the icon container
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: {
        marginLeft: 10,
    },
    profileGreeting: {
        fontSize: 16,
        fontWeight: 'bold',
        color: LIGHT_TEXT, // White text
    },
    profileStatus: {
        fontSize: 12,
        color: '#e0e0e0', // Light grey text
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 15,
    },
    // --- Points Card New Styles (Contrast maintained with white) ---
    pointsCardNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: LIGHT_TEXT, // White card for contrast
        borderRadius: 15,
        padding: 20,
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    pointsLabelNew: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    pointsTextNew: {
        fontSize: 36,
        fontWeight: '900',
        color: PRIMARY_BLUE,
    },
    redeemNowButton: {
        backgroundColor: '#FF6347', // Tomato red for attention
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    redeemNowButtonText: {
        color: LIGHT_TEXT,
        fontWeight: 'bold',
        fontSize: 16,
    },
    // --- Tab Styles (Contrast maintained) ---
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white for contrast
        borderRadius: 10,
        marginBottom: 20,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: LIGHT_TEXT, // White active tab
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: LIGHT_TEXT, // White inactive text
    },
    activeTabText: {
        color: PRIMARY_BLUE, // Blue active text
        fontWeight: 'bold',
    },
    // --- General Section Header ---
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: LIGHT_TEXT, // White header text
        marginBottom: 15,
    },
    rewardCardNew: {
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    rewardCardContentNew: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
    },
    rewardDetailsNew: {
        flex: 1,
    },
    rewardTitleNew: {
        fontSize: 16,
        fontWeight: '600',
        color: LIGHT_TEXT,
    },
    rewardPointsNew: {
        fontSize: 12,
        color: LIGHT_TEXT,
        opacity: 0.9,
        marginTop: 5,
    },
    redeemButtonNew: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 15,
        minWidth: 80,
        alignItems: 'center',
    },
    redeemButtonTextNew: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // --- History Styles (for History tab) (Contrast maintained with white) ---
    historyContainer: {
        paddingVertical: 10,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LIGHT_TEXT, // White item background
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: PRIMARY_BLUE,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    historyIconWrapper: {
        marginRight: 10,
    },
    historyDetails: {
        flex: 1,
    },
    historyDescription: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    historyDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    historyPoints: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RewardsScreen;