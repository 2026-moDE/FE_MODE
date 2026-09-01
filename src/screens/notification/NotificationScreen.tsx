import React, {useEffect, useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {View, ScrollView, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppStackParamList} from '../../types/navigation';
import Header from '../../components/common/Header';
import NotificationSection from '../../components/notification/NotificationSection';
import SubscriptionCard from '../../components/notification/SubscriptionCard';
import {Notification, Subscription} from '../../types/notifications';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import TabBar, {Tab} from '../../components/notification/TabBar';
import SubscriptionBanner from '../../components/notification/SubscriptionBanner';
import {fetchNotifications, fetchSubscriptions, readNotification} from '../../api/notification';
import {subscribe, unsubscribe} from '../../api/place';

type Props = NativeStackScreenProps<AppStackParamList, 'Notification'>;

function getDateLabel(createdAt: string): '오늘' | '어제' | '이전' {
    const now = new Date();
    const date = new Date(createdAt);
    const diffDay = Math.floor(
        (now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
    );
    if (diffDay === 0) return '오늘';
    if (diffDay === 1) return '어제';
    return '이전';
}

export default function NotificationScreen({navigation}: Props) {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<Tab>('notification');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [places, setPlaces] = useState<Subscription[]>([]);
    const [openPlaceId, setOpenPlaceId] = useState<number | null>(null);

    useEffect(() => {
        fetchNotifications()
            .then(res => setNotifications(res.notifications ?? []))
            .catch(err => console.warn('알림 조회 실패:', err?.message));
    }, []);

    useFocusEffect(useCallback(() => {
        fetchSubscriptions()
            .then(res => {
                console.log('구독 응답:', JSON.stringify(res));
                setPlaces(res.subscriptions ?? []);
            })
            .catch(err => console.warn('구독 장소 조회 실패:', err?.message));
    }, []));

    // 알림 누를 때 화면 이동
    const handleNotificationPress = useCallback((id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
        readNotification(id).catch(err => console.warn('알림 읽음 처리 실패:', err?.message));
        const target = notifications.find(n => n.id === id);
        if (!target) return;

        // 친구 요청/수락 알림
        if (target.type === 'FRIEND_REQUEST' || target.type === 'FRIEND_ACCEPT') {
            navigation.navigate('FollowList', {
                initialTab: target.type === 'FRIEND_REQUEST' ? 'requests' : 'friends',
            });
            return;
        }

        // 리뷰 관련 알림 - 댓글 알림이면 댓글 모달, 반응 알림이면 반응 목록 자동으로
        navigation.navigate('PlaceDetail', {
            placeId: target.place.id,
            placeName: target.place.name,
            reviewId: target.review_id,
            notificationAction:
                target.type === 'COMMENT' ? 'chat' :
                target.type === 'REACTION' ? 'reactions' :
                undefined,
        });
    }, [notifications, navigation]);

    // 장소 설정 카드 스와이프 후 "삭제" - 목록에서 바로 제거하고 구독도 취소
    const handleDeleteSubscription = useCallback((placeId: number) => {
        setPlaces(prev => prev.filter(p => p.place.id !== placeId));
        unsubscribe(placeId).catch(err => console.warn('구독 취소 실패:', err?.message));
    }, []);

    const today = notifications.filter(n => getDateLabel(n.created_at) === '오늘');
    const yesterday = notifications.filter(n => getDateLabel(n.created_at) === '어제');
    const before = notifications.filter(n => getDateLabel(n.created_at) === '이전');

    const activeCount = places.filter(p => p.is_active).length;

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={[styles.header, {paddingTop: insets.top}]}>
                <Header title="알림" onBack={() => navigation.goBack()} />

                {/* 탭 */}
                <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </View>

            {/* 알림 탭 */}
            {activeTab === 'notification' && (
                <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
                    {today.length > 0 && (
                        <NotificationSection label="오늘" items={today} onPressItem={handleNotificationPress} />
                    )}
                    {yesterday.length > 0 && (
                        <View style={styles.sectionGap}>
                            <NotificationSection label="어제" items={yesterday} onPressItem={handleNotificationPress} />
                        </View>
                    )}
                    {before.length > 0 && (
                        <View style={styles.sectionGap}>
                            <NotificationSection label="이전" items={before} onPressItem={handleNotificationPress} />
                        </View>
                    )}
                </ScrollView>
            )}

            {/* 장소 설정 탭 */}
            {activeTab === 'place' && (
                <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
                    <SubscriptionBanner count={activeCount} />

                    {places.map(place => (
                        <SubscriptionCard
                            key={place.id}
                            place={place}
                            isOpen={openPlaceId === place.id}
                            onOpenChange={isOpen => setOpenPlaceId(isOpen ? place.id : null)}
                            onPress={(placeId, placeName) => navigation.navigate('PlaceDetail', {placeId, placeName, reviewId: undefined, notificationAction: undefined})}
                            onDelete={handleDeleteSubscription}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.white,
    },
    header: {
        backgroundColor: colors.surface.white,
    },
    scroll: {
        flex: 1,
        backgroundColor: colors.surface.default,
    },
    content: {
        paddingTop: spacing.s * 2,
        paddingBottom: spacing['3xl'],
    },
    sectionGap: {
        marginTop: spacing.s,
        backgroundColor: colors.surface.default,
        paddingTop: spacing.s,
    },
});
