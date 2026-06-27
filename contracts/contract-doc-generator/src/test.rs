#![cfg(test)]

use super::*;
use tempfile::tempdir;

fn create_test_dir() -> tempfile::TempDir {
    tempdir().unwrap()
}

fn create_contract_dir(base: &std::path::Path, name: &str) -> std::path::PathBuf {
    let contract_dir = base.join(name);
    let src_dir = contract_dir.join("src");
    fs::create_dir_all(&src_dir).unwrap();
    contract_dir
}

#[test]
fn test_parsing_logic() {
    let dir = create_test_dir();
    let src_dir = dir.path().join("src");
    fs::create_dir(&src_dir).unwrap();
    let lib_rs = src_dir.join("lib.rs");

    let mock_code = r#"
/// The Reward Distribution contract manages lifecycle of rewards.
#[contract]
pub struct RewardContract;

#[contractimpl]
impl RewardContract {
    /// Initializes the contract.
    pub fn init(env: Env, admin: Address) { }

    /// Accrues rewards for a user.
    pub fn accrue(env: Env, user: Address) { }
}

/// Emitted when a reward is claimed.
#[contractevent]
pub struct RewardClaimed {
    pub user: Address,
    pub amount: i128,
}
"#;
    fs::write(lib_rs, mock_code).unwrap();
    fs::write(dir.path().join("Cargo.toml"), "").unwrap();

    let generator = DocGenerator::new(dir.path().to_path_buf(), dir.path().join("docs"));
    let doc = generator.parse_contract(dir.path()).unwrap();

    assert_eq!(doc.name, dir.path().file_name().unwrap().to_str().unwrap());
    assert!(doc.description.unwrap().contains("Reward Distribution"));
    assert_eq!(doc.methods.len(), 2);
    assert_eq!(doc.methods[0].name, "init");
    assert_eq!(doc.methods[0].parameters.len(), 2);
    assert_eq!(doc.methods[0].parameters[0].name, "env");
    assert_eq!(doc.methods[0].parameters[0].type_name, "Env");
    assert_eq!(doc.events.len(), 1);
    assert_eq!(doc.events[0].name, "RewardClaimed");
}

#[test]
fn test_multiline_method_signature_parsing() {
    let dir = create_test_dir();
    let src_dir = dir.path().join("src");
    fs::create_dir(&src_dir).unwrap();
    let lib_rs = src_dir.join("lib.rs");

    let mock_code = r#"
#[contract]
pub struct PrizePool;

#[contractimpl]
impl PrizePool {
    /// Releases reserved amount.
    pub fn release(
        env: Env,
        admin: Address,
        game_id: u64,
        amount: i128,
    ) -> Result<(), Error> {
        Ok(())
    }
}
"#;
    fs::write(lib_rs, mock_code).unwrap();
    fs::write(dir.path().join("Cargo.toml"), "").unwrap();

    let generator = DocGenerator::new(dir.path().to_path_buf(), dir.path().join("docs"));
    let doc = generator.parse_contract(dir.path()).unwrap();

    assert_eq!(doc.methods.len(), 1);
    assert_eq!(doc.methods[0].name, "release");
    assert_eq!(
        doc.methods[0].signature,
        "pub fn release(env: Env, admin: Address, game_id: u64, amount: i128) -> Result<(), Error>"
    );
    assert_eq!(doc.methods[0].parameters.len(), 4);
    assert_eq!(doc.methods[0].parameters[2].name, "game_id");
    assert_eq!(doc.methods[0].parameters[2].type_name, "u64");
    assert_eq!(
        doc.methods[0].return_type.as_deref(),
        Some("Result<(), Error>")
    );
}

#[test]
fn test_state_idle_on_new_generator() {
    let generator = DocGenerator::new(
        std::path::PathBuf::from("."),
        std::path::PathBuf::from("./docs"),
    );

    assert_eq!(*generator.state(), GeneratorState::Idle);
    assert_eq!(generator.total_contracts(), 0);
    assert_eq!(generator.total_methods(), 0);
}

#[test]
fn test_total_contracts_zero_for_empty_cache() {
    let generator = DocGenerator::new(
        std::path::PathBuf::from("."),
        std::path::PathBuf::from("./docs"),
    );

    assert_eq!(generator.total_contracts(), 0);
}

#[test]
fn test_total_methods_zero_for_empty_cache() {
    let generator = DocGenerator::new(
        std::path::PathBuf::from("."),
        std::path::PathBuf::from("./docs"),
    );

    assert_eq!(generator.total_methods(), 0);
}

#[test]
fn test_contract_doc_returns_none_for_unknown() {
    let generator = DocGenerator::new(
        std::path::PathBuf::from("."),
        std::path::PathBuf::from("./docs"),
    );

    assert!(generator.contract_doc("unknown-contract").is_none());
}

#[test]
fn test_contract_summary_returns_none_for_unknown() {
    let generator = DocGenerator::new(
        std::path::PathBuf::from("."),
        std::path::PathBuf::from("./docs"),
    );

    assert!(generator.contract_summary("unknown-contract").is_none());
}

