export const fontFamily = {
    bold:    'Pretendard-Bold',
    medium:  'Pretendard-Medium',
    regular: 'Pretendard-Regular',
} as const;

export const fontSize = {
    xl: 18,
    h1: 24,
    h2: 22,
    h3: 20,
    h4: 18,
    b1: 16,
    b2: 14,
    xs: 12,
    b3: 12,
    b4: 12,
    caption1: 10,
    caption2: 10,
} as const;

export const fontWeight = {
    bold:   '700',
    medium: '500',
} as const;

export const lineHeight = {
    h1: 28,
    h2: 26,
    h3: 24,
    h4: 22,
    b1: 20,
    b2: 18,
    b3: 16,
    b4: 16,
    caption1: 12,
    caption2: 12,
} as const;

// 자주 쓰는 조합 묶음
export const typography = {
    h1:       { fontFamily: fontFamily.bold,    fontSize: fontSize.h1,       lineHeight: lineHeight.h1       },
    h2:       { fontFamily: fontFamily.bold,    fontSize: fontSize.h2,       lineHeight: lineHeight.h2       },
    h3:       { fontFamily: fontFamily.bold,    fontSize: fontSize.h3,       lineHeight: lineHeight.h3       },
    h4:       { fontFamily: fontFamily.bold,    fontSize: fontSize.h4,       lineHeight: lineHeight.h4       },
    b1:       { fontFamily: fontFamily.bold,    fontSize: fontSize.b1,       lineHeight: lineHeight.b1       },
    b2:       { fontFamily: fontFamily.bold,    fontSize: fontSize.b2,       lineHeight: lineHeight.b2       },
    b3:       { fontFamily: fontFamily.bold,    fontSize: fontSize.b3,       lineHeight: lineHeight.b3       },
    b4:       { fontFamily: fontFamily.medium,  fontSize: fontSize.b4,       lineHeight: lineHeight.b4       },
    caption1: { fontFamily: fontFamily.bold,    fontSize: fontSize.caption1, lineHeight: lineHeight.caption1 },
    caption2: { fontFamily: fontFamily.medium,  fontSize: fontSize.caption2, lineHeight: lineHeight.caption2 },
} as const;
