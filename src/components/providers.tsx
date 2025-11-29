"use client";

import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "next-themes";
import { useSelector } from "react-redux";
import { store, persistor } from "@/store";
import { RootState } from "@/store";
import { useEffect } from "react";

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={"light"}
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      themes={["light"]}
    >
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SessionProvider>
          <ThemeWrapper>{children}</ThemeWrapper>
        </SessionProvider>
      </PersistGate>
    </Provider>
  );
}
