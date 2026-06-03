import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {CATEGORY_LABEL, PlaceDetail} from '../../types/place';
import IconBellOff from '../../assets/icons/IconBellOff';
import IconBellOn from '../../assets/icons/IconBellOn';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import IconClock from '../../assets/icons/IconClock';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {radius} from '../../constants/radius';

type Props = {
    place: PlaceDetail;
    distance?: string;                       // "내 위치에서 210m" 등 (선택)
    onToggleSubscribe?: () => void;          // 알림 토글 콜백 (선택)
};

export default function PlaceDetailInfo({
    place,
    distance,
    onToggleSubscribe,
}: Props) {
    const {name, address, category, business_hours, is_subscribed} = place;
    const categoryLabel = CATEGORY_LABEL[category] ?? category;

    return (
        <View style={styles.container}>
            {/* 상단: 카테고리 태그 + 장소명 + 알림 아이콘 */}
            <View style={styles.headerRow}>
                <View style={styles.titleGroup}>
                    <View style={styles.categoryTag}>
                        <Text style={styles.categoryText}>{categoryLabel}</Text>
                    </View>
                    <Text style={styles.placeName}>{name}</Text>
                </View>

                {/* 알림 토글 버튼 */}
                <Pressable
                    onPress={onToggleSubscribe}
                    hitSlop={8}
                    style={styles.bellWrapper}>
                    {is_subscribed ? (
                        <IconBellOn size={24} color={colors.icon.basic} />
                    ) : (
                        <IconBellOff size={24} color={colors.icon.tertiary} />
                    )}
                </Pressable>
            </View>

            {/* 정보 영역 */}
            <View style={styles.infoGroup}>
                {/* 주소 + 거리 (짧으면 한 줄, 길면 거리만 다음 줄로 자동) */}
                <View style={styles.infoRow}>
                    <IconPlaceLocation size={24} color={colors.icon.subtle} />
                    <View style={styles.addressBlock}>
                        <Text style={styles.addressText}>{address}</Text>
                        {distance && <Text style={styles.distanceText}>{distance}</Text>}
                    </View>
                </View>

                {/* 영업 시간 */}
                <View style={styles.infoRow}>
                    <IconClock size={24} color={colors.icon.subtle} />
                    <Text style={styles.businessText}>{business_hours}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,    // 16
        paddingVertical: spacing.lg,      // 16
        gap: spacing.md,                  // 12
        // 배경색 X (부모 화면의 흰 배경 사용)
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,                  // 16
        flex: 1,
    },
    categoryTag: {
        backgroundColor: colors.button.primaryLighter,   // #E1E9FF
        paddingHorizontal: spacing.s,                    // 8
        paddingVertical: spacing.xs,                     // 4
        borderRadius: radius.md,                         // 8
    },
    categoryText: {
        ...typography.b3,                                // fontSize: 12, bold
        color: colors.text.brand,                        // #6489F2
        letterSpacing: -0.06,
    },
    placeName: {
        ...typography.h1,                                // fontSize: 24, bold
        color: colors.text.basic,                        // #111114
        letterSpacing: -0.36,
        flexShrink: 1,
    },
    bellWrapper: {
        width: spacing['2xl'],                           // 24
        height: spacing['2xl'],                          // 24
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoGroup: {
        gap: spacing.xs,                                 // 4
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',                        // wrap 됐을 때 아이콘 위 정렬
        gap: spacing.md,                                 // 12
    },
    addressBlock: {
        flex: 1,                                         // 남은 공간 다 차지
        flexDirection: 'row',                            // 주소 + 거리 가로 배치
        flexWrap: 'wrap',                                // 안 들어가면 거리만 다음 줄로
        alignItems: 'center',
        columnGap: spacing.s,                            // 8 (같은 줄일 때 간격)
        rowGap: 2,                                       // 줄바꿈됐을 때 위아래 간격
    },
    addressText: {
        ...typography.b2,                                // fontSize: 14
        color: colors.text.subtle,                       // #4B566D
        fontWeight: '400',
        letterSpacing: -0.07,
    },
    distanceText: {
        ...typography.b2,                                // fontSize: 14
        color: colors.text.brand,                        // #6489F2
        letterSpacing: -0.07,
    },
    businessText: {
        ...typography.b2,                                // fontSize: 14
        color: colors.text.subtle,                       // #4B566D
        fontWeight: '400',
        letterSpacing: -0.07,
    },
});
