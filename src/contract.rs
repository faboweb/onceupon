use core::panic;
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Order, QuerierWrapper, QueryRequest,
    Response, StdError, StdResult, Storage, WasmQuery,
};
use cw2::set_contract_version;
use cw721::OwnerOfResponse;
use cw_storage_plus::Map;
use schemars::Set;
use semver::Version;
use sg721_base::QueryMsg as SgQueryMsg;
use std::collections::{HashMap, HashSet};
use std::env;
use std::iter::FromIterator;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, GetStoryResponse, InstantiateMsg, MigrateMsg, QueryMsg};
use crate::state::{State, SECTIONS, SHARES, STATE, STORIES, VOTES};
use crate::types::{Section, SectionVotes, ShareBalance, Story, StoryOverviewItem, VoteEntry, NFT};

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

    // set new contract version
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
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
        ExecuteMsg::Cycle {} => cycle(deps, _env),
        ExecuteMsg::RemoveStory { story_id } => remove_story(deps, info, _env, story_id),
    }
}

fn verify_nft_ownwer(
    querier: QuerierWrapper,
    sender: &str,
    token_id: String,
    collection_address: String,
) -> Result<bool, ContractError> {
    let query_msg: SgQueryMsg = SgQueryMsg::OwnerOf {
        token_id,
        include_expired: None,
    };
    let query_response: OwnerOfResponse = querier.query(&QueryRequest::Wasm(WasmQuery::Smart {
        contract_addr: collection_address,
        msg: to_binary(&query_msg)?,
    }))?;
    let sender_is_owner = query_response.owner == sender;
    return Ok(sender_is_owner);
}

fn validate_section(
    querier: QuerierWrapper,
    sender: &str,
    section: &Section,
) -> Result<bool, ContractError> {
    // TODO currently can't test content as we are storing it on ipfs
    // let max_len_size = usize::try_from(MIN_LENGTH).unwrap();
    // if section.content.len() < max_len_size {
    //     return Err(ContractError::CustomError {
    //         val: "Sections need to be at least x long".to_string(),
    //     });
    // }
    if section.clone().content_cid.is_none() {
        return Err(ContractError::CustomError {
            val: "No content via IPFS CID provided".to_string(),
        });
    }
    if section.clone().content_cid.unwrap().len() != 59 {
        return Err(ContractError::CustomError {
            val: "Content cid has wrong format".to_string(),
        });
    }
    if section.nft.is_some() {
        if cfg!(test) {
            // TODO
            return Ok(true);
        }
        let nft = section.clone().nft.unwrap();
        if !!env::var("CHECK_NFTS").is_ok() {
            let sender_is_owner =
                verify_nft_ownwer(querier, sender, nft.token_id, nft.contract_address)?;
            if !sender_is_owner {
                return Err(ContractError::CustomError {
                    val: "Sender doesn't own NFT".to_string(),
                });
            }
        }
    }
    Ok(true)
}

pub fn new_story(
    deps: DepsMut,
    info: MessageInfo,
    env: Env,
    id: String,
    name: String,
    first_section: Section,
    interval: u64,
) -> Result<Response, ContractError> {
    let querier = deps.querier;
    let storage = deps.storage;
    let mut section = first_section.clone();
    let sender = info.sender.as_str();
    validate_section(querier, sender, &first_section)?;
    let existing_story = STORIES.has(storage, id.clone());
    if existing_story {
        return Err(ContractError::CustomError {
            val: "Story with that id already exists".to_string(),
        });
    }
    section.proposer = Some(String::from(sender.clone()));
    section.added = Some(env.block.height);
    let story = Story {
        id: id.clone(),
        name: name.clone(),
        last_section: env.block.height,
        interval,
        created: Some(env.block.height),
        creator: info.sender.to_string(),
        sections: [section].to_vec(),
        shares: None, // depr
    };
    STORIES.save(storage, id.clone(), &story)?;

    add_shares(storage, SHARES, &info.sender.to_string(), &id, 100)?;
    Ok(Response::new().add_attribute("method", "new_story"))
}

