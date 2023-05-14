source <(curl -sSL https://raw.githubusercontent.com/CosmWasm/testnets/master/malaga-420/defaults.env)
cargo wasm
cargo schema
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer-arm64:0.12.13
RES=$(starsd tx wasm store artifacts/onceupon_cosmwasm-aarch64.wasm --from testnet-key --node https://rpc.elgafar-1.stargaze-apis.com:443 -y --output json -b block --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto)
CODE_ID=$(echo $RES | jq -r '.logs[0].events[-1].attributes[0].value')
INIT='{}'
starsd tx wasm instantiate $CODE_ID "$INIT" --from testnet-key --label "onceupon test" -y --admin "stars1gxqu5nm55jqwnrzsachesczntqd0fd8xwd5nx8" --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto
CONTRACT=$(starsd query wasm list-contract-by-code $CODE_ID $NODE --output json | jq -r '.contracts[-1]')
echo $CONTRACT

source <(curl -sSL https://raw.githubusercontent.com/CosmWasm/testnets/master/malaga-420/defaults.env)
cargo wasm
cargo schema
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer-arm64:0.12.13
RES=$(starsd tx wasm store artifacts/onceupon_cosmwasm-aarch64.wasm --from testnet-key --node https://rpc.elgafar-1.stargaze-apis.com:443 -y --output json -b block --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto)
CODE_ID=$(echo $RES | jq -r '.logs[0].events[-1].attributes[1].value')
CONTRACT='stars1j64pe4hsr6ptmleapqnax7fdl39a0nw0dwayvgz0d7cmkaezyuzst0n7us'
ARGS='{}'
starsd tx wasm migrate $CONTRACT $CODE_ID "$ARGS" --from stars1gxqu5nm55jqwnrzsachesczntqd0fd8xwd5nx8 --node https://rpc.elgafar-1.stargaze-apis.com:443 -y --gas-prices 0.025ustars --gas-adjustment 1.7 --gas auto