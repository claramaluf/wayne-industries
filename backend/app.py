# app.py - API Python PURA sem banco de dados, sem Flask-SQLAlchemy
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import hashlib
import json
import os

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# ========== DADOS EM MEMÓRIA (SIMULANDO BANCO DE DADOS) ==========

# Tabela de usuários (simulando tabela SQL)
usuarios_db = [
    {
        'id': 1,
        'username': 'bruce.wayne',
        'senha': 'batman123',  # Em produção, usar hash!
        'nome': 'Bruce Wayne',
        'tipo': 'admin',
        'email': 'bruce@wayne-enterprises.com',
        'data_cadastro': '1940-05-27'
    },
    {
        'id': 2,
        'username': 'lucius.fox',
        'senha': 'wayne2025',
        'nome': 'Lucius Fox',
        'tipo': 'gerente',
        'email': 'lucius.fox@wayne-enterprises.com',
        'data_cadastro': '1979-01-01'
    },
    {
        'id': 3,
        'username': 'funcionario',
        'senha': 'wayne123',
        'nome': 'Funcionário',
        'tipo': 'funcionario',
        'email': 'funcionario@wayne-enterprises.com',
        'data_cadastro': '2025-12-11'
    }
]

# Tabela de recursos (simulando tabela SQL)
recursos_db = [
    {
        'id': 101,
        'nome': 'Batmóvel',
        'tipo': 'veiculo',
        'categoria': 'Transporte',
        'descricao': 'Veículo blindado de alta velocidade',
        'localizacao': 'Garagem Subterrânea A',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-11',
        'responsavel': 'Bruce Wayne'
    },
    {
        'id': 102,
        'nome': 'Scanner de Segurança XJ9',
        'tipo': 'equipamento',
        'categoria': 'Segurança',
        'descricao': 'Scanner corporal de última geração',
        'localizacao': 'Entrada Principal',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-11',
        'responsavel': 'Lucius Fox'
    },
    {
        'id': 103,
        'nome': 'Câmera Térmica Modelo T-800',
        'tipo': 'dispositivo',
        'categoria': 'Monitoramento',
        'descricao': 'Câmera com visão noturna térmica',
        'localizacao': 'Perímetro Norte',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-11',
        'responsavel': 'Alfred Pennyworth'
    },
    {
        'id': 104,
        'nome': 'Batwing',
        'tipo': 'veiculo',
        'categoria': 'Transporte Aéreo',
        'descricao': 'Aeronave stealth de combate',
        'localizacao': 'Hangar Secreto',
        'status': 'manutencao',
        'ultima_manutencao': '2025-12-11',
        'responsavel': 'Bruce Wayne'
    },
    {
        'id': 105,
        'nome': 'Super Computador "Oracle"',
        'tipo': 'tecnologia',
        'categoria': 'TI',
        'descricao': 'Sistema de processamento de dados avançado',
        'localizacao': 'Sala de Controle',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-11',
        'responsavel': 'Lucius Fox'
    },
    {
        'id': 106,
        'nome': 'Bat-Sinal',
        'tipo': 'dispositivo',
        'categoria': 'Comunicação',
        'descricao': 'Sinalizador de emergência',
        'localizacao': 'Telhado da Torre Wayne',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-11',
        'responsavel': 'Comissário Gordon'
    }
]

# Tabela de logs (simulando tabela SQL)
logs_db = []

# ========== FUNÇÕES PARA SIMULAR BANCO DE DADOS ==========

def buscar_usuario(username, senha):
    """Simula SELECT * FROM usuarios WHERE username = ? AND senha = ?"""
    for usuario in usuarios_db:
        if usuario['username'] == username and usuario['senha'] == senha:
            return usuario.copy()  # Retorna cópia para não modificar original
    return None

def buscar_usuario_por_id(usuario_id):
    """Simula SELECT * FROM usuarios WHERE id = ?"""
    for usuario in usuarios_db:
        if usuario['id'] == usuario_id:
            return usuario.copy()
    return None

def buscar_recursos(filtros=None):
    """Simula SELECT * FROM recursos com filtros opcionais"""
    resultados = recursos_db.copy()
    
    if filtros:
        if 'tipo' in filtros and filtros['tipo']:
            resultados = [r for r in resultados if r['tipo'] == filtros['tipo']]
        
        if 'status' in filtros and filtros['status']:
            resultados = [r for r in resultados if r['status'] == filtros['status']]
        
        if 'busca' in filtros and filtros['busca']:
            busca = filtros['busca'].lower()
            resultados = [
                r for r in resultados 
                if busca in r['nome'].lower() or 
                   busca in r['descricao'].lower() or
                   busca in r['categoria'].lower()
            ]
    
    return resultados

def buscar_recurso_por_id(recurso_id):
    """Simula SELECT * FROM recursos WHERE id = ?"""
    for recurso in recursos_db:
        if recurso['id'] == recurso_id:
            return recurso.copy()
    return None

def adicionar_recurso(novo_recurso):
    """Simula INSERT INTO recursos"""
    # Gera novo ID (simulando auto-increment)
    novo_id = max([r['id'] for r in recursos_db]) + 1
    novo_recurso['id'] = novo_id
    novo_recurso['data_cadastro'] = datetime.now().strftime('%Y-%m-%d')
    
    recursos_db.append(novo_recurso)
    return novo_recurso

def atualizar_recurso(recurso_id, dados_atualizacao):
    """Simula UPDATE recursos SET ... WHERE id = ?"""
    for i, recurso in enumerate(recursos_db):
        if recurso['id'] == recurso_id:
            # Atualiza os campos fornecidos
            for campo, valor in dados_atualizacao.items():
                if campo in recurso:
                    recursos_db[i][campo] = valor
            
            # Atualiza data da última modificação
            recursos_db[i]['ultima_manutencao'] = datetime.now().strftime('%Y-%m-%d')
            
            return recursos_db[i].copy()
    
    return None

def remover_recurso(recurso_id):
    """Simula DELETE FROM recursos WHERE id = ?"""
    global recursos_db
    recursos_db = [r for r in recursos_db if r['id'] != recurso_id]
    return True

def adicionar_log(acao, usuario, detalhes):
    """Simula INSERT INTO logs"""
    log = {
        'id': len(logs_db) + 1,
        'data_hora': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'acao': acao,
        'usuario': usuario,
        'detalhes': detalhes
    }
    logs_db.append(log)
    return log

# ========== SISTEMA DE SESSÃO SIMPLES ==========

# Dicionário para armazenar sessões (simulando tabela de sessões)
sessoes_ativas = {}

def criar_sessao(usuario_id):
    """Cria uma nova sessão para o usuário"""
    import secrets
    import time
    
    session_id = secrets.token_hex(16)
    sessoes_ativas[session_id] = {
        'usuario_id': usuario_id,
        'criada_em': time.time(),
        'expira_em': time.time() + 3600  # 1 hora
    }
    
    return session_id

def validar_sessao(session_id):
    """Valida se uma sessão é ativa"""
    import time
    
    if session_id in sessoes_ativas:
        sessao = sessoes_ativas[session_id]
        if time.time() < sessao['expira_em']:
            # Renova a sessão
            sessao['expira_em'] = time.time() + 3600
            return sessao['usuario_id']
    
    return None

def encerrar_sessao(session_id):
    """Remove uma sessão"""
    if session_id in sessoes_ativas:
        del sessoes_ativas[session_id]
        return True
    return False

# ========== ROTAS DA API ==========

@app.route('/')
def pagina_inicial():
    """Serve a página inicial"""
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/<path:arquivo>')
def servir_arquivos(arquivo):
    """Serve arquivos estáticos (HTML, CSS, JS)"""
    return send_from_directory(app.static_folder, arquivo)