pub fn new_story_section(
    deps: DepsMut,
    info: MessageInfo,
    env: Env,
    _new_section: Section,
) -> Result<Response, ContractError> {
    let querier = deps.querier;
    let storage = deps.storage;
    let sender = info.sender.as_str();
    let mut new_section = _new_section.clone();
    validate_section(querier, sender, &new_section)?;
    let story = STORIES.may_load(storage, _new_section.story_id.clone())?;
    if story.is_none() {
        return Err(ContractError::CustomError {
            val: "Story not found".to_string(),
        });
    }
    let unwrapped_story = story.unwrap();

    if env.block.height >= unwrapped_story.last_section + unwrapped_story.interval {
        return Err(ContractError::CustomError {
            val: "Section submit interval is claused. Call 'cycle' or wait till someone calls it."
                .to_string(),
        });
    }

    new_section.proposer = Some(String::from(info.sender.as_str().clone()));
    new_section.added = Some(env.block.height);

    let k = (
        _new_section.story_id.to_string(),
        _new_section.section_id.to_string(),
    );
    let section_id_exists = SECTIONS.has(storage, k.clone());
    if section_id_exists {
        return Err(ContractError::CustomError {
            val: "Section with that id already exists".to_string(),
        });
    }

    SECTIONS.save(storage, k.clone(), &new_section)?;
    Ok(Response::new().add_attribute("method", "new_story_section"))
}

pub fn voting(
    deps: DepsMut,
    info: MessageInfo,
    _env: Env,
    story_id: String,
    section_id: String,
    vote: i8,
) -> Result<Response, ContractError> {
    let k = (
        story_id.to_string(),
        section_id.to_string(),
        info.sender.to_string(),
    );
    VOTES.save(deps.storage, k, &vote)?;
    Ok(Response::new().add_attribute("method", "voting"))
}

fn add_shares(
    storage: &mut dyn Storage,
    shares: Map<(String, String), u64>,
    user: &String,
    story_id: &String,
    amount: u64,
) -> Result<(), ContractError> {
    let user_shares = shares.may_load(storage, (story_id.to_string(), user.to_string()))?;
    let new_balance = if user_shares.is_none() {
        amount
    } else {
        user_shares.unwrap() + amount
    };
    let res = shares.save(
        storage,
        (story_id.to_string(), user.to_string()),
        &new_balance,
    );
    if res.is_err() {
        return Err(ContractError::CustomError {
            val: "Error saving shares".to_string()
                + &res.err().unwrap().to_string()
                + ","
                + &user
                + ","
                + &story_id,
        });
    }
    Ok(())
}

pub fn remove_story(
    deps: DepsMut,
    info: MessageInfo,
    _env: Env,
    story_id: String,
) -> Result<Response, ContractError> {
    let sender = info.sender.as_str();

    let state = STATE.load(deps.storage)?;
    if sender != state.owner {
        return Err(ContractError::CustomError {
            val: "Only admin con remove stories".to_string(),
        });
    }

    STORIES.remove(deps.storage, story_id.to_string());
    Ok(Response::new().add_attribute("method", "new_story"))
}

