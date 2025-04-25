import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
} from "react";

interface AppState {
  page: string;
  language: string;
}

type Action =
  | { type: "SET_PAGE"; payload: string }
  | { type: "SET_LANGUAGE"; payload: string };

const initialState: AppState = {
  page: "home",
  language: "en",
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    default:
      return state;
  }
};

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const loadStateFromLocalStorage = (): AppState => {
  if (typeof window === 'undefined') {
    return initialState;
  }
  
  try {
    const serializedState = localStorage.getItem("appState");
    if (serializedState === null) {
      return initialState;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.warn("Could not load state from local storage", err);
    return initialState;
  }
};

const saveStateToLocalStorage = (state: AppState) => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("appState", serializedState);
  } catch (err) {
    console.error("Could not save state to local storage", err);
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false);
  
  // Initialize with default state first
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Load from localStorage after component mounts
  useEffect(() => {
    if (isClient) {
      try {
        const serializedState = localStorage.getItem("appState");
        if (serializedState !== null) {
          const savedState = JSON.parse(serializedState);
          // Update each property separately to avoid overriding the state completely
          Object.keys(savedState).forEach(key => {
            dispatch({ type: `SET_${key.toUpperCase()}` as any, payload: savedState[key] });
          });
        }
      } catch (err) {
        console.warn("Could not load state from local storage", err);
      }
    }
  }, [isClient]);
  
  // Save to localStorage when state changes (but only on client side)
  useEffect(() => {
    if (isClient) {
      saveStateToLocalStorage(state);
    }
  }, [state, isClient]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("use AppContext must be used within an AppProvider");
  }
  return context;
};