@app.route('/api/status')
def status_api():
    """Endpoint para verificar se a API está online"""
    return jsonify({
        'status': 'online',
        'mensagem': 'API das Indústrias Wayne funcionando!',
        'versao': '1.0.0',
        'dados': {
            'usuarios_cadastrados': len(usuarios_db),
            'recursos_cadastrados': len(recursos_db),
            'logs_registrados': len(logs_db)
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    """Autenticação de usuário"""
    dados = request.json
    
    if not dados or 'username' not in dados or 'senha' not in dados:
        return jsonify({'erro': 'Username e senha são obrigatórios'}), 400
    
    usuario = buscar_usuario(dados['username'], dados['senha'])
    
    if usuario:
        # Criar sessão
        session_id = criar_sessao(usuario['id'])
        
        # Registrar log
        adicionar_log('LOGIN', usuario['nome'], f"Usuário {usuario['nome']} fez login no sistema")
        
        # Remover senha da resposta
        usuario_sem_senha = usuario.copy()
        usuario_sem_senha.pop('senha', None)
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Login realizado com sucesso!',
            'usuario': usuario_sem_senha,
            'session_id': session_id,
            'token': session_id  # Para compatibilidade com frontend
        }), 200
    else:
        return jsonify({
            'sucesso': False,
            'erro': 'Credenciais inválidas'
        }), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """Encerra a sessão do usuário"""
    session_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if session_id:
        usuario_id = validar_sessao(session_id)
        if usuario_id:
            usuario = buscar_usuario_por_id(usuario_id)
            if usuario:
                adicionar_log('LOGOUT', usuario['nome'], f"Usuário {usuario['nome']} fez logout")
        
        encerrar_sessao(session_id)
    
    return jsonify({
        'sucesso': True,
        'mensagem': 'Logout realizado com sucesso!'
    })

@app.route('/api/dashboard/estatisticas', methods=['GET'])
def dashboard_estatisticas():
    """Estatísticas para o dashboard"""
    session_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    usuario_id = validar_sessao(session_id)
    
    if not usuario_id:
        return jsonify({'erro': 'Não autorizado'}), 401
    
    # Contar recursos por status
    recursos_ativos = sum(1 for r in recursos_db if r['status'] == 'ativo')
    recursos_manutencao = sum(1 for r in recursos_db if r['status'] == 'manutencao')
    
    # Contar recursos por tipo
    tipos_recursos = {}
    for recurso in recursos_db:
        tipo = recurso['tipo']
        tipos_recursos[tipo] = tipos_recursos.get(tipo, 0) + 1
    
    # Últimas atividades (logs)
    ultimos_logs = logs_db[-10:] if logs_db else []
    
    return jsonify({
        'sucesso': True,
        'estatisticas': {
            'total_usuarios': len(usuarios_db),
            'total_recursos': len(recursos_db),
            'recursos_ativos': recursos_ativos,
            'recursos_manutencao': recursos_manutencao,
            'distribuicao_tipos': tipos_recursos,
            'status_sistema': 'OPERACIONAL',
            'alertas_recentes': 3,
            'acessos_hoje': len([log for log in logs_db if 'LOGIN' in log['acao']])
        },
        'ultimas_atividades': ultimos_logs[-5:],  # Últimos 5 logs
        'tempo_resposta': '25ms'
    })

@app.route('/api/recursos', methods=['GET'])
def listar_recursos():
    """Lista todos os recursos (com filtros opcionais)"""
    session_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    usuario_id = validar_sessao(session_id)
    
    if not usuario_id:
        return jsonify({'erro': 'Não autorizado'}), 401
    
    # Coletar filtros da query string
    filtros = {
        'tipo': request.args.get('tipo'),
        'status': request.args.get('status'),
        'busca': request.args.get('busca')
    }
    
    recursos = buscar_recursos(filtros)
    
    # Registrar log
    usuario = buscar_usuario_por_id(usuario_id)
    if usuario:
        adicionar_log('CONSULTA_RECURSOS', usuario['nome'], f"Consultou {len(recursos)} recursos")
    
    return jsonify({
        'sucesso': True,
        'total': len(recursos),
        'recursos': recursos
    })

@app.route('/api/recursos/<int:recurso_id>', methods=['GET'])
def obter_recurso(recurso_id):
    """Obtém detalhes de um recurso específico"""
    session_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    usuario_id = validar_sessao(session_id)
    
    if not usuario_id:
        return jsonify({'erro': 'Não autorizado'}), 401
    
    recurso = buscar_recurso_por_id(recurso_id)
    
    if recurso:
        # Registrar log
        usuario = buscar_usuario_por_id(usuario_id)
        if usuario:
            adicionar_log('VISUALIZAR_RECURSO', usuario['nome'], f"Visualizou recurso: {recurso['nome']}")
        
        return jsonify({
            'sucesso': True,
            'recurso': recurso
        })
    else:
        return jsonify({
            'sucesso': False,
            'erro': f'Recurso com ID {recurso_id} não encontrado'
        }), 404

@app.route('/api/recursos', methods=['POST'])
def criar_novo_recurso():
    """Cria um novo recurso"""
    session_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    usuario_id = validar_sessao(session_id)
    
    if not usuario_id:
        return jsonify({'erro': 'Não autorizado'}), 401
    
    # Verificar permissões
    usuario = buscar_usuario_por_id(usuario_id)
    if usuario['tipo'] != 'admin':
        return jsonify({'erro': 'Permissão insuficiente'}), 403
    
    dados = request.json
    
    # Validar dados obrigatórios
    if not dados.get('nome') or not dados.get('tipo'):
        return jsonify({'erro': 'Nome e tipo são obrigatórios'}), 400
    
    # Criar novo recurso
    novo_recurso = {
        'nome': dados['nome'],
        'tipo': dados['tipo'],
        'categoria': dados.get('categoria', 'Outros'),
        'descricao': dados.get('descricao', ''),
        'localizacao': dados.get('localizacao', 'Local não especificado'),
        'status': dados.get('status', 'ativo'),
        'responsavel': usuario['nome']
    }
    
    recurso_criado = adicionar_recurso(novo_recurso)
    
    # Registrar log
    adicionar_log('CRIAR_RECURSO', usuario['nome'], f"Criou recurso: {recurso_criado['nome']} (ID: {recurso_criado['id']})")
    
    return jsonify({
        'sucesso': True,
        'mensagem': 'Recurso criado com sucesso!',
        'recurso': recurso_criado
    }), 201

@app.route('/api/recursos/<int:recurso_id>', methods=['PUT'])
def atualizar_recurso_api(recurso_id):
    """Atualiza um recurso existente"""
    session_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    usuario_id = validar_sessao(session_id)
    
    if not usuario_id:
        return jsonify({'erro': 'Não autorizado'}), 401
    
    # Verificar permissões
    usuario = buscar_usuario_por_id(usuario_id)
    if usuario['tipo'] != 'admin':
        return jsonify({'erro': 'Permissão insuficiente'}), 403
    
    dados = request.json
    
    # Atualizar recurso
    recurso_atualizado = atualizar_recurso(recurso_id, dados)
    
    if recurso_atualizado:
        # Registrar log
        adicionar_log('ATUALIZAR_RECURSO', usuario['nome'], f"Atualizou recurso: {recurso_atualizado['nome']} (ID: {recurso_id})")
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Recurso atualizado com sucesso!',
            'recurso': recurso_atualizado
        })
    else:
        return jsonify({
            'sucesso': False,
            'erro': f'Recurso com ID {recurso_id} não encontrado'
        }), 404

