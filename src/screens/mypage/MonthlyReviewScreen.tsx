import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable, Dimensions} from 'react-native';
import FastImage from 'react-native-fast-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AppStackParamList} from '../../types/navigation';
import {getMyReviews, getMyProfile, MyReview, MyProfile} from '../../api/mypage';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import ReviewPhoto from '../../components/placeDetail/ReviewPhoto';
import type {CurrentReview} from '../../types/place';
import {deleteReview, changeReview} from '../../api/review';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = NativeStackScreenProps<AppStackParamList, 'MonthlyReview'>;

type DayCell = {
  day: number;
  review: MyReview | null;
  isToday: boolean;
} | null;

type MonthGroup = {
  year: number;
  month: number; // 0-indexed
};

const dateKey = (year: number, month: number, day: number) => `${year}-${month}-${day}`;

const buildMonthGroups = (reviews: MyReview[]): MonthGroup[] => {
  const now = new Date();
  if (reviews.length === 0) {
    return [{year: now.getFullYear(), month: now.getMonth()}];
  }

  const times = reviews.map(r => new Date(r.created_at).getTime());
  const minDate = new Date(Math.min(...times));

  const groups: MonthGroup[] = [];
  let year = minDate.getFullYear();
  let month = minDate.getMonth();
  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
    groups.push({year, month});
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return groups;
};

const buildMonthGrid = (year: number, month: number, reviewsByDate: Map<string, MyReview>): DayCell[][] => {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: DayCell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      review: reviewsByDate.get(dateKey(year, month, day)) ?? null,
      isToday:
        today.getFullYear() === year && today.getMonth() === month && today.getDate() === day,
    });
  }

  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

export default function MonthlyReviewScreen({navigation}: Props) {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getMyReviews({limit: 100}).then(data => setReviews(data.reviews)).catch(() => {});
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  const reviewsByDate = useMemo(() => {
    const map = new Map<string, MyReview>();
    reviews
      .filter(r => r.image_url)
      .forEach(r => {
        const d = new Date(r.created_at);
        const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
        if (!map.has(key)) map.set(key, r);
      });
    return map;
  }, [reviews]);

  const monthGroups = useMemo(() => buildMonthGroups(reviews), [reviews]);

  const photoReviews = useMemo<CurrentReview[]>(
    () =>
      reviews
        .filter(r => r.image_url)
        .map(r => ({
          id: r.id,
          image_url: r.image_url!,
          thumbnail_url: r.thumbnail_url ?? null,
          thumbnail_small_url: r.thumbnail_small_url ?? null,
          congestion_level: r.congestion_level as CurrentReview['congestion_level'],
          comment: r.comment ?? '',
          helpful_count: r.helpful_count,
          is_helpful: false,
          is_mine: true,
          user: {
            id: profile?.id ?? 0,
            nickname: profile?.nickname ?? '',
            profile_image_url: profile?.profile_image_url ?? '',
            profile_url: profile?.profile_url ?? null,
          },
          created_at: r.created_at,
        })),
    [reviews, profile],
  );

  const openViewer = useCallback(
    (review: MyReview) => {
      const idx = photoReviews.findIndex(r => r.id === review.id);
      setImageIndex(idx >= 0 ? idx : 0);
    },
    [photoReviews],
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={10}>
            <IconArrowLeft size={px(20)} color={colors.icon.inverse} />
          </Pressable>
          <Text style={styles.headerTitle}>캘린더</Text>
          <View style={styles.headerButton} />
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: false})}>
        {monthGroups.map(({year, month}) => (
          <View key={`${year}-${month}`} style={styles.monthBlock}>
            <Text style={styles.monthLabel}>
              {year}년 {month + 1}월
            </Text>

            {buildMonthGrid(year, month, reviewsByDate).map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((cell, cellIndex) => (
                  <View key={cellIndex} style={styles.dayCell}>
                    {cell &&
                      (cell.review ? (
                        <Pressable onPress={() => openViewer(cell.review!)}>
                          <FastImage
                            source={{
                              uri:
                                cell.review.thumbnail_small_url ??
                                cell.review.thumbnail_url ??
                                cell.review.image_url!,
                            }}
                            style={styles.dayPhoto}
                            resizeMode={FastImage.resizeMode.cover}
                          />
                        </Pressable>
                      ) : cell.isToday ? (
                        <View style={styles.todayCircle}>
                          <Text style={styles.todayText}>{cell.day}</Text>
                        </View>
                      ) : (
                        <Text style={styles.dayText}>{cell.day}</Text>
                      ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <ReviewPhoto
        reviews={photoReviews}
        startIndex={imageIndex ?? 0}
        visible={imageIndex !== null}
        onClose={() => setImageIndex(null)}
        onDelete={async () => {
          if (imageIndex === null) return;
          try {
            await deleteReview(photoReviews[imageIndex].id);
            setReviews(prev => prev.filter(r => r.id !== photoReviews[imageIndex].id));
            setImageIndex(null);
          } catch (error) {
            console.log('[리뷰 삭제 실패]', error);
          }
        }}
        onReport={() => setImageIndex(null)}
        onChangeComment={async (reviewId, comment) => {
          try {
            await changeReview(reviewId, {comment});
            setReviews(prev => prev.map(r => (r.id === reviewId ? {...r, comment} : r)));
          } catch (error) {
            console.log('[리뷰 수정 실패]', error);
          }
        }}
        useAbsoluteDate
      />
    </View>
  );
}

const CELL_SIZE = (SCREEN_WIDTH - px(spacing.xl) * 2) / 7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  headerSafeArea: {
    backgroundColor: colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: px(spacing.lg),
    paddingVertical: px(spacing.md),
  },
  headerButton: {
    width: px(34),
    height: px(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: px(16),
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
  },

  scrollContent: {
    paddingHorizontal: px(spacing.xl),
    paddingBottom: px(spacing['4xl']),
  },

  monthBlock: {
    marginTop: px(spacing['2xl']),
  },

  monthLabel: {
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    marginBottom: px(spacing.md),
  },

  weekRow: {
    flexDirection: 'row',
  },

  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE * 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: px(spacing.sm),
  },

  dayText: {
    fontSize: px(13),
    fontFamily: fontFamily.medium,
    color: colors.text.inverse,
  },

  todayCircle: {
    width: px(26),
    height: px(26),
    borderRadius: px(radius.full),
    backgroundColor: colors.surface.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },

  todayText: {
    fontSize: px(13),
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
  },

  dayPhoto: {
    width: CELL_SIZE - px(10),
    height: CELL_SIZE * 1.2 - px(6),
    borderRadius: px(radius.md),
    backgroundColor: colors.surface.muted,
  },
});
