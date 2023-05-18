use cosmwasm_schema::QueryResponses;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::types::{Section, ShareBalance, Story, StoryOverviewItem, UploadSection, VoteEntry};

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
        story_id: String,
        section_id: String,
        vote: i8,
    },
    Cycle {},
    RemoveStory {
        story_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema, QueryResponses)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    #[returns(Vec<StoryOverviewItem>)]
    GetStories {},
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
}
