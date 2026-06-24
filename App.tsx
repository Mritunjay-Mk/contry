import { NavigationContainer } from "@react-navigation/native";
import { useEffect } from "react";
import { StatusBar, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "@/navigation/RootNavigator";
import { initializeDatabase } from "@/database/sqlite";
import { useSettingsStore } from "@/store/settingsStore";
import { useContryStore } from "@/store/contryStore";
import { createPaperTheme, navigationDarkTheme, navigationLightTheme } from "@/theme/theme";
import { prepareWebLayout } from "@/utils/webLayout";

export default function App() {
  const scheme = useColorScheme();
  const colorMode = useSettingsStore((state) => state.colorMode);
  const seed = useContryStore((state) => state.seed);
  const isDark = colorMode === "system" ? scheme === "dark" : colorMode === "dark";

  useEffect(() => {
    prepareWebLayout();
    initializeDatabase();
    seed();
  }, [seed]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={createPaperTheme(isDark)}>
          <NavigationContainer theme={isDark ? navigationDarkTheme : navigationLightTheme}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
