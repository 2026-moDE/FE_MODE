import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconShare({ size = 16, color = '#ffffff' }: Props) {
    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox="44 13.5 14 14" fill="none">
                <Path
                    d="M52.3333 14.5H57V19.1667M57 22.3247V25.5C57 25.7652 56.8946 26.0196 56.7071 26.2071C56.5196 26.3946 56.2652 26.5 56 26.5H46C45.7348 26.5 45.4804 26.3946 45.2929 26.2071C45.1054 26.0196 45 25.7652 45 25.5V15.5C45 15.2348 45.1054 14.9804 45.2929 14.7929C45.4804 14.6054 45.7348 14.5 46 14.5H49M51.6 19.9L56.7 14.8"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
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
