import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {typography} from '../../constants/typography';

// 지도 버블에 어떤 리뷰를 보여줄지
// 'all'     = 실시간 + 과거 리뷰가 달린 모든 장소
// 'current' = 실시간 리뷰가 달린 장소만
export type BubbleFilter = 'all' | 'current';

const OPTIONS: {value: BubbleFilter; label: string}[] = [
    {value: 'all', label: '전체'},
    {value: 'current', label: '최근'},
];

type Props = {
    value: BubbleFilter;
    onChange: (value: BubbleFilter) => void;
};

export default function BubbleFilterToggle({value, onChange}: Props) {
    return (
        <View style={styles.container}>
            {OPTIONS.map(option => {
                const isSelected = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        style={[styles.segment, isSelected && styles.segmentSelected]}
                        hitSlop={4}
                        onPress={() => onChange(option.value)}>
                        <Text style={[styles.label, isSelected && styles.labelSelected]}>
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        padding: 3,
        borderRadius: radius.full,
        backgroundColor: colors.surface.white,
        // 지도 위에 떠 있어서 배경과 구분되게 그림자를 줌
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 2},
        elevation: 3,
    },
    segment: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: radius.full,
    },
    segmentSelected: {
        backgroundColor: colors.surface.inverse,
    },
    label: {
        ...typography.c1,
        color: colors.text.tertiary,
    },
    labelSelected: {
        color: colors.text.inverse,
    },
});
