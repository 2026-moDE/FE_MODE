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
    // 스와이프로 열려있는 알림 id (한 번에 하나만 열려있게)
    openId: number | null;
    onOpenChange: (id: number | null) => void;
    onDelete: (id: number) => void;
};

export default function NotificationSection({label, items, onPressItem, openId, onOpenChange, onDelete}: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            {items.map(item => (
                <NotificationCard
                    key={item.id}
                    item={item}
                    isOpen={openId === item.id}
                    onOpenChange={isOpen => onOpenChange(isOpen ? item.id : null)}
                    onPress={onPressItem}
                    onDelete={onDelete}
                />
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
