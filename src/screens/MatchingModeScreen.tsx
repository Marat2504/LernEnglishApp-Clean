import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, FlatList, ScrollView } from 'react-native';
import { useCards } from '../hooks/useCards';
import { useTags } from '../hooks/useTags';
import LoadingIndicator from '../components/LoadingIndicator';
import { useNavigation } from '@react-navigation/native';
import { TagChip } from '../components/TagChip';
import { submitSessionResult } from '../services/studyService';
import { StudyMode, CardResultDto } from '../types';

export default function MatchingModeScreen() {
  const navigation = useNavigation();
  const { data: allCards, isLoading, error } = useCards();
  const isCompletedRef = useRef(false);
  const { data: tags } = useTags();
  const [filterSelected, setFilterSelected] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'tags'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongRight, setWrongRight] = useState<number | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [modeSelected, setModeSelected] = useState(false);
  const [showWordFirst, setShowWordFirst] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [cardResults, setCardResults] = useState<CardResultDto[]>([]);
  const pairsPerSet = 7;

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

  // Текущий набор карточек
  const currentCards = useMemo(() => {
    const start = currentSet * pairsPerSet;
    return cards.slice(start, start + pairsPerSet);
  }, [cards, currentSet, pairsPerSet]);

  // Перемешиваем порядок для колонок
  const leftOrder = useMemo(() => {
    const order = currentCards.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }, [currentCards]);

  const rightOrder = useMemo(() => {
    const order = currentCards.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }, [currentCards]);

  useEffect(() => {
    // Сбрасываем состояние при изменении набора
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatched(new Set());
    setWrongRight(null);
  }, [currentCards]);

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
        'Что показывать слева?',
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

  useEffect(() => {
    if (matched.size === currentCards.length && currentCards.length > 0) {
      const totalSets = Math.ceil(cards.length / pairsPerSet);
      if (currentSet < totalSets - 1) {
        // Следующий набор
        setCurrentSet(currentSet + 1);
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatched(new Set());
        setWrongRight(null);
      } else {
        // Завершение сессии
        const totalTime = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;

        submitSessionResult({
          mode: StudyMode.MATCHING,
          cardResults,
          totalTimeSpentSec: totalTime,
        }).catch(error => console.error('Failed to submit session result:', error));

        Alert.alert(
          'Завершено',
          'Все слова сопоставлены! Хотите начать сначала?',
          [
            {
              text: 'Да',
              onPress: () => {
                setCurrentSet(0);
                setSelectedLeft(null);
                setSelectedRight(null);
                setMatched(new Set());
                setWrongRight(null);
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
    }
  }, [matched, currentCards.length, currentSet, cards.length, pairsPerSet]);

  const handleLeftPress = (index: number) => {
    const cardIndex = leftOrder[index];
    if (matched.has(cardIndex)) return;
    if (selectedLeft === index) {
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedLeft(index);
      setSelectedRight(null);
      setWrongRight(null);
    }
  };

  const handleRightPress = (index: number) => {
    const cardIndex = rightOrder[index];
    if (matched.has(cardIndex)) return;
    if (selectedLeft === null) return;
    const selectedCardIndex = leftOrder[selectedLeft];
    const selectedCard = currentCards[selectedCardIndex];
    if (selectedCardIndex === cardIndex) {
      // Верно
      setCardResults(prev => [...prev, { cardId: selectedCard.id, isCorrect: true }]);
      setMatched(prev => new Set([...prev, selectedCardIndex]));
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Неверно
      setCardResults(prev => [...prev, { cardId: selectedCard.id, isCorrect: false }]);
      setSelectedRight(index);
      setWrongRight(index);
      setTimeout(() => {
        setWrongRight(null);
        setSelectedRight(null);
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
    const totalSets = Math.ceil(cards.length / pairsPerSet);
    const progress = ((currentSet + matched.size / currentCards.length) / totalSets) * 100;
    content = (
      <>
        <Text style={styles.title}>Сопоставление Слов</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {leftOrder.map((cardIndex, index) => {
                const card = currentCards[cardIndex];
                let backgroundColor = '#f8f9fa';
                if (matched.has(cardIndex)) backgroundColor = '#667eea';
                else if (selectedLeft === index) backgroundColor = '#28a745';
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.wordButton, { backgroundColor }]}
                    onPress={() => handleLeftPress(index)}
                    disabled={matched.has(cardIndex)}
                  >
                    <Text style={styles.wordText} numberOfLines={2}>{showWordFirst ? card.englishWord : card.russianTranslation}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <View style={styles.column}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {rightOrder.map((cardIndex, index) => {
                const card = currentCards[cardIndex];
                let backgroundColor = '#f8f9fa';
                if (matched.has(cardIndex)) backgroundColor = '#667eea';
                else if (selectedRight === index) backgroundColor = wrongRight === index ? '#dc3545' : '#28a745';
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.wordButton, { backgroundColor }]}
                    onPress={() => handleRightPress(index)}
                    disabled={matched.has(cardIndex)}
                  >
                    <Text style={styles.wordText} numberOfLines={2}>{showWordFirst ? card.russianTranslation : card.englishWord}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
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
    paddingVertical: 20,
    paddingHorizontal: 0,
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
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  wordButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    width: '100%',
    height: 70,
    justifyContent: 'center',
  },
  wordText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
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
