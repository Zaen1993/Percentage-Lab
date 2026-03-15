const translations = {
    ar: {
        start: 'ابدأ',
        select: 'اختر',
        percentage: 'النسبة المئوية',
        success: 'نجاح'
    },
    en: {
        start: 'Start',
        select: 'Select',
        percentage: 'Percentage',
        success: 'Success'
    }
};

let currentLanguage = 'ar';

const setLanguage = (lang = 'ar') => {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
};

const getCurrentLanguage = () => currentLanguage;

export { translations, setLanguage, getCurrentLanguage };
