import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { colors, radii } from '../theme';

type ToastItem = { id: number; message: string; type: 'info' | 'success' | 'error' };
type ToastCtx = { show: (message: string, type?: ToastItem['type']) => void };

const Ctx = createContext<ToastCtx>({ show: () => {} });
export const useToast = () => useContext(Ctx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, message, type }]);
    setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <View pointerEvents="box-none" style={styles.host}>
        {items.map((it) => (
          <ToastItemView key={it.id} item={it} onClose={() => setItems((p) => p.filter((i) => i.id !== it.id))} />
        ))}
      </View>
    </Ctx.Provider>
  );
};

const ToastItemView: React.FC<{ item: ToastItem; onClose: () => void }> = ({ item, onClose }) => {
  const [op] = useState(new Animated.Value(0));
  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [op]);
  const color = item.type === 'success' ? colors.success : item.type === 'error' ? colors.danger : colors.primary;
  return (
    <Animated.View style={[styles.toast, { borderColor: color, opacity: op }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.msg} numberOfLines={3}>
        {item.message}
      </Text>
      <TouchableOpacity onPress={onClose} testID="toast-close">
        <Text style={{ color: colors.textMuted, paddingHorizontal: 8 }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 60, left: 16, right: 16, zIndex: 9999, gap: 8 },
  toast: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  msg: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
});
