import React from 'react';
import {View, Image, Pressable, StyleSheet, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IconMapBell from '../../assets/icons/IconMapBell';
import {gap, padding} from '../../constants/spacing';

const LOGO = require('../../assets/image/logo_new.png');
const SEARCH_ICON = require('../../assets/image/search_white.png');

// iOS는 노치/다이나믹 아일랜드 기기에서 insets.top에 여유분을 이미 얹어서 보고함(아일랜드는 59pt보다
// 위에서 끝남). 안드로이드 insets.top은 상태바 높이 그대로라, 같은 값을 더하면 iOS만 간격이 벌어짐.
// 인셋이 큰 iOS 기기에서만 그 여유분을 덜어내서 두 플랫폼의 시각적 간격을 맞춤.
const IOS_LARGE_INSET = 50;
const IOS_INSET_TRIM = 12;

export function trimInset(insetTop: number) {
    return Platform.OS === 'ios' && insetTop >= IOS_LARGE_INSET ? insetTop - IOS_INSET_TRIM : insetTop;
}

type Props = {
    // 상태바 높이만큼 콘텐츠(로고/아이콘)를 아래로 내림 - 그라디언트 자체는 화면 맨 위(상태바 뒤)부터 시작
    insetTop?: number;
    onPressSearch?: () => void;
    onPressBell?: () => void;
    hasUnreadNotification?: boolean;
};

export default function HomeHeader({insetTop = 0, onPressSearch, onPressBell, hasUnreadNotification = false}: Props) {
    // row가 flex: 1이라 paddingTop만 줄이면 남는 공간에서 중앙 정렬돼 절반만 올라감 - 높이도 같이 줄여야 함
    const top = trimInset(insetTop);

    return (
        <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
            style={[styles.wrapper, {height: top + 96}]}
            pointerEvents="box-none">
            <View style={[styles.row, {paddingTop: top + padding.lg}]}>
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