fn cycle(deps: DepsMut, env: Env) -> Result<Response, ContractError> {
    let storage = deps.storage;
    let votes = VOTES.range(storage, None, None, Order::Ascending);
    let mut voted_stories = HashMap::<String, HashMap<String, SectionVotes>>::new();
    votes.for_each(|vote| {
        let ((story_id, section_id, _), vote) = vote.unwrap();
        if voted_stories.contains_key(&story_id) {
            let mut section_votes = voted_stories.get(&story_id).unwrap().clone();
            let mut section_vote = section_votes.get(&section_id).unwrap().clone();
            if vote == 1 {
                section_vote.yes += 1;
            } else if vote == 2 {
                section_vote.veto += 1;
            }
            section_votes.insert(section_id.clone(), section_vote.to_owned());
            voted_stories.insert(story_id, section_votes.to_owned());
        } else {
            let mut section_votes = HashMap::<String, SectionVotes>::new();
            section_votes.insert(
                section_id.clone(),
                SectionVotes {
                    section_id: section_id.clone(),
                    yes: if vote == 1 { 1 } else { 0 },
                    veto: if vote == 2 { 1 } else { 0 },
                },
            );
            voted_stories.insert(story_id, section_votes.to_owned());
        }
    });

    // advance all unvoted stories to signal they have been processed
    let stories = STORIES.range(storage, None, None, Order::Ascending);
    let unvoted_stories: Vec<Story> = stories
        .into_iter()
        .filter_map(|story| {
            let (story_id, _story) = story.unwrap();
            if voted_stories.contains_key(&story_id) {
                None
            } else {
                Some(_story)
            }
        })
        .collect();
    unvoted_stories.into_iter().for_each(|mut story| {
        if story.last_section + story.interval <= env.block.height {
            story.last_section = env.block.height;
            let res = STORIES.save(storage, story.id.clone(), &story);
            if res.is_err() {
                panic!(
                    "Error saving story. {},{}",
                    res.err().unwrap(),
                    story.id.clone()
                );
            }
        }
    });

    voted_stories
        .into_iter()
        .for_each(|(story_id, section_votes)| {
            let mut story = STORIES.load(storage, story_id.clone()).unwrap();
            if (story.last_section + story.interval) > env.block.height {
                println!("skip");
                return;
            }

            // get winning section
            let top_section_votes = section_votes
                .values()
                .filter(|section_votes| {
                    section_votes.veto < section_votes.yes && section_votes.yes > 0
                })
                .max_by(|x, y| x.yes.cmp(&y.yes));

            if top_section_votes.is_none() {
                // if no winner decided, we open voting again
                story.last_section = env.block.height;
                let res = STORIES.save(storage, story_id.clone(), &story);
                if res.is_err() {
                    panic!(
                        "Error saving story. {},{}",
                        res.err().unwrap(),
                        story_id.clone()
                    );
                }
                return;
            }

            let top_section_votes_unwrapped = top_section_votes.unwrap();
            let top_section_res = SECTIONS.load(
                storage,
                (
                    story_id.clone(),
                    top_section_votes_unwrapped.section_id.to_string(),
                ),
            );
            let top_section = top_section_res.unwrap();

            // calculate shares of story
            let res = add_shares(
                storage,
                SHARES,
                &top_section.proposer.clone().unwrap(),
                &story_id,
                100,
            );
            if res.is_err() {
                panic!(
                    "Error saving shares. {},{}",
                    res.err().unwrap(),
                    story_id.clone()
                );
            }
            let votes: Vec<Result<((String, String), i8), StdError>> = VOTES
                .sub_prefix(story_id.clone())
                .range(storage, None, None, Order::Ascending)
                .collect();
            let votes_dedupe = Set::from_iter(votes.iter().map(|vote| {
                let ((_, addr), _) = vote.as_ref().unwrap();
                addr.to_string()
            }));
            votes_dedupe.iter().for_each(|addr| {
                let res = add_shares(storage, SHARES, &addr.to_string(), &story_id, 1);
                if res.is_err() {
                    panic!(
                        "Error saving shares. {},{}",
                        res.err().unwrap(),
                        story_id.clone()
                    );
                }
            });

            // update story
            story.last_section = env.block.height;
            story.sections = [story.sections.clone(), [top_section.clone()].to_vec()].concat();
            let res = STORIES.save(storage, story_id.clone(), &story);
            if res.is_err() {
                panic!(
                    "Error saving story. {},{}",
                    res.err().unwrap(),
                    story_id.clone()
                );
            }

            // clean up by removing used votes and sections
            let removable_sections: Vec<Result<(String, Section), StdError>> = SECTIONS
                .prefix(story_id.clone())
                .range(storage, None, None, Order::Ascending)
                .collect();
            removable_sections.iter().for_each(|r| {
                let (section_id, _) = r.as_ref().unwrap();
                SECTIONS.remove(storage, (story_id.clone(), section_id.clone()));
            });
            let removable_votes: Vec<Result<((String, String), i8), StdError>> = VOTES
                .sub_prefix(story_id.clone())
                .range(storage, None, None, Order::Ascending)
                .collect();
            removable_votes.iter().for_each(|r| {
                let ((section_id, addr), _) = r.as_ref().unwrap();
                VOTES.remove(
                    storage,
                    (story_id.clone(), section_id.clone(), addr.to_string()),
                );
            });
        });

    // delete used votes and sections
    // somehow need to clean up here as storage is not referencable inside the loop

    Ok(Response::new().add_attribute("method", "cycle"))
}

