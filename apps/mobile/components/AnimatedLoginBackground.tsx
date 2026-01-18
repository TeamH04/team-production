import { palette } from '@team/mobile-ui';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// 背景のアニメーション用の定数
export const MESH_COLORS = {
  base: '#4A5749',
  accent1: '#5B6B5A',
  accent2: '#7A8C79',
  accent3: '#3D473C',
  highlight: '#ffffff15',
} as const;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type FloatingCircleProps = {
  cx: number;
  cy: number;
  r: number;
  duration: number;
  delay: number;
};

const FloatingCircle = ({ cx, cy, r, duration, delay }: FloatingCircleProps) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSequence(
        withTiming(-5, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withRepeat(withTiming(5, { duration, easing: Easing.inOut(Easing.ease) }), -1, true),
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.9, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, opacity, translateY]);

  const animatedProps = useAnimatedProps(() => ({
    cy: cy + translateY.value,
    opacity: opacity.value,
  }));

  return <AnimatedCircle cx={cx} r={r} fill='url(#star_grad)' animatedProps={animatedProps} />;
};

type AnimatedMeshBlobProps = {
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  duration: number;
};

const AnimatedMeshBlob = ({ initialX, initialY, size, color, duration }: AnimatedMeshBlobProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(Math.random() * 100 - 50, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    translateY.value = withRepeat(
      withTiming(Math.random() * 100 - 50, {
        duration: duration * 1.2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    scale.value = withRepeat(
      withTiming(1.3, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [duration, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + initialX },
      { translateY: translateY.value + initialY },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

export function AnimatedLoginBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.backgroundContainer]}>
      <AnimatedMeshBlob
        initialX={-width * 0.2}
        initialY={-height * 0.1}
        size={width * 1.2}
        color={MESH_COLORS.accent1}
        duration={10000}
      />
      <AnimatedMeshBlob
        initialX={width * 0.5}
        initialY={height * 0.3}
        size={width * 1.5}
        color={MESH_COLORS.accent2}
        duration={15000}
      />
      <AnimatedMeshBlob
        initialX={width * 0.1}
        initialY={height * 0.7}
        size={width * 1.3}
        color={MESH_COLORS.accent3}
        duration={12000}
      />

      <View style={[StyleSheet.absoluteFill, styles.overlay]} />

      <Svg height='100%' width='100%' style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id='star_grad' cx='50%' cy='50%' r='50%'>
            <Stop offset='0%' stopColor='white' stopOpacity='0.8' />
            <Stop offset='100%' stopColor='white' stopOpacity='0' />
          </RadialGradient>
        </Defs>
        <FloatingCircle cx={width * 0.3} cy={height * 0.2} r={2} duration={3000} delay={0} />
        <FloatingCircle cx={width * 0.7} cy={height * 0.4} r={1.5} duration={4000} delay={500} />
        <FloatingCircle cx={width * 0.1} cy={height * 0.8} r={2.5} duration={5000} delay={1000} />
        <FloatingCircle cx={width * 0.9} cy={height * 0.1} r={1.2} duration={3500} delay={200} />
        <FloatingCircle cx={width * 0.5} cy={height * 0.6} r={2} duration={4500} delay={800} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    backgroundColor: MESH_COLORS.base,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
  },
  overlay: {
    backgroundColor: palette.overlay,
  },
});
