pub mod types;

pub use types::{
    ContractDoc, ContractSummary, EventDoc, GeneratorState, GeneratorSummary, MethodDoc,
    ParameterDoc, TypeDoc,
};

use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};

pub struct DocGenerator {
    pub base_path: PathBuf,
    pub output_path: PathBuf,
    pub state: GeneratorState,
    docs_cache: Vec<ContractDoc>,
}

impl DocGenerator {
    pub fn new(base_path: PathBuf, output_path: PathBuf) -> Self {
        Self {
            base_path,
            output_path,
            state: GeneratorState::Idle,
            docs_cache: Vec::new(),
        }
    }

    pub fn run(&mut self) -> Result<(), String> {
        self.state = GeneratorState::Discovery;
        println!("EVENT: Starting contract discovery in {:?}", self.base_path);

        let mut contracts = self.discover_contracts()?;
        contracts.sort();

        self.state = GeneratorState::Parsing;
        println!("EVENT: Parsing {} contracts", contracts.len());

        let mut docs = Vec::new();
        for contract_path in contracts {
            match self.parse_contract(&contract_path) {
                Ok(doc) => docs.push(doc),
                Err(e) => {
                    println!("WARNING: Failed to parse {:?}: {}", contract_path, e);
                }
            }
        }

        self.docs_cache = docs.clone();

        self.state = GeneratorState::Generation;
        println!("EVENT: Finalizing Markdown generation");

        self.write_docs(docs)?;

        self.state = GeneratorState::Complete;
        println!("EVENT: Documentation generation successful");

        Ok(())
    }

