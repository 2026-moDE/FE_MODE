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
        // TEMP: 알림 유형별 아이콘 확인용 목업 - 확인 끝나면 아래 목업 배열 지우고 fetchNotifications만 남기면 됨
        const now = Date.now();
        const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
        const MOCK_NOTIFICATIONS: Notification[] = [
            // 오늘
            {id: -1, type: 'REVIEW', title: '관심있어 하신 장소에 새로운 리뷰가 작성됐어요', body: "관심 장소로 등록하신 '한강공원 반포지구'에 새로운 리뷰가 작성됐어요.", place: {id: 1, name: '한강공원 반포지구'}, review_id: 1, is_read: false, created_at: hoursAgo(0.2)},
            {id: -2, type: 'REACTION', title: '작성하신 리뷰에 새로운 반응이 달렸어요', body: "'한강공원 반포지구'에 작성하신 리뷰에 새로운 반응이 달렸어요.", place: {id: 1, name: '한강공원 반포지구'}, review_id: 1, is_read: false, created_at: hoursAgo(1)},
            {id: -3, type: 'COMMENT', title: '작성하신 리뷰에 새로운 댓글이 달렸어요', body: "'에스케이뷰파크1차아파트 110동'에 작성하신 리뷰에 새로운 댓글이 달렸어요.", place: {id: 1474, name: '에스케이뷰파크1차아파트 110동'}, review_id: 173, is_read: false, created_at: hoursAgo(3)},
            {id: -4, type: 'FRIEND_REQUEST', title: '새로운 친구 요청을 확인해보세요', body: '듀기니니님이 친구를 요청했어요', place: {id: 1, name: ''}, is_read: false, created_at: hoursAgo(5)},
            {id: -5, type: 'FRIEND_ACCEPT', title: '친구 요청이 수락됐어요', body: '듀듀님이 친구 요청을 수락했어요', place: {id: 1, name: ''}, is_read: false, created_at: hoursAgo(8)},
            {id: -6, type: 'FRIEND_REVIEW', title: '친구가 새로운 리뷰를 작성했어요', body: "친구가 '한강공원 반포지구'에 새로운 리뷰를 작성했어요.", place: {id: 1, name: '한강공원 반포지구'}, review_id: 1, is_read: false, created_at: hoursAgo(10)},
            {id: -7, type: 'REVIEW', title: '읽음 처리된 알림 예시', body: '아이콘이 흐려지는지 비교용', place: {id: 1, name: ''}, is_read: true, created_at: hoursAgo(12)},
            // 어제
            {id: -8, type: 'REVIEW', title: '관심있어 하신 장소에 새로운 리뷰가 작성됐어요', body: "관심 장소로 등록하신 '성수 카페 A'에 새로운 리뷰가 작성됐어요.", place: {id: 2, name: '성수 카페 A'}, review_id: 2, is_read: true, created_at: hoursAgo(26)},
            {id: -9, type: 'REACTION', title: '작성하신 리뷰에 새로운 반응이 달렸어요', body: "'성수 카페 A'에 작성하신 리뷰에 새로운 반응이 달렸어요.", place: {id: 2, name: '성수 카페 A'}, review_id: 2, is_read: true, created_at: hoursAgo(29)},
            {id: -10, type: 'COMMENT', title: '작성하신 리뷰에 새로운 댓글이 달렸어요', body: "'성수 카페 A'에 작성하신 리뷰에 새로운 댓글이 달렸어요.", place: {id: 2, name: '성수 카페 A'}, review_id: 2, is_read: true, created_at: hoursAgo(33)},
            {id: -11, type: 'FRIEND_REQUEST', title: '새로운 친구 요청을 확인해보세요', body: '채서린님이 친구를 요청했어요', place: {id: 1, name: ''}, is_read: true, created_at: hoursAgo(40)},
            {id: -12, type: 'FRIEND_ACCEPT', title: '친구 요청이 수락됐어요', body: '콩숭이님이 친구 요청을 수락했어요', place: {id: 1, name: ''}, is_read: true, created_at: hoursAgo(45)},
            // 이전
            {id: -13, type: 'REVIEW', title: '관심있어 하신 장소에 새로운 리뷰가 작성됐어요', body: "관심 장소로 등록하신 '토즈모임센터 강남역'에 새로운 리뷰가 작성됐어요.", place: {id: 3, name: '토즈모임센터 강남역'}, review_id: 3, is_read: true, created_at: hoursAgo(80)},
            {id: -14, type: 'REACTION', title: '작성하신 리뷰에 새로운 반응이 달렸어요', body: "'토즈모임센터 강남역'에 작성하신 리뷰에 새로운 반응이 달렸어요.", place: {id: 3, name: '토즈모임센터 강남역'}, review_id: 3, is_read: true, created_at: hoursAgo(100)},
            {id: -15, type: 'COMMENT', title: '작성하신 리뷰에 새로운 댓글이 달렸어요', body: "'토즈모임센터 강남역'에 작성하신 리뷰에 새로운 댓글이 달렸어요.", place: {id: 3, name: '토즈모임센터 강남역'}, review_id: 3, is_read: true, created_at: hoursAgo(150)},
            {id: -16, type: 'FRIEND_REQUEST', title: '새로운 친구 요청을 확인해보세요', body: '너구리님이 친구를 요청했어요', place: {id: 1, name: ''}, is_read: true, created_at: hoursAgo(200)},
            {id: -17, type: 'FRIEND_ACCEPT', title: '친구 요청이 수락됐어요', body: '판다님이 친구 요청을 수락했어요', place: {id: 1, name: ''}, is_read: true, created_at: hoursAgo(250)},
            {id: -18, type: 'FRIEND_REVIEW', title: '친구가 새로운 리뷰를 작성했어요', body: "친구가 '토즈모임센터 강남역'에 새로운 리뷰를 작성했어요.", place: {id: 3, name: '토즈모임센터 강남역'}, review_id: 3, is_read: true, created_at: hoursAgo(300)},
        ];
        setNotifications(MOCK_NOTIFICATIONS);

        // TEMP: 목업 확인 끝나면 아래 주석 풀고 위 목업 코드 지우면 됨
        // fetchNotifications()
        //     .then(res => setNotifications(res.notifications ?? []))
        //     .catch(err => console.warn('알림 조회 실패:', err?.message));
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

        // 리뷰 관련 알림
        navigation.navigate('PlaceDetail', {
            placeId: target.place.id,
            placeName: target.place.name,
            reviewId: target.review_id,
            // 댓글 알림이면 도착하자마자 댓글 모달 자동으로
            notificationAction: target.type === 'COMMENT' ? 'chat' : undefined,
        });
    }, [notifications, navigation]);

    // 구독(알림 받을 장소) 켜기/끄기 - 지금 카드 UI엔 안 붙어있음, 다른 곳에서 쓸 예정
    const handleSubscriptions = useCallback((id: number, current: boolean) => {
        setPlaces(prev => prev.map(p => p.place.id === id ? {...p, is_active: !current} : p));
        if (current) {
            unsubscribe(id).catch(err => console.warn('구독 취소 실패:', err?.message));
        } else {
            subscribe(id).catch(err => console.warn('구독 설정 실패:', err?.message));
        }
    }, []);

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
                            onPress={(placeId, placeName) => navigation.navigate('PlaceDetail', {placeId, placeName})}
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