fn query_sections(deps: Deps, story_id: String) -> StdResult<Binary> {
    let sections = SECTIONS.range(deps.storage, None, None, Order::Ascending);
    let filtered_sections_iter = sections.into_iter().filter_map(|x| {
        let ((_story_id, _), section) = x.unwrap();
        if _story_id == story_id {
            Some(section)
        } else {
            None
        }
    });
    to_binary(&filtered_sections_iter.collect::<Vec<Section>>())
}

fn query_new_sections(deps: Deps, after: u64) -> StdResult<Binary> {
    let sections = SECTIONS.range(deps.storage, None, None, Order::Ascending);
    let filtered_sections_iter = sections.into_iter().filter_map(|x| {
        let ((_, _), section) = x.unwrap();
        if section.added.unwrap() > after {
            Some(section)
        } else {
            None
        }
    });
    to_binary(&filtered_sections_iter.collect::<Vec<Section>>())
}

fn query_votes(deps: Deps, story_id: String) -> StdResult<Binary> {
    let votes = VOTES.range(deps.storage, None, None, Order::Ascending);
    let filtered_votes_iter = votes.into_iter().filter_map(|x| {
        let ((_story_id, section_id, addr), vote) = x.unwrap();
        if _story_id == story_id {
            Some(VoteEntry {
                story_id: _story_id,
                section_id,
                user: addr,
                vote,
            })
        } else {
            None
        }
    });
    to_binary(&filtered_votes_iter.collect::<Vec<VoteEntry>>())
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
    }
}

fn query_story(deps: Deps, story_id: String) -> StdResult<Binary> {
    let story = STORIES.may_load(deps.storage, story_id.clone())?;
    if story.is_some() {
        let res = GetStoryResponse {
            story: story.unwrap(),
        };
        to_binary(&res)
    } else {
        return Err(StdError::generic_err("Story for id not found"));
    }
}

fn query_shares(deps: Deps, story_id: String) -> StdResult<Binary> {
    let shares = SHARES
        .prefix(story_id.clone())
        .range(deps.storage, None, None, Order::Ascending);
    to_binary(
        &shares
            .map(|r| {
                let (addr, balance) = r.unwrap();
                ShareBalance {
                    story_id: Some(story_id.clone()),
                    user: addr.to_string(),
                    balance,
                }
            })
            .collect::<Vec<ShareBalance>>(),
    )
}

fn query_stories(deps: Deps) -> StdResult<Binary> {
    let stories = STORIES.range(deps.storage, None, None, Order::Ascending);
    let _stories: Vec<StoryOverviewItem> = stories
        .into_iter()
        .map(|story| {
            let (story_id, story) = story.unwrap();
            let shares =
                SHARES
                    .prefix(story_id.clone())
                    .range(deps.storage, None, None, Order::Ascending);
            let sections =
                SECTIONS
                    .prefix(story_id.clone())
                    .range(deps.storage, None, None, Order::Ascending);
            let story_nfts = story
                .sections
                .clone()
                .into_iter()
                .filter_map(|section| {
                    if (*section.story_id == story.id) && section.nft.is_some() {
                        Some(section.nft.unwrap())
                    } else {
                        None
                    }
                })
                .into_iter();
            let dedupe_story_nfts = story_nfts
                .collect::<HashSet<NFT>>()
                .into_iter()
                .collect::<Vec<NFT>>();
            let top_story_nfts = dedupe_story_nfts.into_iter().take(4).collect();
            return StoryOverviewItem {
                id: story.id.clone(),
                name: story.name.clone(),
                created: story.created.unwrap(),
                last_section: story.last_section,
                next_section: story.last_section + story.interval,
                creator: story.creator.clone(),
                sections: story.sections.len(),
                owners: shares.count(),
                proposals: sections.count(),
                top_nfts: top_story_nfts,
                first_section: story.sections.get(0).unwrap().content.clone(),
                first_section_cid: story.sections.get(0).unwrap().content_cid.clone(),
            };
        })
        .collect();
    to_binary(&_stories)
}

