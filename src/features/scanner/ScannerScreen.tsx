import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Camera, Image, ShieldAlert } from "lucide-react-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { mockScanBill, ScannedBill } from "@/services/scannerService";
import { useContryStore } from "@/store/contryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { RootStackParamList } from "@/types";
import { formatMoney } from "@/utils/money";

export function ScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const isDuplicateBill = useContryStore((state) => state.isDuplicateBill);
  const scannerSource = useSettingsStore((state) => state.scannerSource);
  const [bill, setBill] = useState<ScannedBill | null>(null);

  const scan = async (source: "camera" | "gallery") => {
    const result = await mockScanBill(source);
    setBill(result);
    if (isDuplicateBill(result.fingerprint)) {
      Alert.alert("Duplicate bill", "This bill already exists");
    }
  };

  return (
    <Screen>
      <Text variant="headlineMedium">Bill scanner</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Default scanner: {scannerSource === "camera" ? "Camera" : "Gallery"}. Scan bills to auto-fill expenses.
      </Text>
      <Button mode="contained-tonal" onPress={() => scan(scannerSource)}>
        Scan with default
      </Button>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button style={{ flex: 1 }} mode="contained" icon={() => <Camera size={18} color="#FFFFFF" />} onPress={() => scan("camera")}>
          Camera
        </Button>
        <Button style={{ flex: 1 }} mode="outlined" icon={() => <Image size={18} color={theme.colors.primary} />} onPress={() => scan("gallery")}>
          Gallery
        </Button>
      </View>
      {bill && (
        <PremiumCard title="Extracted bill">
          <Text variant="titleLarge">{bill.merchantName}</Text>
          <Text>Total amount: {formatMoney(bill.totalAmount)}</Text>
          <Text>Date: {new Date(bill.date).toDateString()}</Text>
          <Text>Category: {bill.category}</Text>
          {isDuplicateBill(bill.fingerprint) && (
            <Text style={{ color: "#EF4444" }}>
              <ShieldAlert size={16} color="#EF4444" /> This bill already exists
            </Text>
          )}
          <Button
            mode="contained"
            onPress={() =>
              navigation.navigate("ExpenseEditor", {
                scannedExpense: {
                  amount: bill.totalAmount,
                  category: bill.category,
                  description: bill.description,
                  date: bill.date,
                  merchantName: bill.merchantName,
                  billFingerprint: bill.fingerprint
                }
              })
            }
          >
            Auto-fill expense
          </Button>
        </PremiumCard>
      )}
    </Screen>
  );
}
