use crate::error::ContractError;
use crate::state::{SECTIONS, SHARES, STATE, STORIES, VOTES};
use crate::types::{Section, SectionVotes, Story, UploadSection, VoteSubmission};
use cosmwasm_std::{
    to_binary, DepsMut, Env, MessageInfo, Order, QuerierWrapper, QueryRequest, Response, StdError,
    Storage, WasmQuery,
};
use cw721::OwnerOfResponse;
use cw_storage_plus::Map;
use schemars::Set;
use sg721_base::QueryMsg as SgQueryMsg;
use std::collections::HashMap;
use std::env;
use std::iter::FromIterator;

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

// text content should be uploaded to an IPFS provider as 'section.txt' containing the text
// Example: https://bafybeica7hrrxfy5b55m54frre7jvfqujrnk2daprk3qjskfhc3i5zv46y.ipfs.w3s.link/
// I use https://web3.storage/
// the CID is then used in the section here
fn validate_section(
    querier: QuerierWrapper,
    sender: &str,
    section: &UploadSection,
) -> Result<bool, ContractError> {
    // TODO currently can't test content as we are storing it on ipfs
    // let max_len_size = usize::try_from(MIN_LENGTH).unwrap();
    // if section.content.len() < max_len_size {
    //     return Err(ContractError::CustomError {
    //         val: "Sections need to be at least x long".to_string(),
    //     });
    // }
    if section.clone().content_cid.len() != 59 {
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
    section_uploaded: UploadSection,
    interval: u64,
) -> Result<Response, ContractError> {
    let querier = deps.querier;
    let storage = deps.storage;
    let sender = info.sender.as_str();
    validate_section(querier, sender, &section_uploaded)?;
    let existing_story = STORIES.has(storage, id.clone());
    if existing_story {
        return Err(ContractError::CustomError {
            val: "Story with that id already exists".to_string(),
        });
    }
    let section = Section {
        section_id: section_uploaded.section_id,
        story_id: section_uploaded.story_id,
        content_cid: section_uploaded.content_cid,
        nft: section_uploaded.nft,
        proposer: String::from(sender.clone()),
        added: env.block.height,
    };
    let story = Story {
        id: id.clone(),
        name: name.clone(),
        last_cycle: Some(env.block.height),
        last_section: Some(env.block.height),
        interval,
        created: env.block.height,
        creator: info.sender.to_string(),
        sections: [section].to_vec(),
    };
    STORIES.save(storage, id.clone(), &story)?;

    add_shares(storage, SHARES, &info.sender.to_string(), &id, 100)?;
    Ok(Response::new().add_attribute("method", "new_story"))
}

pub fn new_story_section(
    deps: DepsMut,
    info: MessageInfo,
    env: Env,
    section_uploaded: UploadSection,
) -> Result<Response, ContractError> {
    let querier = deps.querier;
    let storage = deps.storage;
    let sender = info.sender.as_str();
    validate_section(querier, sender, &section_uploaded)?;
    let story = STORIES.may_load(storage, section_uploaded.story_id.clone())?;
    if story.is_none() {
        return Err(ContractError::CustomError {
            val: "Story not found".to_string(),
        });
    }
    let unwrapped_story = story.unwrap();

    if env.block.height >= unwrapped_story.last_cycle.unwrap() + unwrapped_story.interval {
        return Err(ContractError::CustomError {
            val: "Section submit interval is claused. Call 'cycle' or wait till someone calls it."
                .to_string(),
        });
    }
    let section = Section {
        section_id: section_uploaded.section_id,
        story_id: section_uploaded.story_id,
        content_cid: section_uploaded.content_cid,
        nft: section_uploaded.nft,
        proposer: String::from(sender.clone()),
        added: env.block.height,
    };

    let k = (section.story_id.to_string(), section.section_id.to_string());
    let section_id_exists = SECTIONS.has(storage, k.clone());
    if section_id_exists {
        return Err(ContractError::CustomError {
            val: "Section with that id already exists".to_string(),
        });
    }

    SECTIONS.save(storage, k.clone(), &section)?;
    Ok(Response::new().add_attribute("method", "new_story_section"))
}

pub fn vote_multiple(
    deps: DepsMut,
    info: MessageInfo,
    _env: Env,
    votes: Vec<VoteSubmission>,
) -> Result<Response, ContractError> {
    let res = votes.into_iter().all(|vote| {
        let k = (
            vote.story_id.to_string(),
            vote.section_id.to_string(),
            info.sender.to_string(),
        );
        VOTES.save(deps.storage, k, &vote.vote).is_ok()
    });
    if res == false {
        return Err(ContractError::CustomError {
            val: "Not all votes where successful".to_string(),
        });
    }
    Ok(Response::new().add_attribute("method", "voteMultiple"))
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
    Ok(Response::new().add_attribute("method", "remove_story"))
}

// the main step function
// should be run once a day, currently by an external lambda function
// chooses the most voted proposal and adds it to the story
// clears current proposals then out of the queue
pub fn cycle(deps: DepsMut, env: Env) -> Result<Response, ContractError> {
    let storage = deps.storage;
    let votes = VOTES.range(storage, None, None, Order::Ascending);
    let mut voted_stories = HashMap::<String, HashMap<String, SectionVotes>>::new();
    votes.for_each(|vote| {
        let ((story_id, section_id, _), vote) = vote.unwrap();
        if voted_stories.contains_key(&story_id) {
            let mut section_votes = voted_stories.get(&story_id).unwrap().clone();
            if section_votes.contains_key(&section_id) {
                let mut section_vote = section_votes.get(&section_id).unwrap().clone();
                if vote == 1 {
                    section_vote.yes += 1;
                } else if vote == 2 {
                    section_vote.veto += 1;
                }
                section_votes.insert(section_id.clone(), section_vote.to_owned());
            } else {
                section_votes.insert(
                    section_id.clone(),
                    SectionVotes {
                        section_id: section_id.clone(),
                        yes: if vote == 1 { 1 } else { 0 },
                        veto: if vote == 2 { 1 } else { 0 },
                    },
                );
            }
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
        if story.last_cycle.unwrap() + story.interval <= env.block.height {
            story.last_cycle = Some(env.block.height);
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
            if (story.last_cycle.unwrap() + story.interval) > env.block.height {
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
                story.last_cycle = Some(env.block.height);
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
                &top_section.proposer.clone(),
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
            story.last_cycle = Some(env.block.height);
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
