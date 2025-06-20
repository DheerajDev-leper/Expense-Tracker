let chart;
let chartVisible = false;

async function loadExpenses() {
  let filter = document.getElementById('filter').value;
  let resp = await fetch(`/api/expenses?filter=${filter}`);
  let data = await resp.json();

  let list = document.getElementById('expense-list');
  list.innerHTML = data
    .map(
      (e) => `
      <li>${e.date}: ₹${e.amount.toFixed(2)} | ${e.category}${e.note ? ' (' + e.note + ')' : ''}
          <button class="delete-btn" onclick="deleteExpense(${e.id})">Delete</button>
      </li>`
    )
    .join('');

  // Total sum
  let total = data.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById('total-container').innerText = `Total: ₹${total.toFixed(2)}`;
}

// Add new expense
async function addExpense() {
  let amount = parseFloat(document.getElementById('amount').value) || 0;
  let category = document.getElementById('category').value.trim();
  let note = document.getElementById('note').value.trim();
  if (amount <= 0 || !category) return;

  await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, category, note })
  });

  document.getElementById('amount').value = '';
  document.getElementById('category').value = '';
  document.getElementById('note').value = '';
  loadExpenses();
}

// Delete one expense
async function deleteExpense(id) {
  await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
  loadExpenses();
}

// Clear all expenses
async function clearAll() {
  await fetch('/api/expenses?clear=1', { method: 'DELETE' });
  loadExpenses();
}

// Toggle chart
function toggleChart() {
  chartVisible = !chartVisible;
  let chartContainer = document.getElementById('chartContainer');
  let btn = document.getElementById('toggleChartBtn');

  if (chartVisible) {
    chartContainer.style.display = 'block';
    btn.innerText = 'Hide Graph';
    loadSummary();
  } else {
    chartContainer.style.display = 'none';
    btn.innerText = 'Show Graph';
    if (chart) chart.destroy();
  }
}

// Load summary chart
async function loadSummary() {
  let resp = await fetch('/api/summary');
  let data = await resp.json();

  let ctx = document.getElementById('summaryChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map((d) => d.category),
      datasets: [{
        data: data.map((d) => d.amount),
        backgroundColor: ['#c89b3c', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6']
      }]
    }
  });
}

// Initial list load
loadExpenses();
