# app.py - API Python PURA
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os
import secrets

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# ========== DADOS EM MEMÓRIA ==========

usuarios_db = [
    {
        'id': 1,
        'username': 'bruce.wayne',
        'senha': 'batman123',
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

recursos_db = [
    {
        'id': 101,
        'nome': 'Batmóvel',
        'tipo': 'veiculo',
        'categoria': 'Transporte',
        'descricao': 'Veículo blindado de alta velocidade com armamentos defensivos',
        'localizacao': 'Garagem Subterrânea A',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-11',
        'responsavel': 'Bruce Wayne',
        'data_cadastro': '2025-01-15'
    },
    {
        'id': 102,
        'nome': 'Scanner de Segurança XJ9',
        'tipo': 'equipamento',
        'categoria': 'Segurança',
        'descricao': 'Scanner corporal de última geração com detecção de metais',
        'localizacao': 'Entrada Principal',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-10',
        'responsavel': 'Lucius Fox',
        'data_cadastro': '2025-02-20'
    },
    {
        'id': 103,
        'nome': 'Câmera Térmica Modelo T-800',
        'tipo': 'dispositivo',
        'categoria': 'Monitoramento',
        'descricao': 'Câmera com visão noturna térmica 360 graus',
        'localizacao': 'Perímetro Norte',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-09',
        'responsavel': 'Alfred Pennyworth',
        'data_cadastro': '2025-03-10'
    },
    {
        'id': 104,
        'nome': 'Batwing',
        'tipo': 'veiculo',
        'categoria': 'Transporte Aéreo',
        'descricao': 'Aeronave stealth de combate com sistema de invisibilidade',
        'localizacao': 'Hangar Secreto',
        'status': 'manutencao',
        'ultima_manutencao': '2025-12-11',
        'responsavel': 'Bruce Wayne',
        'data_cadastro': '2025-04-05'
    },
    {
        'id': 105,
        'nome': 'Super Computador "Oracle"',
        'tipo': 'tecnologia',
        'categoria': 'TI',
        'descricao': 'Sistema de processamento de dados avançado com IA',
        'localizacao': 'Sala de Controle',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-08',
        'responsavel': 'Lucius Fox',
        'data_cadastro': '2025-05-12'
    },
    {
        'id': 106,
        'nome': 'Bat-Sinal',
        'tipo': 'dispositivo',
        'categoria': 'Comunicação',
        'descricao': 'Sinalizador de emergência com projeção holográfica',
        'localizacao': 'Telhado da Torre Wayne',
        'status': 'ativo',
        'ultima_manutencao': '2025-12-07',
        'responsavel': 'Comissário Gordon',
        'data_cadastro': '2025-06-18'
    }
]

logs_db = []

# ========== FUNÇÕES DO "BANCO DE DADOS" ==========

def buscar_usuario(username, senha):
    for usuario in usuarios_db:
        if usuario['username'] == username and usuario['senha'] == senha:
            return usuario.copy()
    return None

def buscar_usuario_por_id(usuario_id):
    for usuario in usuarios_db:
        if usuario['id'] == usuario_id:
            return usuario.copy()
    return None

def buscar_recursos(filtros=None):
    resultados = recursos_db.copy()
    
    if filtros:
        if filtros.get('tipo'):
            resultados = [r for r in resultados if r['tipo'] == filtros['tipo']]
        
        if filtros.get('status'):
            resultados = [r for r in resultados if r['status'] == filtros['status']]
        
        if filtros.get('busca'):
            busca = filtros['busca'].lower()
            resultados = [
                r for r in resultados 
                if busca in r['nome'].lower() or 
                   busca in r['descricao'].lower() or
                   busca in r['categoria'].lower()
            ]
    
    return resultados

def buscar_recurso_por_id(recurso_id):
    for recurso in recursos_db:
        if recurso['id'] == recurso_id:
            return recurso.copy()
    return None

def adicionar_recurso(novo_recurso):
    if recursos_db:
        novo_id = max([r['id'] for r in recursos_db]) + 1
    else:
        novo_id = 1
    
    novo_recurso['id'] = novo_id
    novo_recurso['data_cadastro'] = datetime.now().strftime('%Y-%m-%d')
    novo_recurso['ultima_manutencao'] = datetime.now().strftime('%Y-%m-%d')
    
    status_valido = novo_recurso.get('status', 'ativo').lower()
    if status_valido not in ['ativo', 'manutencao', 'inativo']:
        status_valido = 'ativo'
    
    novo_recurso['status'] = status_valido
    
    if 'responsavel' not in novo_recurso or not novo_recurso['responsavel']:
        novo_recurso['responsavel'] = 'Sistema'
    
    if 'categoria' not in novo_recurso or not novo_recurso['categoria']:
        novo_recurso['categoria'] = 'Equipamento'
    
    recursos_db.append(novo_recurso)
    print(f"Recurso adicionado: {novo_recurso['nome']} (ID: {novo_id})")
    return novo_recurso

def atualizar_recurso(recurso_id, dados_atualizacao):
    for i, recurso in enumerate(recursos_db):
        if recurso['id'] == recurso_id:
            if 'status' in dados_atualizacao:
                status_valido = dados_atualizacao['status'].lower()
                if status_valido not in ['ativo', 'manutencao', 'inativo']:
                    status_valido = 'ativo'
                dados_atualizacao['status'] = status_valido
            
            for campo, valor in dados_atualizacao.items():
                if campo in recurso:
                    recursos_db[i][campo] = valor
            
            recursos_db[i]['ultima_manutencao'] = datetime.now().strftime('%Y-%m-%d')
            
            print(f"Recurso atualizado: {recursos_db[i]['nome']} (ID: {recurso_id})")
            return recursos_db[i].copy()
    
    return None

def remover_recurso(recurso_id):
    for i, recurso in enumerate(recursos_db):
        if recurso['id'] == recurso_id:
            recurso_removido = recursos_db.pop(i)
            print(f"Recurso removido: {recurso_removido['nome']} (ID: {recurso_id})")
            return recurso_removido
    return None

def adicionar_log(acao, usuario, detalhes):
    log = {
        'id': len(logs_db) + 1,
        'data_hora': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'acao': acao,
        'usuario': usuario,
        'detalhes': detalhes
    }
    logs_db.append(log)
    return log

# ========== SISTEMA DE SESSÃO ==========

sessoes_ativos = {}

def criar_sessao(usuario_id):
    session_id = secrets.token_hex(16)
    sessoes_ativos[session_id] = {
        'usuario_id': usuario_id,
        'criada_em': datetime.now().isoformat(),
        'expira_em': (datetime.now().timestamp() + 3600)
    }
    return session_id

def validar_sessao(session_id):
    if session_id in sessoes_ativos:
        sessao = sessoes_ativos[session_id]
        if datetime.now().timestamp() < sessao['expira_em']:
            sessao['expira_em'] = datetime.now().timestamp() + 3600
            return sessao['usuario_id']
    return None

def encerrar_sessao(session_id):
    if session_id in sessoes_ativos:
        del sessoes_ativos[session_id]
        return True
    return False

# ========== ROTAS DA API ==========

@app.route('/')
def pagina_inicial():
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/<path:arquivo>')
def servir_arquivos(arquivo):
    return send_from_directory(app.static_folder, arquivo)

@app.route('/api/status')
def status_api():
    return jsonify({
        'status': 'online',
        'mensagem': 'API das Indústrias Wayne funcionando',
        'versao': '2.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/login', methods=['POST'])
def login():
    dados = request.json
    
    if not dados or 'username' not in dados or 'senha' not in dados:
        return jsonify({'erro': 'Username e senha são obrigatórios'}), 400
    
    usuario = buscar_usuario(dados['username'], dados['senha'])
    
    if usuario:
        session_id = criar_sessao(usuario['id'])
        
        adicionar_log('LOGIN', usuario['nome'], f"Usuário {usuario['nome']} fez login")
        
        usuario_resposta = usuario.copy()
        usuario_resposta.pop('senha', None)
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Login realizado com sucesso',
            'usuario': usuario_resposta,
            'session_id': session_id,
            'token': session_id
        }), 200
    else:
        return jsonify({
            'sucesso': False,
            'erro': 'Credenciais inválidas'
        }), 401

@app.route('/api/recursos', methods=['GET'])
def listar_recursos():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return jsonify({'erro': 'Token de autenticação ausente'}), 401
    
    filtros = {
        'tipo': request.args.get('tipo'),
        'status': request.args.get('status'),
        'busca': request.args.get('busca')
    }
    
    filtros = {k: v for k, v in filtros.items() if v}
    
    recursos = buscar_recursos(filtros)
    
    recursos.sort(key=lambda x: x['id'], reverse=True)
    
    return jsonify({
        'sucesso': True,
        'total': len(recursos),
        'recursos': recursos
    })

@app.route('/api/recursos', methods=['POST'])
def criar_novo_recurso():
    try:
        dados = request.json
        
        if not dados or not dados.get('nome'):
            return jsonify({'erro': 'Nome do recurso é obrigatório'}), 400
        
        novo_recurso = {
            'nome': dados['nome'],
            'tipo': dados.get('tipo', 'equipamento'),
            'categoria': dados.get('categoria', 'Outros'),
            'descricao': dados.get('descricao', ''),
            'localizacao': dados.get('localizacao', 'Local não especificado'),
            'status': dados.get('status', 'ativo'),
            'responsavel': dados.get('responsavel', 'Sistema')
        }
        
        recurso_criado = adicionar_recurso(novo_recurso)
        
        adicionar_log('CRIAR_RECURSO', 'Sistema', f"Recurso criado: {recurso_criado['nome']}")
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Recurso criado com sucesso',
            'recurso': recurso_criado
        }), 201
        
    except Exception as e:
        print(f"Erro ao criar recurso: {str(e)}")
        return jsonify({
            'sucesso': False,
            'erro': f'Erro interno ao criar recurso: {str(e)}'
        }), 500

