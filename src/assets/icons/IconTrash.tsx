import React from 'react';
import {Svg, Path} from 'react-native-svg';

type Props = {
    size?: number;
    color?: string;
};

export default function IconTrash({size = 16, color = '#000000'}: Props) {
    return (
        <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
            <Path
                d="M9.33341 7.33333V11.3333M6.66675 7.33333V11.3333M4.00008 4.66667V12.6667C4.00008 13.0203 4.14056 13.3594 4.39061 13.6095C4.64065 13.8595 4.97979 14 5.33341 14H10.6667C11.0204 14 11.3595 13.8595 11.6096 13.6095C11.8596 13.3594 12.0001 13.0203 12.0001 12.6667V4.66667M2.66675 4.66667H13.3334M4.66675 4.66667L6.00008 2H10.0001L11.3334 4.66667"
                stroke={color}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
