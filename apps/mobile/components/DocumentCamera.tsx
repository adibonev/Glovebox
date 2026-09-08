import { colors } from "@glovebox/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

/**
 * A camera with a guide frame, for photographing a vehicle document.
 *
 * The frame is not decoration. Every field recognition missed in testing traced back to
 * framing — a page shot at an angle, or one whose last line (the one carrying the Expiry Date)
 * fell outside the shot. What the frame encloses is exactly what gets cropped and read, so the
 * background never reaches the engine.
 */

/** A4 portrait, the shape of every Bulgarian vehicle document worth scanning. */
const PAGE_ASPECT = 210 / 297;

/** Long side to hand to recognition: enough for the small print, short of wasting seconds. */
const TARGET_LONG_SIDE = 2200;

export function DocumentCamera({
  onCapture,
  onCancel,
}: {
  /** A `data:` URL of the cropped page, ready for recognition. */
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-ink">
        <ActivityIndicator color={colors.copper} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-ink px-8">
        <Text className="text-center text-base text-silver">
          За да снимаш документа, Glovebox има нужда от достъп до камерата. Снимката остава на
          телефона ти.
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          className="rounded-xl bg-copper px-6 py-3"
        >
          <Text className="font-semibold text-ink">Разреши камерата</Text>
        </Pressable>
        <Pressable onPress={onCancel}>
          <Text className="text-sm text-silver/70">Назад</Text>
        </Pressable>
      </View>
    );
  }

  /**
   * Take the shot and cut the guide frame out of it.
   *
   * The preview fills the screen, so the picture is wider than what the User saw. The frame is
   * centred and its height is a fixed share of the preview, which is enough to map it onto the
   * captured image without measuring anything at runtime.
   */
  const capture = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1, skipProcessing: true });
      if (!photo) return;

      // Same proportions as the on-screen frame: 88% of the height, A4 wide, centred.
      const frameHeight = Math.round(photo.height * 0.88);
      const frameWidth = Math.round(frameHeight * PAGE_ASPECT);
      const width = Math.min(frameWidth, photo.width);
      const height = Math.min(frameHeight, photo.height);

      const context = ImageManipulator.ImageManipulator.manipulate(photo.uri);
      context.crop({
        originX: Math.round((photo.width - width) / 2),
        originY: Math.round((photo.height - height) / 2),
        width,
        height,
      });
      context.resize({ height: TARGET_LONG_SIDE });

      const image = await context.renderAsync();
      const saved = await image.saveAsync({
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });

      if (saved.base64) onCapture(`data:image/jpeg;base64,${saved.base64}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-ink">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        {/* The guide. Four dimmed bands leave a clear window, which reads more cleanly on a
            phone than a single translucent overlay with a hole punched in it. */}
        <View className="flex-1">
          <View className="flex-[6] bg-ink/70" />
          <View className="flex-[88] flex-row">
            <View className="flex-1 bg-ink/70" />
            <View style={{ aspectRatio: PAGE_ASPECT }}>
              <Corner className="left-0 top-0 border-l-2 border-t-2" />
              <Corner className="right-0 top-0 border-r-2 border-t-2" />
              <Corner className="bottom-0 left-0 border-b-2 border-l-2" />
              <Corner className="bottom-0 right-0 border-b-2 border-r-2" />
            </View>
            <View className="flex-1 bg-ink/70" />
          </View>
          <View className="flex-[6] bg-ink/70" />
        </View>
      </CameraView>

      <View className="gap-4 bg-ink px-6 pb-8 pt-5">
        <Text className="text-center text-sm text-silver">
          Побери <Text className="font-semibold text-ivory">целия лист</Text> в рамката —
          включително последния ред със срока. Дръж го изправен и без отблясък.
        </Text>
        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            onPress={() => void capture()}
            disabled={busy}
            className={`rounded-xl px-8 py-3 ${busy ? "bg-copper/60" : "bg-copper"}`}
          >
            <Text className="text-base font-semibold text-ink">{busy ? "Момент…" : "Снимай"}</Text>
          </Pressable>
          <Pressable onPress={onCancel} className="rounded-xl border border-white/15 px-6 py-3">
            <Text className="text-base text-silver">Отказ</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** One corner mark of the guide frame. */
function Corner({ className }: { className: string }) {
  return <View className={`absolute h-8 w-8 border-copper ${className}`} />;
}