    fn discover_contracts(&self) -> Result<Vec<PathBuf>, String> {
        let mut contracts = Vec::new();
        let entries = fs::read_dir(&self.base_path).map_err(|e| e.to_string())?;

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_dir() {
                let cargo_toml = path.join("Cargo.toml");
                let src_lib = path.join("src").join("lib.rs");

                let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if name == "shared"
                    || name == "contract-doc-generator"
                    || name == "deployment-scripts"
                {
                    continue;
                }

                if cargo_toml.exists() && src_lib.exists() {
                    contracts.push(path);
                }
            }
        }
        Ok(contracts)
    }

    fn parse_contract(&self, path: &Path) -> Result<ContractDoc, String> {
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string();
        let lib_path = path.join("src").join("lib.rs");
        let content = fs::read_to_string(lib_path).map_err(|e| e.to_string())?;

        let mut doc = ContractDoc {
            name: name.clone(),
            description: None,
            methods: Vec::new(),
            types: Vec::new(),
            events: Vec::new(),
        };
        let fn_name_regex = Regex::new(r"fn\s+([a-zA-Z0-9_]+)").unwrap();
        let struct_name_regex = Regex::new(r"struct\s+([a-zA-Z0-9_]+)").unwrap();

        let mut lines = content.lines().peekable();
        let mut current_docs = Vec::new();

        while let Some(line) = lines.next() {
            let trimmed = line.trim();

            if trimmed.is_empty() {
                continue;
            }

            if let Some(doc_line) = trimmed.strip_prefix("///") {
                current_docs.push(doc_line.trim().to_string());
                continue;
            }

            if trimmed.starts_with("#[") {
                continue;
            }

            if doc.description.is_none()
                && !current_docs.is_empty()
                && (trimmed.contains("pub struct") || trimmed.contains("impl"))
            {
                doc.description = Some(current_docs.join(" "));
            }

            if trimmed.contains("pub fn") {
                let mut signature = trimmed.to_string();
                while !signature.contains('{') {
                    let Some(next_line) = lines.peek() else {
                        break;
                    };
                    let next_trimmed = next_line.trim();
                    if next_trimmed.is_empty() {
                        break;
                    }
                    signature.push(' ');
                    signature.push_str(next_trimmed);
                    lines.next();
                    if next_trimmed.contains('{') || next_trimmed.ends_with(';') {
                        break;
                    }
                }

                let normalized_signature = signature
                    .replace('{', "")
                    .split_whitespace()
                    .collect::<Vec<_>>()
                    .join(" ")
                    .replace("( ", "(")
                    .replace(", )", ")")
                    .replace(" )", ")");

                if let Some(cap) = fn_name_regex.captures(&normalized_signature) {
                    let (parameters, return_type) =
                        self.extract_params_and_return(&normalized_signature);
                    doc.methods.push(MethodDoc {
                        name: cap[1].to_string(),
                        description: if current_docs.is_empty() {
                            None
                        } else {
                            Some(current_docs.join(" "))
                        },
                        signature: normalized_signature,
                        parameters,
                        return_type,
                    });
                }
            }

            if trimmed.contains("struct") && !current_docs.is_empty() {
                if let Some(cap) = struct_name_regex.captures(trimmed) {
                    let struct_name = cap[1].to_string();
                    if struct_name.contains("Event") || struct_name.contains("Claimed") {
                        doc.events.push(EventDoc {
                            name: struct_name,
                            description: Some(current_docs.join(" ")),
                        });
                    } else {
                        doc.types.push(TypeDoc {
                            name: struct_name,
                            description: Some(current_docs.join(" ")),
                            fields: Vec::new(),
                        });
                    }
                }
            }

            current_docs.clear();
        }

        Ok(doc)
    }

    fn extract_params_and_return(&self, signature: &str) -> (Vec<ParameterDoc>, Option<String>) {
        let mut parameters = Vec::new();
        let mut return_type = None;

        let base_signature;
        if let Some(arrow_pos) = signature.find("->") {
            return_type = Some(signature[arrow_pos + 2..].trim().to_string());
            base_signature = &signature[..arrow_pos];
        } else {
            base_signature = signature;
        }

        if let Some(start_paren) = base_signature.find('(') {
            if let Some(end_paren) = base_signature.rfind(')') {
                let params_str = &base_signature[start_paren + 1..end_paren];
                if !params_str.trim().is_empty() {
                    for param in params_str.split(',') {
                        let parts: Vec<&str> = param.split(':').collect();
                        if parts.len() == 2 {
                            parameters.push(ParameterDoc {
                                name: parts[0].trim().to_string(),
                                type_name: parts[1].trim().to_string(),
                            });
                        }
                    }
                }
            }
        }

        (parameters, return_type)
    }

    fn write_docs(&self, mut docs: Vec<ContractDoc>) -> Result<(), String> {
        if !self.output_path.exists() {
            fs::create_dir_all(&self.output_path).map_err(|e| e.to_string())?;
        }

        docs.sort_by(|a, b| a.name.cmp(&b.name));

        for doc in docs {
            let file_name = format!("{}.md", doc.name);
            let file_path = self.output_path.join(&file_name);

            let mut content = format!("# {}\n\n", doc.name);
            if let Some(desc) = &doc.description {
                content.push_str(&format!("{}\n\n", desc));
            }

            if !doc.methods.is_empty() {
                content.push_str("## Public Methods\n\n");
                for m in &doc.methods {
                    content.push_str(&format!("### `{}`\n", m.name));
                    if let Some(d) = &m.description {
                        content.push_str(&format!("{}\n\n", d));
                    }
                    content.push_str(&format!("```rust\n{}\n```\n\n", m.signature));

                    if !m.parameters.is_empty() {
                        content.push_str("#### Parameters\n\n");
                        content.push_str("| Name | Type |\n");
                        content.push_str("|------|------|\n");
                        for p in &m.parameters {
                            content.push_str(&format!("| `{}` | `{}` |\n", p.name, p.type_name));
                        }
                        content.push('\n');
                    }

                    if let Some(rt) = &m.return_type {
                        content.push_str("#### Return Type\n\n");
                        content.push_str(&format!("`{}`\n\n", rt));
                    }
                }
            }

            if !doc.events.is_empty() {
                content.push_str("## Events\n\n");
                for e in &doc.events {
                    content.push_str(&format!(
                        "- **{}**: {}\n",
                        e.name,
                        e.description.as_deref().unwrap_or("No description")
                    ));
                }
                content.push('\n');
            }

            fs::write(file_path, content).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn state(&self) -> &GeneratorState {
        &self.state
    }

    pub fn summary(&self) -> GeneratorSummary {
        let mut total_methods = 0usize;
        let mut total_types = 0usize;
        let mut total_events = 0usize;
        let mut contract_names = Vec::new();

        for doc in &self.docs_cache {
            total_methods = total_methods.saturating_add(doc.methods.len());
            total_types = total_types.saturating_add(doc.types.len());
            total_events = total_events.saturating_add(doc.events.len());
            contract_names.push(doc.name.clone());
        }

        GeneratorSummary {
            state: self.state.clone(),
            base_path: self.base_path.clone(),
            output_path: self.output_path.clone(),
            total_contracts: self.docs_cache.len(),
            total_methods,
            total_types,
            total_events,
            contract_names,
        }
    }

    pub fn contract_summary(&self, name: &str) -> Option<ContractSummary> {
        self.docs_cache
            .iter()
            .find(|d| d.name == name)
            .map(|doc| ContractSummary {
                name: doc.name.clone(),
                description: doc.description.clone(),
                method_count: doc.methods.len(),
                type_count: doc.types.len(),
                event_count: doc.events.len(),
            })
    }

    pub fn contract_doc(&self, name: &str) -> Option<&ContractDoc> {
        self.docs_cache.iter().find(|d| d.name == name)
    }

    pub fn total_contracts(&self) -> usize {
        self.docs_cache.len()
    }

    pub fn total_methods(&self) -> usize {
        self.docs_cache.iter().map(|d| d.methods.len()).sum()
    }
}

#[cfg(test)]
mod test;
