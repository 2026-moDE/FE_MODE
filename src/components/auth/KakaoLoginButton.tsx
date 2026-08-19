import React from 'react';
import {Image, StyleProp, ViewStyle} from 'react-native';
import SocialLoginButton from './SocialLoginButton';

const kakaoLogo = require('../../assets/image/kakao_logo.png');

type Props = {
    onPress: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

export default function KakaoLoginButton({onPress, disabled, style}: Props) {
    return (
        <SocialLoginButton
            label="카카오 로그인"
            icon={
                <Image
                    source={kakaoLogo}
                    style={{width: 18, height: 17, resizeMode: 'contain'}}
                />
            }
            onPress={onPress}
            disabled={disabled}
            backgroundColor="#FEE500"
            textColor="rgba(0, 0, 0, 0.85)"
            style={style}
        />
    );
}
