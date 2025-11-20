import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Card } from '../types';
import { TagChip } from './TagChip';
import { generateAudio } from '../services/textToSpeechService';
import { updateCard } from '../services/cardsService';

interface CardItemProps {
  card: Card;
  onPress?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({ card, onPress, onLongPress, isSelected, isSelectionMode }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async () => {
    if (!card.audioUrl) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      let audioUri = card.audioUrl;

      try {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: 'file://' + audioUri });
        setSound(newSound);
        setIsPlaying(true);

        await newSound.playAsync();

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (createError: any) {
        // Если файл не найден, регенерируем аудио с тем же именем
        if (createError.message.includes('FileNotFound') || createError.message.includes('ENOENT') || createError.message.includes('No such file')) {
          console.log('Audio file not found, regenerating...');
          try {
            const fileName = card.audioUrl.split('/').pop();
            const newAudioUrl = await generateAudio(card.englishWord, fileName);
            await updateCard(card.id, { audioUrl: newAudioUrl });
            audioUri = newAudioUrl;
            console.log('Audio regenerated and updated for card:', card.id);

            // Теперь воспроизводим с новым URI
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: 'file://' + audioUri });
            setSound(newSound);
            setIsPlaying(true);

            await newSound.playAsync();

            newSound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsPlaying(false);
              }
            });
          } catch (regenerateError) {
            console.error('Error regenerating audio:', regenerateError);
            Alert.alert('Ошибка', 'Не удалось загрузить аудио');
            return;
          }
        } else {
          throw createError;
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Ошибка', 'Не удалось воспроизвести аудио');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };



  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
      <LinearGradient colors={isSelected ? ['#e3f2fd', '#bbdefb'] : ['#f0f4f8', '#e1e8ed']} style={styles.card}>
        <View style={styles.header}>
          {isSelectionMode && (
            <View style={styles.checkbox}>
              <Text style={styles.checkboxText}>{isSelected ? '☑️' : '☐'}</Text>
            </View>
          )}
          <Text style={styles.word}>{card.englishWord}</Text>
          <View style={styles.headerRight}>
            {card.isLearned && !isSelectionMode && (
              <Text style={styles.learnedIcon}>✅</Text>
            )}
            {card.audioUrl && !isSelectionMode && (
              <TouchableOpacity onPress={isPlaying ? stopAudio : playAudio} style={styles.playButton}>
                <Text style={styles.playText}>{isPlaying ? '⏸️' : '🔊'}</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>
        <Text style={styles.translation}>{card.russianTranslation}</Text>
        <View style={styles.tagsContainer}>
          {card.cardTags?.map(({ tag }) => (
            <TagChip key={tag.id} name={tag.name} isPredefined={tag.isPredefined} />
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxText: {
    fontSize: 20,
  },
  word: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  translation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  learnedIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  playButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  playText: {
    color: 'white',
    fontSize: 16,
  },

});
