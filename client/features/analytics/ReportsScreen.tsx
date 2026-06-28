import { Share2 } from "lucide-react-native";
import { Dimensions, View } from "react-native";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";
import * as RNP from "react-native-paper";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { CATEGORY_META, CATEGORIES } from "@/constants/categories";
import { buildCsvReport, buildShareSummary } from "@/services/exportService";
import { useContryStore } from "@/store/contryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { formatMoney } from "@/utils/money";
import { repository } from "@/database/repository";
import { Group, Member, Expense, Settlement } from "@/types";

// Helper function to convert hex color to RGB string
const hexToRgb = (hex) => {
  // Remove the # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-digit hex format (e.g., #RGB)
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16);
    const g = parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16);
    const b = parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16);
    return `${r},${g},${b}`;
  }

  // Handle 6-digit hex format (e.g., #RRGGBB)
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r},${g},${b}`;
  }

  // If we can't parse it, return a default value
  return "0,0,0";
};

export function ReportsScreen() {
  const theme = RNP.useTheme();
  const currency = useSettingsStore((state) => state.currency);
  const selectedGroupId = useContryStore((state) => state.selectedGroupId);
  const group = useContryStore((state) => state.groups.find((item) => item.id === selectedGroupId));
  const expenses = useContryStore((state) => state.getGroupExpenses()) || [];
  const members = useContryStore((state) => state.getGroupMembers()) || [];
  const settlements = useContryStore((state) => state.getSettlements()) || [];
  const stats = useContryStore((state) => state.getDashboardStats()) || {
    totalExpense: 0,
    totalMembers: 0,
    perPersonCost: 0,
    pendingSettlement: 0,
    topSpender: null
  };
  const chartWidth = Dimensions.get("window").width - 64;
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar' | 'line'>('pie');

  // Calculate category data - always returns an array
  const categoryData = CATEGORIES.map((category) => ({
    name: category,
    amount: expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0),
    color: CATEGORY_META[category].color,
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12
  })).filter((item) => item.amount > 0);

  // BarChart and LineChart expect a { labels, datasets } shape rather than the
  // accessor-based array that PieChart uses.
  const seriesData = {
    labels: categoryData.map((item) => item.name),
    datasets: [{ data: categoryData.map((item) => item.amount) }],
  };

  const handleBackup = async () => {
    try {
      const groups = repository.getGroups();
      const members = repository.getMembers();
      const expenses = repository.getExpenses();
      const settlements = repository.getSettlements();
      const data = { groups, members, expenses, settlements };
      const json = JSON.stringify(data, null, 2);
      const fileName = 'cnt_backup.json';
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
      RNP.Alert.alert('Backup', 'Backup file shared successfully.');
    } catch (err) {
      console.error(err);
      RNP.Alert.alert('Backup failed', 'Could not create backup.');
    }
  };

  const handleRestorePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (!result.cancelled) {
        const content = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.UTF8 });
        const parsed = JSON.parse(content);
        // Basic validation
        if (
          Array.isArray(parsed.groups) &&
          Array.isArray(parsed.members) &&
          Array.isArray(parsed.expenses) &&
          Array.isArray(parsed.settlements)
        ) {
          setBackupData(parsed);
          setSelectedTypes(['groups', 'members', 'expenses', 'settlements']);
          setSelectAll(true);
          setRestoreVisible(true);
        } else {
          RNP.Alert.alert('Invalid backup', 'The selected file does not contain valid data.');
        }
      }
    } catch (err) {
      console.error(err);
      RNP.Alert.alert('Restore failed', 'Could not read the selected file.');
    }
  };

  const handleRestoreConfirm = async () => {
    RNP.Alert.alert(
      'Confirm Restore',
      'This will replace the selected data with the backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              if (!backupData) return;
              // Delete selected types
              if (selectAll || selectedTypes.includes('groups')) {
                repository.deleteAllGroups();
                for (const g of backupData.groups) {
                  repository.upsertGroup(g);
                }
              }
              if (selectAll || selectedTypes.includes('members')) {
                repository.deleteAllMembers();
                for (const m of backupData.members) {
                  repository.upsertMember(m);
                }
              }
              if (selectAll || selectedTypes.includes('expenses')) {
                repository.deleteAllExpenses();
                for (const e of backupData.expenses) {
                  repository.upsertExpense(e);
                }
              }
              if (selectAll || selectedTypes.includes('settlements')) {
                repository.deleteAllSettlements();
                for (const s of backupData.settlements) {
                  repository.upsertSettlement(s);
                }
              }
              RNP.Alert.alert('Restore complete', 'Data has been restored.');
              setRestoreVisible(false);
              setBackupData(null);
            } catch (err) {
              console.error(err);
              RNP.Alert.alert('Restore failed', 'Could not restore data.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

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
        .replace(/</g, '&')
        .replace(/>/g, '&')
        .replace(/"/g, '&')
        .replace(/'/g, '&#039;');

      // HTML template for PDF generation
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

  // State for backup/restore
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['groups', 'members', 'expenses', 'settlements']);
  const [selectAll, setSelectAll] = useState(true);
  const [backupData, setBackupData] = useState(null);

  return (
    <Screen>
      <RNP.Text variant="headlineMedium">Reports</RNP.Text>
      <View style={{ marginVertical: 16 }}>
        <RNP.SegmentedButtons
          value={selectedChartType}
          onValueChange={setSelectedChartType}
          buttons={[
            { value: 'pie', label: 'Pie' },
            { value: 'bar', label: 'Bar' },
            { value: 'line', label: 'Line' }
          ]}
        />
      </View>
      <PremiumCard title="Category split">
        {categoryData.length > 0 ? (
          <>
            {selectedChartType === 'pie' && (
              <PieChart
                data={categoryData}
                width={chartWidth}
                height={220}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft={12}
                chartConfig={{ color: () => theme.colors.primary }}
              />
            )}
            {selectedChartType === 'bar' && (
              <BarChart
                data={seriesData}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                chartConfig={{
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: opacity => `rgba(${hexToRgb(theme.colors.primary)}, ${opacity})`,
                  labelColor: opacity => `rgba(${hexToRgb(theme.colors.onSurface)}, ${opacity})`,
                  strokeWidth: 2,
                }}
                style={{
                  borderRadius: 16
                }}
              />
            )}
            {selectedChartType === 'line' && (
              <LineChart
                data={seriesData}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                withDots={false}
                chartConfig={{
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: opacity => `rgba(${hexToRgb(theme.colors.primary)}, ${opacity})`,
                  labelColor: opacity => `rgba(${hexToRgb(theme.colors.onSurface)}, ${opacity})`,
                  strokeWidth: 2,
                }}
                bezier
                style={{
                  borderRadius: 16
                }}
              />
            )}
          </>
        ) : (
          <RNP.Text>No expense data yet.</RNP.Text>
        )}
      </PremiumCard>
      <PremiumCard title="Analytics">
        <RNP.Text>Total expenses: {formatMoney(stats.totalExpense, currency)}</RNP.Text>
        <RNP.Text>Monthly spending: {formatMoney(monthlyTotal, currency)}</RNP.Text>
        <RNP.Text>Top spender: {stats.topSpender?.name ?? "None"}</RNP.Text>
      </PremiumCard>
      <PremiumCard title="Export and share">
        <RNP.Button mode="contained" icon={() => <Share2 size={18} color="#FFFFFF" />} onPress={async () => {
          if (!group) return;
          try {
            const shareText = buildShareSummary(group, expenses, members, settlements);
            const file = await FileSystem.writeAsStringAsync(
              `${FileSystem.documentDirectory}share.txt`,
              shareText,
              { encoding: FileSystem.EncodingType.UTF8 }
            );
            await Sharing.shareAsync(file.uri, { mimeType: 'text/plain' });
          } catch (err) {
            console.error(err);
            RNP.Alert.alert('Failed to share summary');
          }
        }}>
          Generate share summary
        </RNP.Button>
        <RNP.Button mode="outlined" onPress={async () => {
          try {
            const csv = buildCsvReport(expenses, members);
            const file = await FileSystem.writeAsStringAsync(
              `${FileSystem.documentDirectory}report.csv`,
              csv,
              { encoding: FileSystem.EncodingType.UTF8 }
            );
            await Sharing.shareAsync(file.uri, { mimeType: 'text/csv' });
          } catch (err) {
            console.error(err);
            RNP.Alert.alert('Failed to export CSV');
          }
        }}>
          Export CSV report
        </RNP.Button>
        <RNP.Button mode="outlined" onPress={generatePDFReport}>
          Export PDF report
        </RNP.Button>
        <RNP.Button mode="outlined" onPress={handleBackup}>
          Backup Data
        </RNP.Button>
        <RNP.Button mode="outlined" onPress={handleRestorePick}>
          Restore Data
        </RNP.Button>
      </PremiumCard>
    <RNP.Modal visible={restoreVisible} onDismiss={() => setRestoreVisible(false)}>
      <View style={{ backgroundColor: '#fff', padding: 24, margin: 24, borderRadius: 8 }}>
        <RNP.Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          Restore Data
        </RNP.Text>
        <View style={{ marginBottom: 12 }}>
          <RNP.Checkbox
            value={selectAll}
            onValueChange={(v) => {
              setSelectAll(v);
              if (v) {
                setSelectedTypes(['groups', 'members', 'expenses', 'settlements']);
              } else {
                setSelectedTypes([]);
              }
            }}
          />
          <RNP.Text style={{ marginLeft: 8 }}>Select All</RNP.Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <RNP.Checkbox
            value={selectedTypes.includes('groups')}
            onValueChange={(v) => {
              const idx = selectedTypes.indexOf('groups');
              if (v && idx === -1) setSelectedTypes([...selectedTypes, 'groups']);
              if (!v && idx !== -1) setSelectedTypes(selectedTypes.filter(t => t !== 'groups'));
            }}
          />
          <RNP.Text style={{ marginLeft: 8 }}>Groups</RNP.Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <RNP.Checkbox
            value={selectedTypes.includes('members')}
            onValueChange={(v) => {
              const idx = selectedTypes.indexOf('members');
              if (v && idx === -1) setSelectedTypes([...selectedTypes, 'members']);
              if (!v && idx !== -1) setSelectedTypes(selectedTypes.filter(t => t !== 'members'));
            }}
          />
          <RNP.Text style={{ marginLeft: 8 }}>Members</RNP.Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <RNP.Checkbox
            value={selectedTypes.includes('expenses')}
            onValueChange={(v) => {
              const idx = selectedTypes.indexOf('expenses');
              if (v && idx === -1) setSelectedTypes([...selectedTypes, 'expenses']);
              if (!v && idx !== -1) setSelectedTypes(selectedTypes.filter(t => t !== 'expenses'));
            }}
          />
          <RNP.Text style={{ marginLeft: 8 }}>Expenses</RNP.Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <RNP.Checkbox
            value={selectedTypes.includes('settlements')}
            onValueChange={(v) => {
              const idx = selectedTypes.indexOf('settlements');
              if (v && idx === -1) setSelectedTypes([...selectedTypes, 'settlements']);
              if (!v && idx !== -1) setSelectedTypes(selectedTypes.filter(t => t !== 'settlements'));
            }}
          />
          <RNP.Text style={{ marginLeft: 8 }}>Settlements</RNP.Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 }}>
          <RNP.Button mode="text" onPress={() => setRestoreVisible(false)} style={{ marginRight: 12 }}>
            Cancel
          </RNP.Button>
          <RNP.Button mode="contained" onPress={handleRestoreConfirm}>
            Restore
          </RNP.Button>
        </View>
      </View>
    </RNP.Modal>
    </Screen>
  );
}