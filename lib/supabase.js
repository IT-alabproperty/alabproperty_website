"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
// Normalize URL: remove trailing slash and accidental `/rest/v1` suffix
var rawUrl = (_b = (_a = process.env.SUPABASE_URL) !== null && _a !== void 0 ? _a : process.env.NEXT_PUBLIC_SUPABASE_URL) !== null && _b !== void 0 ? _b : '';
var url = rawUrl.replace(/\/$/, '').replace(/\/rest\/v1\/?$/i, '');
var anonKey = (_c = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) !== null && _c !== void 0 ? _c : '';
exports.supabase = (0, supabase_js_1.createClient)(url, anonKey);
