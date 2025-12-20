import React from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

const TOP_GRADIENT = ["#042f74", "#042f74"]; 
const MODERN_PRIMARY = "#0d0d0eff"; 
const TEXT_GREY = "#4b5563"; 
const CARD_BG = "#ffffff"; 
const SUBTLE_BG_GREY = '#f9fafb';
const BORDER_COLOR = "#e0e0e0";

const QrCodePage = ({ navigation }) => {
    const qrCodeImage = require("../../assets/upi_qr (1).png"); 

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <LinearGradient
                colors={TOP_GRADIENT}
                style={styles.fixedHeaderArea}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Back Button remains at the top */}
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={28} color={CARD_BG} />
                </TouchableOpacity>

                {/* Added paddingTop here to push the title down */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Payment QR Code</Text>
                    <Text style={styles.subtitle}>
                        Use this code to make payments instantly
                    </Text>
                </View>
            </LinearGradient>

            <View style={styles.mainContentArea}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formBox}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>MyChits Payments</Text>
                        </View>

                        <View style={styles.qrContainer}>
                            <View style={styles.infoContainer_QR}>
                                <Text style={styles.upiIdText}>UPI ID: mychits@kotak</Text>
                            </View>

                            <Image
                                source={qrCodeImage}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        </View>
                        
                        <View style={styles.infoContainer_Bottom}> 
                            <Text style={styles.infoInstructionText}>
                                Scan this QR code to make payments
                            </Text>
                            <Text style={styles.bankText}>
                                Kotak Bank
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: TOP_GRADIENT[0] },
    fixedHeaderArea: { 
        paddingHorizontal: 16, 
        paddingTop: 10, 
        paddingBottom: 60, // Increased bottom padding to allow more space for title
        elevation: 3,
        position: 'relative'
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 15, 
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    titleContainer: { 
        alignItems: "center", 
        marginTop: 65, // This pushes the title and subtitle further down
        marginBottom: 10 
    },
    title: { fontSize: 28, fontWeight: "900", color: CARD_BG, marginBottom: 4 },
    subtitle: { fontSize: 14, color: "rgba(255, 255, 255, 0.85)", textAlign: "center" },
    mainContentArea: {
        flex: 1, 
        backgroundColor: SUBTLE_BG_GREY, 
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30, 
        paddingHorizontal: 16, 
        marginTop: -30, 
        paddingTop: 30, 
    },
    scrollContentContainer: { paddingBottom: 50, paddingTop: 10, flexGrow: 1 },
    formBox: {
        backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1,
        borderColor: BORDER_COLOR, elevation: 5,
    },
    cardHeader: { marginBottom: 20, alignItems: "center" },
    cardTitle: { fontSize: 20, fontWeight: "700", color: MODERN_PRIMARY },
    qrContainer: { justifyContent: "center", alignItems: "center", padding: 10, marginVertical: 10 },
    qrImage: { width: 250, height: 250, alignSelf: 'center' },
    infoContainer_QR: { alignItems: "center", marginBottom: 15 },
    upiIdText: { fontSize: 18, fontWeight: '600', color: MODERN_PRIMARY },
    infoContainer_Bottom: { 
        alignItems: "center", marginTop: 15, borderTopWidth: 1,
        borderTopColor: BORDER_COLOR, paddingTop: 15,
    },
    infoInstructionText: { fontSize: 15, color: TEXT_GREY, textAlign: "center", fontWeight: '500' },
    bankText: { fontSize: 16, color: MODERN_PRIMARY, fontWeight: 'bold' }
});

export default QrCodePage;