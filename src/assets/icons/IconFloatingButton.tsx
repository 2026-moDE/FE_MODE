import React from 'react';
import {Svg, Circle, Line} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

// 리뷰 상세 페이지에서 바로 리뷰 페이지 가는 플로팅 버튼 아이콘
export default function IconFloatingButton({size = 28, color = '#FFFFFF'}: Props) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Line x1="14.31" y1="8" x2="20.05" y2="17.94" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Line x1="9.69" y1="8" x2="21.17" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Line x1="7.38" y1="12" x2="13.12" y2="2.06" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Line x1="9.69" y1="16" x2="3.95" y2="6.06" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Line x1="14.31" y1="16" x2="2.83" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Line x1="16.62" y1="12" x2="10.88" y2="21.94" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}
