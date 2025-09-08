import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";


import ReferFriend from '../../assets/ReferFriend.png';
import FirstTime from '../../assets/FirstTime.png';
import PrimeMember from '../../assets/PrimeMember.png';

const OffersScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [appUser] = useContext(ContextProvider);
    const userId = appUser.userId || {};

    const offers = [
        { id: '1', title: 'Refer a friend, get ₹500', description: 'Your friend joins a chit, you get instant rewards.', image: ReferFriend },
        { id: '2', title: 'First time user offer', description: 'Get a reduced entry fee on your first chit.', image: FirstTime },
        { id: '3', title: 'Exclusive for Prime Members', description: 'Enjoy priority access and bonuses on certain chits.', image: PrimeMember },
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
                        <Text style={styles.headerTitle}>Special Offers</Text>
                    </View>
                    {offers.map(offer => (
                        <View key={offer.id} style={styles.card}>
                            <Image source={offer.image} style={styles.cardImage} />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{offer.title}</Text>
                                <Text style={styles.cardDescription}>{offer.description}</Text>
                                <TouchableOpacity style={styles.button}>
                                    <Text style={styles.buttonText}>View Details</Text>
                                </TouchableOpacity>
                            </View>
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
        padding: 15,
        backgroundColor: '#fff',
    },
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
    },
    cardImage: {
        width: '90%',
        height: 200, // This height is adjusted for better visibility
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        resizeMode: 'cover', // This is important to ensure the image fills the space
    },
    cardContent: {
        padding: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#6b7280',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignSelf: 'flex-start',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default OffersScreen;