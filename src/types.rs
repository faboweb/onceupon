use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Story {
    pub id: String,
    pub name: String,
    pub created: u64,
    pub last_section: Option<u64>, // depr
    pub last_cycle: Option<u64>,   // block height of last cycle execution
    pub interval: u64,             // blocks till next round of voting
    pub creator: String,           // user id
    pub sections: Vec<Section>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema, Hash, Eq)]
pub struct NFT {
    pub protocol: Option<String>, // default to stargaze for now
    pub contract_address: String,
    pub token_id: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, JsonSchema)]
pub struct UploadSection {
    pub section_id: String,
    pub story_id: String,
    pub content_cid: String,
    pub nft: Option<NFT>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, JsonSchema)]
pub struct Section {
    pub section_id: String,
    pub story_id: String,
    pub content_cid: String,
    pub nft: Option<NFT>,
    pub proposer: String,
    pub added: u64,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, JsonSchema)]
pub struct VoteSubmission {
    pub section_id: String,
    pub story_id: String,
    pub vote: i8, // 1 - yes, 2 - veto, 0 - no vote
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, JsonSchema)]
pub struct VoteEntry {
    pub section_id: String,
    pub story_id: String,
    pub vote: i8, // 1 - yes, 2 - veto
    pub user: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, JsonSchema)]
pub struct SectionVotes {
    pub section_id: String,
    pub yes: i32,
    pub veto: i32,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, JsonSchema)]
pub struct ShareBalance {
    pub story_id: String,
    pub user: String,
    pub balance: u64,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, JsonSchema)]
pub struct Export {
    // pub state: State,
    pub stories: Vec<Story>,
    pub sections: Vec<Section>,
    pub votes: Vec<(String, String, String, i8)>,
    pub shares: Vec<(String, String, u64)>,
}