@app.route('/api/recursos/<int:recurso_id>', methods=['DELETE'])
def excluir_recurso(recurso_id):
    """Exclui um recurso"""
    session_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    usuario_id = validar_sessao(session_id)
    
    if not usuario_id:
        return jsonify({'erro': 'Não autorizado'}), 401
    
   # Verificar permissões
    usuario = buscar_usuario_por_id(usuario_id)
    if usuario['tipo'] != 'admin':
        return jsonify({'erro': 'Permissão insuficiente'}), 403
    
    # Buscar recurso antes de excluir (para log)
    recurso = buscar_recurso_por_id(recurso_id)
    
    if recurso:
        # Excluir recurso
        remover_recurso(recurso_id)
        
        # Registrar log
        adicionar_log('EXCLUIR_RECURSO', usuario['nome'], f"Excluiu recurso: {recurso['nome']} (ID: {recurso_id})")
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Recurso excluído com sucesso!',
            'recurso_excluido': recurso
        })
    else:
        return jsonify({
            'sucesso': False,
            'erro': f'Recurso com ID {recurso_id} não encontrado'
        }), 404

@app.route('/api/usuario/perfil', methods=['GET'])
def perfil_usuario():
    """Retorna perfil do usuário logado"""
    session_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    usuario_id = validar_sessao(session_id)
    
    if not usuario_id:
        return jsonify({'erro': 'Não autorizado'}), 401
    
    usuario = buscar_usuario_por_id(usuario_id)
    
    if usuario:
        # Remover senha da resposta
        usuario_sem_senha = usuario.copy()
        usuario_sem_senha.pop('senha', None)
        
        return jsonify({
            'sucesso': True,
            'perfil': usuario_sem_senha
        })
    
    return jsonify({'erro': 'Usuário não encontrado'}), 404

# ========== INICIALIZAÇÃO ==========

if __name__ == '__main__':
    # Adicionar alguns logs iniciais
    adicionar_log('SISTEMA', 'Sistema', 'API inicializada com sucesso')
    adicionar_log('SISTEMA', 'Sistema', f'Carregados {len(usuarios_db)} usuários')
    adicionar_log('SISTEMA', 'Sistema', f'Carregados {len(recursos_db)} recursos')
    
    print("\n" + "="*60)
    print("SISTEMA DE GERENCIAMENTO - INDÚSTRIAS WAYNE")
    print("="*60)
    print("API Python (Simulação Banco de Dados)")
    print("="*60)
    print(f"URL: http://localhost:5002")
    print(f"Usuários cadastrados: {len(usuarios_db)}")
    print(f"Recursos cadastrados: {len(recursos_db)}")
    print("\nCredenciais para teste:")
    print("1. Admin: bruce.wayne / batman123")
    print("2. Gerente: lucius.fox / wayne2025")
    print("3. Funcionário: funcionario / wayne123")
    print("="*60 + "\n")
    
    # Executar servidor
    app.run(host='0.0.0.0', port=5002, debug=True)