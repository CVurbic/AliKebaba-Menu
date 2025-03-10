// languages.ts
export type LanguageCode = 'hr' | 'en' | 'de' | 'tr' | string; 

export const availableLanguages = [
  { code: 'hr', name: 'Hrvatski', source: true }, // HR kao izvorni jezik
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'tr', name: 'Türkçe' }
] as const;


export type Language = typeof availableLanguages[number]['code'];
export type LanguageConfig = typeof availableLanguages[number];

export const translations: Record<Language, Record<string, string>> = {
  hr: {
    // Menu categories
    STEAK: 'STEAK',
    CLASSIC: 'CLASSIC',
    CHICKEN: 'CHICKEN',
    MIX: 'MIX',
    NUGGETS: 'NUGGETS',
    VEGE: 'VEGE',
    PRILOZI: 'PRILOZI',
    DESERT: 'DESERT',
    NAPITCI: 'NAPITCI',
    
    // UI elements
    loading: 'Učitavanje...',
    menuOffer: 'MENU PONUDA',
    sweetPotatoOption: 'Opcija Batat krumpiriči umjesto pommesa',
    drinkOfChoice: 'Piće po izboru',
    allRightsReserved: 'Sva prava pridržana.',
    
    // Sizes
    Regular: 'Regular',
    Veliki: 'Veliki',
    Mali: 'Mali',

    //footer
    address: 'Trg Josipa Langa 7, Zagreb',
    workingHoursPonUto: 'Pon-Uto: 09-01h',
    workingHoursSriCet: 'Sri-Čet: 09-02h',
    workingHoursPetSub: 'Pet-Sub: 09-04h',
    workingHoursNed: 'Ned: 10-01h'
  },
  en: {
    // Menu categories
    STEAK: 'STEAK',
    CLASSIC: 'CLASSIC',
    CHICKEN: 'CHICKEN',
    MIX: 'MIX',
    NUGGETS: 'NUGGETS',
    VEGE: 'VEGETARIAN',
    PRILOZI: 'SIDES',
    DESERT: 'DESSERT',
    NAPITCI: 'DRINKS',
    
    // UI elements
    loading: 'Loading...',
    menuOffer: 'MENU OFFER',
    sweetPotatoOption: 'Sweet potato fries instead of regular fries',
    drinkOfChoice: 'Drink of your choice',
    allRightsReserved: 'All rights reserved.',
    
    // Sizes
    Regular: 'Regular',
    Veliki: 'Large',
    Mali: 'Small',

    //footer
    address: 'Josip Lang Square 7, Zagreb',
    workingHoursPonUto: 'Mon-Tue: 09-01h',
    workingHoursSriCet: 'Wed-Thu: 09-02h',
    workingHoursPetSub: 'Fri-Sat: 09-04h',
    workingHoursNed: 'Sun: 10-01h'
  },
  de: {
    // Menu categories
    STEAK: 'STEAK',
    CLASSIC: 'KLASSISCH',
    CHICKEN: 'HÄHNCHEN',
    MIX: 'MIX',
    NUGGETS: 'NUGGETS',
    VEGE: 'VEGETARISCH',
    PRILOZI: 'BEILAGEN',
    DESERT: 'NACHTISCH',
    NAPITCI: 'GETRÄNKE',
    
    // UI elements
    loading: 'Wird geladen...',
    menuOffer: 'MENÜANGEBOT',
    sweetPotatoOption: 'Süßkartoffelpommes statt normaler Pommes',
    drinkOfChoice: 'Getränk nach Wahl',
    allRightsReserved: 'Alle Rechte vorbehalten.',
    
    // Sizes
    Regular: 'Regular',
    Veliki: 'Groß',
    Mali: 'Klein',

    //footer
    address: 'Josip Lang Platz 7, Zagreb',
    workingHoursPonUto: 'Mo-Di: 09-01h',
    workingHoursSriCet: 'Mi-Do: 09-02h',
    workingHoursPetSub: 'Fr-Sa: 09-04h',
    workingHoursNed: 'So: 10-01h'
  },
  tr: {
    // Menu categories
    STEAK: 'ŞİŞ',
    CLASSIC: 'KLASİK',
    CHICKEN: 'TAVUK',
    MIX: 'KARIŞIK',
    NUGGETS: 'NUGGET',
    VEGE: 'VEGETARYEN',
    PRILOZI: 'YAN ÜRÜNLER',
    DESERT: 'TATLI',
    NAPITCI: 'İÇECEKLER',
    
    // UI elements
    loading: 'Yükleniyor...',
    menuOffer: 'MENÜ TEKLİFİ',
    sweetPotatoOption: 'Normal patates kızartması yerine tatlı patates kızartması',
    drinkOfChoice: 'Seçilen İçecek',
    allRightsReserved: 'Tüm hakları saklıdır.',
    
    // Sizes
    Regular: 'Regular',
    Veliki: 'Büyük',
    Mali: 'Küçük',

    //footer
    address: 'Josip Lang Meydanı 7, Zagreb',
    workingHoursPonUto: 'Pzt-Sal: 09-01',
    workingHoursSriCet: 'Çar-Per: 09-02',
    workingHoursPetSub: 'Cum-Cmt: 09-04',
    workingHoursNed: 'Pazar: 10-01'
}
};