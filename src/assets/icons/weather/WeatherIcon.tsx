import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import IconWeatherSunny from './IconWeatherSunny';
import IconWeatherMoon from './IconWeatherMoon';
import IconWeatherSunnyCloudy from './IconWeatherSunnyCloudy';
import IconWeatherMoonCloudy from './IconWeatherMoonCloudy';
import IconWeatherCloudy from './IconWeatherCloudy';
import IconWeatherRain from './IconWeatherRain';
import IconWeatherSnow from './IconWeatherSnow';

type Props = {
    skyStatus: string;
    precipitationType?: string;
    size?: number;
    color?: string;
    style?: StyleProp<ViewStyle>;
};

function isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
}

export default function WeatherIcon({skyStatus, precipitationType, size, color, style}: Props) {
    // 실제 강수 중이면 precipitation_type 우선
    if (precipitationType === '눈') {
        return <IconWeatherSnow size={size} color={color} style={style} />;
    }
    if (precipitationType === '비' || precipitationType === '비또는눈') {
        return <IconWeatherRain size={size} color={color} style={style} />;
    }

    const night = isNightTime();

    if (skyStatus === '맑음') {
        return night
            ? <IconWeatherMoon size={size} color={color} style={style} />
            : <IconWeatherSunny size={size} color={color} style={style} />;
    }
    if (skyStatus === '구름많음') {
        return night
            ? <IconWeatherMoonCloudy size={size} color={color} style={style} />
            : <IconWeatherSunnyCloudy size={size} color={color} style={style} />;
    }
    // '흐림' 또는 알 수 없는 값
    return <IconWeatherCloudy size={size} color={color} style={style} />;
}
