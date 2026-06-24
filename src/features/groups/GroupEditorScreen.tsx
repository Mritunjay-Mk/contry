import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { Button, TextInput } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { useContryStore } from "@/store/contryStore";
import { RootStackParamList } from "@/types";

export function GroupEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "GroupEditor">>();
  const groups = useContryStore((state) => state.groups);
  const addGroup = useContryStore((state) => state.addGroup);
  const updateGroup = useContryStore((state) => state.updateGroup);
  const group = useMemo(() => groups.find((item) => item.id === route.params?.groupId), [groups, route.params?.groupId]);
  const [name, setName] = useState(group?.name ?? "");

  const save = () => {
    if (!name.trim()) return;
    if (group) {
      updateGroup(group.id, name.trim());
    } else {
      addGroup(name.trim());
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <TextInput label="Group name" value={name} onChangeText={setName} mode="outlined" autoFocus />
      <Button mode="contained" onPress={save}>
        Save group
      </Button>
    </Screen>
  );
}
