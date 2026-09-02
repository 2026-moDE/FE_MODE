import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import SocialLoginButton from './SocialLoginButton';
import IconAppleLogo from '../../assets/icons/IconAppleLogo';
import {colors} from '../../constants/colors';

type Props = {
    onPress: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

export default function AppleLoginButton({onPress, disabled, style}: Props) {
    return (
        <SocialLoginButton
            label="Apple으로 계속하기"
            icon={<IconAppleLogo size={24} color="#FFFFFF" />}
            onPress={onPress}
            disabled={disabled}
            backgroundColor="#000000"
            textColor="#FFFFFF"
            borderColor={colors.border.inverse}
            style={style}
        />
    );
}
