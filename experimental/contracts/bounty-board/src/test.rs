#![no_std]
#[cfg(test)]
mod test {
    use soroban_sdk::{testutils::{Address as _, Ledger}, Address, BytesN, Env};
    use crate::{BountyBoard, BountyBoardClient, BountyStatus};

    #[test]
    fn test_happy_path_workflow() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(BountyBoard, ());
        let client = BountyBoardClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let hunter = Address::generate(&env);
        let desc_hash = BytesN::from_array(&env, &[1u8; 32]);
        let proof_hash = BytesN::from_array(&env, &[2u8; 32]);

        env.ledger().set_timestamp(1000);
        let id = client.create_bounty(&creator, &500_0000000, &2000, &desc_hash, &86400);
        assert_eq!(id, 1);

        let bounty = client.get_bounty(&id);
        assert_eq!(bounty.status, BountyStatus::Open);

        // Hunter claims
        client.claim_bounty(&id, &hunter);
        let bounty = client.get_bounty(&id);
        assert_eq!(bounty.status, BountyStatus::Claimed);
        assert_eq!(bounty.hunter, Some(hunter.clone()));

        // Hunter submits
        client.submit_work(&id, &hunter, &proof_hash);
        let bounty = client.get_bounty(&id);
        assert_eq!(bounty.status, BountyStatus::Submitted);
        assert_eq!(bounty.proof_hash, Some(proof_hash));

        // Creator approves
        client.approve_work(&id, &creator);
        let bounty = client.get_bounty(&id);
        assert_eq!(bounty.status, BountyStatus::Approved);
    }

    #[test]
    fn test_review_timeout_auto_release() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(BountyBoard, ());
        let client = BountyBoardClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let hunter = Address::generate(&env);
        let desc_hash = BytesN::from_array(&env, &[1u8; 32]);
        let proof_hash = BytesN::from_array(&env, &[2u8; 32]);

        env.ledger().set_timestamp(1000);
        let id = client.create_bounty(&creator, &1000_0000000, &5000, &desc_hash, &1000);

        client.claim_bounty(&id, &hunter);
        client.submit_work(&id, &hunter, &proof_hash);

        // Advance ledger past review window (1000 + 1000 = 2000)
        env.ledger().set_timestamp(2001);

        client.claim_review_timeout(&id, &hunter);
        let bounty = client.get_bounty(&id);
        assert_eq!(bounty.status, BountyStatus::TimeoutClaimed);
    }

    #[test]
    fn test_cancel_expired_unclaimed_bounty() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(BountyBoard, ());
        let client = BountyBoardClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let desc_hash = BytesN::from_array(&env, &[1u8; 32]);

        env.ledger().set_timestamp(1000);
        let id = client.create_bounty(&creator, &500_0000000, &2000, &desc_hash, &86400);

        // Advance past deadline
        env.ledger().set_timestamp(2001);

        client.cancel_bounty(&id, &creator);
        let bounty = client.get_bounty(&id);
        assert_eq!(bounty.status, BountyStatus::Cancelled);
    }
}
