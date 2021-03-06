'use strict';

const kelvinToXyLookup = require('./lookup/kelvinToXy');

/**
 * From: https://github.com/usolved/cie-rgb-converter/blob/master/cie_rgb_converter.js
 * Converts RGB color space to CIE color space
 * @param {Number} red
 * @param {Number} green
 * @param {Number} blue
 * @return {Array} Array that contains the CIE color values for x and y
 */
function rgbToXY(red, green, blue) {
    // The RGB values should be between 0 and 1. So convert them.
    // The RGB color (255, 0, 100) becomes (1.0, 0.0, 0.39)
    red /= 255; green /= 255; blue /= 255;

    // Apply a gamma correction to the RGB values, which makes the color
    // more vivid and more the like the color displayed on the screen of your device
    red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
    green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
    blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

    // RGB values to XYZ using the Wide RGB D65 conversion formula
    const X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
    const Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
    const Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

    // Calculate the xy values from the XYZ values
    let x = (X / (X + Y + Z)).toFixed(4);
    let y = (Y / (X + Y + Z)).toFixed(4);

    if (isNaN(x)) {
        x = 0;
    }

    if (isNaN(y)) {
        y = 0;
    }

    return {x: Number.parseFloat(x), y: Number.parseFloat(y)};
}

function hexToXY(hex) {
    const rgb = hexToRgb(hex);
    return rgbToXY(rgb.r, rgb.g, rgb.b);
}

function miredsToKelvin(mireds) {
    return 1000000 / mireds;
}

function miredsToXY(mireds) {
    const kelvin = miredsToKelvin(mireds);
    return kelvinToXyLookup[Math.round(kelvin)];
}

function kelvinToMireds(kelvin) {
    return 1000000 / kelvin;
}

function xyToMireds(x, y) {
    const n = (x-0.3320)/(0.1858-y);
    const kelvin = 437*n^3 + 3601*n^2 + 6861*n + 5517;
    return Math.round(kelvinToMireds(Math.abs(kelvin)));
}

function hslToHsb(h, s, l) {
    h = h % 360;
    s = s / 100;
    l = l / 100;
    const retH = h;
    const retB = s * Math.min(l, 1-l) + l;
    const retS = retB ? 2-2*l/retB : 0;
    return {h: retH, s: retS, b: retB};
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return {r: r, g: g, b: b};
}

function getKeyByValue(object, value, fallback) {
    const key = Object.keys(object).find((k) => object[k] === value);
    return key != null ? Number(key) : (fallback || 0);
}

function hasEndpoints(device, endpoints) {
    const eps = device.endpoints.map((e) => e.ID);
    for (const endpoint of endpoints) {
        if (!eps.includes(endpoint)) {
            return false;
        }
    }
    return true;
}

const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min)) + min;

const convertMultiByteNumberPayloadToSingleDecimalNumber = (chunks) => {
    // Destructuring "chunks" is needed because it's a Buffer
    // and we need a simple array.
    let value = 0;
    for (let i = 0; i < chunks.length; i++) {
        value = value << 8;
        value += chunks[i];
    }
    return value;
};

const convertDecimalValueTo2ByteHexArray = (value) => {
    const hexValue = Number(value).toString(16).padStart(4, '0');
    const chunk1 = hexValue.substr(0, 2);
    const chunk2 = hexValue.substr(2);
    return [chunk1, chunk2].map((hexVal) => parseInt(hexVal, 16));
};

module.exports = {
    rgbToXY,
    hexToXY,
    hexToRgb,
    hslToHsb,
    getKeyByValue,
    hasEndpoints,
    miredsToXY,
    xyToMireds,
    getRandomInt,
    convertMultiByteNumberPayloadToSingleDecimalNumber,
    convertDecimalValueTo2ByteHexArray,
};
