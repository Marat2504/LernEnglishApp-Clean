import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCards } from '../hooks/useCards';
import { useTags } from '../hooks/useTags';
import LoadingIndicator from '../components/LoadingIndicator';
import AnimatedTextCard from '../components/AnimatedTextCard';
import { useNavigation } from '@react-navigation/native';
import { TagChip } from '../components/TagChip';
import { submitSessionResult } from '../services/studyService';
import { StudyMode, CardResultDto } from '../types';

export default function QuizModeScreen() {
  const navigation = useNavigation();
  const { data: allCards, isLoading, error } = useCards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modeSelected, setModeSelected] = useState(false);
  const [showWordFirst, setShowWordFirst] = useState(true);
  const isCompletedRef = useRef(false);
  const { data: tags } = useTags();
  const [filterSelected, setFilterSelected] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'tags'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
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

  // Генерируем варианты ответов для текущей карточки
  const options = useMemo(() => {
    if (!cards.length || currentIndex >= cards.length) return [];
    const currentCard = cards[currentIndex];
    const correctAnswer = showWordFirst ? currentCard.russianTranslation : currentCard.englishWord;
    const otherCards = cards.filter((_, idx) => idx !== currentIndex);
    const wrongAnswers = otherCards
      .map(card => showWordFirst ? card.russianTranslation : card.englishWord)
      .filter((ans, idx, arr) => arr.indexOf(ans) === idx) // уникальные
      .slice(0, 3); // 3 неправильных
    const allOptions = [correctAnswer, ...wrongAnswers];
    // Перемешиваем
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    return allOptions;
  }, [cards, currentIndex, showWordFirst]);

  useEffect(() => {
    // Сбрасываем состояние при изменении карт
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
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
              setModeSelected(true);
              setSessionStartTime(Date.now());
            },
          },
          {
            text: 'Перевод',
            onPress: () => {
              setShowWordFirst(false);
              setModeSelected(true);
              setSessionStartTime(Date.now());
            },
          },
        ]
      );
    }
  }, [modeSelected, filterSelected]);

  const currentCard = cards[currentIndex];
  const question = currentCard ? (showWordFirst ? currentCard.englishWord : currentCard.russianTranslation) : '';
  const correctAnswer = currentCard ? (showWordFirst ? currentCard.russianTranslation : currentCard.englishWord) : '';

  const handleOptionPress = (option: string) => {
    if (selectedOption && isCorrect !== null) return; // Уже выбрано и проверено
    setSelectedOption(option);
    const correct = option === correctAnswer;
    setIsCorrect(correct);

    // Добавляем результат ответа (правильный или неправильный)
    const newResults = [...cardResults, { cardId: currentCard.id, isCorrect: correct }];
    setCardResults(newResults);

    if (correct) {
      // Переходим к следующей через 1 секунду
      setTimeout(() => {
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSelectedOption(null);
          setIsCorrect(null);
        } else {
          // Завершение сессии
          const totalTime = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;

          submitSessionResult({
            mode: StudyMode.QUIZ,
            cardResults: newResults,
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
                  setSelectedOption(null);
                  setIsCorrect(null);
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
      }, 1000);
    } else {
      // Для неверного: сбрасываем выбор через 1 секунду, чтобы пользователь мог попробовать снова
      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrect(null);
      }, 1000);
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
        <Text style={styles.title}>Режим с Вариантами</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentIndex + 1) / cards.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</Text>
        </View>

        <View style={styles.questionContainer}>
          <View style={styles.card}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.cardGradient}>
              <AnimatedTextCard text={question} style={styles.questionText} />
            </LinearGradient>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            let backgroundColor = '#f8f9fa';
            if (selectedOption === option) {
              backgroundColor = isCorrect ? '#28a745' : '#dc3545';
            }
            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, { backgroundColor }]}
                onPress={() => handleOptionPress(option)}
                disabled={isCorrect === true} // Отключаем только после правильного выбора
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
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
  questionContainer: {
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
  questionText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
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
});
