import axios from "axios";

// Microsoft Translator API Configuration
const SUBSCRIPTION_KEY = import.meta.env.VITE_AZURE_KEY;
const ENDPOINT = "https://api.cognitive.microsofttranslator.com";
const LOCATION = "germanywestcentral"; // Zamijeni ako koristiš specifičnu regiju

/**
 * Translates text using Microsoft Translator API
 * @param text Text to translate
 * @param sourceLanguage Source language code (e.g., 'hr' for Croatian)
 * @param targetLanguage Target language code (e.g., 'en' for English)
 * @returns Promise with translated text
 */
export async function translateText(
  text: string,
  sourceLanguage: string = "hr",
  targetLanguage: string
): Promise<string> {
  if (!text || text.trim() === "") {
    return "";
  }

  try {
    const response = await axios.post(
      `${ENDPOINT}/translate?api-version=3.0&from=${sourceLanguage}&to=${targetLanguage}`,
      [{ text }],
      {
        headers: {
          "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
          "Ocp-Apim-Subscription-Region": LOCATION,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data[0].translations[0].text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

/**
 * Translate menu item fields to all supported languages
 * @param item Menu item with fields to translate
 * @returns Promise with translated menu item
 */
export async function translateMenuItem(item: any): Promise<any> {
  try {
    const translationTasks = [
      // English translations
      {
        sourceField: "product_name",
        targetField: "product_name_en",
        targetLang: "en",
      },
      {
        sourceField: "description_hr",
        targetField: "description_en",
        targetLang: "en",
      },
      // German translations
      {
        sourceField: "product_name",
        targetField: "product_name_de",
        targetLang: "de",
      },
      {
        sourceField: "description_hr",
        targetField: "description_de",
        targetLang: "de",
      },
      // Turkish translations
      {
        sourceField: "product_name",
        targetField: "product_name_tr",
        targetLang: "tr",
      },
      {
        sourceField: "description_hr",
        targetField: "description_tr",
        targetLang: "tr",
      },
    ];

    // Pokreni prijevode paralelno
    const translations = await Promise.all(
      translationTasks.map(async (task) => {
        if (item[task.sourceField]) {
          const translatedText = await translateText(
            item[task.sourceField],
            "hr",
            task.targetLang
          );
          return {
            field: task.targetField,
            text: translatedText,
          };
        }
        return {
          field: task.targetField,
          text: "",
        };
      })
    );

    // Kreiraj novi objekt s prijevodima
    const translatedItem = { ...item };
    translations.forEach((translation) => {
      translatedItem[translation.field] = translation.text;
    });

    return translatedItem;
  } catch (error) {
    console.error("Error translating menu item:", error);
    return item;
  }
}

// Function to check if Microsoft Translator API is available
export async function isTranslationAvailable(): Promise<boolean> {
  try {
    await axios.get(`${ENDPOINT}/languages?api-version=3.0`, {
      headers: {
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        "Ocp-Apim-Subscription-Region": LOCATION,
      },
    });
    return true;
  } catch (error) {
    console.error("Microsoft Translator API unavailable:", error);
    return false;
  }
}
