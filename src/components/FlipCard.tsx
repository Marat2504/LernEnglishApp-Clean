import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface FlipCardProps {
  isFlipped: boolean;
  frontText: string;
  backText: string;
  style: ViewStyle;
  onPress: () => void;
}

export default function FlipCard({ isFlipped, frontText, backText, style, onPress }: FlipCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 180 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <View style={style}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ width: '100%', height: '100%' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: [{ rotateY: frontRotate }],
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#667eea', borderRadius: 20 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
              {frontText}
            </Text>
          </View>
        </Animated.View>
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: [{ rotateY: backRotate }],
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#764ba2', borderRadius: 20 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
              {backText}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
