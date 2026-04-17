from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from pydantic import BaseModel
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ticker/{symbol}")
def get_ticker_info(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Determine the current price
        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
        previous_close = info.get('previousClose')
        
        if not current_price:
            raise HTTPException(status_code=404, detail="Price data not found")

        change = current_price - previous_close if previous_close else 0
        change_percent = (change / previous_close * 100) if previous_close else 0
        
        return {
            "symbol": symbol.upper(),
            "name": info.get('shortName', symbol),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "open": info.get('regularMarketOpen', 0),
            "high": info.get('dayHigh', 0),
            "low": info.get('dayLow', 0),
            "volume": info.get('volume', 0),
            "sector": info.get('sector', 'Unknown')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history/{symbol}")
def get_ticker_history(symbol: str, range: str = "1mo"):
    try:
        # map frontend ranges (1W, 1M, 3M, 6M, 1Y) to yfinance periods
        period_map = {
            "1W": "5d",
            "1M": "1mo",
            "3M": "3mo",
            "6M": "6mo",
            "1Y": "1y"
        }
        yf_period = period_map.get(range, "1mo")
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=yf_period)
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
            
        data = []
        for index, row in hist.iterrows():
            data.append({
                "date": index.strftime("%b %d"),
                "price": round(row['Close'], 2)
            })
            
        return {"symbol": symbol, "history": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PortfolioItem(BaseModel):
    symbol: str
    shares: float

class PortfolioHistoryRequest(BaseModel):
    items: list[PortfolioItem]
    liquid_cash: float
    fd_total: float
    range: str = "1M"

@app.post("/api/portfolio-history")
def get_portfolio_history(req: PortfolioHistoryRequest):
    try:
        period_map = {
            "1W": "5d",
            "1M": "1mo",
            "3M": "3mo",
            "6M": "6mo",
            "1Y": "1y"
        }
        yf_period = period_map.get(req.range, "1mo")
        
        # If no items, return flat line based on cash
        if not req.items:
            # We still need some dates, fetch SPY just for indices
            spy = yf.Ticker("SPY").history(period=yf_period)
            data = []
            for index, row in spy.iterrows():
                data.append({
                    "date": index.strftime("%b %d"),
                    "price": round(req.liquid_cash + req.fd_total, 2)
                })
            return {"history": data}

        # Multi-ticker fetch
        symbols = [item.symbol for item in req.items]
        tickers = yf.Tickers(" ".join(symbols))
        
        # Dataframe to hold combined values
        combined_df = None
        
        for item in req.items:
            h = tickers.tickers[item.symbol].history(period=yf_period)
            if h.empty: continue
            
            # Use 'Close' price and multiply by shares
            temp_series = h['Close'] * item.shares
            
            if combined_df is None:
                combined_df = temp_series.to_frame(name=item.symbol)
            else:
                combined_df = combined_df.join(temp_series.to_frame(name=item.symbol), how='outer')

        if combined_df is None or combined_df.empty:
             raise HTTPException(status_code=404, detail="No historical data found for items")

        # Forward fill holes (holidays/weekends)
        combined_df = combined_df.ffill().fillna(0)
        
        # Sum horizontally
        combined_df['total_invested'] = combined_df.sum(axis=1)
        
        # Add cash and FDs
        combined_df['grand_total'] = combined_df['total_invested'] + req.liquid_cash + req.fd_total
        
        data = []
        for index, row in combined_df.iterrows():
            data.append({
                "date": index.strftime("%b %d"),
                "price": round(row['grand_total'], 2)
            })
            
        return {"history": data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
