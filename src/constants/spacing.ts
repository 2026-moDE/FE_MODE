// 예전부터 쓰던 이름 (padding/gap 구분 없이 섞여있음) — 새 코드는 아래 padding/gap을 쓰고,
// 여기 있는 걸 쓰는 기존 코드는 padding/gap으로 옮기시오!!!
export const spacing = {
    xs:   4,
    s:    8,
    sm:   10,
    md:   12,
    lg:   16,
    xl:   20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 80,
} as const;

// padding
export const padding = {
    xs:   4,
    s:    8,
    sm:   10,
    md:   12,
    lg:   16,
    xl:   20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 80,
} as const;

// gap
export const gap = {
    xs:   4,
    sm:   8,
    md:   12,
    lg:   16,
    xl:   20,
    '2xl': 24,
    '3xl': 32,
} as const;
