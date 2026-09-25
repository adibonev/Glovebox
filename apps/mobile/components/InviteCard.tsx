import { SupabaseReferralRepository, inviteLink, normalizeReferralCode } from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useEffect, useState } from "react";
import { Pressable, Share, Text, TextInput, View } from "react-native";

import { SITE_URL } from "@/lib/config";
import { supabase } from "@/lib/supabase";

const referrals = new SupabaseReferralRepository(supabase);

/**
 * "Покани приятел": the User's own link to send, how many signed up with it, and a place to
 * enter a friend's code for anyone who signed up without typing it (with Apple or Google).
 * Hidden entirely while the invites migration is not applied.
 */
export function InviteCard({ userId }: { userId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [friendCode, setFriendCode] = useState("");
  const [answer, setAnswer] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([referrals.codeFor(userId), referrals.invitedCount()])
      .then(([own, invited]) => {
        if (!active) return;
        setCode(own);
        setCount(invited);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);

  if (!code) return null;
  const link = inviteLink(SITE_URL, code);

  const send = () =>
    void Share.share({
      message: `Пробвай Glovebox. Помни кога изтичат гражданската, прегледът и винетката, и пише навреме. Ако се регистрираш от iPhone, въведи кода ${code}. ${link}`,
      url: link,
    });

  const claim = async () => {
    const normalized = normalizeReferralCode(friendCode);
    if (!normalized) {
      setAnswer({ ok: false, text: "Кодът е 6 знака, например K7Q2MX." });
      return;
    }
    try {
      const ok = await referrals.claim(normalized);
      setAnswer(
        ok
          ? { ok: true, text: "Записано. Благодарим на приятеля ти." }
          : { ok: false, text: "Кодът не важи за този акаунт." },
      );
      if (ok) setFriendCode("");
    } catch {
      setAnswer({ ok: false, text: "Не се получи. Опитай пак." });
    }
  };

  return (
    <View className="mt-4 rounded-2xl border border-copper/40 bg-panel p-4">
      <Text className="text-xs uppercase tracking-wider text-dim">Покани приятел</Text>
      <Text className="mt-2 text-base leading-6 text-ivory">
        Прати Glovebox на някого с кола. Ако се регистрира от iPhone, въвежда кода ти.
      </Text>
      <Text selectable className="mt-3 text-3xl font-semibold tracking-[6px] text-copper">
        {code}
      </Text>
      <Pressable onPress={send} className="mt-4 items-center rounded-xl bg-emerald py-3.5">
        <Text className="text-base font-semibold text-ivory">Изпрати покана</Text>
      </Pressable>
      <Text className="mt-3 text-sm text-silver">
        {count === 0
          ? "Още никой не се е регистрирал с твоя код."
          : count === 1
            ? "1 човек се регистрира с твоя код."
            : `${count} души се регистрираха с твоя код.`}
      </Text>

      <View className="my-4 h-px bg-white/10" />
      <Text className="text-sm text-muted">Имаш код от приятел?</Text>
      <View className="mt-2 flex-row gap-2">
        <TextInput
          value={friendCode}
          onChangeText={(text) => {
            setFriendCode(text);
            setAnswer(null);
          }}
          placeholder="K7Q2MX"
          placeholderTextColor={colors.dim}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          className="flex-1 rounded-xl border border-white/10 bg-ink px-4 py-3 text-base text-ivory"
        />
        <Pressable
          onPress={() => void claim()}
          disabled={!friendCode.trim()}
          className={`justify-center rounded-xl border border-white/15 px-4 ${friendCode.trim() ? "" : "opacity-50"}`}
        >
          <Text className="text-sm font-semibold text-ivory">Запиши</Text>
        </Pressable>
      </View>
      {answer && (
        <Text className={`mt-2 text-sm ${answer.ok ? "text-status-valid" : "text-status-expired"}`}>{answer.text}</Text>
      )}
    </View>
  );
}
