import React, {useState} from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {ReviewComment} from '../../api/review';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import {formatCommentDate} from '../../utils/date';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import IconFriend from '../../assets/icons/IconFriend';
import CommentInput from './CommentInput';
import ProfileAvatar from '../common/ProfileAvatar';

const verticalEllipsisIcon = require('../../assets/image/vertical_ellipis.png');
const sirenIcon = require('../../assets/image/siren.png');
const trashIcon = require('../../assets/image/trash.png');
const warningIcon = require('../../assets/image/warning.png');

type Props = {
    comment: ReviewComment;
    onPressMenu?: () => void;
    // 댓글 삭제(본인 댓글) / 신고(남의 댓글)
    onDeleteComment?: () => void;
    onReportComment?: () => void;
    onPressReplyToggle?: () => void;
    onSubmitReply?: (content: string) => void;
    // 프로필 사진/닉네임 탭 시 다른 유저 마이페이지로 이동 (user_id 없으면 무시됨)
    onPressUser?: (userId: number) => void;
    // 답글 펼침 상태
    repliesExpanded?: boolean;
    // 답글 입력창 포커스 시작/종료
    onReplyFocusChange?: (focused: boolean) => void;
    // true면 조회만 가능 - 답글 입력창 자체를 안 그림
    readOnly?: boolean;
};

// 댓글 본문: 서버가 볼 권한 없으면 content를 null.
// 비밀 댓글(is_secret)이고 볼 권한 있으면(=댓글 작성자 or 리뷰 작성자) 노란 별 + 노란 텍스트로 본문 그대로 보여줌
function CommentBody({
    content,
    isSecret,
    isDeleted,
    isReply,
}: {
    content: string | null;
    isSecret?: boolean;
    isDeleted?: boolean;
    isReply?: boolean;
}) {
    if (isDeleted) {
        return (
            <View style={styles.deletedRow}>
                <Image source={warningIcon} style={styles.deletedIcon} resizeMode="contain" />
                <Text style={styles.deletedText}>삭제된 댓글입니다</Text>
            </View>
        );
    }
    if (content === null) {
        return (
            <View style={styles.secretRow}>
                <IconFriend size={14} color={colors.icon.brand} />
                <Text style={styles.secretLabel}>친구에게만 보이는 댓글이에요</Text>
            </View>
        );
    }
    if (isSecret) {
        return (
            <View style={styles.secretRow}>
                <IconFriend size={14} color={colors.icon.brand} />
                <Text style={[styles.commentText, styles.secretCommentText, isReply && styles.replyCommentText]}>
                    {content}
                </Text>
            </View>
        );
    }
    return <Text style={[styles.commentText, isReply && styles.replyCommentText]}>{content}</Text>;
}

