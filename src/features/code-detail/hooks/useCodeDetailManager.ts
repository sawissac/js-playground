import { useState, useEffect } from "react";

export type Tab = "code" | "objects" | "flowchart" | "export" | "log";

export const useCodeDetailManager = () => {
  const [activeTab, setActiveTab] = useState<Tab>("code");

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<Tab>;
      setActiveTab(customEvent.detail);
    };
    window.addEventListener("change-code-tab", handleTabChange);
    return () => window.removeEventListener("change-code-tab", handleTabChange);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "code", label: "Code Preview" },
    { id: "objects", label: "Objects" },
    { id: "flowchart", label: "Flow Chart" },
    { id: "export", label: "Export Preview" },
    { id: "log", label: "Log" },
  ];

  return { activeTab, setActiveTab, tabs };
};
