#[cfg(test)]
mod tests {
    use crate::contract::{execute, instantiate, query};
    use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
    use crate::state::VOTES;
    use crate::types::{Export, Section, Story, UploadSection, VoteSubmission, NFT};

    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coins, from_binary};

    #[test]
    fn cycle() {
        let mut deps = mock_dependencies();

        let mut env = mock_env();

        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(2, "token"));
        let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

        let cid = "bafybeica7hrrxfy5b55m54frre7jvfqujrnk2daprk3qjskfhc3i5zv46y".to_string();
        let msg = ExecuteMsg::NewStory {
            id: "a".to_string(),
            name: "a".to_string(),
            first_section: UploadSection {
                section_id: "b".to_string(),
                story_id: "a".to_string(),
                content_cid: cid.clone(),
                nft: Some(NFT {
                    protocol: None,
                    contract_address: "c".to_string(),
                    token_id: "d".to_string(),
                }),
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
        let value: Story = from_binary(&res).unwrap();
        assert_eq!(env.block.height, value.last_cycle.unwrap());

        let msg = ExecuteMsg::NewStorySection {
            section: UploadSection {
                section_id: "b".to_string(),
                story_id: "a".to_string(),
                content_cid: cid.clone(),
                nft: None,
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
        let value: Story = from_binary(&res).unwrap();
        assert_ne!(env.block.height, value.last_cycle.unwrap());

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
        let value: Story = from_binary(&res).unwrap();
        assert_eq!(env.block.height, value.last_cycle.unwrap());

        env.block.height += 10;

        // not allowing to submit votes that don't match entries
        let msg = ExecuteMsg::Vote {
            votes: vec![VoteSubmission {
                story_id: "a".to_string(),
                section_id: "c".to_string(),
                vote: 1,
            }],
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        assert!(res.is_err());

        let msg = ExecuteMsg::Vote {
            votes: vec![VoteSubmission {
                story_id: "x".to_string(),
                section_id: "b".to_string(),
                vote: 1,
            }],
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        assert!(res.is_err());

        // when voted, progress
        let msg = ExecuteMsg::Vote {
            votes: vec![VoteSubmission {
                story_id: "a".to_string(),
                section_id: "b".to_string(),
                vote: 1,
            }],
        };
        let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);
        assert!(res.is_ok());

        // reseliance if vote has wrong ids (deprecate)
        let k = ("a".to_string(), "z".to_string(), "address".to_string());
        let vote_stored = VOTES.save(deps.as_mut().storage, k, &1);
        assert!(vote_stored.is_ok());
        let k = ("z".to_string(), "b".to_string(), "address".to_string());
        let vote_stored = VOTES.save(deps.as_mut().storage, k, &1);
        assert!(vote_stored.is_ok());

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
        let value: Story = from_binary(&res).unwrap();
        assert_eq!(env.block.height, value.last_cycle.unwrap());

        let res = query(deps.as_ref(), env.clone(), QueryMsg::GetState {}).unwrap();
        let value: Export = from_binary(&res).unwrap();
        assert_eq!(
            "d".to_string(),
            value.stories[0].sections[0].nft.clone().unwrap().token_id
        );
    }
}
