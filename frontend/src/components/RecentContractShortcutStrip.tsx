import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, Star, MoreHorizontal, Trash2, Pin } from 'lucide-react';

export interface RecentContract {
  id: string;
  name: string;
  type: string;
  address: string;
  lastInteraction: Date;
  interactionCount: number;
  isPinned: boolean;
  status: 'active' | 'paused' | 'deprecated';
  network: string;
}

export interface RecentContractShortcutStripProps {
  contracts: RecentContract[];
  maxVisible?: number;
  onContractClick: (contract: RecentContract) => void;
  onPinContract?: (contractId: string, pinned: boolean) => void;
  onRemoveContract?: (contractId: string) => void;
  showInteractionCount?: boolean;
  showLastInteraction?: boolean;
  className?: string;
}

const RecentContractShortcutStrip: React.FC<RecentContractShortcutStripProps> = ({
  contracts,
  maxVisible = 6,
  onContractClick,
  onPinContract,
  onRemoveContract,
  showInteractionCount = true,
  showLastInteraction = true,
  className = '',
}) => {
  const [showAll, setShowAll] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Sort contracts: pinned first, then by last interaction
  const sortedContracts = [...contracts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.lastInteraction.getTime() - a.lastInteraction.getTime();
  });

  const visibleContracts = showAll ? sortedContracts : sortedContracts.slice(0, maxVisible);
  const hasMore = sortedContracts.length > maxVisible;

  const getStatusColor = (status: RecentContract['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'deprecated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastInteraction = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDropdownToggle = (contractId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === contractId ? null : contractId);
  };

  const handlePinToggle = (contractId: string, isPinned: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    onPinContract?.(contractId, !isPinned);
    setActiveDropdown(null);
  };

  const handleRemove = (contractId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onRemoveContract?.(contractId);
    setActiveDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (contracts.length === 0) {
    return (
      <div className={`recent-contract-shortcut-strip ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No Recent Contracts</h3>
          <p className="text-sm text-gray-500">
            Contracts you interact with will appear here for quick access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`recent-contract-shortcut-strip ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Contracts</h3>
          <span className="text-sm text-gray-500">({contracts.length})</span>
        </div>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAll ? 'Show Less' : `Show All (${contracts.length})`}
          </button>
        )}
      </div>

      {/* Contract Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleContracts.map((contract) => (
          <div
            key={contract.id}
            className="relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => onContractClick(contract)}
          >
            {/* Pin indicator */}
            {contract.isPinned && (
              <div className="absolute top-2 right-2">
                <Pin className="w-4 h-4 text-blue-500 fill-current" />
              </div>
            )}

            {/* Dropdown menu */}
            {(onPinContract || onRemoveContract) && (
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => handleDropdownToggle(contract.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>

                {activeDropdown === contract.id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                    {onPinContract && (
                      <button
                        onClick={(e) => handlePinToggle(contract.id, contract.isPinned, e)}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Pin className="w-4 h-4 mr-2" />
                        {contract.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                    {onRemoveContract && (
                      <button
                        onClick={(e) => handleRemove(contract.id, e)}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contract Info */}
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {contract.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {contract.type}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                  {contract.status}
                </span>
                <span className="text-xs text-gray-500">
                  {contract.network}
                </span>
              </div>

              {/* Address */}
              <div className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded truncate">
                {contract.address}
              </div>

              {/* Interaction Info */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                {showLastInteraction && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatLastInteraction(contract.lastInteraction)}
                  </span>
                )}
                {showInteractionCount && (
                  <span className="flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    {contract.interactionCount} uses
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button (alternative to header button) */}
      {hasMore && !showAll && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Show {contracts.length - maxVisible} More Contracts
          </button>
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {contracts.filter(c => c.isPinned).length} pinned, {contracts.filter(c => c.status === 'active').length} active
          </span>
          <button
            onClick={() => onContractClick({ id: 'new', name: 'Deploy New Contract' } as RecentContract)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Deploy New Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentContractShortcutStrip;