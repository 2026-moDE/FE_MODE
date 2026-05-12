import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Svg, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconBellOff({size = 24, color = '#A3A3AA'}: Props) {
    return (
        <View style={[styles.container, {width: size, height: size}]}>
            <Svg
                style={styles.bell}
                width="18"
                height="21"
                viewBox="0 0 18 21"
                fill="none">
                <Path
                    d="M11 21H5V19H11V21ZM16 8V15H18V17H0.231445L15.9971 7.89746C15.9975 7.93163 16 7.96579 16 8ZM8 0C10.1217 0 12.1569 0.842483 13.6572 2.34277C14.375 3.06051 14.9394 3.90202 15.3359 4.81543L0 13.6699V8C0 5.87827 0.842482 3.84306 2.34277 2.34277C3.84306 0.842482 5.87827 0 8 0Z"
                    fill={color}
                />
            </Svg>
            <Svg
                style={styles.slash}
                width="22"
                height="14"
                viewBox="0 0 22 14"
                fill="none">
                <Path
                    d="M20.375 0.100623C20.7337 -0.106478 21.1923 0.0163508 21.3994 0.375037C21.6065 0.733741 21.4837 1.19233 21.125 1.39945L1.12499 12.9463C0.766268 13.1534 0.307681 13.0306 0.100573 12.6719C-0.106422 12.3132 0.0163151 11.8546 0.374987 11.6475L20.375 0.100623Z"
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
        left: 3,
    },
    slash: {
        position: 'absolute',
        top: 5,
        left: 1,
    },
});
