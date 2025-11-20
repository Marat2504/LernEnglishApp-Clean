import React, { useEffect, useState } from 'react';
import { Animated, TextStyle } from 'react-native';

interface AnimatedTextCardProps {
  text: string;
  style: TextStyle;
}

export default function AnimatedTextCard({ text, style }: AnimatedTextCardProps) {
  const [opacityAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [text]);

  return (
    <Animated.Text style={[style, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      {text}
    </Animated.Text>
  );
}
