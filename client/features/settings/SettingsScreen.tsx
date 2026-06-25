import * as ImagePicker from "expo-image-picker";
import { Cloud, Moon, QrCode, RefreshCw, Upload, WalletCards } from "lucide-react-native";
import { Button, SegmentedButtons, Switch, Text, TextInput, useTheme, List } from "react-native-paper";

import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { useSettingsStore } from "@/store/settingsStore";

export function SettingsScreen() {
  const theme = useTheme();
  const colorMode = useSettingsStore((state) => state.colorMode);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const upiId = useSettingsStore((state) => state.upiId);
  const upiQrName = useSettingsStore((state) => state.upiQrName);
  const setColorMode = useSettingsStore((state) => state.setColorMode);
  const setNotificationsEnabled = useSettingsStore((state) => state.setNotificationsEnabled);
  const setUpiId = useSettingsStore((state) => state.setUpiId);
  const setUpiQr = useSettingsStore((state) => state.setUpiQr);

  const uploadQrCode = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setUpiQr(asset.uri, asset.fileName ?? "UPI QR code");
    }
  };

  return (
    <Screen>
      <Text variant="headlineMedium">Settings</Text>
      <PremiumCard title="Appearance">
        <List.Item title="Dark mode" description="Light, dark, or system preference" left={() => <Moon color={theme.colors.primary} />} />
        <SegmentedButtons
          value={colorMode}
          onValueChange={(value) => setColorMode(value as typeof colorMode)}
          buttons={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" }
          ]}
        />
      </PremiumCard>
      <PremiumCard title="Backup and notifications">
        <List.Item title="Notifications" left={() => <RefreshCw color={theme.colors.primary} />} right={() => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />} />
        <List.Item title="Backup & restore" description="Local export now, cloud backup ready" left={() => <Cloud color={theme.colors.primary} />} />
      </PremiumCard>
      <PremiumCard title="Payment setup">
        <List.Item title="UPI setup" description={upiId || "UPI ID not set"} left={() => <WalletCards color={theme.colors.primary} />} />
        <TextInput label="UPI ID" value={upiId} onChangeText={setUpiId} mode="outlined" placeholder="name@upi" autoCapitalize="none" />
        <List.Item title="QR code setup" description={upiQrName || "No QR code uploaded"} left={() => <QrCode color={theme.colors.primary} />} />
        <Button mode="outlined" icon={() => <Upload size={18} color={theme.colors.primary} />} onPress={uploadQrCode}>
          Upload UPI QR code
        </Button>
      </PremiumCard>
    </Screen>
  );
}
