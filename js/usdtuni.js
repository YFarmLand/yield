$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`Initialized ${App.YOUR_ADDRESS}`)
    _print('Reading smart contracts...\n')
    _print(`Reward Pool Address: ${CREAM_UNI_POOL_ADDR}\n`)

    const CREAM_STAKING_POOL = new ethers.Contract(USDT_UNI_POOL_ADDR, CREAM_REWARD_POOL_ABI, App.provider)
    const CREAM_TOKEN = new ethers.Contract(CREAM_TOKEN_ADDR, ERC20_ABI, App.provider)
    const WETH_TOKEN = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, App.provider)
    const CREAM_WETH_UNI_TOKEN = new ethers.Contract(CREAM_USDT_UNI_TOKEN_ADDR, UNISWAP_V2_PAIR_ABI, App.provider)

    const stakedUNIAmount = (await CREAM_STAKING_POOL.balanceOf(App.YOUR_ADDRESS)) / 1e18;
    const earnedCREAM = (await CREAM_STAKING_POOL.earned(App.YOUR_ADDRESS)) / 1e18;
    const totalUNIAmount = (await CREAM_WETH_UNI_TOKEN.totalSupply()) / 1e18;
    const totalStakedUNIAmount = (await CREAM_WETH_UNI_TOKEN.balanceOf(USDT_UNI_POOL_ADDR)) / 1e18;
    const totalCREAMAmount = (await CREAM_TOKEN.balanceOf(CREAM_USDT_UNI_TOKEN_ADDR)) / 1e18;
    const totalWETHAmount = (await WETH_TOKEN.balanceOf(CREAM_USDT_UNI_TOKEN_ADDR)) / 1e6;
    console.log(totalWETHAmount);

    const totalWETHAmount2 = (await WETH_TOKEN.balanceOf(CREAM_USDT_UNI_TOKEN_ADDR)) / 1e6;
    console.log(totalWETHAmount2);
    const CREAMPerUNI = totalCREAMAmount / totalUNIAmount;
    const WETHPerUNI = totalWETHAmount / totalUNIAmount;

    const weekly_reward = await get_synth_weekly_rewards(CREAM_STAKING_POOL);
    const nextHalving = await getPeriodFinishForReward(CREAM_STAKING_POOL)

    const unstakedUNI = await CREAM_WETH_UNI_TOKEN.balanceOf(App.YOUR_ADDRESS) / 1e18;

    const rewardPerToken = weekly_reward / totalStakedUNIAmount;

    const prices = await lookUpPrices(["cream-2", "ethereum"]);
    const CREAMPrice = 28;
    const ETHPrice = 1;

    const UNIPrice = CREAMPerUNI * CREAMPrice + WETHPerUNI * ETHPrice;

    _print("========== PRICES ==========")
    _print(`1 YFARMER  = $${CREAMPrice}`);
    _print(`1 USDT   = $${ETHPrice}\n`);
    _print(`1 UNI   = [${CREAMPerUNI} YFARMER, ${WETHPerUNI} USDT]`);
    _print(`        = ${toDollar(UNIPrice)}\n`);

    _print("========== STAKING =========")
    _print(`There are total   : ${totalUNIAmount} UNI issued by YFARMER USDT Uniswap Pool.`);
    _print(`There are total   : ${totalStakedUNIAmount} UNI staked in YFARMER's UNI staking pool.`);
    _print(`                  = ${toDollar(totalStakedUNIAmount * UNIPrice)}\n`);
    _print(`You are staking   : ${stakedUNIAmount} UNI (${toFixed(stakedUNIAmount * 100 / totalStakedUNIAmount, 3)}% of the pool)`);
    _print(`                  = [${CREAMPerUNI * stakedUNIAmount} USDT, ${WETHPerUNI * stakedUNIAmount} YFARMER]`);
    _print(`                  = ${toDollar(CREAMPerUNI * stakedUNIAmount * CREAMPrice + WETHPerUNI * stakedUNIAmount * ETHPrice)}\n`);

    // CREAM REWARDS
    _print("======== YFARMER REWARDS ========")
    _print(`Claimable Rewards : ${toFixed(earnedCREAM, 4)} YFARMER = ${toDollar(earnedCREAM * CREAMPrice)}`);
    const CREAMWeeklyEstimate = rewardPerToken * stakedUNIAmount;

    _print(`Hourly estimate   : ${toFixed(CREAMWeeklyEstimate / (24 * 7), 4)} YFARMER = ${toDollar((CREAMWeeklyEstimate / (24 * 7)) * CREAMPrice)} (out of total ${toFixed(weekly_reward / (7 * 24), 2)} YFARMER)`)
    _print(`Daily estimate    : ${toFixed(CREAMWeeklyEstimate / 7, 2)} YFARMER = ${toDollar((CREAMWeeklyEstimate / 7) * CREAMPrice)} (out of total ${toFixed(weekly_reward / 7, 2)} YFARMER)`)
    _print(`Weekly estimate   : ${toFixed(CREAMWeeklyEstimate, 2)} YFARMER = ${toDollar(CREAMWeeklyEstimate * CREAMPrice)} (out of total ${weekly_reward} YFARMER)`)
    const CREAMWeeklyROI = (rewardPerToken * CREAMPrice) * 100 / (UNIPrice);

    _print(`\nHourly ROI in USD : ${toFixed((CREAMWeeklyROI / 7) / 24, 4)}%`)
    _print(`Daily ROI in USD  : ${toFixed(CREAMWeeklyROI / 7, 4)}%`)
    _print(`Weekly ROI in USD : ${toFixed(CREAMWeeklyROI, 4)}%`)
    _print(`APY (unstable)    : ${toFixed(CREAMWeeklyROI * 52, 4)}% \n`)

    const timeTilHalving = nextHalving - Date.now() / 1000

  _print(`Reward ending     : in ${forHumans(timeTilHalving)} \n`)

    const resetApprove = async function() {
        return rewardsContract_resetApprove(CREAM_WETH_UNI_TOKEN_ADDR, CREAM_UNI_POOL_ADDR, App);
    };

    const approveTENDAndStake = async function () {
        return rewardsContract_stake(CREAM_WETH_UNI_TOKEN_ADDR, CREAM_UNI_POOL_ADDR, App);
    };

    const unstake = async function() {
        return rewardsContract_unstake(CREAM_UNI_POOL_ADDR, App);
    };

    const claim = async function() {
        return rewardsContract_claim(CREAM_UNI_POOL_ADDR, App);
    };

    const exit = async function() {
        return rewardsContract_exit(CREAM_UNI_POOL_ADDR, App);
    };

    print_warning();

    _print_link(`Reset approval to 0`, resetApprove);
    _print_link(`Stake ${unstakedUNI} UNI`, approveTENDAndStake);
    _print_link(`Unstake ${stakedUNIAmount} UNI`, unstake);
    _print_link(`Claim ${earnedCREAM} YFARMER`, claim);
    _print_link(`Exit`, exit);

    await _print24HourPrice("cream-2", "CREAM");

    hideLoading();
}