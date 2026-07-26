import React from 'react';
import {Svg, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

// 말풍선 사각형(꼬리 하단 중앙) 안에 + (지금 바로 리뷰 쓰기 버튼용)
export default function IconQuickReview({size = 20, color = '#FFFFFF'}: Props) {
    return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.5 1H15.5C17.43 1 19 2.57 19 4.5V12.5C19 14.43 17.43 16 15.5 16H12.9L10 19.2L7.1 16H4.5C2.57 16 1 14.43 1 12.5V4.5C1 2.57 2.57 1 4.5 1ZM10 3.7C10.5 3.7 10.9 4.1 10.9 4.6V7.6H13.9C14.4 7.6 14.8 8 14.8 8.5C14.8 9 14.4 9.4 13.9 9.4H10.9V12.4C10.9 12.9 10.5 13.3 10 13.3C9.5 13.3 9.1 12.9 9.1 12.4V9.4H6.1C5.6 9.4 5.2 9 5.2 8.5C5.2 8 5.6 7.6 6.1 7.6H9.1V4.6C9.1 4.1 9.5 3.7 10 3.7Z"
                fill={color}
            />
        </Svg>
    );
}
