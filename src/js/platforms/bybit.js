import { PlatformClient, Trade, OrderBookSnapshot } from './platform.js';

/**
 * Represents a client for the ByBit exchange.
 * @property {string} symbol - The trading pair symbol.
 * @property {number} depth - The number of levels of depth to (1, 50, 200, 500)
 */
export class BybitClient extends PlatformClient {
    constructor(symbol, depth = 50) {
        super("wss://stream.bybit.com/v5/public/linear", "ByBit");
        this.symbol = symbol.toUpperCase();
        this.depth = depth;

        this.localOrderBook = new OrderBookSnapshot([], []);
    }

    onOpen() {
        console.log("Connected to ByBit WebSocket");
        this.socket.send(JSON.stringify({
            op: "subscribe",
            args: [
                `publicTrade.${this.symbol}`,
                `orderbook.${this.depth}.${this.symbol}`
            ]
        }));
    }


    updateOrderBook(snapshot) {
        this.localOrderBook.bids = snapshot.b.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
        this.localOrderBook.asks = snapshot.a.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    }

    applyDelta(delta) {
        const updateSide = (side, updates, side_str) => {
            updates.forEach(([price, size]) => {
                price = parseFloat(price);
                size = parseFloat(size);
                const index = side.findIndex(order => order.price === price);

                if (size === 0) {
                    if (index !== -1) side.splice(index, 1); // Remove entry
                } else if (index !== -1) {
                    side[index].size = size; // Update entry
                } else {
                    side.push({ price, size }); // Insert new entry
                }
            });

            side.sort((a, b) => a.price - b.price); // Ensure the side is sorted
        };

        updateSide(this.localOrderBook.bids, delta.b, 'b');
        updateSide(this.localOrderBook.asks, delta.a, 'a');
    }

    handleMessage(rawMessage) {
        const message = JSON.parse(rawMessage);

        if (message.topic === `orderbook.${this.depth}.${this.symbol}`) {
            if (message.type === "snapshot") {
                this.updateOrderBook(message.data);
            } else if (message.type === "delta") {
                this.applyDelta(message.data);
            }

            this.localOrderBook.time = new Date(message.cts);

            this.onOrderBookUpdate(this.localOrderBook);
        }

        if (message.topic === `publicTrade.${this.symbol}`) {
            const trades = message.data;

            let tradeData = [];
            trades.forEach(trade => {
                const price = parseFloat(trade.p);
                const size = parseFloat(trade.v);
                const takerSideBuy = trade.S === "Buy" ? true : false;
                const time = new Date(trade.T);
                
                tradeData.push(new Trade(price, size, takerSideBuy, time));
            });

            this.onTradeUpdate(tradeData);
        }
    }
}