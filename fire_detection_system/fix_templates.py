#!/usr/bin/env python3
# Fix template files
from pathlib import Path
import shutil

here = Path(__file__).parent

login_new = here / 'templates' / 'login_new.html'
dashboard_new = here / 'templates' / 'dashboard_new.html'
login = here / 'templates' / 'login.html'
dashboard = here / 'templates' / 'dashboard.html'

if login.exists():
    login.unlink()
if login_new.exists():
    login_new.rename(login)
    print('OK Replaced login.html')

if dashboard.exists():
    dashboard.unlink()
if dashboard_new.exists():
    dashboard_new.rename(dashboard)
    print('OK Replaced dashboard.html')

print('Done!')
