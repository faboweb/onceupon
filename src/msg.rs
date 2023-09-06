use cosmwasm_schema::QueryResponses;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[allow(unused_imports)] // the imports are used in return derive annotations
use crate::types::{
    Export, Section, ShareBalance, Story, UploadSection, VoteEntry, VoteSubmission,
};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct MigrateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    NewStory {
        id: String,
        name: String,
        first_section: UploadSection,
        interval: u64, // how long until next section
    },
    NewStorySection {
        section: UploadSection,
    },
    Vote {
        votes: Vec<VoteSubmission>,
    },
    Cycle {},
    RemoveStory {
        story_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema, QueryResponses)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    #[returns(Story)]
    GetStory { story_id: String },
    #[returns(Vec<Section>)]
    GetSections { story_id: String },
    #[returns(Vec<VoteEntry>)]
    GetVotes { story_id: String },
    #[returns(Vec<ShareBalance>)]
    GetShares { story_id: String },
    #[returns(Vec<Section>)]
    GetNewSections { after: u64 },
    #[returns(Export)]
    GetState {},
}
