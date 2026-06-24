import { Share2 } from "lucide-react-native";
import { Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Button, Text, useTheme } from "react-native-paper";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { CATEGORY_META, CATEGORIES } from "@/constants/categories";
import { buildCsvReport, buildShareSummary } from "@/services/exportService";
import { useContryStore } from "@/store/contryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { formatMoney } from "@/utils/money";

export function ReportsScreen() {
  const theme = useTheme();
  const currency = useSettingsStore((state) => state.currency);
  const selectedGroupId = useContryStore((state) => state.selectedGroupId);
  const group = useContryStore((state) => state.groups.find((item) => item.id === selectedGroupId));
  const expenses = useContryStore((state) => state.getGroupExpenses());
  const members = useContryStore((state) => state.getGroupMembers());
  const settlements = useContryStore((state) => state.getSettlements());
  const stats = useContryStore((state) => state.getDashboardStats());
  const chartWidth = Dimensions.get("window").width - 64;
  const categoryData = CATEGORIES.map((category) => ({
    name: category,
    amount: expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
    color: CATEGORY_META[category].color,
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12
  })).filter((item) => item.amount > 0);

  const monthlyTotal = expenses
    .filter((expense) => expense.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const generatePDFReport = async () => {
    if (!group) {
      alert('No group selected');
      return;
    }
    try {
      // Generate HTML string for the report
      const reportText = buildShareSummary(group, expenses, members, settlements);
      // Escape HTML special characters in the report text
      const escapedText = reportText
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');

      const html = `
        <html>
          <body>
            <pre style="font-family: monospace; white-space: pre-wrap;">${escapedText}</pre>
          </body>
        </html>
      `;

      // Print to PDF and get the URI
      const { uri } = await Print.printToFileAsync({ html });
      // Share the PDF file
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Failed to create or share PDF:', error);
      alert('Failed to create or share PDF. Please try again.');
    }
  };

  return (
    <Screen>
      <Text variant="headlineMedium">Reports</Text>
      <PremiumCard title="Category split">
        {categoryData.length ? (
          <PieChart
            data={categoryData}
            width={chartWidth}
            height={220}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="12"
            chartConfig={{ color: () => theme.colors.primary }}
          />
        ) : (
          <Text>No expense data yet.</Text>
        )}
      </PremiumCard>
      <PremiumCard title="Analytics">
        <Text>Total expenses: {formatMoney(stats.totalExpense, currency)}</Text>
        <Text>Monthly spending: {formatMoney(monthlyTotal, currency)}</Text>
        <Text>Top spender: {stats.topSpender?.name ?? "None"}</Text>
      </PremiumCard>
      <PremiumCard title="Export and share">
        <Button mode="contained" icon={() => <Share2 size={18} color="#FFFFFF" />} onPress={() => group && buildShareSummary(group, expenses, members, settlements)}>
          Generate share summary
        </Button>
        <Button mode="outlined" onPress={() => buildCsvReport(expenses, members)}>
          Export CSV report
        </Button>
        <Button mode="outlined" onPress={generatePDFReport}>
          Export PDF report
        </Button>
      </PremiumCard>
    </Screen>
  );
}
