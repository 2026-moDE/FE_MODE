import { BottomSheetModal, BottomSheetFlatList, BottomSheetFooter, BottomSheetFooterProps, BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, Image, StyleSheet, Modal, Keyboard, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../../constants/colors";
import { spacing, gap, padding } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { radius } from "../../constants/radius";
import ReviewCommentItem from "./ReviewCommentItem";
import CommentInput from "./CommentInput";
import { ReviewComment, createComment, createReply, deleteComment, fetchComments } from "../../api/review";
import { getMyProfile } from "../../api/mypage";
import { isBlockedError } from "../../api/block";
import { useOnBlockChange } from "../../store/blockEvents";
import { useToast } from "../common/Toast";
import type { AppStackParamList } from "../../types/navigation";

const checkWhiteIcon = require("../../assets/image/check_white.png");

type Props = {
    reviewId?: number;   // 어떤 리뷰의 채팅인지
    // 전체 공개 / 친구 공개
    reviewVisibility?: 'PUBLIC' | 'FRIENDS';
    // true면 조회만 가능 - 입력창(댓글/답글) 자체가 필요없으니까 마이페이지에서 사용하면 됨!!
    readOnly?: boolean;
    ref?: React.Ref<BottomSheetModal>;
    // 댓글 작성 성공 시 호출 - 부모에서 comment_count 갱신 용도
    onAddComment?: (reviewId: number) => void;
};

// 리뷰 사진 댓글/채팅 바텀시트
// ref로 present()/dismiss()를 ReviewPhoto에 노출
export default function ReviewChatModal({reviewId, reviewVisibility, readOnly, ref, onAddComment}: Props) {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const insets = useSafeAreaInsets();
    const {showToast} = useToast();
    const snapPoints = useMemo(() => ['50%', '85%'], []);

    const sheetRef = useRef<BottomSheetModal>(null);
    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal);

    // 지금 화면에 보여줄 댓글 배열
    const [comments, setComments] = useState<ReviewComment[]>([]);

    // ReviewChatModal은 리뷰마다 새로 만들어지지 않고 하나의 인스턴스가 reviewId만 바뀌며 재사용됨
    // (ReviewPhoto가 사진 스와이프할 때마다 reviewId prop만 교체, 댓글 여러 개 연달아 쓰면 같은
    // reviewId로도 loadComments가 겹쳐 호출됨) - 늦게 시작한 요청보다 먼저 시작한 요청이 더 늦게
    // 응답하면 그 오래된 응답이 최신 상태를 덮어써버리는 레이스가 생길 수 있음.
    // 요청마다 순번을 매겨서, 가장 최근에 시작한 요청의 응답만 반영되게 함
    const requestSeqRef = useRef(0);

    // 댓글 목록 조회는 커서 페이지네이션(기본 20개씩)이라, 커서가 끝날 때까지 이어서 다 불러옴
    const loadComments = useCallback(async () => {
        if (!reviewId) return;
        const mySeq = ++requestSeqRef.current;
        try {
            let cursor: number | undefined;
            let all: ReviewComment[] = [];
            do {
                const res = await fetchComments(reviewId, cursor !== undefined ? {cursor} : undefined);
                all = all.concat(res.comments); // 새 댓/답글을 기존에 이어붙여서 다시 all로 
                cursor = res.next_cursor ?? undefined;
            } while (cursor !== undefined); // 커서 남아있는 동안 계속 실행
            if (requestSeqRef.current !== mySeq) return; // 그 사이 더 최근 요청이 시작됨 - 이 응답은 버림
            setComments(all);
        } catch (err: any) {
            console.warn('댓글 목록 조회 실패:', err?.message);
        }
    }, [reviewId]);

    // 리뷰 바뀔 때마다(or 처음 열릴 때) 댓글 목록 불러오기
    // 이전 리뷰의 댓글이 새 리뷰 응답 오기 전까지 잠깐이라도 보이지 않게 먼저 비움
    useEffect(() => {
        setComments([]);
        loadComments();
    }, [loadComments]);

    // 차단/해제되면 차단한 사용자의 댓글·답글이 목록에 남아 있어서 다시 받아온다
    useOnBlockChange(() => {
        loadComments();
    });

    // 댓글/답글을 API 응답 기다리지 않고 바로 UI에 보여주기 - 내 프로필 정보 미리 캐싱
    const myProfileRef = useRef<{id: number; nickname: string; profile_image_url: string | null; profile_url?: string | null} | null>(null);
    useEffect(() => {
        getMyProfile().then(p => { myProfileRef.current = p; }).catch(() => {});
    }, []);
    // 임시 댓글 id는 실제 id(양수)와 안 겹치게 음수로, 여러 개 빠르게 작성해도 안 겹치게 카운터로 발급
    const tempIdRef = useRef(-1);

    // 댓글 작성하면 댓글 작성한 곳으로 애니메이션 이동
    // 방금 작성한 댓글 실제 id로 새로고침된 목록에서 위치를 찾아 그쪽으로 스크롤
    const listRef = useRef<React.ComponentRef<typeof BottomSheetFlatList>>(null);
    const scrollToCommentIdRef = useRef<number | null>(null);
    useEffect(() => {
        if (scrollToCommentIdRef.current === null) return;
        const commentId = scrollToCommentIdRef.current; // handleSubmitComment에서 id준 거 가져옴
        scrollToCommentIdRef.current = null;
        const index = comments.findIndex(c => c.id === commentId);
        if (index >= 0) {
            requestAnimationFrame(() => {
                listRef.current?.scrollToIndex({index, animated: true, viewPosition: 1});
            });
        }
    }, [comments]);

    // 반응 시트(ReviewReactionsModal)와 배경 처리를 통일 - 블러 대신 기본 딤
    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
        ),
        [],
    );

    // 답글 펼친 댓글 id 목록
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const toggleReplies = useCallback((id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // 답글 입력창 포커스 중이면(답글 쓰는 중) 댓글 입력창 숨김
    const [isReplyFocused, setIsReplyFocused] = useState(false);
    // 키보드가 완전히 내려가면 항상 footer 복원 (onBlur가 안 불리는 경우 대비)
    useEffect(() => {
        const sub = Keyboard.addListener('keyboardDidHide', () => setIsReplyFocused(false));
        return () => sub.remove();
    }, []);

    // 새 댓글 작성 - API 응답 기다리지 않고 바로 화면에 보여준 뒤, 응답 오면 실제 데이터로 교체
    // (실패하면 임시로 보여준 것 제거)
    const [isSecret, setIsSecret] = useState(false);
    const handleSubmitComment = useCallback((text: string) => {
        if (!reviewId) return;
        const secret = isSecret;
        setIsSecret(false);

        const tempId = tempIdRef.current--;
        const me = myProfileRef.current;
        const optimisticComment: ReviewComment = {
            id: tempId,
            parent_id: null,
            content: text,
            is_secret: secret,
            is_mine: true,
            is_deleted: false,
            user: {
                user_id: me?.id,
                nickname: me?.nickname ?? '',
                profile_image_url: me?.profile_image_url ?? '',
                profile_url: me?.profile_url ?? '',
            },
            created_at: new Date().toISOString(),
            replies: [],
        };
        setComments(prev => [...prev, optimisticComment]);
        scrollToCommentIdRef.current = tempId; // 임시 id로 바로 스크롤 (응답 기다릴 필요 없음)

        createComment(reviewId, {content: text, is_secret: secret})
            .then(res => {
                // 작성 응답(Comment)엔 user/replies가 아예 없음(공식 문서 기준) -
                // 방금 넣어둔 user/replies는 그대로 두고, 서버가 준 값(id, created_at 등)만 덮어씀
                setComments(prev => prev.map(c => c.id === tempId ? {...c, ...res} : c));
                onAddComment?.(reviewId);
            })
            .catch(err => {
                console.warn('댓글 작성 실패:', err?.message);
                setComments(prev => prev.filter(c => c.id !== tempId));

                // 차단 관계면 서버가 403 - 낙관적으로 붙여둔 댓글을 걷어내고 이유를 알려준다
                if (isBlockedError(err)) {
                    showToast('차단한 사용자에게는 댓글을 작성할 수 없습니다');
                }
            });
    }, [reviewId, isSecret, showToast]);

    // 답글 작성 - 댓글 아이템 안의 입력창 (댓글과 동일하게 낙관적 업데이트)
    const handleSubmitReply = useCallback((commentId: number, text: string) => {
        if (!reviewId) return;

        const tempId = tempIdRef.current--;
        const me = myProfileRef.current;
        const optimisticReply: ReviewComment = {
            id: tempId,
            parent_id: commentId,
            content: text,
            is_secret: false,
            is_mine: true,
            is_deleted: false,
            user: {
                user_id: me?.id,
                nickname: me?.nickname ?? '',
                profile_image_url: me?.profile_image_url ?? '',
                profile_url: me?.profile_url ?? '',
            },
            created_at: new Date().toISOString(),
            replies: [],
        };
        setComments(prev => prev.map(c =>
            c.id === commentId ? {...c, replies: [...c.replies, optimisticReply]} : c,
        ));

        createReply(reviewId, commentId, {content: text})
            .then(res => {
                // 답글 작성 응답도 user/replies가 없음 - 낙관적으로 넣어둔 값 그대로 유지
                setComments(prev => prev.map(c => c.id === commentId ? {
                    ...c,
                    replies: c.replies.map(r => r.id === tempId ? {...r, ...res} : r),
                } : c));
            })
            .catch(err => {
                console.warn('답글 작성 실패:', err?.message);
                setComments(prev => prev.map(c => c.id === commentId ? {
                    ...c,
                    replies: c.replies.filter(r => r.id !== tempId),
                } : c));

                if (isBlockedError(err)) {
                    showToast('차단한 사용자에게는 댓글을 작성할 수 없습니다');
                }
            });
    }, [reviewId, showToast]);

    // 댓글 삭제 - 누르자마자 로컬에서 바로 "삭제된 댓글입니다"로 바꾸고, 실제 삭제는 백그라운드로
    const [showDeleteToast, setShowDeleteToast] = useState(false);
    const deleteToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (deleteToastTimerRef.current) clearTimeout(deleteToastTimerRef.current);
        };
    }, []);
    // 답글엔 아직 ⋮ 메뉴가 없어서 항상 최상위 댓글만 삭제됨
    const handleDeleteComment = useCallback((commentId: number) => {
        if (!reviewId) return;
        setComments(prev => {
            const target = prev.find(c => c.id === commentId);
            // 답글이 없으면 목록에서 바로 제거, 있으면 "삭제된 댓글입니다"로 표시
            return target && target.replies.length === 0
                ? prev.filter(c => c.id !== commentId)
                : prev.map(c => c.id === commentId ? {...c, is_deleted: true} : c);
        });
        deleteComment(reviewId, commentId)
            .catch(err => console.warn('댓글 삭제 실패:', err?.message));

        // "댓글이 삭제되었어요" 토스트 3초간 노출
        if (deleteToastTimerRef.current) clearTimeout(deleteToastTimerRef.current);
        setShowDeleteToast(true);
        deleteToastTimerRef.current = setTimeout(() => setShowDeleteToast(false), 3000);
    }, [reviewId]);

    // 댓글 신고 - 신고 페이지로 넘어감 (API는 아직 리뷰 신고용이라 미연결 - commentId만 같이 넘겨둠)
    const handleReportComment = useCallback((commentId: number) => {
        if (!reviewId) return;
        sheetRef.current?.dismiss();
        navigation.navigate('ReviewReport', {reviewId, commentId});
    }, [reviewId, navigation]);

    // 댓글/답글 작성자 프로필 사진·닉네임 탭 - 다른 유저 마이페이지로 이동
    // 시트는 네비게이션 스택과 별개 레이어(포탈)라 화면을 이동해도 저절로 안 닫혀서 직접 dismiss해줘야 함
    const handlePressUser = useCallback((userId: number) => {
        sheetRef.current?.dismiss();
        navigation.navigate('UserMyPage', {userId});
    }, [navigation]);

    // 입력창을 시트 전용 footer로 렌더링
    // bottomInset은 inputWrapper의 paddingBottom(16)이 더해지므로, 키보드 없을 때 하단 여백이 기존 43으로 유지되게 27
    const renderFooter = useCallback(
        (props: BottomSheetFooterProps) => (
            <BottomSheetFooter {...props} bottomInset={27}>
                <View style={styles.inputWrapper}>
                    <CommentInput
                        onSubmit={handleSubmitComment}
                        showSecretCheckbox={reviewVisibility === 'FRIENDS'}
                        isSecret={isSecret}
                        onToggleSecret={() => setIsSecret(prev => !prev)}
                        onFocus={Platform.OS === 'android' ? () => sheetRef.current?.snapToIndex(1) : undefined}
                    />
                </View>
            </BottomSheetFooter>
        ),
        [handleSubmitComment, reviewVisibility, isSecret],
    );

    // footer 높이: bottomInset(27) + paddingTop(16) + 입력창 한 줄(~40) + paddingBottom(16)
    const toastBottom = insets.bottom + gap.lg + (!readOnly ? 27 + 16 + 40 + 16 : 0);

    return (
        <>
        <Modal visible={showDeleteToast} transparent animationType="none" statusBarTranslucent>
            <View style={[styles.toastOverlay, {paddingBottom: toastBottom}]} pointerEvents="none">
                <View style={styles.deleteToast}>
                    <Image source={checkWhiteIcon} style={styles.deleteToastIcon} resizeMode="contain" />
                    <Text style={styles.deleteToastText}>댓글이 삭제되었어요</Text>
                </View>
            </View>
        </Modal>
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            // 기본값 "interactive"는 키보드 높이만큼 시트를 밀어올려서 화면 최상단까지 올라가버림.
            // "extend"는 가장 높은 스냅포인트(85%)까지만 확장하고 멈춰서 위에 여백이 남음
            keyboardBehavior="extend"
            keyboardBlurBehavior="restore"
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.handle}
            backdropComponent={renderBackdrop}
            footerComponent={readOnly || isReplyFocused ? undefined : renderFooter}
            onDismiss={() => setExpandedIds(new Set())}>
            <BottomSheetFlatList
                ref={listRef}
                contentContainerStyle={[styles.listContent, readOnly && styles.listContentReadOnly]}
                data={comments}
                keyExtractor={item => String(item.id)}
                keyboardShouldPersistTaps="handled"
                onScrollToIndexFailed={info => {
                    setTimeout(() => {
                        listRef.current?.scrollToIndex({index: info.index, animated: true, viewPosition: 1});
                    }, 100);
                }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({item}) => (
                    <ReviewCommentItem
                        comment={item}
                        repliesExpanded={expandedIds.has(item.id)}
                        onPressReplyToggle={() => toggleReplies(item.id)}
                        onSubmitReply={text => handleSubmitReply(item.id, text)}
                        onReplyFocusChange={focused => {
                            if (!focused) {
                                setIsReplyFocused(false);
                                return;
                            }
                            if (Platform.OS === 'android') {
                                // Android: 일반 TextInput이라 OS가 키보드를 올림
                                // 한 프레임 뒤에 footer 제거 + 시트 확장 → 키보드가 먼저 올라온 뒤 처리
                                requestAnimationFrame(() => {
                                    setIsReplyFocused(true);
                                    sheetRef.current?.snapToIndex(1);
                                });
                            } else {
                                // iOS: BottomSheetTextInput이 gorhom에 키보드 알림 → keyboardBehavior="extend" 자동 처리
                                setIsReplyFocused(true);
                            }
                        }}
                        onDeleteComment={() => handleDeleteComment(item.id)}
                        onReportComment={() => handleReportComment(item.id)}
                        onPressUser={handlePressUser}
                        readOnly={readOnly}
                    />
                )}
            />
        </BottomSheetModal>
        </>
    );
}

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.background.dimDarkest,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    handle: {
        backgroundColor: colors.surface.white,
        width: 75,
    },
    listContent: {
        paddingHorizontal: spacing.xl,     // 20
        paddingTop: gap.md,        // 12 - 핸들 ↔ 첫 댓글
        paddingBottom: 110,   // 하단 고정 입력창에 안 가리게
    },
    listContentReadOnly: {
        paddingBottom: gap.md,   // 입력창이 없으니 여유 공간도 필요 없음
    },
    separator: {
        height: gap.md,   // 12
    },
    inputWrapper: {
        paddingHorizontal: spacing.xl,     // 20 - footer는 content 밖이라 패딩 따로 필요
        paddingTop: gap.lg,                // 16 - 리스트 ↔ 입력창
        // bottomInset은 키보드가 내려갔을 때만 적용돼서(라이브러리 구현), 키보드 ↔ 입력창 간격은 여기서 줘야 함
        paddingBottom: gap.lg,             // 16 - 키보드 ↔ 입력창
        position: 'relative',
    },
    toastOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    deleteToast: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: gap.sm,
        paddingVertical: padding.sm,
        paddingHorizontal: padding.lg,
        backgroundColor: colors.background.dimDarker,
        borderRadius: radius.md,
    },
    deleteToastIcon: {
        width: 16,
        height: 16,
    },
    deleteToastText: {
        ...typography.b5,
        color: colors.text.inverse,
    },
});
