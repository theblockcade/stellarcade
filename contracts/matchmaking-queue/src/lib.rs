#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env, Symbol, Vec};

pub use types::{QueueHealthSnapshot, WaitBand, WaitBandEstimate};

// ── Storage Keys ─────────────────────────────────────────────────
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    QueueState(Symbol), // queue_id → MatchQueueState
    NextMatchId,
    Match(u64),              // match_id → MatchRecord
    QueueMatchCount(Symbol), // queue_id → u64 cumulative match count
}

// ── Domain Types ─────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchQueueState {
    pub queue_id: Symbol,
    pub players: Vec<Address>,
    pub criteria_hash: Symbol,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchRecord {
    pub match_id: u64,
    pub queue_id: Symbol,
    pub players: Vec<Address>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QueuePositionSnapshot {
    pub queue_id: Symbol,
    pub player: Address,
    pub position: u32,
    pub queue_depth: u32,
    pub criteria_hash: Symbol,
}

// ── Events ────────────────────────────────────────────────────────
#[contractevent]
pub struct PlayerEnqueued {
    #[topic]
    pub queue_id: Symbol,
    pub player: Address,
}

#[contractevent]
pub struct PlayerDequeued {
    #[topic]
    pub queue_id: Symbol,
    pub player: Address,
}

#[contractevent]
pub struct MatchCreated {
    #[topic]
    pub match_id: u64,
    pub queue_id: Symbol,
}

// ── Contract ──────────────────────────────────────────────────────
#[contract]
pub struct MatchmakingQueue;

#[contractimpl]
impl MatchmakingQueue {
    /// Initialize the contract with an admin.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextMatchId, &0u64);
    }

    /// Enqueue a player into a matchmaking queue. Player must auth.
    pub fn enqueue_player(env: Env, queue_id: Symbol, player: Address, criteria_hash: Symbol) {
        player.require_auth();

        let mut state: MatchQueueState = env
            .storage()
            .persistent()
            .get(&DataKey::QueueState(queue_id.clone()))
            .unwrap_or_else(|| MatchQueueState {
                queue_id: queue_id.clone(),
                players: Vec::new(&env),
                criteria_hash: criteria_hash.clone(),
            });

        // Prevent duplicate enqueue
        for existing in state.players.iter() {
            if existing == player {
                panic!("Player already in queue");
            }
        }

        state.players.push_back(player.clone());
        env.storage()
            .persistent()
            .set(&DataKey::QueueState(queue_id.clone()), &state);

        PlayerEnqueued { queue_id, player }.publish(&env);
    }

    /// Remove a player from a queue. Only admin or the player themselves can dequeue.
    pub fn dequeue_player(env: Env, caller: Address, queue_id: Symbol, player: Address) {
        caller.require_auth();
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        assert!(caller == admin || caller == player, "Unauthorized");

        let mut state: MatchQueueState = env
            .storage()
            .persistent()
            .get(&DataKey::QueueState(queue_id.clone()))
            .expect("Queue not found");

        let mut found = false;
        let mut new_players = Vec::new(&env);
        for p in state.players.iter() {
            if p == player {
                found = true;
            } else {
                new_players.push_back(p);
            }
        }
        assert!(found, "Player not in queue");

        state.players = new_players;
        env.storage()
            .persistent()
            .set(&DataKey::QueueState(queue_id.clone()), &state);

        PlayerDequeued { queue_id, player }.publish(&env);
    }

    /// Create a match from a set of players. Admin-only.
    /// Players are removed from the queue on match creation.
    pub fn create_match(env: Env, queue_id: Symbol, players: Vec<Address>) -> u64 {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        assert!(!players.is_empty(), "Players list cannot be empty");

        let match_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextMatchId)
            .unwrap_or(0);
        env.storage().instance().set(
            &DataKey::NextMatchId,
            &match_id.checked_add(1).expect("Overflow"),
        );

        // Remove matched players from the queue
        let maybe_state: Option<MatchQueueState> = env
            .storage()
            .persistent()
            .get(&DataKey::QueueState(queue_id.clone()));

        if let Some(mut state) = maybe_state {
            let mut remaining = Vec::new(&env);
            for p in state.players.iter() {
                let mut matched = false;
                for mp in players.iter() {
                    if mp == p {
                        matched = true;
                        break;
                    }
                }
                if !matched {
                    remaining.push_back(p);
                }
            }
            state.players = remaining;
            env.storage()
                .persistent()
                .set(&DataKey::QueueState(queue_id.clone()), &state);
        }

        let record = MatchRecord {
            match_id,
            queue_id: queue_id.clone(),
            players,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &record);

        // Track per-queue throughput for health and wait-band accessors.
        storage::increment_queue_match_count(&env, &queue_id);

        MatchCreated { match_id, queue_id }.publish(&env);

        match_id
    }

    /// Read the current state of a queue.
    pub fn queue_state(env: Env, queue_id: Symbol) -> MatchQueueState {
        env.storage()
            .persistent()
            .get(&DataKey::QueueState(queue_id))
            .expect("Queue not found")
    }

    /// Read the number of players currently waiting in a queue.
    /// Missing queues report a depth of 0.
    pub fn queue_depth(env: Env, queue_id: Symbol) -> u32 {
        Self::read_queue_state(&env, queue_id)
            .map(|state| state.players.len())
            .unwrap_or(0)
    }

    /// Read a stable player position snapshot for the current queue ordering.
    /// Returns None for missing queues, empty queues, or absent players.
    pub fn player_position_snapshot(
        env: Env,
        queue_id: Symbol,
        player: Address,
    ) -> Option<QueuePositionSnapshot> {
        let state = Self::read_queue_state(&env, queue_id.clone())?;
        let queue_depth = state.players.len();

        for (position, queued_player) in (1_u32..).zip(state.players.iter()) {
            if queued_player == player {
                return Some(QueuePositionSnapshot {
                    queue_id,
                    player,
                    position,
                    queue_depth,
                    criteria_hash: state.criteria_hash,
                });
            }
        }

        None
    }

    /// Read a match record.
    pub fn match_state(env: Env, match_id: u64) -> MatchRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Match(match_id))
            .expect("Match not found")
    }

    fn read_queue_state(env: &Env, queue_id: Symbol) -> Option<MatchQueueState> {
        env.storage()
            .persistent()
            .get(&DataKey::QueueState(queue_id))
    }

    /// Return a health snapshot for a single queue.
    ///
    /// All fields are zero-valued when the queue has never been initialised.
    /// `active_buckets` is 1 when players are waiting and 0 when the queue is
    /// empty. `matches_total` is a lightweight throughput indicator derived
    /// from the per-queue match counter updated by `create_match`.
    pub fn queue_health_snapshot(env: Env, queue_id: Symbol) -> QueueHealthSnapshot {
        let queue_size = Self::read_queue_state(&env, queue_id.clone())
            .map(|s| s.players.len())
            .unwrap_or(0);
        let matches_total = storage::get_queue_match_count(&env, &queue_id);
        let active_buckets = if queue_size > 0 { 1u32 } else { 0u32 };

        QueueHealthSnapshot {
            queue_id,
            queue_size,
            active_buckets,
            matches_total,
        }
    }

    /// Return an estimated wait-time band for a queue.
    ///
    /// The band is derived from current queue size and prior match history.
    /// Outputs are intentionally coarse and conservative so frontends never
    /// over-promise exact matchmaking times.
    ///
    /// | Condition                         | `wait_band`  | `has_history` |
    /// |-----------------------------------|--------------|---------------|
    /// | `queue_size >= 2`                 | `Immediate`  | any           |
    /// | `queue_size == 1`                 | `Short`      | any           |
    /// | `queue_size == 0, matches > 0`    | `Long`       | `true`        |
    /// | `queue_size == 0, matches == 0`   | `Unknown`    | `false`       |
    pub fn wait_band_estimate(env: Env, queue_id: Symbol) -> WaitBandEstimate {
        let queue_size = Self::read_queue_state(&env, queue_id.clone())
            .map(|s| s.players.len())
            .unwrap_or(0);
        let matches_total = storage::get_queue_match_count(&env, &queue_id);
        let has_history = matches_total > 0;

        let wait_band = match queue_size {
            0 if !has_history => WaitBand::Unknown,
            0 => WaitBand::Long,
            1 => WaitBand::Short,
            _ => WaitBand::Immediate,
        };

        WaitBandEstimate {
            queue_id,
            queue_size,
            wait_band,
            has_history,
        }
    }
}

#[cfg(test)]
mod test;
