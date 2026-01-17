from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'uma_chave_secreta_muito_segura' # Em produção, usar env var
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Pericia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero_processo = db.Column(db.String(50), nullable=False)
    nome_autor = db.Column(db.String(100), nullable=False)
    data_pericia = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='Aguardando') # Aguardando, Agendado, Em Andamento, Concluido

    # Dados do Laudo
    anamnese = db.Column(db.Text, nullable=True)
    exame_fisico = db.Column(db.Text, nullable=True)
    conclusao = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Pericia {self.numero_processo}>'

# Cria o banco de dados
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    # Dashboard - Lista todas as perícias
    pericias = Pericia.query.order_by(Pericia.created_at.desc()).all()
    return render_template('index.html', pericias=pericias)

@app.route('/nova', methods=['GET', 'POST'])
def nova_pericia():
    if request.method == 'POST':
        numero_processo = request.form['numero_processo']
        nome_autor = request.form['nome_autor']
        data_str = request.form.get('data_pericia')

        data_pericia = None
        if data_str:
            try:
                data_pericia = datetime.strptime(data_str, '%Y-%m-%d')
            except ValueError:
                pass

        nova = Pericia(
            numero_processo=numero_processo,
            nome_autor=nome_autor,
            data_pericia=data_pericia,
            status='Agendado' if data_pericia else 'Aguardando'
        )
        db.session.add(nova)
        db.session.commit()
        return redirect(url_for('index'))
    return render_template('form_pericia.html', pericia=None)

@app.route('/pericia/<int:id>', methods=['GET', 'POST'])
def editar_pericia(id):
    pericia = Pericia.query.get_or_404(id)
    if request.method == 'POST':
        pericia.numero_processo = request.form['numero_processo']
        pericia.nome_autor = request.form['nome_autor']
        data_str = request.form.get('data_pericia')
        if data_str:
             pericia.data_pericia = datetime.strptime(data_str, '%Y-%m-%d')

        pericia.anamnese = request.form.get('anamnese')
        pericia.exame_fisico = request.form.get('exame_fisico')
        pericia.conclusao = request.form.get('conclusao')

        # Simples lógica de status
        if 'finalizar' in request.form:
            pericia.status = 'Concluido'
        elif pericia.status == 'Aguardando' or pericia.status == 'Agendado':
            pericia.status = 'Em Andamento'

        db.session.commit()
        return redirect(url_for('index'))

    return render_template('form_pericia.html', pericia=pericia)

@app.route('/pericia/<int:id>/ver')
def ver_laudo(id):
    pericia = Pericia.query.get_or_404(id)
    return render_template('print_laudo.html', pericia=pericia)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
