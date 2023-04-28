
const { fromBech32, toBech32 } = require("cosmwasm")

const main = () => {
    console.log(toBech32('stars', fromBech32("wasm17cv7tkzteht4pxggrgf3jynstsasdf8pj0c9nc").data))
}
main()