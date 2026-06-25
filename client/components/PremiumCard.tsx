import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";

type PremiumCardProps = PropsWithChildren<{
  title?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}>;

export function PremiumCard({ title, action, children, style }: PremiumCardProps) {
  const theme = useTheme();

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }, style]} elevation={1}>
      {(title || action) && (
        <View style={styles.header}>
          {title ? <Text variant="titleMedium">{title}</Text> : <View />}
          {action}
        </View>
      )}
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 16,
    gap: 14
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
