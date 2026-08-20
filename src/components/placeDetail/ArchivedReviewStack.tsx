import React from 'react';
import {View, Text, Pressable, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';

type StackPhoto = {
    image_url: string;
    thumbnail_url?: string | null;
    thumbnail_small_url?: string | null;
};

type Props = {
    reviews: StackPhoto[];   // 최신순 정렬된 과거 리뷰 목록, 비어있으면 빈 카드 스택으로 표시
    onPress: () => void;
    label?: string;
    style?: StyleProp<ViewStyle>;
};


export default function ArchivedReviewStack({reviews, onPress, label = '과거 리뷰 확인하기', style}: Props) {
    const [front, back1, back2] = reviews;

    return (
        <Pressable style={[styles.card, style]} onPress={onPress}>
            <View style={styles.stack}>
                {/* 맨 뒤(왼쪽): 3번째로 최신 리뷰 */}
                {/* transform과 overflow:hidden을 같은 View에 같이 주면 안드로이드에서 자식(이미지)이 클리핑되어 안 보이는 경우가 있어서 회전/이동은 바깥 래퍼가, 라운드 클리핑은 안쪽 카드가 나눠서 맡음 */}
                <View style={styles.back2Wrapper} renderToHardwareTextureAndroid collapsable={false}>
                    <View
                        style={[
                            styles.stackCard,
                            !back2 && {backgroundColor: back1 ? colors.gray[400] : colors.surface.inverse},
                        ]}>
                        {back2 && (
                            <FastImage
                                source={{uri: back2.thumbnail_small_url ?? back2.thumbnail_url ?? back2.image_url}}
                                style={styles.stackImage}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        )}
                    </View>
                </View>

                {/* 뒤(오른쪽): 2번째로 최신 리뷰 */}
                <View style={styles.back1Wrapper} renderToHardwareTextureAndroid collapsable={false}>
                    <View style={[styles.stackCard, !back1 && {backgroundColor: colors.surface.inverse}]}>
                        {back1 && (
                            <FastImage
                                source={{uri: back1.thumbnail_small_url ?? back1.thumbnail_url ?? back1.image_url}}
                                style={styles.stackImage}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        )}
                    </View>
                </View>

                {/* 맨 앞 리뷰 */}
                <View style={styles.frontWrapper}>
                    <View
                        style={[
                            styles.stackCard,
                            styles.front,
                            !front && {backgroundColor: colors.surface.inverse, borderColor: colors.border.inverse},
                        ]}>
                        {front && (
                            <FastImage
                                source={{uri: front.thumbnail_small_url ?? front.thumbnail_url ?? front.image_url}}
                                style={styles.stackImage}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        )}
                    </View>
                </View>
            </View>
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        aspectRatio: 177 / 233,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    stack: {
        width: 90,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // 회전/이동(transform) 담당 — 클리핑(overflow)과 분리해야 안드로이드에서 자식 이미지가 사라지지 않음
    back2Wrapper: {
        position: 'absolute',
        width: 70,
        height: 92,
        transform: [{rotate: '-10deg'}, {translateX: -20}, {translateY: -30}],
    },
    back1Wrapper: {
        position: 'absolute',
        width: 70,
        height: 92,
        transform: [{rotate: '10deg'}, {translateX: 20}, {translateY: -20}],
    },
    frontWrapper: {
        position: 'absolute',
        width: 70,
        height: 92,
    },
    // 라운드 클리핑 담당
    stackCard: {
        width: '100%',
        height: '100%',
        borderRadius: radius.md,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: colors.border.inverse,
    },
    stackImage: {
        width: '100%',
        height: '100%',
    },
    front: {
        backgroundColor: colors.surface.muted,
        borderColor: colors.surface.muted,
    },
    label: {
        ...typography.c2,
        color: colors.text.inverse,
        textAlign: 'center',
    },
});
