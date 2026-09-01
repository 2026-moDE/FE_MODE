import React from 'react';
import {View, Image, Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IconSearch from '../../assets/icons/IconSearch';
import IconMapBell from '../../assets/icons/IconMapBell';
import {colors} from '../../constants/colors';
import {gap, padding} from '../../constants/spacing';

const LOGO = require('../../assets/image/logo_new.png');

type Props = {
    // 상태바 높이만큼 콘텐츠(로고/아이콘)를 아래로 내림 - 그라디언트 자체는 화면 맨 위(상태바 뒤)부터 시작
    insetTop?: number;
    onPressSearch?: () => void;
    onPressBell?: () => void;
    hasUnreadNotification?: boolean;
};

export default function HomeHeader({insetTop = 0, onPressSearch, onPressBell, hasUnreadNotification = false}: Props) {
    return (
        <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
            style={[styles.wrapper, {height: insetTop + 96}]}
            pointerEvents="box-none">
            <View style={[styles.row, {paddingTop: insetTop + padding.lg}]}>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />

                <View style={styles.actions}>
                    <Pressable onPress={onPressSearch} hitSlop={8}>
                        <IconSearch size={24} color={colors.icon.inverse} />
                    </Pressable>
                    {/* bell png는 64x64 캔버스 안에서 가로 75%만 채우는 형태라, search(꽉 찬 정사각형)랑 같은 24로 두면 더 작아 보여서 살짝 키움 */}
                    <IconMapBell size={30} onPress={onPressBell} showBadge={hasUnreadNotification} />
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    row: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: padding['2xl'],  // 24
        paddingBottom: padding.lg,          // 16
    },
    logo: {
        width: 48,
        height: 30,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap['2xl'],
    },
});
