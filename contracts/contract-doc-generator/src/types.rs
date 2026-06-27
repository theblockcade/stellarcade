use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum GeneratorState {
    Idle,
    Discovery,
    Parsing,
    Generation,
    Complete,
    Failed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractDoc {
    pub name: String,
    pub description: Option<String>,
    pub methods: Vec<MethodDoc>,
    pub types: Vec<TypeDoc>,
    pub events: Vec<EventDoc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MethodDoc {
    pub name: String,
    pub description: Option<String>,
    pub signature: String,
    pub parameters: Vec<ParameterDoc>,
    pub return_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterDoc {
    pub name: String,
    pub type_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypeDoc {
    pub name: String,
    pub description: Option<String>,
    pub fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventDoc {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractSummary {
    pub name: String,
    pub description: Option<String>,
    pub method_count: usize,
    pub type_count: usize,
    pub event_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratorSummary {
    pub state: GeneratorState,
    pub base_path: PathBuf,
    pub output_path: PathBuf,
    pub total_contracts: usize,
    pub total_methods: usize,
    pub total_types: usize,
    pub total_events: usize,
    pub contract_names: Vec<String>,
}