// 댓글 리스트 아이템 (답글 접힘/펼침 둘 다 처리)
export default function ReviewCommentItem({
    comment,
    onPressMenu,
    onDeleteComment,
    onReportComment,
    onPressReplyToggle,
    onSubmitReply,
    onPressUser,
    repliesExpanded,
    onReplyFocusChange,
    readOnly,
}: Props) {
    const {user, content, is_secret, is_mine, created_at, replies} = comment;
    const replyCount = replies.length;
    // 비밀 댓글인데 볼 권한이 없으면(content null) 답글 자체를 달 수 없음
    const canShowReplyToggle = content !== null;
    // ⋮ 눌렀을 때 뜨는 삭제/신고 팝오버
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <View style={styles.container}>
            {/* 상단: 아바타 + 닉네임(최대 8자) + 날짜 + ⋮ 메뉴 */}
            <View style={styles.header}>
                <Pressable
                    style={styles.userGroup}
                    disabled={user.user_id == null || !onPressUser}
                    onPress={() => user.user_id != null && onPressUser?.(user.user_id)}>
                    <ProfileAvatar
                        profileUrl={user.profile_url}
                        profileImageUrl={user.profile_image_url}
                        style={styles.avatar}
                    />
                    <Text style={styles.nickname} numberOfLines={1}>
                        {user.nickname}
                    </Text>
                    <Text style={styles.date}>{formatCommentDate(created_at)}</Text>
                </Pressable>
                <Pressable
                    hitSlop={10}
                    onPress={() => {
                        onPressMenu?.();
                        setMenuOpen(prev => !prev);
                    }}>
                    <Image source={verticalEllipsisIcon} style={styles.menuIcon} resizeMode="contain" />
                </Pressable>

                {menuOpen && (
                    <Pressable
                        style={styles.menuPopoverItem}
                        onPress={() => {
                            setMenuOpen(false);
                            if (is_mine) onDeleteComment?.();
                            else onReportComment?.();
                        }}>
                        <Image
                            source={is_mine ? trashIcon : sirenIcon}
                            style={styles.menuPopoverIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.menuPopoverText}>
                            {is_mine ? '삭제하기' : '신고하기'}
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* 본문 + (펼쳤을 때) 답글 목록 + 답글 입력창 + 답글 토글*/}
            <View style={styles.body}>
                <CommentBody content={content} isSecret={is_secret} isDeleted={comment.is_deleted} />

                {canShowReplyToggle && repliesExpanded && (
                    <>
                        {replies.map(reply => (
                            <View key={reply.id} style={styles.replyItem}>
                                <Pressable
                                    style={styles.replyHeader}
                                    disabled={reply.user.user_id == null || !onPressUser}
                                    onPress={() => reply.user.user_id != null && onPressUser?.(reply.user.user_id)}>
                                    <ProfileAvatar
                                        profileUrl={reply.user.profile_url}
                                        profileImageUrl={reply.user.profile_image_url}
                                        style={styles.replyAvatar}
                                    />
                                    <Text style={styles.replyNickname} numberOfLines={1}>
                                        {reply.user.nickname}
                                    </Text>
                                </Pressable>
                                <CommentBody content={reply.content} isSecret={reply.is_secret} isDeleted={reply.is_deleted} isReply />
                            </View>
                        ))}

                        {!readOnly && (
                            <View style={styles.inputWrapper}>
                                <CommentInput
                                    onSubmit={text => onSubmitReply?.(text)}
                                    variant="compact"
                                    onFocus={() => onReplyFocusChange?.(true)}
                                    onBlur={() => onReplyFocusChange?.(false)}
                                />
                            </View>
                        )}
                    </>
                )}
                {canShowReplyToggle && (
                    <Pressable style={styles.replyToggle} onPress={onPressReplyToggle}>
                        <Text style={styles.replyText}>
                            {repliesExpanded ? '답글' : `답글 ${replyCount}`}
                        </Text>
                        <View style={repliesExpanded ? styles.chevronOpen : undefined}>
                            <IconChevronDown size={16} color={colors.icon.inverse} />
                        </View>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: padding.sm,               // 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,                       // 8
        flexShrink: 1,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: radius.md,         
        backgroundColor: colors.surface.muted,
    },
    nickname: {
        ...typography.c1,
        color: colors.text.inverse,
        flexShrink: 1,
    },
    date: {
        ...typography.c3,
        color: 'rgba(255,255,255,0.5)',
    },
    menuIcon: {
        width: 24,
        height: 24,
        tintColor: colors.icon.inverse,
    },
    menuPopoverItem: {
        position: 'absolute',
        top: '100%',
        marginTop: gap.xs,  
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: gap.sm,                       // 8
        paddingVertical: padding.s,        // 8
        paddingHorizontal: padding.sm,     // 10
        backgroundColor: colors.button.secondaryFill,
        borderRadius: radius.md,           // 8
        zIndex: 10,
    },
    menuPopoverIcon: {
        width: 16,
        height: 16,
    },
    menuPopoverText: {
        ...typography.c1,
        color: colors.text.inverse,
    },
    body: {
        paddingLeft: padding['4xl'],       // 40 - 헤더보다 들여쓰기
        gap: gap.sm,                       // 8 - 헤더 ↔ 본문 간격은 이 View의 marginTop으로 대체
        marginTop: gap.sm,
    },
    secretRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,                       // 8 - 아이콘 ↔ 라벨 텍스트
    },
    deletedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,                    
    },
    deletedIcon: {
        width: 14,
        height: 14,
    },
    deletedText: {
        ...typography.b6,
        color: colors.text.inverse,
    },
    secretLabel: {
        ...typography.b5,
        color: colors.text.brand,
    },
    commentText: {
        ...typography.b4,
        color: colors.text.inverse,
    },
    secretCommentText: {
        color: colors.text.brand,
        flexShrink: 1,
    },
    replyCommentText: {
        ...typography.c2,
    },
    replyItem: {
        gap: gap.sm,                       // 8
        marginTop: gap.sm,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,                       // 8
    },
    replyAvatar: {
        width: 20,
        height: 20,
        borderRadius: radius.sm,           // 4
        backgroundColor: colors.surface.muted,
    },
    replyNickname: {
        ...typography.c3,
        color: colors.text.inverse,
        flexShrink: 1,
    },
    inputWrapper: {
        marginTop: gap.sm,
    },
    replyToggle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    replyText: {
        ...typography.c3,
        color: colors.text.inverse,
        marginRight: gap.xs,               // 4 - "답글 N" ↔ 화살표
    },
    chevronOpen: {
        transform: [{rotate: '180deg'}],
    },
});
