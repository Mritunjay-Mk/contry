import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Menu, TextInput } from "react-native-paper";

import { CategoryChip } from "@/components/CategoryChip";
import { Screen } from "@/components/Screen";
import { CATEGORIES } from "@/constants/categories";
import { useContryStore } from "@/store/contryStore";
import { ExpenseCategory, RootStackParamList } from "@/types";

export function ExpenseEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "ExpenseEditor">>();
  const selectedGroupId = useContryStore((state) => state.selectedGroupId);
  const members = useContryStore((state) => state.getGroupMembers());
  const expenses = useContryStore((state) => state.expenses);
  const addExpense = useContryStore((state) => state.addExpense);
  const updateExpense = useContryStore((state) => state.updateExpense);
  const expense = useMemo(() => expenses.find((item) => item.id === route.params?.expenseId), [expenses, route.params?.expenseId]);
  const scanned = route.params?.scannedExpense;
  const [amount, setAmount] = useState(String(expense?.amount ?? scanned?.amount ?? ""));
  const [description, setDescription] = useState(expense?.description ?? scanned?.description ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? scanned?.category ?? "Food");
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? members[0]?.id ?? "");
  const [menuVisible, setMenuVisible] = useState(false);

  // Once a member is added (e.g. the user just created the first one), make sure
  // "Paid by" points at a real member so saving doesn't silently fail.
  useEffect(() => {
    if (!paidBy && members.length > 0) {
      setPaidBy(members[0].id);
    }
  }, [members, paidBy]);

  const save = () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || !paidBy || !description.trim()) return;
    const payload = {
      groupId: selectedGroupId,
      amount: parsedAmount,
      paidBy,
      category,
      description: description.trim(),
      date: expense?.date ?? scanned?.date ?? new Date().toISOString(),
      merchantName: scanned?.merchantName,
      billFingerprint: scanned?.billFingerprint
    };

    if (expense) {
      updateExpense(expense.id, payload);
    } else {
      addExpense(payload);
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <TextInput label="Amount" value={amount} onChangeText={setAmount} mode="outlined" keyboardType="numeric" />
      {members.length === 0 ? (
        <Button
          mode="outlined"
          icon="account-plus"
          onPress={() => navigation.navigate("MemberEditor" as never)}
        >
          Add member
        </Button>
      ) : (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setMenuVisible(true)}>
              Paid by {members.find((member) => member.id === paidBy)?.name ?? "Select member"}
            </Button>
          }
        >
          {members.map((member) => (
            <Menu.Item
              key={member.id}
              title={member.name}
              onPress={() => {
                setPaidBy(member.id);
                setMenuVisible(false);
              }}
            />
          ))}
          <Menu.Item
            leadingIcon="account-plus"
            title="Add member"
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate("MemberEditor" as never);
            }}
          />
        </Menu>
      )}
      <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {CATEGORIES.map((item) => (
            <CategoryChip key={item} category={item} selected={item === category} onPress={() => setCategory(item)} />
          ))}
        </View>
      </ScrollView>
      <Button mode="contained" onPress={save}>
        Save expense
      </Button>
    </Screen>
  );
}
