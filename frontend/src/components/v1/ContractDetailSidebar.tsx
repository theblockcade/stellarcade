import React, { useState } from 'react';
import { RelatedRecordActionRow, RelatedRecordAction } from './RelatedRecordActionRow';
import './ContractDetailSidebar.css';

interface RelatedContract {
  id: string;
  title: string;
  subtitle: string;
  status: 'active' | 'locked' | 'pending';
}

interface ContractDetailSidebarProps {
  contractId: string;
  className?: string;
  testId?: string;
}

export const ContractDetailSidebar: React.FC<ContractDetailSidebarProps> = ({
  contractId,
  className = '',
  testId = 'contract-detail-sidebar',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [relatedContracts, setRelatedContracts] = useState<RelatedContract[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Simulate fetching related contracts
  React.useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setRelatedContracts([
        {
          id: '1',
          title: 'Contract A',
          subtitle: 'Active • Last updated 2h ago',
          status: 'active',
        },
        {
          id: '2',
          title: 'Contract B',
          subtitle: 'Locked • Awaiting approval',
          status: 'locked',
        },
        {
          id: '3',
          title: 'Contract C',
          subtitle: 'Pending • Draft state',
          status: 'pending',
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, [contractId]);

  const handleContractClick = (contractId: string) => {
    console.log('Navigate to contract:', contractId);
  };

  const handleViewAction = (e: React.MouseEvent, contractId: string) => {
    e.stopPropagation();
    console.log('View contract:', contractId);
  };

  const handleEditAction = (e: React.MouseEvent, contractId: string) => {
    e.stopPropagation();
    console.log('Edit contract:', contractId);
  };

  const handleDeleteAction = (e: React.MouseEvent, contractId: string) => {
    e.stopPropagation();
    console.log('Delete contract:', contractId);
  };

  const getActionsForContract = (contract: RelatedContract): RelatedRecordAction[] => {
    const baseActions: RelatedRecordAction[] = [
      {
        label: 'View',
        onClick: (e) => handleViewAction(e, contract.id),
        testId: `contract-${contract.id}-view`,
        variant: 'primary',
      },
    ];

    if (contract.status === 'active') {
      baseActions.push({
        label: 'Edit',
        onClick: (e) => handleEditAction(e, contract.id),
        testId: `contract-${contract.id}-edit`,
      });
    }

    if (contract.status === 'pending') {
      baseActions.push({
        label: 'Delete',
        onClick: (e) => handleDeleteAction(e, contract.id),
        testId: `contract-${contract.id}-delete`,
        variant: 'danger',
      });
    }

    if (contract.status === 'locked') {
      baseActions.push({
        label: 'Edit',
        onClick: (e) => handleEditAction(e, contract.id),
        testId: `contract-${contract.id}-edit`,
        disabled: true,
        disabledReason: 'Contract is locked and cannot be edited',
      });
    }

    return baseActions;
  };

  if (error) {
    return (
      <div className={`contract-detail-sidebar contract-detail-sidebar--error ${className}`} data-testid={`${testId}-error`}>
        <div className="contract-detail-sidebar__error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`contract-detail-sidebar ${className}`} data-testid={testId}>
      <div className="contract-detail-sidebar__header">
        <h3 className="contract-detail-sidebar__title">Related Contracts</h3>
        <span className="contract-detail-sidebar__count">{relatedContracts.length}</span>
      </div>

      <div className="contract-detail-sidebar__content">
        {isLoading ? (
          <div className="contract-detail-sidebar__loading">
            <div className="contract-detail-sidebar__loading-spinner" />
            <p>Loading related contracts...</p>
          </div>
        ) : relatedContracts.length === 0 ? (
          <RelatedRecordActionRow
            id="empty"
            title="No related contracts"
            isEmpty
            emptyMessage="No related contracts found for this contract"
          />
        ) : (
          relatedContracts.map((contract) => (
            <RelatedRecordActionRow
              key={contract.id}
              id={contract.id}
              title={contract.title}
              subtitle={contract.subtitle}
              onClick={() => handleContractClick(contract.id)}
              actions={getActionsForContract(contract)}
              disabled={contract.status === 'locked'}
              disabledReason={contract.status === 'locked' ? 'Contract is locked' : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ContractDetailSidebar;
