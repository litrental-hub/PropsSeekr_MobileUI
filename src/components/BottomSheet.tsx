import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  PanResponder,
  ScrollView,
  Platform,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Use screen dimensions (includes status bar & nav bar) instead of window
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { colors } = useAppTheme();
  const [isRendered, setIsRendered] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const isClosing = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      slideAnim.setValue(SCREEN_H);
      setIsRendered(true);
      setTimeout(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 3,
          speed: 14,
        }).start();
      }, 30);
    } else if (isRendered && !isClosing.current) {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    Animated.timing(slideAnim, {
      toValue: SCREEN_H,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setIsRendered(false);
      isClosing.current = false;
      onClose();
    });
  };

  if (!isRendered) return null;

  return (
    <Modal
      visible={isRendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/*
        Use explicit pixel dimensions instead of flex:1.
        flex:1 is unreliable inside transparent Modals on React Native New Architecture.
        This guarantees the overlay covers 100% of the physical screen.
      */}
      <View style={styles.container}>
        {/* Dim overlay — tap to close */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Bottom sheet card with solid background */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.navy, // Solid background prevents transparency bleed
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    // Explicit dimensions guarantee full-screen coverage in RN New Architecture
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    // Fills remaining space above the sheet; tappable to dismiss
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    // Elevation ensures the sheet renders above the backdrop on Android
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    // Explicit opaque background prevents any bleed-through
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
