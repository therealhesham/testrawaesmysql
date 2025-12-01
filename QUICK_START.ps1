# Quick Start Script for Complaints System (PowerShell)
# نص سريع لتشغيل نظام الشكاوى

Write-Host "🚀 بدء تثبيت نظام إدارة الشكاوى..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Apply database changes
Write-Host "📊 الخطوة 1/3: تطبيق التغييرات على قاعدة البيانات..." -ForegroundColor Blue
npx prisma db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ تم تطبيق التغييرات على قاعدة البيانات بنجاح" -ForegroundColor Green
} else {
    Write-Host "❌ فشل في تطبيق التغييرات على قاعدة البيانات" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Add permissions
Write-Host "🔐 الخطوة 2/3: إضافة الصلاحيات..." -ForegroundColor Blue
node scripts/add-complaints-permissions.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ تم إضافة الصلاحيات بنجاح" -ForegroundColor Green
} else {
    Write-Host "❌ فشل في إضافة الصلاحيات" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Restart application
Write-Host "🔄 الخطوة 3/3: إعادة تشغيل التطبيق..." -ForegroundColor Blue
Write-Host "⚠️  يرجى إعادة تشغيل التطبيق يدوياً:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Green -NoNewline
Write-Host "  (للتطوير)"
Write-Host "   npm run build && npm start" -ForegroundColor Green -NoNewline
Write-Host "  (للإنتاج)"

Write-Host ""
Write-Host "✨ تم الانتهاء من التثبيت بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 الوصول السريع:" -ForegroundColor Blue
Write-Host "   👤 للمستخدمين: " -NoNewline
Write-Host "/admin/personal_page" -ForegroundColor Yellow -NoNewline
Write-Host " → تبويب 'الشكاوى'"
Write-Host "   👨‍💻 لفريق IT: " -NoNewline
Write-Host "/admin/complaints" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 التوثيق:" -ForegroundColor Blue
Write-Host "   📖 " -NoNewline
Write-Host "README_COMPLAINTS.md" -ForegroundColor Yellow -NoNewline
Write-Host " - البدء السريع"
Write-Host "   📋 " -NoNewline
Write-Host "COMPLAINTS_SYSTEM_README.md" -ForegroundColor Yellow -NoNewline
Write-Host " - دليل شامل"
Write-Host "   🚀 " -NoNewline
Write-Host "DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow -NoNewline
Write-Host " - دليل النشر"
Write-Host "   💡 " -NoNewline
Write-Host "EXAMPLES.md" -ForegroundColor Yellow -NoNewline
Write-Host " - أمثلة الاستخدام"
Write-Host ""
Write-Host "🎉 مبروك! نظام الشكاوى جاهز للاستخدام!" -ForegroundColor Green

