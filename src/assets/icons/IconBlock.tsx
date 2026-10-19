import React from 'react';
import {Svg, Circle, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

// 차단(금지 표시: 원 + 대각선).
// 같은 드롭다운의 '친구 끊기'가 X 아이콘이라, 구분되는 모양이어야 해서 따로 둔다
export default function IconBlock({size = 18, color = '#000000'}: Props) {
    return (
        <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
            <Circle cx="8" cy="8" r="6.25" stroke={color} strokeWidth={1.5} />
            {/* 대각선 끝점은 원에 딱 닿는 지점 (r/√2 ≈ 4.42를 중심에서 양쪽으로) */}
            <Path
                d="M3.58 3.58L12.42 12.42"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
            />
        </Svg>
    );
}
