import { ozModules } from "./oz";
import { polkadotModules } from "./polkadot";

export type ModuleCategory = "oz" | "polkadot" | "imported";

export interface Module {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  tags: string[];
  importPath?: string;
  docsUrl?: string;
}

export const allModules: Module[] = [...ozModules, ...polkadotModules];

export function getModulesByCategory(category: ModuleCategory): Module[] {
  return allModules.filter((m) => m.category === category);
}

export function getModuleById(id: string): Module | undefined {
  return allModules.find((m) => m.id === id);
}
