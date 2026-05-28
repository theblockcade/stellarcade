#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

pub use types::{
    Listing, ListingDepthSummary, ListingExpiry, ListingStatus, OrderbookSummary,
    PurchaseEligibility, PurchaseEligibilityReason,
};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    NextListingId,
    ActiveIds,
    Listing(u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    ListingNotFound = 4,
    ListingNotActive = 5,
    InvalidPrice = 6,
    InvalidExpiry = 7,
    Overflow = 8,
    CannotCancelOthersListing = 9,
}

#[contract]
pub struct TicketMarket;

#[contractimpl]
impl TicketMarket {
    // ── Admin ──────────────────────────────────────────────────────────────────

    pub fn init(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        Ok(())
    }

    // ── Listings ───────────────────────────────────────────────────────────────

    /// Post a new ticket listing.
    /// `expires_at_ledger` must be strictly greater than the current ledger.
    pub fn list_ticket(
        env: Env,
        seller: Address,
        game_id: Symbol,
        price: i128,
        expires_at_ledger: u32,
    ) -> Result<u64, Error> {
        seller.require_auth();
        if price <= 0 {
            return Err(Error::InvalidPrice);
        }
        let current_ledger = env.ledger().sequence();
        if expires_at_ledger <= current_ledger {
            return Err(Error::InvalidExpiry);
        }

        let listing_id = storage::next_listing_id(&env);
        let listing = Listing {
            listing_id,
            seller,
            game_id,
            price,
            expires_at_ledger,
            status: ListingStatus::Active,
        };
        storage::set_listing(&env, &listing);
        storage::add_active_id(&env, listing_id);
        Ok(listing_id)
    }

    /// Cancel a listing (seller only).
    pub fn cancel_listing(env: Env, seller: Address, listing_id: u64) -> Result<(), Error> {
        seller.require_auth();
        let mut listing = storage::get_listing(&env, listing_id).ok_or(Error::ListingNotFound)?;
        if listing.seller != seller {
            return Err(Error::CannotCancelOthersListing);
        }
        if listing.status != ListingStatus::Active {
            return Err(Error::ListingNotActive);
        }
        listing.status = ListingStatus::Cancelled;
        storage::set_listing(&env, &listing);
        storage::remove_active_id(&env, listing_id);
        Ok(())
    }

