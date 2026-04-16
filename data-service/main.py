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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
