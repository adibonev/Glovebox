import { useRef } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type MenuAction = { label: string; onPress: () => void; destructive?: boolean };

/**
 * A short list of actions rising from the bottom: what a card's ⋯ opens. The same sheet on both
 * phones (an Android alert holds three buttons at most). A chosen action runs once the sheet is
 * gone, so a confirmation it asks for is not lost behind the closing sheet on iOS.
 */
export function ActionMenu({
  title,
  actions,
  visible,
  onClose,
}: {
  title?: string;
  actions: MenuAction[];
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const pending = useRef<(() => void) | null>(null);

  const flush = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const choose = (action: MenuAction) => {
    pending.current = action.onPress;
    onClose();
    // Only iOS reports the end of the closing animation (onDismiss).
    if (Platform.OS !== "ios") setTimeout(flush, 0);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onDismiss={flush}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} accessibilityLabel="Затвори" />
      <View
        className="rounded-t-3xl border-t border-white/10 bg-panel2 px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {title && <Text className="pb-2 text-center text-sm text-muted">{title}</Text>}
        {/* A long list (every Service Record, to attach a file to) scrolls within the sheet. */}
        <ScrollView style={{ maxHeight: height * 0.55 }} bounces={false}>
          {actions.map((action, index) => (
            <Pressable
              key={`${index}-${action.label}`}
              onPress={() => choose(action)}
              accessibilityRole="button"
              className="border-t border-white/[0.06] py-4"
            >
              <Text className={`text-center text-base ${action.destructive ? "text-status-expired" : "text-ivory"}`}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={onClose} accessibilityRole="button" className="mt-2 rounded-xl bg-white/[0.06] py-4">
          <Text className="text-center text-base font-semibold text-ivory">Отказ</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
