import * as React from "react";

export type DrawerContextType = {
  openDrawer: () => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
};

export const DrawerContext = React.createContext<DrawerContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isDrawerOpen: false,
});

export const useDrawer = () => React.use(DrawerContext);
