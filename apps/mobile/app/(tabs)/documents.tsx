import { Ionicons } from "@expo/vector-icons";
import { colors } from "@glovebox/ui";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { deleteDocument, pickDocument, uploadDocument } from "@/lib/documents";
import { useDocuments } from "@/lib/useDocuments";

export default function DocumentsTab() {
  const { session } = useAuth();
  const { groups, userId, loading, refreshing, error, onRefresh, reload } = useDocuments();
  const [busy, setBusy] = useState(false);

  const attach = async (serviceId: string) => {
    if (!session || !userId || busy) return;
    const file = await pickDocument();
    if (!file) return;
    setBusy(true);
    try {
      await uploadDocument(session.user.id, userId, serviceId, file);
      await reload();
    } catch (e) {
      Alert.alert("Грешка", e instanceof Error ? e.message : "Качването не успя.");
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string, path: string, name: string) => {
    Alert.alert("Изтриване", `Изтрий „${name}"?`, [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDocument(id, path);
            await reload();
          } catch (e) {
            Alert.alert("Грешка", e instanceof Error ? e.message : "Изтриването не успя.");
          }
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

          {groups.length === 0 && !error ? (
            <View className="mt-16 items-center">
              <Text className="text-center text-base text-muted">Още няма услуги.</Text>
              <Text className="mt-1 text-center text-sm text-dim">
                Добави услуга и прикачи документ към нея.
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.vehicleId} className="mb-5">
                <Text className="mb-2 text-base font-semibold text-ivory">{group.name}</Text>
                {group.services.map((service) => (
                  <View key={service.serviceId} className="mb-3 rounded-2xl border border-white/10 bg-panel p-4">
                    <View className="mb-2 flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-sm text-ivory">{service.typeLabel}</Text>
                        <Text className="text-xs text-dim">изтича {service.expiryLabel}</Text>
                      </View>
                      <Pressable onPress={() => attach(service.serviceId)} hitSlop={8} className="flex-row items-center gap-1">
                        <Ionicons name="add" size={16} color={colors.copper} />
                        <Text className="text-sm font-semibold text-copper">Документ</Text>
                      </Pressable>
                    </View>

                    {service.documents.length === 0 ? (
                      <Text className="text-xs text-dim">Няма прикачени документи</Text>
                    ) : (
                      <View className="gap-2">
                        {service.documents.map((doc) => (
                          <View
                            key={doc.id}
                            className="flex-row items-center gap-2 rounded-xl border border-white/10 bg-ink2 px-3 py-2"
                          >
                            <Ionicons
                              name={doc.isImage ? "image-outline" : "document-text-outline"}
                              size={16}
                              color={colors.silver}
                            />
                            <Pressable
                              className="flex-1"
                              onPress={() => {
                                if (doc.url) void Linking.openURL(doc.url);
                              }}
                            >
                              <Text numberOfLines={1} className="text-sm text-muted">
                                {doc.name}
                              </Text>
                            </Pressable>
                            <Pressable onPress={() => remove(doc.id, doc.path, doc.name)} hitSlop={8}>
                              <Ionicons name="trash-outline" size={16} color={colors.dim} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))
          )}

          {busy && (
            <View className="mt-2 items-center">
              <ActivityIndicator color={colors.copper} />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
