#!/bin/bash

# Quick Start Script for Complaints System
# نص سريع لتشغيل نظام الشكاوى

echo "🚀 بدء تثبيت نظام إدارة الشكاوى..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Apply database changes
echo -e "${BLUE}📊 الخطوة 1/3: تطبيق التغييرات على قاعدة البيانات...${NC}"
npx prisma db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم تطبيق التغييرات على قاعدة البيانات بنجاح${NC}"
else
    echo -e "${RED}❌ فشل في تطبيق التغييرات على قاعدة البيانات${NC}"
    exit 1
fi

echo ""

# Step 2: Add permissions
echo -e "${BLUE}🔐 الخطوة 2/3: إضافة الصلاحيات...${NC}"
node scripts/add-complaints-permissions.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم إضافة الصلاحيات بنجاح${NC}"
else
    echo -e "${RED}❌ فشل في إضافة الصلاحيات${NC}"
    exit 1
fi

echo ""

# Step 3: Restart application
echo -e "${BLUE}🔄 الخطوة 3/3: إعادة تشغيل التطبيق...${NC}"
echo -e "${YELLOW}⚠️  يرجى إعادة تشغيل التطبيق يدوياً:${NC}"
echo -e "   ${GREEN}npm run dev${NC}  (للتطوير)"
echo -e "   ${GREEN}npm run build && npm start${NC}  (للإنتاج)"

echo ""
echo -e "${GREEN}✨ تم الانتهاء من التثبيت بنجاح!${NC}"
echo ""
echo -e "${BLUE}📱 الوصول السريع:${NC}"
echo -e "   👤 للمستخدمين: ${YELLOW}/admin/personal_page${NC} → تبويب 'الشكاوى'"
echo -e "   👨‍💻 لفريق IT: ${YELLOW}/admin/complaints${NC}"
echo ""
echo -e "${BLUE}📚 التوثيق:${NC}"
echo -e "   📖 ${YELLOW}README_COMPLAINTS.md${NC} - البدء السريع"
echo -e "   📋 ${YELLOW}COMPLAINTS_SYSTEM_README.md${NC} - دليل شامل"
echo -e "   🚀 ${YELLOW}DEPLOYMENT_GUIDE.md${NC} - دليل النشر"
echo -e "   💡 ${YELLOW}EXAMPLES.md${NC} - أمثلة الاستخدام"
echo ""
echo -e "${GREEN}🎉 مبروك! نظام الشكاوى جاهز للاستخدام!${NC}"

