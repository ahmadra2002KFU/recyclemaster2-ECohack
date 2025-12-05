import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App Header
    'app.title': 'RecycleMaster',
    
    // Bottom Navigation
    'nav.aiAssistant': 'AI Assistant',
    'nav.manageDevice': 'Manage Device',
    'nav.analytics': 'Analytics',
    'nav.profile': 'Profile',
    
    // Manage Device Page
    'device.status': 'Device Status',
    'device.controls': 'Controls',
    'device.shredder': 'Shredder',
    'device.melter': 'Melter',
    'device.extruder': 'Extruder',
    'device.fan': 'Fan',
    'device.temperature': 'Melting Temperature',
    'device.shredderSpeed': 'Shredder Speed',
    'device.extrusionSpeed': 'Extrusion Speed',
    'device.pullingSpeed': 'Pulling Speed',
    'device.fanSpeed': 'Fan Speed',
    'device.startProcess': 'START PROCESS',
    'device.stopProcess': 'STOP PROCESS',
    'device.thermalControls': 'Thermal Controls',
    'device.mechanicalControls': 'Mechanical Controls',
    'device.outputControl': 'Output Control',
    'device.diameter': 'Filament Diameter',
    'device.targetDiameter': 'Target Diameter',
    'device.currentDiameter': 'Current Diameter',
    'device.powerUsage': 'Power Usage',
    'device.liveMetrics': 'Live Metrics',
    'device.recording': 'REC',
    'device.inTolerance': 'In Tolerance',
    'device.outOfTolerance': 'Out of Tolerance',
    
    // AI Assistant Page
    'ai.deviceControl': 'Device Control',
    'ai.aiSupport': 'AI Support',
    'ai.describeMaterial': 'Describe the material (e.g., \'clear plastic water bottle\', \'old PLA 3D print\')',
    'ai.addImage': 'Add Image',
    'ai.changeImage': 'Change Image',
    'ai.getAiSettings': 'Get AI Settings',
    'ai.analyzing': 'Analyzing...',
    'ai.suggestedSettings': 'Suggested Settings:',
    'ai.temperature': 'Temperature',
    'ai.shredderSpeed': 'Shredder Speed',
    'ai.extrusionSpeed': 'Extrusion Speed',
    'ai.pullingSpeed': 'Pulling Speed',
    'ai.applyToDevice': 'Apply to Device',
    'ai.startConversation': 'Start Conversation',
    'ai.endConversation': 'End Conversation',
    'ai.connecting': 'Connecting...',
    'ai.connectionFailed': 'Connection failed. Please check permissions and try again.',
    'ai.retry': 'Retry',
    'ai.errorProvideInput': 'Please provide a description or an image of the material.',
    
    // Profile Page
    'profile.recyclingEnthusiast': 'Recycling Enthusiast',
    'profile.tapToSetName': 'Tap to set your name',
    'profile.enterName': 'Enter your name',
    'profile.clickToEdit': 'Click to edit',
    'profile.save': 'Save',
    'profile.cancel': 'Cancel',
    'profile.statistics': 'Statistics',
    'profile.materialRecycled': 'Material Recycled',
    'profile.hoursActive': 'Hours Active',
    'profile.settings': 'Settings',
    'profile.logout': 'Logout',
    'profile.theme': 'Theme',
    'profile.language': 'Language',
    'profile.lightMode': 'Light Mode',
    'profile.darkMode': 'Dark Mode',
    'profile.english': 'English',
    'profile.arabic': 'Arabic',

    // Analytics Page
    'analytics.title': 'Analytics',
    'analytics.diameterVsTemp': 'Diameter vs Temperature',
    'analytics.diameterVsSpeed': 'Diameter vs Speed',
    'analytics.lastHour': '1h',
    'analytics.last6Hours': '6h',
    'analytics.last24Hours': '24h',
    'analytics.last7Days': '7d',
    'analytics.avgDiameter': 'Avg Diameter',
    'analytics.avgTemp': 'Avg Temperature',
    'analytics.avgPower': 'Avg Power',
    'analytics.dataPoints': 'Data Points',
    'analytics.totalReadings': 'Total Readings in Database',
    'analytics.loading': 'Loading analytics data...',
    'analytics.noData': 'No data available',
    'analytics.noDataHint': 'Start the device to begin recording data',
  },
  ar: {
    // App Header
    'app.title': 'ماستر إعادة التدوير',
    
    // Bottom Navigation
    'nav.aiAssistant': 'المساعد الذكي',
    'nav.manageDevice': 'إدارة الجهاز',
    'nav.analytics': 'التحليلات',
    'nav.profile': 'الملف الشخصي',
    
    // Manage Device Page
    'device.status': 'حالة الجهاز',
    'device.controls': 'التحكم',
    'device.shredder': 'المفرمة',
    'device.melter': 'المذيب',
    'device.extruder': 'البثق',
    'device.fan': 'المروحة',
    'device.temperature': 'درجة حرارة الذوبان',
    'device.shredderSpeed': 'سرعة المفرمة',
    'device.extrusionSpeed': 'سرعة البثق',
    'device.pullingSpeed': 'سرعة السحب',
    'device.fanSpeed': 'سرعة المروحة',
    'device.startProcess': 'بدء العملية',
    'device.stopProcess': 'إيقاف العملية',
    'device.thermalControls': 'التحكم الحراري',
    'device.mechanicalControls': 'التحكم الميكانيكي',
    'device.outputControl': 'التحكم بالمخرجات',
    'device.diameter': 'قطر الفتيل',
    'device.targetDiameter': 'القطر المستهدف',
    'device.currentDiameter': 'القطر الحالي',
    'device.powerUsage': 'استهلاك الطاقة',
    'device.liveMetrics': 'القياسات المباشرة',
    'device.recording': 'تسجيل',
    'device.inTolerance': 'ضمن التسامح',
    'device.outOfTolerance': 'خارج التسامح',
    
    // AI Assistant Page
    'ai.deviceControl': 'التحكم بالجهاز',
    'ai.aiSupport': 'الدعم الذكي',
    'ai.describeMaterial': 'صف المادة (مثال: \'زجاجة ماء بلاستيكية شفافة\', \'طباعة ثلاثية الأبعاد قديمة\')',
    'ai.addImage': 'إضافة صورة',
    'ai.changeImage': 'تغيير الصورة',
    'ai.getAiSettings': 'الحصول على إعدادات الذكاء الاصطناعي',
    'ai.analyzing': 'جاري التحليل...',
    'ai.suggestedSettings': 'الإعدادات المقترحة:',
    'ai.temperature': 'درجة الحرارة',
    'ai.shredderSpeed': 'سرعة المفرمة',
    'ai.extrusionSpeed': 'سرعة البثق',
    'ai.pullingSpeed': 'سرعة السحب',
    'ai.applyToDevice': 'تطبيق على الجهاز',
    'ai.startConversation': 'بدء المحادثة',
    'ai.endConversation': 'إنهاء المحادثة',
    'ai.connecting': 'جاري الاتصال...',
    'ai.connectionFailed': 'فشل الاتصال. يرجى التحقق من الأذونات والمحاولة مرة أخرى.',
    'ai.retry': 'إعادة المحاولة',
    'ai.errorProvideInput': 'يرجى تقديم وصف أو صورة للمادة.',
    
    // Profile Page
    'profile.recyclingEnthusiast': 'عاشق إعادة التدوير',
    'profile.tapToSetName': 'انقر لتعيين اسمك',
    'profile.enterName': 'أدخل اسمك',
    'profile.clickToEdit': 'انقر للتعديل',
    'profile.save': 'حفظ',
    'profile.cancel': 'إلغاء',
    'profile.statistics': 'الإحصائيات',
    'profile.materialRecycled': 'المواد المعاد تدويرها',
    'profile.hoursActive': 'ساعات النشاط',
    'profile.settings': 'الإعدادات',
    'profile.logout': 'تسجيل الخروج',
    'profile.theme': 'المظهر',
    'profile.language': 'اللغة',
    'profile.lightMode': 'الوضع الفاتح',
    'profile.darkMode': 'الوضع الداكن',
    'profile.english': 'الإنجليزية',
    'profile.arabic': 'العربية',

    // Analytics Page
    'analytics.title': 'التحليلات',
    'analytics.diameterVsTemp': 'القطر مقابل الحرارة',
    'analytics.diameterVsSpeed': 'القطر مقابل السرعة',
    'analytics.lastHour': '١س',
    'analytics.last6Hours': '٦س',
    'analytics.last24Hours': '٢٤س',
    'analytics.last7Days': '٧ي',
    'analytics.avgDiameter': 'متوسط القطر',
    'analytics.avgTemp': 'متوسط الحرارة',
    'analytics.avgPower': 'متوسط الطاقة',
    'analytics.dataPoints': 'نقاط البيانات',
    'analytics.totalReadings': 'إجمالي القراءات في قاعدة البيانات',
    'analytics.loading': 'جاري تحميل بيانات التحليلات...',
    'analytics.noData': 'لا توجد بيانات متاحة',
    'analytics.noDataHint': 'ابدأ تشغيل الجهاز لبدء تسجيل البيانات',
  },
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    return savedLang || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    // Update document attributes for RTL support
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

