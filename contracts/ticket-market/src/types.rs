use soroban_sdk::{contracttype, Address, Symbol};

/// Status of a ticket listing on the market.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Expired,
}

/// A single listing posted by a seller.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Listing {
    pub listing_id: u64,
    pub seller: Address,
    /// Game or event identifier the ticket is for.
    pub game_id: Symbol,
    /// Ask price in the market's token.
    pub price: i128,
    /// Ledger sequence after which the listing expires automatically.
    pub expires_at_ledger: u32,
    pub status: ListingStatus,
}

/// Summary of the entire orderbook (all active listings).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OrderbookSummary {
    /// Total number of active (non-expired, non-sold, non-cancelled) listings.
    pub active_count: u64,
    /// Lowest ask price among active listings (0 when orderbook is empty).
    pub best_ask: i128,
    /// Highest ask price among active listings (0 when orderbook is empty).
    pub worst_ask: i128,
    /// Sum of all active listing prices.
    pub total_volume: i128,
    /// Current ledger sequence (used by consumers to evaluate expiry).
    pub current_ledger: u32,
}

/// Summary of active listing depth for one game or event.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ListingDepthSummary {
    /// Game or event identifier this summary was computed for.
    pub game_id: Symbol,
    /// Total number of active, non-expired listings for the game.
    pub active_count: u64,
    /// Lowest ask price among matching listings (0 when there is no depth).
    pub best_ask: i128,
    /// Highest ask price among matching listings (0 when there is no depth).
    pub worst_ask: i128,
    /// Sum of all active listing prices for the game.
    pub total_volume: i128,
    /// Current ledger sequence used for the expiry check.
    pub current_ledger: u32,
}

/// Expiry details for a single listing.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ListingExpiry {
    pub listing_id: u64,
    /// True when the listing_id exists in storage.
    pub exists: bool,
    pub expires_at_ledger: u32,
    pub current_ledger: u32,
    /// True when expires_at_ledger <= current_ledger.
    pub is_expired: bool,
    pub status: ListingStatus,
}

/// Stable reason code returned by `purchase_eligibility`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PurchaseEligibilityReason {
    Eligible,
    ListingMissing,
    ListingNotActive,
    ListingExpired,
    SellerCannotPurchaseOwnListing,
}

/// Read-only purchase check for a specific listing and buyer.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PurchaseEligibility {
    pub listing_id: u64,
    /// True when the listing exists in storage.
    pub exists: bool,
    /// Current listing status snapshot.
    pub status: ListingStatus,
    /// Game or event identifier; `None` when the listing is unknown.
    pub game_id: Option<Symbol>,
    /// Seller address; `None` when the listing is unknown.
    pub seller: Option<Address>,
    /// Ask price; `0` when the listing is unknown.
    pub price: i128,
    /// Current ledger sequence used for expiry evaluation.
    pub current_ledger: u32,
    /// True when the listing has passed its expiry ledger.
    pub is_expired: bool,
    /// True when the buyer matches the seller address.
    pub seller_is_buyer: bool,
    /// Final caller-facing eligibility flag.
    pub can_purchase: bool,
    /// Stable machine-readable reason code.
    pub reason: PurchaseEligibilityReason,
}

/// Full snapshot of a single active listing for UI/API consumers.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveListingSnapshot {
    pub listing_id: u64,
    /// True when the listing exists in storage.
    pub exists: bool,
    /// True when the listing is active and not expired.
    pub is_active: bool,
    pub status: ListingStatus,
    pub seller: Option<Address>,
    pub game_id: Option<Symbol>,
    pub price: i128,
    pub expires_at_ledger: u32,
    pub current_ledger: u32,
    /// Ledgers remaining until expiry (0 when expired or missing).
    pub ledgers_until_expiry: u32,
    pub is_expired: bool,
}

/// Purchase cooldown state for a listing, reporting the remaining ledgers
/// until the listing becomes purchasable after creation.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PurchaseCooldown {
    pub listing_id: u64,
    pub exists: bool,
    pub status: ListingStatus,
    pub current_ledger: u32,
    pub expires_at_ledger: u32,
    /// True when the listing is active, not expired, and past any cooldown.
    pub is_purchasable: bool,
    /// Ledgers remaining in the cooldown window (0 when ready or missing).
    pub cooldown_remaining: u32,
    pub is_expired: bool,
}
