import { useState, useEffect, useCallback } from 'react';
import { RecentContract } from '../components/RecentContractShortcutStrip';

export interface UseRecentContractsOptions {
  maxContracts?: number;
  storageKey?: string;
  autoSave?: boolean;
}

export interface UseRecentContractsReturn {
  contracts: RecentContract[];
  addContract: (contract: Omit<RecentContract, 'lastInteraction' | 'interactionCount'>) => void;
  updateContract: (contractId: string, updates: Partial<RecentContract>) => void;
  removeContract: (contractId: string) => void;
  pinContract: (contractId: string, pinned: boolean) => void;
  incrementInteraction: (contractId: string) => void;
  clearAll: () => void;
  getContract: (contractId: string) => RecentContract | undefined;
  isContractRecent: (contractId: string) => boolean;
}

const DEFAULT_OPTIONS: Required<UseRecentContractsOptions> = {
  maxContracts: 20,
  storageKey: 'stellarcade_recent_contracts',
  autoSave: true,
};

export const useRecentContracts = (options: UseRecentContractsOptions = {}): UseRecentContractsReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [contracts, setContracts] = useState<RecentContract[]>([]);

  // Load contracts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(config.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const contractsWithDates = parsed.map((contract: any) => ({
          ...contract,
          lastInteraction: new Date(contract.lastInteraction),
        }));
        setContracts(contractsWithDates);
      }
    } catch (error) {
      console.warn('Failed to load recent contracts from localStorage:', error);
    }
  }, [config.storageKey]);

  // Save contracts to localStorage when they change
  useEffect(() => {
    if (config.autoSave && contracts.length > 0) {
      try {
        localStorage.setItem(config.storageKey, JSON.stringify(contracts));
      } catch (error) {
        console.warn('Failed to save recent contracts to localStorage:', error);
      }
    }
  }, [contracts, config.autoSave, config.storageKey]);

  const addContract = useCallback((contractData: Omit<RecentContract, 'lastInteraction' | 'interactionCount'>) => {
    setContracts(prev => {
      // Check if contract already exists
      const existingIndex = prev.findIndex(c => c.id === contractData.id);
      
      const newContract: RecentContract = {
        ...contractData,
        lastInteraction: new Date(),
        interactionCount: 1,
      };

      let updated: RecentContract[];
      
      if (existingIndex >= 0) {
        // Update existing contract
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...contractData,
          lastInteraction: new Date(),
          interactionCount: updated[existingIndex].interactionCount + 1,
        };
      } else {
        // Add new contract
        updated = [newContract, ...prev];
      }

      // Limit to maxContracts, keeping pinned contracts
      if (updated.length > config.maxContracts) {
        const pinned = updated.filter(c => c.isPinned);
        const unpinned = updated.filter(c => !c.isPinned);
        
        // Sort unpinned by last interaction and take the most recent
        unpinned.sort((a, b) => b.lastInteraction.getTime() - a.lastInteraction.getTime());
        const remainingSlots = config.maxContracts - pinned.length;
        
        updated = [...pinned, ...unpinned.slice(0, Math.max(0, remainingSlots))];
      }

      return updated;
    });
  }, [config.maxContracts]);

  const updateContract = useCallback((contractId: string, updates: Partial<RecentContract>) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, ...updates }
          : contract
      )
    );
  }, []);

  const removeContract = useCallback((contractId: string) => {
    setContracts(prev => prev.filter(contract => contract.id !== contractId));
  }, []);

  const pinContract = useCallback((contractId: string, pinned: boolean) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, isPinned: pinned }
          : contract
      )
    );
  }, []);

  const incrementInteraction = useCallback((contractId: string) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === contractId 
          ? { 
              ...contract, 
              lastInteraction: new Date(),
              interactionCount: contract.interactionCount + 1
            }
          : contract
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setContracts([]);
    if (config.autoSave) {
      localStorage.removeItem(config.storageKey);
    }
  }, [config.autoSave, config.storageKey]);

  const getContract = useCallback((contractId: string): RecentContract | undefined => {
    return contracts.find(contract => contract.id === contractId);
  }, [contracts]);

  const isContractRecent = useCallback((contractId: string): boolean => {
    return contracts.some(contract => contract.id === contractId);
  }, [contracts]);

  return {
    contracts,
    addContract,
    updateContract,
    removeContract,
    pinContract,
    incrementInteraction,
    clearAll,
    getContract,
    isContractRecent,
  };
};

export default useRecentContracts;