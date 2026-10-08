import React from 'react';
import {View, Text, Pressable, StyleSheet, Image} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {FriendReview} from '../../api/friend';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {gap} from '../../constants/spacing';

type Props = {
    item: FriendReview;
    onPress?: (item: FriendReview) => void;
};

const EMPTY_PROFILE = require('../../assets/image/empty_sheetProfile.png');

const PHOTO_SIZE = 48;
const AVATAR_SIZE = 24;
// 닉네임 최대 8자 안 잘리게 이거 기준으로 패딩 설정
const NICKNAME_MAX_WIDTH = 78;

export default function FriendReviewItem({item, onPress}: Props) {
    return (
        <Pressable style={styles.container} onPress={() => onPress?.(item)}>
            <View style={styles.photoWrapper}>
                <FastImage
                    source={{uri: item.thumbnail_small_url ?? item.thumbnail_url}}
                    style={styles.photo}
                    resizeMode={FastImage.resizeMode.cover}
                />
                {/* 기본 이미지를 먼저 깔아두고, 실제 프로필 사진을 그 위에 겹쳐 그림.
                    네트워크 이미지는 로딩 중엔 투명해서 밑에 깔린 기본 이미지가 그대로 비쳐 보이다가,
                    로딩이 끝나는 순간 자연스럽게 실제 사진으로 덮임 (별도 로딩 상태 관리 불필요).
                    기본 이미지는 FastImage 대신 일반 Image로 - FastImage는 로컬(require) 이미지도
                    콜드스타트 직후엔 네이티브 캐시 파이프라인이 아직 안 데워져서 잠깐 투명하게 나올 수 있음.
                    안드로이드 일반 Image는 borderRadius+borderWidth를 같이 줘도 내용물 자체가 원형으로
                    안 잘리는 버그가 있어서, overflow:hidden인 별도 래퍼로 감싸서 강제로 잘라줌 */}
                <View style={styles.avatar}>
                    <Image source={EMPTY_PROFILE} style={styles.avatarFillEmpty} resizeMode="cover" />
                </View>
                {item.user.profile_url && (
                    <View style={styles.avatar}>
                        <FastImage
                            source={{uri: item.user.profile_url}}
                            style={styles.avatarFill}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    </View>
                )}
            </View>
            <Text style={styles.nickname} numberOfLines={1}>{item.user.nickname}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: NICKNAME_MAX_WIDTH,
        gap: gap.sm,
    },
    photoWrapper: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
    },
    photo: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        borderRadius: PHOTO_SIZE / 2,
        backgroundColor: colors.surface.muted,
    },
    avatar: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 1,
        borderColor: colors.surface.white,
        overflow: 'hidden',
    },
    avatarFill: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
    },
    avatarFillEmpty: {
        position: 'absolute',
        width: AVATAR_SIZE * 1.4,
        height: AVATAR_SIZE * 1.4,
        top: -(AVATAR_SIZE * 0.2),
        left: -(AVATAR_SIZE * 0.2),
    },
    nickname: {
        ...typography.c3,
        color: colors.text.inverse,
        textAlign: 'center',
    },
});
