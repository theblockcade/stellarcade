#![no_std]
#![allow(unexpected_cfgs)]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, vec, Address, Env, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InvalidMetric = 4,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Methods,
    MethodProfile(Symbol),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq, Default)]
pub struct MethodProfile {
    pub calls: u64,
    pub total_cpu: u64,
    pub total_read_bytes: u64,
    pub total_write_bytes: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MethodHotspot {
    pub method: Symbol,
    pub score: u64,
    pub avg_cpu: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OptimizationRecommendation {
    pub method: Symbol,
    pub recommendation: Symbol,
    pub estimated_savings_bps: u32,
}

#[contract]
pub struct GasOptimizationAnalysis;

#[contractimpl]
impl GasOptimizationAnalysis {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Methods, &Vec::<Symbol>::new(&env));
        Ok(())
    }

    pub fn record_sample(
        env: Env,
        admin: Address,
        method: Symbol,
        cpu: u64,
        read_bytes: u64,
        write_bytes: u64,
    ) -> Result<MethodProfile, Error> {
        require_admin(&env, &admin)?;
        if cpu == 0 {
            return Err(Error::InvalidMetric);
        }

        let key = DataKey::MethodProfile(method.clone());
        let mut profile: MethodProfile = env.storage().persistent().get(&key).unwrap_or_default();

        profile.calls = profile.calls.saturating_add(1);
        profile.total_cpu = profile.total_cpu.saturating_add(cpu);
        profile.total_read_bytes = profile.total_read_bytes.saturating_add(read_bytes);
        profile.total_write_bytes = profile.total_write_bytes.saturating_add(write_bytes);

        env.storage().persistent().set(&key, &profile);
        register_method(&env, method);
        Ok(profile)
    }

    pub fn get_method_profile(env: Env, method: Symbol) -> MethodProfile {
        env.storage()
            .persistent()
            .get(&DataKey::MethodProfile(method))
            .unwrap_or_default()
    }

    pub fn get_hotspots(env: Env, limit: u32) -> Vec<MethodHotspot> {
        let methods: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&DataKey::Methods)
            .unwrap_or(vec![&env]);
        let mut out = vec![&env];
        let max = if limit == 0 {
            methods.len()
        } else {
            core::cmp::min(limit, methods.len())
        };

        let mut i = 0;
        while i < methods.len() && out.len() < max {
            let method = methods.get(i).unwrap();
            let profile = Self::get_method_profile(env.clone(), method.clone());
            if let Some(avg_cpu) = profile.total_cpu.checked_div(profile.calls) {
                let avg_write_bytes = profile
                    .total_write_bytes
                    .checked_div(profile.calls)
                    .unwrap_or(0);
                let score = avg_cpu.saturating_add(avg_write_bytes);
                out.push_back(MethodHotspot {
                    method,
                    score,
                    avg_cpu,
                });
            }
            i += 1;
        }

        out
    }

    pub fn get_recommendations(env: Env, limit: u32) -> Vec<OptimizationRecommendation> {
        let hotspots = Self::get_hotspots(env.clone(), limit);
        let mut out = vec![&env];

        let mut i = 0;
        while i < hotspots.len() {
            let hotspot = hotspots.get(i).unwrap();
            let profile = Self::get_method_profile(env.clone(), hotspot.method.clone());
            let recommendation = recommend_for_profile(&env, hotspot.method, &profile);
            if let Some(entry) = recommendation {
                out.push_back(entry);
            }
            i += 1;
        }

        out
    }
}

fn require_admin(env: &Env, admin: &Address) -> Result<(), Error> {
    if !env.storage().instance().has(&DataKey::Admin) {
        return Err(Error::NotInitialized);
    }
    admin.require_auth();
    let owner: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
    if &owner != admin {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

fn register_method(env: &Env, method: Symbol) {
    let mut methods: Vec<Symbol> = env
        .storage()
        .instance()
        .get(&DataKey::Methods)
        .unwrap_or(vec![env]);
    if !methods.contains(&method) {
        methods.push_back(method);
        env.storage().instance().set(&DataKey::Methods, &methods);
    }
}

fn recommend_for_profile(
    env: &Env,
    method: Symbol,
    profile: &MethodProfile,
) -> Option<OptimizationRecommendation> {
    if profile.calls == 0 {
        return None;
    }

    let avg_cpu = profile.total_cpu / profile.calls;
    let avg_read = profile.total_read_bytes / profile.calls;
    let avg_write = profile.total_write_bytes / profile.calls;

    if avg_cpu >= 50_000 {
        return Some(OptimizationRecommendation {
            method,
            recommendation: Symbol::new(env, "split_method"),
            estimated_savings_bps: 2000,
        });
    }

    if avg_write > avg_read.saturating_mul(2) {
        return Some(OptimizationRecommendation {
            method,
            recommendation: Symbol::new(env, "cache_writes"),
            estimated_savings_bps: 1500,
        });
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn recommends_split_for_high_cpu_methods() {
        let env = Env::default();
        let method = Symbol::new(&env, "resolve_game");
        let profile = MethodProfile {
            calls: 5,
            total_cpu: 300_000,
            total_read_bytes: 10_000,
            total_write_bytes: 10_000,
        };

        let rec = recommend_for_profile(&env, method.clone(), &profile).unwrap();
        assert_eq!(rec.method, method);
        assert_eq!(rec.recommendation, Symbol::new(&env, "split_method"));
    }

    #[test]
    fn recommends_write_cache_when_write_dominates() {
        let env = Env::default();
        let method = Symbol::new(&env, "settle");
        let profile = MethodProfile {
            calls: 10,
            total_cpu: 100_000,
            total_read_bytes: 1_000,
            total_write_bytes: 10_000,
        };

        let rec = recommend_for_profile(&env, method, &profile).unwrap();
        assert_eq!(rec.recommendation, Symbol::new(&env, "cache_writes"));
    }
}
