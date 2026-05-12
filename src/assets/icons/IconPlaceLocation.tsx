import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconPlaceLocation({size = 24, color = '#4B566D'}: Props) {
    return (
        <View style={[styles.container, {width: size, height: size}]}>
            <Svg
                style={styles.pin}
                width="18"
                height="21"
                viewBox="0 0 18 21"
                fill="none">
                <Path
                    d="M3.31943 3.26343C4.80975 1.80292 6.81623 0.989562 8.90286 1.0001C10.9895 1.01064 12.9877 1.84423 14.4631 3.31971C15.9386 4.7952 16.7722 6.79337 16.7828 8.88C16.7933 10.9666 15.9799 12.9731 14.5194 14.4634L10.3334 18.6494C9.95837 19.0244 9.44976 19.235 8.91943 19.235C8.3891 19.235 7.88048 19.0244 7.50543 18.6494L3.31943 14.4634C1.83432 12.9782 1 10.9638 1 8.86343C1 6.76306 1.83432 4.7487 3.31943 3.26343Z"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </Svg>
            <Svg
                style={styles.dot}
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none">
                <Path
                    d="M4 7C5.65685 7 7 5.65685 7 4C7 2.34315 5.65685 1 4 1C2.34315 1 1 2.34315 1 4C1 5.65685 2.34315 7 4 7Z"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    pin: {
        position: 'absolute',
        top: 2,
        right: 4,
        bottom: 3,
        left: 4,
    },
    dot: {
        position: 'absolute',
        top: 7,
        right: 9,
        bottom: 11,
        left: 9,
    },
});
