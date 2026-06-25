import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarDays, Edit3, Plus, ReceiptText, ScanLine, Trash2, UserPlus, Users, Wallet, WalletCards } from "lucide-react-native";
import { StyleSheet, View, Image } from "react-native";
import { Button, IconButton, Text, useTheme } from "react-native-paper";

import { MetricCard } from "@/components/MetricCard";
import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { useContryStore } from "@/store/contryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { RootStackParamList } from "@/types";
import { formatMoney } from "@/utils/money";

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const currency = useSettingsStore((state) => state.currency);
  const selectedGroupId = useContryStore((state) => state.selectedGroupId);
  const groups = useContryStore((state) => state.groups);
  const stats = useContryStore((state) => state.getDashboardStats());
  const members = useContryStore((state) => state.getGroupMembers());
  const expenses = useContryStore((state) => state.getGroupExpenses());
  const settlements = useContryStore((state) => state.getSettlements());
  const removeMember = useContryStore((state) => state.removeMember);
  const group = groups.find((item) => item.id === selectedGroupId);

  if (!group) {
    return (
      <Screen>
        <LinearGradient colors={["#22C55E", "#0EA5E9"]} style={styles.hero}>
          <Image source={require("../../image/Logo.png")} style={{width: 40, height: 40, marginBottom: 8}} />
          <Text variant="headlineMedium" style={styles.heroTitle}>
            Start splitting expenses
          </Text>
          <Text variant="bodyLarge" style={styles.heroSub}>
            Create your first group, add members, then add expenses.
          </Text>
        </LinearGradient>
        <PremiumCard title="Get started">
          <Button mode="contained" icon={() => <Plus size={18} color="#FFFFFF" />} onPress={() => navigation.navigate("GroupEditor")}>
            Create Group
          </Button>
        </PremiumCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <LinearGradient colors={["#22C55E", "#0EA5E9"]} style={styles.hero}>
        <Image source={require("../../image/Logo.png")} style={{width: 40, height: 40, marginBottom: 8}} />
        <Text variant="headlineMedium" style={styles.heroTitle}>
          {group?.name ?? "Create a group"}
        </Text>
        <Text variant="displaySmall" style={styles.heroAmount}>
          {formatMoney(stats.totalExpense, currency)}
        </Text>
        <Text variant="bodyMedium" style={styles.heroSub}>
          Total shared expenses
        </Text>
      </LinearGradient>

      <View style={styles.grid}>
        <MetricCard label="Members" value={`${stats.totalMembers}`} icon={Users} />
        <MetricCard label="Per person" value={formatMoney(stats.perPersonCost, currency)} icon={Wallet} />
      </View>
      <PremiumCard title="Pending settlement">
        <View style={styles.settlementTotal}>
          <WalletCards size={20} color={theme.colors.primary} />
          <Text variant="headlineSmall">{formatMoney(stats.pendingSettlement, currency)}</Text>
        </View>
        {settlements.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No pending amount.
          </Text>
        ) : (
          settlements.map((settlement) => {
            const from = members.find((member) => member.id === settlement.fromMember)?.name ?? "Member";
            const to = members.find((member) => member.id === settlement.toMember)?.name ?? "Member";

            return (
              <View key={settlement.id} style={styles.settlementRow}>
                <Text variant="bodyMedium" style={styles.settlementText}>
                  {from} pays {to}
                </Text>
                <Text variant="titleMedium">{formatMoney(settlement.amount, currency)}</Text>
              </View>
            );
          })
        )}
      </PremiumCard>

      <PremiumCard title="Quick actions">
        <View style={styles.actions}>
          <Button mode="contained" icon={() => <Plus size={18} color="#FFFFFF" />} onPress={() => navigation.navigate("ExpenseEditor")}>
            Add Expense
          </Button>
          <Button
            mode="outlined"
            icon={() => <ScanLine size={18} color={theme.colors.primary} />}
            onPress={() => navigation.navigate("MainTabs", { screen: "Scanner" })}
          >
            Scan Bill
          </Button>
          <Button mode="outlined" icon={() => <UserPlus size={18} color={theme.colors.primary} />} onPress={() => navigation.navigate("MemberEditor")}>
            Add Member
          </Button>
        </View>
      </PremiumCard>

      <PremiumCard
        title="Members"
        action={
          <Button compact mode="contained-tonal" icon={() => <UserPlus size={16} color={theme.colors.primary} />} onPress={() => navigation.navigate("MemberEditor")}>
            Add
          </Button>
        }
      >
        {members.map((member) => {
          const memberPayments = expenses
            .filter((expense) => expense.paidBy === member.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const paidTotal = memberPayments.reduce((sum, expense) => sum + expense.amount, 0);

          return (
            <View key={member.id} style={[styles.memberBlock, { borderColor: theme.colors.outline }]}>
              <View style={styles.memberHeader}>
                <View style={styles.memberTitle}>
                  <View style={[styles.memberIcon, { backgroundColor: theme.colors.primary }]}>
                    <Users size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text variant="titleMedium">{member.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Paid {formatMoney(paidTotal, currency)}
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
                    No payment added yet.
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
        })}
      </PremiumCard>

      <PremiumCard title="Smart balance">
        <Text variant="bodyLarge">
          {stats.topSpender ? `${stats.topSpender.name} is currently the top spender.` : "Add members and expenses to see insights."}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Contry recalculates balances and settlements automatically whenever an expense changes.
        </Text>
      </PremiumCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 8,
    minHeight: 210,
    justifyContent: "flex-end",
    padding: 20
  },
  heroLabel: { color: "rgba(255,255,255,0.8)" },
  heroTitle: { color: "#FFFFFF", fontWeight: "700" },
  heroAmount: { color: "#FFFFFF", fontWeight: "800", marginTop: 16 },
  heroSub: { color: "rgba(255,255,255,0.86)" },
  grid: { flexDirection: "row", gap: 12 },
  actions: { gap: 10 },
  settlementTotal: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  settlementRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 36
  },
  settlementText: {
    flex: 1
  },
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
  memberIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  memberActions: {
    flexDirection: "row"
  },
  paymentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 42
  },
  paymentText: {
    flex: 1
  }
});