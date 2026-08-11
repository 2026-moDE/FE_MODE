import React from 'react';
import {View, Text, Image, Pressable, TouchableOpacity, StyleSheet} from 'react-native';
import {CATEGORY_LABEL, CongestionLevel, PlaceDetail} from '../../types/place';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconBellOff from '../../assets/icons/IconBellOff';
import IconBellOn from '../../assets/icons/IconBellOn';
import IconClock from '../../assets/icons/IconClock';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import {colors} from '../../constants/colors';
import {gap, padding} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {radius} from '../../constants/radius';

const crowdIcon = require('../../assets/image/crowd.png');

// 혼잡도 레벨 → 한글 레이블
const CONGESTION_LABEL: Record<CongestionLevel, string> = {
    LOW:      '여유',
    MEDIUM:   '보통',
    MODERATE: '보통',
    HIGH:     '혼잡',
    CROWDED:  '혼잡',
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
        ? CONGESTION_LABEL[congestion_level] ?? congestion_level
        : '집계중';

    return (
        <View style={styles.container}>
            {/* 상단: 뒤로가기 + 장소명 + 알림 아이콘 */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={10}>
                    <IconArrowLeft size={21} color={colors.icon.inverse} />
                </TouchableOpacity>

                <Text style={styles.placeName} numberOfLines={1}>
                    {name}
                </Text>

                {/* 알림 토글 버튼 */}
                <Pressable
                    onPress={onToggleSubscribe}
                    hitSlop={8}
                    style={styles.bellWrapper}>
                    {is_subscribed ? (
                        <IconBellOn size={24} color={colors.icon.inverse} />
                    ) : (
                        <IconBellOff size={24} color={colors.icon.tertiary} />
                    )}
                </Pressable>
            </View>

            {/* 정보 영역 */}
            <View style={styles.infoGroup}>
                {/* 주소 + 거리 */}
                <View style={styles.infoRow}>
                    <IconPlaceLocation size={22} color={colors.icon.tertiary} />
                    <View style={styles.addressWrapper}>
                        <Text style={styles.addressText}>{address}</Text>
                        {/* {distance && <Text style={styles.distanceText}>{distance}</Text>} */}
                    </View>
                </View>

                {/* 혼잡도 */}
                <View style={styles.infoRow}>
                    <Image source={crowdIcon} style={styles.crowdIcon} resizeMode="contain" />
                    <Text style={styles.congestionText}>
                        혼잡도 <Text style={styles.congestionLevel}>{congestionLabel}</Text>
                    </Text>
                </View>

                {/* 영업 시간 */}
                {/* <View style={styles.infoRow}>
                    <IconClock size={24} color={colors.icon.subtle} />
                    <Text style={styles.businessText}>{business_hours}</Text>
                </View> */}
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
    infoGroup: {
        gap: gap.xs,                                 // 4
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: gap.md,                                 // 12
    },
    addressWrapper: {
        flex: 1,
    },
    addressText: {
        ...typography.b6,                                // fontSize: 14
        color: colors.text.disabled,                     // #C4C4C8
        fontWeight: '400',
        letterSpacing: -0.07,
    },
    crowdIcon: {
        width: 24,
        height: 24,
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
