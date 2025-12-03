// ========== INTEGRAÇÃO COM API PYTHON ==========

async function fazerLoginAPI(username, senha) {
    try {
        const resposta = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, senha })
        });
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            // Salvar token e dados do usuário
            localStorage.setItem('token', dados.token);
            localStorage.setItem('usuario', JSON.stringify(dados.usuario));
            localStorage.setItem('session_id', dados.session_id);
            
            return { sucesso: true, usuario: dados.usuario };
        } else {
            return { sucesso: false, erro: dados.erro };
        }
    } catch (erro) {
        console.error('Erro na API:', erro);
        return { sucesso: false, erro: 'Erro de conexão com o servidor' };
    }
}

async function buscarRecursosAPI(filtros = {}) {
    try {
        const token = localStorage.getItem('token');
        
        // Construir URL com filtros
        let url = 'http://localhost:5000/api/recursos';
        const parametros = [];
        
        if (filtros.tipo) parametros.push(`tipo=${filtros.tipo}`);
        if (filtros.status) parametros.push(`status=${filtros.status}`);
        if (filtros.busca) parametros.push(`busca=${encodeURIComponent(filtros.busca)}`);
        
        if (parametros.length > 0) {
            url += '?' + parametros.join('&');
        }
        
        const resposta = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (resposta.status === 401) {
            // Token expirado
            localStorage.clear();
            window.location.href = 'login.html';
            return { sucesso: false, erro: 'Sessão expirada' };
        }
        
        const dados = await resposta.json();
        return dados;
    } catch (erro) {
        console.error('Erro ao buscar recursos:', erro);
        return { sucesso: false, erro: 'Erro de conexão' };
    }
}

async function criarRecursoAPI(dadosRecurso) {
    try {
        const token = localStorage.getItem('token');
        
        const resposta = await fetch('http://localhost:5000/api/recursos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosRecurso)
        });
        
        const dados = await resposta.json();
        return dados;
    } catch (erro) {
        console.error('Erro ao criar recurso:', erro);
        return { sucesso: false, erro: 'Erro de conexão' };
    }
}

// Atualizar a função de login no início do script.js
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;
        
        // Usar API Python
        const resultado = await fazerLoginAPI(username, password);
        
        if (resultado.sucesso) {
            // Verificar tipo de usuário
            if (userType && resultado.usuario.tipo !== userType) {
                alert(`Tipo de usuário incorreto. Você é um ${resultado.usuario.tipo}.`);
                return;
            }
            
            // Salvar dados adicionais
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userName', resultado.usuario.nome);
            localStorage.setItem('userType', resultado.usuario.tipo);
            
            // Redirecionar
            window.location.href = 'dashboard.html';
        } else {
            alert(`Erro no login: ${resultado.erro || 'Credenciais inválidas'}`);
        }
    });
}

// Função para carregar recursos da API
async function carregarRecursosDaAPI() {
    const dados = await buscarRecursosAPI();
    
    if (dados.sucesso && window.renderResourcesTable) {
        // Atualizar a variável global de recursos
        window.recursosData = dados.recursos || [];
        
        // Renderizar tabela
        renderResourcesTable(window.recursosData);
        
        // Atualizar contadores
        if (document.getElementById('resourcesCount')) {
            document.getElementById('resourcesCount').textContent = dados.total || 0;
        }
    }
}

// Chamar função quando a página de recursos carregar
if (window.location.pathname.includes('recursos.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        // Aguardar um pouco para garantir que o DOM esteja pronto
        setTimeout(carregarRecursosDaAPI, 100);
    });
}

// Atualizar função de adicionar recurso para usar API
if (resourceForm) {
    resourceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const dadosRecurso = {
            nome: document.getElementById('resourceName').value,
            tipo: document.getElementById('resourceTypeSelect').value,
            descricao: document.getElementById('resourceDescription').value,
            localizacao: document.getElementById('resourceLocation').value,
            status: document.getElementById('resourceStatusSelect').value,
            categoria: 'Equipamento'
        };
        
        const resultado = await criarRecursoAPI(dadosRecurso);
        
        if (resultado.sucesso) {
            alert(resultado.mensagem);
            modal.style.display = 'none';
            resourceForm.reset();
            
            // Recarregar recursos
            await carregarRecursosDaAPI();
        } else {
            alert(`Erro: ${resultado.erro || 'Não foi possível criar o recurso'}`);
        }
    });
}