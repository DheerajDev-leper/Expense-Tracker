from flask import Flask, jsonify, request, render_template
import sqlite3
from datetime import date

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS expenses(
                 id INTEGER PRIMARY KEY,
                 amount REAL,
                 category TEXT,
                 date TEXT,
                 note TEXT)''')
    conn.commit(); conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/expenses', methods=['GET', 'POST', 'DELETE'])
def expenses():
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()

    if request.method == 'POST':
        data = request.json
        c.execute(
            "INSERT INTO expenses(amount, category, date, note) VALUES (?, ?, ?, ?)",
            (data['amount'], data['category'], date.today().strftime('%Y-%m-%d'), data.get('note', ''))
        )
        conn.commit()

    elif request.method == 'DELETE':
        if request.args.get('clear'):
            c.execute('DELETE FROM expenses')
        else:
            expense_id = request.args.get('id')
            c.execute('DELETE FROM expenses WHERE id=?', (expense_id,))
        conn.commit()

    filter_text = request.args.get('filter', '').strip().lower()
    query = "SELECT * FROM expenses"
    params = []
    if filter_text:
        query += " WHERE LOWER(category) LIKE ? OR date LIKE ?"
        params = [f"%{filter_text}%", f"%{filter_text}%"]

    c.execute(query, params)
    expenses = c.fetchall()
    conn.close()
    return jsonify([{'id': e[0], 'amount': e[1], 'category': e[2], 'date': e[3], 'note': e[4]} for e in expenses])

@app.route('/api/summary')
def summary():
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute('SELECT category, SUM(amount) FROM expenses GROUP BY category')
    data = c.fetchall()
    conn.close()
    return jsonify([{'category': cat, 'amount': amt} for cat, amt in data])

if __name__ == '__main__':
    app.run(debug=True)
