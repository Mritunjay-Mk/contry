import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Edit3, ReceiptText, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { IconButton, List, Searchbar, Text, TextInput, useTheme } from "react-native-paper";

import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { CATEGORIES } from "@/constants/categories";
import { useContryStore } from "@/store/contryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { ExpenseCategory, RootStackParamList } from "@/types";
import { formatMoney } from "@/utils/money";

export function ExpenseHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const currency = useSettingsStore((state) => state.currency);
  const expenses = useContryStore((state) => state.getGroupExpenses());
  const members = useContryStore((state) => state.getGroupMembers());
  const deleteExpense = useContryStore((state) => state.deleteExpense);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "All">("All");
  const [date, setDate] = useState("");

  const filtered = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesQuery = `${expense.description} ${expense.category}`.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "All" || expense.category === category;
        const matchesDate = !date || expense.date.slice(0, 10).includes(date);
        return matchesQuery && matchesCategory && matchesDate;
      }),
    [category, date, expenses, query]
  );

  return (
    <Screen>
      <Text variant="headlineMedium">Expense history</Text>
      <Searchbar placeholder="Search expenses" value={query} onChangeText={setQuery} />
      <TextInput label="Filter by date YYYY-MM-DD" value={date} onChangeText={setDate} mode="outlined" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <CategoryChip category="Other" label="All" selected={category === "All"} onPress={() => setCategory("All")} />
          {CATEGORIES.map((item) => (
            <CategoryChip key={item} category={item} selected={category === item} onPress={() => setCategory(item)} />
          ))}
        </View>
      </ScrollView>
      {filtered.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No expenses found" body="Adjust filters or add a new expense for this group." />
      ) : (
        filtered.map((expense) => (
          <PremiumCard key={expense.id}>
            <List.Item
              title={expense.description}
              description={`${expense.category} - ${members.find((member) => member.id === expense.paidBy)?.name ?? "Unknown"} - ${new Date(expense.date).toDateString()}`}
              left={() => <ReceiptText color={theme.colors.primary} />}
              right={() => (
                <View style={{ alignItems: "flex-end" }}>
                  <Text variant="titleMedium">{formatMoney(expense.amount, currency)}</Text>
                  <View style={{ flexDirection: "row" }}>
                    <IconButton icon={() => <Edit3 size={18} color={theme.colors.primary} />} onPress={() => navigation.navigate("ExpenseEditor", { expenseId: expense.id })} />
                    <IconButton icon={() => <Trash2 size={18} color="#EF4444" />} onPress={() => deleteExpense(expense.id)} />
                  </View>
                </View>
              )}
            />
          </PremiumCard>
        ))
      )}
    </Screen>
  );
}
