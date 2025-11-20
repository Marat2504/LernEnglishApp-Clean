import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

const speechApiKey = Constants.expoConfig?.extra?.YANDEX_SPEECH_API_KEY || 'fallback_key';

// Simple btoa implementation for React Native
const btoa = (input: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < input.length; ) {
    const a = input.charCodeAt(i++) || 0;
    const b = input.charCodeAt(i++) || 0;
    const c = input.charCodeAt(i++) || 0;
    output += chars[a >> 2];
    output += chars[((a & 3) << 4) | (b >> 4)];
    output += chars[((b & 15) << 2) | (c >> 6)];
    output += chars[c & 63];
  }
  while (output.length % 4) output += '=';
  return output;
};

export const generateAudio = async (text: string, fileName?: string): Promise<string> => {
  try {
    // Use Yandex TTS API
    const ttsUrl = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize';

    // Use provided file name or create a unique one
    const finalFileName = fileName || `audio_${Date.now()}.ogg`;
    const fileUri = FileSystem.documentDirectory + finalFileName;

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('lang', 'en-US');
    formData.append('voice', 'john');
    formData.append('speed', '0.9');

    // Fetch the audio data
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Api-Key ${speechApiKey}`,
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audio');
    }
    console.log('resp: ', response);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Write the base64 data to the file
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

    return fileUri;
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
};
