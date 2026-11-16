import svgN from './weather-night.svg';
import svgJ from './weather-sunny.svg';
import svgM from './weather-sunset-up.svg';
import svgS from './weather-sunset-down.svg';
import svgNull from './weather-none.svg';

export function periodToClassName(value) {
    switch (toSingleLetter(value)) {
        case "m":
            return "dot-light";
        case "s":
            return "dot-dark";
        case "j":
            return "dot-lighter";
        case "n":
            return "dot-darker";
        default:
            return "hide";

    }
}

export function periodToSrc(value) {
    switch (toSingleLetter(value)) {
        case "m":
            return svgM
        case "s":
            return svgS
        case "j":
            return svgJ
        case "n":
            return svgN
        default:
            return svgNull;

    }
}

function toSingleLetter(value) {
    return value === undefined || value.length === 0
        ? undefined
        : value.toLowerCase()[0];
}
