import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import SocialLoginButton from './SocialLoginButton';
import IconAppleLogo from '../../assets/icons/IconAppleLogo';

type Props = {
    onPress: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

export default function AppleLoginButton({onPress, disabled, style}: Props) {
    return (
        <SocialLoginButton
            label="Apple로 로그인"
            icon={<IconAppleLogo size={16} color="#FFFFFF" />}
            onPress={onPress}
            disabled={disabled}
            backgroundColor="#000000"
            textColor="#FFFFFF"
            style={style}
        />
    );
}
