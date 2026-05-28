/**
 * GameLobbyEnhanced Page
 * 
 * Demonstrates integration of QueueHealthWidget for live participation monitoring
 */

import React, { useState, useEffect } from 'react';
import { QueueHealthWidget, type QueueMetrics } from '../components/v1/QueueHealthWidget';
import { StatusPill } from '../components/v1/StatusPill';

interface GameQueue {
  id: string;
  name: string;
  gameType: string;
  metrics: QueueMetrics;
}

const GameLobbyEnhanced: React.FC = () => {
  const [queues, setQueues] = useState<GameQueue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  // Mock data for demonstration
  const mockQueues: GameQueue[] = [
    {
      id: 'coin-flip-casual',
      name: 'Coin Flip - Casual',
      gameType: 'Coin Flip',
      metrics: {
        playersInQueue: 23,
        averageWaitTime: 45,
        estimatedWaitTime: 30,
        activeMatches: 12,
        queueHealth: 'healthy',
        lastUpdated: new Date().toISOString(),
      },
    },
    {
      id: 'coin-flip-ranked',
      name: 'Coin Flip - Ranked',
      gameType: 'Coin Flip',
      metrics: {
        playersInQueue: 8,
        averageWaitTime: 120,
        estimatedWaitTime: 180,
        activeMatches: 3,
        queueHealth: 'degraded',
        lastUpdated: new Date().toISOString(),
      },
    },
    {
      id: 'trivia-daily',
      name: 'Daily Trivia Challenge',
      gameType: 'Trivia',
      metrics: {
        playersInQueue: 156,
        averageWaitTime: 15,
        estimatedWaitTime: 10,
        activeMatches: 45,
        queueHealth: 'healthy',
        lastUpdated: new Date().toISOString(),
      },
    },
    {
      id: 'pattern-puzzle',
      name: 'Pattern Puzzle Tournament',
      gameType: 'Puzzle',
      metrics: {
        playersInQueue: 2,
        averageWaitTime: 300,
        estimatedWaitTime: 420,
        activeMatches: 1,
        queueHealth: 'critical',
        lastUpdated: new Date().toISOString(),
      },
    },
    {
      id: 'dice-roll-maintenance',
      name: 'Dice Roll - High Stakes',
      gameType: 'Dice Roll',
      metrics: {
        playersInQueue: 0,
        averageWaitTime: 0,
        estimatedWaitTime: 0,
        activeMatches: 0,
        queueHealth: 'offline',
        lastUpdated: new Date().toISOString(),
      },
    },
  ];

  // Simulate loading and data fetching
  useEffect(() => {
    const loadQueues = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate occasional error
        if (Math.random() < 0.1) {
          throw new Error('Failed to load queue data');
        }
        
        setQueues(mockQueues);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadQueues();
  }, []);

  // Simulate real-time updates
  const handleRefreshQueue = (queueId: string) => {
    setQueues(prevQueues => 
      prevQueues.map(queue => {
        if (queue.id !== queueId) return queue;
        
        // Simulate metric changes
        const variance = () => Math.random() * 0.4 - 0.2; // ±20% variance
        
        return {
          ...queue,
          metrics: {
            ...queue.metrics,
            playersInQueue: Math.max(0, Math.floor(queue.metrics.playersInQueue * (1 + variance()))),
            estimatedWaitTime: Math.max(5, Math.floor(queue.metrics.estimatedWaitTime * (1 + variance()))),
            activeMatches: Math.max(0, Math.floor(queue.metrics.activeMatches * (1 + variance()))),
            lastUpdated: new Date().toISOString(),
          },
        };
      })
    );
  };

  const handleJoinQueue = (queueId: string) => {
    setSelectedQueue(queueId);
    console.log(`Joining queue: ${queueId}`);
    // In a real app, this would initiate the matchmaking process
  };

  const getGameTypeColor = (gameType: string) => {
    const colors = {
      'Coin Flip': '#7de2d1',
      'Trivia': '#ffb357',
      'Puzzle': '#ff6d87',
      'Dice Roll': '#8fdcff',
    };
    return colors[gameType as keyof typeof colors] || '#a8b5c8';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1>Game Lobby</h1>
          <p style={{ color: '#a8b5c8' }}>Loading available games...</p>
        </header>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {Array.from({ length: 4 }, (_, i) => (
            <QueueHealthWidget key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1>Game Lobby</h1>
          <div style={{ 
            padding: '1rem', 
            border: '1px solid #ff6d87', 
            borderRadius: '0.5rem',
            background: 'rgba(255, 109, 135, 0.1)'
          }}>
            <StatusPill tone="error" label="Error" />
            <p style={{ margin: '0.5rem 0 0 0', color: '#ffabc1' }}>{error}</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Game Lobby</h1>
        <p style={{ color: '#a8b5c8' }}>
          Join live games and monitor queue health in real-time
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {queues.map((queue) => (
          <div 
            key={queue.id}
            style={{ 
              border: '1px solid #333',
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #333',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{queue.name}</h3>
                <span 
                  style={{ 
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    background: getGameTypeColor(queue.gameType),
                    color: '#000',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}
                >
                  {queue.gameType}
                </span>
              </div>
            </div>
            
            <div style={{ padding: '1.25rem' }}>
              <QueueHealthWidget
                metrics={queue.metrics}
                queueName=""
                size="compact"
                showDetails={false}
                refreshInterval={30}
                onRefresh={() => handleRefreshQueue(queue.id)}
                testId={`queue-widget-${queue.id}`}
              />
              
              <button
                type="button"
                onClick={() => handleJoinQueue(queue.id)}
                disabled={queue.metrics.queueHealth === 'offline'}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  border: queue.metrics.queueHealth === 'offline' ? '1px solid #333' : '1px solid #7de2d1',
                  borderRadius: '0.5rem',
                  background: queue.metrics.queueHealth === 'offline' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : selectedQueue === queue.id 
                      ? '#7de2d1' 
                      : 'transparent',
                  color: queue.metrics.queueHealth === 'offline' 
                    ? '#666' 
                    : selectedQueue === queue.id 
                      ? '#000' 
                      : '#7de2d1',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: queue.metrics.queueHealth === 'offline' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: queue.metrics.queueHealth === 'offline' ? 0.5 : 1
                }}
              >
                {selectedQueue === queue.id 
                  ? 'Searching for Match...' 
                  : queue.metrics.queueHealth === 'offline'
                    ? 'Temporarily Unavailable'
                    : 'Join Queue'
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        padding: '1.5rem',
        border: '1px solid #333',
        borderRadius: '0.75rem',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Queue Health Indicators</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusPill tone="success" label="Healthy" size="compact" />
            <span style={{ color: '#a8b5c8', fontSize: '0.875rem' }}>
              Normal operation with good player activity and short wait times
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusPill tone="warning" label="Degraded" size="compact" />
            <span style={{ color: '#a8b5c8', fontSize: '0.875rem' }}>
              Reduced performance with longer wait times or fewer active matches
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusPill tone="error" label="Critical" size="compact" />
            <span style={{ color: '#a8b5c8', fontSize: '0.875rem' }}>
              Very few players or significant delays - consider trying other games
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusPill tone="neutral" label="Offline" size="compact" />
            <span style={{ color: '#a8b5c8', fontSize: '0.875rem' }}>
              Game temporarily unavailable for maintenance or updates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobbyEnhanced;