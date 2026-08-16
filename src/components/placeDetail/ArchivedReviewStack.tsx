import React from 'react';
import {View, Text, Pressable, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import FastImage from 'react-native-fast-image';
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
    reviews: StackPhoto[];   // 최신순 정렬된 과거 리뷰 목록, 최소 1개 이상이어야 함
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
                <View
                    style={[
                        styles.stackCard,
                        styles.back2,
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

                {/* 뒤(오른쪽): 2번째로 최신 리뷰 */}
                <View style={[styles.stackCard, styles.back1, !back1 && {backgroundColor: colors.surface.inverse}]}>
                    {back1 && (
                        <FastImage
                            source={{uri: back1.thumbnail_small_url ?? back1.thumbnail_url ?? back1.image_url}}
                            style={styles.stackImage}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    )}
                </View>

                {/* 맨 앞 리뷰 */}
                <View style={[styles.stackCard, styles.front]}>
                    <FastImage
                        source={{uri: front.thumbnail_small_url ?? front.thumbnail_url ?? front.image_url}}
                        style={styles.stackImage}
                        resizeMode={FastImage.resizeMode.cover}
                    />
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
    stackCard: {
        position: 'absolute',
        width: 70,
        height: 92,
        borderRadius: radius.md,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: colors.border.inverse,
    },
    stackImage: {
        width: '100%',
        height: '100%',
    },
    back2: {
        transform: [{rotate: '-10deg'}, {translateX: -20}, {translateY: -30}],
    },
    back1: {
        transform: [{rotate: '10deg'}, {translateX: 20}, {translateY: -20}],
    },
    front: {
        backgroundColor: colors.surface.muted,
        borderColor: colors.surface.muted,
    },
    label: {
        ...typography.c2,
        color: colors.text.disabled,
        textAlign: 'center',
    },
});
