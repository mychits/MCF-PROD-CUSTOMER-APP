import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import the Header component and context
import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";

const RewardsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [rewardPoints, setRewardPoints] = useState(1500);

    // Get user ID from context
    const [appUser] = useContext(ContextProvider);
    const userId = appUser.userId || {};

    const rewards = [
        { id: '1', title: 'Unlock a special chits group!', points: 1000, color: '#3182CE' },
        { id: '2', title: 'Get 5% off your next contribution', points: 2500, color: '#48BB78' },
        { id: '3', title: 'Join a lucky draw', points: 500, color: '#D53F8C' },
        { id: '4', title: 'Gift a friend 100 points', points: 100, color: '#F6AD55' },
    ];

    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                {
                    paddingTop:
                        Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
                },
            ]}
        >
            <StatusBar barStyle="light-content" backgroundColor="#053B90" />
            <Header userId={userId} navigation={navigation} />
            <View style={styles.mainContentArea}>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>My Rewards</Text>
                    </View>
                    <View style={styles.pointsCard}>
                        <MaterialCommunityIcons name="trophy-award" size={32} color="#fcd34d" />
                        <Text style={styles.pointsText}>{rewardPoints}</Text>
                        <Text style={styles.pointsLabel}>Chit Points</Text>
                    </View>

                    <Text style={styles.redeemHeader}>Redeem Rewards</Text>
                    {rewards.map(reward => (
                        <View key={reward.id} style={styles.rewardCard}>
                            <LinearGradient
                                colors={[reward.color, reward.color + 'aa']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.rewardCardContent}
                            >
                                <View style={styles.rewardDetails}>
                                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                                    <Text style={styles.rewardPoints}>{reward.points} Points</Text>
                                </View>
                                <TouchableOpacity style={styles.redeemButton}>
                                    <Text style={styles.redeemButtonText}>Redeem</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#053B90",
    },
    mainContentArea: {
        flex: 1,
        backgroundColor: "#fff",
        marginHorizontal: 10,
        marginBottom: 50,
        borderRadius: 12,
        overflow: "hidden",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 2, // Changed from 20 to 10
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    pointsCard: {
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2, // Changed from 20 to 10
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
    },
    pointsText: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#fcd34d',
    },
    pointsLabel: {
        fontSize: 14,
        color: '#fcd34d',
        marginTop: 4,
    },
    redeemHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    rewardCard: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    rewardCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    rewardDetails: {
        flex: 1,
    },
    rewardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    rewardPoints: {
        fontSize: 14,
        color: '#e5e5e5',
        marginTop: 4,
    },
    redeemButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
    redeemButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default RewardsScreen;