import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const clockSize = width * 0.2;
const handLengthOffset = 15; // to adjust the hand length

const AnalogClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    const getHandRotation = useCallback((handType) => {
        let rotation;
        const hour = time.getHours();
        const minute = time.getMinutes();
        const second = time.getSeconds();

        if (handType === 'second') {
            rotation = (second / 60) * 360;
        } else if (handType === 'minute') {
            rotation = ((minute + second / 60) / 60) * 360;
        } else if (handType === 'hour') {
            rotation = ((hour % 12 + minute / 60) / 12) * 360;
        }
        return `${rotation}deg`;
    }, [time]);

    const hourRotation = getHandRotation('hour');
    const minuteRotation = getHandRotation('minute');
    const secondRotation = getHandRotation('second');

    return (
        <View style={styles.container}>
            <View style={[styles.clockFace, { width: clockSize, height: clockSize, borderRadius: clockSize / 2 }]}>
                {/* Hour Marks */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                    <View
                        key={`hour-mark-${i}`}
                        style={[
                            styles.hourMarkContainer,
                            {
                                transform: [
                                    { translateY: -clockSize / 2 + 10 },
                                    { rotate: `${(i / 12) * 360}deg` },
                                    { translateY: clockSize / 2 - 10 }
                                ]
                            }
                        ]}
                    >
                        <View style={styles.hourMark} />
                    </View>
                ))}

                {/* Clock Numbers */}
                <Text style={[styles.clockNumber, { top: '8%', left: '46%' }]}>12</Text>
                <Text style={[styles.clockNumber, { top: '46%', right: '8%' }]}>3</Text>
                <Text style={[styles.clockNumber, { bottom: '8%', left: '46%' }]}>6</Text>
                <Text style={[styles.clockNumber, { top: '46%', left: '8%' }]}>9</Text>

                <View style={[styles.hand, styles.hourHand, { transform: [{ rotate: hourRotation }] }]} />
                <View style={[styles.hand, styles.minuteHand, { transform: [{ rotate: minuteRotation }] }]} />
                <View style={[styles.hand, styles.secondHand, { transform: [{ rotate: secondRotation }] }]} />
                <View style={styles.centerDot} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    clockFace: {
        position: 'relative',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#0949f791',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    hourMarkContainer: {
        position: 'absolute',
        width: 1,
        height: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },

    clockNumber: {
        position: 'absolute',
        fontSize: 7,
        fontWeight: 'bold',
        color: '#333',
    },
    hand: {
        position: 'absolute',
        bottom: '50%',
        left: '50%',
        transformOrigin: 'bottom center',
    },
    hourHand: {
        width: 4, // Decreased from 6
        height: (clockSize / 2) * 0.4 - handLengthOffset, // Decreased from 0.5
        backgroundColor: 'black',
    },
    minuteHand: {
        width: 3, // Decreased from 4
        height: (clockSize / 2) * 0.6 - handLengthOffset, // Decreased from 0.7
        backgroundColor: 'black',
    },
    secondHand: {
        width: 1, // Decreased from 2
        height: (clockSize / 2) * 0.7 - handLengthOffset, // Decreased from 0.8
        backgroundColor: 'red',
    },
    centerDot: {
        width: 4, // Decreased from 12
        height: 4, // Decreased from 12
        borderRadius: 2, // Decreased from 6
        backgroundColor: 'red',
        position: 'absolute',
        zIndex: 10,
    },
});

export default AnalogClock;