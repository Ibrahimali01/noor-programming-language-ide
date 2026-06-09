#!/bin/bash

# أداة التثبيت المستقلة للغة نور على أنظمة لينكس، ماك، وتطبيق Termux
# Noor Language Quick Installer for Unix-based systems

echo "=========================================================="
echo "🌟 جاري تثبيت محرك لغة نور البرمجية المستقلة (Noor VM)... 🌟"
echo "=========================================================="

# 1. التحقق من توافر Node.js لتشغيل المترجم
if ! command -v node >/dev/null 2>&1; then
    echo "⚠️  [Node.js] غير مثبت على النظام. يرجى تثبيته لتشغيل المحرك الأساسي."
    exit 1
fi

echo "✅ تم العثور على بيئة التشغيل الأساسية."

# 2. إنشاء الاختصارات (Aliases) في سطر الأوامر لتصبح اللغة جزءاً من النظام
INSTALL_DIR=$(pwd)
NOOR_BIN="tsx $INSTALL_DIR/noor-cli.ts"

if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    BASHRC_FILE="$HOME/.bashrc"
    ZSHRC_FILE="$HOME/.zshrc"
    
    echo "alias noor='$NOOR_BIN'" >> "$BASHRC_FILE"
    if [ -f "$ZSHRC_FILE" ]; then
        echo "alias noor='$NOOR_BIN'" >> "$ZSHRC_FILE"
    fi
    
    echo "⚙️ تم حقن أمر 'noor' في سطر الأوامر (Terminal)."
elif [[ "$OSTYPE" == "linux-android"* ]]; then
    # دعم تطبيق Termux
    echo "alias noor='$NOOR_BIN'" >> "$HOME/.bashrc"
    echo "📱 تم التعرف على بيئة Termux (أندرويد) وتثبيت أداة Noor."
fi

echo "----------------------------------------------------------"
echo "🎉 اكتمل التثبيت بنجاح!"
echo "يمكنك الآن فتح سطر أوامر جديد وكتابة الأمر:"
echo "noor run <ملف.noor>"
echo "أو:"
echo "noor package install <اسم_المكتبة>"
echo "=========================================================="
