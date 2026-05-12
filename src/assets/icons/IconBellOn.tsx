import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconBellOn({size = 24, color = '#2C343F'}: Props) {
    return (
        <View style={[styles.container, {width: size, height: size}]}>
            <Svg
                style={styles.bell}
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none">
                <Path
                    d="M18 15H20V17H0V15H2V8C2 5.87827 2.84285 3.84344 4.34315 2.34315C5.84344 0.842855 7.87827 0 10 0C12.1217 0 14.1566 0.842855 15.6569 2.34315C17.1571 3.84344 18 5.87827 18 8V15ZM7 19H13V21H7V19Z"
                    fill={color}
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    bell: {
        position: 'absolute',
        top: 2,
        right: 2,
        bottom: 1,
        left: 2,
    },
});
