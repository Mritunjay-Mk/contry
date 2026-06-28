import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Camera, Image, ShieldAlert } from "lucide-react-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import { ActivityIndicator, Button, Divider, Text, useTheme } from "react-native-paper";

import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { scanAndExtract, ScannedBill } from "@/services/scannerService";
import { useContryStore } from "@/store/contryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { RootStackParamList } from "@/types";
import { formatMoney } from "@/utils/money";

export function ScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const isDuplicateBill = useContryStore((state) => state.isDuplicateBill);
  const scannerSource = useSettingsStore((state) => state.scannerSource);
  const currency = useSettingsStore((state) => state.currency);
  const [bill, setBill] = useState<ScannedBill | null>(null);
  const [loading, setLoading] = useState(false);

  const scan = async (source: "camera" | "gallery") => {
    setLoading(true);
    try {
      const result = await scanAndExtract(source);
      if (!result) return; // user cancelled
      setBill(result);
      if (isDuplicateBill(result.fingerprint)) {
        Alert.alert("Duplicate bill", "This bill already exists");
      }
    } catch (error) {
      Alert.alert(
        "Scan failed",
        error instanceof Error ? error.message : "Could not scan the bill."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text variant="headlineMedium">Bill scanner</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Default scanner: {scannerSource === "camera" ? "Camera" : "Gallery"}. Scan bills to auto-fill expenses.
      </Text>
      <Button mode="contained-tonal" disabled={loading} onPress={() => scan(scannerSource)}>
        Scan with default
      </Button>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button
          style={{ flex: 1 }}
          mode="contained"
          disabled={loading}
          icon={() => <Camera size={18} color="#FFFFFF" />}
          onPress={() => scan("camera")}
        >
          Camera
        </Button>
        <Button
          style={{ flex: 1 }}
          mode="outlined"
          disabled={loading}
          icon={() => <Image size={18} color={theme.colors.primary} />}
          onPress={() => scan("gallery")}
        >
          Gallery
        </Button>
      </View>
      {loading && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
          <ActivityIndicator />
          <Text>Reading bill…</Text>
        </View>
      )}
      {bill && (
        <PremiumCard title="Extracted bill">
          <Text variant="titleLarge">{bill.merchantName}</Text>
          <Text>Date: {new Date(bill.date).toDateString()}</Text>
          <Text>Category: {bill.category}</Text>
          <Divider style={{ marginVertical: 8 }} />
          {bill.items.length > 0 ? (
            bill.items.map((item, index) => (
              <View
                key={`${item.name}-${index}`}
                style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}
              >
                <Text style={{ flex: 1 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text>{formatMoney(item.amount, currency)}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No line items detected.</Text>
          )}
          <Divider style={{ marginVertical: 8 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text variant="titleMedium">Total</Text>
            <Text variant="titleMedium">{formatMoney(bill.totalAmount, currency)}</Text>
          </View>
          {isDuplicateBill(bill.fingerprint) && (
            <Text style={{ color: "#EF4444", marginTop: 8 }}>
              <ShieldAlert size={16} color="#EF4444" /> This bill already exists
            </Text>
          )}
          <Button
            mode="contained"
            style={{ marginTop: 12 }}
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
