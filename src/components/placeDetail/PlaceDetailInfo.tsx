import React from 'react';
import {View, Text, Image, Pressable, TouchableOpacity, StyleSheet} from 'react-native';
import {CATEGORY_LABEL, CongestionLevel, PlaceDetail} from '../../types/place';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconClock from '../../assets/icons/IconClock';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import {colors} from '../../constants/colors';
import {gap, padding} from '../../constants/spacing';
import {typography} from '../../constants/typography';

const crowdIcon = require('../../assets/image/crowd.png');
const notificationOnIcon = require('../../assets/image/notification_on.png');
const notificationOffIcon = require('../../assets/image/notification_off.png');

// 혼잡도 레벨 → 한글 레이블
// CONGESTION_LABEL('한산해요' 등)은 문장형이라, 칩에는 짧은 형태로 표시
const CONGESTION_SHORT_LABEL: Record<CongestionLevel, string> = {
    RELAXED:      '여유',
    MODERATE:     '보통',
    CROWDED:      '혼잡',
    VERY_CROWDED: '매우 혼잡',
};

type Props = {
    place: PlaceDetail;
    distance?: string;
    onBack: () => void;
    onToggleSubscribe?: () => void;
};

export default function PlaceDetailInfo({
    place,
    distance,
    onBack,
    onToggleSubscribe,
}: Props) {
    const {name, address, category, business_hours, is_subscribed, congestion_level} = place;
    const categoryLabel = CATEGORY_LABEL[category] ?? category;
    const congestionLabel = congestion_level
        ? CONGESTION_SHORT_LABEL[congestion_level] ?? congestion_level
        : '집계중';

    return (
        <View style={styles.container}>
            {/* 상단: 뒤로가기 + 장소명 + 알림 아이콘 */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={10}>
                    <IconArrowLeft size={21} color={colors.icon.inverse} />
                </TouchableOpacity>

                <Text style={styles.placeName}>
                    {name}
                </Text>

                {/* 알림 토글 버튼 */}
                <Pressable
                    onPress={onToggleSubscribe}
                    hitSlop={8}
                    style={styles.bellWrapper}>
                    {is_subscribed ? (
                        <Image source={notificationOnIcon} style={styles.bellIcon} resizeMode="contain" />
                    ) : (
                        <Image source={notificationOffIcon} style={styles.bellIcon} resizeMode="contain" />
                    )}
                </Pressable>
            </View>

            {/* 정보 영역: 주소 + 혼잡도 한 줄 */}
            <View style={styles.infoRow}>
                <View style={styles.addressGroup}>
                    <IconPlaceLocation size={22} color={colors.icon.tertiary} />
                    <Text style={styles.addressText}>{address}</Text>
                    {/* {distance && <Text style={styles.distanceText}>{distance}</Text>} */}
                </View>

                <View style={styles.congestionGroup}>
                    <Image source={crowdIcon} style={styles.crowdIcon} resizeMode="contain" />
                    <Text style={styles.congestionText}>혼잡도</Text>
                    <Text style={styles.congestionLevel}>{congestionLabel}</Text>
                </View>

                {/* 영업 시간 */}
                {/* <IconClock size={24} color={colors.icon.subtle} />
                <Text style={styles.businessText}>{business_hours}</Text> */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background.dark,
        paddingHorizontal: padding.lg,    // 16
        paddingVertical: padding.lg,      // 16
        gap: gap.md,                  // 12
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.md,                  // 12
    },
    backButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeName: {
        ...typography.h3,                                // fontSize: 20, bold
        color: colors.text.inverse,                       // #FFFFFF
        letterSpacing: -0.3,
        flex: 1,
        textAlign: 'center',
    },
    bellWrapper: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bellIcon: {
        width: 24,
        height: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: gap.md,                                 // 12
    },
    addressGroup: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: gap.xs,                                 // 4 - 핀 아이콘 ↔ 주소
        flex: 1,
    },
    addressText: {
        ...typography.b6,                                // fontSize: 14
        color: colors.text.disabled,                     // #C4C4C8
        fontWeight: '400',
        letterSpacing: -0.07,
        flex: 1,
    },
    crowdIcon: {
        width: 24,
        height: 24,
        flexShrink: 0,
    },
    congestionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.xs,                                 // 4 - 혼잡도 아이콘 ↔ "혼잡도" ↔ "보통"
        flexShrink: 0,
    },
    congestionText: {
        ...typography.b6,                                // fontSize: 14
        color: colors.text.disabled,                     // #C4C4C8
        fontWeight: '400',
        letterSpacing: -0.07,
    },
    congestionLevel: {
        color: colors.text.brand,                        // #FFFD6D
        fontWeight: '700',
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
