import getContrastYIQ from './contrast';

describe("getContrastYIQ", () => {
    test.each([
        ['#F44336', 'light'], ['#E91E63', 'light'], ['#9C27B0', 'light'], ['#3F51B5', 'light'],
        ['#2196F3', 'light'], ['#03A9F4', 'light'], ['#00BCD4', 'light'], ['#009688', 'light'],
        ['#4CAF50', 'light'], ['#8BC34A', 'light'], ['#CDDC39', 'dark'], ['#FFEB3B', 'dark'],
        ['#FFC107', 'light'], ['#FF9800', 'light'], ['#FF5722', 'light'], ['#795548', 'light'],
    ])("palette %s gives %s text", (color, expected) => {
        expect(getContrastYIQ(color)).toEqual(expected);
    });

    test("white gives dark text", () => {
        expect(getContrastYIQ('#FFFFFF')).toEqual('dark');
    });

    test("lower case hex", () => {
        expect(getContrastYIQ('#ffffff')).toEqual('dark');
    });

    test("black gives light text", () => {
        expect(getContrastYIQ('#000000')).toEqual('light');
    });

    // B12: 3-digit hex parses as NaN, so white gets light text. The fix expects 'dark'.
    test("3-digit white gives light text (B12)", () => {
        expect(getContrastYIQ('#fff')).toEqual('light');
    });
});
