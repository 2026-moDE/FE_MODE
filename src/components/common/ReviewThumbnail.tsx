import React, {useEffect, useMemo, useState} from 'react';
// FastImage는 자체 ImageStyle 타입을 씀 - ProfileAvatar와 같은 이유로 그 타입에 맞춘다
import FastImage, {
    type ImageStyle as FastImageStyle,
    type OnLoadEvent,
    type ResizeMode,
} from '@d11/react-native-fast-image';
import type {StyleProp} from 'react-native';

type Props = {
    // 서버가 주는 세 필드를 "쓰고 싶은 우선순위대로" 넘기면 된다.
    // 작은 썸네일부터 쓰는 곳(마커·스택)과 큰 썸네일부터 쓰는 곳(카드·뷰어)이 섞여 있어서
    // 컴포넌트가 순서를 정하지 않고 호출하는 쪽이 넘긴 것만 순서대로 쓴다
    thumbnailSmallUrl?: string | null;
    thumbnailUrl?: string | null;
    imageUrl?: string | null;
    style?: StyleProp<FastImageStyle>;
    resizeMode?: ResizeMode;
    onLoad?: (event: OnLoadEvent) => void;
};

// 리뷰 사진 공통 렌더링.
// thumbnail_small_url → thumbnail_url → image_url(원본) 순으로 떨어진다.
//
// 리뷰를 막 등록한 직후엔 서버 리사이즈 썸네일이 아직 만들어지지 않아서 썸네일 URL이 404다.
// 그런데 URL 자체는 null이 아니라 값이 채워져 오기 때문에 `??` 체인으로는 걸러지지 않는다 -
// 실제로 로드가 실패한 걸 보고 다음 후보로 넘어가야 한다 (ProfileAvatar의 가공본/원본과 같은 문제).
export default function ReviewThumbnail({
    thumbnailSmallUrl,
    thumbnailUrl,
    imageUrl,
    style,
    resizeMode = FastImage.resizeMode.cover,
    onLoad,
}: Props) {
    const candidates = useMemo(
        () =>
            [thumbnailSmallUrl, thumbnailUrl, imageUrl].filter(
                (value, index, arr): value is string =>
                    !!value && arr.indexOf(value) === index,
            ),
        [thumbnailSmallUrl, thumbnailUrl, imageUrl],
    );

    const [failedCount, setFailedCount] = useState(0);
    // 대상이 바뀌면 실패 상태를 초기화 - 안 그러면 다음 리뷰 사진까지 원본으로 떨어진 채로 남는다
    useEffect(() => setFailedCount(0), [candidates]);

    const uri = candidates[failedCount];

    // 후보가 아예 없거나 전부 실패하면 아무것도 그리지 않는다
    // (리뷰 카드/스택은 뒤에 깔린 배경색이 플레이스홀더 역할을 한다)
    if (!uri) {
        return null;
    }

    return (
        <FastImage
            // 다음 후보로 넘어갈 때 같은 뷰를 재활용하면 실패한 이미지가 남을 수 있어 key로 새로 그린다
            key={uri}
            source={{uri, priority: FastImage.priority.high}}
            style={style}
            resizeMode={resizeMode}
            onLoad={onLoad}
            onError={() => setFailedCount(count => count + 1)}
        />
    );
}
