# Localization Implementation Guide

## Overview
This document provides a comprehensive guide for implementing notification translations across all admin pages in the application.

## Translation Utility

A centralized translation utility has been created at `utils/translations.ts` that contains all notification messages organized by category:

### Categories:
- **Success Messages**: Order operations, data operations, user actions
- **Error Messages**: General errors, validation errors, permission errors
- **Warning Messages**: Confirmation dialogs, session warnings
- **Info Messages**: Loading states, status information
- **Validation Messages**: Form validation errors
- **Status Messages**: Order statuses, user statuses

## Implementation Steps

### 1. Import Translation Functions
Add the necessary imports to each page:

```typescript
import { getSuccessMessage, getErrorMessage, getWarningMessage, getInfoMessage } from 'utils/translations';
```

### 2. Replace Hardcoded Messages
Replace all hardcoded Arabic notification messages with translation function calls:

**Before:**
```typescript
setModalMessage('تم قبول الطلب');
setModalMessage('حدث خطأ أثناء حفظ البيانات');
```

**After:**
```typescript
setModalMessage(getSuccessMessage('orderAccepted'));
setModalMessage(getErrorMessage('saveError'));
```

### 3. Common Message Replacements

#### Success Messages:
- `'تم قبول الطلب'` → `getSuccessMessage('orderAccepted')`
- `'تم رفض الطلب'` → `getSuccessMessage('orderRejected')`
- `'تم إضافة الطلب بنجاح'` → `getSuccessMessage('orderAdded')`
- `'تم تسجيل البيانات بنجاح'` → `getSuccessMessage('dataSaved')`
- `'تم إضافة العاملة بنجاح'` → `getSuccessMessage('homemaidAdded')`

#### Error Messages:
- `'حدث خطأ أثناء حفظ البيانات'` → `getErrorMessage('saveError')`
- `'خطأ في تحميل البيانات'` → `getErrorMessage('dataLoadError')`
- `'ليس لديك صلاحية للقيام بهذا الإجراء'` → `getErrorMessage('permissionDenied')`

#### Info Messages:
- `'جارٍ التحميل...'` → `getInfoMessage('loading')`
- `'جارٍ الحفظ...'` → `getInfoMessage('saving')`
- `'لا توجد بيانات'` → `getInfoMessage('noData')`

## Files That Need Translation Updates

### High Priority (Most Used):
1. `pages/admin/neworders.tsx` ✅ (Example implemented)
2. `pages/admin/rejectedorders.tsx`
3. `pages/admin/currentorders.tsx`
4. `pages/admin/endedorders.tsx`
5. `pages/admin/home.tsx`

### Medium Priority:
6. `pages/admin/track_order/[id].tsx`
7. `pages/admin/newhomemaids.tsx`
8. `pages/admin/currentorderstest.tsx`
9. `pages/admin/transfersponsorship.tsx`
10. `pages/admin/arrivals.tsx`
11. `pages/admin/deparatures.tsx`
12. `pages/admin/deparaturesfromsaudi.tsx`

### Lower Priority:
13. All other admin pages in the `pages/admin/` directory

## Implementation Pattern

For each file, follow this pattern:

1. **Add imports** at the top of the file
2. **Search for notification patterns** using regex: `setModalMessage.*['"](.*?)['"]`
3. **Replace each hardcoded message** with appropriate translation function
4. **Test the functionality** to ensure messages display correctly

## Example Implementation

```typescript
// Before
const handleSubmit = async () => {
  try {
    await axios.post('/api/orders', data);
    setModalMessage('تم إضافة الطلب بنجاح');
    setShowSuccessModal(true);
  } catch (error) {
    setModalMessage('حدث خطأ أثناء إضافة الطلب');
    setShowErrorModal(true);
  }
};

// After
import { getSuccessMessage, getErrorMessage } from 'utils/translations';

const handleSubmit = async () => {
  try {
    await axios.post('/api/orders', data);
    setModalMessage(getSuccessMessage('orderAdded'));
    setShowSuccessModal(true);
  } catch (error) {
    setModalMessage(getErrorMessage('saveError'));
    setShowErrorModal(true);
  }
};
```

## Benefits

1. **Centralized Management**: All messages in one place
2. **Consistency**: Uniform messaging across the application
3. **Maintainability**: Easy to update messages
4. **Scalability**: Easy to add new languages in the future
5. **Type Safety**: TypeScript support for message keys

## Future Enhancements

1. **Multi-language Support**: Add English translations
2. **Dynamic Loading**: Load translations based on user preference
3. **Context-aware Messages**: Different messages based on user role
4. **Message Templates**: Support for dynamic content in messages

## Testing

After implementing translations:

1. **Test all notification scenarios** in each page
2. **Verify message consistency** across similar operations
3. **Check for any missed hardcoded messages**
4. **Ensure proper error handling** for missing translation keys

## Notes

- The translation utility provides fallback to the key name if translation is missing
- All existing functionality remains unchanged
- This is a non-breaking change that improves code maintainability
- Consider adding unit tests for translation functions
