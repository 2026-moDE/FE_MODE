import React from 'react';
import {View, Text, ImageBackground, StyleSheet, ScrollView, Pressable} from 'react-native';
import {CATEGORY_LABEL, PlaceDetail} from '../../types/place';
import IconBellOff from '../../assets/icons/IconBellOff';
import IconBellOn from '../../assets/icons/IconBellOn';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import IconClock from '../../assets/icons/IconClock';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import {typography} from '../../constants/typography';

// 컴포넌트 Props 타입
type HomeMiniCardProps = {
    place: PlaceDetail;
    distance?: string;
    images?: string[];
    onToggleSubscribe?: () => void;     // 알림 토글 핸들러
    onPress?: () => void;
};

export default function HomeMiniCard({
    place,
    distance,
    images = [],
    onToggleSubscribe,
    onPress,
}: HomeMiniCardProps) {
    const {name, address, category, business_hours, is_subscribed} = place;
    const categoryLabel = CATEGORY_LABEL[category] ?? category;

    // 나중에 핸들러로 바꾸기!! 넘 더러움 지금
    return (
        <View style={styles.container}>
            {/* 상단: 카테고리 태그 + 장소명 + 알림 */}
            <Pressable onPress={onPress}>
                <View style={styles.headerRow}>
                    <View style={styles.titleGroup}>
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryText}>{categoryLabel}</Text>
                        </View>
                        <Text style={styles.placeName} numberOfLines={2} ellipsizeMode="tail">{name}</Text>
                    </View>
                    {/* 벨은 내부 Pressable로 따로 (네비게이션 안 됨, 토글만) */}
                    <Pressable
                        style={styles.bellWrapper}
                        onPress={onToggleSubscribe}
                        hitSlop={8}>
                        {is_subscribed ? (
                            <IconBellOn size={24} color={colors.icon.basic} />
                        ) : (
                            <IconBellOff size={24} color={colors.icon.tertiary} />
                        )}
                    </Pressable>
                </View>
            </Pressable>

            {/* 주소 + 거리 + 영업 시간 */}
            <Pressable onPress={onPress}>
                <View style={styles.infoGroup}>
                    {/* 주소 행 */}
                    <View style={styles.infoRow}>
                        <IconPlaceLocation size={24} color={colors.icon.subtle} />
                        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">{address}</Text>
                        <Text style={styles.distanceText} numberOfLines={1}>{distance}</Text>
                    </View>

                    {/* 영업 시간 행 */}
                    <View style={styles.infoRow}>
                        <IconClock size={24} color={colors.icon.subtle} />
                        <Text style={styles.businessText}>{business_hours}</Text>
                    </View>
                </View>
            </Pressable>

            {/* 하단: 이미지 슬롯 (ScrollView는 Pressable 밖에 두기) */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}>
                {images.length > 0 ? (
                    images.map((uri, index) => (
                        // 각 이미지를 Pressable로 감쌈: 탭 → 네비, 드래그 → ScrollView 스크롤
                        <Pressable key={index} onPress={onPress}>
                            <ImageBackground
                                style={styles.imageSlot}
                                source={{uri}}
                                imageStyle={styles.imageRadius}
                                resizeMethod="resize"
                            />
                        </Pressable>
                    ))
                ) : (
                    // 이미지 없을 때 빈 슬롯 3개 표시
                    [0, 1, 2].map(i => <View key={i} style={styles.imagePlaceholder} />)
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 369,
        backgroundColor: colors.surface.white,
        borderRadius: radius['2xl'],        // 20
        padding: spacing.lg,                // 16
        gap: spacing.md,                    // 12
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,                    // 16
        flex: 1,
    },
    categoryTag: {
        backgroundColor: colors.button.primaryLighter,  // #E1E9FF
        paddingHorizontal: spacing.s,       // 8
        paddingVertical: spacing.xs,        // 4
        borderRadius: radius.md,            // 8
    },
    categoryText: {
        ...typography.b3,                   // fontSize: 12, bold
        color: colors.text.brand,           // #6489F2
        letterSpacing: -0.06,
    },
    placeName: {
        ...typography.h1,                   // fontSize: 24, bold
        color: colors.text.basic,           // #111114
        letterSpacing: -0.36,
        flexShrink: 1,
    },
    bellWrapper: {
        width: spacing['2xl'],              // 24
        height: spacing['2xl'],             // 24
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoGroup: {
        gap: spacing.xs,                    // 4
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,                    // 12
    },
    addressText: {
        ...typography.b2,                   // fontSize: 14
        color: colors.text.subtle,          // #4B566D
        fontWeight: '400',
        letterSpacing: -0.07,
        flexShrink: 1,                      // 주소 길면 줄어들어서 거리 보장
    },
    distanceText: {
        ...typography.b2,                   // fontSize: 14
        color: colors.text.brand,           // #6489F2
        letterSpacing: -0.07,
        flexShrink: 0,                      // 거리는 절대 안 줄어듦
    },
    businessText: {
        ...typography.b2,                   // fontSize: 14
        color: colors.text.subtle,          // #4B566D
        fontWeight: '400',
        letterSpacing: -0.07,
    },
    imageRow: {
        flexDirection: 'row',
        gap: spacing.s,                     // 8
    },
    imageSlot: {
        width: 130,
        height: 130,
    },
    imageRadius: {
        borderRadius: radius.xl,            // 16
    },
    imagePlaceholder: {
        width: 130,
        height: 130,
        backgroundColor: colors.surface.muted,  // #E0E0E4
        borderRadius: radius.xl,            // 16
    },
});
