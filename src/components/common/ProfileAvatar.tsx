import React, {useEffect, useMemo, useState} from 'react';
import {View, Image, StyleProp, ViewStyle} from 'react-native';
// FastImage는 자체 ImageStyle 타입을 씀(모서리 반경이 number만 허용) - 더 좁은 쪽에 맞춰야 양쪽에 다 넘길 수 있음
import FastImage, {type ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';

// 흰색 로고(투명 배경). empty_profile.png를 그대로 늘리면 그 안의 둥근 테두리까지 확대돼 어색해서,
// 배경색은 색으로 깔고 로고만 따로 올림
const LOGO = require('../../assets/image/logo_new.png');
// empty_profile.png에서 실측한 배경색
const EMPTY_BG = '#F1F1F4';
const LOGO_RATIO = 0.5;            // 짧은 변 대비 로고 너비
const LOGO_ASPECT = 120 / 192;     // logo_new.png 원본 비율

type Props = {
    // 서버가 주는 두 필드를 그대로 넘기면 됨 (가공본 우선, 실패하면 원본)
    profileUrl?: string | null;
    profileImageUrl?: string | null;
    style?: StyleProp<FastImageStyle>;
};

// 프로필 사진 공통 렌더링.
// profile_url(가공본) → profile_image_url(원본) → 기본 이미지 순으로 떨어짐.
// 가공본은 업로드 직후 아직 생성 전일 수 있어서, 실패하면 원본으로 다시 시도해야 함.
export default function ProfileAvatar({profileUrl, profileImageUrl, style}: Props) {
    const candidates = useMemo(
        () => [profileUrl, profileImageUrl].filter((v, i, arr): v is string =>
            !!v && arr.indexOf(v) === i,
        ),
        [profileUrl, profileImageUrl],
    );

    const [failedCount, setFailedCount] = useState(0);
    // 대상이 바뀌면 실패 상태를 초기화 - 안 그러면 다른 사람 사진까지 기본 이미지로 남음
    useEffect(() => setFailedCount(0), [candidates]);

    // 로고 크기를 컨테이너에 맞추기 위해 실제 렌더 크기를 잼 (작은 아바타부터 프로필 카드까지 같은 컴포넌트를 씀)
    const [boxSize, setBoxSize] = useState(0);

    const uri = candidates[failedCount];

    // 보여줄 URL이 없거나 후보가 전부 실패하면 기본 이미지
    if (!uri) {
        const logoWidth = boxSize * LOGO_RATIO;
        return (
            <View
                // width/height를 먼저 깔아둠 - 인셋(top/left/right/bottom)만 있는 곳에서는
                // 크기가 안 잡혀 영역을 다 안 채움. 넘어온 style이 있으면 그쪽이 우선
                style={[
                    {
                        backgroundColor: EMPTY_BG,
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    },
                    style as StyleProp<ViewStyle>,
                ]}
                onLayout={event => {
                    const {width, height} = event.nativeEvent.layout;
                    setBoxSize(Math.min(width, height));
                }}>
                {boxSize > 0 && (
                    <Image
                        source={LOGO}
                        style={{width: logoWidth, height: logoWidth * LOGO_ASPECT}}
                        resizeMode="contain"
                    />
                )}
            </View>
        );
    }

    return (
        <FastImage
            key={uri}
            source={{uri, priority: FastImage.priority.high}}
            style={style}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => setFailedCount(count => count + 1)}
        />
    );
}
