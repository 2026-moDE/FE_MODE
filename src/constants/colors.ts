// ===========================
// Primitive Colors
// ===========================

const palette = {
    // Primary - Blue
    blue: {
        50:  '#F0F4FF',
        100: '#E1E9FF',
        200: '#C2D3FF',
        300: '#A3BDFF',
        400: '#83A6FF',  // Primary
        500: '#6489F2',
        600: '#456DD6',
        700: '#2651B9',
        800: '#07359D',
        900: '#002380',
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
        900: '#1A2133',
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
        primary:   palette.blue[400],   // #83A6FF
        secondary: palette.navy[800],   // #2C343F
    },

    // Button
    button: {
        primaryFill:      palette.blue[400],   // #83A6FF
        primaryLighter:   palette.blue[100],   // #E1E9FF
        primaryPressed:   palette.blue[500],   // #6489F2
        secondaryFill:    palette.navy[800],   // #2C343F
        secondaryLighter: palette.navy[50],    // #F1F3F5
        tertiaryFill:     palette.gray[0],     // #FFFFFF
        darkFill:         palette.gray[900],   // #111114
        disabledFill:     palette.gray[100],   // #E0E0E4
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
        white:    palette.gray[0],    // #FFFFFF
        default:  palette.gray[50],   // #F1F1F4
        muted:    palette.gray[100],  // #E0E0E4
        elevated: palette.gray[25],   // #F9F9FA
        brand:    palette.blue[400],  // #83A6FF
        inverse:  palette.gray[900],  // #111114
        subtle:   palette.navy[800],  // #2C343F
    },

    // Text
    text: {
        basic:    palette.gray[900],  // #111114
        subtle:   palette.navy[600],  // #4B566D
        tertiary: palette.gray[500],  // #5C5D68
        disabled: palette.gray[200],  // #C4C4C8
        brand:    palette.blue[500],  // #6489F2
        inverse:  palette.gray[0],    // #FFFFFF
    },

    // Icon
    icon: {
        basic:        palette.navy[800],  // #2C343F
        subtle:       palette.navy[600],  // #4B566D
        tertiary:     palette.gray[300],  // #A3A3AA
        brandLighter: palette.blue[200],  // #C2D3FF
        brand:        palette.blue[400],  // #83A6FF
        brandDarker:  palette.blue[600],  // #456DD6
        inverse:      palette.gray[0],    // #FFFFFF
    },

    // Border
    border: {
        default: palette.gray[100],  // #E0E0E4
        subtle:  palette.gray[50],   // #F1F1F4
        strong:  palette.gray[200],  // #C4C4C8
        brand:   palette.blue[400],  // #83A6FF
        inverse: palette.gray[0],    // #FFFFFF
        black:   palette.gray[900],  // #111114
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
