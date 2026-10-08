// ===========================
// Primitive Colors
// ===========================

const palette = {
    // Primary - Yellow
    yellow: {
        50:  '#FFFEEB',
        100: '#FFFDBF',
        200: '#FFFD92',
        300: '#FFFD6D',  // Primary
        400: '#F2EF54',
        500: '#D7D33D',
        600: '#B2AE08',
        700: '#8F8D20',
        800: '#66640D',
        900: '#3D3C06',
    },

    // Secondary - Dark Navy
    navy: {
        50:  '#F1F3F5',
        100: '#E1E4E8',
        200: '#C1C7D1',
        300: '#A2ABBA',
        400: '#828EA3',
        500: '#63718C',
        600: '#4B566D',
        700: '#3B4456',
        800: '#2C343F',
        900: '#1B2129',
    },

    // Gray - Neutral gray
    gray: {
        0:   '#FFFFFF',
        25:  '#F9F9FA',
        50:  '#F1F1F4',
        100: '#E0E0E4',
        200: '#C4C4C8',
        300: '#A3A3AA',
        400: '#757680',
        500: '#5C5D68',
        600: '#474850',
        700: '#33343C',
        800: '#222328',
        900: '#111114',
    },

    // Alpha - Black
    black: {
        20: 'rgba(0, 0, 0, 0.2)',
        50: 'rgba(0, 0, 0, 0.5)',
        80: 'rgba(0, 0, 0, 0.8)',
    },
} as const;

// ===========================
// Semantic Colors
// ===========================

export const colors = {

    // Brand
    brand: {
        primary:   palette.yellow[300],  // #FFFD6D
        secondary: palette.navy[800],    // #2C343F
    },

    // Button
    button: {
        primaryFill:      palette.yellow[300],  // #FFFD6D
        primaryLighter:   palette.yellow[100],  // #FFFDBF
        primaryPressed:   palette.yellow[500],  // #D7D33D
        secondaryFill:    palette.navy[800],    // #2C343F
        secondaryLighter: palette.navy[50],     // #F1F3F5
        tertiaryFill:     palette.gray[0],      // #FFFFFF
        darkFill:         palette.gray[900],    // #111114
        disabledFill:     palette.gray[100],    // #E0E0E4
    },

    // Background
    background: {
        white:      palette.gray[0],    // #FFFFFF
        dark:       palette.gray[900],  // #111114
        muted:      palette.gray[25],   // #F9F9FA
        dimDark:    palette.black[20],  // rgba(0,0,0,0.2)
        dimDarker:  palette.black[50],  // rgba(0,0,0,0.5)
        dimDarkest: palette.black[80],  // rgba(0,0,0,0.8)
    },

    // Surface
    surface: {
        white:        palette.gray[0],    // #FFFFFF
        default:      palette.gray[50],   // #F1F1F4
        muted:        palette.gray[100],  // #E0E0E4
        elevated:     palette.gray[25],   // #F9F9FA
        brand:        palette.yellow[300],// #FFFD6D
        inverse:      palette.gray[900],  // #111114
        subtle:       palette.navy[700],  // #3B4456
        subtleDarker: palette.navy[900],  // #1B2129
    },

    // Text
    text: {
        basic:       palette.gray[900],   // #111114
        subtle:      palette.navy[600],   // #4B566D
        tertiary:    palette.gray[500],   // #5C5D68
        disabled:    palette.gray[300],   // #A3A3AA
        brandDarker: palette.yellow[800], // #66640D
        brand:       palette.yellow[300], // #FFFD6D
        inverse:     palette.gray[0],     // #FFFFFF
    },

    // Icon
    icon: {
        basic:        palette.navy[800],   // #2C343F
        subtle:       palette.navy[600],   // #4B566D
        tertiary:     palette.gray[300],   // #A3A3AA
        brandLighter: palette.yellow[100], // #FFFDBF
        brand:        palette.yellow[300], // #FFFD6D
        brandDarker:  palette.yellow[500], // #D7D33D
        inverse:      palette.gray[0],     // #FFFFFF
    },

    // Border
    border: {
        default: palette.gray[100],   // #E0E0E4
        subtle:  palette.gray[50],    // #F1F1F4
        strong:  palette.gray[200],   // #C4C4C8
        brand:   palette.yellow[500], // #D7D33D
        inverse: palette.gray[0],     // #FFFFFF
        black:   palette.gray[900],   // #111114
    },

    // Divider
    divider: {
        default: palette.gray[100],  // #E0E0E4
        light:   palette.gray[50],   // #F1F1F4
        strong:  palette.gray[200],  // #C4C4C8
    },

    // Shortcuts for direct palette access
    white: palette.gray[0],
    gray:  palette.gray,
    navy:  palette.navy,

} as const;
