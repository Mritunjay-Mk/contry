import { Share2 } from "lucide-react-native";
import { Dimensions, View, FlatList } from "react-native";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";
import { Button, Text, useTheme, Picker, Modal, CheckBox, View as RNView, Text as RNText, Alert } from "react-native-paper";
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
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const categoryData = CATEGORIES.map((category) => ({
    name: category,
    amount: expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
    color: CATEGORY_META[category].color,
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12
  })).filter((item) => item.amount > 0);

  // State for backup/restore
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['groups', 'members', 'expenses', 'settlements']);
  const [selectAll, setSelectAll] = useState(true);
  const [backupData, setBackupData] = useState(null);

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
      Alert.alert('Backup', 'Backup file shared successfully.');
    } catch (err) {
      console.error(err);
      Alert.alert('Backup failed', 'Could not create backup.');
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
          Alert.alert('Invalid backup', 'The selected file does not contain valid data.');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Restore failed', 'Could not read the selected file.');
    }
  };

  const handleRestoreConfirm = async () => {
    Alert.alert(
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
              Alert.alert('Restore complete', 'Data has been restored.');
              setRestoreVisible(false);
              setBackupData(null);
            } catch (err) {
              console.error(err);
              Alert.alert('Restore failed', 'Could not restore data.');
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
      <View style={{ marginVertical: 16 }}>
        <Picker
          mode="dropdown"
          placeholder="Select chart type"
          value={selectedChartType}
          onValueChange={value => setSelectedChartType(value as 'pie' | 'bar' | 'line')}
          style={{ width: chartWidth, marginLeft: 12 }}
        >
          <Picker.Item label="Pie Chart" value="pie" />
          <Picker.Item label="Bar Chart" value="bar" />
          <Picker.Item label="Line Chart" value="line" />
        </Picker>
      </View>
      <PremiumCard title="Category split">
        {categoryData.length ? (
          <>
            {selectedChartType === 'pie' && (
              <PieChart
                data={categoryData}
                width={chartWidth}
                height={220}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="12"
                chartConfig={{ color: () => theme.colors.primary }}
              />
            )}
            {selectedChartType === 'bar' && (
              <BarChart
                data={categoryData}
                width={chartWidth}
                height={220}
                accessor="amount"
                backgroundColor="transparent"
                chartConfig={{
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  color: (opacity: any) => `rgba(${theme.colors.rgb}, ${opacity})`,
                  labelColor: (opacity: any) => `rgba(${theme.colors.rgb}, ${opacity})`,
                  strokeWidth: 2,
                  spacingBetweenColumns: 10,
                  gradientPinchOff: () => theme.colors.primary,
                }}
                bezier
                style={{
                  borderRadius: 16,
                }}
              />
            )}
            {selectedChartType === 'line' && (
              <LineChart
                data={categoryData}
                width={chartWidth}
                height={220}
                accessor="amount"
                backgroundColor="transparent"
                chartConfig={{
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  color: (opacity: any) => `rgba(${theme.colors.rgb}, ${opacity})`,
                  labelColor: (opacity: any) => `rgba(${theme.colors.rgb}, ${opacity})`,
                  strokeWidth: 2,
                  spotify: true,
                }}
                bezier
                style={{
                  borderRadius: 16,
                }}
              />
            )}
          </>
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
        <Button mode="contained" icon={() => <Share2 size={18} color="#FFFFFF" />} onPress={async () => {
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
            Alert.alert('Failed to share summary');
          }
        }}>
          Generate share summary
        </Button>
        <Button mode="outlined" onPress={async () => {
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
            Alert.alert('Failed to export CSV');
          }
        }}>
          Export CSV report
        </Button>
        <Button mode="outlined" onPress={generatePDFReport}>
          Export PDF report
        </Button>
        <Button mode="outlined" onPress={handleBackup}>
          Backup Data
        </Button>
        <Button mode="outlined" onPress={handleRestorePick}>
          Restore Data
        </Button>
      </PremiumCard>
    <Modal visible={restoreVisible} onDismiss={() => setRestoreVisible(false)}>
      <View style={{ backgroundColor: '#fff', padding: 24, margin: 24, borderRadius: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          Restore Data
        </Text>
        <View style={{ marginBottom: 12 }}>
          <CheckBox
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
          <Text style={{ marginLeft: 8 }}>Select All</Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <CheckBox
            value={selectedTypes.includes('groups')}
            onValueChange={(v) => {
              const idx = selectedTypes.indexOf('groups');
              if (v && idx === -1) setSelectedTypes([...selectedTypes, 'groups']);
              if (!v && idx !== -1) setSelectedTypes(selectedTypes.filter(t => t !== 'groups'));
            }}
          />
          <Text style={{ marginLeft: 8 }}>Groups</Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <CheckBox
            value={selectedTypes.includes('members')}
            onValueChange={(v) => {
              const idx = selectedTypes.indexOf('members');
              if (v && idx === -1) setSelectedTypes([...selectedTypes, 'members']);
              if (!v && idx !== -1) setSelectedTypes(selectedTypes.filter(t => t !== 'members'));
            }}
          />
          <Text style={{ marginLeft: 8 }}>Members</Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <CheckBox
            value={selectedTypes.includes('expenses')}
            onValueChange={(v) => {
              const idx = selectedTypes.indexOf('expenses');
              if (v && idx === -1) setSelectedTypes([...selectedTypes, 'expenses']);
              if (!v && idx !== -1) setSelectedTypes(selectedTypes.filter(t => t !== 'expenses'));
            }}
          />
          <Text style={{ marginLeft: 8 }}>Expenses</Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <CheckBox
            value={selectedTypes.includes('settlements')}
            onValueChange={(v) => {
              const idx = selectedTypes.indexOf('settlements');
              if (v && idx === -1) setSelectedTypes([...selectedTypes, 'settlements']);
              if (!v && idx !== -1) setSelectedTypes(selectedTypes.filter(t => t !== 'settlements'));
            }}
          />
          <Text style={{ marginLeft: 8 }}>Settlements</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 }}>
          <Button mode="text" onPress={() => setRestoreVisible(false)} style={{ marginRight: 12 }}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleRestoreConfirm}>
            Restore
          </Button>
        </View>
      </View>
    </Modal>
    </Screen>
  );
}
