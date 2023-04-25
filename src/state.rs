use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

use crate::types::{Section, Story};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub owner: Addr,
}

pub const STATE: Item<State> = Item::new("state");

pub const STORIES: Map<String, Story> = Map::new("stories");
pub const SECTIONS: Map<(String, String), Section> = Map::new("sections");
pub const VOTES: Map<(String, String, String), i8> = Map::new("votes"); // 1 - yes, 2 - veto
pub const SHARES: Map<(String, String), u64> = Map::new("shares");
