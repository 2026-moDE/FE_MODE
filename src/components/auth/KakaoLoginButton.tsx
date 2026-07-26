import React from 'react';
import {Image, StyleProp, ViewStyle} from 'react-native';
import SocialLoginButton from './SocialLoginButton';

const kakaoLogo = require('../../assets/image/kakao_logo.png');

type Props = {
    onPress: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    scale?: number;
};

export default function KakaoLoginButton({onPress, disabled, style, scale = 1}: Props) {
    return (
        <SocialLoginButton
            label="카카오 로그인"
            icon={
                <Image
                    source={kakaoLogo}
                    style={{width: 18 * scale, height: 17 * scale, resizeMode: 'contain'}}
                />
            }
            onPress={onPress}
            disabled={disabled}
            backgroundColor="#FEE500"
            textColor="rgba(0, 0, 0, 0.85)"
            style={style}
            scale={scale}
        />
    );
}
