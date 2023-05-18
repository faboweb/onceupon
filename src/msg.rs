use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::types::{Story, UploadSection};

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

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetStories {},
    GetStory { story_id: String },
    GetSections { story_id: String },
    GetVotes { story_id: String },
    GetShares { story_id: String },
    GetNewSections { after: u64 },
}

// We define a custom struct for each query response
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GetCountResponse {
    pub count: i32,
}

// We define a custom struct for each query response
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GetStoryResponse {
    pub story: Story,
}
