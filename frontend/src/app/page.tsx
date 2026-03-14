"use client";

import { Header } from "@/components/header";
import { ModuleBar } from "@/components/modules/module-bar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CodePanel } from "@/components/code/code-panel";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      {/* Fixed header */}
      <Header />

      {/* Content below header */}
      <div className="flex flex-1 flex-col pt-14">
        {/* Module bar */}
        <ModuleBar />

        {/* Main area: chat + code panel */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <ChatPanel />
          </div>
          <CodePanel />
        </div>
      </div>
    </div>
  );
}
