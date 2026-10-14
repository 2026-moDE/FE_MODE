import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {LegacyFlatList as FlatList} from 'react-native-gesture-handler';
import FastImage from '@d11/react-native-fast-image';
import {Magazine} from '../../api/magazine';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const CARD_W = 120;
const CARD_H = 160;

type Props = {
    magazines: Magazine[];
    onPressItem?: (magazine: Magazine) => void;
};

export default function MagazineSection({magazines, onPressItem}: Props) {
    if (magazines.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>지금 볼 만한 리뷰</Text>
            <FlatList
                data={magazines}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.scroll}
                renderItem={({item}) => (
                    <Pressable style={styles.card} onPress={() => onPressItem?.(item)}>
                        <FastImage
                            source={{uri: item.cover_image_url, priority: FastImage.priority.normal}}
                            style={StyleSheet.absoluteFill}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                        <View style={styles.overlay} />
                        <View style={styles.textWrap}>
                            <Text style={styles.cardTitle}>
                                {item.title}
                            </Text>
                        </View>
                    </Pressable>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    title: {
        ...typography.b3,
        color: colors.text.inverse,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    scroll: {
        paddingHorizontal: spacing.lg,
        gap: gap.sm,
        alignItems: 'center',
    },
    card: {
        width: CARD_W,
        height: CARD_H,
        borderRadius: radius.xl,
        overflow: 'hidden',
        backgroundColor: colors.surface.muted,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    textWrap: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        right: spacing.md,
    },
    cardTitle: {
        ...typography.c1,
        color: colors.text.inverse,
    },
});
