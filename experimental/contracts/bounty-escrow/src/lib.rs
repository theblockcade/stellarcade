use soroban_sdk::{contract, contractimpl, env, symbol, vec, Address, Bytes, BytesN, Duration, Symbol, Vec};
use soroban_sdk::token::{Client as TokenClient, Token};
use soroban_sdk::token::TokenClient;
use soroban_sdk::token::TokenType;

mod types;
mod storage;

#[contract]
pub struct BountyEscrow;

#[derive(Clone, Debug, PartialEq, Eq, soroban_sdk::contracterror)]
pub enum Error {
    Unauthorized = 1,
    BountyNotFound = 2,
    ClaimNotFound = 3,
    BountyExpired = 4,
    AlreadyApproved = 5,
    InsufficientFunds = 6,
    InvalidProof = 7,
}

#[contractimpl]
impl BountyEscrow {
    pub fn post_bounty(
        env: Env,
        sponsor: Address,
        target_game: Symbol,
        target_score: i32,
        amount: i128,
        deadline: Duration,
    ) -> Result<(), Error> {
        env.require_auth(sponsor);
        let contract_id = env.current_contract_address();
        let token_client = TokenClient::new(&env, &contract_id);
        
        // Validate token transfer
        token_client.transfer(
            &env,
            &sponsor,
            &contract_id,
            &amount,
            &TokenType::Native,
            &Default::default(),
        )?;
        
        // Store bounty
        storage::store_bounty(
            &env,
            sponsor,
            target_game,
            target_score,
            amount,
            deadline,
        );
        Ok(())
    }

    pub fn submit_claim(
        env: Env,
        player: Address,
        bounty_id: BytesN<32>,
        proof_hash: BytesN<32>,
    ) -> Result<(), Error> {
        env.require_auth(player);
        storage::store_claim(&env, player, bounty_id, proof_hash);
        Ok(())
    }

    pub fn approve_bounty(
        env: Env,
        verifier: Address,
        bounty_id: BytesN<32>,
    ) -> Result<(), Error> {
        env.require_auth(verifier);
        storage::approve_bounty(&env, bounty_id)?;
        Ok(())
    }
}
