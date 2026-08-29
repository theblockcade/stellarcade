//! Constant-product (CPMM) pricing for a binary YES/NO share pool.
//!
//! Pool invariant `k = yes_pool * no_pool`. Buying `amount` of collateral
//! into one outcome mints `amount` of both shares, adds the unwanted side
//! to that reserve, and returns the wanted side (minted + taken from the
//! pool) so that `k` is preserved. Prices are the complementary reserve
//! ratios and therefore always sum to 1 (10_000 bps).

/// Shares received when investing `amount` collateral into one outcome.
/// Returns `(new_yes_pool, new_no_pool, shares_out)`.
pub fn buy(
    yes_pool: u128,
    no_pool: u128,
    outcome_is_yes: bool,
    amount: u128,
) -> Option<(u128, u128, u128)> {
    if amount == 0 || yes_pool == 0 || no_pool == 0 {
        return None;
    }
    let k = yes_pool.checked_mul(no_pool)?;
    if outcome_is_yes {
        let new_no = no_pool.checked_add(amount)?;
        let new_yes = k / new_no;
        if new_yes == 0 {
            return None;
        }
        let shares = yes_pool.checked_add(amount)?.checked_sub(new_yes)?;
        Some((new_yes, new_no, shares))
    } else {
        let new_yes = yes_pool.checked_add(amount)?;
        let new_no = k / new_yes;
        if new_no == 0 {
            return None;
        }
        let shares = no_pool.checked_add(amount)?.checked_sub(new_no)?;
        Some((new_yes, new_no, shares))
    }
}

/// Collateral returned for selling `shares` of one outcome, via binary
/// search on the largest payout that does not drop `k`.
/// Returns `(new_yes_pool, new_no_pool, payout)`.
pub fn sell(
    yes_pool: u128,
    no_pool: u128,
    outcome_is_yes: bool,
    shares: u128,
) -> Option<(u128, u128, u128)> {
    if shares == 0 || yes_pool == 0 || no_pool == 0 {
        return None;
    }
    let k = yes_pool.checked_mul(no_pool)?;
    let (outcome, other) = if outcome_is_yes {
        (yes_pool, no_pool)
    } else {
        (no_pool, yes_pool)
    };
    if other <= 1 {
        return None;
    }

    let mut lo = 0u128;
    let mut hi = shares.min(other - 1);
    while lo < hi {
        let mid = lo + (hi - lo + 1) / 2;
        let new_outcome = outcome.checked_add(shares)?.checked_sub(mid)?;
        let new_other = other - mid;
        match new_outcome.checked_mul(new_other) {
            Some(prod) if prod >= k && new_outcome > 0 && new_other > 0 => lo = mid,
            _ => hi = mid - 1,
        }
    }
    if lo == 0 {
        return None;
    }

    let new_outcome = outcome + shares - lo;
    let new_other = other - lo;
    if outcome_is_yes {
        Some((new_outcome, new_other, lo))
    } else {
        Some((new_other, new_outcome, lo))
    }
}

/// `(yes_price_bps, no_price_bps)` from marginal pool ratios. YES is
/// expensive when the NO reserve is large; the two always sum to 10_000.
pub fn prices_bps(yes_pool: u128, no_pool: u128) -> (u32, u32) {
    let total = yes_pool.saturating_add(no_pool);
    if total == 0 {
        return (5_000, 5_000);
    }
    let yes_bps = (no_pool.saturating_mul(10_000) / total) as u32;
    (yes_bps, 10_000 - yes_bps)
}
