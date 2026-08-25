//! Exact integer math for the discrete bonding curve `price(s) = m * s^k`.
//!
//! The pool treats token `s` (1-indexed) as costing `m * s^k` deposit units,
//! so the cost of any range of tokens is a difference of prefix sums. Because
//! every trade is priced from the same prefix-sum function, the reserve is
//! path independent: after any trade history, `reserve == prefix_cost(m, k,
//! supply)`.
//!
//! All functions return `None` on overflow; callers surface that as a
//! contract error rather than truncating.

/// Sum of `s` for `s in 1..=x`.
fn sum_pow1(x: u128) -> Option<u128> {
    // x * (x + 1) / 2 — one of the factors is even.
    let (a, b) = if x.is_multiple_of(2) {
        (x / 2, x + 1)
    } else {
        (x, x.div_ceil(2))
    };
    a.checked_mul(b)
}

/// Sum of `s^2` for `s in 1..=x`: `x(x+1)(2x+1)/6`.
fn sum_pow2(x: u128) -> Option<u128> {
    let a = x.checked_mul(x.checked_add(1)?)?;
    let b = x.checked_mul(2)?.checked_add(1)?;
    a.checked_mul(b)?.checked_div(6)
}

/// Sum of `s^3` for `s in 1..=x`: `(x(x+1)/2)^2`.
fn sum_pow3(x: u128) -> Option<u128> {
    let t = sum_pow1(x)?;
    t.checked_mul(t)
}

/// `m * sum(s^k for s in 1..=x)` — the reserve backing a supply of `x`.
pub fn prefix_cost(m: u128, k: u32, x: u128) -> Option<u128> {
    let sum = match k {
        1 => sum_pow1(x)?,
        2 => sum_pow2(x)?,
        3 => sum_pow3(x)?,
        _ => return None,
    };
    m.checked_mul(sum)
}

/// Cost to mint `amount` tokens starting from `supply`.
pub fn buy_cost(m: u128, k: u32, supply: u128, amount: u128) -> Option<u128> {
    let end = supply.checked_add(amount)?;
    Some(prefix_cost(m, k, end)? - prefix_cost(m, k, supply)?)
}

/// Deposit returned for burning `amount` tokens from `supply`.
///
/// Exactly mirrors `buy_cost` over the same range, so a buy immediately
/// followed by a sell of the same amount returns exactly what was paid.
pub fn sell_return(m: u128, k: u32, supply: u128, amount: u128) -> Option<u128> {
    if amount > supply {
        return None;
    }
    buy_cost(m, k, supply - amount, amount)
}

/// Price of the next token to mint: `m * (supply + 1)^k`.
pub fn spot_price(m: u128, k: u32, supply: u128) -> Option<u128> {
    let next = supply.checked_add(1)?;
    let mut pow: u128 = 1;
    for _ in 0..k {
        pow = pow.checked_mul(next)?;
    }
    m.checked_mul(pow)
}

/// Largest `n` with `buy_cost(supply, n) <= deposit`.
///
/// Grows an upper bound by doubling (overflowing costs count as "too
/// expensive"), then binary searches the bracket.
pub fn max_tokens_for_deposit(m: u128, k: u32, supply: u128, deposit: u128) -> u128 {
    let affordable =
        |n: u128| -> bool { matches!(buy_cost(m, k, supply, n), Some(cost) if cost <= deposit) };

    if !affordable(1) {
        return 0;
    }
    let mut hi: u128 = 1;
    while affordable(hi.saturating_mul(2)) {
        hi = hi.saturating_mul(2);
    }
    let mut lo = hi; // Largest known-affordable count.
    let mut probe_hi = hi.saturating_mul(2); // Known unaffordable (or saturated).
    while lo + 1 < probe_hi {
        let mid = lo + (probe_hi - lo) / 2;
        if affordable(mid) {
            lo = mid;
        } else {
            probe_hi = mid;
        }
    }
    lo
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefix_sums_match_naive_loops() {
        for k in 1..=3u32 {
            for x in 0..=50u128 {
                let naive: u128 = (1..=x).map(|s| s.pow(k)).sum();
                assert_eq!(prefix_cost(1, k, x), Some(naive), "k={k} x={x}");
            }
        }
    }

    #[test]
    fn buy_and_sell_are_exact_mirrors() {
        for k in 1..=3u32 {
            let cost = buy_cost(3, k, 10, 5).unwrap();
            assert_eq!(sell_return(3, k, 15, 5), Some(cost));
        }
    }

    #[test]
    fn overflow_returns_none() {
        assert_eq!(prefix_cost(u128::MAX, 2, u128::MAX), None);
        assert_eq!(sell_return(1, 1, 4, 5), None);
    }

    #[test]
    fn max_tokens_binary_search_is_tight() {
        // m=2, k=1, supply=0: cost(n) = n(n+1). Deposit 12 buys exactly 3
        // (cost 12); deposit 11 buys only 2 (cost 6).
        assert_eq!(max_tokens_for_deposit(2, 1, 0, 12), 3);
        assert_eq!(max_tokens_for_deposit(2, 1, 0, 11), 2);
        assert_eq!(max_tokens_for_deposit(2, 1, 0, 1), 0);
        assert_eq!(max_tokens_for_deposit(2, 1, 0, 0), 0);
    }
}
