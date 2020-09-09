$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`Initialized ${App.YOUR_ADDRESS}`);
    _print("Reading smart contracts...");

    const Y_STAKING_POOL = new ethers.Contract(ANNUAL_COMP_STAKING_POOL, CREAM_REWARD_POOL_ABI, App.provider);
    const CURVE_Y_POOL = new ethers.Contract(CURVE_Y_POOL_ADDR, CURVE_Y_POOL_ABI, App.provider);
    const Y_TOKEN = new ethers.Contract(COMP_ADDRESS, ERC20_ABI, App.provider);
    const CREAM_TOKEN = new ethers.Contract(CREAM_TOKEN_ADDR, ERC20_ABI, App.provider);

    const stakedYAmount = await Y_STAKING_POOL.balanceOf(App.YOUR_ADDRESS) / 1e18;
    const earnedYFI = await Y_STAKING_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalSupplyY = await CREAM_TOKEN.balanceOf(ANNUAL_COMP_STAKING_POOL) / 1e18;
    const totalStakedYAmount = await Y_TOKEN.balanceOf(ANNUAL_COMP_STAKING_POOL) / 1e18;
    const rewardpertoken = await Y_STAKING_POOL.rewardPerToken();
    console.log(rewardpertoken.toString());

    // Find out reward rate
     const weekly_reward = await get_synth_weekly_rewards(Y_STAKING_POOL);
    //const weekly_reward = 0;
    console.log(weekly_reward);
    const rewardPerToken = weekly_reward / totalStakedYAmount;
    console.log(rewardPerToken);
    const prices = await lookUpPrices(["cream-2", "compound-governance-token"]);
    // Find out underlying assets of Y
    const YVirtualPrice = prices["compound-governance-token"].usd;

    _print("Finished reading smart contracts... Looking up prices... \n")

    // Look up prices
    //const prices = await lookUpPrices(["yearn-finance"]);
    const YFIPrice = 28;

    // Finished. Start printing

    _print("========== PRICES ==========")
    _print(`1 YFARMER  = $${YFIPrice}`);
    _print(`1 WETH = $${YVirtualPrice}`);

    _print("========== STAKING =========")
    _print(`There are total   : ${totalSupplyY} YFARMER issued by ANNUAL WETH YFARMER.`);
    _print(`There are total   : ${totalStakedYAmount} WETH staked in ygov's ANNUAL WETH staking pool.`);
    _print(`                  = ${toDollar(totalStakedYAmount * YVirtualPrice)}\n`);
    _print(`You are staking   : ${stakedYAmount} WETH (${toFixed(stakedYAmount * 100 / totalStakedYAmount, 3)}% of the pool)`);
    _print(`                  = ${toDollar(stakedYAmount * YVirtualPrice)}\n`);

    // YFI REWARDS
    _print("======== YFARMER REWARDS ========")
    _print(" (Temporarily paused until further emission model is voted by the community) ");
    _print(`Claimable Rewards : ${toFixed(earnedYFI, 4)} YFARMER = $${toFixed(earnedYFI * YFIPrice, 2)}`);
    _print(`Weekly estimate   : ${toFixed(rewardPerToken * stakedYAmount, 2)} YFARMER = ${toDollar(rewardPerToken * stakedYAmount * YFIPrice)} (out of total ${weekly_reward} YFARMER)`)
    const YFIWeeklyROI = (rewardPerToken * YFIPrice) * 100 / (YVirtualPrice);
    _print(`Weekly ROI in USD : ${toFixed(YFIWeeklyROI, 4)}%`)
    _print(`APY (unstable)    : ${toFixed(YFIWeeklyROI * 52, 4)}% \n`)


    hideLoading();

}