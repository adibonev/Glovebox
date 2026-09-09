import { colors } from "@glovebox/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

/** `zoom` is 0–1 across whatever range the lens has; this is a comfortable step on both OSes. */
const ZOOM_STEP = 0.05;

export function DocumentCamera({
  onCapture,
  onCancel,
}: {
  /** A `data:` URL of the cropped page, ready for recognition. */
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [busy, setBusy] = useState(false);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [lens, setLens] = useState<string | undefined>(undefined);
  const [focusing, setFocusing] = useState(false);

  /**
   * Pick the ordinary rear lens.
   *
   * Left alone, iOS hands back the virtual camera that can switch to the ultra-wide, and a page
   * of small print shot through it comes out barrel-distorted and soft at the edges — exactly
   * where the last line with the Expiry Date sits. Names come from the OS, so the choice is by
   * exclusion: anything but ultra-wide, telephoto or the multi-lens virtual devices.
   */
  const onCameraReady = useCallback(async () => {
    try {
      const lenses = (await cameraRef.current?.getAvailableLensesAsync()) ?? [];
      const plain = lenses.find((name) => /wide/i.test(name) && !/ultra|dual|triple|tele/i.test(name));
      setLens(plain ?? lenses.find((name) => !/ultra|tele/i.test(name)));
    } catch {
      // Not fatal: without a choice the OS default still takes a picture.
    }
  }, []);

  /** expo-camera exposes no focus point, but dropping autofocus and restoring it re-runs it. */
  const refocus = useCallback(() => {
    setFocusing(true);
    setTimeout(() => setFocusing(false), 350);
  }, []);

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
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        selectedLens={lens}
        zoom={zoom}
        enableTorch={torch}
        autofocus={focusing ? "off" : "on"}
        animateShutter={false}
        onCameraReady={() => void onCameraReady()}
      >
        {/* Tapping the preview re-runs autofocus, the way a camera app behaves. */}
        <Pressable className="flex-1" onPress={refocus}>
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
        </Pressable>

        {/* Close and torch ride over the preview, clear of the notch. */}
        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-5"
          style={{ top: insets.top + 8 }}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            accessibilityLabel="Затвори камерата"
            className="h-11 w-11 items-center justify-center rounded-full bg-ink/70"
          >
            <Text className="text-2xl leading-none text-ivory">✕</Text>
          </Pressable>

          <Pressable
            onPress={() => setTorch((on) => !on)}
            hitSlop={12}
            accessibilityLabel={torch ? "Изключи светкавицата" : "Включи светкавицата"}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              torch ? "bg-copper" : "bg-ink/70"
            }`}
          >
            <Text className={`text-xl leading-none ${torch ? "text-ink" : "text-ivory"}`}>⚡</Text>
          </Pressable>
        </View>

        {focusing && (
          <View
            pointerEvents="none"
            className="absolute self-center rounded-lg border-2 border-copper"
            style={{ width: 76, height: 76, top: "44%" }}
          />
        )}
      </CameraView>

      <View className="gap-4 bg-ink px-6 pb-8 pt-4">
        <Text className="text-center text-sm text-silver">
          Побери <Text className="font-semibold text-ivory">целия лист</Text> в рамката —
          включително последния ред със срока. Докосни екрана, за да фокусираш.
        </Text>

        <View className="flex-row items-center justify-center gap-4">
          <ZoomButton label="−" onPress={() => setZoom((z) => Math.max(0, z - ZOOM_STEP))} />
          <Text className="w-16 text-center text-sm text-muted">
            {zoom === 0 ? "без зум" : `+${Math.round(zoom * 100)}%`}
          </Text>
          <ZoomButton label="+" onPress={() => setZoom((z) => Math.min(1, z + ZOOM_STEP))} />
        </View>

        {/* The shutter: a round button in the middle, where a thumb expects it. */}
        <View className="items-center">
          <Pressable
            onPress={() => void capture()}
            disabled={busy}
            accessibilityLabel="Снимай документа"
            className="h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-ivory/80"
          >
            <View
              className={`h-[60px] w-[60px] items-center justify-center rounded-full ${
                busy ? "bg-ivory/40" : "bg-ivory"
              }`}
            >
              {busy && <ActivityIndicator color={colors.ink} />}
            </View>
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

function ZoomButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      className="h-10 w-10 items-center justify-center rounded-full border border-white/20"
    >
      <Text className="text-xl leading-none text-ivory">{label}</Text>
    </Pressable>
  );
}