#[test]
fn test_summary_returns_empty_for_idle_generator() {
    let generator = DocGenerator::new(
        std::path::PathBuf::from("."),
        std::path::PathBuf::from("./docs"),
    );

    let summary = generator.summary();
    assert_eq!(summary.state, GeneratorState::Idle);
    assert_eq!(summary.total_contracts, 0);
    assert_eq!(summary.total_methods, 0);
    assert_eq!(summary.total_types, 0);
    assert_eq!(summary.total_events, 0);
    assert!(summary.contract_names.is_empty());
}

#[test]
fn test_state_after_parsing() {
    let dir = create_test_dir();
    let contract_dir = create_contract_dir(dir.path(), "test-contract");

    let mock_code = r#"
/// A test contract.
pub fn test(env: Env) -> Result<(), Error> { Ok(()) }
"#;
    fs::write(contract_dir.join("src").join("lib.rs"), mock_code).unwrap();
    fs::write(contract_dir.join("Cargo.toml"), "").unwrap();

    let mut generator = DocGenerator::new(dir.path().to_path_buf(), dir.path().join("docs"));
    assert!(matches!(*generator.state(), GeneratorState::Idle));

    generator.run().unwrap();

    assert!(matches!(*generator.state(), GeneratorState::Complete));
    assert_eq!(generator.total_contracts(), 1);
    assert_eq!(generator.total_methods(), 1);
}

#[test]
fn test_contract_doc_found_after_run() {
    let dir = create_test_dir();
    let contract_dir = create_contract_dir(dir.path(), "test-contract");

    let mock_code = r#"
/// A test contract.
pub fn test(env: Env) -> Result<(), Error> { Ok(()) }
"#;
    fs::write(contract_dir.join("src").join("lib.rs"), mock_code).unwrap();
    fs::write(contract_dir.join("Cargo.toml"), "").unwrap();

    let mut generator = DocGenerator::new(dir.path().to_path_buf(), dir.path().join("docs"));
    generator.run().unwrap();

    let doc = generator.contract_doc("test-contract");
    assert!(doc.is_some());
    assert_eq!(doc.unwrap().methods.len(), 1);
}

#[test]
fn test_contract_summary_found_after_run() {
    let dir = create_test_dir();
    let contract_dir = create_contract_dir(dir.path(), "test-contract");

    let mock_code = r#"
/// A test contract.
pub fn test(env: Env) -> Result<(), Error> { Ok(()) }
"#;
    fs::write(contract_dir.join("src").join("lib.rs"), mock_code).unwrap();
    fs::write(contract_dir.join("Cargo.toml"), "").unwrap();

    let mut generator = DocGenerator::new(dir.path().to_path_buf(), dir.path().join("docs"));
    generator.run().unwrap();

    let summary = generator.contract_summary("test-contract");
    assert!(summary.is_some());
    assert_eq!(summary.unwrap().method_count, 1);
}

#[test]
fn test_summary_has_data_after_run() {
    let dir = create_test_dir();
    let contract_dir = create_contract_dir(dir.path(), "test-contract");

    let mock_code = r#"
/// A test contract.
pub fn test(env: Env) -> Result<(), Error> { Ok(()) }
"#;
    fs::write(contract_dir.join("src").join("lib.rs"), mock_code).unwrap();
    fs::write(contract_dir.join("Cargo.toml"), "").unwrap();

    let mut generator = DocGenerator::new(dir.path().to_path_buf(), dir.path().join("docs"));
    generator.run().unwrap();

    let summary = generator.summary();
    assert_eq!(summary.total_contracts, 1);
    assert_eq!(summary.total_methods, 1);
    assert!(summary
        .contract_names
        .contains(&"test-contract".to_string()));
}

#[test]
fn test_run_in_empty_directory() {
    let dir = create_test_dir();
    let mut generator = DocGenerator::new(dir.path().to_path_buf(), dir.path().join("docs"));
    generator.run().unwrap();

    assert_eq!(generator.total_contracts(), 0);
    assert_eq!(generator.total_methods(), 0);
}

#[test]
fn test_excludes_shared_and_generator_dirs() {
    let dir = create_test_dir();

    let shared_dir = dir.path().join("shared");
    fs::create_dir(&shared_dir).unwrap();
    fs::create_dir(shared_dir.join("src")).unwrap();
    fs::write(shared_dir.join("src").join("lib.rs"), "// empty").unwrap();
    fs::write(shared_dir.join("Cargo.toml"), "").unwrap();

    let gen_dir = dir.path().join("contract-doc-generator");
    fs::create_dir(&gen_dir).unwrap();
    fs::create_dir(gen_dir.join("src")).unwrap();
    fs::write(gen_dir.join("src").join("lib.rs"), "// empty").unwrap();
    fs::write(gen_dir.join("Cargo.toml"), "").unwrap();

    let mut generator = DocGenerator::new(dir.path().to_path_buf(), dir.path().join("docs"));
    generator.run().unwrap();

    assert_eq!(generator.total_contracts(), 0);
}
