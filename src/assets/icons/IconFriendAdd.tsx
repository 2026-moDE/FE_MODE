import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Path, Circle, Line } from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconFriendAdd({ size = 24, color = '#111114' }: Props) {
    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <Path
                    d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Line x1="19" y1="8" x2="19" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Line x1="22" y1="11" x2="16" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
