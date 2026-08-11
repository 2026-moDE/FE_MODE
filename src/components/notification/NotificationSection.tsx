import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Notification} from '../../types/notifications';
import NotificationCard from './NotificationCard';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';

type Props = {
    label: string;   // "오늘", "어제", "이전"
    items: Notification[];
    onPressItem?: (id: number) => void;
};

export default function NotificationSection({label, items, onPressItem}: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            {items.map(item => (
                <NotificationCard key={item.id} item={item} onPress={onPressItem} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface.white,
        paddingTop: spacing.lg,
    },
    label: {
        ...typography.c2,
        color: colors.text.tertiary,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.s,
    },
});
