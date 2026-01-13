// languages.ts
export type LanguageCode = "hr" | "en" | "de" | "tr" | string;

export const availableLanguages = [
  { code: "hr", name: "Hrvatski", source: true }, // HR kao izvorni jezik
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "tr", name: "Türkçe" },
] as const;

export type Language = (typeof availableLanguages)[number]["code"];
export type LanguageConfig = (typeof availableLanguages)[number];

export const translations: Record<Language, Record<string, string>> = {
  hr: {
    // Menu categories
    STEAK: "STEAK",
    CLASSIC: "CLASSIC",
    CHICKEN: "CHICKEN",
    MIX: "MIX",
    NUGGETS: "NUGGETS",
    VEGE: "VEGE",
    PRILOZI: "PRILOZI",
    DESERT: "DESERT",
    NAPITCI: "NAPITCI",

    // UI elements
    loading: "Učitavanje...",
    menuOffer: "MENU PONUDA",
    sweetPotatoOption: "Opcija Batat krumpiriči umjesto pommesa",
    drinkOfChoice: "Piće po izboru",
    allRightsReserved: "Sva prava pridržana.",

    // Common buttons/labels
    adminPanel: "Admin panel",
    login: "Prijava",

    // “items” plural forms
    items_one: "stavka",
    items_few: "stavke",
    items_many: "stavki",
    items_other: "stavki",

    // Notes
    steakWeekendOnly: "Dostupno samo vikendom (petak, subota) - Langov trg",

    // Sizes
    Regular: "Regular",
    Veliki: "Veliki",
    Mali: "Mali",

    // MenuInstructions
    chooseCategory: "Odaberi kategoriju",

    // footer
    address: "Trg Josipa Langa 7, Zagreb",
    workingHoursPonUto: "Pon-Uto: 09-01h",
    workingHoursSriCet: "Sri-Čet: 09-02h",
    workingHoursPetSub: "Pet-Sub: 09-04h",
    workingHoursNed: "Ned: 10-01h",
    monday: "Ponedjeljak",
    tuesday: "Utorak",
    wednesday: "Srijeda",
    thursday: "Četvrtak",
    friday: "Petak",
    saturday: "Subota",
    sunday: "Nedjelja",
    ourLocations: "Naše lokacije",
    currentLocation: "Trenutna lokacija",
    selectLocation: "Odaberite lokaciju",
    viewAllLocations: "Prikaži sve lokacije",
    hideAllLocations: "Sakrij ostale lokacije",
    workingHours: "Radno vrijeme",
    today: "Danas",
    openNow: "Otvoreno",
    closedNow: "Zatvoreno",
    opensIn: "Otvara za",
    closesIn: "Zatvara za",
    opensAt: "Otvara u",
    closesAt: "Zatvara u",
    hourShort: "h",
    minuteShort: "min",

  },

  en: {
    // Menu categories
    STEAK: "STEAK",
    CLASSIC: "CLASSIC",
    CHICKEN: "CHICKEN",
    MIX: "MIX",
    NUGGETS: "NUGGETS",
    VEGE: "VEGETARIAN",
    PRILOZI: "SIDES",
    DESERT: "DESSERT",
    NAPITCI: "DRINKS",

    // UI elements
    loading: "Loading...",
    menuOffer: "MENU OFFER",
    sweetPotatoOption: "Sweet potato fries instead of regular fries",
    drinkOfChoice: "Drink of your choice",
    allRightsReserved: "All rights reserved.",

    // Common buttons/labels
    adminPanel: "Admin panel",
    login: "Login",

    // “items” plural forms
    items_one: "item",
    items_few: "items",
    items_many: "items",
    items_other: "items",

    // Notes
    steakWeekendOnly: "Available weekends only (Fri, Sat) – Langov Trg",

    // Sizes
    Regular: "Regular",
    Veliki: "Large",
    Mali: "Small",

    
    // MenuInstructions
    chooseCategory: "Choose category",

    // footer
    address: "Josip Lang Square 7, Zagreb",
    workingHoursPonUto: "Mon-Tue: 09-01h",
    workingHoursSriCet: "Wed-Thu: 09-02h",
    workingHoursPetSub: "Fri-Sat: 09-04h",
    workingHoursNed: "Sun: 10-01h",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    ourLocations: "Our Locations",
    currentLocation: "Current Location",
    selectLocation: "Select Location",
    viewAllLocations: "View all locations",
    hideAllLocations: "Hide other locations",
    workingHours: "Working hours",
    today: "Today",
    openNow: "Open",
    closedNow: "Closed",
    opensIn: "Opens in",
    closesIn: "Closes in",
    opensAt: "Opens at",
    closesAt: "Closes at",
    hourShort: "h",
    minuteShort: "min",

  },

  de: {
    // Menu categories
    STEAK: "STEAK",
    CLASSIC: "KLASSISCH",
    CHICKEN: "HÄHNCHEN",
    MIX: "MIX",
    NUGGETS: "NUGGETS",
    VEGE: "VEGETARISCH",
    PRILOZI: "BEILAGEN",
    DESERT: "NACHTISCH",
    NAPITCI: "GETRÄNKE",

    // UI elements
    loading: "Wird geladen...",
    menuOffer: "MENÜANGEBOT",
    sweetPotatoOption: "Süßkartoffelpommes statt normaler Pommes",
    drinkOfChoice: "Getränk nach Wahl",
    allRightsReserved: "Alle Rechte vorbehalten.",

    // Common buttons/labels
    adminPanel: "Adminbereich",
    login: "Anmelden",

    // “items” plural forms
    items_one: "Artikel",
    items_few: "Artikel",
    items_many: "Artikel",
    items_other: "Artikel",

    // Notes
    steakWeekendOnly: "Nur am Wochenende verfügbar (Fr, Sa) – Langov Trg",

    // Sizes
    Regular: "Regular",
    Veliki: "Groß",
    Mali: "Klein",
    
    // MenuInstructions
    chooseCategory: "Kategorie auswhlen",

    // footer
    address: "Josip Lang Platz 7, Zagreb",
    workingHoursPonUto: "Mo-Di: 09-01h",
    workingHoursSriCet: "Mi-Do: 09-02h",
    workingHoursPetSub: "Fr-Sa: 09-04h",
    workingHoursNed: "So: 10-01h",
    monday: "Montag",
    tuesday: "Dienstag",
    wednesday: "Mittwoch",
    thursday: "Donnerstag",
    friday: "Freitag",
    saturday: "Samstag",
    sunday: "Sonntag",
    ourLocations: "Unsere Standorte",
    currentLocation: "Aktuelles Standort",
    selectLocation: "Standort auswählen",
    viewAllLocations: "Alle Standorte anzeigen",
    hideAllLocations: "Andere Standorte ausblenden",
    workingHours: "Öffnungszeiten",
    today: "Heute",
    openNow: "Geöffnet",
    closedNow: "Geschlossen",
    opensIn: "Öffnet in",
    closesIn: "Schließt in",
    opensAt: "Öffnet um",
    closesAt: "Schließt um",
    hourShort: "Std",
    minuteShort: "Min",

  },

  tr: {
    // Menu categories
    STEAK: "ŞİŞ",
    CLASSIC: "KLASİK",
    CHICKEN: "TAVUK",
    MIX: "KARIŞIK",
    NUGGETS: "NUGGET",
    VEGE: "VEGETARYEN",
    PRILOZI: "YAN ÜRÜNLER",
    DESERT: "TATLI",
    NAPITCI: "İÇECEKLER",

    // UI elements
    loading: "Yükleniyor...",
    menuOffer: "MENÜ TEKLİFİ",
    sweetPotatoOption: "Normal patates kızartması yerine tatlı patates kızartması",
    drinkOfChoice: "Seçilen İçecek",
    allRightsReserved: "Tüm hakları saklıdır.",

    // Common buttons/labels
    adminPanel: "Admin paneli",
    login: "Giriş",

    // “items” plural forms
    items_one: "ürün",
    items_few: "ürün",
    items_many: "ürün",
    items_other: "ürün",

    // Notes
    steakWeekendOnly: "Sadece hafta sonu (Cum, Cmt) – Langov Trg",

    // Sizes
    Regular: "Regular",
    Veliki: "Büyük",
    Mali: "Küçük",
    
    // MenuInstructions
    chooseCategory: "Kategori seçin",

    // footer
    address: "Josip Lang Meydanı 7, Zagreb",
    workingHoursPonUto: "Pzt-Sal: 09-01",
    workingHoursSriCet: "Çar-Per: 09-02",
    workingHoursPetSub: "Cum-Cmt: 09-04",
    workingHoursNed: "Pazar: 10-01",
    monday: "Pazartesi",
    tuesday: "Salı",
    wednesday: "Çarşamba",
    thursday: "Perşembe",
    friday: "Cuma",
    saturday: "Cumartesi",
    sunday: "Pazar",
    ourLocations: "Şubelerimiz",
    currentLocation: "Güncel Şube",
    selectLocation: "Şube seçin",
    viewAllLocations: "Tüm şubeleri görüntüle",
    hideAllLocations: "Diğer şubeleri gizle",
    workingHours: "Çalışma saatleri",
    today: "Bugün",
    openNow: "Açık",
    closedNow: "Kapalı",
    opensIn: "Açılmasına",
    closesIn: "Kapanmasına",
    opensAt: "Saat",
    closesAt: "Saat",
    hourShort: "sa",
    minuteShort: "dk",

  },
};
