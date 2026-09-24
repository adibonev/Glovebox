import AsyncStorage from "@react-native-async-storage/async-storage";
import { shouldAskForReview } from "@glovebox/core";
import * as StoreReview from "expo-store-review";

const ASKED_ON = "glovebox.reviewPrompt.askedOn";

/** The dates we asked on, oldest first; anything unreadable counts as never having asked. */
async function askedOn(): Promise<Date[]> {
  try {
    const raw = await AsyncStorage.getItem(ASKED_ON);
    if (!raw) return [];
    return (JSON.parse(raw) as string[]).map((iso) => new Date(iso)).filter((d) => !isNaN(d.getTime()));
  } catch {
    return [];
  }
}

/**
 * Ask for a rating, if this is a good moment and a quarter has passed since the last time.
 *
 * Call it after something has just gone right, never on launch. The system prompt is the only
 * one Apple allows (Guideline 1.1.7) and it decides for itself whether to appear — we never learn
 * what the User did with it, only that we asked. Nothing here is worth an error in their face,
 * so every failure is silent.
 */
export async function maybeAskForReview(): Promise<void> {
  try {
    // False on TestFlight builds, where the prompt cannot be shown at all.
    if (!(await StoreReview.isAvailableAsync())) return;

    const asked = await askedOn();
    if (!shouldAskForReview({ askedOn: asked }, new Date())) return;

    await StoreReview.requestReview();
    // Only the last few matter, and the record is what keeps the quarter.
    const kept = [...asked, new Date()].slice(-4).map((date) => date.toISOString());
    await AsyncStorage.setItem(ASKED_ON, JSON.stringify(kept));
  } catch {
    // Never mind.
  }
}
