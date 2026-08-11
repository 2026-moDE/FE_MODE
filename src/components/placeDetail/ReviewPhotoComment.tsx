import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from 'react';
import {View, Text, TextInput, StyleSheet, Keyboard, Platform} from 'react-native';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';

export function formatAbsoluteDate(isoString: string): string {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}년 ${m}월 ${d}일`;
}

type Props = {
    review: CurrentReview | ArchivedReview;
    isOwner: boolean;
    onChangeComment?: (reviewId: number, comment: string) => void;
};

export type ReviewPhotoCommentHandle = {
    // 텍스트 끝에 커서 놓고 키보드 띄우기 (⋮ 메뉴의 "수정하기"에서 호출)
    focusEnd: () => void;
};

const ReviewPhotoComment = forwardRef<ReviewPhotoCommentHandle, Props>(
    ({review, isOwner, onChangeComment}, ref) => {
        const [changedComment, setChangedComment] = useState(review.comment ?? '');
        const [selection, setSelection] = useState<{start: number; end: number} | undefined>(undefined);
        const inputRef = useRef<TextInput>(null);

        // 사진이 바뀌면(review가 바뀌면) 편집 중이던 텍스트를 새 리뷰의 코멘트로 리셋
        useEffect(() => {
            setChangedComment(review.comment ?? '');
        }, [review]);

        useImperativeHandle(ref, () => ({
            focusEnd: () => {
                const end = changedComment.length;
                setSelection({start: end, end});
                inputRef.current?.focus();
            },
        }));

        // 키보드가 실제로 사라질 때(뒤로가기·스와이프 등 포함) 강제로 blur시켜서
        // 커서가 남아있는 문제 방지 + onBlur 저장 로직 확실히 실행되게 함
        useEffect(() => {
            const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
            const hideSub = Keyboard.addListener(hideEvent, () => {
                inputRef.current?.blur();
            });
            return () => hideSub.remove();
        }, []);

        return (
            <View style={styles.commentArea} pointerEvents={isOwner ? 'auto' : 'none'}>
                {isOwner ? (
                    <TextInput
                        ref={inputRef}
                        style={styles.comment}
                        value={changedComment}
                        onChangeText={setChangedComment}
                        multiline
                        selection={selection}
                        onSelectionChange={e => setSelection(e.nativeEvent.selection)}
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
    },
);

export default ReviewPhotoComment;

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
