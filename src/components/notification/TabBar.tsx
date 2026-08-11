import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';

export type Tab = 'notification' | 'place';

const TABS: {key: Tab; label: string}[] = [
    {key: 'notification', label: '알림'},
    {key: 'place', label: '장소 설정'},
];

type Props = {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
};

export default function TabBar({activeTab, onTabChange}: Props) {
    return (
        <View style={styles.tabBar}>
            {TABS.map(({key, label}) => (
                <Pressable
                    key={key}
                    style={[styles.tab, activeTab === key && styles.tabActive]}
                    onPress={() => onTabChange(key)}>
                    <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                        {label}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        marginBottom: -1,
    },
    tabActive: {
        borderBottomColor: colors.text.basic,
    },
    tabText: {
        ...typography.b6,
        color: colors.text.disabled,
    },
    tabTextActive: {
        ...typography.b5,
        color: colors.text.basic,
    },
});
