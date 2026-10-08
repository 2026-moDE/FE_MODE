import React from 'react';
import {View, Text, Image, ImageBackground, StyleSheet, ScrollView, Pressable} from 'react-native';
import {CATEGORY_LABEL, PlaceDetail} from '../../types/place';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import IconClock from '../../assets/icons/IconClock';
import {colors} from '../../constants/colors';
import {spacing, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import {typography} from '../../constants/typography';

const emptyThumbnail = require('../../assets/image/empty_minicard.png');

// 컴포넌트 Props 타입
type HomeMiniCardProps = {
    place: PlaceDetail;
    distance?: string;
    images?: string[];
    onPress?: (imageIndex?: number) => void;    // 카드 클릭 (imageIndex 있으면 그 사진 기준)
};

export default function HomeMiniCard({
    place,
    distance,
    images = [],
    onPress,
}: HomeMiniCardProps) {
    const {name, address, category, business_hours} = place;
    const categoryLabel = CATEGORY_LABEL[category] ?? category;

    // 나중에 핸들러로 바꾸기!! 넘 더러움 지금
    return (
        <View style={styles.container}>
            <Pressable onPress={() => onPress?.()}>
                <View style={styles.titleGroup}>
                    <View style={styles.categoryTag}>
                        <Text style={styles.categoryText}>{categoryLabel}</Text>
                    </View>
                    <Text style={styles.placeName} numberOfLines={2} ellipsizeMode="tail">{name}</Text>
                </View>
            </Pressable>

            {/* 주소 + 거리 + 영업 시간 */}
            <Pressable onPress={() => onPress?.()}>
                <View style={styles.infoGroup}>
                    {/* 주소 행 */}
                    <View style={styles.infoRow}>
                        <IconPlaceLocation size={22} color={colors.icon.tertiary} />
                        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">{address}</Text>
                        <Text style={styles.distanceText} numberOfLines={1}>{distance}</Text>
                    </View>

                    {/* 영업 시간 행 (우선 주석) */}
                    {/* <View style={styles.infoRow}>
                        <IconClock size={24} color={colors.icon.subtle} />
                        <Text style={styles.businessText}>{business_hours}</Text>
                    </View> */}
                </View>
            </Pressable>

            {/* 하단: 이미지 슬롯 (ScrollView는 Pressable 밖에 두기) */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}>
                {images.length > 0 ? (
                    images.map((uri, index) => (
                        // 각 이미지를 Pressable로 감쌈: 탭 → 네비(인덱스 전달), 드래그 → ScrollView 스크롤
                        <Pressable key={index} onPress={() => onPress?.(index)}>
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
                    [0, 1, 2].map(i => (
                        <Image key={i} source={emptyThumbnail} style={styles.imagePlaceholder} resizeMode="cover" />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 369,
        backgroundColor: colors.surface.inverse,
        borderRadius: radius['2xl'],        // 20
        padding: spacing.lg,                // 16
        gap: spacing.md,                    // 12
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'flex-start',    // 제목 2줄로 넘어가면 카테고리 태그는 첫 줄 높이에 맞춰 위쪽 정렬
        gap: spacing.lg,
        width: '100%',                // 폭을 명확히 고정해야 placeName이 안 넘치고 줄바꿈됨
    },
    categoryTag: {
        backgroundColor: colors.button.primaryFill,
        paddingHorizontal: spacing.s,
        paddingVertical: spacing.xs,
        borderRadius: radius.md,
        borderWidth:1.5,
        borderColor: colors.border.brand,
        overflow: 'hidden',        // 테두리 모서리도 borderRadius만큼 둥글게
    },
    categoryText: {
        ...typography.c1,              
        color: colors.text.brandDarker,           
        letterSpacing: -0.06,
    },
    placeName: {
        ...typography.b1,                 
        color: colors.text.inverse,         
        letterSpacing: -0.36,
        flexShrink: 1,
    },
    infoGroup: {
        gap: spacing.xs,                  
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.xs,                        // 4 (핀아이콘 ↔ 주소)
    },
    addressText: {
        ...typography.b6,                 
        color: colors.text.disabled,        
        fontWeight: '400',
        letterSpacing: -0.07,
        flexShrink: 1,                      // 주소 길면 줄어들어서 거리 보장
    },
    distanceText: {
        ...typography.b5,
        color: colors.text.brand,
        letterSpacing: -0.07,
        flexShrink: 0,                      // 거리는 절대 안 줄어듦
        marginLeft: gap.md - gap.xs,        // row gap(4)에 8 더해서 총 gap-md(12) 맞춤 (주소 ↔ 거리)
    },
    businessText: {
        ...typography.b2,                   
        color: colors.text.subtle,        
        fontWeight: '400',
        letterSpacing: -0.07,
    },
    imageRow: {
        flexDirection: 'row',
        gap: spacing.s,                     
    },
    imageSlot: {
        width: 130,
        height: 130,
    },
    imageRadius: {
        borderRadius: radius.xl,           
    },
    imagePlaceholder: {
        width: 130,
        height: 130,
        backgroundColor: colors.surface.muted, 
        borderRadius: radius.xl,           
    },
});
