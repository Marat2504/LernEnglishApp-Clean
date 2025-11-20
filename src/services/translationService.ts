import axios from 'axios';
import Constants from 'expo-constants';


const YANDEX_TRANSLATE_URL = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
const API_KEY = Constants.expoConfig?.extra?.YANDEX_TRANSLATION_API_KEY || 'fallback_key';
const FOLDER_ID = 'b1gof0d653o9i193ncei';

export const translateEnglishToRussian = async (text: string): Promise<string> => {
  if (!text.trim()) return '';
  console.log('Translating text:', text);
  

  try {
    const response = await axios.post(YANDEX_TRANSLATE_URL, {
      folderId: FOLDER_ID,
      texts: [text],
      sourceLanguageCode: 'en',
      targetLanguageCode: 'ru',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${API_KEY}`,
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    return response.data.translations[0]?.text || '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('Response status:', error.response?.status, error.response?.statusText);
      console.log('Error response:', error.response?.data);
    }
    console.error('Translation error:', error);
    return '';
  }
};
