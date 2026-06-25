import { Platform } from "react-native";

export function prepareWebLayout() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const root = document.getElementById("root");
  const nodes = [document.documentElement, document.body, root].filter(Boolean) as HTMLElement[];

  nodes.forEach((node) => {
    node.style.height = "100%";
    node.style.minHeight = "100%";
    node.style.margin = "0";
    node.style.overflowX = "hidden";
    node.style.backgroundColor = "#F8FAFC";
  });

  document.body.style.position = "fixed";
  document.body.style.inset = "0";
  document.body.style.width = "100%";
}
