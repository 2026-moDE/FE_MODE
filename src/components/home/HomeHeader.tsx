import React from 'react';
import {View, Image, Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IconMapBell from '../../assets/icons/IconMapBell';
import {gap, padding} from '../../constants/spacing';

const LOGO = require('../../assets/image/logo_new.png');
const SEARCH_ICON = require('../../assets/image/search_white.png');

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
                        <Image source={SEARCH_ICON} style={styles.searchIcon} resizeMode="contain" />
                    </Pressable>
                    <IconMapBell size={24} onPress={onPressBell} showBadge={hasUnreadNotification} />
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
    searchIcon: {
        width: 24,
        height: 24,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap['2xl'],
    },
});
