"use client";

import React from 'react';
import { RngRequestResult, RngRequestStatus } from '../types/contracts/rng';
import './RngRequestStatus.css';

export interface RngRequestStatusProps {
    request?: RngRequestResult | null;
    isLoading?: boolean;
    error?: Error | null;
    onRefresh?: (requestId: string) => void;
    label?: string;
    className?: string;
    testId?: string;
}

export const RngRequestStatusComponent: React.FC<RngRequestStatusProps> = ({
    request,
    isLoading = false,
    error = null,
    onRefresh,
    label = 'RNG Request Status',
    className = '',
    testId = 'rng-request-status',
}) => {
    if (error) {
        return (
            <div
                className={`rng-request-status rng-request-status--failed ${className}`}
                data-testid={`${testId}-error`}
            >
                <div className="rng-request-status__header">
                    <span className="rng-request-status__title">Error</span>
                </div>
                <div className="rng-request-status__body">
                    <span className="rng-request-status__message">{error.message}</span>
                </div>
            </div>
        );
    }

    if (!request && !isLoading) {
        return (
            <div
                className={`rng-request-status ${className}`}
                data-testid={`${testId}-empty`}
            >
                <div className="rng-request-status__body">
                    <span className="rng-request-status__message">No RNG request data available.</span>
                </div>
            </div>
        );
    }

    const status = request?.status || RngRequestStatus.Pending;
    const requestId = request?.requestId || 'Unknown';

    const containerClasses = [
        'rng-request-status',
        `rng-request-status--${status.toLowerCase()}`,
        className
    ].join(' ');

    return (
        <div className={containerClasses} data-testid={testId}>
            <div className="rng-request-status__header">
                <h3 className="rng-request-status__title">{label}</h3>
                <span className="rng-request-status__id">ID: {requestId}</span>
            </div>

            <div className="rng-request-status__body">
                <div className="rng-request-status__state">
                    <span className="rng-request-status__indicator" />
                    <span className="rng-request-status__text">
                        {isLoading ? 'Refreshing...' : status}
                    </span>
                </div>

                {status === RngRequestStatus.Fulfilled && request?.result !== undefined && (
                    <div className="rng-request-status__result" data-testid={`${testId}-result`}>
                        {request.result}
                    </div>
                )}

                {status === RngRequestStatus.Pending && (
                    <p className="rng-request-status__note">
                        Waiting for blockchain confirmation...
                    </p>
                )}
            </div>

            {onRefresh && status === RngRequestStatus.Pending && (
                <div className="rng-request-status__footer">
                    <button
                        type="button"
                        className="rng-request-status__refresh-btn"
                        onClick={() => onRefresh(requestId)}
                        disabled={isLoading}
                        data-testid={`${testId}-refresh-btn`}
                    >
                        {isLoading ? 'Refreshing...' : 'Retry Refresh'}
                    </button>
                </div>
            )}
        </div>
    );
};

RngRequestStatusComponent.displayName = 'RngRequestStatus';

export default RngRequestStatusComponent;
