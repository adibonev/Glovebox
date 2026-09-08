import { useCallback, useMemo, useRef } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

/**
 * Text recognition for the mobile app, inside an invisible WebView.
 *
 * React Native has no DOM and no Web Worker, so Tesseract cannot run in it directly. A WebView
 * does have both, and the engine runs there exactly as it does on the web — on the device,
 * with the photo never leaving it. The alternative was a native module, which on Android reads
 * no Cyrillic at all (ML Kit ships models for Latin, Chinese, Devanagari, Japanese and Korean,
 * and nothing else), and the field names on the certificate are Cyrillic.
 *
 * The engine and its language data come from a CDN on first use and are cached by the WebView
 * afterwards, so the first scan on a device costs a download of a few megabytes.
 */

/** Two passes, never "bul+eng" at once: run together the models fight inside a single word. */
const PASSES = ["bul", "eng"] as const;

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js"></script>
<script>
  function post(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  window.readDocument = async function (dataUrl) {
    try {
      var texts = [];
      var passes = ${JSON.stringify(PASSES)};
      for (var i = 0; i < passes.length; i++) {
        var index = i;
        var worker = await Tesseract.createWorker(passes[i], undefined, {
          logger: function (m) {
            if (m.status === 'recognizing text') {
              post({ type: 'progress', value: (index + m.progress) / passes.length });
            }
          }
        });
        var out = await worker.recognize(dataUrl);
        texts.push(out.data.text);
        await worker.terminate();
      }
      post({ type: 'done', text: texts.join('\\n') });
    } catch (e) {
      post({ type: 'error', message: String(e && e.message ? e.message : e) });
    }
  };

  post({ type: 'ready' });
</script>
</body></html>`;

export interface DocumentReaderHandle {
  /** Recognise a `data:` image URL. Resolves with the text of both passes joined. */
  read(dataUrl: string): Promise<string>;
}

export function DocumentReader({
  onReady,
  onProgress,
  handleRef,
}: {
  onReady?: () => void;
  onProgress?: (fraction: number) => void;
  /** Filled with the imperative handle once the page is up. */
  handleRef: { current: DocumentReaderHandle | null };
}) {
  const webRef = useRef<WebView>(null);
  const pending = useRef<{ resolve: (text: string) => void; reject: (error: Error) => void } | null>(
    null,
  );

  const handle = useMemo<DocumentReaderHandle>(
    () => ({
      read(dataUrl) {
        return new Promise<string>((resolve, reject) => {
          // One recognition at a time — the previous caller is told rather than left hanging.
          pending.current?.reject(new Error("Разчитането беше прекъснато."));
          pending.current = { resolve, reject };
          webRef.current?.injectJavaScript(
            `window.readDocument(${JSON.stringify(dataUrl)}); true;`,
          );
        });
      },
    }),
    [],
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: { type?: string; text?: string; value?: number; message?: string } = {};
      try {
        message = JSON.parse(event.nativeEvent.data) as typeof message;
      } catch {
        return;
      }

      if (message.type === "ready") {
        handleRef.current = handle;
        onReady?.();
      } else if (message.type === "progress" && typeof message.value === "number") {
        onProgress?.(message.value);
      } else if (message.type === "done") {
        pending.current?.resolve(message.text ?? "");
        pending.current = null;
      } else if (message.type === "error") {
        pending.current?.reject(new Error(message.message ?? "Разчитането не сработи."));
        pending.current = null;
      }
    },
    [handle, handleRef, onProgress, onReady],
  );

  return (
    // Off-screen rather than `display: none`: a hidden WebView is throttled or never laid out
    // on some Android builds, and the engine then simply never starts.
    <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} pointerEvents="none">
      <WebView
        ref={webRef}
        source={{ html: PAGE, baseUrl: "https://cdn.jsdelivr.net" }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        onMessage={onMessage}
      />
    </View>
  );
}
