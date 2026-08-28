import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AddPropertyFormState, initialFormState } from './types';

interface AddPropertyContextProps {
  state: AddPropertyFormState;
  updateState: (updates: Partial<AddPropertyFormState>) => void;
  updateAmenity: (key: string, value: boolean | string) => void;
  isSimulatingAI: boolean;
  setIsSimulatingAI: (val: boolean) => void;
}

const AddPropertyContext = createContext<AddPropertyContextProps | undefined>(undefined);

export function AddPropertyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AddPropertyFormState>(initialFormState);
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);

  const updateState = useCallback((updates: Partial<AddPropertyFormState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAmenity = useCallback((key: string, value: boolean | string) => {
    setState(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [key]: value,
      },
    }));
  }, []);

  const value = useMemo(() => ({
    state,
    updateState,
    updateAmenity,
    isSimulatingAI,
    setIsSimulatingAI,
  }), [isSimulatingAI, state, updateAmenity, updateState]);

  return (
    <AddPropertyContext.Provider value={value}>
      {children}
    </AddPropertyContext.Provider>
  );
}

export function useAddPropertyForm() {
  const context = useContext(AddPropertyContext);
  if (!context) {
    throw new Error('useAddPropertyForm must be used within an AddPropertyProvider');
  }
  return context;
}
