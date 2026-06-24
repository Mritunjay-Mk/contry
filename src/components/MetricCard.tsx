import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { LucideIcon } from "lucide-react-native";

type MetricCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={[styles.icon, { backgroundColor: theme.colors.primary }]}>
        <Icon size={18} color="#FFFFFF" />
      </View>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="titleLarge">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    flex: 1,
    gap: 8,
    minHeight: 116,
    padding: 14
  },
  icon: {
    alignItems: "center",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34
  }
});
