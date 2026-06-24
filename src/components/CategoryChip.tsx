import { Pressable, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { CATEGORY_META } from "@/constants/categories";
import { ExpenseCategory } from "@/types";

type CategoryChipProps = {
  category: ExpenseCategory;
  label?: string;
  selected?: boolean;
  onPress?: () => void;
};

export function CategoryChip({ category, label, selected, onPress }: CategoryChipProps) {
  const theme = useTheme();
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? meta.color : theme.colors.surfaceVariant,
          borderColor: selected ? meta.color : theme.colors.outline
        }
      ]}
    >
      <Icon size={15} color={selected ? "#FFFFFF" : meta.color} />
      <Text variant="labelMedium" style={{ color: selected ? "#FFFFFF" : theme.colors.onSurface }}>
        {label ?? category}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9
  }
});
