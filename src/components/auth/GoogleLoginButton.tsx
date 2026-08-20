import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import SocialLoginButton from './SocialLoginButton';
import IconGoogleLogo from '../../assets/icons/IconGoogleLogo';

type Props = {
    onPress: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

export default function GoogleLoginButton({onPress, disabled, style}: Props) {
    return (
        <SocialLoginButton
            label="Google로 로그인"
            icon={<IconGoogleLogo size={18} />}
            onPress={onPress}
            disabled={disabled}
            backgroundColor="#FFFFFF"
            textColor="rgba(0, 0, 0, 0.85)"
            borderColor="#E0E0E0"
            style={style}
        />
    );
}
