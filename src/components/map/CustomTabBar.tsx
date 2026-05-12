import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const TAB_LABELS: Record<string, string> = {
    Home: '홈',
    Review: '리뷰 쓰기',
    Mypage: '마이페이지',
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {state.routes.map((route, index) => {
                    const isActive = state.index === index;
                    const label = TAB_LABELS[route.name] ?? route.name;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={[styles.tab, isActive && styles.activeTab]}
                            onPress={() => navigation.navigate(route.name)}
                        >
                            <Text style={[styles.label, isActive && styles.activeLabel]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 1000,
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 4,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 1000,
    },
    activeTab: {
        backgroundColor: colors.brand.primary,  // #83A6FF
    },
    label: {
        ...typography.b4,
        color: colors.text.inverse,             // #FFFFFF
    },
    activeLabel: {
        ...typography.b3,
        color: colors.text.inverse,
    },
});
