import { OrderBookChart } from './chart.js';

import { BybitUsdtPerpClient, BybitSpotClient } from './platforms/bybit.js';
import { BinanceSpotClient, BinanceFuturesClient } from './platforms/binance.js';
import { BitgetSpotClient, BitgetFuturesClient } from './platforms/bitget.js';



// get get params
const urlParams = new URLSearchParams(window.location.search);
const params = {};
for (const [key, value] of urlParams) {
    params[key] = value;
}


// check for param platformclass
let platformName = params.platform;
let platformClient = null;

if (platformName === "bybitusdtperp") {
    platformClient = new BybitUsdtPerpClient(params.symbol, params.depth);
} else if (platformName === "bybitspot") {
    platformClient = new BybitSpotClient(params.symbol, params.depth);
} else if (platformName === "binancespot") {
    platformClient = new BinanceSpotClient(params.symbol, params.depth);
} else if (platformName === "binancefutures") {
    platformClient = new BinanceFuturesClient(params.symbol, params.depth);
} else if (platformName === "bitgetspot") {
    platformClient = new BitgetSpotClient(params.symbol, params.depth);
} else if (platformName === "bitgetfutures") {
    platformClient = new BitgetFuturesClient(params.symbol, params.depth);
}

if (!platformClient) {
    throw new Error("Invalid platform name:", platformName);
}



const chart = new OrderBookChart(document.getElementById("chart"));



platformClient.onOrderBookUpdate = (orderBook) => {
    console.log("Order Book Update:", orderBook);
    chart.updateOrderBook(orderBook);
}

platformClient.onTradeUpdate = (trades) => {
    console.log("Trade Update:", trades);
    chart.addTrades(trades);
}


platformClient.connect();


const slider = document.querySelector('.header-slider');
const slider_value = document.querySelector('.header-slider-value');
slider.addEventListener('input', (event) => {
    const sliderValue = Number(event.target.value);
    slider_value.textContent = Math.round(sliderValue) + "s";
    chart.maxAge = sliderValue * 1000;
});