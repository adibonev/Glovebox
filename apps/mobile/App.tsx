import { StyleSheet, Text, View } from "react-native";

import { colors } from "@glovebox/ui";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>PHASE 0 · SCAFFOLD</Text>
      <Text style={styles.title}>Glovebox</Text>
      <Text style={styles.body}>
        Споделените дизайн токени се зареждат от @glovebox/ui.
      </Text>
      <View style={styles.swatch} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  kicker: {
    color: colors.copper,
    fontSize: 12,
    letterSpacing: 2,
  },
  title: {
    color: colors.ivory,
    fontSize: 40,
  },
  body: {
    color: colors.silver,
    textAlign: "center",
  },
  swatch: {
    width: 96,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.emerald,
  },
});
