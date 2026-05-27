"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var url = ((_b = (_a = process.env.SUPABASE_URL) !== null && _a !== void 0 ? _a : process.env.NEXT_PUBLIC_SUPABASE_URL) !== null && _b !== void 0 ? _b : '').replace(/\/$/, '');
var serviceKey = (_d = (_c = process.env.SUPABASE_SERVICE_ROLE_KEY) !== null && _c !== void 0 ? _c : process.env.SUPABASE_SERVICE_ROLE) !== null && _d !== void 0 ? _d : '';
if (!url) {
    console.warn('[supabase-admin] SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required');
}
if (!serviceKey) {
    console.warn('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE is required');
}
exports.supabaseAdmin = (0, supabase_js_1.createClient)(url, serviceKey);
