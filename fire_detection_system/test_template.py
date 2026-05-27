from server import app
from flask import render_template
import traceback
with app.test_request_context():
    try:
        result = render_template('dashboard.html', user={'name': 'Test'})
        print('Dashboard template renders OK! Length:', len(result))
    except Exception as e:
        print('Dashboard ERROR:')
        traceback.print_exc()

    try:
        result2 = render_template('login.html')
        print('Login template renders OK! Length:', len(result2))
    except Exception as e:
        print('Login ERROR:')
        traceback.print_exc()

