import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCards } from '../hooks/useCards';
import { useTags } from '../hooks/useTags';
import LoadingIndicator from '../components/LoadingIndicator';
import { useNavigation } from '@react-navigation/native';
import { TagChip } from '../components/TagChip';
import FlipCard from '../components/FlipCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { generateAudio } from '../services/textToSpeechService';
import { submitSessionResult } from '../services/studyService';
import { StudyMode, CardResultDto } from '../types';

export default function LightningModeScreen() {
  const navigation = useNavigation();
  const { data: allCards, isLoading, error } = useCards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeToFlip, setTimeToFlip] = useState(3); // секунды
  const [timeToNext, setTimeToNext] = useState(5); // секунды
  const [isPaused, setIsPaused] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const flipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef(false);
  const hasFlippedForCard = useRef(false);
  const { data: tags } = useTags();
  const [filterSelected, setFilterSelected] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'tags'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [modeSelected, setModeSelected] = useState(false);
  const [showWordFirst, setShowWordFirst] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [cardResults, setCardResults] = useState<CardResultDto[]>([]);

  // Фильтруем карточки по фильтру и невыученным
  const cards = useMemo(() => {
    if (!allCards) return [];
    let filtered = allCards.filter(card => !card.isLearned);
    if (filterType === 'tags') {
      filtered = filtered.filter(card =>
        card.cardTags?.some(ct => selectedTags.includes(ct.tag.id))
      );
    }
    return filtered;
  }, [allCards, filterType, selectedTags]);

  useEffect(() => {
    // Сбрасываем состояние при изменении карт
    setCurrentIndex(0);
    setIsFlipped(showWordFirst ? false : true);
    hasFlippedForCard.current = false;
    // Останавливаем аудио при сбросе
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setSound(null);
    }
  }, [cards, showWordFirst]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isCompletedRef.current) {
        e.preventDefault();
        Alert.alert(
          'Прервать режим?',
          'При возвращении режим начнется с начала. Вы уверены?',
          [
            { text: 'Нет', style: 'cancel', onPress: () => {} },
            { text: 'Да', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
          ]
        );
      }
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!filterSelected) {
      Alert.alert(
        'Выберите фильтр слов',
        '',
        [
          {
            text: 'Все невыученные',
            onPress: () => {
              setFilterType('all');
              setFilterSelected(true);
            },
          },
          {
            text: 'По тегам',
            onPress: () => setModalVisible(true),
          },
        ]
      );
    }
  }, [filterSelected]);

  useEffect(() => {
    if (!modeSelected && filterSelected) {
      Alert.alert(
        'Выберите режим',
        'Что показывать сначала?',
        [
          {
            text: 'Слово',
            onPress: () => {
              setShowWordFirst(true);
              setIsFlipped(false);
              setModeSelected(true);
              setSessionStartTime(Date.now());
            },
          },
          {
            text: 'Перевод',
            onPress: () => {
              setShowWordFirst(false);
              setIsFlipped(true);
              setModeSelected(true);
              setSessionStartTime(Date.now());
            },
          },
        ]
      );
    }
  }, [modeSelected, filterSelected]);

  // Загрузка настроек времени
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTimeToFlip = await AsyncStorage.getItem('lightningTimeToFlip');
        const savedTimeToNext = await AsyncStorage.getItem('lightningTimeToNext');
        if (savedTimeToFlip) setTimeToFlip(parseInt(savedTimeToFlip));
        if (savedTimeToNext) setTimeToNext(parseInt(savedTimeToNext));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const currentCard = cards[currentIndex];

  // Функция воспроизведения аудио
  const playAudio = async () => {
    if (!currentCard || isFlipped) return; // Только для английского слова

    setIsLoadingAudio(true);
    try {
      let audioUri = currentCard.audioUrl;

      if (!audioUri) {
        audioUri = await generateAudio(currentCard.englishWord);
      }

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          if (!showWordFirst) {
            setTimeout(() => {
              setIsFlipped(true);
              handleNext();
            }, timeToNext * 1000);
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      if (!showWordFirst) {
        setTimeout(() => {
          setIsFlipped(true);
          handleNext();
        }, timeToNext * 1000);
      }
    } finally {
      setIsLoadingAudio(false);
      // Fallback: перевернуть через 3 секунды, если аудио не закончилось
      if (!showWordFirst) {
        setTimeout(() => {
          if (!isFlipped) {
            setTimeout(() => {
              setIsFlipped(true);
              handleNext();
            }, timeToNext * 1000);
          }
        }, 3000);
      }
    }
  };

  // Автоматическое воспроизведение при показе английского слова
  useEffect(() => {
    if (currentCard && !isFlipped && modeSelected && !isPaused) {
      playAudio();
    }
  }, [currentIndex, isFlipped, modeSelected, isPaused, currentCard]);

  // Таймер для переворота
  useEffect(() => {
    if (modeSelected && !isPaused && currentCard && !hasFlippedForCard.current) {
      flipTimerRef.current = setTimeout(() => {
        setIsFlipped(!isFlipped);
        hasFlippedForCard.current = true;
      }, timeToFlip * 1000);
    }
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, [currentIndex, isFlipped, isPaused, timeToFlip, modeSelected, currentCard]);

  // Таймер для перехода к следующей
  useEffect(() => {
    if (modeSelected && !isPaused && isFlipped && currentCard && showWordFirst) {
      nextTimerRef.current = setTimeout(() => {
        handleNext();
      }, timeToNext * 1000);
    }
    return () => {
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, [currentIndex, isFlipped, isPaused, timeToNext, modeSelected, currentCard, showWordFirst]);

  const handleNext = () => {
    // Добавляем результат для текущей карточки
    if (currentCard) {
      setCardResults(prev => [...prev, { cardId: currentCard.id, isCorrect: true }]);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(showWordFirst ? false : true);
      hasFlippedForCard.current = false;
    } else {
      // Завершение сессии
      const totalTime = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
      const finalCardResults = [...cardResults, { cardId: currentCard.id, isCorrect: true }];

      submitSessionResult({
        mode: StudyMode.LIGHTNING,
        cardResults: finalCardResults,
        totalTimeSpentSec: totalTime,
      }).catch(error => console.error('Failed to submit session result:', error));

      Alert.alert(
        'Завершено',
        'Хотите начать сначала?',
        [
          {
            text: 'Да',
            onPress: () => {
              setCurrentIndex(0);
              setIsFlipped(showWordFirst ? false : true);
              hasFlippedForCard.current = false;
              setCardResults([]);
              setSessionStartTime(Date.now());
            },
          },
          {
            text: 'Нет',
            onPress: () => {
              isCompletedRef.current = true;
              navigation.goBack();
            },
          },
        ]
      );
    }
    // Останавливаем аудио при переходе
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setSound(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(showWordFirst ? false : true);
      hasFlippedForCard.current = false;
    }
    // Останавливаем аудио при переходе
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setSound(null);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('lightningTimeToFlip', timeToFlip.toString());
      await AsyncStorage.setItem('lightningTimeToNext', timeToNext.toString());
      setSettingsModalVisible(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  let content;

  if (isLoading) {
    content = <LoadingIndicator text="Загрузка карточек..." />;
  } else if (error) {
    content = (
      <View style={styles.center}>
        <Text>Ошибка загрузки карточек</Text>
      </View>
    );
  } else if (cards.length === 0) {
    content = (
      <View style={styles.center}>
        <Text>Нет невыученных карточек</Text>
      </View>
    );
  } else if (!filterSelected) {
    content = (
      <View style={styles.center}>
        <Text>Выберите фильтр...</Text>
      </View>
    );
  } else if (!modeSelected) {
    content = (
      <View style={styles.center}>
        <Text>Выберите режим...</Text>
      </View>
    );
  } else {
    content = (
      <>
        <Text style={styles.title}>Режим «Молния»</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentIndex + 1) / cards.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</Text>
        </View>

        <View style={styles.cardContainer}>
          <FlipCard
            key={currentIndex}
            isFlipped={isFlipped}
            frontText={currentCard.englishWord}
            backText={currentCard.russianTranslation}
            style={styles.card}
            onPress={() => setIsFlipped(!isFlipped)}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={togglePause}>
            <Text style={styles.buttonText}>{isPaused ? '▶️ Продолжить' : '⏸️ Пауза'}</Text>
          </TouchableOpacity>
          <View style={styles.rowButtons}>
            <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={handlePrev} disabled={currentIndex === 0}>
              <Text style={styles.buttonText}>⬅️ Назад</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={handleNext}>
              <Text style={styles.buttonText}>Далее ➡️</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => setSettingsModalVisible(true)}>
            <Text style={styles.buttonText}>⚙️ Настройки</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {content}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите теги</Text>
            <FlatList
              data={tags}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TagChip
                  name={item.name}
                  selected={selectedTags.includes(item.id)}
                  onPress={() => {
                    setSelectedTags(prev =>
                      prev.includes(item.id)
                        ? prev.filter(id => id !== item.id)
                        : [...prev, item.id]
                    );
                  }}
                  isPredefined={item.isPredefined}
                />
              )}
              numColumns={2}
              contentContainerStyle={{ padding: 10 }}
            />
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                if (selectedTags.length > 0) {
                  setFilterType('tags');
                  setFilterSelected(true);
                  setModalVisible(false);
                } else {
                  Alert.alert('Выберите хотя бы один тег');
                }
              }}
            >
              <Text style={styles.startButtonText}>Начать</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={settingsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Настройки времени</Text>
            <Text>Время до переворота (сек): {timeToFlip}</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity onPress={() => setTimeToFlip(Math.max(1, timeToFlip - 1))}>
                <Text style={styles.sliderButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.sliderValue}>{timeToFlip}</Text>
              <TouchableOpacity onPress={() => setTimeToFlip(Math.min(10, timeToFlip + 1))}>
                <Text style={styles.sliderButton}>+</Text>
              </TouchableOpacity>
            </View>
            <Text>Время до следующей (сек): {timeToNext}</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity onPress={() => setTimeToNext(Math.max(1, timeToNext - 1))}>
                <Text style={styles.sliderButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.sliderValue}>{timeToNext}</Text>
              <TouchableOpacity onPress={() => setTimeToNext(Math.min(15, timeToNext + 1))}>
                <Text style={styles.sliderButton}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={saveSettings}>
              <Text style={styles.startButtonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '90%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    height: 250,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  cardText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  buttonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 10,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  smallButton: {
    width: '48%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  sliderButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    paddingHorizontal: 10,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
});
