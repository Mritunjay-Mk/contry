import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CalendarDays, Check, Edit3, Plus, ReceiptText, Trash2, UserRound } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, List, Text, useTheme } from "react-native-paper";

import { EmptyState } from "@/components/EmptyState";
import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { useContryStore } from "@/store/contryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { RootStackParamList } from "@/types";
import { formatMoney } from "@/utils/money";

export function GroupsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const currency = useSettingsStore((state) => state.currency);
  const groups = useContryStore((state) => state.groups);
  const selectedGroupId = useContryStore((state) => state.selectedGroupId);
  const members = useContryStore((state) => state.getGroupMembers());
  const expenses = useContryStore((state) => state.getGroupExpenses());
  const selectGroup = useContryStore((state) => state.selectGroup);
  const deleteGroup = useContryStore((state) => state.deleteGroup);
  const removeMember = useContryStore((state) => state.removeMember);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <Screen>
      <View>
        <Text variant="headlineMedium">Groups</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Roommates, trips, offices, teams, and every shared plan.
        </Text>
      </View>
      <Button mode="contained" icon={() => <Plus size={18} color="#FFFFFF" />} onPress={() => navigation.navigate("GroupEditor")}>
        Create group
      </Button>
      {groups.map((group) => (
        <PremiumCard key={group.id}>
          <List.Item
            title={group.name}
            description={new Date(group.createdAt).toDateString()}
            left={() => (group.id === selectedGroupId ? <Check color={theme.colors.primary} /> : null)}
            onPress={() => selectGroup(group.id)}
            right={() => (
              <View style={{ flexDirection: "row" }}>
                <IconButton icon={() => <Edit3 size={18} color={theme.colors.primary} />} onPress={() => navigation.navigate("GroupEditor", { groupId: group.id })} />
                <IconButton icon={() => <Trash2 size={18} color="#EF4444" />} onPress={() => deleteGroup(group.id)} />
              </View>
            )}
          />
        </PremiumCard>
      ))}

      <PremiumCard
        title={selectedGroup ? `${selectedGroup.name} members` : "Member details"}
        action={
          <Button compact mode="contained-tonal" icon={() => <Plus size={16} color={theme.colors.primary} />} onPress={() => navigation.navigate("MemberEditor")}>
            Add
          </Button>
        }
      >
        {members.length === 0 ? (
          <EmptyState icon={UserRound} title="No members yet" body="Add members to start splitting expenses in this group." />
        ) : (
          members.map((member) => {
            const memberPayments = expenses
              .filter((expense) => expense.paidBy === member.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const paidTotal = memberPayments.reduce((sum, expense) => sum + expense.amount, 0);

            return (
              <View key={member.id} style={[styles.memberBlock, { borderColor: theme.colors.outline }]}>
                <View style={styles.memberHeader}>
                  <View style={styles.memberTitle}>
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                      <UserRound size={18} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text variant="titleMedium">{member.name}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Total paid {formatMoney(paidTotal, currency)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.memberActions}>
                    <IconButton
                      icon={() => <Edit3 size={18} color={theme.colors.primary} />}
                      onPress={() => navigation.navigate("MemberEditor", { memberId: member.id })}
                    />
                    <IconButton icon={() => <Trash2 size={18} color="#EF4444" />} onPress={() => removeMember(member.id)} />
                  </View>
                </View>

                {memberPayments.length === 0 ? (
                  <View style={styles.paymentRow}>
                    <ReceiptText size={16} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      No payments added by this member.
                    </Text>
                  </View>
                ) : (
                  memberPayments.map((expense) => (
                    <View key={expense.id} style={styles.paymentRow}>
                      <CalendarDays size={16} color={theme.colors.primary} />
                      <View style={styles.paymentText}>
                        <Text variant="bodyMedium">{new Date(expense.date).toDateString()}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {expense.description} - {expense.category}
                        </Text>
                      </View>
                      <Text variant="titleSmall">{formatMoney(expense.amount, currency)}</Text>
                    </View>
                  ))
                )}
              </View>
            );
          })
        )}
      </PremiumCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  memberBlock: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  memberHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  memberTitle: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10
  },
  memberActions: {
    flexDirection: "row"
  },
  avatar: {
    alignItems: "center",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  paymentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 44
  },
  paymentText: {
    flex: 1
  }
});
