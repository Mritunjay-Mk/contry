import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { Button, TextInput } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { useContryStore } from "@/store/contryStore";
import { RootStackParamList } from "@/types";

export function MemberEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "MemberEditor">>();
  const selectedGroupId = useContryStore((state) => state.selectedGroupId);
  const members = useContryStore((state) => state.members);
  const addMember = useContryStore((state) => state.addMember);
  const updateMember = useContryStore((state) => state.updateMember);
  const member = useMemo(() => members.find((item) => item.id === route.params?.memberId), [members, route.params?.memberId]);
  const [name, setName] = useState(member?.name ?? "");

  const save = () => {
    if (!name.trim()) return;
    if (member) {
      updateMember(member.id, name.trim());
    } else {
      addMember(selectedGroupId, name.trim());
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <TextInput label="Member name" value={name} onChangeText={setName} mode="outlined" autoFocus />
      <Button mode="contained" onPress={save}>
        Save member
      </Button>
    </Screen>
  );
}
