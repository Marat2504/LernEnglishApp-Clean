// src/screens/ProfileScreen.tsx (экран статистики и достижений)
import React, { useContext, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import useStats from '../hooks/useStats';
import useAchievements from '../hooks/useAchievements';
import { Achievement } from '../services/achievementsService';
import LoadingIndicator from '../components/LoadingIndicator';

export default function ProfileScreen() {
  const { logout: contextLogout } = useContext(AuthContext)!;

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useStats();

  const {
    data: achievements,
    isLoading: achievementsLoading,
    error: achievementsError,
    refetch: refetchAchievements,
  } = useAchievements();

const [modalVisible, setModalVisible] = useState(false);
const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetchStats();
      refetchAchievements();
    }, [refetchStats, refetchAchievements])
  );

  const handleLogout = async () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await contextLogout();
        },
      },
    ]);
  };

  const xpForLevel = (level: number): number => {
    if (level === 1) return 0;
    return 100 * (level * level - 2 * level + 3);
  };

  const levelProgress = (stats: any): number => {
    const currentLevel = stats?.currentLevel || 1;
    const totalXp = stats?.totalXp || 0;
    const currentLevelXp = xpForLevel(currentLevel);
    const nextLevelXp = xpForLevel(currentLevel + 1);
    const progress = (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    return Math.min(Math.max(progress, 0), 1);
  };

  const getNextEnglishLevel = (currentLevel: number): string => {
    if (currentLevel < 5) return 'A1';
    if (currentLevel < 10) return 'A2';
    if (currentLevel < 15) return 'B1';
    if (currentLevel < 20) return 'B2';
    if (currentLevel < 25) return 'C1';
    if (currentLevel < 30) return 'C2';
    return 'C2'; // Максимальный уровень
  };

  const englishLevelProgress = (stats: any): { progress: number; startXP: number; endXP: number } => {
    const currentLevel = stats?.currentLevel || 1;
    const currentXP = stats?.totalXp || 0;
    if (currentLevel >= 30) return { progress: 1, startXP: 0, endXP: 0 }; // Максимальный уровень достигнут

    let startLevel = 1;
    let endLevel = 5;

    if (currentLevel >= 5) { startLevel = 5; endLevel = 10; }
    if (currentLevel >= 10) { startLevel = 10; endLevel = 15; }
    if (currentLevel >= 15) { startLevel = 15; endLevel = 20; }
    if (currentLevel >= 20) { startLevel = 20; endLevel = 25; }
    if (currentLevel >= 25) { startLevel = 25; endLevel = 30; }

    const startXP = xpForLevel(startLevel);
    const endXP = xpForLevel(endLevel);
    const progress = (currentXP - startXP) / (endXP - startXP);
    return { progress: Math.min(Math.max(progress, 0), 1), startXP, endXP };
  };

  if (statsLoading) {
    return <LoadingIndicator text="Загрузка статистики..." />;
  }

  if (statsError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ошибка загрузки данных</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Профиль и Статистика</Text>

          {/* Статистика */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>📊 Общая статистика</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Общий XP:</Text>
              <Text style={styles.statValue}>{stats?.totalXp || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Текущий уровень:</Text>
              <Text style={styles.statValue}>{stats?.currentLevel || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Всего слов:</Text>
              <Text style={styles.statValue}>{stats?.totalWords || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Изучено слов:</Text>
              <Text style={styles.statValue}>{stats?.learnedWords || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Слов просмотрено сегодня:</Text>
              <Text style={styles.statValue}>{stats?.wordsViewedToday || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Слов выучено сегодня:</Text>
              <Text style={styles.statValue}>{stats?.wordsLearnedToday || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Карточек добавлено сегодня:</Text>
              <Text style={styles.statValue}>{stats?.cardsAddedToday || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Время обучения (мин):</Text>
              <Text style={styles.statValue}>{Math.floor((stats?.timeSpentSec || 0) / 60)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Время обучения сегодня (мин):</Text>
              <Text style={styles.statValue}>{Math.floor((stats?.timeSpentTodaySec || 0) / 60)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Уровень английского:</Text>
              <Text style={styles.statValue}>{stats?.currentLanguageLevel || 'Не определен'}</Text>
            </View>
          </View>

          {/* Прогресс к следующему уровню */}
          <View style={styles.levelProgressSection}>
            <Text style={styles.sectionTitle}>⬆️ Следующий уровень: {(stats?.currentLevel || 1) + 1}</Text>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>
                XP: {stats?.totalXp || 0} / {xpForLevel((stats?.currentLevel || 1) + 1)}
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${levelProgress(stats) * 100}%` }]}
                />
                <Text style={styles.progressText}>{Math.round(levelProgress(stats) * 100)}%</Text>
              </View>
            </View>
          </View>

          {/* Прогресс к следующему уровню английского */}
          <View style={styles.levelProgressSection}>
            <Text style={styles.sectionTitle}>🌍 Следующий уровень английского: {getNextEnglishLevel(stats?.currentLevel || 1)}</Text>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>
                XP: {stats?.totalXp || 0} / {englishLevelProgress(stats).endXP}
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${englishLevelProgress(stats).progress * 100}%` }]}
                />
                <Text style={styles.progressText}>{Math.round(englishLevelProgress(stats).progress * 100)}%</Text>
              </View>
            </View>
          </View>

          {/* Достижения (Achievements Section) */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🏆 Достижения</Text>
            {achievementsLoading ? (
              <LoadingIndicator text="Загрузка достижений..." />
            ) : achievementsError ? (
              <Text style={styles.errorText}>Ошибка загрузки достижений</Text>
            ) : (
              <>
                  {achievements && (() => {
                    // Split achievements into completed and in-progress groups
                    const completed = achievements.filter(a => a.progress === a.threshold);
                    const inProgress = achievements.filter(a => a.progress !== a.threshold);

                  // Sort groups by category
                  const sortByCategory = (a: typeof achievements[0], b: typeof achievements[0]) => {
                    if (a.category < b.category) return -1;
                    if (a.category > b.category) return 1;
                    return 0;
                  };

                  completed.sort(sortByCategory);
                  inProgress.sort(sortByCategory);

                  return (
                    <>
                      <Text style={styles.subSectionTitle}>Получены</Text>
                      <View style={styles.achievementRow}>
                        {completed.map((achievement) => (
                          <TouchableOpacity
                            key={achievement.id}
                            style={[
                              styles.badge,
                              {
                                backgroundColor: '#e0f7fa',
                                opacity: 1,
                              },
                            ]}
                            onPress={() => {
                              setSelectedAchievement(achievement);
                              setModalVisible(true);
                            }}
                          >
                            <Text style={styles.badgeEmoji}>{achievement.icon}</Text>
                            <Text style={styles.badgeText} numberOfLines={2} ellipsizeMode="tail">
                              {achievement.name}
                            </Text>
                            <Text style={styles.badgeText}>
                              {achievement.progress} / {achievement.threshold}
                            </Text>
                          </TouchableOpacity>
                        ))}
                </View>
                <Text style={styles.subSectionTitle}>В процессе</Text>
                <View style={styles.achievementRow}>
                  {inProgress.map((achievement) => (
                    <TouchableOpacity
                      key={achievement.id}
                      style={[
                        styles.badge,
                        {
                          backgroundColor: '#ccc',
                          opacity: 0.3,  // More faded for in-progress
                        },
                      ]}
                      onPress={() => {
                        setSelectedAchievement(achievement);
                        setModalVisible(true);
                      }}
                    >
                      <Text style={styles.badgeEmoji}>{achievement.icon}</Text>
                      <Text style={styles.badgeText} numberOfLines={2} ellipsizeMode="tail">
                        {achievement.name}
                      </Text>
                      <Text style={styles.badgeText}>
                        {achievement.progress} / {achievement.threshold}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            );
          })()}
          {/* Modal for achievement description */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
              setSelectedAchievement(null);
            }}
          >
            <TouchableWithoutFeedback onPress={() => {
              setModalVisible(false);
              setSelectedAchievement(null);
            }}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>{selectedAchievement?.name}</Text>
                    <Text style={styles.modalDescription}>{selectedAchievement?.description}</Text>
                    <Pressable
                      style={styles.modalCloseButton}
                      onPress={() => {
                        setModalVisible(false);
                        setSelectedAchievement(null);
                      }}
                    >
                      <Text style={styles.modalCloseText}>Закрыть</Text>
                    </Pressable>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
              </>
            )}
          </View>

          {/* Кнопка выхода */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 375,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  progressSection: {
    marginBottom: 24,
  },
  levelProgressSection: {
    marginBottom: 24,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#e0e4ff',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute',
    textAlign: 'center',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    marginTop: 8,
    paddingLeft: 8,
  },
  badge: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 80,
    marginBottom: 10,
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  tasksSection: {
    marginBottom: 24,
  },
  taskItem: {
    marginBottom: 8,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalView: {
    minWidth: 280,
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
