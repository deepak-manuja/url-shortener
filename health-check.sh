#!/bin/bash

# URL Shortener - Quick Health Check Script
# Run this to diagnose 404 errors

echo "🔍 URL Shortener Project Health Check"
echo "======================================"
echo ""

# Check backend .env
echo "1️⃣  Checking Backend Configuration..."
if [ -f "backend/.env" ]; then
    echo "✅ .env file exists"
    if grep -q "BASE_URL" backend/.env; then
        BASE_URL=$(grep "BASE_URL=" backend/.env | cut -d '=' -f2)
        echo "   BASE_URL: $BASE_URL"
    fi
    if grep -q "MONGODB_URI" backend/.env; then
        echo "   ✅ MONGODB_URI is set"
    else
        echo "   ❌ MONGODB_URI is NOT set"
    fi
else
    echo "❌ .env file NOT found in backend/"
fi
echo ""

# Check if backend dependencies are installed
echo "2️⃣  Checking Backend Dependencies..."
if [ -d "backend/node_modules" ]; then
    echo "✅ node_modules exists"
    if [ -d "backend/node_modules/express" ]; then
        echo "   ✅ Express is installed"
    fi
    if [ -d "backend/node_modules/mongoose" ]; then
        echo "   ✅ Mongoose is installed"
    fi
else
    echo "❌ node_modules NOT found - run: cd backend && npm install"
fi
echo ""

# Check if frontend dependencies are installed
echo "3️⃣  Checking Frontend Dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "❌ node_modules NOT found - run: cd frontend && npm install"
fi
echo ""

# Check file structure
echo "4️⃣  Checking Project Structure..."
files_to_check=(
    "backend/src/index.js"
    "backend/src/routes/url.js"
    "backend/src/models/Url.js"
    "frontend/src/App.jsx"
    "frontend/src/api.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file MISSING"
    fi
done
echo ""

# Check if ports are accessible
echo "5️⃣  Port Availability Check..."
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ':5000'; then
        echo "   🟢 Port 5000 is in use (backend might be running)"
    else
        echo "   ⚫ Port 5000 is free"
    fi
    if netstat -tuln | grep -q ':5173'; then
        echo "   🟢 Port 5173 is in use (frontend might be running)"
    else
        echo "   ⚫ Port 5173 is free"
    fi
else
    echo "   ℹ️  netstat not available - can't check port status"
fi
echo ""

# Check logs in backend
echo "6️⃣  Recent Backend Logs (if running)..."
if [ -f "backend/logs.txt" ]; then
    echo "   Latest 5 lines:"
    tail -n 5 "backend/logs.txt"
else
    echo "   ℹ️  No logs file found"
fi
echo ""

echo "======================================"
echo "✅ Health check complete!"
echo ""
echo "📋 Next Steps:"
echo "1. If any ❌ are shown, fix those issues first"
echo "2. Run: cd backend && npm start"
echo "3. In another terminal: cd frontend && npm run dev"
echo "4. Test at: http://localhost:5173"
echo "5. Check browser console (F12) for errors"
echo ""
