@echo off
chcp 65001 >nul
echo ==========================================================
echo 🌟 جاري تثبيت أداة أسطر الأوامر للغة نور (Windows CLI) 🌟
echo ==========================================================

WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [خطأ] Node.js غير مثبت. يرجى تثبيته أولا.
    exit /b 1
)

echo ✅ بيئة Node جاهزة للاستخدام.
echo ⚙️ جاري إنشاء اختصار (noor.bat) وتشغيله كأمر نظام...

set INSTALL_DIR=%CD%
echo @echo off > noor.bat
echo npx tsx "%INSTALL_DIR%\noor-cli.ts" %%* >> noor.bat

setx PATH "%PATH%;%INSTALL_DIR%"

echo ----------------------------------------------------------
echo 🎉 تم التثبيت بنجاح على نظام ويندوز!
echo افتح نافذة Command Prompt جديدة واكتب:
echo noor run file.noor
echo ==========================================================
pause
