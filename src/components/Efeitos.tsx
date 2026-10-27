// Gota caindo ao beber e confete ao bater a meta (como as animações CSS do PWA).
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const nativo = Platform.OS !== 'web';

export function Gota({ largura, onFim }: { largura: number; onFim: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1000, easing: Easing.in(Easing.quad), useNativeDriver: nativo }).start(onFim);
  }, [v, onFim]);
  const k = largura / 300;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-60 * k, 200 * k] }) }] }]}>
      <Svg width={largura} height={(largura * 320) / 300} viewBox="0 0 300 320">
        <Path d="M150 20 C140 38 138 46 150 52 C162 46 160 38 150 20 Z" fill="#4fc3ff" />
      </Svg>
    </Animated.View>
  );
}

const EM = ['🎉', '💧', '🌸', '⭐', '💚'];
function Pedaco({ i, onFim }: { i: number; onFim?: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  const pos = useRef({ left: Math.random() * 90, atraso: Math.random() * 600 }).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 2400, delay: pos.atraso, easing: Easing.in(Easing.quad), useNativeDriver: nativo }).start(onFim);
  }, [v, pos, onFim]);
  return (
    <Animated.Text pointerEvents="none" style={[st.confete, { left: (pos.left + '%') as `${number}%`,
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 420] }) }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
      {EM[i % EM.length]}
    </Animated.Text>
  );
}
export function Confete({ onFim }: { onFim: () => void }) {
  return <>{Array.from({ length: 18 }, (_, i) => <Pedaco key={i} i={i} onFim={i === 0 ? () => setTimeout(onFim, 800) : undefined} />)}</>;
}
const st = StyleSheet.create({ confete: { position: 'absolute', top: -20, fontSize: 28 } });
