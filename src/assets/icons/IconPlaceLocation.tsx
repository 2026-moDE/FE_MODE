import React from 'react';
import {Svg, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconPlaceLocation({size = 20, color = '#A3A3AA'}: Props) {
    return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <Path
                d="M5.33325 3.96676C6.57518 2.74967 8.24725 2.07187 9.98611 2.08065C11.725 2.08943 13.3901 2.78409 14.6197 4.01366C15.8493 5.24324 16.5439 6.90837 16.5527 8.64723C16.5615 10.3861 15.8837 12.0582 14.6666 13.3001L11.1782 16.7884C10.8657 17.1009 10.4419 17.2764 9.99991 17.2764C9.55797 17.2764 9.13413 17.1009 8.82158 16.7884L5.33325 13.3001C4.09565 12.0624 3.40039 10.3837 3.40039 8.63343C3.40039 6.88311 4.09565 5.20448 5.33325 3.96676Z"
                stroke={color}
                strokeLinejoin="round"
            />
            <Path
                d="M10 11.1333C11.3807 11.1333 12.5 10.014 12.5 8.6333C12.5 7.25259 11.3807 6.1333 10 6.1333C8.61929 6.1333 7.5 7.25259 7.5 8.6333C7.5 10.014 8.61929 11.1333 10 11.1333Z"
                stroke={color}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
