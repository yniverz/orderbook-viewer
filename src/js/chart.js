




export class OrderBookChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.matrixElementHeight = Math.ceil(window.innerHeight / 100);
        this.rightChartWidthPercentage = 0.1;
        this.chartMargin = 10;
        this.maxAge = 30000;
        this.maxPrice = 0;
        this.minPrice = 0;
        this.maxPriceOrderVolume = 0;
        this.heatmapData = [];
        this.bookPriceData = [];
        this.tradeData = [];
        this.localOrderBook = { bids: [], asks: [] };

        requestAnimationFrame(this.draw.bind(this));
    }

    updateOrderBook(snapshot) {
        const time = snapshot.time;

        this.localOrderBook.bids = snapshot.bids;
        this.localOrderBook.asks = snapshot.asks;

        snapshot.bids.forEach(order => {
            this.heatmapData.push({ price: order.price, size: order.size, time: time });
        });
        snapshot.asks.forEach(order => {
            this.heatmapData.push({ price: order.price, size: order.size, time: time });
        });




        let lowestAsk = snapshot.asks[0].price;
        let highestBid = snapshot.bids[snapshot.bids.length - 1].price;

        this.bookPriceData.push({ time: time, bid: highestBid, ask: lowestAsk });

        if (this.bookPriceData.length > (this.maxAge / 20)) {
            this.bookPriceData.shift();
        }
    }

    addTrades(trades) {
        this.tradeData.push(...trades);
        this.tradeData.splice(0, this.tradeData.length - 1000);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const rightChartWidth = this.canvas.width * this.rightChartWidthPercentage;
        const leftChartWidth = this.canvas.width - rightChartWidth - this.chartMargin;

        // price range ( go through heatmap data to find the count of unique prices)
        var price_counts = {};
        this.heatmapData.forEach(data => {
            price_counts[data.price] = price_counts[data.price] ? price_counts[data.price] + 1 : 1;
        });
        var prices = Object.keys(price_counts);
        this.maxPrice = Math.max(...prices);
        this.minPrice = Math.min(...prices);
        this.matrixElementHeight = Math.ceil(window.innerHeight / prices.length);

        const maxSize = Math.max(
            ...this.localOrderBook.bids.map(order => order.size),
            ...this.localOrderBook.asks.map(order => order.size)
        );

        // maxTradeVolume = Math.max(...tradeData.map(trade => trade.size));

        // Draw heatmap
        this.heatmapData.forEach(data => {
            const age = Date.now() - data.time;
            if (age > this.maxAge) return;

            const alpha = 1 - age / this.maxAge; // Fade out older data
            this.maxPriceOrderVolume = Math.max(this.maxPriceOrderVolume, data.size);
            let intensity = Math.min(data.size / this.maxPriceOrderVolume, 1); // Normalize size

            // convert to ^(1/1.5) to make the color more distinguishable
            intensity = Math.pow(intensity, 1 / 1.2);

            // Map intensity to gradient: dark blue -> blue -> light blue -> yellow -> orange -> red
            let r, g, b;
            if (intensity < 0.2) {
                // Dark blue to blue
                r = 40;
                g = 40;
                // 50 to 255
                b = Math.round(50 + intensity * 1250);
            } else if (intensity < 0.4) {
                // Blue to light blue
                r = 40;
                g = Math.round((intensity - 0.2) * 1280); // 0 to 255
                b = 255;

            } else if (intensity < 0.6) {
                // Light blue to yellow
                r = Math.round((intensity - 0.4) * 1275); // 0 to 255
                g = 255;
                b = 255 - Math.round((intensity - 0.4) * 1275); // 255 to 0
            } else if (intensity < 0.8) {
                // Yellow to orange
                r = 255;
                g = 255 - Math.round((intensity - 0.6) * 1275); // 255 to 0
                b = 0;
            } else {
                // Orange to red
                r = 255;
                g = Math.round(255 - (intensity - 0.8) * 1275); // 255 to 0
                b = 0;
            }

            // const color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            const color = `rgb(${r}, ${g}, ${b})`;
            this.ctx.fillStyle = color;

            const x = leftChartWidth - (Date.now() - data.time) / this.maxAge * leftChartWidth;
            const y = this.canvas.height - (data.price - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;

            // pixels from x to leftChartWidth
            const barWidth = leftChartWidth - x;

            this.ctx.fillRect(x, y - this.matrixElementHeight / 2, barWidth, this.matrixElementHeight);
        });






        const bid_price_line_color = 'rgba(50, 200, 50, 1)';
        const ask_price_line_color = 'rgba(200, 50, 50, 1)';
        var last_price_data = { time: 0, bid: 0, ask: 0 };
        this.bookPriceData.forEach(trade => {
            const age = Date.now() - trade.time;
            if (age > this.maxAge) return; // Skip old data

            const alpha = 1 - age / this.maxAge;
            // this.ctx.globalAlpha = alpha;

            const last_x = leftChartWidth - (Date.now() - last_price_data.time) / this.maxAge * leftChartWidth;
            const last_y_bid = this.canvas.height - (last_price_data.bid - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;
            const last_y_ask = this.canvas.height - (last_price_data.ask - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;

            const x = leftChartWidth - (Date.now() - trade.time) / this.maxAge * leftChartWidth;
            const y_bid = this.canvas.height - (trade.bid - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;
            const y_ask = this.canvas.height - (trade.ask - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;

            this.ctx.beginPath();
            if (last_price_data.time !== 0) {
                this.ctx.moveTo(last_x, last_y_bid);
                this.ctx.lineTo(x, last_y_bid);
            }
            this.ctx.lineTo(x, y_bid);
            this.ctx.strokeStyle = bid_price_line_color;
            this.ctx.stroke();


            this.ctx.beginPath();
            if (last_price_data.time !== 0) {
                this.ctx.moveTo(last_x, last_y_ask);
                this.ctx.lineTo(x, last_y_ask);
            }
            this.ctx.lineTo(x, y_ask);
            this.ctx.strokeStyle = ask_price_line_color;
            this.ctx.stroke();

            last_price_data = trade;

        });

        const last_order_price_avg = (last_price_data.bid + last_price_data.ask) / 2;

        // draw a line at last level to the end of the canvas

        const last_x_2 = leftChartWidth - (Date.now() - last_price_data.time) / this.maxAge * leftChartWidth;
        const last_y_bid_2 = this.canvas.height - (last_price_data.price - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;
        const last_y_ask_2 = this.canvas.height - (last_price_data.price - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;

        this.ctx.beginPath();
        this.ctx.moveTo(last_x_2, last_y_bid_2);
        this.ctx.lineTo(leftChartWidth, last_y_bid_2);
        this.ctx.strokeStyle = bid_price_line_color;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(last_x_2, last_y_ask_2);
        this.ctx.lineTo(leftChartWidth, last_y_ask_2);
        this.ctx.strokeStyle = ask_price_line_color;
        this.ctx.stroke();






        // Draw trades
        const trade_line_color = 'rgba(255, 255, 255, 1)';
        var last_price_data = { time: 0, price: 0, size: 0 };
        this.tradeData.forEach(trade => {
            const age = Date.now() - trade.time;
            if (age > this.maxAge) return; // Skip old data

            const alpha = 1 - age / this.maxAge;
            // this.ctx.globalAlpha = alpha;

            const last_x = leftChartWidth - (Date.now() - last_price_data.time) / this.maxAge * leftChartWidth;
            const last_y = this.canvas.height - (last_price_data.price - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;

            const x = leftChartWidth - (Date.now() - trade.time) / this.maxAge * leftChartWidth;
            const y = this.canvas.height - (trade.price - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;

            // this.ctx.beginPath();
            // // go to last price point
            // if (last_price_data.time !== 0) {
            //     this.ctx.moveTo(last_x, last_y);
            //     this.ctx.lineTo(x, last_y);
            // }

            // this.ctx.lineTo(x, y);
            // this.ctx.strokeStyle = trade_line_color;
            // this.ctx.stroke();

            // if (trade.size * trade.price > 5000) {
                this.ctx.beginPath();
            if (trade.takerSide === 'Buy') {
                this.ctx.fillStyle = 'rgba(50, 200, 50, 0.5)';
                this.ctx.strokeStyle = 'rgba(50, 200, 50, 1)';
            } else {
                this.ctx.fillStyle = 'rgba(200, 50, 50, 0.5)';
                this.ctx.strokeStyle = 'rgba(200, 50, 50, 1)'; 5
            }

            const radius = Math.max(2, ((trade.size * trade.price) / 10000) * 20);
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();

            if (trade.size * trade.price > 5000) {
                // put the trade size on the chart
                this.ctx.font = "12px Arial";
                this.ctx.fillStyle = "white";
                this.ctx.fillText(Math.round(trade.size * trade.price), x - 10, y + 10);
            }

            last_price_data = trade;

        });

        // draw a line at last level to the end of the canvas

        // const last_x = leftChartWidth - (Date.now() - last_price_data.time) / this.maxAge * leftChartWidth;
        // const last_y = this.canvas.height - (last_price_data.price - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;

        // this.ctx.beginPath();
        // this.ctx.moveTo(last_x, last_y);
        // this.ctx.lineTo(leftChartWidth, last_y);
        // this.ctx.strokeStyle = trade_line_color;
        // this.ctx.stroke();


        // draw a rectangle behind the orderbook bars with the same color as the background
        this.ctx.fillStyle = 'rgb(39, 39, 50)';
        this.ctx.fillRect(this.canvas.width - rightChartWidth - 10, 0, rightChartWidth, this.canvas.height);


        // Draw bar chart for order book size
        var largest_order = { price: 0, size: 0 };
        this.localOrderBook.bids.concat(this.localOrderBook.asks).forEach(order => {
            const y = this.canvas.height - (order.price - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;
            const orderSize = Math.pow((order.size / maxSize), 1 / 1.5);
            const barWidth = Math.round(orderSize * rightChartWidth);
            const barX = this.canvas.width - rightChartWidth;

            if (order.price < last_order_price_avg) {
                this.ctx.fillStyle = 'rgba(0, 255, 0, 1)'; // Green for asks
            } else {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 1)'; // Red for bids
            }

            this.ctx.fillRect(barX, y - this.matrixElementHeight / 2, barWidth, this.matrixElementHeight - 1);

            if (order.size > largest_order.size) {
                largest_order = order;
            }
        });

        // Draw the largest order amount next to the bar
        this.ctx.font = "12px Arial";
        this.ctx.fillStyle = "white";
        const y = this.canvas.height - (largest_order.price - this.minPrice) / (this.maxPrice - this.minPrice) * this.canvas.height;
        const orderSize = Math.round(largest_order.size * largest_order.price);
        const barWidth = Math.round(orderSize * rightChartWidth);
        const barX = this.canvas.width - rightChartWidth;

        this.ctx.fillText(orderSize, barX + 10, y + 5);



        setTimeout(() => { requestAnimationFrame(this.draw.bind(this)); }, 1000 / 30);
    }
}