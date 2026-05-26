from flask import Flask, render_template
app = Flask(__name__)
with app.app_context():
    try:
        result = render_template('dashboard.html', user={'name': 'Test'})
        print('Template renders OK! Length:', len(result))
    except Exception as e:
        print('Template ERROR:', e)

