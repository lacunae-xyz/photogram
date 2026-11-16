import { periodToClassName, periodToSrc } from './period';
import night from './weather-night.svg';
import sunny from './weather-sunny.svg';
import sunsetUp from './weather-sunset-up.svg';
import sunsetDown from './weather-sunset-down.svg';
import none from './weather-none.svg';

describe("period", () => {
    test.each([
        ["matin", "dot-light", sunsetUp],
        ["jour", "dot-lighter", sunny],
        ["soir", "dot-dark", sunsetDown],
        ["nuit", "dot-darker", night],
        ["MATIN", "dot-light", sunsetUp],
        ["Nuit", "dot-darker", night],
        ["m", "dot-light", sunsetUp],
        ["morning", "dot-light", sunsetUp],
        ["", "hide", none],
        [undefined, "hide", none],
        ["après-midi", "hide", none],
        [" matin", "hide", none],
    ])("%s gives %s and %s", (value, className, src) => {
        expect(periodToClassName(value)).toEqual(className);
        expect(periodToSrc(value)).toEqual(src);
    });
});
