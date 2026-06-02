import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';

// 탭 종류 (current = 실시간, archived = 과거)
export type ReviewTabKey = 'current' | 'archived';

type Props = {
    activeTab: ReviewTabKey;
    onTabChange: (tab: ReviewTabKey) => void;
};

// 탭 라벨 매핑 (key → 한글)
const TAB_LABELS: Record<ReviewTabKey, string> = {
    current:  '실시간',
    archived: '과거',
};

export default function ReviewTabs({activeTab, onTabChange}: Props) {
    // 탭 2개를 배열로 정의 → map으로 렌더링
    const tabs: ReviewTabKey[] = ['current', 'archived'];

    return (
        <View style={styles.container}>
            {tabs.map(tab => {
                const isActive = activeTab === tab;
                return (
                    <Pressable
                        key={tab}
                        onPress={() => onTabChange(tab)}
                        style={styles.tab}>
                        <Text style={[styles.label, isActive && styles.activeLabel]}>
                            {TAB_LABELS[tab]}
                        </Text>
                        {/* 활성 탭만 아래 검은 인디케이터 표시 */}
                        {isActive && <View style={styles.indicator} />}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',                       // 탭 2개 가로 배치
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,   // #E0E0E4 - 비활성 구분선
    },
    tab: {
        flex: 1,                                    // 너비 균등 분할 (50:50)
        alignItems: 'center',
        paddingVertical: spacing.md,                // 12
        position: 'relative',                       // indicator 절대 위치 기준
    },
    label: {
        ...typography.b2,                           // fontSize: 14, bold
        color: colors.text.tertiary,                // #5C5D68 - 비활성 색
    },
    activeLabel: {
        color: colors.text.basic,                   // #111114 - 활성 색 (검정)
    },
    indicator: {
        position: 'absolute',
        bottom: -1,                                 // 컨테이너 border 위로 오게
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: colors.text.basic,         // #111114 - 검은 밑줄
    },
});
