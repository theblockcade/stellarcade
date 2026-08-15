use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// Environment profiles for deploying contracts
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum NetworkProfile {
    Dev,
    Testnet,
    Mainnet,
}

/// Explicit state transitions for contracts
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ContractState {
    Pending,
    Deployed { address: String, wasm_hash: String },
    Initialized { address: String, wasm_hash: String },
    Failed(String),
}

/// Represents the persisted deployment output format
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DeploymentOutput {
    pub network: NetworkProfile,
    pub admin_address: String,
    pub contracts: HashMap<String, ContractState>,
    pub timestamp: u64,
}

impl DeploymentOutput {
    pub fn new(network: NetworkProfile, admin_address: String, timestamp: u64) -> Self {
        Self {
            network,
            admin_address,
            contracts: HashMap::new(),
            timestamp,
        }
    }

    pub fn save<P: AsRef<Path>>(&self, path: P) -> Result<(), String> {
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(path, json).map_err(|e| e.to_string())
    }

    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str(&json).map_err(|e| e.to_string())
    }
}

/// Core deployment manager class enforcing business logic and sequences
pub struct Deployer {
    pub output: DeploymentOutput,
    pub storage_path: PathBuf,
}

impl Deployer {
    /// Loads an existing profile or creates a new deterministic manager
    pub fn new(network: NetworkProfile, admin: String, path: PathBuf) -> Self {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let output = if path.exists() {
            DeploymentOutput::load(&path)
                .unwrap_or_else(|_| DeploymentOutput::new(network, admin, timestamp))
        } else {
            DeploymentOutput::new(network, admin, timestamp)
        };

        Self {
            output,
            storage_path: path,
        }
    }

    /// Primary routine to sequence deployment of a contract
    pub fn deploy_contract(&mut self, name: &str, caller: &str) -> Result<String, String> {
        // Enforce role check
        if caller != self.output.admin_address {
            return Err("Unauthorized".to_string());
        }

        // Validate generic input parameters implicitly
        if name.is_empty() {
            return Err("Invalid parameters: empty name".to_string());
        }

        // Duplicate guard & transition validation
        if let Some(ContractState::Deployed { address, .. }) = self.output.contracts.get(name) {
            return Ok(address.clone());
        }
        if let Some(ContractState::Initialized { .. }) = self.output.contracts.get(name) {
            return Err("Contract already initialized".to_string());
        }

        // Explicit logic for Pending transition
        self.output
            .contracts
            .insert(name.to_string(), ContractState::Pending);
        self.output.save(&self.storage_path)?;

        // Simulate deployment yielding output addresses and hashes seamlessly
        let address = format!("C_{}_{}", name, self.output.timestamp);
        let wasm_hash = format!("W_{}", name);

        self.output.contracts.insert(
            name.to_string(),
            ContractState::Deployed {
                address: address.clone(),
                wasm_hash: wasm_hash.clone(),
            },
        );
        self.output.save(&self.storage_path)?;

        // Emit consistent event loop
        println!(
            "EVENT: Contract {} deployed to {} (WASM: {})",
            name, address, wasm_hash
        );

        Ok(address)
    }

    /// Enforces initialization sequencing onto an already deployed contract
    pub fn initialize_contract(&mut self, name: &str, caller: &str) -> Result<(), String> {
        // Enforce strict authorization
        if caller != self.output.admin_address {
            return Err("Unauthorized caller".to_string());
        }

        let state = self
            .output
            .contracts
            .get(name)
            .ok_or("Contract not found")?;

        // Ensure deterministic handling and transitions
        match state {
            ContractState::Deployed { address, wasm_hash } => {
                self.output.contracts.insert(
                    name.to_string(),
                    ContractState::Initialized {
                        address: address.clone(),
                        wasm_hash: wasm_hash.clone(),
                    },
                );
                self.output.save(&self.storage_path)?;
                println!("EVENT: Contract {} initialized", name);
                Ok(())
            }
            ContractState::Initialized { .. } => Err("Already initialized".to_string()),
            _ => Err("Invalid state transition".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    #[test]
    fn test_valid_deployment_flow() {
        let temp_file = NamedTempFile::new().unwrap();
        let path = temp_file.path().to_path_buf();

        let mut deployer =
            Deployer::new(NetworkProfile::Testnet, "GAdmin".to_string(), path.clone());

        let deploy_req = deployer.deploy_contract("reward_distribution", "GAdmin");
        assert!(deploy_req.is_ok());

        let init_req = deployer.initialize_contract("reward_distribution", "GAdmin");
        assert!(init_req.is_ok());

        let loaded = DeploymentOutput::load(&path).unwrap();
        match loaded.contracts.get("reward_distribution") {
            Some(ContractState::Initialized { address, .. }) => {
                assert!(address.starts_with("C_reward_distribution_"));
            }
            _ => panic!("Expected initialized state"),
        }
    }

    #[test]
    fn test_unauthorized_deploy() {
        let temp_file = NamedTempFile::new().unwrap();
        let mut deployer = Deployer::new(
            NetworkProfile::Dev,
            "GAdmin".to_string(),
            temp_file.path().to_path_buf(),
        );

        let res = deployer.deploy_contract("coin_flip", "GHacker");
        assert_eq!(res, Err("Unauthorized".to_string()));
    }

    #[test]
    fn test_invalid_state_transition() {
        let temp_file = NamedTempFile::new().unwrap();
        let mut deployer = Deployer::new(
            NetworkProfile::Mainnet,
            "GAdmin".to_string(),
            temp_file.path().to_path_buf(),
        );

        let res_init_early = deployer.initialize_contract("missing", "GAdmin");
        assert_eq!(res_init_early, Err("Contract not found".to_string()));

        deployer.deploy_contract("dice_roll", "GAdmin").unwrap();
        deployer.initialize_contract("dice_roll", "GAdmin").unwrap();

        // Duplicate actions
        let duplicate_init = deployer.initialize_contract("dice_roll", "GAdmin");
        assert_eq!(duplicate_init, Err("Already initialized".to_string()));
    }
}
