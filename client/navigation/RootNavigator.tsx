import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BarChart3, Camera, Home, List, Settings, Users, WalletCards } from "lucide-react-native";
import { useTheme } from "react-native-paper";

import { DashboardScreen } from "@/features/groups/DashboardScreen";
import { GroupsScreen } from "@/features/groups/GroupsScreen";
import { ExpenseEditorScreen } from "@/features/expenses/ExpenseEditorScreen";
import { ExpenseHistoryScreen } from "@/features/expenses/ExpenseHistoryScreen";
import { GroupEditorScreen } from "@/features/groups/GroupEditorScreen";
import { MemberEditorScreen } from "@/features/members/MemberEditorScreen";
import { ReportsScreen } from "@/features/analytics/ReportsScreen";
import { ScannerScreen } from "@/features/scanner/ScannerScreen";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { SettlementScreen } from "@/features/settlements/SettlementScreen";
import { MainTabParamList, RootStackParamList } from "@/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const theme = useTheme();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6
        },
        tabBarItemStyle: {
          minWidth: 42
        }
      }}
    >
      <Tabs.Screen name="Home" component={DashboardScreen} options={{ tabBarIcon: ({ focused, color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="Groups" component={GroupsScreen} options={{ tabBarIcon: ({ focused, color, size }) => <Users size={size} color={color} /> }} />
      <Tabs.Screen name="History" component={ExpenseHistoryScreen} options={{ tabBarIcon: ({ focused, color, size }) => <List size={size} color={color} /> }} />
      <Tabs.Screen name="Settlements" component={SettlementScreen} options={{ tabBarIcon: ({ focused, color, size }) => <WalletCards size={size} color={color} /> }} />
      <Tabs.Screen name="Reports" component={ReportsScreen} options={{ tabBarIcon: ({ focused, color, size }) => <BarChart3 size={size} color={color} /> }} />
      <Tabs.Screen name="Scanner" component={ScannerScreen} options={{ tabBarIcon: ({ focused, color, size }) => <Camera size={size} color={color} /> }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ focused, color, size }) => <Settings size={size} color={color} /> }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="GroupEditor" component={GroupEditorScreen} options={{ title: "Group" }} />
      <Stack.Screen name="MemberEditor" component={MemberEditorScreen} options={{ title: "Member" }} />
      <Stack.Screen name="ExpenseEditor" component={ExpenseEditorScreen} options={{ title: "Expense" }} />
    </Stack.Navigator>
  );
}