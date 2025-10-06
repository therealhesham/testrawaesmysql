// Translation utility for notifications and messages
export const translations = {
  // Success messages
  success: {
    orderAccepted: 'تم قبول الطلب',
    orderRejected: 'تم رفض الطلب', 
    orderRestored: 'تم استعادة الطلب',
    orderAdded: 'تم إضافة الطلب بنجاح',
    orderUpdated: 'تم تحديث الطلب بنجاح',
    orderDeleted: 'تم حذف الطلب بنجاح',
    dataSaved: 'تم تسجيل البيانات بنجاح',
    homemaidAdded: 'تم إضافة العاملة بنجاح',
    homemaidUpdated: 'تم تحديث العاملة بنجاح',
    homemaidDeleted: 'تم حذف العاملة بنجاح',
    clientAdded: 'تم إضافة العميل بنجاح',
    clientUpdated: 'تم تحديث العميل بنجاح',
    clientDeleted: 'تم حذف العميل بنجاح',
    transactionAdded: 'تم إضافة المعاملة بنجاح',
    transactionUpdated: 'تم تحديث المعاملة بنجاح',
    transactionDeleted: 'تم حذف المعاملة بنجاح',
    fileUploaded: 'تم رفع الملف بنجاح',
    settingsUpdated: 'تم تحديث الإعدادات بنجاح',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
  },
  
  // Error messages
  error: {
    generalError: 'حدث خطأ غير متوقع',
    networkError: 'خطأ في الاتصال بالشبكة',
    serverError: 'خطأ في الخادم',
    validationError: 'خطأ في التحقق من البيانات',
    permissionDenied: 'ليس لديك صلاحية للقيام بهذا الإجراء',
    orderNotFound: 'الطلب غير موجود',
    homemaidNotFound: 'العاملة غير موجودة',
    clientNotFound: 'العميل غير موجود',
    transactionNotFound: 'المعاملة غير موجودة',
    fileUploadError: 'خطأ في رفع الملف',
    dataLoadError: 'خطأ في تحميل البيانات',
    saveError: 'خطأ في حفظ البيانات',
    deleteError: 'خطأ في حذف البيانات',
    updateError: 'خطأ في تحديث البيانات',
    loginError: 'خطأ في تسجيل الدخول',
    authenticationError: 'خطأ في المصادقة',
    authorizationError: 'خطأ في التفويض',
  },
  
  // Warning messages
  warning: {
    confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
    confirmAction: 'هل أنت متأكد من تنفيذ هذا الإجراء؟',
    unsavedChanges: 'لديك تغييرات غير محفوظة',
    sessionExpired: 'انتهت صلاحية الجلسة',
    dataOutdated: 'البيانات قديمة، يرجى التحديث',
  },
  
  // Info messages
  info: {
    loading: 'جارٍ التحميل...',
    saving: 'جارٍ الحفظ...',
    processing: 'جارٍ المعالجة...',
    uploading: 'جارٍ الرفع...',
    downloading: 'جارٍ التحميل...',
    noData: 'لا توجد بيانات',
    noResults: 'لا توجد نتائج',
    searchResults: 'نتائج البحث',
    totalRecords: 'إجمالي السجلات',
    pageOf: 'صفحة من',
  },
  
  // Form validation messages
  validation: {
    required: 'هذا الحقل مطلوب',
    email: 'يرجى إدخال بريد إلكتروني صحيح',
    phone: 'يرجى إدخال رقم هاتف صحيح',
    number: 'يرجى إدخال رقم صحيح',
    minLength: 'يجب أن يكون النص أطول من',
    maxLength: 'يجب أن يكون النص أقصر من',
    passwordMatch: 'كلمات المرور غير متطابقة',
    fileSize: 'حجم الملف كبير جداً',
    fileType: 'نوع الملف غير مدعوم',
  },
  
  // Status messages
  status: {
    pending: 'قيد الانتظار',
    approved: 'موافق عليه',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    active: 'نشط',
    inactive: 'غير نشط',
    processing: 'قيد المعالجة',
    draft: 'مسودة',
    published: 'منشور',
  }
};

// Helper function to get translated message
export const getTranslation = (category: keyof typeof translations, key: string): string => {
  return translations[category][key as keyof typeof translations[typeof category]] || key;
};

// Helper function for success messages
export const getSuccessMessage = (key: keyof typeof translations.success): string => {
  return translations.success[key];
};

// Helper function for error messages  
export const getErrorMessage = (key: keyof typeof translations.error): string => {
  return translations.error[key];
};

// Helper function for warning messages
export const getWarningMessage = (key: keyof typeof translations.warning): string => {
  return translations.warning[key];
};

// Helper function for info messages
export const getInfoMessage = (key: keyof typeof translations.info): string => {
  return translations.info[key];
};

// Helper function for validation messages
export const getValidationMessage = (key: keyof typeof translations.validation): string => {
  return translations.validation[key];
};

// Helper function for status messages
export const getStatusMessage = (key: keyof typeof translations.status): string => {
  return translations.status[key];
};
