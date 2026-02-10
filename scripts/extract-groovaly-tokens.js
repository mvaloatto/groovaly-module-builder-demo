var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
var fallback = {
    source: 'fallback',
    generatedAt: '',
    tokens: {
        backgroundColor: '#f7f4ef',
        textColor: '#111111',
        mutedColor: '#666666',
        borderColor: 'rgba(0,0,0,0.25)',
        headingFontFamily: 'system-ui, sans-serif',
        bodyFontFamily: 'system-ui, sans-serif',
        headingFontSize: 'clamp(1.5rem, 2vw, 2rem)',
        headingLetterSpacing: '0',
        headingTextTransform: 'none',
        buttonBackgroundColor: '#111111',
        buttonTextColor: '#ffffff',
        buttonBorderRadius: '999px',
        buttonPadding: '0.6rem 1rem',
        buttonFontFamily: 'system-ui, sans-serif',
        buttonFontSize: '0.95rem',
        buttonTextTransform: 'none',
    },
    cssVariables: {},
};
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var outputPath, headless, browser, page, extracted, result, error_1, failed;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        return __generator(this, function (_8) {
            switch (_8.label) {
                case 0:
                    outputPath = path.resolve(process.cwd(), 'src/design-tokens.json');
                    headless = process.env.PW_HEADLESS !== 'false';
                    _8.label = 1;
                case 1:
                    _8.trys.push([1, 7, 9, 11]);
                    return [4 /*yield*/, chromium.launch({ headless: headless })];
                case 2:
                    browser = _8.sent();
                    return [4 /*yield*/, browser.newPage({ viewport: { width: 1440, height: 900 } })];
                case 3:
                    page = _8.sent();
                    return [4 /*yield*/, page.goto('https://www.groovaly.com/', {
                            waitUntil: 'networkidle',
                            timeout: 45000,
                        })];
                case 4:
                    _8.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            var _a, _b, _c, _d, _e;
                            var bodyEl = document.body;
                            var headingEl = (_a = document.querySelector('h1')) !== null && _a !== void 0 ? _a : document.querySelector('h2');
                            var ctaEl = (_e = (_d = (_c = (_b = document.querySelector('button')) !== null && _b !== void 0 ? _b : document.querySelector('a.sqs-button-element--primary')) !== null && _c !== void 0 ? _c : document.querySelector('a[class*="button"]')) !== null && _d !== void 0 ? _d : document.querySelector('a[role="button"]')) !== null && _e !== void 0 ? _e : document.querySelector('input[type="submit"]');
                            var bodyStyle = bodyEl ? window.getComputedStyle(bodyEl) : null;
                            var headingStyle = headingEl ? window.getComputedStyle(headingEl) : null;
                            var ctaStyle = ctaEl ? window.getComputedStyle(ctaEl) : null;
                            var body = bodyStyle
                                ? {
                                    backgroundColor: bodyStyle.backgroundColor,
                                    color: bodyStyle.color,
                                    fontFamily: bodyStyle.fontFamily,
                                    fontSize: bodyStyle.fontSize,
                                    letterSpacing: bodyStyle.letterSpacing,
                                    textTransform: bodyStyle.textTransform,
                                    borderRadius: bodyStyle.borderRadius,
                                    padding: bodyStyle.padding,
                                }
                                : null;
                            var heading = headingStyle
                                ? {
                                    backgroundColor: headingStyle.backgroundColor,
                                    color: headingStyle.color,
                                    fontFamily: headingStyle.fontFamily,
                                    fontSize: headingStyle.fontSize,
                                    letterSpacing: headingStyle.letterSpacing,
                                    textTransform: headingStyle.textTransform,
                                    borderRadius: headingStyle.borderRadius,
                                    padding: headingStyle.padding,
                                }
                                : null;
                            var cta = ctaStyle
                                ? {
                                    backgroundColor: ctaStyle.backgroundColor,
                                    color: ctaStyle.color,
                                    fontFamily: ctaStyle.fontFamily,
                                    fontSize: ctaStyle.fontSize,
                                    letterSpacing: ctaStyle.letterSpacing,
                                    textTransform: ctaStyle.textTransform,
                                    borderRadius: ctaStyle.borderRadius,
                                    padding: ctaStyle.padding,
                                }
                                : null;
                            var rootStyle = getComputedStyle(document.documentElement);
                            var cssVariables = {};
                            for (var _i = 0, _f = Array.from(rootStyle); _i < _f.length; _i++) {
                                var name_1 = _f[_i];
                                if (!name_1.startsWith('--'))
                                    continue;
                                var value = rootStyle.getPropertyValue(name_1).trim();
                                if (!value)
                                    continue;
                                var isRelevant = /(color|font|radius|space|size|letter|transform|line|button)/i.test(name_1);
                                if (isRelevant)
                                    cssVariables[name_1] = value;
                            }
                            return { body: body, heading: heading, cta: cta, cssVariables: cssVariables };
                        })];
                case 5:
                    extracted = _8.sent();
                    result = {
                        source: 'https://www.groovaly.com/',
                        generatedAt: new Date().toISOString(),
                        tokens: {
                            backgroundColor: (_b = (_a = extracted.body) === null || _a === void 0 ? void 0 : _a.backgroundColor) !== null && _b !== void 0 ? _b : fallback.tokens.backgroundColor,
                            textColor: (_d = (_c = extracted.body) === null || _c === void 0 ? void 0 : _c.color) !== null && _d !== void 0 ? _d : fallback.tokens.textColor,
                            mutedColor: fallback.tokens.mutedColor,
                            borderColor: fallback.tokens.borderColor,
                            headingFontFamily: (_h = (_f = (_e = extracted.heading) === null || _e === void 0 ? void 0 : _e.fontFamily) !== null && _f !== void 0 ? _f : (_g = extracted.body) === null || _g === void 0 ? void 0 : _g.fontFamily) !== null && _h !== void 0 ? _h : fallback.tokens.headingFontFamily,
                            bodyFontFamily: (_k = (_j = extracted.body) === null || _j === void 0 ? void 0 : _j.fontFamily) !== null && _k !== void 0 ? _k : fallback.tokens.bodyFontFamily,
                            headingFontSize: (_m = (_l = extracted.heading) === null || _l === void 0 ? void 0 : _l.fontSize) !== null && _m !== void 0 ? _m : fallback.tokens.headingFontSize,
                            headingLetterSpacing: (_p = (_o = extracted.heading) === null || _o === void 0 ? void 0 : _o.letterSpacing) !== null && _p !== void 0 ? _p : fallback.tokens.headingLetterSpacing,
                            headingTextTransform: (_r = (_q = extracted.heading) === null || _q === void 0 ? void 0 : _q.textTransform) !== null && _r !== void 0 ? _r : fallback.tokens.headingTextTransform,
                            buttonBackgroundColor: (_t = (_s = extracted.cta) === null || _s === void 0 ? void 0 : _s.backgroundColor) !== null && _t !== void 0 ? _t : fallback.tokens.buttonBackgroundColor,
                            buttonTextColor: (_v = (_u = extracted.cta) === null || _u === void 0 ? void 0 : _u.color) !== null && _v !== void 0 ? _v : fallback.tokens.buttonTextColor,
                            buttonBorderRadius: (_x = (_w = extracted.cta) === null || _w === void 0 ? void 0 : _w.borderRadius) !== null && _x !== void 0 ? _x : fallback.tokens.buttonBorderRadius,
                            buttonPadding: (_z = (_y = extracted.cta) === null || _y === void 0 ? void 0 : _y.padding) !== null && _z !== void 0 ? _z : fallback.tokens.buttonPadding,
                            buttonFontFamily: (_3 = (_1 = (_0 = extracted.cta) === null || _0 === void 0 ? void 0 : _0.fontFamily) !== null && _1 !== void 0 ? _1 : (_2 = extracted.body) === null || _2 === void 0 ? void 0 : _2.fontFamily) !== null && _3 !== void 0 ? _3 : fallback.tokens.buttonFontFamily,
                            buttonFontSize: (_5 = (_4 = extracted.cta) === null || _4 === void 0 ? void 0 : _4.fontSize) !== null && _5 !== void 0 ? _5 : fallback.tokens.buttonFontSize,
                            buttonTextTransform: (_7 = (_6 = extracted.cta) === null || _6 === void 0 ? void 0 : _6.textTransform) !== null && _7 !== void 0 ? _7 : fallback.tokens.buttonTextTransform,
                        },
                        cssVariables: extracted.cssVariables,
                    };
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')];
                case 6:
                    _8.sent();
                    console.log("Wrote tokens to ".concat(outputPath, " (headless=").concat(headless, ")"));
                    return [3 /*break*/, 11];
                case 7:
                    error_1 = _8.sent();
                    failed = __assign(__assign({}, fallback), { generatedAt: new Date().toISOString() });
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(failed, null, 2), 'utf8')];
                case 8:
                    _8.sent();
                    console.error('Token extraction failed, fallback tokens written.', error_1);
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, (browser === null || browser === void 0 ? void 0 : browser.close())];
                case 10:
                    _8.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
void run();
