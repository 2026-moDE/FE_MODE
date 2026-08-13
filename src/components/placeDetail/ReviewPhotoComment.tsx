import React, {useEffect, useState, useRef, useImperativeHandle} from 'react';
import {View, Text, TextInput, StyleSheet, Keyboard, Platform} from 'react-native';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';

export type ReviewPhotoCommentHandle = {
    // 텍스트 끝에 커서 놓고 키보드 띄우기 (⋮ 메뉴의 "수정하기"에서 호출)
    focusEnd: () => void;
    // 편집 중이었으면 닫고(blur) true 반환 - 호출한 쪽이 true면 다른 동작(사진 넘기기 등)을 취소하도록
    blurIfEditing: () => boolean;
};

type Props = {
    review: CurrentReview | ArchivedReview;
    isOwner: boolean;
    onChangeComment?: (reviewId: number, comment: string) => void;
    ref?: React.Ref<ReviewPhotoCommentHandle>;
};

export default function ReviewPhotoComment({review, isOwner, onChangeComment, ref}: Props) {
    const [changedComment, setChangedComment] = useState(review.comment ?? '');
    const [selection, setSelection] = useState<{start: number; end: number} | undefined>(undefined);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<TextInput>(null);
    // TextInput이 실제로 레이아웃(크기 계산)까지 끝난 뒤에 focus()해야 안드로이드에서 씹히지 않음
    const wantsFocusRef = useRef(false);

    // 사진이 바뀌면 편집 중이던 텍스트를 새 리뷰의 코멘트로 리셋
    useEffect(() => {
        setChangedComment(review.comment ?? '');
    }, [review]);

    useImperativeHandle(ref, () => ({
        focusEnd: () => {
            setIsEditing(true);
        },
        blurIfEditing: () => {
            if (isEditing) {
                inputRef.current?.blur();
                return true;
            }
            return false;
        },
    }));

    // TextInput은 isEditing이 true일 때만 마운트되므로, 커서 위치만 여기서 세팅하고
    // 실제 focus()는 아래 TextInput의 onLayout에서
    useEffect(() => {
        if (isEditing) {
            const end = changedComment.length;
            setSelection({start: end, end});
            wantsFocusRef.current = true;
        }
    }, [isEditing]);

    // 키보드가 실제로 사라질 때 강제로 blur
    useEffect(() => {
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const hideSub = Keyboard.addListener(hideEvent, () => {
            inputRef.current?.blur();
        });
        return () => hideSub.remove();
    }, []);

    return (
        <View style={styles.commentArea} pointerEvents={isOwner && isEditing ? 'auto' : 'none'}>
            {isOwner && isEditing ? (
                <TextInput
                    ref={inputRef}
                    style={styles.comment}
                    value={changedComment}
                    onChangeText={setChangedComment}
                    multiline
                    selection={selection}
                    onSelectionChange={e => setSelection(e.nativeEvent.selection)}
                    onLayout={() => {
                        if (wantsFocusRef.current) {
                            wantsFocusRef.current = false;
                            setTimeout(() => {
                                inputRef.current?.focus();
                            }, 50);
                        }
                    }}
                    onBlur={() => {
                        setIsEditing(false);
                        if (changedComment !== review.comment) {
                            onChangeComment?.(review.id, changedComment);
                        }
                    }}
                />
            ) : (
                <Text style={styles.comment}>{isOwner ? changedComment : review.comment}</Text>
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