#[cfg(test)]
mod tests {
    use crate::types::NFT;

    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coins, from_binary};

    #[test]
    fn cycle() {
        let mut deps = mock_dependencies();

        let mut env = mock_env();

        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(2, "token"));
        let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

        let msg = ExecuteMsg::NewStory {
            id: "a".to_string(),
            name: "a".to_string(),
            first_section: Section {
                section_id: "b".to_string(),
                story_id: "a".to_string(),
                content: None,
                content_cid: Some("abc123".to_string()),
                nft: Some(NFT {
                    protocol: None,
                    contract_address: "c".to_string(),
                    token_id: "d".to_string(),
                }),
                proposer: None,
                added: None,
            },
            interval: 10,
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        if res.is_err() {
            println!("{}", res.as_ref().unwrap_err())
        }
        assert!(res.is_ok());

        let res = query(
            deps.as_ref(),
            env.clone(),
            QueryMsg::GetStory {
                story_id: "a".to_string(),
            },
        )
        .unwrap();
        let value: GetStoryResponse = from_binary(&res).unwrap();
        assert_eq!(env.block.height, value.story.last_section);

        let msg = ExecuteMsg::NewStorySection {
            section: Section {
                section_id: "b".to_string(),
                story_id: "a".to_string(),
                content: None,
                content_cid: Some("abc123".to_string()),
                nft: None,
                proposer: None,
                added: None,
            },
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        assert!(res.is_ok());

        let res = query(
            deps.as_ref(),
            env.clone(),
            QueryMsg::GetSections {
                story_id: "a".to_string(),
            },
        )
        .unwrap();
        let value: Vec<Section> = from_binary(&res).unwrap();
        assert_eq!(1, value.len());

        env.block.height += 1;

        let msg = ExecuteMsg::Cycle {};
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        assert!(res.is_ok());

        let res = query(
            deps.as_ref(),
            env.clone(),
            QueryMsg::GetSections {
                story_id: "a".to_string(),
            },
        )
        .unwrap();
        let value: Vec<Section> = from_binary(&res).unwrap();
        assert_eq!(1, value.len());

        let res = query(
            deps.as_ref(),
            env.clone(),
            QueryMsg::GetStory {
                story_id: "a".to_string(),
            },
        )
        .unwrap();
        let value: GetStoryResponse = from_binary(&res).unwrap();
        assert_ne!(env.block.height, value.story.last_section);

        env.block.height += 9;
        println!("{}", env.block.height);

        // without votes, not progressing
        let msg = ExecuteMsg::Cycle {};
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        assert!(res.is_ok());

        let res = query(
            deps.as_ref(),
            env.clone(),
            QueryMsg::GetSections {
                story_id: "a".to_string(),
            },
        )
        .unwrap();
        let value: Vec<Section> = from_binary(&res).unwrap();
        assert_eq!(1, value.len());

        let res = query(
            deps.as_ref(),
            env.clone(),
            QueryMsg::GetStory {
                story_id: "a".to_string(),
            },
        )
        .unwrap();
        let value: GetStoryResponse = from_binary(&res).unwrap();
        assert_eq!(env.block.height, value.story.last_section);

        env.block.height += 10;

        // when voted, progress
        let msg = ExecuteMsg::Vote {
            story_id: "a".to_string(),
            section_id: "b".to_string(),
            vote: 1,
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        assert!(res.is_ok());

        let msg = ExecuteMsg::Cycle {};
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        assert!(res.is_ok());

        let res = query(
            deps.as_ref(),
            env.clone(),
            QueryMsg::GetSections {
                story_id: "a".to_string(),
            },
        )
        .unwrap();
        let value: Vec<Section> = from_binary(&res).unwrap();
        assert_eq!(0, value.len());

        let res = query(
            deps.as_ref(),
            env.clone(),
            QueryMsg::GetStory {
                story_id: "a".to_string(),
            },
        )
        .unwrap();
        let value: GetStoryResponse = from_binary(&res).unwrap();
        assert_eq!(env.block.height, value.story.last_section);

        let res = query(deps.as_ref(), env.clone(), QueryMsg::GetStories {}).unwrap();
        let value: Vec<StoryOverviewItem> = from_binary(&res).unwrap();
        assert_eq!("d".to_string(), value[0].top_nfts[0].token_id);
    }
}
