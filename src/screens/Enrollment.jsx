// Enrollment.jsx

import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    StatusBar,
    SafeAreaView,
    Platform,
    Image,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import url from "../data/url";
import axios from "axios";
import Header from "../components/layouts/Header";
import { NetworkContext } from '../context/NetworkProvider';
import Toast from 'react-native-toast-message';
import { ContextProvider } from "../context/UserProvider"

const formatNumberIndianStyle = (num) => {
    if (num === null || num === undefined) {
        return "0";
    }
    const parts = num.toString().split(',');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? ',' + parts[1] : '';
    let isNegative = false;
    if (integerPart.startsWith('-')) {
        isNegative = true;
        integerPart = integerPart.substring(1);
    }
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
        const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        return (isNegative ? '-' : '') + formattedOtherNumbers + ',' + lastThree + decimalPart;
    } else {
        return (isNegative ? '-' : '') + lastThree + decimalPart;
    }
};

const Enrollment = ({ route, navigation }) => {
    const { groupFilter } = route.params;
    const [appUser, setAppUser] = useContext(ContextProvider);
    const userId = appUser.userId || {};
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const [cardsData, setCardsData] = useState([]);

    // Set the initial filter to "NewGroups" by default.
    const initialGroupFilter = "NewGroups";
    const [selectedGroup, setSelectedGroup] = useState(initialGroupFilter);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollmentModalVisible, setEnrollmentModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const { isConnected, isInternetReachable } = useContext(NetworkContext);
    const [moreFiltersModalVisible, setMoreFiltersModalVisible] = useState(false);

    // New states for direct joining - START OF MODIFICATION
    const [isJoining, setIsJoining] = useState(false);
    const [joinGroupId, setJoinGroupId] = useState(null);
    // New states for direct joining - END OF MODIFICATION

    // Provided function for fetching vacant seats for a specific group
    const fetchVacantSeats = async (groupId) => {
        try {
            const ticketsResponse = await axios.post(
                `${url}/enroll/get-next-tickets/${groupId}`
            );
            const fetchedTickets = Array.isArray(
                ticketsResponse.data.availableTickets
            )
                ? ticketsResponse.data.availableTickets
                : [];
            return fetchedTickets.length;
        } catch (err) {
            console.error(`Error fetching tickets for group ${groupId}:`, err);
            return 0;
        }
    };

    const groupColors = {
        new: { primary: '#E0F7FA', secondary: '#00BCD4', text: '#00BCD4', darkText: '#263238', buttonBackground: '#00BCD4', selectedBorder: '#00BCD4', iconColor: '#00BCD4' },
        ongoing: { primary: '#E8F5E9', secondary: '#4CAF50', text: '#4CAF50', darkText: '#263232', buttonBackground: '#4CAF50', selectedBorder: '#4CAF50', iconColor: '#4CAF50' },
        ended: { primary: '#FBE9E7', secondary: '#FF7043', text: '#FF7043', darkText: '#263238', buttonBackground: '#FF7043', selectedBorder: '#FF7043', iconColor: '#FF7043' },
        members_5_value_1000: { primary: '#FFFDE7', secondary: '#FFC107', text: '#E65100', darkText: '#5D4037', buttonBackground: '#FF8F00', selectedBorder: '#FF8F00', iconColor: '#FFC107' },
        members_10_value_500: { primary: '#F3E5F5', secondary: '#9C27B0', text: '#4A148C', darkText: '#424242', buttonBackground: '#7B1FA2', selectedBorder: '#6A1B9A', iconColor: '#9C27B0' },
        value_very_high: { primary: '#E3F2FD', secondary: '#2196F3', text: '#1565C0', darkText: '#1A237E', buttonBackground: '#1976D2', selectedBorder: '#0D47A1', iconColor: '#2196F3' },
        small_members_high_value: { primary: '#FCE4EC', secondary: '#EC407A', text: '#C2185B', darkText: '#880E4F', buttonBackground: '#D81B60', selectedBorder: '#AD1457', iconColor: '#EC407A' },
        large_members_any_value: { primary: '#F1F8E9', secondary: '#8BC34A', text: '#558B2F', darkText: '#33691E', buttonBackground: '#689F38', selectedBorder: '#33691E', iconColor: '#8BC34A' },
        high_performing: { primary: '#F0FFF4', secondary: '#388E3C', text: '#1B5E20', darkText: '#33691E', buttonBackground: '#4CAF50', selectedBorder: '#2E7D32', iconColor: '#388E3C' },
        low_engagement: { primary: '#FFF8E1', secondary: '#FFB300', text: '#E65100', darkText: '#BF360C', buttonBackground: '#FB8C00', selectedBorder: '#EF6C00', iconColor: '#FFB300' },
        very_small_group: { primary: '#F3E5F5', secondary: '#EF6C00', text: '#4A148C', darkText: '#2D0B4B', buttonBackground: '#EF6C00', selectedBorder: '#EF6C00', iconColor: '#EF6C00' },
        medium_sized_group: { primary: '#E1F5FE', secondary: '#03A9F4', text: '#0277BD', darkText: '#01579B', buttonBackground: '#29B6F6', selectedBorder: '#0288D1', iconColor: '#03A9F4' },
        tech_innovation: { primary: '#E0F7FA', secondary: '#00BCD4', text: '#00838F', darkText: '#006064', buttonBackground: '#00ACC1', selectedBorder: '#00838F', iconColor: '#00BCD4' },
        community_outreach: { primary: '#FCE4EC', secondary: '#E91E63', text: '#C2185B', darkText: '#880E4F', buttonBackground: '#D81B60', selectedBorder: '#AD1457', iconColor: '#E91E63' },
        members_value_other: { primary: '#F5F5DC', secondary: '#A1887F', text: '#5D4037', darkText: '#3E2723', buttonBackground: '#8D6E63', selectedBorder: '#4E342E', iconColor: '#795548' },
        creative_arts: { primary: '#FFF3E0', secondary: '#FF9800', text: '#E65100', darkText: '#BF360C', buttonBackground: '#FB8C00', selectedBorder: '#EF6C00', iconColor: '#FF9800' },
        health_wellness: { primary: '#E0F2F7', secondary: '#607D8B', text: '#37474F', darkText: '#263238', buttonBackground: '#78909C', selectedBorder: '#455A64', iconColor: '#607D8B' },
        finance_investment: { primary: '#E6EE9C', secondary: '#AFB42B', text: '#827717', darkText: '#33691E', buttonBackground: '#CDDC39', selectedBorder: '#9E9D24', iconColor: '#AFB42B' },
        environmental_sustainability: { primary: '#E8F5E9', secondary: '#388E3C', text: '#1B5E20', darkText: '#1B5E20', buttonBackground: '#4CAF50', selectedBorder: '#2E7D32', iconColor: '#388E3C' },
        education_development: { primary: '#EDE7F6', secondary: '#673AB7', text: '#4527A0', darkText: '#311B92', buttonBackground: '#7E57C2', selectedBorder: '#5E35B1', iconColor: '#673AB7' },
        social_impact: { primary: '#FFE0B2', secondary: '#FB8C00', text: '#EF6C00', darkText: '#BF360C', buttonBackground: '#FF9800', selectedBorder: '#F57C00', iconColor: '#FB8C00' },
        sports_fitness: { primary: '#FFEBF0', secondary: '#D81B60', text: '#C2185B', darkText: '#880E4F', buttonBackground: '#E91E63', selectedBorder: '#AD1457', iconColor: '#D81B60' },
        travel_adventure: { primary: '#E0F7FA', secondary: '#00ACC1', text: '#00838F', darkText: '#006064', buttonBackground: '#00BCD4', selectedBorder: '#00838F', iconColor: '#00ACC1' },
        culinary_arts: { primary: '#FFFDE7', secondary: '#FFD600', text: '#FFAB00', darkText: '#FF6F00', buttonBackground: '#FFC107', selectedBorder: '#FF8F00', iconColor: '#FFD600' },
        default: { primary: '#ECEFF1', secondary: '#90A4AE', text: '#455A64', darkText: '#263238', buttonBackground: '#90A4AE', selectedBorder: '#78909C', iconColor: '#78909C' }
    };

    const fetchGroups = async () => {
        if (!isConnected || !isInternetReachable) {
            setIsLoading(false);
            setError("No internet connection. Please check your network and try again.");
            setCardsData([]);
            Toast.show({
                type: 'error',
                text1: 'Offline',
                text2: 'Cannot load groups without internet connection.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            return;
        }
        setIsLoading(true);
        setError(null);
        let endpoint = `${url}/group/get-group/`;
        if (selectedGroup === "AllGroups") {
            endpoint = `${url}/group/get-group-by-filter/AllGroups`;
        }
        if (selectedGroup === "NewGroups") {
            endpoint = `${url}/group/get-group-by-filter/NewGroups`;
        } else if (selectedGroup === "OngoingGroups") {
            endpoint = `${url}/group/get-group-by-filter/OngoingGroups`;
        }
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                const groupsWithVacantSeats = await Promise.all(
                    data.map(async (group) => {
                        const vacantSeats = await fetchVacantSeats(group._id);
                        return { ...group, vacantSeats };
                    })
                );
                // Filter for vacant groups if the filter is selected
                if (selectedGroup === "VacantGroups") {
                    const vacantGroups = groupsWithVacantSeats.filter(group => group.vacantSeats > 0);
                    setCardsData(vacantGroups);
                } else {
                    setCardsData(groupsWithVacantSeats);
                }
                setIsLoading(false);
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Failed to load groups. Please try again.");
                setIsLoading(false);
            }
        } catch (error) {
            setError("An unexpected error occurred while fetching groups. Please retry.");
            setIsLoading(false);
            Toast.show({
                type: 'error',
                text1: 'Data Load Error',
                text2: 'Could not fetch groups. Please retry.',
                position: 'bottom',
                visibilityTime: 4000,
            });
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [selectedGroup, isConnected, isInternetReachable]);

    useEffect(() => {
        if (groupFilter) {
            const normalizedGroupFilter = groupFilter === "New Groups" ? "NewGroups" : (groupFilter === "Ongoing Groups" ? "OngoingGroups" : groupFilter);
            if (normalizedGroupFilter !== selectedGroup) {
                setSelectedGroup(normalizedGroupFilter);
            }
        }
    }, [groupFilter]);

    const getGroupType = (card) => {
        const now = new Date();
        const startDate = new Date(card.start_date);
        const endDate = new Date(card.end_date);
        if (startDate > now) {
            return 'new';
        } else if (startDate <= now && endDate > now) {
            return 'ongoing';
        } else if (endDate <= now) {
            return 'ended';
        }
        return 'default';
    };

    const getCustomCardColorKey = (card) => {
        const members = typeof card.group_members === 'number' ? card.group_members : parseInt(card.group_members);
        const value = typeof card.group_value === 'number' ? card.group_value : parseFloat(card.group_value);
        const performanceStatus = card.performance_status;
        const category = card.category;
        if (category === 'tech_innovation') return 'tech_innovation';
        if (category === 'community_outreach') return 'community_outreach';
        if (category === 'creative_arts') return 'creative_arts';
        if (category === 'health_wellness') return 'health_wellness';
        if (category === 'finance_investment') return 'finance_investment';
        if (category === 'environmental_sustainability') return 'environmental_sustainability';
        if (category === 'education_development') return 'education_development';
        if (category === 'social_impact') return 'social_impact';
        if (category === 'sports_fitness') return 'sports_fitness';
        if (category === 'travel_adventure') return 'travel_adventure';
        if (category === 'culinary_arts') return 'culinary_arts';
        if (performanceStatus === 'high') return 'high_performing';
        if (performanceStatus === 'low') return 'low_engagement';
        if (value > 10000) return 'value_very_high';
        if (members >= 1 && members <= 2) return 'very_small_group';
        if (members >= 4 && members <= 10) return 'medium_sized_group';
        if (members > 20) return 'large_members_any_value';
        if (members === 5 && value === 1000) return 'members_5_value_1000';
        if (members === 10 && value === 500) return 'members_10_value_500';
        if (isNaN(members) || isNaN(value)) return 'default';
        return 'members_value_other';
    };

    const getDisplayCards = () => {
        const now = new Date();
        const newGroups = cardsData.filter(card => new Date(card.start_date) > now);
        const ongoingGroups = cardsData.filter(card => {
            const startDate = new Date(card.start_date);
            const endDate = new Date(card.end_date);
            return startDate <= now && endDate > now;
        });
        const endedGroups = cardsData.filter(card => new Date(card.end_date) <= now);
        const vacantGroups = cardsData.filter(card => card.vacantSeats > 0);
        
        if (selectedGroup === "AllGroups") {
            return {
                new: newGroups,
                ongoing: ongoingGroups,
                ended: endedGroups,
                vacant: []
            };
        } else if (selectedGroup === "NewGroups") {
            return { new: cardsData, ongoing: [], ended: [], vacant: [] };
        } else if (selectedGroup === "OngoingGroups") {
            return { new: [], ongoing: cardsData, ended: [], vacant: [] };
        } else if (selectedGroup === "VacantGroups") {
            return { new: [], ongoing: [], ended: [], vacant: cardsData };
        }
        return { new: [], ongoing: [], ended: [], vacant: [] };
    };

    // This remains the original behavior (View More/Details)
    const handleEnrollment = (card) => {
        if (!isConnected || !isInternetReachable) {
            setModalMessage("You are offline. Please connect to the internet to view details.");
            setEnrollmentModalVisible(true);
            return;
        }
        const selectedGroupId = card._id;
        if (selectedGroupId) {
            navigation.navigate("EnrollForm", { groupId: selectedGroupId, userId: userId });
        } else {
            setModalMessage("Error: Could not retrieve group ID.");
            setEnrollmentModalVisible(true);
        }
    };
    
    // Function to handle direct enrollment (joining)
    const handleJoinNow = async (card) => { 
        if (!isConnected || !isInternetReachable) {
            Toast.show({
                type: "error",
                text1: "No Internet Connection",
                text2: "Please check your network and try again.",
                position: "bottom",
                visibilityTime: 3000,
            });
            return;
        }

        const selectedGroupId = card._id;
        
        if (!selectedGroupId) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Could not retrieve group ID for enrollment.",
                position: "bottom",
                visibilityTime: 3000,
            });
            return;
        }

        if (card.vacantSeats === 0) {
             Toast.show({
                type: "info",
                text1: "No Seats Available",
                text2: "This group currently has no vacant seats.",
                position: "bottom",
                visibilityTime: 3000,
            });
            return;
        }
        
        // 1. Set loading state for the specific card
        setJoinGroupId(selectedGroupId);
        setIsJoining(true);

        // Assumption: Direct join is for 1 ticket, and chit_asking_month is derived from group_duration
        const ticketsCountInt = 1; 
        const chitAskingMonth = Number(card?.group_duration) || 0; 

        const payload = {
            group_id: selectedGroupId,
            user_id: userId,
            no_of_tickets: ticketsCountInt,
            chit_asking_month: chitAskingMonth,
        };

        try {
            await axios.post(`${url}/mobile-app-enroll/add-mobile-app-enroll`, payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // 2. Success Feedback
            Toast.show({
                type: "success",
                text1: "Enrollment Successful!",
                text2: `You are enrolled for ${card.group_name} with 1 ticket.`,
                position: "bottom",
                visibilityTime: 3000,
            });
            
            // 3. Navigate to confirmation page
            navigation.navigate("EnrollConfirm", {
                group_name: card.group_name,
                userId: userId,
            });

        } catch (err) {
            console.error("Error enrolling user directly:", err);
            let errorMessage = "An error occurred during enrollment. Please try again.";

            if (err.response) {
                // Check for specific backend error messages
                errorMessage =
                    err.response.data?.data?.message ||
                    err.response.data?.message || 
                    `Server error: ${err.response.status}`;
            } else if (err.request) {
                errorMessage = "Network error: No response from server. Please check your connection.";
            } else {
                errorMessage = `An unexpected error occurred: ${err.message}`;
            }

            // 4. Error Feedback
            Toast.show({
                type: "error",
                text1: "Enrollment Failed",
                text2: errorMessage,
                position: "bottom",
                visibilityTime: 5000,
            });
        } finally {
            // 5. Reset loading state
            setIsJoining(false);
            setJoinGroupId(null);
            // Re-fetch groups to update the vacant seat count
            fetchGroups(); 
        }
    };


    const NoGroupsIllustration = require('../../assets/Nogroup.png');
    const CardContent = ({ card, colors, isSelected }) => {
        const formatDate = (dateString) => {
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-GB', options);
        };
        const groupType = getGroupType(card);
        const vacantSeats = card.vacantSeats || 0;
        
        // Determine if the current card is in the joining state
        const isCurrentCardJoining = isJoining && joinGroupId === card._id; 

        return (
            <>
                <View style={styles.cardHeader}>
                    <View style={styles.groupValueContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedCardIndex(card._id)}
                            style={styles.radioButtonContainer}
                        >
                            <Ionicons
                                name={isSelected ? "radio-button-on" : "radio-button-off"}
                                size={24}
                                color={isSelected ? "#053B90" : "#ccc"}
                            />
                        </TouchableOpacity>
                        <Text style={[styles.groupValue, { color: '#FF8C00' }]}>
                            ₹ {formatNumberIndianStyle(card.group_value)}
                        </Text>
                        <Text style={[styles.chitValueText, { color: colors.darkText }]}>Chit Value</Text>
                    </View>
                    <View style={styles.headerSeparator} />
                    <Text style={[styles.groupName, { color: isSelected ? colors.text : colors.darkText }]} numberOfLines={1} ellipsizeMode="tail">
                        <Text style={[styles.groupNameLabel, { color: colors.darkText }]}>Group Name:</Text> {card.group_name}
                    </Text>
                    {groupType === 'new' && (
                        <View style={styles.newLeadBadgeContainer}>
                            <Text style={styles.newLeadBadgeText}>New</Text>
                        </View>
                    )}
                    {groupType === 'ongoing' && (
                        <View style={styles.ongoingBadgeContainer}>
                            <Text style={styles.ongoingBadgeText}>Ongoing</Text>
                        </View>
                    )}
                </View>
                {/* Start and End Dates */}
                <View style={styles.cardDetailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.darkText }]}>Starts Date</Text>
                        <Text style={[styles.detailValue, { color: isSelected ? colors.text : colors.darkText }]}>
                            {formatDate(card.start_date)}
                        </Text>
                    </View>
                    <View style={styles.detailItemRight}>
                        <Text style={[styles.detailLabel, { color: colors.darkText }]}>Ends Date</Text>
                        <Text style={[styles.detailValue, { color: isSelected ? colors.text : colors.darkText }]}>
                            {formatDate(card.end_date)}
                        </Text>
                    </View>
                </View>
                {/* Members and Vacant Seats */}
                <View style={styles.cardDetailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.darkText }]}>Members</Text>
                        <Text style={[styles.detailValue, { color: isSelected ? colors.text : colors.darkText }]}>
                            {card.group_members}
                        </Text>
                    </View>
                    <View style={styles.detailItemRight}>
                        <Text style={[styles.detailLabel, { color: colors.darkText }]}>Vacant Seats</Text>
                        <Text style={[styles.detailValue, styles.highlightedVacantSeats,]}>
                            {vacantSeats}
                        </Text>
                    </View>
                </View>
                {/* MODIFICATION START: Redesigned button container and styles */}
                <View style={styles.viewMoreContainer}>
                    {/* View Details Button (Secondary Action - Outline Style) */}
                    <TouchableOpacity
                        style={[
                            styles.viewMoreButton,
                            // Set the outline color based on the card's theme color
                            { 
                                borderColor: colors.secondary, 
                            }, 
                            (!isConnected || !isInternetReachable || isCurrentCardJoining) && { opacity: 0.5, borderColor: '#aaa' }
                        ]}
                        onPress={() => handleEnrollment(card)}
                        activeOpacity={0.7}
                        disabled={!isConnected || !isInternetReachable || isCurrentCardJoining}
                    >
                        <Text style={[styles.viewMoreButtonText, { color: colors.secondary }]}>View Details</Text>
                        <Ionicons name="information-circle-outline" size={18} color={colors.secondary} style={styles.viewMoreIcon} />
                    </TouchableOpacity>

                    {/* Join Now Button (Primary Action - Solid Background) */}
                    <TouchableOpacity
                        style={[
                            styles.joinNowButton, 
                            // Use the primary background color for the main CTA
                            { backgroundColor: colors.secondary }, 
                            ((!isConnected || !isInternetReachable || isCurrentCardJoining) || vacantSeats === 0) && { opacity: 0.5 } // Apply disabled style, including for 0 vacant seats
                        ]}
                        onPress={() => handleJoinNow(card)}
                        activeOpacity={0.7}
                        disabled={!isConnected || !isInternetReachable || isCurrentCardJoining || vacantSeats === 0} 
                    >
                        {isCurrentCardJoining ? (
                            <ActivityIndicator size="small" color="#fff" /> // Show spinner while joining
                        ) : (
                            <Text style={styles.joinNowButtonText}>
                                {vacantSeats === 0 ? 'No Seats' : 'Join Now'} 
                            </Text> 
                        )}
                    </TouchableOpacity>
                </View>
                {/* MODIFICATION END */}
            </>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="#053B90" />
                <Header userId={userId} navigation={navigation} />
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#053B90" />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="#053B90" />
                <Header userId={userId} navigation={navigation} />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={50} color="#DC143C" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#053B90" />
            <Header userId={userId} navigation={navigation} />
            <View style={styles.mainContentWrapper}>
                <View style={styles.innerContentArea}>
                    <View style={styles.filterContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScrollContainer}>
                            <View style={styles.chipsContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        selectedGroup === "NewGroups" && styles.selectedChip,
                                    ]}
                                    onPress={() => setSelectedGroup("NewGroups")}
                                >
                                    <Ionicons
                                        name="sparkles"
                                        size={16}
                                        color={selectedGroup === "NewGroups" ? '#fff' : '#666'}
                                        style={styles.chipIcon}
                                    />
                                    <Text style={[styles.chipText, selectedGroup === "NewGroups" && styles.selectedChipText]}>New Groups</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        selectedGroup === "OngoingGroups" && styles.selectedChip,
                                    ]}
                                    onPress={() => setSelectedGroup("OngoingGroups")}
                                >
                                    <Ionicons
                                        name="hourglass"
                                        size={16}
                                        color={selectedGroup === "OngoingGroups" ? '#fff' : '#666'}
                                        style={styles.chipIcon}
                                    />
                                    <Text style={[styles.chipText, selectedGroup === "OngoingGroups" && styles.selectedChipText]}>Ongoing Groups</Text>
                                </TouchableOpacity>

                                {/* More Options Button */}
                                <TouchableOpacity
                                    style={styles.moreOptionsButton}
                                    onPress={() => setMoreFiltersModalVisible(true)}
                                >
                                    <Ionicons name="filter" size={20} color="#053B90" />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                    <ScrollView
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {(() => {
                            const { new: newGroups, ongoing: ongoingGroups, ended: endedGroups, vacant: vacantGroups } = getDisplayCards();
                            const renderGroupSection = (data) => (
                                data.length > 0 && (
                                    <View style={styles.groupSection}>
                                        {data.map((card) => {
                                            const primaryGroupType = getGroupType(card);
                                            const customColorKey = getCustomCardColorKey(card);
                                            const colors = {
                                                key: customColorKey,
                                                ...(groupColors[customColorKey] || groupColors[primaryGroupType] || groupColors.default)
                                            };
                                            const isSelected = selectedCardIndex === card._id;
                                            const CardWrapper = ({ children }) => (
                                                <View
                                                    style={[
                                                        styles.card,
                                                        {
                                                            backgroundColor: colors.primary,
                                                            borderColor: isSelected ? colors.selectedBorder : colors.primary,
                                                            borderWidth: isSelected ? 2 : 1,
                                                        },
                                                        (!isConnected || !isInternetReachable) && !isSelected && styles.offlineCardOverlay
                                                    ]}
                                                >
                                                    {children}
                                                </View>
                                            );
                                            return (
                                                <TouchableOpacity
                                                    key={card._id}
                                                    onPress={() => setSelectedCardIndex(card._id)}
                                                    activeOpacity={0.8}
                                                    disabled={!isConnected || !isInternetReachable}
                                                >
                                                    <CardWrapper>
                                                        <CardContent
                                                            card={card}
                                                            colors={colors}
                                                            isSelected={isSelected}
                                                        />
                                                    </CardWrapper>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )
                            );

                            let groupsToDisplay = [];
                            let noGroupsMessage = "";
                            let noGroupsTitle = "";

                            if (selectedGroup === "NewGroups") {
                                groupsToDisplay = newGroups;
                                noGroupsTitle = "No New Groups";
                                noGroupsMessage = "No new groups found. Check back later for exciting additions!";
                            } else if (selectedGroup === "OngoingGroups") {
                                groupsToDisplay = ongoingGroups;
                                noGroupsTitle = "No Ongoing Groups";
                                noGroupsMessage = "No ongoing groups found. Check back later!";
                            } else if (selectedGroup === "VacantGroups") {
                                groupsToDisplay = vacantGroups;
                                noGroupsTitle = "No Vacant Groups";
                                noGroupsMessage = "There are no groups with vacant seats at the moment. Please check back later.";
                            } else if (selectedGroup === "AllGroups") {
                                // For "All Groups", we combine all types
                                groupsToDisplay = [...newGroups, ...ongoingGroups, ...endedGroups];
                                noGroupsTitle = "No Groups Available";
                                noGroupsMessage = "It looks like there are no groups that match your current filter. Try changing the filter or check back later for new additions!";
                            }
                            
                            if (groupsToDisplay.length === 0) {
                                return (
                                    <View style={styles.emptyStateContainer}>
                                        <Image source={NoGroupsIllustration} style={styles.noGroupsImage} resizeMode="contain" />
                                        <Text style={styles.noGroupsTitle}>{noGroupsTitle}</Text>
                                        <Text style={styles.noGroupsText}>
                                            {noGroupsMessage}
                                        </Text>
                                    </View>
                                );
                            }

                            return renderGroupSection(groupsToDisplay);
                        })()}
                    </ScrollView>
                </View>
            </View>

            {/* General Modal for offline or error messages */}
            <Modal
                visible={enrollmentModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEnrollmentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {modalMessage || "Please select a group to continue!"}
                        </Text>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setEnrollmentModalVisible(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>
                                Got It!
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* More Filters Modal */}
            <Modal
                visible={moreFiltersModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setMoreFiltersModalVisible(false)}
            >
                <View style={styles.moreFiltersModalOverlay}>
                    <View style={styles.moreFiltersModalContent}>
                        <Text style={styles.moreFiltersTitle}>Select a Filter</Text>
                        <TouchableOpacity
                            style={styles.moreFiltersOption}
                            onPress={() => {
                                setSelectedGroup("AllGroups");
                                setMoreFiltersModalVisible(false);
                            }}
                        >
                            <Text style={styles.moreFiltersOptionText}>All Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.moreFiltersOption}
                            onPress={() => {
                                setSelectedGroup("NewGroups");
                                setMoreFiltersModalVisible(false);
                            }}
                        >
                            <Text style={styles.moreFiltersOptionText}>New Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.moreFiltersOption}
                            onPress={() => {
                                setSelectedGroup("OngoingGroups");
                                setMoreFiltersModalVisible(false);
                            }}
                        >
                            <Text style={styles.moreFiltersOptionText}>Ongoing Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.moreFiltersOption}
                            onPress={() => {
                                setSelectedGroup("VacantGroups");
                                setMoreFiltersModalVisible(false);
                            }}
                        >
                            <Text style={styles.moreFiltersOptionText}>Vacant Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.closeMoreFiltersButton}
                            onPress={() => setMoreFiltersModalVisible(false)}
                        >
                            <Text style={styles.closeMoreFiltersButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#053B90', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
    errorText: { fontSize: 15, color: '#DC143C', textAlign: 'center', marginTop: 10, fontWeight: 'bold' },
    retryButton: { marginTop: 20, backgroundColor: '#053B90', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    mainContentWrapper: { flex: 1, alignItems: 'center', paddingVertical: 1, backgroundColor: '#053B90', paddingHorizontal: 15 },
    innerContentArea: { flex: 1, backgroundColor: '#F5F5F5', marginHorizontal: 0, borderRadius: 15, paddingVertical: 15, paddingBottom: 25, width: '104%' },
    filterContainer: { paddingHorizontal: 15, paddingBottom: 10, },
    chipsScrollContainer: { paddingRight: 30, paddingLeft: 5 }, // Added paddingLeft
    chipsContainer: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    chip: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 8, // Reduced for smaller size
        paddingHorizontal: 15, // Reduced for smaller size
        borderRadius: 5, 
        backgroundColor: '#E0EFFF', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 2, 
        elevation: 1, 
        // minWidth: 100, // Removed minWidth for smaller size
        justifyContent: 'center' 
    },
    selectedChip: { backgroundColor: '#053B90', borderColor: '#053B90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
    chipIcon: { marginRight: 2 },
    chipText: { fontSize: 12, fontWeight: '600', color: '#4A4A4A' },
    selectedChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlignVertical: 'center' },
    scrollContentContainer: { paddingVertical: 8, paddingHorizontal: 0 },
    card: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 15,
        marginVertical: 8,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
        width: '105%',
        borderWidth: 0.5,
        alignSelf: 'center'
    },
    offlineCardOverlay: { opacity: 0.6 },
    cardHeader: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    groupValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 0,
        justifyContent: 'flex-start',
        width: '100%',
        height: 50,
    },
    groupName: {
        fontSize: 20,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginBottom: 1,
    },
    groupNameLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginRight: 4,
    },
    groupValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginRight: 8,
    },
    chitValueText: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerSeparator: {
        height: 1,
        width: '100%',
        backgroundColor: '#E0E0E0',
        marginVertical: 8,
    },
    cardDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailItemRight: {
        flex: 1,
        alignItems: 'flex-end',
        paddingHorizontal: 5,
    },
    detailItem: {
        flex: 1,
        alignItems: 'flex-start',
        paddingHorizontal: 5,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#777',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '700',
    },
    highlightedVacantSeats: {
      backgroundColor: '#1de94cff',
        color: '#060806ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        fontWeight: 'bold',
        overflow: 'hidden',
    },
    // --- STYLIST MODIFICATIONS START ---
    viewMoreContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 15,
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        paddingHorizontal: 5,
        gap: 10, // Space between buttons
        borderTopWidth: 1, 
        borderTopColor: '#E0E0E0',
        paddingTop: 10,
    },
    // View Details Button (Secondary Action - Outline Style)
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 2, // Outline style
        backgroundColor: 'transparent',
        minWidth: 120,
        justifyContent: 'center',
        flex: 1,
    },
    viewMoreButtonText: {
        fontSize: 14,
        fontWeight: '700',
        marginRight: 5,
    },
    viewMoreIcon: {
        marginLeft: 2
    },
    // Join Now Button (Primary Action - Solid Background)
    joinNowButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
        minWidth: 120,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    joinNowButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // --- STYLIST MODIFICATIONS END ---
    emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    noGroupsImage: {
        width: 250,
        height: 250,
        marginBottom: 20,
    },
    noGroupsTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#053B90',
        marginBottom: 10,
        textAlign: 'center',
    },
    radioButtonContainer: {
        paddingRight: 20,
        marginRight: 15,
    },
    noGroupsText: { fontSize: 16, color: '#777', textAlign: 'center', marginTop: 15, lineHeight: 22 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 25, alignItems: 'center', marginHorizontal: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 7 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    modalCloseButton: { backgroundColor: '#053B90', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
    modalCloseButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    groupSection: { marginBottom: 25, width: '100%', paddingHorizontal: 15 },
    newLeadBadgeContainer: {
        position: 'absolute',
        top: -13,
        right: -15,
        backgroundColor: 'green',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderTopRightRadius: 15,
        borderBottomLeftRadius: 15,
    },
    newLeadBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    ongoingBadgeContainer: {
        position: 'absolute',
        top: -13,
        right: -15,
        backgroundColor: 'orange',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderTopRightRadius: 15,
        borderBottomLeftRadius: 15,
    },
    ongoingBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    vacantSeatsContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e6f7ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#b3e0ff',
    },
    vacantSeatsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#005a87',
    },
    vacantSeatItem: {
        fontSize: 14,
        color: '#333',
        marginTop: 5,
    },
    // Styles for the new "More Options" button and modal
    moreOptionsButton: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#E0EFFF',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreFiltersModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    moreFiltersModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    moreFiltersTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#333',
    },
    moreFiltersOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    moreFiltersOptionText: {
        fontSize: 16,
        color: '#053B90',
        textAlign: 'center',
    },
    closeMoreFiltersButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#eee',
        borderRadius: 10,
    },
    closeMoreFiltersButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        textAlign: 'center',
    },
});

export default Enrollment;