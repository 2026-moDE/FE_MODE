import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing, gap } from '../../constants/spacing';
import { typography } from '../../constants/typography';
// import IconSharedMap from '../../assets/icons/IconSharedMap';   // 공유지도 탭 임시 제외
import IconHome from '../../assets/icons/IconHome';
import IconMyPage from '../../assets/icons/IconMyPage';
import IconExplore from '../../assets/icons/IconExplore';

// 탐색 → 홈 → 마이페이지
const TAB_ORDER = ['Explore', 'Home', 'Mypage'] as const;

const TAB_LABEL: Record<string, string> = {
    Explore: '탐색',
    Home: '홈',
    Mypage: '마이페이지',
};

export default function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    // 현재 화면이 tabBarStyle을 'none'으로 설정했으면 탭바 숨김
    const focusedRoute = state.routes[state.index]; // 현재 화면
    const focusedOptions = descriptors[focusedRoute.key]?.options;
    const tabBarStyle = focusedOptions?.tabBarStyle as { display?: string } | undefined;
    if (tabBarStyle?.display === 'none') {
        return null;
    }

    // iOS 홈 인디케이터 영역(insets.bottom)이 있으면 그걸로 하단 여백을 대체
    const bottomMargin = insets.bottom > 0 ? insets.bottom : 36;

    return (
        <View style={[styles.wrapper, { marginBottom: bottomMargin }]} pointerEvents="box-none">
            <View style={styles.container}>
                {/* 배경 블러는 뒤에 SurfaceView(지도/카메라)가 있을 때 화면 전환과 겹치면
                    그쪽 렌더링을 깨트리는 문제가 있어서 빼고, 반투명 틴트만 남김 */}
                <View style={[StyleSheet.absoluteFill, styles.tint]} />

                <View style={styles.row}>
                {TAB_ORDER.map(name => {
                    // 공유지도는 아직 연결할 화면이 없어서 임시 (지금은 탭에서 제외)
                    // if (name === 'SharedMap') {
                    //     return (
                    //         <TouchableOpacity key="SharedMap" style={styles.tab} onPress={() => {}}>
                    //             <IconSharedMap size={24} color={colors.icon.inverse} active={false} />
                    //             <Text style={styles.label}>{TAB_LABEL.SharedMap}</Text>
                    //         </TouchableOpacity>
                    //     );
                    // }

                    // 지금 탭이 가리키는 화면
                    const route = state.routes.find(r => r.name === name);
                    if (!route) return null;
                    const index = state.routes.indexOf(route);
                    const isFocused = state.index === index;

                    // 탭 누르면 tabPress 이벤트 발생 (이미 활성 탭이어도 발생 → 화면이 감지 가능)
                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true, // 이동 거부권
                        });

                        // preventDefault()호출하면 defaultPrevented는 true
                        // 근데 preventDefault() 호출 따로 안해서 event.defaultPrevented는 항상 false
                        // 현재 화면과 다른 탭을 클릭하면 그 탭 화면으로 이동
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(name);
                        }
                    };

                    const IconComponent = name === 'Explore' ? IconExplore : name === 'Home' ? IconHome : IconMyPage;

                    return (
                        <TouchableOpacity key={route.key} style={styles.tab} onPress={onPress}>
                            <IconComponent size={24} color={colors.icon.inverse} active={isFocused} />
                            <Text style={styles.label}>{TAB_LABEL[name]}</Text>
                        </TouchableOpacity>
                    );
                })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        marginHorizontal: 46,
    },
    container: {
        borderRadius: radius.full,
        overflow: 'hidden',
        // 진짜 inner shadow는 RN에 없어서, Figma의 두 Inner shadow(각각 X/Y ±1, blur 1, 흰색 20%)를
        // 유리 테두리 느낌의 얇은 반투명 흰 테두리 하나로 근사함
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    tint: {
        backgroundColor: colors.background.dimDarker,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: spacing.md,      // 12
        paddingHorizontal: 24,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: gap.xs,
    },
    label: {
        ...typography.c3,
        color: colors.text.inverse,
    },
});
