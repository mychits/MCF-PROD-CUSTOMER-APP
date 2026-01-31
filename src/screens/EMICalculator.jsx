import React, { useEffect, useRef, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Animated,
    Platform,
    UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "../components/layouts/Header";
import { ContextProvider } from "../context/UserProvider";

// Enable LayoutAnimation for Android 
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Colors = {
    primaryBlue: "#053B90",
    lightBackground: "#F5F8FA",
    darkText: "#2C3E50",
    mediumText: "#7F8C8D",
    accentColor: "#3498DB",
};

const OnlineAuction = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [appUser] = useContext(ContextProvider);
    const userId = appUser?.userId || null;

    // --- Animation Logic (Consistent with Mygroups pulse style) ---
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.15,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [scaleAnim]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />

            {/* Integrated Header */}
            <Header userId={userId} navigation={navigation} />

            <View style={styles.mainWrapper}>
                <View style={styles.centerContent}>

                    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 20 }}>
                        <View style={styles.iconCircle}>
                            {/* Swapped 'gavel' for 'calculator-variant' */}
                            <MaterialCommunityIcons name="calculator-variant" size={60} color="#fff" />
                        </View>
                    </Animated.View>

                    <Text style={styles.title}>EMI Calculator</Text>
                  

                    <Text style={styles.description}>
                        Stay tuned for real-time bidding features!
                    </Text>

                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primaryBlue
    },
    mainWrapper: {
        flex: 1,
        backgroundColor: Colors.lightBackground,
        margin: 10,
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 50, // Consistent with Mygroups layout
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        alignItems: 'center',
        padding: 30,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.darkText,
        marginBottom: 10,
    },
    badge: {
        backgroundColor: Colors.accentColor,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    description: {
        fontSize: 16,
        color: Colors.mediumText,
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 10,
    },
});

export default OnlineAuction;