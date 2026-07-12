@echo off
title 2birds website preview
echo Serving the 2birds website at http://localhost:8124
echo Keep this window open while browsing. Press Ctrl+C to stop.
start "" http://localhost:8124
python -m http.server 8124 --directory "%~dp0"
