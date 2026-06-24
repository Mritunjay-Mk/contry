import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { LucideIcon } from "lucide-react-native";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export function EmptyState({ icon: Icon, title, body }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Icon size={28} color={theme.colors.primary} />
      <Text variant="titleMedium">{title}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 8,
    gap: 8,
    padding: 22
  }
});