    /// Mark a listing as sold (admin-only — called after successful payment).
    pub fn fill_listing(env: Env, listing_id: u64) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let mut listing = storage::get_listing(&env, listing_id).ok_or(Error::ListingNotFound)?;
        if listing.status != ListingStatus::Active {
            return Err(Error::ListingNotActive);
        }
        listing.status = ListingStatus::Sold;
        storage::set_listing(&env, &listing);
        storage::remove_active_id(&env, listing_id);
        Ok(())
    }

    // ── Read-only accessors ────────────────────────────────────────────────────

    /// Returns a live summary of the orderbook, including best/worst ask and
    /// total volume across all non-expired active listings.
    pub fn orderbook_summary(env: Env) -> OrderbookSummary {
        let current_ledger = env.ledger().sequence();
        let ids = storage::get_active_ids(&env);

        let mut active_count: u64 = 0;
        let mut best_ask: i128 = i128::MAX;
        let mut worst_ask: i128 = 0;
        let mut total_volume: i128 = 0;

        for id in ids.iter() {
            if let Some(listing) = storage::get_listing(&env, id) {
                if listing.status == ListingStatus::Active
                    && listing.expires_at_ledger > current_ledger
                {
                    active_count = active_count.saturating_add(1);
                    if listing.price < best_ask {
                        best_ask = listing.price;
                    }
                    if listing.price > worst_ask {
                        worst_ask = listing.price;
                    }
                    total_volume = total_volume.saturating_add(listing.price);
                }
            }
        }

        if active_count == 0 {
            best_ask = 0;
        }

        OrderbookSummary {
            active_count,
            best_ask,
            worst_ask,
            total_volume,
            current_ledger,
        }
    }

    /// Returns expiry details for a single listing.
    /// Returns a not-found struct when the listing_id is unknown.
    pub fn listing_expiry(env: Env, listing_id: u64) -> ListingExpiry {
        let current_ledger = env.ledger().sequence();
        match storage::get_listing(&env, listing_id) {
            Some(listing) => {
                let is_expired = listing.expires_at_ledger <= current_ledger;
                ListingExpiry {
                    listing_id,
                    exists: true,
                    expires_at_ledger: listing.expires_at_ledger,
                    current_ledger,
                    is_expired,
                    status: listing.status,
                }
            }
            None => ListingExpiry {
                listing_id,
                exists: false,
                expires_at_ledger: 0,
                current_ledger,
                is_expired: false,
                status: ListingStatus::Cancelled,
            },
        }
    }

    /// Returns active listing depth for one game identifier.
    ///
    /// Empty depth is represented with zero counts and prices so consumers do
    /// not need to special-case missing state.
    pub fn listing_depth_summary(env: Env, game_id: Symbol) -> ListingDepthSummary {
        let current_ledger = env.ledger().sequence();
        let ids = storage::get_active_ids(&env);

        let mut active_count: u64 = 0;
        let mut best_ask: i128 = i128::MAX;
        let mut worst_ask: i128 = 0;
        let mut total_volume: i128 = 0;

        for id in ids.iter() {
            if let Some(listing) = storage::get_listing(&env, id) {
                if listing.game_id == game_id
                    && listing.status == ListingStatus::Active
                    && listing.expires_at_ledger > current_ledger
                {
                    active_count = active_count.saturating_add(1);
                    if listing.price < best_ask {
                        best_ask = listing.price;
                    }
                    if listing.price > worst_ask {
                        worst_ask = listing.price;
                    }
                    total_volume = total_volume.saturating_add(listing.price);
                }
            }
        }

        if active_count == 0 {
            best_ask = 0;
        }

        ListingDepthSummary {
            game_id,
            active_count,
            best_ask,
            worst_ask,
            total_volume,
            current_ledger,
        }
    }

    /// Returns whether a buyer can purchase a listing under the current
    /// storage-backed status and expiry rules.
    ///
    /// Unknown listings return `exists = false`, `can_purchase = false`, and a
    /// `ListingMissing` reason. Expired listings remain readable and report
    /// `ListingExpired` without mutating their stored status.
    pub fn purchase_eligibility(env: Env, listing_id: u64, buyer: Address) -> PurchaseEligibility {
        let current_ledger = env.ledger().sequence();
        match storage::get_listing(&env, listing_id) {
            Some(listing) => {
                let seller_is_buyer = listing.seller == buyer;
                let is_expired = listing.expires_at_ledger <= current_ledger;
                let status = listing.status.clone();

                let reason = if seller_is_buyer {
                    PurchaseEligibilityReason::SellerCannotPurchaseOwnListing
                } else if status != ListingStatus::Active {
                    PurchaseEligibilityReason::ListingNotActive
                } else if is_expired {
                    PurchaseEligibilityReason::ListingExpired
                } else {
                    PurchaseEligibilityReason::Eligible
                };

                PurchaseEligibility {
                    listing_id,
                    exists: true,
                    status,
                    game_id: Some(listing.game_id),
                    seller: Some(listing.seller),
                    price: listing.price,
                    current_ledger,
                    is_expired,
                    seller_is_buyer,
                    can_purchase: reason == PurchaseEligibilityReason::Eligible,
                    reason,
                }
            }
            None => PurchaseEligibility {
                listing_id,
                exists: false,
                status: ListingStatus::Cancelled,
                game_id: None,
                seller: None,
                price: 0,
                current_ledger,
                is_expired: false,
                seller_is_buyer: false,
                can_purchase: false,
                reason: PurchaseEligibilityReason::ListingMissing,
            },
        }
    }
}

#[cfg(test)]
mod test;
