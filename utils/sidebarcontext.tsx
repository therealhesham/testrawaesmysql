import { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  toggleCollapse: boolean;
  setToggleCollapse: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
export const SidebarProvider: React.FC = ({ children }) => {
  const [toggleCollapse, setToggleCollapse] = useState<boolean>(false);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setToggleCollapse(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    // Store the collapse state in localStorage whenever it changes
    localStorage.setItem("sidebarCollapsed", JSON.stringify(toggleCollapse));
  }, [toggleCollapse]);

  return (
    <SidebarContext.Provider value={{ toggleCollapse, setToggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
