# Sistema de Perícias Médicas (MedicalFarmer)

Sistema profissional para gestão e elaboração de laudos médicos periciais. O projeto está estruturado para separar o frontend (PWA) do backend (API/Backup).

## Estrutura do Projeto

```
/
├── frontend/          # Aplicação Web Principal (PWA)
│   ├── index.html     # Ponto de entrada
│   ├── static/        # Assets (JS, CSS, Imagens)
│   ├── manifest.json  # Configuração PWA
│   └── service-worker.js
│
├── backend/           # API e Backup (Flask/Python)
│   ├── app.py         # Aplicação Flask
│   ├── templates/     # Templates do Backend (se necessário)
│   └── database.db    # Banco de dados SQLite (Backup)
│
├── tests/             # Testes Automatizados (Playwright/Pytest)
├── scripts/           # Scripts de utilidade e manutenção
└── docs/              # Documentação adicional
```

## Como Rodar

### Frontend (Desenvolvimento)

A aplicação principal é um PWA estático que pode ser servido por qualquer servidor web simples.

```bash
cd frontend
python3 -m http.server 3000
```
Acesse: [http://localhost:3000](http://localhost:3000)

### Backend (Opcional/Backup)

O backend em Flask serve como API de backup ou funcionalidade legada.

```bash
cd backend
pip install -r requirements.txt
python3 app.py
```
Acesse: [http://localhost:5000](http://localhost:5000)

## Testes

Os testes de integração (E2E) utilizam Playwright.

```bash
pip install -r tests/requirements.txt
playwright install
python3 tests/test_server.py
```
