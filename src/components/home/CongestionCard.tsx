import React, {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import Svg, {Path, Defs, LinearGradient, Stop, Line} from 'react-native-svg';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {padding, gap} from '../../constants/spacing';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import {NearbyCongestionLevel, CongestionForecast, WeatherData} from '../../api/congestion';
import WeatherIcon from '../../assets/icons/weather/WeatherIcon';

type Props = {
    areaName: string;
    baseTime: string;           // "MM.DD HH:mm" 포맷 - 화면 표시용
    currentLevel: NearbyCongestionLevel;
    updatedAt: string;          // ISO 문자열 - 6h/12h 라벨 인덱스 계산용
    forecast: CongestionForecast[];
    weather?: WeatherData | null;
    onPressArea?: () => void;
};

const LEVEL_LABEL: Record<NearbyCongestionLevel, string> = {
    RELAXED:      '여유',
    MODERATE:     '보통',
    CROWDED:      '약간 붐빔',
    VERY_CROWDED: '붐빔',
};

// 혼잡도에 따른 그래프 높이
const LEVEL_HEIGHT_RATIO: Record<NearbyCongestionLevel, number> = {
    RELAXED:      1 / 4,
    MODERATE:     2 / 4,
    CROWDED:      3 / 4,
    VERY_CROWDED: 4 / 4,
};

// 혼잡도에 따른 그래프 투명도
const LEVEL_OPACITY: Record<NearbyCongestionLevel, number> = {
    RELAXED:      0.2,
    MODERATE:     0.45,
    CROWDED:      0.7,
    VERY_CROWDED: 1.0,
};

const BAR_H = 36;
const BAR_W = 1000;

// forecast 배열 + 현재 포인트에서 baseTime 기준 offsetHours에 가장 가까운 인덱스
function findClosestIndex(
    levels: NearbyCongestionLevel[],
    times: string[],
    offsetHours: number,
): number {
    const target = new Date(times[0]).getTime() + offsetHours * 3600 * 1000;
    let closest = 0;
    let minDiff = Infinity;
    times.forEach((t, i) => {
        const diff = Math.abs(new Date(t).getTime() - target);
        if (diff < minDiff) {
            minDiff = diff;
            closest = i;
        }
    });
    return closest;
}

export default function CongestionCard({areaName, baseTime, currentLevel, updatedAt, forecast, weather, onPressArea}: Props) {
    const {pathD, gradientStops, labelIndices, allLevels, allTimes, xs} = useMemo(() => {
        // 현재 포인트 + forecast 전체를 합쳐서 그래프 그리기
        const levels: NearbyCongestionLevel[] = [currentLevel, ...forecast.map(f => f.congestion_level)];
        const times: string[] = [updatedAt, ...forecast.map(f => f.time)];
        const N = levels.length;

        const xs = levels.map((_, i) => BAR_W * i / Math.max(N - 1, 1));
        const ys = levels.map(l => BAR_H * (1 - LEVEL_HEIGHT_RATIO[l]));
        const cp = (BAR_W / Math.max(N - 1, 1)) * 0.45;

        // 전체 포인트를 베지어 곡선으로 연결
        const parts = [`M 0,${ys[0]}`];
        for (let i = 1; i < N; i++) {
            parts.push(`C ${xs[i-1]+cp},${ys[i-1]} ${xs[i]-cp},${ys[i]} ${xs[i]},${ys[i]}`);
        }
        parts.push(`L ${BAR_W},${ys[N-1]}`, `L ${BAR_W},${BAR_H}`, `L 0,${BAR_H}`, 'Z');

        // 그라디언트 스탑: 모든 포인트 위치에 해당 레벨의 투명도
        const stops = levels.map((l, i) => ({
            offset: (xs[i] / BAR_W).toFixed(4),
            opacity: LEVEL_OPACITY[l],
        }));

        // 하단 라벨: 현재(0h) / 6시간 후 / 12시간 후에 가장 가까운 인덱스
        const idx6h  = findClosestIndex(levels, times, 6);
        const idx12h = findClosestIndex(levels, times, 12);

        return {
            pathD: parts.join(' '),
            gradientStops: stops,
            labelIndices: [0, idx6h, idx12h],
            allLevels: levels,
            allTimes: times,
            xs,
        };
    }, [currentLevel, updatedAt, forecast]);

    const labelDefs = [
        {label: '현재',      align: 'flex-start' as const},
        {label: '6시간 후',  align: 'center'     as const},
        {label: '12시간 후', align: 'flex-end'   as const},
    ];

    return (
        <View style={styles.container}>
            {/* 상단: 장소명 + 기준 시간 */}
            <View style={styles.topRow}>
                <Pressable style={styles.areaRow} onPress={onPressArea}>
                    <Text style={styles.areaName} numberOfLines={1}>{areaName}</Text>
                    <IconChevronDown size={16} color={colors.text.inverse} />
                </Pressable>
                <Text style={styles.baseTime}>{baseTime} 기준 혼잡도</Text>
            </View>

            {/* 그래프 */}
            <View style={styles.barWrapper}>
                <Svg
                    width="100%"
                    height={BAR_H}
                    viewBox={`0 0 ${BAR_W} ${BAR_H}`}
                    preserveAspectRatio="none">
                    <Defs>
                        <LinearGradient id="congGrad" x1="0" y1="0" x2="1" y2="0">
                            {gradientStops.map((s, i) => (
                                <Stop
                                    key={i}
                                    offset={s.offset}
                                    stopColor="white"
                                    stopOpacity={s.opacity}
                                />
                            ))}
                        </LinearGradient>
                    </Defs>
                    <Path d={pathD} fill="url(#congGrad)" />
                    {labelIndices.map((idx, i) => (
                        <Line
                            key={`dash-${i}`}
                            x1={xs[idx]}
                            y1={0}
                            x2={xs[idx]}
                            y2={BAR_H}
                            stroke="white"
                            strokeOpacity={1}
                            strokeWidth={2}
                            strokeDasharray="3,3"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </Svg>
            </View>

            {/* 하단 라벨 */}
            <View style={styles.bottomRow}>
                {labelDefs.map(({label, align}, i) => {
                    const level = allLevels[labelIndices[i]];
                    return (
                        <View key={i} style={[styles.pointCol, {alignItems: align}]}>
                            <View style={styles.pointInner}>
                                <Text style={styles.timeLabel}>{label}</Text>
                                <Text style={styles.levelLabel}>{LEVEL_LABEL[level]}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* 날씨 카드 */}
            {weather && (
                <View style={styles.weatherCard}>
                    <Text style={styles.weatherLabel}>현재 날씨</Text>
                    <View style={styles.weatherRight}>
                        <WeatherIcon
                            skyStatus={weather.sky_status}
                            precipitationType={weather.precipitation_type}
                            size={12}
                            color={colors.text.inverse}
                        />
                        <View style={styles.weatherIconGap} />
                        <Text style={styles.weatherSky}>{weather.sky_status}</Text>
                        <View style={styles.weatherSkyGap} />
                        <Text style={styles.weatherTemp}>{weather.temperature}°</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface.subtleDarker,
        borderRadius: 16,
        paddingHorizontal: padding.md,
        paddingVertical: padding.lg,
        gap: gap.md,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    areaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,
    },
    areaName: {
        ...typography.b3,
        color: colors.text.inverse,
    },
    baseTime: {
        ...typography.c3,
        color: colors.text.inverse,
    },
    barWrapper: {
        height: BAR_H,
        borderRadius: 4,
        overflow: 'hidden',
        marginHorizontal: padding.sm,
    },
    bottomRow: {
        flexDirection: 'row',
    },
    pointCol: {
        flex: 1,
    },
    pointInner: {
        alignItems: 'center',
        gap: gap.xs,
    },
    timeLabel: {
        ...typography.c3,
        color: colors.text.inverse,
    },
    levelLabel: {
        ...typography.c1,
        color: colors.text.inverse,
    },
    weatherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    weatherLabel: {
        ...typography.c3,
        color: colors.text.inverse,
    },
    weatherRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weatherIconGap: {
        width: gap.xs,
    },
    weatherSkyGap: {
        width: gap.sm,
    },
    weatherSky: {
        ...typography.c3,
        color: colors.text.inverse,
    },
    weatherTemp: {
        ...typography.b5,
        color: colors.text.inverse,
    },
});
