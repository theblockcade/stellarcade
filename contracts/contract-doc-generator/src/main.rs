use std::env;
use std::path::PathBuf;
use stellarcade_contract_doc_generator::DocGenerator;

fn main() {
    let _args: Vec<String> = env::args().collect();

    let current_dir = env::current_dir().unwrap_or_default();
    let is_in_pkg = current_dir
        .to_str()
        .map(|s| s.contains("contract-doc-generator"))
        .unwrap_or(false);

    let base_path = if is_in_pkg {
        PathBuf::from("..")
    } else {
        PathBuf::from("contracts")
    };
    let output_path = if is_in_pkg {
        PathBuf::from("../../docs/contracts")
    } else {
        PathBuf::from("docs/contracts")
    };

    let mut generator = DocGenerator::new(base_path, output_path);

    if let Err(e) = generator.run() {
        eprintln!("ERROR: {}", e);
        std::process::exit(1);
    }
}
