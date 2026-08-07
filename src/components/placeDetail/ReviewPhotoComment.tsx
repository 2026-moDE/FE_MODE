import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {formatRelativeTime} from './ReviewCard';

function formatAbsoluteDate(isoString: string): string {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}년 ${m}월 ${d}일`;
}

type Props = {
    review: CurrentReview | ArchivedReview;
    isOwner: boolean;
    useAbsoluteDate?: boolean;
    onChangeComment?: (reviewId: number, comment: string) => void;
};

// 리뷰 풀스크린 뷰어 중하단: 작성 시간 + 코멘트(본인이면 편집 가능)
export default function ReviewPhotoComment({review, isOwner, useAbsoluteDate, onChangeComment}: Props) {
    const [changedComment, setChangedComment] = useState(review.comment ?? '');

    // 사진이 바뀌면(review가 바뀌면) 편집 중이던 텍스트를 새 리뷰의 코멘트로 리셋
    useEffect(() => {
        setChangedComment(review.comment ?? '');
    }, [review]);

    return (
        <View style={styles.commentArea} pointerEvents={isOwner ? 'auto' : 'none'}>
            <View style={styles.timeBadge}>
                <Text style={styles.timeText}>
                    {useAbsoluteDate ? formatAbsoluteDate(review.created_at) : formatRelativeTime(review.created_at)}
                </Text>
            </View>
            {isOwner ? (
                <TextInput
                    style={styles.comment}
                    value={changedComment}
                    onChangeText={setChangedComment}
                    multiline
                    onBlur={() => {
                        if (changedComment !== review.comment) {
                            onChangeComment?.(review.id, changedComment);
                        }
                    }}
                />
            ) : (
                <Text style={styles.comment}>{review.comment}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    commentArea: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 24,
        zIndex: 1,
    },
    timeBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 9999,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    timeText: {
        color: colors.text.inverse,
        fontSize: 12,
        fontWeight: '500',
    },
    comment: {
        color: colors.text.inverse,
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 4,
    },
});
