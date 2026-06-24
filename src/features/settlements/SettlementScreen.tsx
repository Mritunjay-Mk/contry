import { CheckCircle2, HandCoins } from "lucide-react-native";
import { Button, List, Text, useTheme } from "react-native-paper";

import { EmptyState } from "@/components/EmptyState";
import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { useContryStore } from "@/store/contryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { formatMoney } from "@/utils/money";

export function SettlementScreen() {
  const theme = useTheme();
  const currency = useSettingsStore((state) => state.currency);
  const members = useContryStore((state) => state.getGroupMembers());
  const settlements = useContryStore((state) => state.getSettlements());
  const markSettlementSettled = useContryStore((state) => state.markSettlementSettled);

  return (
    <Screen>
      <Text variant="headlineMedium">Settlements</Text>
      {settlements.length === 0 ? (
        <EmptyState icon={HandCoins} title="All balanced" body="There are no pending transfers for this group." />
      ) : (
        settlements.map((settlement) => {
          const from = members.find((member) => member.id === settlement.fromMember)?.name ?? "Someone";
          const to = members.find((member) => member.id === settlement.toMember)?.name ?? "someone";

          return (
            <PremiumCard key={settlement.id}>
              <List.Item
                title={`${from} owes ${formatMoney(settlement.amount, currency)} to ${to}`}
                description={settlement.status === "settled" ? "Marked as settled" : "Pending settlement"}
                left={() => <HandCoins color={theme.colors.primary} />}
              />
              <Button
                disabled={settlement.status === "settled"}
                mode={settlement.status === "settled" ? "outlined" : "contained"}
                icon={() => <CheckCircle2 size={18} color={settlement.status === "settled" ? theme.colors.primary : "#FFFFFF"} />}
                onPress={() => markSettlementSettled(settlement.id)}
              >
                Mark as settled
              </Button>
            </PremiumCard>
          );
        })
      )}
    </Screen>
  );
}
