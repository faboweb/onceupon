# Create contract
source <(curl -sSL https://raw.githubusercontent.com/CosmWasm/testnets/master/malaga-420/defaults.env)
cargo wasm
cargo schema
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer-arm64:0.14.0
RES=$(starsd tx wasm store artifacts/onceupon_cosmwasm-aarch64.wasm --from testnet-key --node https://rpc.elgafar-1.stargaze-apis.com:443 -y --output json -b block --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto)
CODE_ID=$(echo $RES | jq -r '.logs[0].events[-1].attributes[0].value')
INIT='{}'
starsd tx wasm instantiate $CODE_ID "$INIT" --from testnet-key --label "onceupon test" -y --admin "stars1gxqu5nm55jqwnrzsachesczntqd0fd8xwd5nx8" --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto
CONTRACT=$(starsd query wasm list-contract-by-code $CODE_ID $NODE --output json | jq -r '.contracts[-1]')
echo $CONTRACT

# Update contract
source <(curl -sSL https://raw.githubusercontent.com/CosmWasm/testnets/master/malaga-420/defaults.env)
cargo wasm
# cargo schema
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer-arm64:0.12.13
RES=$(starsd tx wasm store artifacts/onceupon_cosmwasm-aarch64.wasm --from testnet-key --node https://rpc.elgafar-1.stargaze-apis.com:443 -y --output json -b block --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto)
CODE_ID=$(echo $RES | jq -r '.logs[0].events[-1].attributes[1].value')
CONTRACT='stars1j64pe4hsr6ptmleapqnax7fdl39a0nw0dwayvgz0d7cmkaezyuzst0n7us'
ARGS='{}'
starsd tx wasm migrate $CONTRACT $CODE_ID "$ARGS" --from stars1gxqu5nm55jqwnrzsachesczntqd0fd8xwd5nx8 --node https://rpc.elgafar-1.stargaze-apis.com:443 -y --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto

# Propose via governance
# Address: stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv
starsd tx gov submit-proposal wasm-store artifacts/onceupon_cosmwasm-aarch64.wasm --title OnceUpon --description "Communal story writing platform. Own the story. Use your NFT in the stories." --run-as stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv --code-source-url https://github.com/faboweb/onceupon --builder cosmwasm/rust-optimizer-arm64:0.12.13 --code-hash b77e142579c648831bfdbefb7b412e943554047cb4ec034d5d92c93364f5b18d  --from stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv --node https://rpc.stargaze-apis.com:443  -y --output json -b block --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto --chain-id stargaze-1 --deposit 4000000000ustars 
CODE_ID=58
INIT='{}'
starsd tx wasm instantiate $CODE_ID "$INIT" --from stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv --label "OnceUpon - Story Writing Community - Beta" -y --admin "stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv" --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto --node https://rpc.stargaze-apis.com:443 --chain-id stargaze-1
CONTRACT=$(starsd query wasm list-contract-by-code $CODE_ID --node https://rpc.stargaze-apis.com:443 --chain-id stargaze-1 --output json | jq -r '.contracts[-1]')
# stars1eh58m7augmf7777k0kcgxwetse3tnsa6n7kwn458lfdv0zzknu2sgde4kq

# Propose via governance (NEW)
title="BugFix OnceUpon to v0.14.2"
desc=$(cat proposal.md | jq -Rsa | tr -d '"')
deposit="50000000000ustars"
PROPOSER="stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv"
CREATOR="stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv"
# shasum -a 256 artifacts/onceupon_cosmwasm-aarch64.wasm
CODE_HASH="6108a1e2cbd23944fa10ceb3b716c573223e59d962b7a36c73c7fed53c21dea2"
starsd tx gov submit-proposal wasm-store artifacts/onceupon_cosmwasm-aarch64.wasm \
    --title "$title" \
    --description "$desc" \
    --deposit $deposit \
    --run-as $CREATOR \
    --from $PROPOSER \
    --gas 30000000 \
    --gas-prices 1ustars \
    --chain-id stargaze-1 \
    --instantiate-anyof-addresses $CREATOR -y \
    --node https://rpc.stargaze-apis.com:443 \
    --code-hash $CODE_HASH \
    --code-source-url https://github.com/faboweb/onceupon/tree/v0.14.2 \
    --builder cosmwasm/rust-optimizer-arm64:0.14.0
# starsd query wasm list-code --node https://rpc.stargaze-apis.com:443 --chain-id stargaze-1 --page 2
CODE_ID=138
CONTRACT='stars1eh58m7augmf7777k0kcgxwetse3tnsa6n7kwn458lfdv0zzknu2sgde4kq'
ARGS='{}'
PROPOSER="stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv"
starsd tx wasm migrate $CONTRACT $CODE_ID "$ARGS" \
  --from $PROPOSER \
  --node https://rpc.stargaze-apis.com:443 \
  --chain-id stargaze-1 \
  --gas-prices 1ustars \
  --gas-adjustment 1.7 \
  --gas auto \
  -y