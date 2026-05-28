use soroban_sdk::{Address, Env};

use crate::{
    types::{CompletionRecord, QuestConfig},
    DataKey,
};

pub fn get_quest(env: &Env, quest_id: u32) -> Option<QuestConfig> {
    env.storage().persistent().get(&DataKey::Quest(quest_id))
}

pub fn set_quest(env: &Env, quest: &QuestConfig) {
    env.storage()
        .persistent()
        .set(&DataKey::Quest(quest.quest_id), quest);
}

pub fn get_completion(env: &Env, quest_id: u32, user: &Address) -> Option<CompletionRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Completion(quest_id, user.clone()))
}

pub fn set_completion(env: &Env, user: &Address, completion: &CompletionRecord) {
    env.storage().persistent().set(
        &DataKey::Completion(completion.quest_id, user.clone()),
        completion,
    );
}
