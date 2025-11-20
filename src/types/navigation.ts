// src/types/navigation.ts (создайте этот файл)

export type RootStackParamList = {
  MainTabs: undefined;
  AddCard: undefined;  // экран для добавления новой карточки
  EditCard: { cardId: string };  // экран для редактирования карточки
  CardsList: undefined;  // экран для списка карточек
  SpeedMode: undefined;
  QuizMode: undefined;
  MatchingMode: undefined;
  ListeningMode: undefined;
  LightningMode: undefined;
  ChatBot: undefined;  // Интеллектуальный собеседник
  // другие экраны, если есть
};
