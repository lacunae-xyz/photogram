import { periodToClassName, periodToSrc } from './period';

describe("period", () => {
    test.each([
        ["matin", "dot-light", "weather-sunset-up.svg"],
        ["jour", "dot-lighter", "weather-sunny.svg"],
        ["soir", "dot-dark", "weather-sunset-down.svg"],
        ["nuit", "dot-darker", "weather-night.svg"],
        ["MATIN", "dot-light", "weather-sunset-up.svg"],
        ["Nuit", "dot-darker", "weather-night.svg"],
        ["m", "dot-light", "weather-sunset-up.svg"],
        ["morning", "dot-light", "weather-sunset-up.svg"],
        ["", "hide", "weather-none.svg"],
        [undefined, "hide", "weather-none.svg"],
        ["après-midi", "hide", "weather-none.svg"],
        [" matin", "hide", "weather-none.svg"],
    ])("%p gives %s and %s", (value, className, src) => {
        expect(periodToClassName(value)).toEqual(className);
        expect(periodToSrc(value)).toEqual(src);
    });
});
