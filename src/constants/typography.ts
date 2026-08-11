export const fontFamily = {
    bold:     'Pretendard-Bold',
    semiBold: 'Pretendard-SemiBold',
    medium:   'Pretendard-Medium',
    regular:  'Pretendard-Regular',
} as const;

export const fontSize = {
    xl: 18,
    h1: 24,
    h2: 22,
    h3: 20,
    h4: 18,
    b1: 18,
    b2: 18,
    xs: 12,
    b3: 16,
    b4: 16,
    b5: 14,
    b6: 14,
    c1: 12,
    c2: 12,
    c3: 10,
    l: 32,       // Display/L
    '5xl': 40,   // font-size-5xl (아직 쓰는 스타일 없음, 원본 스케일 보존용)
} as const;

export const fontWeight = {
    regular:  '400',
    medium:   '500',
    semiBold: '600',
    bold:     '700',
} as const;

export const lineHeight = {
    h1: 28,
    h2: 26,
    h3: 24,
    h4: 22,
    b1: 22,
    b2: 22,
    b3: 20,
    b4: 20,
    b5: 18,
    b6: 18,
    c1: 14,
    c2: 14,
    c3: 12,
    l: 36,       // Display/L
} as const;

// 피그마 letter spacing (fontSize 대비 %) → px 환산값. h4는 피그마에 없어서 0
export const letterSpacing = {
    l: -0.64,    // -2%
    h1: -0.36,   // -1.5%
    h2: -0.33,   // -1.5%
    h3: -0.3,    // -1.5%
    h4: 0,
    b1: -0.18,   // -1%
    b2: -0.18,   // -1%
    b3: -0.08,   // -0.5%
    b4: -0.08,   // -0.5%
    b5: -0.07,   // -0.5%
    b6: -0.07,   // -0.5%
    c1: -0.06,   // -0.5%
    c2: -0.06,   // -0.5%
    c3: -0.05,   // -0.5%
} as const;

// 자주 쓰는 조합 묶음
export const typography = {
    l:        { fontFamily: fontFamily.bold,     fontSize: fontSize.l,  lineHeight: lineHeight.l,  letterSpacing: letterSpacing.l  },
    h1:       { fontFamily: fontFamily.bold,     fontSize: fontSize.h1, lineHeight: lineHeight.h1, letterSpacing: letterSpacing.h1 },
    h2:       { fontFamily: fontFamily.bold,     fontSize: fontSize.h2, lineHeight: lineHeight.h2, letterSpacing: letterSpacing.h2 },
    h3:       { fontFamily: fontFamily.semiBold, fontSize: fontSize.h3, lineHeight: lineHeight.h3, letterSpacing: letterSpacing.h3 },
    h4:       { fontFamily: fontFamily.bold,     fontSize: fontSize.h4, lineHeight: lineHeight.h4, letterSpacing: letterSpacing.h4 },
    b1:       { fontFamily: fontFamily.bold,     fontSize: fontSize.b1, lineHeight: lineHeight.b1, letterSpacing: letterSpacing.b1 },
    b2:       { fontFamily: fontFamily.medium,   fontSize: fontSize.b2, lineHeight: lineHeight.b2, letterSpacing: letterSpacing.b2 },
    b3:       { fontFamily: fontFamily.semiBold, fontSize: fontSize.b3, lineHeight: lineHeight.b3, letterSpacing: letterSpacing.b3 },
    b4:       { fontFamily: fontFamily.medium,   fontSize: fontSize.b4, lineHeight: lineHeight.b4, letterSpacing: letterSpacing.b4 },
    b5:       { fontFamily: fontFamily.semiBold, fontSize: fontSize.b5, lineHeight: lineHeight.b5, letterSpacing: letterSpacing.b5 },
    b6:       { fontFamily: fontFamily.regular,  fontSize: fontSize.b6, lineHeight: lineHeight.b6, letterSpacing: letterSpacing.b6 },
    c1:       { fontFamily: fontFamily.bold,     fontSize: fontSize.c1, lineHeight: lineHeight.c1, letterSpacing: letterSpacing.c1 },
    c2:       { fontFamily: fontFamily.regular,  fontSize: fontSize.c2, lineHeight: lineHeight.c2, letterSpacing: letterSpacing.c2 },
    c3:       { fontFamily: fontFamily.regular,  fontSize: fontSize.c3, lineHeight: lineHeight.c3, letterSpacing: letterSpacing.c3 },
} as const;
