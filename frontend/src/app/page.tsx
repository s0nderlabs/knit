"use client";

import { ModuleBar } from "@/components/modules/module-bar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CodePanel } from "@/components/code/code-panel";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex flex-1 overflow-hidden">
        <ModuleBar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatPanel />
        </div>

        <CodePanel />
      </div>
    </div>
  );
}
