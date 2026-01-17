from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from werkzeug.utils import secure_filename
from datetime import datetime
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'uma_chave_secreta_muito_segura' # Em production, use env var
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # Limit 16MB

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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

    # Financeiro
    valor_honorarios = db.Column(db.Float, default=0.0)
    status_pagamento = db.Column(db.String(20), default='Pendente') # Pendente, Pago

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    documents = db.relationship('Documento', backref='pericia', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Pericia {self.numero_processo}>'

class Documento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    pericia_id = db.Column(db.Integer, db.ForeignKey('pericia.id'), nullable=False)

class Macro(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    categoria = db.Column(db.String(50), nullable=False) # anamnese, exame_fisico, conclusao

# Cria o banco de dados
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    # Search and Filter
    search = request.args.get('search')
    status_filter = request.args.get('status')

    query = Pericia.query

    if search:
        query = query.filter(
            (Pericia.numero_processo.contains(search)) |
            (Pericia.nome_autor.contains(search))
        )

    if status_filter:
        query = query.filter(Pericia.status == status_filter)

    pericias = query.order_by(Pericia.created_at.desc()).all()

    # Totais Financeiros
    total_recebido = query.filter(Pericia.status_pagamento == 'Pago').with_entities(func.sum(Pericia.valor_honorarios)).scalar() or 0.0
    total_pendente = query.filter(Pericia.status_pagamento == 'Pendente').with_entities(func.sum(Pericia.valor_honorarios)).scalar() or 0.0

    return render_template('index.html', pericias=pericias, search=search, status_filter=status_filter, total_recebido=total_recebido, total_pendente=total_pendente)

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

        # New fields optional on creation
        valor_honorarios = request.form.get('valor_honorarios', 0.0)
        try:
             valor_honorarios = float(valor_honorarios)
        except:
             valor_honorarios = 0.0

        nova = Pericia(
            numero_processo=numero_processo,
            nome_autor=nome_autor,
            data_pericia=data_pericia,
            status='Agendado' if data_pericia else 'Aguardando',
            valor_honorarios=valor_honorarios
        )
        db.session.add(nova)
        db.session.commit()
        return redirect(url_for('editar_pericia', id=nova.id))
    return render_template('form_pericia.html', pericia=None)

@app.route('/pericia/<int:id>', methods=['GET', 'POST'])
def editar_pericia(id):
    pericia = Pericia.query.get_or_404(id)
    macros = Macro.query.all()

    if request.method == 'POST':
        pericia.numero_processo = request.form['numero_processo']
        pericia.nome_autor = request.form['nome_autor']
        data_str = request.form.get('data_pericia')
        if data_str:
             pericia.data_pericia = datetime.strptime(data_str, '%Y-%m-%d')

        pericia.anamnese = request.form.get('anamnese')
        pericia.exame_fisico = request.form.get('exame_fisico')
        pericia.conclusao = request.form.get('conclusao')

        # Financeiro
        try:
            pericia.valor_honorarios = float(request.form.get('valor_honorarios', 0.0))
        except:
             pericia.valor_honorarios = 0.0

        pericia.status_pagamento = request.form.get('status_pagamento', 'Pendente')


        if 'finalizar' in request.form:
            pericia.status = 'Concluido'
        elif pericia.status == 'Aguardando' or pericia.status == 'Agendado':
            pericia.status = 'Em Andamento'

        db.session.commit()
        return redirect(url_for('index'))

    return render_template('form_pericia.html', pericia=pericia, macros=macros)

@app.route('/api/pericia/<int:id>/upload', methods=['POST'])
def upload_documento_api(id):
    pericia = Pericia.query.get_or_404(id)

    if 'upload_document' not in request.files:
        return jsonify({'error': 'No file'}), 400

    file = request.files['upload_document']
    if file.filename == '':
        return jsonify({'error': 'No filename'}), 400

    if file:
        filename = secure_filename(file.filename)
        unique_filename = f"{datetime.now().timestamp()}_{filename}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))

        doc = Documento(filename=unique_filename, original_name=filename, pericia_id=pericia.id)
        db.session.add(doc)
        db.session.commit()

        return jsonify({
            'message': 'Success',
            'id': doc.id,
            'original_name': doc.original_name,
            'url': url_for('uploaded_file', filename=doc.filename),
            'delete_url': url_for('deletar_documento', pericia_id=pericia.id, doc_id=doc.id)
        })

@app.route('/pericia/<int:pericia_id>/documento/<int:doc_id>/delete')
def deletar_documento(pericia_id, doc_id):
    doc = Documento.query.get_or_404(doc_id)
    if doc.pericia_id != pericia_id:
        return redirect(url_for('index')) # Security check

    try:
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], doc.filename))
    except:
        pass # Ignore if file doesn't exist

    db.session.delete(doc)
    db.session.commit()
    return redirect(url_for('editar_pericia', id=pericia_id))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/pericia/<int:id>/ver')
def ver_laudo(id):
    pericia = Pericia.query.get_or_404(id)
    return render_template('print_laudo.html', pericia=pericia)

# --- Macros Routes ---
@app.route('/macros')
def listar_macros():
    macros = Macro.query.all()
    return render_template('macros.html', macros=macros)

@app.route('/macros/nova', methods=['POST'])
def nova_macro():
    titulo = request.form['titulo']
    categoria = request.form['categoria']
    conteudo = request.form['conteudo']

    nova = Macro(titulo=titulo, categoria=categoria, conteudo=conteudo)
    db.session.add(nova)
    db.session.commit()
    return redirect(url_for('listar_macros'))

@app.route('/macros/<int:id>/delete')
def deletar_macro(id):
    macro = Macro.query.get_or_404(id)
    db.session.delete(macro)
    db.session.commit()
    return redirect(url_for('listar_macros'))

@app.route('/api/macros/<categoria>')
def get_macros_by_category(categoria):
    macros = Macro.query.filter_by(categoria=categoria).all()
    return jsonify([{'id': m.id, 'titulo': m.titulo, 'conteudo': m.conteudo} for m in macros])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
