import { OrderBookChart } from './chart.js';

import { BybitClient } from './platforms/bybit.js';
import { BinanceClient } from './platforms/binance.js';


// get get params
const urlParams = new URLSearchParams(window.location.search);
const params = {};
for (const [key, value] of urlParams) {
    params[key] = value;
}


// check for param platformclass
let platformName = params.platform;
let platformClient = null;

if (platformName === "bybit") {
    platformClient = new BybitClient(params.symbol, params.depth);
} else if (platformName === "binance") {
    platformClient = new BinanceClient(params.symbol, params.depth);
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