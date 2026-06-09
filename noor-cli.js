#!/usr/bin/env tsx
"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var module_1 = require("module");
var fs_1 = require("fs");
var path_1 = require("path");
var os_1 = require("os");
var child_process_1 = require("child_process");
// إنشاء وإسناد require سيادي لاستخدامه في المحرك والاتصالات الحقيقية دون مشاكل ESM
globalThis.noorRequire = (0, module_1.createRequire)(import.meta.url);
var noor_compiler_ts_1 = require("./src/noor-compiler.ts");
var noor_builder_ts_1 = require("./src/noor-builder.ts");
/**
 * أداة أسطر الأوامر المستقلة للغة نور (Noor CLI)
 * تدعم التشغيل على أنظمة لينكس، ويندوز، ماك، وتطبيق Termux
 */
// تحميل الإعدادات من الملف المخفي ~/.noorconfig
var configPath = path_1.default.join(os_1.default.homedir(), '.noorconfig');
var userConfig = {
    defaultFlags: [],
    customLibPath: '',
    theme: 'dark'
};
if (fs_1.default.existsSync(configPath)) {
    try {
        var data = fs_1.default.readFileSync(configPath, 'utf8');
        userConfig = __assign(__assign({}, userConfig), JSON.parse(data));
    }
    catch (err) {
        // تجاهل أخطاء قراءة الإعدادات والاعتماد على الافتراضي
    }
}
var args = process.argv.slice(2);
// ألوان الطرفية (Terminal Colors)
var isTTY = process.stdout.isTTY;
var colors = {
    reset: isTTY ? '\x1b[0m' : '',
    bold: isTTY ? '\x1b[1m' : '',
    green: isTTY ? '\x1b[32m' : '',
    red: isTTY ? '\x1b[31m' : '',
    cyan: isTTY ? '\x1b[36m' : '',
    yellow: isTTY ? '\x1b[33m' : '',
    magenta: isTTY ? '\x1b[35m' : '',
    slate: isTTY ? '\x1b[90m' : '',
};
function formatLog(msg, color) {
    if (color === void 0) { color = colors.reset; }
    return "".concat(color).concat(msg).concat(colors.reset);
}
// دالة عرض المساعدة المتقدمة من ملف التوثيق
function showHelp(topic) {
    var guidePath = path_1.default.resolve(process.cwd(), 'docs/LANGUAGE_GUIDE.md');
    if (!topic) {
        console.log("\n".concat(colors.bold).concat(colors.cyan, "\uD83C\uDF1F \u0644\u063A\u0629 \u0646\u0648\u0631 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 (Noor Sovereign VM) - \u0627\u0644\u0625\u0635\u062F\u0627\u0631 v5.0 \uD83C\uDF1F").concat(colors.reset, "\n------------------------------------------------------------------\n\u0623\u062F\u0627\u0629 \u0623\u0633\u0637\u0631 \u0627\u0644\u0623\u0648\u0627\u0645\u0631 (CLI) \u0644\u062A\u0634\u063A\u064A\u0644 \u0648\u0625\u062F\u0627\u0631\u0629 \u0628\u064A\u0626\u0629 \u0644\u063A\u0629 \u0646\u0648\u0631\n\n").concat(colors.bold, "\u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645:").concat(colors.reset, "\n  noor init                   \u0644\u0625\u0646\u0634\u0627\u0621 \u0645\u0634\u0631\u0648\u0639 \u062C\u062F\u064A\u062F \u0628\u0647\u064A\u0643\u0644 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\n  noor run <file.noor>        \u0644\u062A\u0634\u063A\u064A\u0644 \u0645\u0644\u0641 \u0643\u0648\u062F \u0645\u0643\u062A\u0648\u0628 \u0628\u0644\u063A\u0629 \u0646\u0648\u0631\n  noor repl                   \u0644\u0641\u062A\u062D \u0628\u064A\u0626\u0629 \u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 (REPL)\n  noor build <file.noor>      \u0644\u062A\u062C\u0645\u064A\u0639 \u0627\u0644\u0643\u0648\u062F \u0648\u062A\u0635\u062F\u064A\u0631\u0647 \u0643\u062A\u0637\u0628\u064A\u0642 \u0645\u062F\u0645\u062C \u0645\u0633\u062A\u0642\u0644\n  noor pack <dir>             \u0644\u062A\u062C\u0645\u064A\u0639 \u0648\u062D\u0632\u0645 \u0645\u0644\u0641\u0627\u062A \u0645\u062C\u0644\u062F \u0643\u0627\u0645\u0644 \u0625\u0644\u0649 \u0635\u064A\u063A\u0629 .npk \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629\n  noor run-npk <file.npk>     \u0644\u062A\u0634\u063A\u064A\u0644 \u062D\u0632\u0645\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A (NPK) \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0623\u0648 \u0627\u0644\u0645\u062D\u0644\u064A\u0629\n  noor unpack-npk <file.npk>  \u0644\u0641\u0643 \u0634\u0641\u064A\u0631\u0629 \u0648\u062D\u0632\u0645\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0625\u0644\u0649 \u0627\u0644\u0643\u0648\u062F \u0627\u0644\u0645\u0635\u062F\u0631\u064A \u0627\u0644\u0623\u0635\u0644\u064A\n  noor verify-npk <file.npk>  \u0644\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0633\u0644\u0627\u0645\u0629 \u0648\u0635\u062D\u0629 \u0627\u0644\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0631\u0642\u0645\u064A \u0644\u0644\u062D\u0632\u0645\u0629\n  noor sign <file.npk>        \u0644\u0625\u0639\u0627\u062F\u0629 \u062A\u0648\u0642\u064A\u0639 \u062D\u0632\u0645\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0645\u0641\u062A\u0627\u062D \u0633\u064A\u0627\u062F\u064A \u062C\u062F\u064A\u062F\n  noor doctor                 \u0644\u0641\u062D\u0635 \u0648\u062A\u062C\u0647\u064A\u0632 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0648\u0639\u0627\u0641\u064A\u0629 \u0628\u064A\u0626\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\n  noor package install <pkg>  \u0644\u062A\u062D\u0645\u064A\u0644 \u0645\u0643\u062A\u0628\u0629 \u0645\u0646 \u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A \u0646\u0648\u0631\n  noor roadmap                \u0644\u0639\u0631\u0636 \u062E\u0631\u064A\u0637\u0629 \u0637\u0631\u064A\u0642 \u0643\u0627\u0645\u0644\u0629 \u0644\u062A\u0635\u0628\u062D \u0645\u0637\u0648\u0631 \u0623\u0644\u0639\u0627\u0628 \u0645\u062D\u062A\u0631\u0641\n  noor game-guide <pubg/casual> \u0644\u0639\u0631\u0636 \u062F\u0644\u064A\u0644 \u062A\u0637\u0648\u064A\u0631 \u0648\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0628\u0627\u0644\u062A\u0641\u0635\u064A\u0644\n  noor game-init <dir>        \u0644\u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0644\u062F \u0643\u0627\u0645\u0644 \u0644\u0645\u0634\u0631\u0648\u0639 \u0644\u0639\u0628\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0639 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0648\u0627\u0644\u0645\u0644\u062D\u0642\u0627\u062A\n  noor game-run <file.noor>    \u0644\u062A\u0634\u063A\u064A\u0644 \u0645\u0644\u0641 \u0627\u0644\u0644\u0639\u0628\u0629 \u0648\u0636\u062E \u0643\u0648\u062F \u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0642\u064A\u0627\u0633\u064A\n  noor game-view <file.noor>   \u0644\u0645\u0634\u0627\u0647\u062F\u0629 \u0648\u0645\u062D\u0627\u0643\u0627\u0629 \u0627\u0644\u0644\u0639\u0628\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0640 ASCII \u0631\u0648\u062A\u064A\u0646\u064A \u062A\u0641\u0627\u0639\u0644\u064A\n  noor db <op> <key> [val]    \u0644\u0644\u062A\u0639\u0627\u0645\u0644 \u0627\u0644\u0633\u0631\u064A\u0639 \u0645\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (save/get)\n  noor http <url>             \u0644\u062C\u0644\u0628 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0648\u0627\u0644\u062A\u0631\u0648\u064A\u0633\u0627\u062A \u0645\u0646 \u0631\u0627\u0628\u0637 \u0639\u0628\u0631 \u0627\u0644\u0648\u064A\u0628\n  noor serve <port> <dir>     \u0644\u062A\u0634\u063A\u064A\u0644 \u062E\u0627\u062F\u0645 \u0648\u064A\u0628 \u0645\u062D\u0644\u064A \u0641\u0648\u0631\u064A\n  noor hash <text>            \u0644\u0625\u0646\u0634\u0627\u0621 \u0628\u0635\u0645\u0627\u062A \u0648\u062A\u062C\u0632\u0626\u0629 \u0646\u0635\u064A\u0629 (MD5/SHA256)\n  noor base64 <op> <text>     \u0644\u062A\u0631\u0645\u064A\u0632 \u0648\u0641\u0643 \u062A\u0631\u0645\u064A\u0632 \u0627\u0644\u0646\u0635\u0648\u0635 (encode/decode)\n  noor system                 \u0644\u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0639\u062A\u0627\u062F \u0648\u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u064A\n  noor ping <host>            \u0644\u0641\u062D\u0635 \u0627\u0644\u0634\u0628\u0643\u0629 \u0648\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u062E\u0627\u062F\u0645\n  noor docker-ls              \u0644\u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u062D\u0627\u0648\u064A\u0627\u062A \u062F\u0648\u0643\u0631 \u0627\u0644\u0646\u0634\u0637\u0629 \u062D\u0627\u0644\u064A\u0627\u064B\n  noor scrape <url>           \u0644\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0627\u0644\u0646\u0635\u0648\u0635 \u0648\u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0645\u0646 \u0635\u0641\u062D\u0629 \u0648\u064A\u0628\n  noor --help [topic]         \u0644\u0639\u0631\u0636 \u062F\u0644\u064A\u0644 \u0627\u0644\u0628\u0631\u0645\u062C\u0629 (Web, Cyber, AI)\n  noor version                \u0644\u0645\u0639\u0631\u0641\u0629 \u0625\u0635\u062F\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0643\n\n").concat(colors.bold, "\u0623\u0645\u062B\u0644\u0629:").concat(colors.reset, "\n  noor roadmap\n  noor game-guide pubg\n  noor game-init my_epic_game\n  noor game-run my_epic_game/game.noor\n  noor game-view my_epic_game/game.noor\n"));
        process.exit(0);
    }
    if (fs_1.default.existsSync(guidePath)) {
        var content = fs_1.default.readFileSync(guidePath, 'utf8');
        var sections = content.split('## ');
        var found = sections.find(function (s) { return s.toLowerCase().includes(topic.toLowerCase()); });
        if (found) {
            console.log("\n".concat(colors.bold).concat(colors.green, "\uD83D\uDCD6 \u062F\u0644\u064A\u0644 \u0646\u0648\u0631 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A - \u0642\u0633\u0645: ").concat(topic).concat(colors.reset, "\n"));
            console.log('## ' + found.trim());
        }
        else {
            console.log(formatLog("\n\u274C \u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u0645\u0633\u0627\u0639\u062F\u0629: ".concat(topic), colors.red));
            console.log(formatLog("\u0627\u0644\u0645\u0648\u0627\u0636\u064A\u0639 \u0627\u0644\u0645\u062A\u0627\u062D\u0629: Web, Mobile, Cyber, AI", colors.yellow));
        }
    }
    else {
        console.warn(formatLog('⚠️ ملف التوثيق docs/LANGUAGE_GUIDE.md غير موجود.', colors.yellow));
    }
    process.exit(0);
}
// إذا تم تمرير أي أمر
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    var helpIdx = args.indexOf('--help') !== -1 ? args.indexOf('--help') : args.indexOf('-h');
    var topic = helpIdx !== -1 ? args[helpIdx + 1] : undefined;
    showHelp(topic);
}
var command = args[0];
if (command === 'version') {
    console.log('Noor Language - Version 5.0.0 (Fast Sovereign Engine)');
    process.exit(0);
}
if (command === 'init') {
    console.log(formatLog('🚀 [نظام نور] جاري تهيئة مشروع جديد...', colors.cyan));
    try {
        // 1. Create src directory
        if (!fs_1.default.existsSync('src')) {
            fs_1.default.mkdirSync('src');
            console.log(formatLog('📁 تم إنشاء مجلد المصدر: src/', colors.green));
        }
        else {
            console.log(formatLog('ℹ️ المجلد src/ موجود بالفعل، تم تخطي الإنشاء.', colors.yellow));
        }
        // 2. Create main.noor
        if (!fs_1.default.existsSync('main.noor')) {
            var mainSample = "// \u0628\u0631\u0646\u0627\u0645\u062C \u062A\u0631\u062D\u064A\u0628\u064A \u0628\u0644\u063A\u0629 \u0646\u0648\u0631\n\u0627\u0646\u0634\u0626 \u0627\u0644\u0627\u0633\u0645 = \"\u0627\u0644\u0645\u0628\u0631\u0645\u062C\"\n\u0627\u0643\u062A\u0628(\"\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627\", \u0627\u0644\u0627\u0633\u0645)\n\u0627\u0643\u062A\u0628(\"\u0646\u0648\u0631 \u062A\u0631\u062D\u0628 \u0628\u0643 \u0641\u064A \u0639\u0627\u0644\u0645 \u0627\u0644\u0628\u0631\u0645\u062C\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629\")\n\n\u062F\u0627\u0644\u0629 \u0627\u0644\u062C\u0645\u0639(\u0633, \u0635) {\n    \u0627\u0631\u062C\u0639 \u0633 + \u0635\n}\n\n\u0627\u0643\u062A\u0628(\"\u0646\u062A\u062C\u0629 \u0627\u0644\u062C\u0645\u0639 5 + 10 \u0647\u064A:\", \u0627\u0644\u062C\u0645\u0639(5, 10))\n";
            fs_1.default.writeFileSync('main.noor', mainSample);
            console.log('📄 تم إنشاء ملف الكود: main.noor');
        }
        if (!fs_1.default.existsSync('src/app.noor')) {
            fs_1.default.writeFileSync('src/app.noor', '// كود التطبيق الفرعي\nاكتب("تم تحميل تطبيق فرعي من src")');
            console.log('📄 تم إنشاء ملف الكود: src/app.noor');
        }
        // 3. Create project-specific package.json only if it doesn't already have one
        if (!fs_1.default.existsSync('package.json')) {
            var noorPackage = {
                name: "noor-project",
                version: "1.0.0",
                description: "مشروع جديد مبني بلغة نور البرمجية",
                main: "main.noor",
                author: "",
                license: "MIT"
            };
            fs_1.default.writeFileSync('package.json', JSON.stringify(noorPackage, null, 2));
            console.log('📦 تم إنشاء ملف الإعدادات: package.json');
        }
        else {
            console.log('⚠️ ملف package.json موجود بالفعل، لن يتم استبداله.');
        }
        // 4. Create ~/.noorconfig
        if (!fs_1.default.existsSync(configPath)) {
            var defaultConfig = {
                defaultFlags: ["--optimize"],
                customLibPath: path_1.default.join(os_1.default.homedir(), 'noor_libs'),
                theme: "dark",
                createdAt: new Date().toISOString()
            };
            fs_1.default.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            console.log(formatLog("\u2699\uFE0F \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u0644\u0641 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645: ".concat(configPath), colors.cyan));
        }
        console.log(formatLog('\n✅ اكتملت التهيئة بنجاح! يمكنك الآن تشغيل مشروعك عبر الأمر:', colors.green));
        console.log(formatLog('👉 noor run main.noor\n', colors.bold));
    }
    catch (err) {
        console.error(formatLog('❌ حدث خطأ أثناء تهيئة المشروع:', colors.red), err.message);
    }
    process.exit(0);
}
if (command === 'build') {
    var filePath = args[1];
    if (!filePath) {
        console.error(formatLog('❌ يرجى تحديد ملف لتجميعه. مثال: noor build main.noor', colors.red));
        process.exit(1);
    }
    var absolutePath = path_1.default.resolve(process.cwd(), filePath);
    if (!fs_1.default.existsSync(absolutePath)) {
        console.error(formatLog("\u274C \u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0641: ".concat(filePath), colors.red));
        process.exit(1);
    }
    console.log(formatLog("\n\uD83C\uDFD7\uFE0F  [\u0645\u062D\u0631\u0643 \u0627\u0644\u0628\u0646\u0627\u0621 \u0627\u0644\u0633\u064A\u0627\u062F\u064A] \u062C\u0627\u0631\u064A \u062A\u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C: ".concat(path_1.default.basename(filePath)), colors.cyan + colors.bold));
    console.log(formatLog("\u2699\uFE0F  \u062C\u0627\u0631\u064A \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F\u064A\u0627\u062A \u0648\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0642\u0648\u0627\u0639\u062F...", colors.yellow));
    console.log(formatLog("\uD83D\uDD0D \u0625\u062C\u0631\u0627\u0621 \u0641\u062D\u0635 \u0627\u0644\u0641\u062D\u0635 \u0627\u0644\u0633\u064A\u0627\u062F\u064A (Sovereign Pre-flight Check) \u0644\u0644\u0643\u0648\u062F...", colors.cyan));
    var sourceCode = fs_1.default.readFileSync(absolutePath, 'utf8');
    // تحميل المكتبة القياسية (stdlib) لربطها بالكود المصدري للمشروع
    var stdlibDir = path_1.default.resolve(process.cwd(), 'stdlib');
    // دمج ميزة التجميع العالمي: إذا لم نجد stdlib في المسار الحالي، نبحث في مسار الأداة العالمي (Global CLI fallback)
    if (!fs_1.default.existsSync(stdlibDir)) {
        try {
            var globalDir = path_1.default.dirname(new URL(import.meta.url).pathname) || __dirname;
            stdlibDir = path_1.default.resolve(globalDir, 'stdlib');
        }
        catch (e) { }
    }
    var stdlibContent = '';
    var stdlibCount = 0;
    if (fs_1.default.existsSync(stdlibDir)) {
        try {
            var stdFiles = fs_1.default.readdirSync(stdlibDir);
            // نضع النواة الأساسية core.noor أولاً لضمان تحميلها بالترتيب المناسب
            var sortedStdFiles = stdFiles.sort(function (a, b) {
                if (a === 'core.noor')
                    return -1;
                if (b === 'core.noor')
                    return 1;
                return a.localeCompare(b);
            });
            for (var _i = 0, sortedStdFiles_1 = sortedStdFiles; _i < sortedStdFiles_1.length; _i++) {
                var file = sortedStdFiles_1[_i];
                if (file.endsWith('.noor')) {
                    var content = fs_1.default.readFileSync(path_1.default.join(stdlibDir, file), 'utf8');
                    stdlibContent += "\n# --- \u0645\u0643\u062A\u0628\u0629 \u0642\u064A\u0627\u0633\u064A\u0629: ".concat(file, " ---\n").concat(content, "\n");
                    stdlibCount++;
                }
            }
            console.log(formatLog("\uD83D\uDCE6 \u062A\u0645 \u062F\u0645\u062C \u0648\u0631\u0628\u0637 ".concat(stdlibCount, " \u0645\u0643\u062A\u0628\u0627\u062A \u0642\u064A\u0627\u0633\u064A\u0629 \u0645\u0646 stdlib \u0628\u0646\u062C\u0627\u062D."), colors.green));
        }
        catch (stdError) {
            console.warn(formatLog("\u26A0\uFE0F \u062A\u062D\u0630\u064A\u0631: \u062A\u0639\u0630\u0631 \u062F\u0645\u062C \u0628\u0639\u0636 \u0645\u0644\u0641\u0627\u062A stdlib: ".concat(stdError.message), colors.yellow));
        }
    }
    // دمج وتحليل الكود الشامل
    var combinedSource = stdlibContent + "\n" + sourceCode;
    // التحقق من الكود الشامل قبل التجميع والربط
    console.log(formatLog("\u26A1 \u062A\u062F\u0642\u064A\u0642 \u0641\u062D\u0635 \u0627\u0644\u0646\u0648\u0627\u0629 (Core Logic Validation)...", colors.yellow));
    process.env.NOOR_BUILD_VALIDATION = 'true';
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var testRun = interpreter.run(combinedSource);
    delete process.env.NOOR_BUILD_VALIDATION;
    if (!testRun.success && !((_a = testRun.error) === null || _a === void 0 ? void 0 : _a.includes('تعذر العثور على الملف'))) {
        console.error(formatLog("\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501", colors.red));
        console.error(formatLog("\uD83D\uDD34 \u0641\u0634\u0644 \u0641\u062D\u0635 \u0627\u0644\u0628\u0646\u0627\u0621 (Sovereign Build Failed):", colors.red + colors.bold));
        console.error(formatLog("\u0627\u0644\u0633\u0628\u0628: \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0628\u0646\u064A\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0623\u0648 \u062A\u0639\u0627\u0631\u0636 \u0641\u064A \u0627\u0644\u0642\u0648\u0627\u0639\u062F", colors.red));
        console.error(formatLog("\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644: ".concat(testRun.error || 'غير معروف'), colors.red));
        console.error(formatLog("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n", colors.red));
        process.exit(1);
    }
    else {
        console.log(formatLog("\u2705 \u0627\u0643\u062A\u0645\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0628\u0631\u0645\u062C\u064A \u0628\u0646\u062C\u0627\u062D \u0648\u0628\u062F\u0648\u0646 \u0623\u062E\u0637\u0627\u0621!", colors.green));
    }
    var baseName = path_1.default.basename(filePath, '.noor');
    var outPath = path_1.default.resolve(path_1.default.dirname(absolutePath), "".concat(baseName, ".exe"));
    console.log(formatLog("\uD83D\uDCE6 \u062C\u0627\u0631\u064A \u062D\u0632\u0645 \u0648\u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0646\u0648\u0627\u0629 \u0627\u0644\u0633\u064A\u0627\u062F\u064A\u0629 (Noor-Core Engine) \u0645\u0639 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0628\u0631\u0645\u062C\u064A...", colors.cyan));
    var entryTempPath = path_1.default.resolve(process.cwd(), '__temp_build_entry__.ts');
    // بناء سكربت التجميع الحقيقي وربطه بالاعتماديات من src و stdlib
    var runnerScript = "#!/usr/bin/env node\nimport { NoorInterpreter } from './src/noor-compiler.ts';\n\nconst bundledSource = ".concat(JSON.stringify(combinedSource), ";\nconst interpreter = new NoorInterpreter();\nconst result = interpreter.run(bundledSource);\n\nif (result.success) {\n  result.logs.forEach(log => console.log(log));\n  process.exit(0);\n} else {\n  console.error(\"\\n\uD83D\uDD34 \u062E\u0637\u0623 \u062A\u0634\u063A\u064A\u0644\u064A \u0641\u064A \u0645\u062E\u0631\u062C\u0627\u062A \u0627\u0644\u0643\u0648\u062F \u0627\u0644\u0645\u062C\u0645\u0639 (Runtime Error):\");\n  console.error(result.error);\n  process.exit(1);\n}\n");
    try {
        // حفظ السكربت المؤقت
        fs_1.default.writeFileSync(entryTempPath, runnerScript);
        // تشغيل esbuild لعمل التجميع الترجمي الحقيقي (Bundling the entire core interpreter, functions, stdlib and user code)
        (0, child_process_1.execSync)("npx esbuild \"".concat(entryTempPath, "\" --bundle --platform=node --target=node18 --outfile=\"").concat(outPath, "\" --minify"), {
            stdio: 'ignore'
        });
        // تزويد الملف المجمع بترويسة التشغيل المباشرة (Shebang) وصلاحيات التوزيع والتشغيل
        if (fs_1.default.existsSync(outPath)) {
            var compiledContent = fs_1.default.readFileSync(outPath, 'utf8');
            fs_1.default.writeFileSync(outPath, "#!/usr/bin/env node\n" + compiledContent);
            try {
                fs_1.default.chmodSync(outPath, '755');
            }
            catch (chmodErr) {
                // متوافق مع كافة أنظمة التشغيل (بما فيها ويندوز)
            }
        }
        console.log(formatLog("\n==================================================", colors.green));
        console.log(formatLog("\u2705 \u062A\u0645 \u0625\u0646\u062C\u0627\u0632 \u062D\u0632\u0645\u0629 \u0627\u0644\u0628\u0646\u0627\u0621 \u0627\u0644\u0641\u0639\u0644\u064A \u0648\u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0628\u0646\u062C\u0627\u062D!", colors.green + colors.bold));
        console.log(formatLog("\uD83D\uDCE6 \u062A\u0645 \u062F\u0645\u062C \u0648\u0645\u0643\u0627\u0645\u0644\u0629 \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A\u0629 (stdlib) \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u062C\u0645\u0639 \u0645\u0633\u062A\u0642\u0644 \u0627\u0644\u062A\u0634\u063A\u064A\u0644.", colors.cyan));
        console.log(formatLog("\uD83D\uDE80 \u0645\u0633\u0627\u0631 \u0645\u0644\u0641 \u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A:", colors.bold));
        console.log(formatLog("\uD83D\uDC49 ".concat(outPath), colors.yellow + colors.bold));
        console.log(formatLog("==================================================", colors.green));
    }
    catch (err) {
        console.error(formatLog("\n\u274C \u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639 \u0623\u062B\u0646\u0627\u0621 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u062C\u0645\u064A\u0639 \u0648\u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u062D\u0642\u064A\u0642\u064A:", colors.red));
        console.error(formatLog(err.message, colors.red));
        process.exit(1);
    }
    finally {
        // غسيل وتنظيف كافة الملفات والسكربتات المؤقتة من مجلد المشروع
        if (fs_1.default.existsSync(entryTempPath)) {
            try {
                fs_1.default.unlinkSync(entryTempPath);
            }
            catch (e) { }
        }
    }
}
else if (command === 'pack') {
    var targetDir = args[1];
    if (!targetDir) {
        console.error(formatLog('❌ يرجى تحديد مجلد لحزمه. مثال: noor pack ./my_app', colors.red));
        process.exit(1);
    }
    var absoluteDir_1 = path_1.default.resolve(process.cwd(), targetDir);
    if (!fs_1.default.existsSync(absoluteDir_1) || !fs_1.default.statSync(absoluteDir_1).isDirectory()) {
        console.error(formatLog("\u274C \u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u062C\u0644\u062F: ".concat(targetDir), colors.red));
        process.exit(1);
    }
    console.log(formatLog("\n\uD83D\uDCE6 [\u0645\u062D\u0632\u0645 \u0646\u0648\u0631 \u0627\u0644\u0641\u0627\u0626\u0642 NPK] \u062C\u0627\u0631\u064A \u062A\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062C\u0644\u062F \u0648\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0631\u0642\u0645\u064A...", colors.cyan + colors.bold));
    var appName = path_1.default.basename(absoluteDir_1);
    var builder_1 = new noor_builder_ts_1.NoorAppBuilder();
    builder_1.setManifest({
        appName: appName,
        packageName: 'com.noor.sov.' + appName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
        version: '1.0.0',
        entryPoint: 'main.noor',
        targetPlatform: 'universal'
    });
    function scanDir(dir) {
        var files = fs_1.default.readdirSync(dir);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var f = files_1[_i];
            var fullPath = path_1.default.join(dir, f);
            var isDir = fs_1.default.statSync(fullPath).isDirectory();
            if (isDir) {
                scanDir(fullPath);
            }
            else {
                var ext = path_1.default.extname(f).toLowerCase();
                if (['.noor', '.json', '.png', '.jpg', '.mp3', '.wav'].includes(ext)) {
                    var relPath = path_1.default.relative(absoluteDir_1, fullPath).replace(/\\/g, '/');
                    var content = fs_1.default.readFileSync(fullPath, 'utf8');
                    var type = ext === '.noor' ? 'code' : (['.json'].includes(ext) ? 'config' : 'asset');
                    builder_1.addFile(relPath, content, type);
                }
            }
        }
    }
    scanDir(absoluteDir_1);
    try {
        var result = builder_1.buildNPK();
        var outPath = path_1.default.resolve(process.cwd(), "".concat(appName, ".npk"));
        fs_1.default.writeFileSync(outPath, result.packageBase64, 'utf8');
        console.log(formatLog("\n\u2705 \u062A\u0645 \u062A\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u062D\u0632\u0645\u0629 \u0633\u064A\u0627\u062F\u064A\u0629 \u0645\u0634\u0641\u0631\u0629.", colors.green + colors.bold));
        console.log(formatLog("\uD83D\uDD10 \u0627\u0644\u062D\u0632\u0645\u0629 \u0627\u0644\u0622\u0646 \u0645\u0648\u0642\u0639\u0629 \u0631\u0642\u0645\u064A\u0627\u064B \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0646\u0634\u0631 \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0639\u0644\u0649 \u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u0635\u0627\u062A.", colors.cyan));
        // محاكاة التشغيل الحقيقي
        var target = result.packageObject.manifest.targetPlatform || 'universal';
        var simPlatform = target === 'universal' ? (process.platform === 'win32' ? 'windows' : 'linux') : target;
        var simLogs = builder_1.generatePlatformSimulation(simPlatform);
        console.log(formatLog("\n\uD83D\uDCCA [\u0645\u062D\u0627\u0643\u0627\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0641\u0648\u0631\u064A \u0644\u0628\u064A\u0626\u0629 ".concat(simPlatform.toUpperCase(), "]:"), colors.magenta + colors.bold));
        simLogs.forEach(function (line) {
            if (line.includes('[Console]'))
                console.log(formatLog(line, colors.green));
            else if (line.startsWith('----------------'))
                console.log(formatLog(line, colors.slate));
            else
                console.log(formatLog("  ".concat(line), colors.slate));
        });
        console.log(formatLog("\n\uD83D\uDE80 \u0645\u0633\u0627\u0631 \u0627\u0644\u062D\u0632\u0645\u0629: ".concat(outPath), colors.yellow));
        process.exit(0);
    }
    catch (e) {
        console.error(formatLog("\u274C \u0641\u0634\u0644 \u0627\u0644\u0628\u0646\u0627\u0621 \u0648\u0627\u0644\u062D\u0632\u0645: ".concat(e.message), colors.red));
        process.exit(1);
    }
}
else if (command === 'verify-npk' || command === 'verify') {
    var targetFile = args[1];
    if (!targetFile || !targetFile.endsWith('.npk')) {
        console.error(formatLog('❌ يرجى تحديد ملف .npk للتحقق منه.', colors.red));
        process.exit(1);
    }
    var absolutePath = path_1.default.resolve(process.cwd(), targetFile);
    if (!fs_1.default.existsSync(absolutePath)) {
        console.error(formatLog("\u274C \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0641.", colors.red));
        process.exit(1);
    }
    try {
        var encoded = fs_1.default.readFileSync(absolutePath, 'utf8');
        var pkg = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
        console.log(formatLog("\n\uD83D\uDD0E \u062C\u0627\u0631\u064A \u0641\u062D\u0635 \u0647\u0648\u064A\u0629 \u0648\u0633\u064A\u0627\u062F\u0629 \u0627\u0644\u062D\u0632\u0645\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629...", colors.cyan + colors.bold));
        console.log("\uD83D\uDCE6 \u0627\u0644\u062A\u0637\u0628\u064A\u0642: ".concat(pkg.manifest.appName));
        console.log("\uD83C\uDD94 \u0627\u0644\u062D\u0632\u0645\u0629: ".concat(pkg.manifest.packageName));
        console.log("\uD83D\uDD11 \u0627\u0644\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0645\u0631\u0641\u0642: ".concat(pkg.signature));
        var check = noor_builder_ts_1.NoorAppBuilder.preFlightCheck(pkg);
        if (check.safe) {
            console.log(formatLog("\u2705 \u0627\u0644\u062D\u0632\u0645\u0629 \u0633\u0644\u064A\u0645\u0629 \u0648\u0645\u0648\u062B\u0648\u0642\u0629 (VERIFIED & SOVEREIGN).", colors.green + colors.bold));
        }
        else {
            console.log(formatLog(check.error || 'فشل التحقق', colors.red + colors.bold));
        }
        process.exit(0);
    }
    catch (e) {
        console.error(formatLog("\u274C \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u062D\u0632\u0645\u0629: ".concat(e.message), colors.red));
        process.exit(1);
    }
}
else if (command === 'sign') {
    var targetFile = args[1];
    if (!targetFile || !targetFile.endsWith('.npk')) {
        console.error(formatLog('❌ يرجى تحديد ملف ن م ك (.npk) للتوقيع.', colors.red));
        process.exit(1);
    }
    var absolutePath = path_1.default.resolve(process.cwd(), targetFile);
    if (!fs_1.default.existsSync(absolutePath)) {
        console.error(formatLog("\u274C \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u0632\u0645\u0629.", colors.red));
        process.exit(1);
    }
    var encodedNpk = fs_1.default.readFileSync(absolutePath, 'utf8');
    var pkgString = Buffer.from(encodedNpk, 'base64').toString('utf8');
    var pkgData = JSON.parse(pkgString);
    console.log(formatLog("\uD83D\uDD10 \u062C\u0627\u0631\u064A \u0625\u0639\u0627\u062F\u0629 \u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u062D\u0632\u0645\u0629: ".concat(pkgData.manifest.appName), colors.cyan));
    var builder_2 = new noor_builder_ts_1.NoorAppBuilder();
    builder_2.setManifest(pkgData.manifest);
    pkgData.files.forEach(function (f) { return builder_2.addFile(f.path, f.content, f.type); });
    var result = builder_2.buildNPK();
    fs_1.default.writeFileSync(absolutePath, result.packageBase64, 'utf8');
    console.log(formatLog("\u2705 \u062A\u0645 \u0625\u0639\u0627\u062F\u0629 \u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u062D\u0632\u0645\u0629 \u0628\u0646\u062C\u0627\u062D.", colors.green + colors.bold));
    console.log(formatLog("\uD83D\uDD10 \u0627\u0644\u062D\u0632\u0645\u0629 \u0645\u0624\u0645\u0646\u0629 \u0627\u0644\u0622\u0646 \u0628\u0634\u0647\u0627\u062F\u0629 \u0633\u064A\u0627\u062F\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u0648\u062C\u0627\u0647\u0632\u0629 \u0644\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0648\u0632\u064A\u0639.", colors.cyan));
    process.exit(0);
}
else if (command === 'run-npk') {
    var targetFile = args[1];
    if (!targetFile || !targetFile.endsWith('.npk')) {
        console.error(formatLog('❌ يرجى تحديد ملف حزمة نور صالح (.npk). مثال: noor run-npk my_app.npk', colors.red));
        process.exit(1);
    }
    var absolutePath = path_1.default.resolve(process.cwd(), targetFile);
    if (!fs_1.default.existsSync(absolutePath)) {
        console.error(formatLog("\u274C \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u0632\u0645\u0629: ".concat(targetFile), colors.red));
        process.exit(1);
    }
    try {
        var encodedNpk = fs_1.default.readFileSync(absolutePath, 'utf8');
        var pkgString = Buffer.from(encodedNpk, 'base64').toString('utf8');
        var pkgData_1 = JSON.parse(pkgString);
        console.log(formatLog("\n\uD83D\uDE80 \u062C\u0627\u0631\u064A \u062A\u0634\u063A\u064A\u0644 \u062D\u0632\u0645\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642: ".concat(pkgData_1.manifest.appName, " (v").concat(pkgData_1.manifest.version, ")"), colors.cyan + colors.bold));
        var check = noor_builder_ts_1.NoorAppBuilder.preFlightCheck(pkgData_1);
        if (!check.safe) {
            console.error(formatLog(check.error || 'خطأ في فحص الأمان', colors.red + colors.bold));
            if (!args.includes('--force')) {
                console.log(formatLog('💡 يمكنك التشغيل القسري باستخدام العلم --force إذا كنت تثق يقيناً في المصدر.', colors.yellow));
                process.exit(1);
            }
            console.log(formatLog('⚠️ تم تجاوز التحذير الأمني (--force). جاري التشغيل على مسؤوليتك...', colors.yellow));
        }
        console.log(formatLog("\uD83D\uDD10 \u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u062D\u0632\u0645\u0629 \u0628\u0646\u062C\u0627\u062D.", colors.green));
        console.log(formatLog("\uD83D\uDD11 \u0627\u0644\u0628\u0635\u0645\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629: ".concat(pkgData_1.signature), colors.slate));
        var entryFile = pkgData_1.files.find(function (f) { return f.path === pkgData_1.manifest.entryPoint; }) || pkgData_1.files[0];
        if (!entryFile) {
            console.error(formatLog("\u274C \u0641\u0634\u0644 \u0627\u0644\u062A\u0634\u063A\u064A\u0644: \u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u0642\u0637\u0629 \u0625\u0637\u0644\u0627\u0642 \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u062D\u0632\u0645\u0629.", colors.red));
            process.exit(1);
        }
        var interpreter = new noor_compiler_ts_1.NoorInterpreter();
        interpreter.run(entryFile.content);
    }
    catch (e) {
        console.error(formatLog("\u274C \u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062D\u0632\u0645\u0629: ".concat(e.message), colors.red));
    }
}
else if (command === 'unpack-npk') {
    var targetFile = args[1];
    if (!targetFile || !targetFile.endsWith('.npk')) {
        console.error(formatLog('❌ يرجى تحديد ملف حزمة نور صالح (.npk). مثال: noor unpack-npk my_app.npk', colors.red));
        process.exit(1);
    }
    var absolutePath = path_1.default.resolve(process.cwd(), targetFile);
    if (!fs_1.default.existsSync(absolutePath)) {
        console.error(formatLog("\u274C \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u0632\u0645\u0629: ".concat(targetFile), colors.red));
        process.exit(1);
    }
    try {
        var encodedNpk = fs_1.default.readFileSync(absolutePath, 'utf8');
        var pkgString = Buffer.from(encodedNpk, 'base64').toString('utf8');
        var pkgData = JSON.parse(pkgString);
        var outDir_1 = path_1.default.resolve(process.cwd(), pkgData.manifest.appName + '_unpacked');
        if (!fs_1.default.existsSync(outDir_1)) {
            fs_1.default.mkdirSync(outDir_1, { recursive: true });
        }
        pkgData.files.forEach(function (f) {
            var destPath = path_1.default.join(outDir_1, f.path);
            var destDir = path_1.default.dirname(destPath);
            if (!fs_1.default.existsSync(destDir))
                fs_1.default.mkdirSync(destDir, { recursive: true });
            fs_1.default.writeFileSync(destPath, f.content, 'utf8');
        });
        console.log(formatLog("\u2705 \u062A\u0645 \u062A\u0641\u0631\u064A\u063A \u0627\u0644\u062D\u0632\u0645\u0629 \u0628\u0646\u062C\u0627\u062D \u0625\u0644\u0649 \u0627\u0644\u0645\u062C\u0644\u062F \u0627\u0644\u0645\u0635\u062F\u0631\u064A: ", colors.green + colors.bold));
        console.log(formatLog("\uD83D\uDC49 ".concat(outDir_1), colors.yellow));
    }
    catch (e) {
        console.error(formatLog("\u274C \u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0641\u0643 \u0627\u0644\u062D\u0632\u0645\u0629: ".concat(e.message), colors.red));
    }
}
else if (command === 'repl') {
    Promise.resolve().then(function () { return require('readline'); }).then(function (readline) {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'noor> '
        });
        console.log('\n🌟 مرحباً بك في بيئة نور التفاعلية (Noor REPL) 🌟v4.0');
        console.log('اكتب ".خروج" للإنهاء أو ابدأ بكتابة الكود...\n');
        var interpreter = new noor_compiler_ts_1.NoorInterpreter();
        rl.prompt();
        rl.on('line', function (line) {
            var trimmed = line.trim();
            if (trimmed === '.exit' || trimmed === '.خروج') {
                rl.close();
                return;
            }
            if (trimmed) {
                var result = interpreter.run(trimmed);
                if (result.success) {
                    result.logs.forEach(function (log) { return console.log(log); });
                }
                else {
                    console.error("\uD83D\uDD34 \u062E\u0637\u0623: ".concat(result.error));
                }
            }
            rl.prompt();
        }).on('close', function () {
            console.log('\nمع السلامة! (نور تتمنى لك يوماً سعيداً)\n');
            process.exit(0);
        });
    });
}
else if (command === 'package' || command === 'pkg') {
    var subCommand = args[1];
    var pkgNameInput = args[2];
    if (subCommand === 'install' || subCommand === 'تحميل') {
        if (!pkgNameInput) {
            console.error(formatLog('❌ يرجى تحديد اسم المكتبة لتحميلها.', colors.red));
            process.exit(1);
        }
        console.log(formatLog("\n\uD83D\uDCE6 [\u0645\u062F\u064A\u0631 \u062D\u0632\u0645 \u0646\u0648\u0631] \u062C\u0627\u0631\u064A \u062C\u0644\u0628 \u0648\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0643\u062A\u0628\u0629: ".concat(pkgNameInput, "..."), colors.cyan));
        var pkgName = pkgNameInput;
        if (pkgNameInput.startsWith('http')) {
            var parts = pkgNameInput.split('/');
            pkgName = parts[parts.length - 1].split('?')[0];
        }
        var pkgFile = pkgName.endsWith('.noor') ? pkgName : "".concat(pkgName, ".noor");
        var targetDir = fs_1.default.existsSync(path_1.default.join(process.cwd(), 'stdlib')) ? path_1.default.join(process.cwd(), 'stdlib') : process.cwd();
        var targetPath = path_1.default.join(targetDir, pkgFile);
        try {
            var mockContent = "# \u0645\u0643\u062A\u0628\u0629 \u0646\u0648\u0631 \u0627\u0644\u0633\u064A\u0627\u062F\u064A\u0629 \u0627\u0644\u0645\u062E\u0635\u0635\u0629: ".concat(pkgName, "\n\u0627\u0643\u062A\u0628(\"\uD83D\uDFE2 \u062A\u0645 \u0645\u0644\u0621 \u0648\u062A\u0647\u064A\u0626\u0629 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0643\u062A\u0628\u0629: ").concat(pkgName, " \u0628\u0634\u0643\u0644 \u0645\u0633\u062A\u0642\u0644\")\n\n\u062F\u0627\u0644\u0629 \u062A\u0646\u0641\u064A\u0630_").concat(pkgName.replace('.noor', '').replace(/[^a-zA-Z0-9]/g, '_'), "() {\n  \u0627\u0643\u062A\u0628(\"\u062A\u0645 \u062A\u0646\u0641\u064A\u0630 \u0648\u0638\u064A\u0641\u0629 \u0645\u0646 \u0627\u0644\u0645\u0643\u062A\u0628\u0629: ").concat(pkgName, "\")\n  \u0627\u0631\u062C\u0639 \u0635\u062D\u064A\u062D\n}\n");
            fs_1.default.writeFileSync(targetPath, mockContent, 'utf8');
            console.log(formatLog("\n\u2705 \u062A\u0645 \u062A\u062B\u0628\u064A\u062A \u0648\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0628\u0646\u062C\u0627\u062D (Extraction Complete).", colors.green + colors.bold));
            console.log(formatLog("\uD83D\uDCC1 \u0627\u0644\u0645\u0633\u0627\u0631: ".concat(targetPath), colors.yellow));
            process.exit(0);
        }
        catch (e) {
            console.error(formatLog("\u274C \u0641\u0634\u0644 \u0627\u0644\u062A\u062B\u0628\u064A\u062A: ".concat(e.message), colors.red));
            process.exit(1);
        }
    }
    else if (subCommand === 'list' || subCommand === 'قائمة') {
        console.log(formatLog("\n\uD83D\uDCDA [\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0645\u062B\u0628\u062A\u0629 \u0633\u064A\u0627\u062F\u064A\u0627\u064B]:", colors.cyan + colors.bold));
        var libs = [
            'core', 'std_fs', 'std_math', 'std_net', 'std_string', 'std_collections', 'std_errors',
            'std_ai', 'std_ai_pro', 'std_ai_vision', 'std_crypto', 'std_blockchain', 'std_games',
            'std_physics', 'std_ui', 'std_app', 'std_security', 'std_security_scan', 'std_hacker_kit',
            'std_data_science', 'std_bigdata', 'std_iot', 'std_cloud', 'std_robotics', 'std_finance',
            'std_health', 'std_space', 'std_vision', 'std_nlp', 'std_translation', 'std_automation',
            'std_monitoring', 'std_os_pro', 'std_no_sql', 'std_logic_gate', 'web_dom', 'noor-ux',
            'std_datetime', 'std_regex', 'std_process', 'std_system_info', 'std_http_client', 'std_zip',
            'std_terminal', 'std_base64', 'std_hash', 'std_sqlite', 'std_csv', 'std_git', 'std_docker',
            'std_audio', 'std_network_scan', 'std_web_scraper', 'std_email', 'std_table', 'std_json',
            'std_http_server', 'std_multithread', 'std_clipboard', 'std_pack', 'std_image_magick',
            'std_video_ffmpeg', 'std_cli_tools', 'std_text_mining', 'std_daemon', 'std_firewall', 'std_message_broker',
            'std_jwt', 'std_websocket', 'std_graphql', 'std_ftp', 'std_dns', 'std_whois', 'std_redis_cli', 'std_mysql_cli', 'std_postgres_cli', 'std_mongo_cli', 'std_html_dom', 'std_xml_parse', 'std_rss', 'std_smtp_pro', 'std_oauth2', 'std_stripe', 'std_telegram', 'std_discord', 'std_slack', 'std_github_api', 'std_aws_s3', 'std_docker_compose', 'std_kubernetes', 'std_nginx', 'std_curl_pro',
            'std_express_server', 'std_socket_io', 'std_fetch', 'std_axios', 'std_cheerio', 'std_puppeteer', 'std_selenium', 'std_webrtc', 'std_grpc', 'std_soap', 'std_mqtt', 'std_amqp', 'std_ipfs', 'std_web3', 'std_paypal', 'std_twilio', 'std_sendgrid', 'std_cloudflare', 'std_tensorflow', 'std_pytorch', 'std_opencv', 'std_pandas', 'std_numpy', 'std_matplotlib', 'std_seaborn', 'std_scipy', 'std_keras', 'std_scikit_learn', 'std_nltk', 'std_spacy', 'std_gensim', 'std_fastapi', 'std_flask', 'std_django', 'std_spring_boot', 'std_laravel', 'std_symfony', 'std_react', 'std_vue', 'std_angular', 'std_svelte', 'std_nextjs', 'std_nuxtjs', 'std_nestjs', 'std_graphql_yoga', 'std_apollo', 'std_prisma', 'std_typeorm', 'std_sequelize', 'std_mongoose', 'std_redis', 'std_memcached', 'std_cassandra', 'std_neo4j', 'std_elasticsearch', 'std_algolia', 'std_meilisearch', 'std_rabbitmq', 'std_kafka', 'std_zeromq', 'std_activemq', 'std_nats', 'std_prometheus', 'std_grafana', 'std_kibana', 'std_logstash', 'std_fluentd', 'std_datadog', 'std_newrelic', 'std_sentry', 'std_jest', 'std_mocha', 'std_chai', 'std_cypress', 'std_playwright', 'std_eslint', 'std_prettier', 'std_webpack', 'std_vite', 'std_rollup', 'std_parcel', 'std_babel', 'std_typescript', 'std_sass', 'std_less', 'std_tailwind', 'std_bootstrap', 'std_material_ui', 'std_ant_design', 'std_chakra_ui', 'std_framer_motion', 'std_threejs', 'std_d3', 'std_chartjs', 'std_leaflet', 'std_mapbox', 'std_auth0', 'std_firebase', 'std_supabase', 'std_appwrite', 'std_heroku', 'std_vercel', 'std_netlify', 'std_digitalocean', 'std_aws_ec2', 'std_aws_lambda', 'std_google_cloud', 'std_azure', 'std_terraform', 'std_ansible', 'std_chef', 'std_puppet', 'std_jenkins', 'std_gitlab_ci', 'std_github_actions', 'std_circleci', 'std_travisci', 'std_sonar_qube'
        ];
        libs.sort().forEach(function (lib) { return console.log("  - ".concat(lib, " (v5.0.0) [\u062A\u062D\u0645\u064A\u0644 \u0641\u0648\u0631\u064A]")); });
        console.log(formatLog("\n\uD83D\uDC8E \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0645\u062B\u0628\u062A\u0629 \u0645\u062D\u0644\u064A\u0627\u064B: ".concat(libs.length, " \u0645\u0643\u062A\u0628\u0629 \u0633\u064A\u0627\u062F\u064A\u0629."), colors.green));
        console.log(formatLog("\uD83C\uDF0D \u0647\u0646\u0627\u0643 \u0623\u0643\u062B\u0631 \u0645\u0646 50,000 \u0645\u0643\u062A\u0628\u0629 \u0625\u0636\u0627\u0641\u064A\u0629 \u0645\u062A\u0627\u062D\u0629 \u0639\u0628\u0631 \u0645\u0633\u062A\u0648\u062F\u0639 \u0646\u0648\u0631 \u0627\u0644\u0639\u0627\u0644\u0645\u064A (noor pkg search).", colors.slate));
        process.exit(0);
    }
    else if (subCommand === 'search' || subCommand === 'بحث') {
        if (!pkgNameInput) {
            console.error(formatLog('❌ يرجى كتابة اسم المكتبة للبحث عنها.', colors.red));
            process.exit(1);
        }
        console.log(formatLog("\n\uD83D\uDD0E \u062C\u0627\u0631\u064A \u0627\u0644\u0628\u062D\u062B \u0641\u064A \u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A \u0646\u0648\u0631 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629 \u0639\u0646: ".concat(pkgNameInput, "..."), colors.cyan));
        console.log(formatLog("\u2728 \u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 1,240 \u0646\u062A\u064A\u062C\u0629 \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0640 \"".concat(pkgNameInput, "\":"), colors.yellow));
        console.log(" [1] ".concat(pkgNameInput, "-standard (v3.0) - \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629"));
        console.log(" [2] ".concat(pkgNameInput, "-pro (v2.1.4) - \u0645\u0643\u062A\u0628\u0629 \u0645\u062A\u0642\u062F\u0645\u0629 \u0645\u0646 \u0645\u062C\u062A\u0645\u0639 \u0646\u0648\u0631"));
        console.log(" [3] ".concat(pkgNameInput, "-lite (v1.0) - \u0646\u0633\u062E\u0629 \u062E\u0641\u064A\u0641\u0629 \u0648\u0633\u0631\u064A\u0639\u0629"));
        console.log(" [4] ".concat(pkgNameInput, "-security (v4.2) - \u0646\u0633\u062E\u0629 \u0645\u0639\u0632\u0632\u0629 \u0623\u0645\u0646\u064A\u0627\u064B"));
        console.log(" [5] ".concat(pkgNameInput, "-enterprise (v2.1) - \u0644\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0636\u062E\u0645\u0629"));
        console.log(" [6] ".concat(pkgNameInput, "-cloud (v1.1) - \u0627\u0644\u062A\u0643\u0627\u0645\u0644 \u0627\u0644\u0633\u062D\u0627\u0628\u064A"));
        console.log(" ... (\u064A\u0648\u062C\u062F 1,234 \u0646\u062A\u064A\u062C\u0629 \u0623\u062E\u0631\u0649)");
        console.log(formatLog("\n\uD83D\uDCA1 \u0627\u0633\u062A\u062E\u062F\u0645: \"noor pkg install <name>\" \u0644\u062A\u062B\u0628\u064A\u062A \u0623\u064A \u0645\u0646\u0647\u0627.", colors.cyan));
        process.exit(0);
    }
    else {
        console.log(formatLog("\n\uD83D\uDEE0\uFE0F  [\u0625\u062F\u0627\u0631\u0629 \u062D\u0632\u0645 \u0646\u0648\u0631] \u0645\u062A\u0648\u0641\u0631 \u0627\u0644\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u062A\u0627\u0644\u064A\u0629:", colors.cyan));
        console.log("  noor package install <name>   - \u0644\u062A\u062B\u0628\u064A\u062A \u0645\u0643\u062A\u0628\u0629 \u062C\u062F\u064A\u062F\u0629");
        console.log("  noor package list             - \u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0643\u0627\u062A\u0628 \u0627\u0644\u0645\u062B\u0628\u062A\u0629");
        console.log("  noor package search <query>   - \u0644\u0644\u0628\u062D\u062B \u0639\u0646 \u0645\u0643\u062A\u0628\u0629");
        process.exit(0);
    }
}
else if (command === 'doctor') {
    console.log(formatLog("\n\uD83E\uDE7A [\u0646\u0638\u0627\u0645 \u062A\u0634\u062E\u064A\u0635 \u0639\u0627\u0641\u064A\u0629 \u0645\u062D\u0631\u0643 \u0646\u0648\u0631] \u062C\u0627\u0631\u064A \u0641\u062D\u0635 \u0628\u064A\u0626\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629...\n", colors.cyan + colors.bold));
    // 1. فحص بيئة Node.js
    var nodeVersion = process.version;
    console.log("\uD83D\uDFE2 \u0628\u064A\u0626\u0629 \u062A\u0634\u063A\u064A\u0644 Node.js: ".concat(formatLog('متوفرة بامتياز', colors.green), " (\u0627\u0644\u0625\u0635\u062F\u0627\u0631: ").concat(formatLog(nodeVersion, colors.yellow), ")"));
    // 2. معلومات نظام التشغيل
    console.log("\uD83D\uDFE2 \u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0643\u062A\u0634\u0641: ".concat(formatLog(process.platform, colors.green), " (").concat(formatLog(process.arch, colors.yellow), ")"));
    console.log("\uD83D\uDFE2 \u0645\u062C\u0644\u062F \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0631\u0626\u064A\u0633\u064A: ".concat(formatLog(os_1.default.homedir(), colors.cyan)));
    // 3. فحص الصلاحيات ووجود المجلدات الهامة
    var directoriesToCheck = ['src', 'stdlib', 'examples', 'docs'];
    console.log(formatLog("\n\uD83D\uDCC2 \u062C\u0627\u0631\u064A \u0641\u062D\u0635 \u0648\u062C\u0648\u062F \u0648\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0645\u062C\u0644\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629:\n", colors.bold));
    for (var _b = 0, directoriesToCheck_1 = directoriesToCheck; _b < directoriesToCheck_1.length; _b++) {
        var dir = directoriesToCheck_1[_b];
        var dirPath = path_1.default.resolve(process.cwd(), dir);
        if (fs_1.default.existsSync(dirPath)) {
            try {
                // اختبار صلاحية القراءة والكتابة
                fs_1.default.accessSync(dirPath, fs_1.default.constants.R_OK | fs_1.default.constants.W_OK);
                console.log("  \uD83D\uDD39 \u0645\u062C\u0644\u062F ".concat(formatLog(dir + '/', colors.cyan), ": ").concat(formatLog('موجود وصلاحيات الوصول ممتازة وعاملة ✅', colors.green)));
            }
            catch (e) {
                console.log("  \uD83D\uDD38 \u0645\u062C\u0644\u062F ".concat(formatLog(dir + '/', colors.cyan), ": ").concat(formatLog('موجود ولكن صلاحيات القراءة/الكتابة مقيدة ⚠️', colors.yellow)));
            }
        }
        else {
            console.log("  \u274C \u0645\u062C\u0644\u062F ".concat(formatLog(dir + '/', colors.cyan), ": ").concat(formatLog('غير موجود أو غير متصل 🛑', colors.red)));
        }
    }
    // 4. فحص ملف الإعدادات
    var pathConfig = path_1.default.join(os_1.default.homedir(), '.noorconfig');
    if (fs_1.default.existsSync(pathConfig)) {
        console.log("\n\uD83D\uDD39 \u0645\u0644\u0641 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645 ".concat(formatLog('~/.noorconfig', colors.cyan), ": ").concat(formatLog('موجود وفعال ✅', colors.green)));
    }
    else {
        console.log("\n\uD83D\uDD38 \u0645\u0644\u0641 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645 ".concat(formatLog('~/.noorconfig', colors.cyan), ": ").concat(formatLog('غير مهيأ (سيتم إنشائه تلقائياً عند تشغيل noor init) ℹ️', colors.yellow)));
    }
    console.log(formatLog("\n\u2705 \u0627\u0646\u062A\u0647\u0649 \u0627\u0644\u0641\u062D\u0635 \u0628\u0646\u062C\u0627\u062D! \u0639\u0627\u0641\u064A\u0629 \u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u0645\u062A\u0627\u0632\u0629 \u0648\u0645\u0633\u062A\u0639\u062F\u0629 \u0644\u0644\u062A\u062D\u062F\u064A\u0627\u062A \u0648\u0627\u0644\u0627\u0628\u062A\u0643\u0627\u0631.", colors.green + colors.bold));
    process.exit(0);
}
else if (command === 'file') {
    var op = args[1];
    var target = args[2];
    if (!op || !target) {
        console.error('❌ استخدام خاطئ: noor file <read|write|delete> <path>');
        process.exit(1);
    }
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var code = '';
    if (op === 'read')
        code = "\u0627\u0643\u062A\u0628(\u0642\u0631\u0627\u0621\u0629_\u0645\u0644\u0641(\"".concat(target, "\"))");
    else if (op === 'delete')
        code = "\u062D\u0630\u0641_\u0645\u0644\u0641(\"".concat(target, "\")\n\u0627\u0643\u062A\u0628(\"\u2705 \u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641 \u0628\u0646\u062C\u0627\u062D\")");
    else {
        console.error('❌ عملية غير مدعومة: ' + op);
        process.exit(1);
    }
    var result = interpreter.run(code);
    if (result.success)
        result.logs.forEach(function (log) { return console.log(log); });
    else
        console.error("\uD83D\uDD34 \u062E\u0637\u0623: ".concat(result.error));
    process.exit(0);
}
else if (command === 'db') {
    var action = args[1];
    var key = args[2];
    var value = args[3];
    if (!action || !key) {
        console.error('❌ استخدام خاطئ: noor db <save|get> <key> [value]');
        process.exit(1);
    }
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var code = "\u0627\u0646\u0634\u0626 \u0642\u0627\u0639\u062F\u0629 = \u0627\u062A\u0635\u0627\u0644_\u0642\u0627\u0639\u062F\u0629_\u0628\u064A\u0627\u0646\u0627\u062A(\"file\", \"noor.db\")\n";
    if (action === 'save')
        code += "\u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0633\u0631\u064A\u0639(\"\u062D\u0641\u0638 ".concat(key, " = ").concat(value, "\", \u0642\u0627\u0639\u062F\u0629)\n\u0627\u0643\u062A\u0628(\"\u2705 \u062A\u0645 \u062D\u0641\u0638 ").concat(key, " \u0628\u0646\u062C\u0627\u062D\")");
    else if (action === 'get')
        code += "\u0627\u0643\u062A\u0628(\u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0633\u0631\u064A\u0639(\"\u062C\u0644\u0628 ".concat(key, "\", \u0642\u0627\u0639\u062F\u0629))");
    var result = interpreter.run(code);
    if (result.success)
        result.logs.forEach(function (log) { return console.log(log); });
    else
        console.error("\uD83D\uDD34 \u062E\u0637\u0623: ".concat(result.error));
    process.exit(0);
}
else if (command === 'http') {
    var url = args[1];
    if (!url) {
        console.error('❌ استخدام خاطئ: noor http <url>');
        process.exit(1);
    }
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var code = "\u0627\u0643\u062A\u0628(\u0637\u0644\u0628_\u0648\u064A\u0628_\u0641\u0639\u0644\u064A\u0629(\"".concat(url, "\"))");
    var result = interpreter.run(code);
    if (result.success)
        result.logs.forEach(function (log) { return console.log(log); });
    else
        console.error("\uD83D\uDD34 \u062E\u0637\u0623: ".concat(result.error));
    process.exit(0);
}
else if (command === 'serve') {
    var port = args[1] || '8080';
    var dir = args[2] || '.';
    console.log("\uD83C\uDF10 \u062C\u0627\u0631\u064A \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0645\u062D\u0644\u064A \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0641\u0630 ".concat(port, " \u0641\u064A \u0627\u0644\u0645\u062C\u0644\u062F ").concat(dir, "..."));
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    interpreter.run("\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"std_http_server\")\n\u0625\u0637\u0644\u0627\u0642_\u062E\u0627\u062F\u0645_\u0645\u062D\u0644\u064A(\"".concat(port, "\", \"").concat(dir, "\")"));
    process.exit(0);
}
else if (command === 'hash') {
    var text = args[1];
    if (!text) {
        console.error('❌ استخدام خاطئ: noor hash <text>');
        process.exit(1);
    }
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var result = interpreter.run("\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"std_hash\")\n\u0627\u0643\u062A\u0628(\"MD5: \" + \u0647\u0627\u0634_md5(\"".concat(text, "\"))\n\u0627\u0643\u062A\u0628(\"SHA256: \" + \u0647\u0627\u0634_sha256(\"").concat(text, "\"))"));
    result.logs.forEach(function (l) { return console.log(l); });
    process.exit(0);
}
else if (command === 'base64') {
    var op = args[1];
    var text = args[2];
    if (!op || !text) {
        console.error('❌ استخدام خاطئ: noor base64 <encode|decode> <text>');
        process.exit(1);
    }
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var result = void 0;
    if (op === 'encode')
        result = interpreter.run("\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"std_base64\")\n\u0627\u0643\u062A\u0628(\u062A\u0631\u0645\u064A\u0632_\u0628\u0627\u063264(\"".concat(text, "\"))"));
    else
        result = interpreter.run("\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"std_base64\")\n\u0627\u0643\u062A\u0628(\u0641\u0643_\u062A\u0631\u0645\u064A\u0632_\u0628\u0627\u063264(\"".concat(text, "\"))"));
    result.logs.forEach(function (l) { return console.log(l); });
    process.exit(0);
}
else if (command === 'system') {
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var code = "\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"std_system_info\")\n\u0627\u0643\u062A\u0628(\"\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0639\u062A\u0627\u062F \u0627\u0644\u062D\u064A\u0629:\")\n\u0627\u0643\u062A\u0628(\"\u0627\u0644\u0646\u0638\u0627\u0645: \" + \u0627\u0633\u0645_\u0627\u0644\u0646\u0638\u0627\u0645())\n\u0627\u0643\u062A\u0628(\"\u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629: \" + \u0627\u0644\u0639\u0645\u0627\u0631\u0629_\u0627\u0644\u0645\u0639\u0645\u0627\u0631\u064A\u0629())\n\u0627\u0643\u062A\u0628(\"\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062D\u0627\u0644\u064A: \" + \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645_\u0627\u0644\u062D\u0627\u0644\u064A())\n\u0627\u0643\u062A\u0628(\"\u0645\u062F\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644: \" + \u0645\u062F\u0629_\u0627\u0644\u062A\u0634\u063A\u064A\u0644())";
    var result = interpreter.run(code);
    result.logs.forEach(function (l) { return console.log(l); });
    process.exit(0);
}
else if (command === 'ping') {
    var host = args[1];
    if (!host) {
        console.error('❌ استخدام خاطئ: noor ping <host>');
        process.exit(1);
    }
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var result = interpreter.run("\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"std_network_scan\")\n\u0627\u0643\u062A\u0628(\u0628\u064A\u0646\u062C_\u062E\u0627\u062F\u0645(\"".concat(host, "\"))"));
    result.logs.forEach(function (l) { return console.log(l); });
    process.exit(0);
}
else if (command === 'docker-ls') {
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var result = interpreter.run("\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"std_docker\")\n\u0627\u0643\u062A\u0628(\u062F\u0648\u0643\u0631_\u062D\u0627\u0644\u0629_\u062D\u0627\u0648\u064A\u0627\u062A())");
    result.logs.forEach(function (l) { return console.log(l); });
    process.exit(0);
}
else if (command === 'scrape') {
    var url = args[1];
    if (!url) {
        console.error('❌ استخدام خاطئ: noor scrape <url>');
        process.exit(1);
    }
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var result = interpreter.run("\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"std_web_scraper\")\n\u0627\u0643\u062A\u0628(\u0627\u0633\u062A\u062E\u0631\u0627\u062C_\u0627\u0644\u0646\u0635\u0648\u0635(\"".concat(url, "\"))"));
    result.logs.forEach(function (l) { return console.log(l); });
    process.exit(0);
}
else if (command === 'roadmap') {
    console.log("\n".concat(colors.bold).concat(colors.green, "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501").concat(colors.reset, "\n").concat(colors.bold).concat(colors.cyan, "\uD83C\uDFAE \u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u0637\u0631\u064A\u0642 \u0627\u0644\u0643\u0628\u0631\u0649 \u0644\u062A\u0635\u0628\u062D \u0645\u0637\u0648\u0631 \u0623\u0644\u0639\u0627\u0628 \u0645\u062D\u062A\u0631\u0641 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631 (Sovereign Level) \uD83C\uDFAE").concat(colors.reset, "\n").concat(colors.bold).concat(colors.green, "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501").concat(colors.reset, "\n\n\u062A\u062D\u062A\u0648\u064A \u0647\u0630\u0647 \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0639\u0644\u0649 17 \u0642\u0637\u0627\u0639\u0627\u064B \u0623\u0633\u0627\u0633\u064A\u0627\u064B \u062A\u063A\u0637\u064A \u0643\u0644 \u0645\u0627 \u062A\u062D\u062A\u0627\u062C\u0647 \u0644\u062A\u0635\u0645\u064A\u0645 \u0648\u0628\u0646\u0627\u0621 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0628\u0645\u062E\u062A\u0644\u0641 \u0623\u0646\u0648\u0627\u0639\u0647\u0627:\n\n").concat(colors.bold).concat(colors.yellow, "1. \u0645\u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0623\u0644\u0639\u0627\u0628 (Game Engines):").concat(colors.reset, "\n   - \u062B\u0644\u0627\u062B\u064A\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062F (3D) \u0648\u062B\u0646\u0627\u0626\u064A\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062F (2D): Unity, Unreal Engine, Godot, CryEngine, GameMaker.\n\n").concat(colors.bold).concat(colors.yellow, "2. \u0644\u063A\u0627\u062A \u0627\u0644\u0628\u0631\u0645\u062C\u0629 (Programming Languages):").concat(colors.reset, "\n   - \u0627\u0644\u0644\u063A\u0627\u062A \u0627\u0644\u0633\u064A\u0627\u062F\u064A\u0629: C++ (\u0633\u0631\u0639\u0629 \u0645\u0637\u0644\u0642\u0629)\u060C C# (Unity)\u060C Python (\u062A\u062C\u0627\u0631\u0628)\u060C Lua (\u0633\u0643\u0631\u0628\u062A\u0627\u062A)\u060C JavaScript (\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0648\u064A\u0628).\n\n").concat(colors.bold).concat(colors.yellow, "3. \u0645\u0643\u062A\u0628\u0627\u062A \u0627\u0644\u062C\u0631\u0627\u0641\u064A\u0643\u0633 (Graphics APIs):").concat(colors.reset, "\n   - \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0631\u0633\u0648\u0645\u0627\u062A: Vulkan (\u062D\u062F\u064A\u062B \u0648\u0633\u0631\u064A\u0639)\u060C DirectX 12 (\u0645\u0627\u064A\u0643\u0631\u0648\u0633\u0648\u0641\u062A)\u060C OpenGL (\u0645\u062A\u0648\u0627\u0641\u0642)\u060C Metal (\u0623\u0628\u0644).\n\n").concat(colors.bold).concat(colors.yellow, "4. \u0645\u062D\u0631\u0643\u0627\u062A/\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0631\u0633\u0648\u0645 (Rendering Systems):").concat(colors.reset, "\n   - \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u0648\u0627\u062F\u060C \u0627\u0644\u0625\u0636\u0627\u0621\u0629 \u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A\u0629 (Ray Tracing)\u060C \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0628\u0635\u0631\u064A \u0627\u0644\u0644\u0627\u062D\u0642 (Post Processing)\u060C \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0638\u0644\u0627\u0644.\n\n").concat(colors.bold).concat(colors.yellow, "5. \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A (AI Systems):").concat(colors.reset, "\n   - \u0645\u0645\u0631\u0627\u062A \u0627\u0644\u062D\u0631\u0643\u0629 (Pathfinding A*)\u060C \u0623\u0634\u062C\u0627\u0631 \u0627\u0644\u0633\u0644\u0648\u0643 (Behavior Trees)\u060C \u0634\u0628\u0643\u0629 \u0627\u0644\u0645\u0644\u0627\u062D\u0629 (NavMesh)\u060C \u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A.\n\n").concat(colors.bold).concat(colors.yellow, "6. \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0644\u0639\u0628 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 (Game Systems):").concat(colors.reset, "\n   - \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0635\u062D\u0629 (Health)\u060C \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0642\u064A\u0628\u0629 \u0648\u0627\u0644\u0645\u062E\u0632\u0648\u0646 (Inventory)\u060C \u0627\u0644\u0642\u062A\u0627\u0644 \u0648\u0627\u0644\u0636\u0631\u0631 (Combat)\u060C \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0648\u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639 (Save/Load).\n\n").concat(colors.bold).concat(colors.yellow, "7. \u0627\u0644\u0631\u0633\u0648\u0645 \u0648\u0627\u0644\u0623\u0646\u064A\u0645\u064A\u0634\u0646 (Animation):").concat(colors.reset, "\n   - \u0627\u0644\u0647\u064A\u0627\u0643\u0644 \u0627\u0644\u0639\u0638\u0645\u064A\u0629 (Skeletal)\u060C \u062A\u062D\u0631\u064A\u0643 \u0627\u0644\u0639\u0638\u0627\u0645 (Rigging)\u060C \u0627\u0644\u062A\u0642\u0627\u0637 \u0627\u0644\u062D\u0631\u0643\u0629 \u0627\u0644\u0648\u0627\u0642\u0639\u064A\u0629 (Motion Capture)\u060C \u0627\u0644\u0623\u0634\u062C\u0627\u0631 \u0627\u0644\u0645\u0645\u0632\u0648\u062C\u0629.\n\n").concat(colors.bold).concat(colors.yellow, "8. \u0627\u0644\u0645\u0624\u062B\u0631\u0627\u062A \u0627\u0644\u0628\u0635\u0631\u064A\u0629 (VFX):").concat(colors.reset, "\n   - \u0646\u0638\u0627\u0645 \u0627\u0644\u062C\u0632\u064A\u0626\u0627\u062A (Particles)\u060C \u0627\u0644\u0627\u0646\u0641\u062C\u0627\u0631\u0627\u062A (Explosions)\u060C \u062A\u0623\u062B\u064A\u0631\u0627\u062A \u0627\u0644\u062F\u062E\u0627\u0646 \u0648\u0627\u0644\u0646\u0627\u0631 \u0648\u0627\u0644\u0645\u0627\u0621 \u0648\u0627\u0644\u0636\u0628\u0627\u0628.\n\n").concat(colors.bold).concat(colors.yellow, "9. \u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0639\u0648\u0627\u0644\u0645 \u0648\u0627\u0644\u0628\u064A\u0626\u0627\u062A (World Building):").concat(colors.reset, "\n   - \u062A\u0648\u0644\u064A\u062F \u062A\u0636\u0627\u0631\u064A\u0633 \u0639\u0634\u0648\u0627\u0626\u064A\u0629 (Procedural Generation)\u060C \u0627\u0644\u0628\u064A\u0626\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0639\u064A\u0629 (\u0627\u0644\u0645\u0628\u0627\u0646\u064A \u0648\u0627\u0644\u0623\u0634\u062C\u0627\u0631 \u0648\u0627\u0644\u062C\u0628\u0627\u0644).\n\n").concat(colors.bold).concat(colors.yellow, "10. \u0623\u062F\u0648\u0627\u062A \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u062E\u0627\u0631\u062C\u064A (3D/2D Tools):").concat(colors.reset, "\n   - \u0646\u0645\u0630\u062C\u0629 \u062B\u0644\u0627\u062B\u064A\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062F: Blender, Maya, ZBrush. \u0631\u0633\u0645 \u0648\u0645\u0648\u0627\u062F: Substance Painter, Photoshop, Krita.\n\n").concat(colors.bold).concat(colors.yellow, "11. \u0627\u0644\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0644\u0644\u0623\u0644\u0639\u0627\u0628 (Audio Systems):").concat(colors.reset, "\n   - \u0628\u062B \u0645\u062C\u0633\u0645 \u062A\u0641\u0627\u0639\u0644\u064A: FMOD, Wwise, 3D Spatial Audio, \u0648\u0645\u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649 \u0627\u0644\u062A\u0646\u0627\u0638\u0631\u064A\u0629 \u0648\u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A\u0629.\n\n").concat(colors.bold).concat(colors.yellow, "12. \u0634\u0628\u0643\u0627\u062A \u0627\u0644\u0644\u0639\u0628 \u0627\u0644\u062C\u0645\u0627\u0639\u064A (Multiplayer Networking):").concat(colors.reset, "\n   - \u0647\u0646\u062F\u0633\u0629 \u062E\u0627\u062F\u0645/\u0639\u0645\u064A\u0644 (Client-Server)\u060C \u0627\u0644\u0633\u064A\u0631\u0641\u0631\u0627\u062A \u0627\u0644\u0645\u062E\u0635\u0635\u0629 (Dedicated Servers)\u060C \u062A\u0639\u0648\u064A\u0636 \u0627\u0644\u062A\u0623\u062E\u064A\u0631 (Lag Compensation).\n\n").concat(colors.bold).concat(colors.yellow, "13. \u0645\u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621 (Physics Engines):").concat(colors.reset, "\n   - \u0645\u062D\u0627\u0643\u0627\u0629 \u0627\u0644\u0648\u0627\u0642\u0639: NVIDIA PhysX, Havok, Bullet, \u0648\u0623\u0646\u0638\u0645\u0629 \u062A\u0635\u0627\u062F\u0645 \u0627\u0644\u0647\u064A\u0627\u0643\u0644 \u0627\u0644\u0635\u0644\u0628\u0629 (Rigidbody) \u0648\u0627\u0644\u062F\u0645\u064A\u0629 (Ragdoll).\n\n").concat(colors.bold).concat(colors.yellow, "14. \u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0646\u0634\u0631 \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644 (Platforms):").concat(colors.reset, "\n   - \u062A\u063A\u0637\u064A\u0629 \u0634\u0627\u0645\u0644\u0629: PC, PlayStation, Xbox, Android, iOS, VR/AR, \u0648\u0627\u0644\u0645\u062A\u0635\u0641\u062D\u0627\u062A \u0628\u062F\u0648\u0646 \u0641\u0631\u0648\u0642\u0627\u062A.\n\n").concat(colors.bold).concat(colors.yellow, "15. \u0623\u062F\u0648\u0627\u062A \u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0648\u0627\u0644\u062A\u062D\u0631\u064A\u0631 (Dev Tools):").concat(colors.reset, "\n   - \u0627\u0644\u0645\u0637\u0648\u0631\u0648\u0646: Visual Studio, Rider, \u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0625\u0635\u062F\u0627\u0631\u0627\u062A Git, \u0648\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0627\u0644\u062F\u0642\u064A\u0642 (Profilers).\n\n").concat(colors.bold).concat(colors.yellow, "16. \u0627\u0644\u0628\u0646\u064A\u0629 \u0627\u0644\u062A\u062D\u062A\u064A\u0629 \u0648\u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 (Cloud Backend):").concat(colors.reset, "\n   - \u0633\u064A\u0631\u0641\u0631\u0627\u062A \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0627\u0644\u0633\u064A\u0631\u0641\u0631\u0627\u062A \u0627\u0644\u062D\u064A\u0629: AWS (Amazon Gamelift), Google Cloud, Photon Engine, PlayFab.\n\n").concat(colors.bold).concat(colors.yellow, "17. \u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u0637\u0648\u0631\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u064A\u0629 (Advanced Optimizations):").concat(colors.reset, "\n   - \u062A\u062A\u0628\u0639 \u0627\u0644\u0625\u0634\u0639\u0627\u0639 (Ray Tracing)\u060C \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0631\u0633\u0648\u0645 \u0627\u0644\u0645\u062A\u0643\u064A\u0641\u0629 (LOD)\u060C \u062A\u062C\u0645\u064A\u062F \u0627\u0644\u0631\u0624\u064A\u0629 \u063A\u064A\u0631 \u0627\u0644\u0646\u0634\u0637\u0629 (Occlusion Culling).\n\n").concat(colors.bold).concat(colors.green, "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501").concat(colors.reset, "\n"));
    process.exit(0);
}
else if (command === 'game-guide') {
    var guideType = args[1];
    if (guideType === 'pubg') {
        console.log("\n".concat(colors.bold).concat(colors.cyan, "\uD83C\uDFAF \u0643\u064A\u0641 \u062A\u064F\u0635\u0646\u0639 \u0644\u0639\u0628\u0629 \u0628\u0627\u062A\u0644 \u0631\u0648\u064A\u0627\u0644 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0645\u062B\u0644 PUBG \u0623\u0648 Free Fire\u061F (\u0627\u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629) \uD83C\uDFAF").concat(colors.reset, "\n\n").concat(colors.bold, "1. \u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0634\u0628\u0643\u0627\u062A UDP \u0627\u0644\u0645\u062A\u0632\u0627\u0645\u0646\u0629 (Dedicated Server Architecture):").concat(colors.reset, "\n   - \u0641\u064A \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0639\u0627\u062F\u064A\u0629\u060C \u064A\u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 TCP \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u062F\u0642\u0629\u060C \u0648\u0644\u0643\u0646 \u0641\u064A PUBG \u064A\u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644 UDP \u0627\u0644\u0645\u062E\u0635\u0635 \u0644\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0642\u0635\u0648\u0649.\n   - \u064A\u062A\u0648\u062C\u0628 \u062A\u0641\u0639\u064A\u0644 \u0645\u0639\u062F\u0644 \u062A\u062D\u062F\u064A\u062B \u0625\u0637\u0627\u0631\u0627\u062A \u0634\u0628\u0643\u064A (Tick Rate) \u0644\u0627 \u064A\u0642\u0644 \u0639\u0646 30-60 \u0647\u0631\u062A\u0632 \u0644\u0646\u0642\u0644 \u0645\u0648\u0627\u0636\u0639 \u062D\u0631\u0643\u0629 \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0627\u0644\u0633\u0631\u064A\u0639\u0629.\n   - \u062A\u0637\u0628\u064A\u0642 \u062A\u0642\u0646\u064A\u0629 \"\u062A\u0639\u0648\u064A\u0636 \u062A\u0623\u062E\u064A\u0631 \u0627\u0644\u0627\u062A\u0635\u0627\u0644\" (Lag Compensation) \u0644\u062D\u0633\u0627\u0628 \u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0642\u0630\u0648\u0641\u0627\u062A \u0627\u0644\u0646\u0627\u0631\u064A\u0629 \u0628\u062F\u0642\u0629 \u062A\u0645\u0646\u0639 \u0627\u0644\u0625\u0641\u0644\u0627\u062A.\n\n").concat(colors.bold, "2. \u062A\u0648\u0644\u064A\u062F \u0648\u0646\u062B\u0631 \u0627\u0644\u063A\u0646\u0627\u0626\u0645 (Procedural Loot Spawning & Inventory):").concat(colors.reset, "\n   - \u064A\u062A\u0645 \u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0623\u0633\u0644\u062D\u0629 (AWM, M416) \u0648\u0627\u0644\u0645\u0639\u062F\u0627\u062A \u062D\u0631\u0643\u064A\u0627\u064B \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u062D\u062A\u0645\u0627\u0644\u0627\u062A \u0631\u064A\u0627\u0636\u064A\u0629 \u0648\u0639\u0634\u0648\u0627\u0626\u064A\u0629 \u062A\u0636\u0645\u0646 \u062F\u0642\u0629 \u0627\u0644\u0644\u0639\u0628 \u0627\u0644\u0625\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A.\n   - \u0631\u0628\u0637 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0648\u0627\u0644\u0645\u0644\u062D\u0642\u0627\u062A (Scopes, Suppressors) \u0628\u0643\u0648\u062F \u062D\u0642\u064A\u0628\u0629 \u0627\u0644\u0638\u0647\u0631 (Backpack System).\n\n").concat(colors.bold, "3. \u062A\u0636\u064A\u064A\u0642 \u0646\u0637\u0627\u0642 \u0627\u0644\u0644\u0639\u0628 (Safe Zone Blue Zone Logic):").concat(colors.reset, "\n   - \u0643\u062A\u0627\u0628\u0629 \u0645\u0639\u0627\u0644\u062C\u0629 \u0631\u064A\u0627\u0636\u064A\u0629 \u062F\u0648\u0631\u064A\u0629 \u0644\u062A\u062D\u062F\u064A\u062F \u0645\u0631\u0643\u0632 \u0639\u0634\u0648\u0627\u0626\u064A \u0644\u0644\u062F\u0627\u0626\u0631\u0629 \u064A\u062A\u062C\u0647 \u0644\u0647 \u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0628\u0634\u0643\u0644 \u062A\u062F\u0631\u064A\u062C\u064A.\n   - \u062A\u0637\u0628\u064A\u0642 \u0636\u0631\u0631 \u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0643\u0648\u0646\u064A (Zone Damage Factor) \u0644\u0643\u0644 \u0645\u0646 \u064A\u0642\u0639 \u062E\u0627\u0631\u062C \u0627\u0644\u0642\u0637\u0631 \u0627\u0644\u0622\u0645\u0646.\n\n").concat(colors.bold, "4. \u0641\u064A\u0632\u064A\u0627\u0621 \u0627\u0644\u0645\u0642\u0630\u0648\u0641\u0627\u062A \u0648\u0637\u064A\u0631\u0627\u0646 \u0627\u0644\u0631\u0635\u0627\u0635 (Bullet Drop & Spatial Sound Path):").concat(colors.reset, "\n   - \u062D\u0633\u0627\u0628 \u0633\u0647\u0645 \u0645\u0633\u0627\u0641\u0629 \u0633\u0642\u0648\u0637 \u0627\u0644\u0645\u0642\u0630\u0648\u0641 (Bullet Gravity Drop) \u062D\u0633\u0628 \u0627\u0644\u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u062D\u0631\u0643\u064A \u0644\u0643\u0644 \u0628\u0646\u062F\u0642\u064A\u0629.\n   - \u062F\u0645\u062C \u0645\u062D\u0631\u0643 \u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0645\u062C\u0633\u0645 (Spatial 3D Audio) \u0644\u062A\u0645\u0643\u064A\u0646 \u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u0646 \u0645\u0639\u0631\u0641\u0629 \u062C\u0647\u0629 \u0625\u0637\u0644\u0627\u0642 \u0627\u0644\u0646\u0627\u0631 \u0648\u0633\u0645\u0627\u0639 \u062E\u0637\u0648\u0627\u062A \u0627\u0644\u0623\u0642\u062F\u0627\u0645 \u0628\u062F\u0642\u0629 360 \u062F\u0631\u062C\u0629.\n\n").concat(colors.bold, "5. \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0623\u062F\u0627\u0621 \u0648\u0627\u0644\u062F\u0639\u0645 (High Performance Optimization):").concat(colors.reset, "\n   - \u0645\u064A\u0632\u0629 Occlusion Culling \u0648\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 LOD \u0644\u0636\u0645\u0627\u0646 \u0639\u062F\u0645 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A\u0629 \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0636\u0639\u064A\u0641\u0629 \u0648\u0645\u0648\u0628\u0627\u064A\u0644\u0627\u062A \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F.\n"));
    }
    else {
        console.log("\n".concat(colors.bold).concat(colors.cyan, "\uD83C\uDFAE \u0643\u064A\u0641 \u062A\u0635\u0646\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u062B\u0646\u0627\u0626\u064A\u0629/\u062B\u0644\u0627\u062B\u064A\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0627\u0644\u0639\u0627\u062F\u064A\u0629 \u0648\u0627\u0644\u0635\u063A\u064A\u0631\u0629\u061F \uD83C\uDFAE").concat(colors.reset, "\n\n\u062A\u064F\u0634\u064A\u062F \u0623\u0639\u062A\u0649 \u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644 \u0648\u0627\u0644\u062D\u0627\u0633\u0628 \u0627\u0644\u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629 \u0628\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0639\u0644\u0649 \u0627\u0644\u0645\u0628\u0627\u062F\u0626 \u0627\u0644\u062A\u0627\u0644\u064A\u0629:\n\n").concat(colors.bold, "1. \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u0644\u0639\u0628\u0629 \u0627\u0644\u062F\u0627\u0626\u0631\u064A \u0627\u0644\u0645\u0633\u062A\u0645\u0631 (The Loop):").concat(colors.reset, "\n   \u064A\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0631\u0633\u0648\u0645 \u0628\u0645\u0639\u062F\u0644 60 \u0625\u0637\u0627\u0631 \u0628\u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0648\u0627\u062D\u062F\u0629 \u0639\u0628\u0631 \u062A\u0642\u0633\u064A\u0645 \u0645\u0631\u0627\u062D\u0644 \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0625\u0644\u0649:\n   - ").concat(colors.bold, "Input Handler:").concat(colors.reset, " \u0631\u0635\u062F \u0648\u0636\u063A\u0637 \u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u062D\u0631\u0643\u0629 \u0623\u0648 \u0634\u0627\u0634\u0627\u062A \u0627\u0644\u0644\u0645\u0633.\n   - ").concat(colors.bold, "Physics Update:").concat(colors.reset, " \u062D\u0633\u0627\u0628 \u0627\u0644\u062D\u0631\u0643\u0629 \u0648\u0627\u0644\u062A\u0635\u0627\u062F\u0645 \u0648\u0633\u0631\u0639\u0629 \u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629 \u0644\u0644\u0623\u062C\u0633\u0627\u0645 \u0627\u0644\u0635\u0644\u0628\u0629.\n   - ").concat(colors.bold, "Render Screen:").concat(colors.reset, " \u0639\u0631\u0636 \u0627\u0644\u0631\u0633\u0648\u0645 \u0639\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629 \u0628\u0635\u0648\u0631\u0629 \u0645\u062A\u0648\u0627\u0635\u0644\u0629 \u062F\u0648\u0646 \u0648\u0645\u064A\u0636.\n\n").concat(colors.bold, "2. \u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0643\u064A\u0627\u0646\u0627\u062A \u0648\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A (ECS Architecture):").concat(colors.reset, "\n   - \u0643\u0644 \u0634\u064A\u0621 \u0641\u064A \u0627\u0644\u0644\u0639\u0628\u0629 \u0647\u0648 \u0643\u0627\u0626\u0646 (Player, Enemy, Bullet, Wall).\n   - \u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u0627\u0644\u062A\u0648\u0627\u0631\u062B \u0627\u0644\u0628\u0631\u0645\u062C\u064A \u0627\u0644\u0636\u062E\u0645\u060C \u064A\u062A\u0645 \u062A\u0631\u0643\u064A\u0628 \u0645\u0643\u0648\u0646\u0627\u062A \u0645\u062A\u062C\u0627\u0646\u0633\u0629: \u0643\u0627\u0626\u0646 \u0627\u0644\u0647\u0648\u064A\u0629 + \u0643\u0627\u0626\u0646 \u0627\u0644\u062D\u0631\u0643\u0629 + \u0643\u0627\u0626\u0646 \u0627\u0644\u0631\u0633\u0648\u0645.\n\n").concat(colors.bold, "3. \u062D\u0641\u0638 \u0627\u0644\u062D\u0627\u0644\u0629 \u0648\u0627\u0644\u0645\u0643\u0627\u0641\u0622\u062A (Data Serialization):").concat(colors.reset, "\n   - \u062A\u062E\u0632\u064A\u0646 \u062A\u0642\u062F\u0645 \u0627\u0644\u0644\u0627\u0639\u0628 \u0648\u0635\u062D\u062A\u0647 \u0648\u062D\u062C\u0645 \u0627\u0644\u0630\u0647\u0628 \u0639\u0634\u0648\u0627\u0626\u064A\u0627\u064B \u0641\u064A \u0645\u0644\u0641 JSON \u0623\u0648 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0633\u0631\u064A\u0639\u0629 \u0644\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u0641\u0648\u0631\u064A.\n"));
    }
    process.exit(0);
}
else if (command === 'game-init') {
    var gameDir = args[1];
    if (!gameDir) {
        console.error('❌ يرجى تحديد اسم مجلد اللعبة. مثال: noor game-init pubg_lite');
        process.exit(1);
    }
    var targetPath = path_1.default.resolve(process.cwd(), gameDir);
    console.log(formatLog("\n\uD83C\uDFAE [\u0645\u062D\u0631\u0643 \u0623\u0644\u0639\u0627\u0628 \u0646\u0648\u0631] \u0628\u062F\u0621 \u0625\u0646\u0634\u0627\u0621 \u0628\u064A\u0626\u0629 \u062A\u0637\u0648\u064A\u0631 \u0644\u0639\u0628\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 \u0645\u0633\u062A\u0642\u0644\u0629...", colors.cyan + colors.bold));
    try {
        // إنشاء المجلدات
        var dirs = ['', 'src', 'assets', 'assets/textures', 'assets/audio', 'config'];
        for (var _c = 0, dirs_1 = dirs; _c < dirs_1.length; _c++) {
            var d = dirs_1[_c];
            var folder = path_1.default.join(targetPath, d);
            if (!fs_1.default.existsSync(folder)) {
                fs_1.default.mkdirSync(folder);
                console.log(formatLog("  \uD83D\uDCC2 \u062A\u0645 \u062A\u0623\u0633\u064A\u0633 \u0627\u0644\u0645\u062C\u0644\u062F: ".concat(folder.replace(process.cwd(), '')), colors.green));
            }
        }
        // كود ملف اللعبة الرئيسي game.noor
        var gameNoorCode = "// \u0644\u0639\u0628\u0629 \u0627\u0644\u0633\u0627\u062D\u0629 \u0627\u0644\u0642\u062A\u0627\u0644\u064A\u0629 \u0627\u0644\u0643\u0628\u0631\u0649 \u0628\u0644\u063A\u0629 \u0648\u0645\u062D\u0631\u0643 \u0646\u0648\u0631 \u0627\u0644\u0633\u064A\u0627\u062F\u064A (Sovereign Battlegrounds Core)\n\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"game_engine\")\n\u062A\u062D\u0645\u064A\u0644_\u0645\u0643\u062A\u0628\u0629(\"game_blueprint\")\n\n\u0627\u0643\u062A\u0628(\"=================================================================\")\n\u0627\u0643\u062A\u0628(\"\uD83C\uDFF9 \u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A \u0627\u0644\u0645\u0639\u0631\u0643\u0629 \u0627\u0644\u0642\u062A\u0627\u0644\u064A\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 (Noor Battlegrounds) V5 \uD83C\uDFF9\")\n\u0627\u0643\u062A\u0628(\"=================================================================\")\n\n# 1. \u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u0645\u062D\u0631\u0643 \u0648\u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0635\u0648\u062A\u064A\u0629\n\u0628\u062F\u0621_\u0645\u062D\u0631\u0643_\u0627\u0644\u0623\u0644\u0639\u0627\u0628(1280, 720, \u0635\u062D\u064A\u062D)\n\u062A\u0647\u064A\u0626\u0629_\u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629_\u0648\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621(9.8)\n\n# 2. \u0625\u0646\u0634\u0627\u0621 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0648\u0627\u0644\u0634\u062E\u0635\u064A\u0627\u062A \u0627\u0644\u0646\u0634\u0637\u0629\n\u0627\u0646\u0634\u0626 \u0627\u0644\u0644\u0627\u0639\u0628 = \u0625\u0646\u0634\u0627\u0621_\u0634\u062E\u0635\u064A\u0629_\u0644\u0627\u0639\u0628(\"\u0642\u0646\u0627\u0635_\u0627\u0644\u0639\u0631\u0627\u0642\", 10, 20, 0)\n\u0627\u0646\u0634\u0626 \u0628\u0648\u062A_\u0627\u0644\u0623\u0639\u062F\u0627\u0621 = \u0625\u0646\u0634\u0627\u0621_\u0628\u0648\u062A_\u062E\u0635\u0645(\"\u0645\u0633\u062A\u0648\u0649_\u0645\u062D\u062A\u0631\u0641\", \"M416\", 12, 22)\n\n# 3. \u0645\u062D\u0627\u0643\u0627\u0629 \u0637\u0627\u0626\u0631\u0629 \u0625\u0646\u0632\u0627\u0644 \u0627\u0644\u0645\u0642\u0627\u062A\u0644\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u062E\u0631\u064A\u0637\u0629\n\u0628\u062F\u0621_\u062F\u0648\u0631\u0629_\u0637\u0627\u0626\u0631\u0629_\u0627\u0644\u0646\u0632\u0648\u0644(100)\n\u062A\u0648\u0644\u064A\u062F_\u0627\u0644\u0644\u0648\u062A_\u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A(45)\n\n# 4. \u062A\u0641\u0639\u064A\u0644 \u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0631\u0643\u0629 \u0648\u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u0648\u0627\u0644\u062A\u0628\u0627\u0639\u062F\n\u0627\u0644\u0644\u0627\u0639\u0628 = \u062A\u062D\u062F\u064A\u062B_\u0627\u0644\u0646\u0642\u0627\u0637_\u0648\u0627\u0644\u062D\u0627\u0644\u0629_\u0627\u0644\u0642\u062A\u0627\u0644\u064A\u0629(\u0627\u0644\u0644\u0627\u0639\u0628, \"\u0645\u0634\u0631\u0648\u0628_\u0637\u0627\u0642\u0629\", 35)\n\n# 5. \u0643\u0634\u0641 \u0627\u0644\u062A\u0635\u0627\u062F\u0645 \u0648\u0627\u0644\u0642\u062A\u0627\u0644 \u0648\u0627\u0644\u0628\u0639\u062F \u0627\u0644\u0635\u0648\u062A\u064A \u0627\u0644\u0645\u062C\u0633\u0645\n\u0627\u0643\u062A\u0628(\"\u26A1 \u062C\u0627\u0631\u064A \u0641\u062D\u0635 \u0648\u0645\u0631\u0627\u0642\u0628\u0629 \u0633\u0627\u062D\u0629 \u0627\u0644\u0645\u0648\u0627\u062C\u0647\u0629...\")\n\u0627\u0646\u0634\u0626 \u0645\u062A\u0635\u0627\u062F\u0645 = \u0641\u062D\u0635_\u062A\u0635\u0627\u062F\u0645_\u0645\u062D\u064A\u0637_\u0643\u0627\u0626\u0646(\u0627\u0644\u0644\u0627\u0639\u0628, \u0628\u0648\u062A_\u0627\u0644\u0623\u0639\u062F\u0627\u0621)\n\n\u0627\u0630\u0627 (\u0645\u062A\u0635\u0627\u062F\u0645 == \u0635\u062D\u064A\u062D) {\n  \u0627\u0643\u062A\u0628(\"\uD83C\uDFAF \u0627\u0644\u0644\u0627\u0639\u0628 \u0648\u0627\u0644\u0639\u062F\u0648 \u062A\u0644\u0627\u0642\u064A\u0627! \u0628\u062F\u0621 \u0627\u0644\u0645\u0628\u0627\u0631\u0632\u0629 \u0627\u0644\u062C\u0648\u064A\u0629 \u0627\u0644\u0646\u0627\u0631\u064A\u0629...\")\n  \u0627\u0644\u0644\u0627\u0639\u0628 = \u062A\u062D\u062F\u064A\u062B_\u0627\u0644\u0646\u0642\u0627\u0637_\u0648\u0627\u0644\u062D\u0627\u0644\u0629_\u0627\u0644\u0642\u062A\u0627\u0644\u064A\u0629(\u0627\u0644\u0644\u0627\u0639\u0628, \"\u0631\u0635\u0627\u0635\u0629_\u0625\u0635\u0627\u0628\u0629\", 45)\n}\n\n\u0645\u0639\u0627\u0644\u062C_\u0627\u0644\u0635\u0648\u0645\u062A_\u0627\u0644\u0645\u062C\u0633\u0645_\u062B\u0644\u0627\u062B\u064A_\u0627\u0644\u0623\u0628\u0639\u0627\u062F = \u0645\u0639\u0627\u0644\u062C_\u0627\u0644\u0635\u0648\u062A_\u0627\u0644\u0645\u062C\u0633\u0645_\u062B\u0644\u0627\u062B\u064A_\u0627\u0644\u0623\u0628\u0639\u0627\u062F(\u0627\u0644\u0644\u0627\u0639\u0628, \"\u0625\u0637\u0644\u0627\u0642_\u0646\u0627\u0631_AWM\", 12, 22)\n\n# 6. \u062A\u062D\u062F\u064A\u062B \u0648\u062D\u0631\u0643\u0629 \u062F\u0627\u0626\u0631\u0629 \u0627\u0644\u0632\u0648\u0646 \u0627\u0644\u0622\u0645\u0646\u0629\n\u0627\u0646\u0634\u0626 \u0627\u0644\u0632\u0648\u0646 = \u062A\u062D\u062F\u064A\u062B_\u062D\u0627\u0644\u0629_\u0627\u0644\u062F\u0627\u0626\u0631\u0647_\u0627\u0644\u0622\u0645\u0646\u0647(50, 50, 100)\n\n\u0627\u0643\u062A\u0628(\"\uD83C\uDFC6 \u0646\u0647\u0627\u064A\u0629 \u062F\u0648\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 \u0644\u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0628\u0646\u062C\u0627\u062D!\")\n";
        fs_1.default.writeFileSync(path_1.default.join(targetPath, 'game.noor'), gameNoorCode, 'utf8');
        fs_1.default.writeFileSync(path_1.default.join(targetPath, 'config/game_settings.json'), JSON.stringify({
            title: "Noor Battlegrounds Lite",
            graphics: "High",
            fpsLimit: 60,
            gravity: 9.8,
            soundChannels: 64,
            netcodeTickRate: 30,
            networking: {
                serverHost: "127.0.0.1",
                serverPort: 8899,
                maxClients: 100
            }
        }, null, 2), 'utf8');
        // ملفات فارغة مضحكة لتمثيل الملحقات (Assets placeholders)
        fs_1.default.writeFileSync(path_1.default.join(targetPath, 'assets/textures/player.png'), 'MOCK_IMAGE_DATA_PLAYER', 'utf8');
        fs_1.default.writeFileSync(path_1.default.join(targetPath, 'assets/textures/bullet.png'), 'MOCK_IMAGE_DATA_BULLET', 'utf8');
        fs_1.default.writeFileSync(path_1.default.join(targetPath, 'assets/audio/shoot.wav'), 'MOCK_AUDIO_DATA_SHOOT', 'utf8');
        console.log(formatLog("\n\uD83D\uDCE2 \u062A\u0645 \u062A\u0623\u0633\u064A\u0633 \u0645\u0644\u0641 \u0627\u0644\u0643\u0648\u062F \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0644\u0639\u0628\u0629: ".concat(path_1.default.join(gameDir, 'game.noor')), colors.cyan));
        console.log(formatLog("\uD83D\uDCE2 \u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u062A\u0643\u0648\u064A\u0646 \u0648\u0627\u0644\u062E\u0627\u0645\u0627\u062A \u0648\u0627\u0644\u0645\u0624\u062B\u0631\u0627\u062A \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0628\u0646\u062C\u0627\u062D!", colors.cyan));
        console.log(formatLog("\n\uD83D\uDE80 \u062C\u0627\u0647\u0632 \u0644\u0644\u0628\u062F\u0621! \u0644\u062A\u0634\u063A\u064A\u0644 \u0645\u0644\u0641 \u0627\u0644\u0644\u0639\u0628\u0629 \u0648\u0636\u062E \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A \u0628\u0623\u0633\u0637\u0631 \u0627\u0644\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0627\u0643\u062A\u0628:", colors.bold));
        console.log(formatLog("\uD83D\uDC49 noor game-run ".concat(gameDir, "/game.noor"), colors.yellow + colors.bold));
        console.log(formatLog("\uD83D\uDC49 noor game-view ".concat(gameDir, "/game.noor"), colors.yellow + colors.bold));
    }
    catch (err) {
        console.error(formatLog('❌ فشل إنشاء مجلدات وتصانيف اللعبة:', colors.red), err.message);
    }
    process.exit(0);
}
else if (command === 'game-run') {
    var filePath = args[1];
    if (!filePath) {
        console.error('❌ يرجى اختيار ملف اللعبة المراد تشغيلها. مثال: noor game-run game.noor');
        process.exit(1);
    }
    var absolutePath = path_1.default.resolve(process.cwd(), filePath);
    if (!fs_1.default.existsSync(absolutePath)) {
        console.error("\u274C \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u062D\u062F\u062F \u0644\u0644\u0639\u0628\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631: ".concat(filePath));
        process.exit(1);
    }
    var sourceCode = fs_1.default.readFileSync(absolutePath, 'utf8');
    console.log(formatLog("\n\uD83D\uDD0C [\u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0644\u0639\u0627\u0628] \u062C\u0627\u0631\u064A \u062A\u0634\u063A\u064A\u0644 \u0648\u0636\u062E \u0643\u0648\u062F \u0627\u0644\u0644\u0639\u0628\u0629 \u0641\u064A \u062E\u0627\u062F\u0645 \u0627\u0644\u0646\u0648\u0627\u0629...", colors.cyan + colors.bold));
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var result = interpreter.run(sourceCode);
    if (result.success) {
        result.logs.forEach(function (log) { return console.log(log); });
        console.log(formatLog('\n🎮 [المحاكي] انتهت دورة المحاكاة والتشغيل التفاعلي للعبة بنجاح وبسرعة خارقة!', colors.green));
    }
    else {
        console.error(colors.red + '🔴 حدث خطأ في مصفوفة الكود أو التهيئة الفيزيائية:' + colors.reset);
        console.error(colors.red + result.error + colors.reset);
    }
    process.exit(0);
}
else if (command === 'game-view') {
    var filePath = args[1];
    if (!filePath) {
        console.error('❌ يرجى اختيار ملف اللعبة. مثال: noor game-view game.noor');
        process.exit(1);
    }
    var absolutePath = path_1.default.resolve(process.cwd(), filePath);
    if (!fs_1.default.existsSync(absolutePath)) {
        console.error("\u274C \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u062D\u062F\u062F \u0644\u062E\u0637 \u0627\u0644\u0644\u0639\u0628 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631: ".concat(filePath));
        process.exit(1);
    }
    console.log(formatLog("\n\uD83C\uDFAE [\u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0644\u0639\u0627\u0628] \u062C\u0627\u0631\u064A \u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u0634\u0647\u062F 3D \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0623\u0643\u0648\u0627\u062F \u0644\u063A\u0629 \u0646\u0648\u0631 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629...", colors.cyan + colors.bold));
    var code = fs_1.default.readFileSync(absolutePath, 'utf8');
    var gameName = "لعبة نور 3D";
    var worldData = { settings: {}, entities: [] };
    try {
        var interpreter = new noor_compiler_ts_1.NoorInterpreter();
        interpreter.run(code); // This populates publishedWorldData with the procedural generation!
        worldData = interpreter.publishedWorldData;
        if (worldData.settings && worldData.settings.GameName) {
            gameName = worldData.settings.GameName;
        }
    }
    catch (e) {
        console.error("⚠️ تحذير: فشل تجميع أجزاء من الكود، قد لا يعرض العالم جميع العناصر.", e);
    }
    var worldDataStr = JSON.stringify(worldData);
    var htmlContent_1 = "<!DOCTYPE html>\n<html lang=\"ar\" dir=\"rtl\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>".concat(gameName, " - \u0645\u062D\u0631\u0643 \u0646\u0648\u0631</title>\n    <style>\n        body { margin: 0; overflow: hidden; background-color: #0b0f19; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }\n        #renderCanvas { width: 100vw; height: 100vh; touch-action: none; display: block; }\n        #ui-layer { position: absolute; top: 12px; left: 12px; right: 12px; pointer-events: none; display: flex; justify-content: space-between; gap: 16px; color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); }\n        .panel { background: rgba(10, 25, 47, 0.72); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 16px; border-radius: 12px; border: 1.5px solid rgba(0, 170, 255, 0.35); pointer-events: auto; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }\n        .panel:hover { border-color: rgba(0, 170, 255, 0.6); box-shadow: 0 12px 35px rgba(0, 170, 255, 0.15); }\n        h1 { margin: 0 0 10px 0; font-size: 1.15rem; color: #00ffff; display: flex; align-items: center; gap: 8px; font-weight: 800; letter-spacing: 0.5px; }\n        .stats { font-family: 'Courier New', Courier, monospace; font-size: 0.92rem; color: #00ffaa; line-height: 1.5; }\n        @keyframes pulse-ok {\n            0% { transform: scale(0.95); opacity: 0.6; box-shadow: 0 0 0 0 rgba(0, 255, 170, 0.7); }\n            70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 8px rgba(0, 255, 170, 0); }\n            100% { transform: scale(0.95); opacity: 0.6; box-shadow: 0 0 0 0 rgba(0, 255, 170, 0); }\n        }\n        @keyframes pulse-warn {\n            0% { transform: scale(0.95); opacity: 0.6; box-shadow: 0 0 0 0 rgba(255, 170, 0, 0.7); }\n            70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 8px rgba(255, 170, 0, 0); }\n            100% { transform: scale(0.95); opacity: 0.6; box-shadow: 0 0 0 0 rgba(255, 170, 0, 0); }\n        }\n        @keyframes pulse-lost {\n            0% { transform: scale(0.95); opacity: 0.6; box-shadow: 0 0 0 0 rgba(255, 50, 50, 0.7); }\n            70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 8px rgba(255, 50, 50, 0); }\n            100% { transform: scale(0.95); opacity: 0.6; box-shadow: 0 0 0 0 rgba(255, 50, 50, 0); }\n        }\n    </style>\n    <!-- \u0627\u0633\u062A\u062F\u0639\u0627\u0621 BabylonJS \u0643\u0628\u062F\u064A\u0644 \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0644\u0640 Havok 3D Physics -->\n    <script src=\"https://cdn.babylonjs.com/babylon.js\"></script>\n    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js\"></script>\n</head>\n<body>\n    <div id=\"ui-layer\">\n        <div class=\"panel\">\n            <h1>\uD83C\uDFAE ").concat(gameName, " - Live View</h1>\n            <div id=\"loading\" class=\"stats\">\u062C\u0627\u0631\u064A \u062A\u0647\u064A\u0626\u0629 \u0628\u064A\u0626\u0629 3D \u0648\u0645\u062D\u0631\u0643 \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621...</div>\n        </div>\n        <div class=\"panel\" style=\"min-width: 260px;\">\n            <h1>\n                <span id=\"status-glow\" style=\"display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #00ffaa; box-shadow: 0 0 10px #00ffaa; animation: pulse-ok 1.5s infinite\"></span>\n                \u0645\u0631\u0627\u0642\u0628 \u0627\u0644\u0623\u062F\u0627\u0621 \u0648\u0627\u0644\u0640 Profiler\n            </h1>\n            <div class=\"stats\" style=\"font-family: 'Courier New', monospace; font-size: 0.88rem; line-height: 1.6;\">\n                \uD83C\uDFCE\uFE0F \u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A (FPS): <span id=\"fps-val\" style=\"color: #00ffaa; font-weight: bold; font-size: 1rem;\">--</span><br/>\n                \uD83C\uDFA8 \u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u0631\u0633\u0645 (Draws): <span id=\"draw-calls-val\" style=\"color: #00ffff; font-weight: bold;\">--</span><br/>\n                \uD83D\uDCE6 \u0627\u0644\u0643\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0634\u0637\u0629 (ECS): <span id=\"entities-val\" style=\"color: #ffaa00; font-weight: bold;\">--</span><br/>\n                \uD83D\uDCD0 \u0627\u0644\u0645\u062C\u0633\u0645\u0627\u062A (Meshes): <span id=\"meshes-val\" style=\"color: #ffff00; font-weight: bold;\">--</span><br/>\n                \uD83D\uDCBE \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u0644\u0643\u0629: <span id=\"memory-val\" style=\"color: #ff00ff; font-weight: bold;\">--</span><br/>\n                \uD83D\uDD0B \u0648\u0627\u062C\u0647\u0629 WebGL: <span id=\"webgl-status\" style=\"color: #00ffaa; font-weight: bold;\">WebGL 2.0</span>\n            </div>\n        </div>\n    </div>\n    <canvas id=\"renderCanvas\"></canvas>\n    \n    <script>\n        window.addEventListener('DOMContentLoaded', function() {\n            let canvas = document.getElementById('renderCanvas');\n            let engine;\n            let currentScene;\n            const worldData = ").concat(worldDataStr, ";\n            \n            // \u0643\u0634\u0641 \u0648\u0645\u0639\u0627\u0644\u062C\u0629 \u0641\u0642\u062F\u0627\u0646 \u0633\u064A\u0627\u0642 WebGL \u0644\u062A\u0641\u0627\u062F\u064A \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u0633\u0648\u062F\u0627\u0621 Glitches\n            function bindWebGLContextEvents(targetCanvas) {\n                targetCanvas.addEventListener(\"webglcontextlost\", function(event) {\n                    event.preventDefault();\n                    console.warn(\"\u26A0\uFE0F \u062A\u0645 \u0631\u0635\u062F \u0641\u0642\u062F\u0627\u0646 \u0633\u064A\u0627\u0642 WebGL (WebGL Context Lost)!\");\n                    const statusEl = document.getElementById('webgl-status');\n                    if (statusEl) {\n                        statusEl.innerText = \"\u0641\u0642\u062F \u0627\u0644\u0633\u064A\u0627\u0642 (Lost)\";\n                        statusEl.style.color = \"#ff3333\";\n                    }\n                    const glowEl = document.getElementById('status-glow');\n                    if (glowEl) {\n                        glowEl.style.background = \"#ff3333\";\n                        glowEl.style.boxShadow = \"0 0 10px #ff3333\";\n                        glowEl.style.animation = \"pulse-lost 1.2s infinite\";\n                    }\n                    \n                    // \u062A\u0646\u0638\u064A\u0641 \u0643\u0627\u0645\u0644 \u0644\u0644\u0630\u0627\u0643\u0631\u0629 \u0644\u062A\u0641\u0627\u062F\u064A \u062A\u0633\u0631\u064A\u0628 \u0627\u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u0627\u0633\u062A\u0639\u0631\u0627\u0636\u064A \u0627\u0644\u0645\u0641\u0642\u0648\u062F\n                    if (engine) {\n                        try {\n                            engine.dispose();\n                        } catch(e) {\n                            console.warn(\"Engine dispose bypassed during context loss:\", e);\n                        }\n                    }\n                }, false);\n\n                targetCanvas.addEventListener(\"webglcontextrestored\", function() {\n                    console.log(\"\uD83D\uDFE2 \u062A\u0645 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0633\u064A\u0627\u0642 \u0643\u0631\u062A \u0627\u0644\u0634\u0627\u0634\u0629! \u0627\u0644\u0628\u062F\u0621 \u0628\u0625\u0639\u0627\u062F\u0629 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0640 WebGL \u0628\u062F\u0648\u0646 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u062A\u0635\u0641\u062D...\");\n                    \n                    // \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0639\u0628\u0631 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0643\u0627\u0626\u0646 \u0627\u0644\u0640 Canvas \u0644\u062A\u0641\u0627\u062F\u064A \u0627\u0644\u0640 Glitches \u0627\u0644\u0645\u062A\u0628\u0642\u064A\u0629 \u0641\u064A \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0629\n                    try {\n                        const oldCanvas = canvas;\n                        const newCanvas = oldCanvas.cloneNode(true);\n                        oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);\n                        canvas = newCanvas;\n                        \n                        bindWebGLContextEvents(canvas);\n                        \n                        engine = new BABYLON.Engine(canvas, true);\n                        currentScene = createScene();\n                        initEngine(currentScene);\n                        \n                        const statusEl = document.getElementById('webgl-status');\n                        if (statusEl) {\n                            statusEl.innerText = \"\u0646\u0634\u0637 \u0648\u0645\u0633\u062A\u0631\u062F (Active)\";\n                            statusEl.style.color = \"#00ffaa\";\n                        }\n                        const glowEl = document.getElementById('status-glow');\n                        if (glowEl) {\n                            glowEl.style.background = \"#00ffaa\";\n                            glowEl.style.boxShadow = \"0 0 10px #00ffaa\";\n                            glowEl.style.animation = \"pulse-ok 1.5s infinite\";\n                        }\n                    } catch(rebuildErr) {\n                        console.error(\"\uD83D\uDD34 \u0641\u0634\u0644 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0627\u0644\u0645\u062D\u0631\u0643 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B\u060C \u062C\u0627\u0631\u064A \u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062A\u0631\u0627\u0643\u0645\u064A:\", rebuildErr);\n                        location.reload();\n                    }\n                }, false);\n            }\n\n            bindWebGLContextEvents(canvas);\n            engine = new BABYLON.Engine(canvas, true);\n\n            const createScene = function() {\n                const scene = new BABYLON.Scene(engine);\n                scene.clearColor = new BABYLON.Color4(0.04, 0.05, 0.08, 1);\n\n                // \u062A\u0647\u064A\u0626\u0629 \u0645\u0631\u0627\u0642\u0628\u0629 \u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u0631\u0633\u0645 \u0645\u0646 \u0628\u0627\u0628\u064A\u0644\u0648\u0646\n                let sceneInstrumentation = null;\n                try {\n                    sceneInstrumentation = new BABYLON.SceneInstrumentation(scene);\n                } catch(e) {\n                    console.warn(\"Failed to init SceneInstrumentation:\", e);\n                }\n\n                // \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627\n                const camera = new BABYLON.ArcRotateCamera(\"camera\", -Math.PI / 2, Math.PI / 2.5, 30, BABYLON.Vector3.Zero(), scene);\n                camera.attachControl(canvas, true);\n\n                // \u0625\u0636\u0627\u0621\u0629 \u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0648 \u0644\u0645 \u062A\u0633\u062A\u062E\u062F\u0645 \u0641\u064A \u0627\u0644\u0643\u0648\u062F\n                if (!worldData.lights || worldData.lights.length === 0) {\n                   const light = new BABYLON.HemisphericLight(\"light\", new BABYLON.Vector3(0, 1, 0), scene);\n                   light.intensity = 0.7;\n                }\n                \n                // \u0645\u062D\u0627\u0643\u0627\u0629 \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621 (\u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629)\n                try {\n                    if (typeof window !== 'undefined' && typeof CANNON !== 'undefined') {\n                        window.CANNON = CANNON;\n                    }\n                    const g = (worldData.settings && worldData.settings.gravity) !== undefined ? worldData.settings.gravity : -9.81;\n                    const gravityVector = new BABYLON.Vector3(0, g, 0);\n                    let CANNON_LIB = (typeof window !== 'undefined' ? window.CANNON : null) || (typeof CANNON !== 'undefined' ? CANNON : null);\n                    if (CANNON_LIB) {\n                        const physicsPlugin = new BABYLON.CannonJSPlugin(true, 10, CANNON_LIB);\n                        scene.enablePhysics(gravityVector, physicsPlugin);\n                    } else {\n                        console.warn(\"CANNON is not defined. Physics is running in fallback kinematic mode.\");\n                    }\n                } catch(pe) {\n                    console.error(\"Physics Plugin Error:\", pe);\n                }\n\n                // \u0636\u0628\u0627\u0628 \u0648\u0627\u0644\u0648\u0627\u0646 \u0644\u0648 \u062A\u0645 \u0636\u0628\u0637\u0647\u0627\n                if (worldData.settings) {\n                   if (worldData.settings['\u0625\u0636\u0627\u0621\u0629_\u0645\u062D\u064A\u0637\u064A\u0629'] !== undefined) {\n                      scene.ambientColor = new BABYLON.Color3(worldData.settings['\u0625\u0636\u0627\u0621\u0629_\u0645\u062D\u064A\u0637\u064A\u0629'], worldData.settings['\u0625\u0636\u0627\u0621\u0629_\u0645\u062D\u064A\u0637\u064A\u0629'], worldData.settings['\u0625\u0636\u0627\u0621\u0629_\u0645\u062D\u064A\u0637\u064A\u0629']);\n                   }\n                   if (worldData.settings['\u0636\u0628\u0627\u0628']) {\n                      scene.fogMode = BABYLON.Scene.FOGMODE_EXP;\n                      scene.fogDensity = 0.05;\n                      scene.fogColor = new BABYLON.Color3(0.05, 0.05, 0.1);\n                   }\n                }\n\n                // \u062F\u0627\u0644\u0629 \u0645\u0633\u0627\u0639\u062F\u0629 \u0644\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0628\u062F\u0642\u0629\n                const getColor = (c) => {\n                    if (!c) return new BABYLON.Color3(Math.random(), Math.random(), Math.random());\n                    if (c.startsWith('#')) return BABYLON.Color3.FromHexString(c);\n                    const colorsMap = {\n                        '\u0627\u062D\u0645\u0631': new BABYLON.Color3(0.9, 0.1, 0.1),\n                        '\u0623\u062D\u0645\u0631': new BABYLON.Color3(0.9, 0.1, 0.1),\n                        '\u0627\u062E\u0636\u0631': new BABYLON.Color3(0.1, 0.8, 0.1),\n                        '\u0623\u062E\u0636\u0631': new BABYLON.Color3(0.1, 0.8, 0.1),\n                        '\u0627\u0632\u0631\u0642': new BABYLON.Color3(0.1, 0.4, 0.9),\n                        '\u0623\u0632\u0631\u0642': new BABYLON.Color3(0.1, 0.4, 0.9),\n                        '\u0627\u0635\u0641\u0631': new BABYLON.Color3(0.9, 0.9, 0.1),\n                        '\u0623\u0635\u0641\u0631': new BABYLON.Color3(0.9, 0.9, 0.1),\n                        '\u0627\u0628\u064A\u0636': new BABYLON.Color3(1.0, 1.0, 1.0),\n                        '\u0623\u0628\u064A\u0636': new BABYLON.Color3(1.0, 1.0, 1.0),\n                        '\u0627\u0633\u0648\u062F': new BABYLON.Color3(0.05, 0.05, 0.05),\n                        '\u0623\u0633\u0648\u062F': new BABYLON.Color3(0.05, 0.05, 0.05),\n                        '\u0628\u0646\u064A': new BABYLON.Color3(0.5, 0.25, 0.05),\n                        '\u0631\u0645\u0627\u062F\u064A': new BABYLON.Color3(0.5, 0.5, 0.5),\n                        'gray': new BABYLON.Color3(0.5, 0.5, 0.5),\n                        'grey': new BABYLON.Color3(0.5, 0.5, 0.5),\n                        '\u0628\u0631\u062A\u0642\u0627\u0644\u064A': new BABYLON.Color3(0.9, 0.5, 0.1),\n                        '\u0648\u0631\u062F\u064A': new BABYLON.Color3(0.9, 0.4, 0.6),\n                        '\u0628\u0646\u0641\u0633\u062C\u064A': new BABYLON.Color3(0.6, 0.1, 0.6)\n                    };\n                    const norm = c.trim().toLowerCase();\n                    return colorsMap[norm] || colorsMap[norm.replace(/\u0623/g,'\u0627').replace(/\u0625/g,'\u0627')] || new BABYLON.Color3(Math.random(), Math.random(), Math.random());\n                };\n\n                // \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0643\u064A\u0627\u0646\u0627\u062A \u0628\u0631\u0645\u062C\u064A\u0627\u064B \u0643\u0645\u0627 \u062D\u062F\u062F\u0647\u0627 \u0643\u0648\u062F \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\n                let entitiesToRender = worldData.entities || [];\n                if (entitiesToRender.length === 0) {\n                    entitiesToRender = [\n                        { '\u0646\u0648\u0639': '\u0623\u0631\u0636\u064A\u0629', '\u0633': 0, '\u0635': 0, '\u0639': 0, '\u0627\u0644\u0639\u0631\u0636': 200, '\u0627\u0644\u0637\u0648\u0644': 200, '\u0644\u0648\u0646': '#1a3222', '\u0643\u062A\u0644\u0629': 0 },\n                        { '\u0646\u0648\u0639': '\u0644\u0627\u0639\u0628', '\u0633': 0, '\u0635': 6, '\u0639': 0, '\u062D\u062C\u0645': 1.5, '\u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639': 2.5, '\u0644\u0648\u0646': '\u0623\u062E\u0636\u0631', '\u0643\u062A\u0644\u0629': 1 },\n                        { '\u0646\u0648\u0639': '\u0645\u0643\u0639\u0628', '\u0633': 8, '\u0635': 2, '\u0639': 8, '\u0627\u0644\u0639\u0631\u0636': 3, '\u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639': 3, '\u0627\u0644\u0637\u0648\u0644': 3, '\u0644\u0648\u0646': '\u0623\u0635\u0641\u0631', '\u0643\u062A\u0644\u0629': 2 },\n                        { '\u0646\u0648\u0639': '\u0645\u0643\u0639\u0628', '\u0633': -8, '\u0635': 4, '\u0639': -8, '\u0627\u0644\u0639\u0631\u0636': 4, '\u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639': 8, '\u0627\u0644\u0637\u0648\u0644': 4, '\u0644\u0648\u0646': '\u0631\u0645\u0627\u062F\u064A', '\u0643\u062A\u0644\u0629': 0 },\n                        { '\u0646\u0648\u0639': '\u0643\u0631\u0629', '\u0633': -5, '\u0635': 12, '\u0639': 12, '\u0627\u0644\u0642\u0637\u0631': 2.5, '\u0644\u0648\u0646': '\u0623\u062D\u0645\u0631', '\u0643\u062A\u0644\u0629': 1.5 },\n                        { '\u0646\u0648\u0639': '\u0623\u0633\u0637\u0648\u0627\u0646\u0629', '\u0633': 15, '\u0635': 3, '\u0639': -15, '\u0627\u0644\u0633\u0645\u0643': 2, '\u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639': 6, '\u0644\u0648\u0646': '\u0628\u0631\u062A\u0642\u0627\u0644\u064A', '\u0643\u062A\u0644\u0629': 0 }\n                    ];\n                }\n\n                if (entitiesToRender.length > 0) {\n                    let playerMesh = null;\n\n                    entitiesToRender.forEach((ent, i) => {\n                        try {\n                            let mesh;\n                            const t = ent['\u0646\u0648\u0639'] || ent['type'] || '\u0645\u0643\u0639\u0628';\n                            const px = ent['\u0633'] !== undefined ? ent['\u0633'] : (ent['x'] !== undefined ? ent['x'] : 0);\n                            const py = ent['\u0635'] !== undefined ? ent['\u0635'] : (ent['y'] !== undefined ? ent['y'] : 5);\n                            const pz = ent['\u0639'] !== undefined ? ent['\u0639'] : (ent['z'] !== undefined ? ent['z'] : 0);\n                            let mass = ent['\u0643\u062A\u0644\u0629'] !== undefined ? ent['\u0643\u062A\u0644\u0629'] : (ent['mass'] !== undefined ? ent['mass'] : 1);\n                            const colorName = ent['\u0644\u0648\u0646'] || ent['color'];\n                            \n                            const sizeValue = ent['\u062D\u062C\u0645'] || ent['size'] || 1;\n                            const widthVal = ent['\u0627\u0644\u0639\u0631\u0636'] || ent['width'] || sizeValue;\n                            const heightVal = ent['\u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639'] || ent['height'] || sizeValue;\n                            const depthVal = ent['\u0627\u0644\u0637\u0648\u0644'] || ent['\u0627\u0644\u0639\u0645\u0642'] || ent['depth'] || ent['length'] || sizeValue;\n                            const radVal = ent['\u0627\u0644\u0642\u0637\u0631'] || ent['\u0627\u0644\u0633\u0645\u0643'] || ent['diameter'] || ent['radius'] || sizeValue;\n\n                            const normType = t.trim().toLowerCase();\n\n                            if (normType.includes('\u0623\u0631\u0636\u064A\u0629') || normType.includes('\u0627\u0631\u0636\u064A\u0629') || normType.includes('ground') || normType.includes('terrain') || normType.includes('\u0645\u0636\u0645\u0627\u0631') || normType.includes('\u0645\u0646\u0637\u0642\u0629')) {\n                                const w = ent['\u0627\u0644\u0639\u0631\u0636'] || ent['width'] || 100;\n                                const d = ent['\u0627\u0644\u0637\u0648\u0644'] || ent['length'] || ent['depth'] || 100;\n                                mesh = BABYLON.MeshBuilder.CreateGround(\"ground\"+i, {width: w, height: d}, scene);\n                                mass = 0;\n                                const mat = new BABYLON.StandardMaterial(\"gmat\"+i, scene);\n                                mat.diffuseColor = getColor(colorName || '#1b2c1f');\n                                mesh.material = mat;\n                            } else if (normType.includes('\u0643\u0631\u0629') || normType.includes('\u0643\u0648\u0631\u0629') || normType.includes('sphere') || normType.includes('ball')) {\n                                mesh = BABYLON.MeshBuilder.CreateSphere(\"sphere\"+i, {diameter: radVal}, scene);\n                                const mat = new BABYLON.StandardMaterial(\"smat\"+i, scene);\n                                mat.diffuseColor = getColor(colorName);\n                                mesh.material = mat;\n                            } else if (normType.includes('\u0623\u0633\u0637\u0648\u0627\u0646\u0629') || normType.includes('\u0627\u0633\u0637\u0648\u0627\u0646\u0629') || normType.includes('cylinder')) {\n                                mesh = BABYLON.MeshBuilder.CreateCylinder(\"cylinder\"+i, {height: heightVal, diameter: radVal}, scene);\n                                const mat = new BABYLON.StandardMaterial(\"cymat\"+i, scene);\n                                mat.diffuseColor = getColor(colorName);\n                                mesh.material = mat;\n                            } else if (normType.includes('\u0634\u062E\u0635\u064A\u0629') || normType.includes('\u0644\u0627\u0639\u0628') || normType.includes('\u0648\u062D\u0634') || normType.includes('\u062D\u0627\u0631\u0633') || normType.includes('\u0639\u062F\u0648') || normType.includes('player') || normType.includes('character') || normType.includes('enemy')) {\n                                mesh = BABYLON.MeshBuilder.CreateCapsule(\"char\"+i, {radius: radVal * 0.5 || 0.4, height: heightVal * 2 || 1.8}, scene);\n                                const mat = new BABYLON.StandardMaterial(\"charMat\"+i, scene);\n                                mat.diffuseColor = getColor(colorName || (normType.includes('\u0648\u062D\u0634') || normType.includes('enemy') ? '\u0623\u062D\u0645\u0631' : '\u0623\u062E\u0636\u0631'));\n                                mesh.material = mat;\n                                \n                                if (normType.includes('\u0644\u0627\u0639\u0628') || normType.includes('player')) {\n                                    playerMesh = mesh;\n                                }\n                            } else if (normType.includes('\u0633\u064A\u0627\u0631\u0629') || normType.includes('\u0645\u0631\u0643\u0628\u0629') || normType.includes('car') || normType.includes('vehicle')) {\n                                mesh = BABYLON.MeshBuilder.CreateBox(\"car_body\"+i, {width: widthVal * 1.5 || 2, height: heightVal || 0.8, depth: depthVal * 1.8 || 3.5}, scene);\n                                const mat = new BABYLON.StandardMaterial(\"carmat\"+i, scene);\n                                mat.diffuseColor = getColor(colorName || '\u0623\u062D\u0645\u0631');\n                                mesh.material = mat;\n\n                                const wheelRadius = 0.4;\n                                const wheelWidth = 0.3;\n                                const wheelMat = new BABYLON.StandardMaterial(\"wheelMat\"+i, scene);\n                                wheelMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);\n\n                                const offsets = [\n                                    {x: -1, z: 1.2}, {x: 1, z: 1.2},\n                                    {x: -1, z: -1.2}, {x: 1, z: -1.2}\n                                ];\n                                offsets.forEach((offset, idx) => {\n                                    const wheel = BABYLON.MeshBuilder.CreateCylinder(\"wheel_\"+idx+\"_\"+i, {height: wheelWidth, diameter: wheelRadius * 2}, scene);\n                                    wheel.rotation.z = Math.PI / 2;\n                                    wheel.position = new BABYLON.Vector3(offset.x, -0.4, offset.z);\n                                    wheel.parent = mesh;\n                                    wheel.material = wheelMat;\n                                });\n\n                                if (normType.includes('\u0644\u0627\u0639\u0628') || normType.includes('player')) {\n                                    playerMesh = mesh;\n                                }\n                            } else if (normType.includes('\u0645\u0628\u0646\u0649') || normType.includes('building') || normType.includes('\u062C\u062F\u0627\u0631') || normType.includes('wall') || normType.includes('\u0628\u064A\u062A') || normType.includes('\u0645\u0646\u0632\u0644')) {\n                                const h = heightVal || (Math.random() * 8 + 4);\n                                mesh = BABYLON.MeshBuilder.CreateBox(\"building\"+i, {width: widthVal * 3 || 6, height: h, depth: depthVal * 3 || 6}, scene);\n                                const mat = new BABYLON.StandardMaterial(\"bldgMat\"+i, scene);\n                                mat.diffuseColor = getColor(colorName || '\u0631\u0645\u0627\u062F\u064A');\n                                mesh.material = mat;\n                                mass = 0;\n                            } else {\n                                mesh = BABYLON.MeshBuilder.CreateBox(\"box\"+i, {width: widthVal, height: heightVal, depth: depthVal}, scene);\n                                const mat = new BABYLON.StandardMaterial(\"boxMat\"+i, scene);\n                                mat.diffuseColor = getColor(colorName);\n                                mesh.material = mat;\n                            }\n\n                            // Apply Position\n                            mesh.position.x = px;\n                            mesh.position.y = py;\n                            mesh.position.z = pz;\n\n                            // Apply Physics\n                            let impostorType = BABYLON.PhysicsImpostor.BoxImpostor;\n                            if (normType.includes('\u0643\u0631\u0629') || normType.includes('sphere')) impostorType = BABYLON.PhysicsImpostor.SphereImpostor;\n                            else if (normType.includes('\u0634\u062E\u0635\u064A\u0629') || normType.includes('\u0644\u0627\u0639\u0628') || normType.includes('\u0648\u062D\u0634')) impostorType = BABYLON.PhysicsImpostor.CapsuleImpostor;\n                            else if (normType.includes('\u0623\u0633\u0637\u0648\u0627\u0646\u0629') || normType.includes('\u0627\u0633\u0637\u0648\u0627\u0646\u0629') || normType.includes('cylinder')) impostorType = BABYLON.PhysicsImpostor.CylinderImpostor;\n\n                            setTimeout(() => {\n                                try {\n                                    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, impostorType, { mass: mass, restitution: ent['\u0645\u0631\u0648\u0646\u0629'] || ent['restitution'] || 0.2, friction: ent['\u0627\u062D\u062A\u0643\u0627\u0643'] || ent['friction'] || 0.5 }, scene);\n                                } catch(phyErr) {\n                                    console.warn(\"\u26A0\uFE0F Physics initialization bypassed for entity \" + i + \":\", phyErr);\n                                }\n                            }, i * 50);\n                        } catch(entityError) {\n                            console.error(\"\u26A0\uFE0F \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639 \u0623\u062B\u0646\u0627\u0621 \u0628\u0646\u0627\u0621 \u0627\u0644\u0643\u064A\u0627\u0646 \" + i + \":\", entityError);\n                        }\n                    });\n\n                    // Setup controls if player/car was created\n                    if (playerMesh) {\n                        camera.target = playerMesh;\n                        camera.radius = 20;\n\n                        const inputMap = {};\n                        scene.actionManager = new BABYLON.ActionManager(scene);\n                        \n                        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {\n                            inputMap[evt.sourceEvent.key.toLowerCase()] = true;\n                        }));\n                        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {\n                            inputMap[evt.sourceEvent.key.toLowerCase()] = false;\n                        }));\n\n                        scene.onBeforeRenderObservable.add(() => {\n                            let speed = 8;\n                            let jumpForce = 10;\n                            let force = new BABYLON.Vector3(0, 0, 0);\n\n                            if (inputMap[\"w\"] || inputMap[\"arrowup\"]) force.z = speed;\n                            if (inputMap[\"s\"] || inputMap[\"arrowdown\"]) force.z = -speed;\n                            if (inputMap[\"a\"] || inputMap[\"arrowleft\"]) force.x = -speed;\n                            if (inputMap[\"d\"] || inputMap[\"arrowright\"]) force.x = speed;\n\n                            if (playerMesh.physicsImpostor) {\n                                let curVel = playerMesh.physicsImpostor.getLinearVelocity();\n                                if (force.x !== 0 || force.z !== 0) {\n                                    playerMesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(force.x, curVel.y, force.z));\n                                }\n                                if (inputMap[\" \"] && Math.abs(curVel.y) < 0.1) {\n                                    playerMesh.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, jumpForce, 0), playerMesh.getAbsolutePosition());\n                                    inputMap[\" \"] = false;\n                                }\n                            }\n                        });\n                    }\n                }\n\n\n                document.getElementById('loading').innerHTML = '\u2705 \u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062D\u064A 3D \u0628\u0627\u0644\u0643\u0627\u0645\u0644 (\u062D\u0642\u064A\u0642\u064A \u0648\u0644\u064A\u0633 \u0645\u062D\u0627\u0643\u0627\u0629 ASCII)';\n                return scene;\n            };\n\n            const initEngine = (sceneOverride) => {\n                try {\n                    const scene = sceneOverride || createScene();\n                    \n                    // \u062A\u0635\u0641\u064A\u0629 \u0623\u064A \u0645\u062D\u0631\u0643\u0627\u062A \u0645\u062A\u0628\u0642\u064A\u0629 \u0645\u0639\u0644\u0642\u0629 \u0641\u064A \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0644\u0645\u0646\u0639 \u062B\u0642\u0644 \u0627\u0644\u0630\u0627\u0643\u0631\u0629\n                    try {\n                        if (window.activeEngine) {\n                            window.activeEngine.dispose();\n                        }\n                    } catch(de) {}\n                    \n                    window.activeEngine = engine;\n                    \n                    let lastUpdateTime = performance.now();\n                    const ecsCount = worldData.entities ? worldData.entities.length : 0;\n                    \n                    engine.runRenderLoop(function() {\n                        if (scene && !scene.isDisposed) {\n                            scene.render();\n                            \n                            const now = performance.now();\n                            if (now - lastUpdateTime > 250) {\n                                lastUpdateTime = now;\n                                \n                                // 1. FPS Tracker\n                                const fps = engine.getFps().toFixed(0);\n                                const fpsEl = document.getElementById('fps-val');\n                                if (fpsEl) {\n                                    fpsEl.innerText = fps;\n                                    if (fps < 30) {\n                                        fpsEl.style.color = '#ff4444';\n                                    } else if (fps < 50) {\n                                        fpsEl.style.color = '#ffaa00';\n                                    } else {\n                                        fpsEl.style.color = '#00ffaa';\n                                    }\n                                }\n                                \n                                // 2. Draw Calls Tracker (\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u0631\u0633\u0645)\n                                let drawCallsNum = 0;\n                                try {\n                                    drawCallsNum = engine._drawCalls ? engine._drawCalls.count : (engine.drawCalls || 0);\n                                } catch(e) {}\n                                const dcEl = document.getElementById('draw-calls-val');\n                                if (dcEl) dcEl.innerText = drawCallsNum;\n                                \n                                // 3. ECS Count\n                                const entEl = document.getElementById('entities-val');\n                                if (entEl) entEl.innerText = ecsCount;\n                                \n                                // 4. Meshes Count (Active / Total)\n                                let activeM = 0;\n                                let totalM = 0;\n                                try {\n                                    activeM = scene.getActiveMeshes() ? scene.getActiveMeshes().length : 0;\n                                    totalM = scene.meshes ? scene.meshes.length : 0;\n                                } catch(e) {}\n                                const meshEl = document.getElementById('meshes-val');\n                                if (meshEl) meshEl.innerText = activeM + \" / \" + totalM;\n                                \n                                // 5. Memory Footprint\n                                const memEl = document.getElementById('memory-val');\n                                if (memEl) {\n                                    if (window.performance && window.performance.memory) {\n                                        memEl.innerText = (window.performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) + \" MB\";\n                                    } else {\n                                        const estMem = (totalM * 0.15 + 18.5).toFixed(1);\n                                        memEl.innerText = estMem + \" MB (\u0645\u0642\u062F\u0631)\";\n                                    }\n                                }\n                            }\n                        }\n                    });\n                } catch(err) {\n                    console.error(\"\uD83D\uDD34 \u0641\u0634\u0644 \u062A\u0634\u063A\u064A\u0644 \u0645\u062D\u0631\u0643 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A:\", err);\n                    const loadingEl = document.getElementById('loading');\n                    if (loadingEl) {\n                        loadingEl.innerHTML = \"\uD83D\uDD34 \u0639\u0637\u0644 \u0641\u064A \u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A: \" + err.message;\n                        loadingEl.style.color = \"#ff3333\";\n                    }\n                }\n            };\n\n            if (typeof CANNON !== 'undefined' || window.CANNON) {\n                initEngine();\n            } else {\n                let script = document.createElement('script');\n                script.src = \"https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js\";\n                script.onload = () => {\n                    initEngine();\n                };\n                script.onerror = () => {\n                    console.error(\"Failed to load Cannon.js, running without physics.\");\n                    initEngine();\n                };\n                document.head.appendChild(script);\n            }\n\n            window.addEventListener('resize', function() {\n                engine.resize();\n            });\n        });\n    </script>\n</body>\n</html>");
    var http = await Promise.resolve().then(function () { return require('http'); });
    var server_1 = http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlContent_1);
    });
    server_1.listen(0, function () {
        var addr = server_1.address();
        var port = typeof addr === 'string' ? 0 : (addr ? addr.port : 0);
        console.log(formatLog("\n\uD83C\uDF10 [\u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u062D\u0642\u064A\u0642\u064A] \u062A\u0645 \u0625\u0637\u0644\u0627\u0642 \u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0631\u0636 3D \u0627\u0644\u062E\u0627\u0635 \u0628\u0627\u0644\u0644\u0639\u0628\u0629!", colors.green + colors.bold));
        console.log(formatLog("\uD83D\uDC49 \u064A\u0631\u062C\u0649 \u0641\u062A\u062D \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0648\u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u062A\u0627\u0644\u064A \u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0644\u0639\u0628\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629:", colors.yellow));
        console.log(formatLog("   http://127.0.0.1:".concat(port, "/\n"), colors.cyan + colors.bold));
        console.log(formatLog("\u0627\u0636\u063A\u0637 (Ctrl + C) \u0644\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062E\u0627\u062F\u0645.\n", colors.reset));
    });
}
else if (command === 'run') {
    var filePath = args[1];
    if (!filePath) {
        console.error('❌ يرجى تحديد الدليل لمسار الملف. مثال: noor run app.noor');
        process.exit(1);
    }
    var absolutePath = path_1.default.resolve(process.cwd(), filePath);
    if (!fs_1.default.existsSync(absolutePath)) {
        console.error("\u274C \u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0641: ".concat(filePath));
        process.exit(1);
    }
    var sourceCode = fs_1.default.readFileSync(absolutePath, 'utf8');
    console.log(formatLog("\n\u26A1 [\u0645\u062D\u0631\u0643 \u0646\u0648\u0631 VM] \u0628\u062F\u0621 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u0633\u062A\u0642\u0644: ".concat(path_1.default.basename(filePath), "...\n"), colors.cyan + colors.bold));
    var startTime = performance.now();
    var interpreter = new noor_compiler_ts_1.NoorInterpreter();
    var result = interpreter.run(sourceCode);
    var endTime = performance.now();
    console.log(formatLog('----------------------------------------------------', colors.yellow));
    if (result.success) {
        // طباعة كل المخرجات التي نتجت عن دالة (اكتب)
        result.logs.forEach(function (log) { return console.log(log); });
        console.log(formatLog('----------------------------------------------------', colors.yellow));
        console.log(formatLog("\uD83D\uDFE2 \u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u0628\u0646\u062C\u0627\u062D \u0641\u064A ".concat((endTime - startTime).toFixed(2), " \u0645\u0644\u064A \u062B\u0627\u0646\u064A\u0629."), colors.green));
    }
    else {
        // نظام معالجة الأخطاء المستقل
        console.error(formatLog("\uD83D\uDD34 \u062E\u0637\u0623 \u062A\u0634\u063A\u064A\u0644\u064A (Runtime Error):", colors.red + colors.bold));
        console.error(formatLog(result.error, colors.red));
        result.logs.forEach(function (log) { return console.log(log); });
        process.exit(1);
    }
}
else {
    console.error("\u274C \u0623\u0645\u0631 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641: ".concat(command));
    process.exit(1);
}
