@echo off
echo Starting InvestFlow Services...

:: Start Backend
start cmd /k "title InvestFlow-Backend && cd backend && npm start"

:: Start Data Service (with Python alias checking)
start cmd /k "title InvestFlow-DataService && cd data-service && (python main.py || py main.py || python3 main.py || echo ERROR: Python not found. Please install Python and add it to your PATH.)"

:: Start Frontend
start cmd /k "title InvestFlow-Frontend && cd frontend && npm run dev"

echo.
echo ==========================================
echo Services are starting in separate windows.
echo.
echo 1. Ensure MySQL is RUNNING (via XAMPP or Services.msc)
echo 2. Check the DataService window for Python errors.
echo ==========================================
pause