@app.route('/api/recursos/<int:recurso_id>', methods=['PUT'])
def atualizar_recurso_api(recurso_id):
    try:
        # Garante que os dados sejam lidos corretamente
        dados = request.get_json() 
        
        if not dados:
            return jsonify({'erro': 'Dados de atualização são obrigatórios'}), 400
        
        recurso_atualizado = atualizar_recurso(recurso_id, dados)
        
        if recurso_atualizado:
            adicionar_log('ATUALIZAR_RECURSO', 'Sistema', f"Recurso atualizado: {recurso_atualizado['nome']}")
            
            return jsonify({
                'sucesso': True,
                'mensagem': 'Recurso atualizado com sucesso',
                'recurso': recurso_atualizado
            })
        else:
            return jsonify({
                'sucesso': False,
                'erro': f'Recurso com ID {recurso_id} não encontrado'
            }), 404
            
    except Exception as e:
        print(f"Erro no PUT de recurso: {str(e)}") # Adicionado log para debug
        return jsonify({
            'sucesso': False,
            'erro': f'Erro interno: {str(e)}'
        }), 500

@app.route('/api/recursos/<int:recurso_id>', methods=['DELETE'])
def excluir_recurso_api(recurso_id):
    try:
        recurso_removido = remover_recurso(recurso_id)
        
        if recurso_removido:
            adicionar_log('EXCLUIR_RECURSO', 'Sistema', f"Recurso excluído: {recurso_removido['nome']}")
            
            return jsonify({
                'sucesso': True,
                'mensagem': 'Recurso excluído com sucesso',
                'recurso_excluido': recurso_removido
            })
        else:
            return jsonify({
                'sucesso': False,
                'erro': f'Recurso com ID {recurso_id} não encontrado'
            }), 404
            
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'erro': f'Erro interno: {str(e)}'
        }), 500

# ========== INICIALIZAÇÃO ==========

if __name__ == '__main__':
    adicionar_log('SISTEMA', 'API', 'API inicializada com sucesso')
    
    print("\n" + "="*60)
    print("SISTEMA DE GERENCIAMENTO - INDUSTRIAS WAYNE")
    print("="*60)
    print(f"API rodando em: http://localhost:5002")
    print(f"Usuarios cadastrados: {len(usuarios_db)}")
    print(f"Recursos cadastrados: {len(recursos_db)}")
    print("\nCredenciais para teste:")
    print("   Admin: bruce.wayne / batman123")
    print("   Gerente: lucius.fox / wayne2025")
    print("   Funcionario: funcionario / wayne123")
    print("\nRecursos de exemplo ja cadastrados")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5002, debug=True)