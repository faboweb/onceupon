#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{Binary, Deps, DepsMut, Env, MessageInfo, Order, Response, StdError, StdResult};
use cw2::set_contract_version;
use semver::Version;
use std::env;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg};
use crate::state::{State, STATE, STORIES};

use crate::execute::{cycle, new_story, new_story_section, remove_story, voteMultiple, voting};
use crate::query::{
    query_new_sections, query_sections, query_shares, query_state, query_stories, query_story,
    query_votes,
};
use crate::types::Story;

// version info for migration info
const COMPATIBLE_MIGRATION_CONTRACT_NAME: &str = "crates.io:onceupon-cosmwasm";
const CONTRACT_NAME: &str = "crates.io:onceupon-cosmwasm";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// const MIN_LENGTH: u32 = 240;

#[entry_point]
pub fn migrate(deps: DepsMut, _env: Env, _msg: MigrateMsg) -> Result<Response, ContractError> {
    let current_version = cw2::get_contract_version(deps.storage)?;
    if ![CONTRACT_NAME, COMPATIBLE_MIGRATION_CONTRACT_NAME]
        .contains(&current_version.contract.as_str())
    {
        return Err(StdError::generic_err("Cannot upgrade to a different contract").into());
    }

    let version: Version = current_version
        .version
        .parse()
        .map_err(|_| StdError::generic_err("Invalid contract version"))?;
    let new_version: Version = CONTRACT_VERSION
        .parse()
        .map_err(|_| StdError::generic_err("Invalid contract version"))?;

    // current version not launchpad v2
    if version > new_version {
        return Err(StdError::generic_err("Cannot upgrade to a previous contract version").into());
    }
    // if same version return
    if version == new_version {
        return Ok(Response::new());
    }

    // migrate data
    let storage = deps.storage;
    let stories = STORIES.range(storage, None, None, Order::Ascending);
    let updated_stories = stories
        .into_iter()
        .map(|_story| {
            let mut story = _story.unwrap().1.clone();
            story.last_cycle = story.last_section;
            return story;
        })
        .collect::<Vec<Story>>();
    updated_stories.into_iter().for_each(|story| {
        let res = STORIES.save(storage, story.clone().id, &story);
        if res.is_err() {
            panic!(
                "Error saving story. {},{}",
                res.err().unwrap(),
                story.id.clone()
            );
        }
    });

    // set new contract version
    set_contract_version(storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let state = State {
        owner: info.sender.clone(),
    };
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::NewStory {
            id,
            name,
            first_section,
            interval,
        } => new_story(deps, info, _env, id, name, first_section, interval),
        ExecuteMsg::NewStorySection { section } => new_story_section(deps, info, _env, section),
        ExecuteMsg::Vote {
            story_id,
            section_id,
            vote,
        } => voting(deps, info, _env, story_id, section_id, vote),
        ExecuteMsg::VoteMultiple { votes } => voteMultiple(deps, info, _env, votes),
        ExecuteMsg::Cycle {} => cycle(deps, _env),
        ExecuteMsg::RemoveStory { story_id } => remove_story(deps, info, _env, story_id),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetStory { story_id } => query_story(deps, story_id),
        QueryMsg::GetStories {} => query_stories(deps),
        QueryMsg::GetVotes { story_id } => query_votes(deps, story_id),
        QueryMsg::GetSections { story_id } => query_sections(deps, story_id),
        QueryMsg::GetShares { story_id } => query_shares(deps, story_id),
        QueryMsg::GetNewSections { after } => query_new_sections(deps, after),
        QueryMsg::GetState {} => query_state(deps),
    }
}
