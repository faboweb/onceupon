use crate::state::{self, SECTIONS, SHARES, STATE, STORIES, VOTES};
use crate::types::{Export, Section, ShareBalance, Story, StoryOverviewItem, VoteEntry, NFT};
use cosmwasm_std::{to_binary, Binary, Deps, Order, StdError, StdResult};
use std::collections::HashSet;

pub fn query_sections(deps: Deps, story_id: String) -> StdResult<Binary> {
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

// new sections = proposals
pub fn query_new_sections(deps: Deps, after: u64) -> StdResult<Binary> {
    let sections = SECTIONS.range(deps.storage, None, None, Order::Ascending);
    let filtered_sections_iter = sections.into_iter().filter_map(|x| {
        let ((_, _), section) = x.unwrap();
        if section.added > after {
            Some(section)
        } else {
            None
        }
    });
    to_binary(&filtered_sections_iter.collect::<Vec<Section>>())
}

pub fn query_votes(deps: Deps, story_id: String) -> StdResult<Binary> {
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

pub fn query_story(deps: Deps, story_id: String) -> StdResult<Binary> {
    let story = STORIES.may_load(deps.storage, story_id.clone())?;
    if story.is_some() {
        to_binary(&story)
    } else {
        return Err(StdError::generic_err("Story for id not found"));
    }
}

pub fn query_shares(deps: Deps, story_id: String) -> StdResult<Binary> {
    let shares = SHARES
        .prefix(story_id.clone())
        .range(deps.storage, None, None, Order::Ascending);
    to_binary(
        &shares
            .map(|r| {
                let (addr, balance) = r.unwrap();
                ShareBalance {
                    story_id: story_id.clone(),
                    user: addr.to_string(),
                    balance,
                }
            })
            .collect::<Vec<ShareBalance>>(),
    )
}

pub fn query_state(deps: Deps) -> StdResult<Binary> {
    let export = Export {
        stories: STORIES
            .range(deps.storage, None, None, Order::Ascending)
            .map(|story| story.unwrap().1)
            .collect::<Vec<Story>>(),
        sections: SECTIONS
            .range(deps.storage, None, None, Order::Ascending)
            .map(|section| section.unwrap().1)
            .collect::<Vec<Section>>(),
        votes: VOTES
            .range(deps.storage, None, None, Order::Ascending)
            .map(|vote| {
                let _vote = vote.unwrap();
                (
                    _vote.0 .0, // story_id
                    _vote.0 .1, // section_id
                    _vote.0 .2, // user
                    _vote.1,    // vote
                )
            })
            .collect::<Vec<(String, String, String, i8)>>(),
        shares: SHARES
            .range(deps.storage, None, None, Order::Ascending)
            .map(|share| {
                let _share = share.unwrap();
                (_share.0 .0, _share.0 .1, _share.1)
            })
            .collect::<Vec<(String, String, u64)>>(),
    };
    to_binary(&export)
}

// pub fn query_authors(deps: Deps) -> StdResult<Binary> {
//     let shares = SHARES.range(deps.storage, None, None, Order::Ascending);
//     to_binary(
//         &shares
//             .map(|r| {
//                 let (addr, balance) = r.unwrap();
//                 ShareBalance {
//                     story_id: story_id.clone(),
//                     user: addr.to_string(),
//                     balance,
//                 }
//             })
//             .collect::<Vec<ShareBalance>>(),
//     )
// }

pub fn query_stories(deps: Deps) -> StdResult<Binary> {
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
                id: story.id,
                name: story.name,
                created: story.created,
                last_section: story.last_section,
                next_section: story.last_section + story.interval,
                last_update: story.sections.last().unwrap().added,
                creator: story.creator,
                sections: story.sections.len(),
                owners: shares.count(),
                proposals: sections.count(),
                top_nfts: top_story_nfts,
                first_section_cid: story.sections.get(0).unwrap().content_cid.clone(),
            };
        })
        .collect();
    to_binary(&_stories)
}
