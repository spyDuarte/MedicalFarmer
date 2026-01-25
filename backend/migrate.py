import sqlite3
import os

DB_PATH = 'backend/instance/database.db'
# Handle if run from root or backend dir
if not os.path.exists(DB_PATH):
    if os.path.exists('instance/database.db'):
        DB_PATH = 'instance/database.db'
    elif os.path.exists('backend/database.db'):
        DB_PATH = 'backend/database.db'
    elif os.path.exists('database.db'):
        DB_PATH = 'database.db'

print(f"Checking database at: {DB_PATH}")

if not os.path.exists(DB_PATH):
    print("Database not found. Skipping migration (app.py will create it).")
    exit(0)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get existing columns
cursor.execute("PRAGMA table_info(pericia)")
columns = [info[1] for info in cursor.fetchall()]

# Define new columns
new_columns = {
    'tipo_acao': 'VARCHAR(50)',
    'cpf': 'VARCHAR(14)',
    'rg': 'VARCHAR(20)',
    'data_nascimento': 'DATETIME',
    'escolaridade': 'VARCHAR(50)',
    'profissao': 'VARCHAR(100)',
    'estado_civil': 'VARCHAR(20)',
    'endereco_cep': 'VARCHAR(10)',
    'endereco_cidade': 'VARCHAR(100)',
    'endereco_uf': 'VARCHAR(2)',
    'objetivo': 'TEXT',
    'metodologia': 'TEXT',
    'antecedentes': 'TEXT',
    'discussao': 'TEXT',
    'quesitos': 'TEXT',
    'bibliografia': 'TEXT'
}

print("Migrating database...")

for col_name, col_type in new_columns.items():
    if col_name not in columns:
        print(f"Adding column: {col_name}")
        try:
            cursor.execute(f"ALTER TABLE pericia ADD COLUMN {col_name} {col_type}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()
print("Migration complete.")
