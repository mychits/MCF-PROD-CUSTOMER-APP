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
    Alert, // Kept, but only for legacy errors, not the main join flow
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import url from "../data/url";
import axios from "axios";
import Header from "../components/layouts/Header";
import { NetworkContext } from '../context/NetworkProvider';
import Toast from 'react-native-toast-message';
import { ContextProvider } from "../context/UserProvider"

// START: LOTTIE IMPORT PLACEHOLDER
// IMPORTANT: To use a Lottie animation, you need to:
// 1. Install the dependency: npm install lottie-react-native
// 2. Uncomment the following lines:
// import LottieView from 'lottie-react-native'; 
// const enrollmentLottie = require('../../assets/animations/enrollment-confirm.json'); 
// END: LOTTIE IMPORT PLACEHOLDER

const formatNumberIndianStyle = (num) => {
    if (num === null || num === undefined) {
        return "0";
    }
    // Fixed split on '.' for standard number formatting, not ',' as was in the original snippet
    const parts = num.toString().split('.');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    let isNegative = false;
    if (integerPart.startsWith('-')) {
        isNegative = true;
        integerPart = integerPart.substring(1);
    }
    
    // Logic for Indian style (2-digit grouping after the first 3)
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    
    if (otherNumbers !== '') {
        const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        integerPart = formattedOtherNumbers + ',' + lastThree;
    } else {
        integerPart = lastThree;
    }
    
    return (isNegative ? '-' : '') + integerPart + decimalPart;
};

// **NEW HELPER FUNCTION FOR CONDITIONAL VACANT SEATS**
const getVacantSeats = (card) => {
    // 1. Prioritize the new app_display_vacany_seat field
    const appDisplaySeats = parseInt(card.app_display_vacany_seat, 10);
    if (!isNaN(appDisplaySeats) && appDisplaySeats > 0) {
        return appDisplaySeats;
    }

    // 2. Fallback: Calculate vacant seats using old logic
    const totalMembers = parseInt(card.number_of_members, 10) || 0;
    // Assuming 'enrolled_members' exists on the card object for the fallback calculation
    const enrolledMembers = parseInt(card.enrolled_members, 10) || 0; 
    
    const calculatedSeats = totalMembers - enrolledMembers;
    
    // Ensure the result is not negative
    return Math.max(0, calculatedSeats);
};


