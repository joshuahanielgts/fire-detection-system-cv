# Debug Plan - Fire Detection System

## Issues Found & Fixes:

### detector.py
1. ✅ Fix indentation of comment line
2. ✅ Robust class name extraction (handle string/integer keys in model.names)
3. ✅ Color logic for bounding boxes (handle non-fire/smoke classes gracefully)

### main.py
4. ✅ Remove unused smoke print alert (duplicate logic fixed)
5. ✅ Clean status_y logic

### app.py (Gradio)
6. ✅ Single detector instance (prevent memory leak from multiple instantiations)
7. ✅ Remove unused/unassigned buttons
8. ✅ Fix event handler conflicts (change + then + every)
9. ✅ Fix Chatbot vs Textbox output mismatch

### backend.py
10. ✅ Fix FPS calculation (division by zero: same variable subtracted from itself)
11. ✅ Fix `verify_oauth2_token` function name (was `verify_oauth2`)
12. ✅ Fix login template rendering with GOOGLE_CLIENT_ID context
13. ✅ Fix camera lifecycle (don't release global cap in generator)
14. ✅ Add proper running flag management

### web_app.py
15. ✅ Fix camera initialization on startup
16. ✅ Fix live detection generator cleanup

### login.html
17. ✅ Ensure GOOGLE_CLIENT_ID is passed from Flask

### dashboard.html
18. ✅ Populate user name and stats from template variables

