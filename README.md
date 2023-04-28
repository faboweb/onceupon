# OnceUpon

## Why

NFTs have limited utility right now. There is gaming assets targeted at specific games where those games give them utility. But for most art NFTs there is none apart from being a speculative assets. It would be good to create utility to any kind of art NFT and therefor increase volume and user base of NFTs.

We create a game that allows any NFT to be used. To create such a game we leverage creativity and story writing as they are flexible enough to allow usage of any NFT.

## Intro

In OnceUpon you write stories together with the community. You propose a start or continuation segment of a story and vote on how the story moves on. In sense of the creator community of web3 every participant, writer and voter, becomes and owner of the story itself. Ownership can be traded as every other tokens based on the expectation of future value of a story.

Each segment can have an NFT attached. An attached NFT now becomes part of the story and therefor receives continues story telling and exposure to the community of such story. Only NFTs can be attached that a user really owns. As users will want to put their NFTs into stories they will likely bring in their community to vote for them, creating growth of the OnceUpon community.

As stories and their communities grow, it becomes valuable to place NFTs in them. But if the community is big enough they can’t just be overtaken. In this case an advertiser can put up bounties. A writer can create a valuable segment of the story using the advertised NFT and the bounty will go to the writer and the community/share holders. This should create income for story shares in the long run.

## Tech

The app is based on a smart contract. I propose the smart contract to be deployed on Stargaze. If this is not possible, we will need to use Interchain Queries to verify the ownership of an NFT.

Users propose and vote in cycles of a week (for now). This gives them time to participate. Voting cycles, need to be executed by an external instance. There is no cron job for Cosmos chains yet. CronCat is still in development as far as I know.

A frontend will be provided, but the community could build their own.

## Demo

App: https://onceupon.community/
