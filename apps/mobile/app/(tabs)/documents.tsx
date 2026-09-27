import { Ionicons } from "@expo/vector-icons";
import { colors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionMenu } from "@/components/ActionMenu";
import { useAuth } from "@/lib/auth";
import { deleteDocument, pickDocument, uploadDocument } from "@/lib/documents";
import { DELETE_FAILED } from "@/lib/erasure";
import { useDocuments, type DocView } from "@/lib/useDocuments";

/**
 * The glovebox itself: every file uploaded, by car, each saying which deadline it belongs to.
 * "Прикачи документ" asks which one, then for the file.
 */
export default function DocumentsTab() {
  const router = useRouter();
  const { session } = useAuth();
  const { groups, loading, refreshing, error, onRefresh, reload } = useDocuments();
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);

  const several = groups.length > 1;
  const records = groups.flatMap((group) =>
    group.records.map((record) => ({ ...record, label: several ? `${group.name} · ${record.label}` : record.label })),
  );
  const withFiles = groups.filter((group) => group.documents.length > 0);
  const total = withFiles.reduce((sum, group) => sum + group.documents.length, 0);

  const attach = async (serviceId: string) => {
    if (!session || busy) return;
    const file = await pickDocument();
    if (!file) return;
    setBusy(true);
    try {
      await uploadDocument(session.user.id, serviceId, file);
      await reload();
    } catch {
      Alert.alert("Документът не се качи", "Провери връзката и опитай пак.");
    } finally {
      setBusy(false);
    }
  };

  const remove = (doc: DocView) => {
    Alert.alert(`Да изтрия ли „${doc.name}“?`, undefined, [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: () => {
          deleteDocument(doc.id, doc.path)
            .then(reload)
            .catch(() => Alert.alert("Документът не е изтрит", DELETE_FAILED));
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-2xl font-semibold text-ivory">Документи</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.copper} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-8"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.copper} />}
        >
          {error && (
            <View className="mb-4 rounded-xl border border-status-expired/40 bg-panel p-4">
              <Text className="text-sm text-status-expired">{error}</Text>
            </View>
          )}

          {records.length === 0 ? (
            !error && (
              <View className="mt-16 items-center">
                <Text className="text-center text-base text-muted">Първо добави срок, към който да качиш документи.</Text>
              </View>
            )
          ) : (
            <>
              <Text className="mb-4 text-sm leading-5 text-muted">
                {total > 0
                  ? `${total} ${total === 1 ? "документ" : "документа"} към сроковете на колите ти.`
                  : "Полицата, талонът, бележката за плащане: качи ги към срока им, за да са ти под ръка."}
              </Text>
              <Pressable
                onPress={() => setChoosing(true)}
                disabled={busy}
                accessibilityRole="button"
                className="mb-6 flex-row items-center justify-center gap-2 rounded-xl bg-emerald py-3.5"
              >
                {busy ? (
                  <ActivityIndicator color={colors.ivory} />
                ) : (
                  <>
                    <Ionicons name="attach" size={18} color={colors.ivory} />
                    <Text className="text-base font-semibold text-ivory">Прикачи документ</Text>
                  </>
                )}
              </Pressable>

              {withFiles.map((group) => (
                <View key={group.vehicleId} className="mb-5">
                  {/* The car's name only helps when there are several to tell apart. */}
                  {several && <Text className="mb-2 text-base font-semibold text-ivory">{group.name}</Text>}
                  <View className="gap-2">
                    {group.documents.map((doc) => (
                      <View key={doc.id} className="flex-row items-center gap-3 rounded-xl border border-white/10 bg-panel px-3 py-3">
                        <Ionicons name={doc.isImage ? "image-outline" : "document-text-outline"} size={20} color={colors.copper} />
                        <View className="flex-1">
                          <Pressable onPress={() => doc.url && void Linking.openURL(doc.url)}>
                            <Text numberOfLines={1} className="text-sm text-ivory">
                              {doc.name}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => router.push(`/service/${doc.record.id}`)} hitSlop={4}>
                            <Text numberOfLines={1} className="mt-0.5 text-xs text-dim">
                              {doc.record.label}
                            </Text>
                          </Pressable>
                        </View>
                        <Pressable
                          onPress={() => remove(doc)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Изтрий ${doc.name}`}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.dim} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      <ActionMenu
        title="Към кой срок?"
        actions={records.map((record) => ({ label: record.label, onPress: () => void attach(record.id) }))}
        visible={choosing}
        onClose={() => setChoosing(false)}
      />
    </SafeAreaView>
  );
}