const Enrollment = ({ route, navigation }) => {
    const { groupFilter } = route.params || {};
    const [appUser, setAppUser] = useContext(ContextProvider);
    const userId = appUser?.userId || appUser?.user_id; 
    // ADDED: Define userName here for use in Toast and Modal
    const userName = appUser?.name || appUser?.user_name || "User"; 
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const [cardsData, setCardsData] = useState([]);

    const initialGroupFilter = "NewGroups";
    const [selectedGroup, setSelectedGroup] = useState(groupFilter || initialGroupFilter);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollmentModalVisible, setEnrollmentModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const { isConnected, isInternetReachable } = useContext(NetworkContext);
    const [moreFiltersModalVisible, setMoreFiltersModalVisible] = useState(false);

    const [isJoining, setIsJoining] = useState(false);
    const [joinGroupId, setJoinGroupId] = useState(null);
    // REMOVED: [customEnrollModalVisible, setCustomEnrollModalVisible] and [enrollmentConfirmationData, setEnrollmentConfirmationData]

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
            endpoint = `${url}/group/filter/AllGroups`;
        }
        if (selectedGroup === "NewGroups") {
            endpoint = `${url}/group/filter/NewGroups`;
        } else if (selectedGroup === "OngoingGroups") {
            endpoint = `${url}/group/filter/OngoingGroups`;
        }else if (selectedGroup === "VacantGroups") {
            endpoint = `${url}/group/filter/VacantGroups`;
        }
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                
                let groupsData = data?.groups || [];

                if (selectedGroup === "VacantGroups") {
                    // Filter using the new helper function that applies the fallback logic
                    const vacantGroups = groupsData.filter(group => {
                        return getVacantSeats(group) > 0;
                    });
                    setCardsData(vacantGroups);
                } else {
                    setCardsData(groupsData);
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
        
        // Filter vacant groups using the helper function
        const vacantGroups = cardsData.filter(card => getVacantSeats(card) > 0);
        
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
            // cardsData is already filtered in fetchGroups when selectedGroup is "VacantGroups"
            return { new: [], ongoing: [], ended: [], vacant: cardsData }; 
        }
        return { new: [], ongoing: [], ended: [], vacant: [] };
    };

    // REMOVED: handleEnrollmentConfirmation function as it is no longer used and its purpose is replaced by direct navigation to EnrollForm.


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
    
    // Function to handle direct enrollment (joining) - MODIFIED TO NAVIGATE DIRECTLY TO ENROLLFORM
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

        // CRITICAL CHANGE: Use the new helper function for the check
        const vacantSeats = getVacantSeats(card); 
        
        if (vacantSeats === 0) {
             Toast.show({
                type: "info",
                text1: "No Seats Available",
                text2: "This group currently has no vacant seats.",
                position: "bottom",
                visibilityTime: 3000,
            });
            return;
        }

        // **CRITICAL MODIFICATION: Navigate directly to EnrollForm**
        // Removed: setEnrollmentConfirmationData(card); setCustomEnrollModalVisible(true);
        navigation.navigate("EnrollForm", { groupId: selectedGroupId, userId: userId });
    };


    const NoGroupsIllustration = require('../../assets/Nogroup.png');
    
    // START: InstallmentRow Helper Function - Added 'colors' prop
    const InstallmentRow = ({ amount, label, timeUnit, colors }) => {
        if (amount === undefined || amount === null || amount === "") return null;
        // Only render if the amount is a valid number > 0 for display purpose, or you want to show 0
        const formattedAmount = formatNumberIndianStyle(amount); 
        if (formattedAmount === "0") return null;

        return (
            <View style={[styles.installmentRowSmall, { backgroundColor: colors.primary, borderLeftColor: colors.secondary }]}>
                <Text style={[styles.detailLabelSmall, { color: colors.darkText, fontWeight: 'bold', fontSize: 12 }]}>
                    {label}:
                </Text>
                <Text style={[styles.detailValueSmall, styles.highlightedInstallment, { color: colors.secondary }]}>
                    ₹ {formattedAmount} / {timeUnit}
                </Text>
            </View>
        );
    };
    // END: InstallmentRow Helper Function

    // START: MODIFIED CardContent to show selected filter as badge and new installment rows
    const CardContent = ({ card, colors, isSelected, currentFilter }) => {
        
        // **MODIFICATION:** Removed state for toggling installment details
        // const [showInstallmentDetails, setShowInstallmentDetails] = useState(false);
        
        const getFilterDisplayName = (filterKey) => {
            switch (filterKey) {
                case "NewGroups":
                    return "New Group";
                case "OngoingGroups":
                    return "Ongoing";
                case "VacantGroups":
                    return "Vacant Group";
                case "AllGroups":
                    const type = getGroupType(card);
                    if (type === 'new') return 'New';
                    if (type === 'ongoing') return 'Ongoing';
                    return 'Group'; 
                default:
                    return "Group";
            }
        };

        const formatDate = (dateString) => {
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            const date = new Date(dateString);
            if (isNaN(date)) return dateString; 
            return date.toLocaleDateString('en-GB', options);
        };
        
        // CRITICAL CHANGE: Use the new helper function for the display value
        const vacantSeats = getVacantSeats(card);
        
        const isCurrentCardJoining = isJoining && joinGroupId === card._id; 
        const badgeText = getFilterDisplayName(currentFilter);
        
        const shouldShowBadge = !(currentFilter === "AllGroups" && getGroupType(card) === 'ended');

        // NEW: Fetch installment amounts
        const monthlyInstallment = card.monthly_installment;
        // const weeklyInstallment = card.weekly_installment; // Not needed
        // const dailyInstallment = card.daily_installment; // Not needed
        
        // Determine the main installment to display on the headline (use monthly as priority)
        // const mainInstallmentAmount = monthlyInstallment; // Not needed
        // const formattedMainAmount = formatNumberIndianStyle(mainInstallmentAmount); // Not needed

        return (
            <>
                <View style={styles.cardHeaderSmall}>
                    <View style={styles.groupMainInfoRow}>
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

                        <View style={styles.groupNameAndValueBlock}>
                            <View style={styles.groupValueContainerSmall}>
                                <Text style={[styles.groupValueSmall, { color: '#FF8C00' }]} numberOfLines={1}>
                                    ₹ {formatNumberIndianStyle(card.group_value)}
                                </Text>
                                <Text style={[styles.chitValueTextSmall, { color: colors.darkText }]}>Chit Value</Text>
                            </View>
                            
                            <Text style={[styles.groupNameSmall, { color: isSelected ? colors.text : colors.darkText }]} numberOfLines={1} ellipsizeMode="tail">
                                {card.group_name}
                            </Text>
                        </View>
                        
                        <View style={styles.statusBadgeContainer}>
                            {shouldShowBadge && (
                                <View style={[styles.statusBadge, { backgroundColor: colors.secondary }]}>
                                    <Text style={styles.statusBadgeText}>
                                        {badgeText}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.headerSeparatorSmall} />

                <View style={styles.cardDetailsRowSmall}>
                    <View style={styles.detailItemSmall}>
                        <Text style={[styles.detailLabelSmall, { color: colors.darkText }]}>Starts</Text>
                        <Text style={[styles.detailValueSmall, { color: isSelected ? colors.text : colors.darkText }]}>
                            {formatDate(card.start_date)}
                        </Text>
                    </View>
                    <View style={styles.detailItemSmall}>
                        <Text style={[styles.detailLabelSmall, { color: colors.darkText }]}>Ends</Text>
                        <Text style={[styles.detailValueSmall, { color: isSelected ? colors.text : colors.darkText }]}>
                            {formatDate(card.end_date)}
                        </Text>
                    </View>
                    <View style={styles.detailItemSmall}>
                        <Text style={[styles.detailLabelSmall, { color: colors.darkText }]}>Members</Text>
                        <Text style={[styles.detailValueSmall, { color: isSelected ? colors.text : colors.darkText }]}>
                            {card.group_members}
                        </Text>
                    </View>
                    <View style={styles.detailItemSmall}>
                        <Text style={[styles.detailLabelSmall, { color: colors.darkText }]}>Vacant</Text>
                        <Text style={[styles.detailValueSmall, styles.highlightedVacantSeatsSmall]}>
                            {vacantSeats}
                        </Text>
                    </View>
                </View>
                
                {/* START: INSTALLMENT DETAILS - MODIFIED TO SHOW ONLY MONTHLY INSTALLMENT WITHOUT TOGGLE */}
                <View style={[styles.installmentDetailsStandalone, {  backgroundColor: colors.primary }]}>
                    {/* Passing 'colors' to InstallmentRow for consistent styling */}
                    <InstallmentRow amount={monthlyInstallment} label="Monthly Installment" timeUnit="month" colors={colors} />
                </View>
                


                <View style={styles.viewMoreContainerSmall}>
                    <TouchableOpacity
                        style={[
                            styles.viewMoreButtonSmall,
                            { 
                                borderColor: colors.secondary, 
                            }, 
                            (!isConnected || !isInternetReachable || isCurrentCardJoining) && { opacity: 0.5, borderColor: '#aaa' }
                        ]}
                        onPress={() => handleEnrollment(card)}
                        activeOpacity={0.7}
                        disabled={!isConnected || !isInternetReachable || isCurrentCardJoining}
                    >
                        <Text style={[styles.viewMoreButtonTextSmall, { color: colors.secondary }]}>Details</Text>
                        <Ionicons name="information-circle-outline" size={16} color={colors.secondary} style={styles.viewMoreIconSmall} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.joinNowButtonSmall, 
                            { backgroundColor: colors.secondary }, 
                            ((!isConnected || !isInternetReachable || isCurrentCardJoining) || vacantSeats === 0) && { opacity: 0.5 }
                        ]}
                        onPress={() => handleJoinNow(card)}
                        activeOpacity={0.7}
                        disabled={!isConnected || !isInternetReachable || isCurrentCardJoining || vacantSeats === 0} 
                    >
                        {isCurrentCardJoining ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.joinNowButtonTextSmall}>
                                {vacantSeats === 0 ? 'No Seats' : 'Join Now'} 
                            </Text> 
                        )}
                    </TouchableOpacity>
                </View>
            </>
        );
    };
    // END: MODIFIED CardContent

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
                                                            borderColor: isSelected ? colors.selectedBorder : '#E0E0E0', 
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
                                                            currentFilter={selectedGroup} 
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
            
            {/* REMOVED: Custom Styled Confirmation Modal (Enrollment/Alert) */}

            {/* More Filters Modal */}
            <Modal
                visible={moreFiltersModalVisible}
                transparent={true}
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
    // Standard Layout Styles
    safeArea: { flex: 1, backgroundColor: '#053B90', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, },
    loaderContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F5F5F5' 
    },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
    errorText: { fontSize: 15, color: '#DC143C', textAlign: 'center', marginTop: 10, fontWeight: 'bold' },
    retryButton: { marginTop: 20, backgroundColor: '#053B90', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    mainContentWrapper: { flex: 1, alignItems: 'center', paddingVertical: 1, backgroundColor: '#053B90', paddingHorizontal: 15 },
    innerContentArea: { flex: 1, backgroundColor: '#F5F5F5', marginHorizontal: 0, borderRadius: 15, paddingVertical: 15, paddingBottom: 25, width: '104%' },
    filterContainer: { paddingHorizontal: 15, paddingBottom: 10, },
    chipsScrollContainer: { paddingRight: 30, paddingLeft: 5 }, 
    chipsContainer: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    
    // Chip/Filter Styles
    chip: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 5, 
        backgroundColor: '#E0EFFF', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 2, 
        elevation: 1, 
        justifyContent: 'center' 
    },
    selectedChip: { backgroundColor: '#053B90', borderColor: '#053B90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
    chipIcon: { marginRight: 2 },
    chipText: { fontSize: 12, fontWeight: '600', color: '#4A4A4A' },
    selectedChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlignVertical: 'center' },
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
    
    // Card Styles
    scrollContentContainer: { paddingVertical: 8, paddingHorizontal: 0 },
    groupSection: { marginBottom: 25, width: '100%', paddingHorizontal: 15 },
    card: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 10, 
        marginVertical: 6, 
        borderRadius: 12, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
        width: '105%',
        alignSelf: 'center'
    },
    offlineCardOverlay: { opacity: 0.6 },
    
    // Card Header/Content Styles (Small)
    cardHeaderSmall: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 5,
        position: 'relative',
    },
    groupMainInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    radioButtonContainer: {
        paddingRight: 10, 
        marginRight: 5, 
    },
    groupNameAndValueBlock: {
        flex: 1, 
        marginLeft: 0,
        overflow: 'hidden',
    },
    groupValueContainerSmall: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 0,
    },
    groupValueSmall: {
        fontSize: 25, 
        fontWeight: 'bold',
        marginRight: 6,
    },
    chitValueTextSmall: {
        fontSize: 14, 
        fontWeight: '600',
    },
    groupNameSmall: {
        fontSize: 15, 
        fontWeight: 'bold',
        marginTop: 2,
    },
    statusBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusBadgeText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
    },
    headerSeparatorSmall: {
        height: 1,
        width: '100%',
        backgroundColor: '#E0E0E0',
        marginVertical: 8, 
    },
    
    // Card Details Row Styles (Small)
    cardDetailsRowSmall: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailItemSmall: {
        flex: 1,
        alignItems: 'center', 
        paddingHorizontal: 2,
    },
    detailLabelSmall: {
        fontSize: 9, 
        fontWeight: '500',
        color: '#777',
        marginBottom: 1,
    },
    detailValueSmall: {
        fontSize: 12, 
        fontWeight: '700',
        textAlign: 'center',
    },
    highlightedVacantSeatsSmall: {
      backgroundColor: '#1de94cff',
        color: '#060806ff',
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 10, 
        fontWeight: 'bold',
        overflow: 'hidden',
    },

    // Installment Toggle Styles (MODIFIED/Simplified)
    // Removed installmentToggleContainer, installmentHeadline, headlineValueContainer styles
    installmentDetailsStandalone: {
        marginTop: 5,
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1, 
        borderColor: '#E0E0E0', 
        overflow: 'hidden',
        // The background and border color are set dynamically via the 'colors' prop now
        paddingHorizontal: 5, 
        paddingVertical: 5,
    },
    installmentRowSmall: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10, // Adjusted padding for inner view
        paddingVertical: 8, 
        borderRadius: 6, // Slightly rounded corners for inner rows
        borderLeftWidth: 4,
        // The background and border color are set dynamically via the 'colors' prop now
    },
    highlightedInstallment: {
        fontSize: 14, 
        fontWeight: 'bold',
        // Color is set dynamically via the 'colors' prop now
    },

    // Card Action Button Styles (Small)
    viewMoreContainerSmall: {
        width: '100%',
        alignItems: 'center',
        marginTop: 5, 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        paddingHorizontal: 0,
        gap: 8, 
        borderTopWidth: 1, 
        borderTopColor: '#E0E0E0',
        paddingTop: 8, 
    },
    viewMoreButtonSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8, 
        paddingHorizontal: 10, 
        borderRadius: 6, 
        borderWidth: 1.5, 
        backgroundColor: 'transparent',
        minWidth: 100, 
        justifyContent: 'center',
        flex: 1,
    },
    viewMoreButtonTextSmall: {
        fontSize: 12, 
        fontWeight: '700',
        marginRight: 3, 
    },
    viewMoreIconSmall: {
        marginLeft: 1
    },
    joinNowButtonSmall: {
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 6, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
        minWidth: 100, 
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    joinNowButtonTextSmall: {
        color: '#fff',
        fontSize: 14, 
        fontWeight: '700',
    },
    
    // Empty State Styles
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
    noGroupsText: { fontSize: 16, color: '#777', textAlign: 'center', marginTop: 15, lineHeight: 22 },
    
    // General Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 25, alignItems: 'center', marginHorizontal: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 7 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    modalCloseButton: { backgroundColor: '#053B90', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
    modalCloseButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // REMOVED: Custom Styled Confirmation Modal Styles

    // More Filters Modal Styles
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