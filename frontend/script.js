// script.js - SISTEMA COMPLETO
// ========== CONFIGURAÇÕES GLOBAIS ==========
window.recursosData = [];

// ========== INTEGRAÇÃO COM API PYTHON ==========
async function fazerLoginAPI(username, senha) {
    try {
        console.log(`Tentando login para: ${username}`);
        
        const resposta = await fetch('http://localhost:5002/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, senha })
        });
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            console.log('Login realizado com sucesso');
            
            localStorage.setItem('token', dados.session_id);
            localStorage.setItem('usuario', JSON.stringify(dados.usuario));
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userName', dados.usuario.nome);
            localStorage.setItem('userType', dados.usuario.tipo);
            localStorage.setItem('userUsername', username);
            
            return { sucesso: true, usuario: dados.usuario };
        } else {
            console.log('Login falhou:', dados.erro);
            return { sucesso: false, erro: dados.erro };
        }
    } catch (erro) {
        console.error('Erro na API:', erro);
        return { sucesso: false, erro: 'Erro de conexão com o servidor' };
    }
}

async function buscarRecursosAPI(filtros = {}) {
    try {
        console.log('Buscando recursos da API...');
        
        let url = 'http://localhost:5002/api/recursos';
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            console.log(dados.recursos.length + ' recursos carregados');
            return { sucesso: true, recursos: dados.recursos, total: dados.total };
        } else {
            console.log('Erro ao buscar recursos:', dados.erro);
            return { sucesso: false, erro: dados.erro };
        }
    } catch (erro) {
        console.error('Erro ao buscar recursos:', erro);
        return { sucesso: false, erro: 'Erro de conexão com o servidor' };
    }
}

async function criarRecursoAPI(dadosRecurso) {
    try {
        console.log('Criando novo recurso:', dadosRecurso.nome);
        
        const resposta = await fetch('http://localhost:5002/api/recursos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify(dadosRecurso)
        });
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            console.log('Recurso criado com sucesso:', dados.recurso.nome);
            return { sucesso: true, recurso: dados.recurso, mensagem: dados.mensagem };
        } else {
            console.log('Erro ao criar recurso:', dados.erro);
            return { sucesso: false, erro: dados.erro };
        }
    } catch (erro) {
        console.error('Erro ao criar recurso:', erro);
        return { sucesso: false, erro: 'Erro de conexão com o servidor' };
    }
}

async function atualizarRecursoAPI(recursoId, dadosAtualizacao) {
    try {
        console.log(`Atualizando recurso ID: ${recursoId}`);
        
        const resposta = await fetch(`http://localhost:5002/api/recursos/${recursoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify(dadosAtualizacao)
        });
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            console.log('Recurso atualizado com sucesso');
            return { sucesso: true, recurso: dados.recurso, mensagem: dados.mensagem };
        } else {
            console.log('Erro ao atualizar recurso:', dados.erro);
            return { sucesso: false, erro: dados.erro };
        }
    } catch (erro) {
        console.error('Erro ao atualizar recurso:', erro);
        return { sucesso: false, erro: 'Erro de conexão' };
    }
}

async function excluirRecursoAPI(recursoId) {
    try {
        console.log(`Excluindo recurso ID: ${recursoId}`);
        
        const resposta = await fetch(`http://localhost:5002/api/recursos/${recursoId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            console.log('Recurso excluído com sucesso');
            return { sucesso: true, mensagem: dados.mensagem };
        } else {
            console.log('Erro ao excluir recurso:', dados.erro);
            return { sucesso: false, erro: dados.erro };
        }
    } catch (erro) {
        console.error('Erro ao excluir recurso:', erro);
        return { sucesso: false, erro: 'Erro de conexão' };
    }
}

// ========== FUNÇÃO PARA RENDERIZAR TABELA ==========
window.renderResourcesTable = function(recursos) {
    const tableBody = document.getElementById('resourcesTableBody');
    if (!tableBody) return;
    
    console.log(`Renderizando ${recursos.length} recursos na tabela`);
    
    tableBody.innerHTML = '';
    
    if (recursos.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--wayne-gray-light);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    <h4>Nenhum recurso encontrado</h4>
                    <p>Tente ajustar os filtros ou adicionar novos recursos</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const userType = localStorage.getItem('userType');
    const isAdmin = userType === 'admin';
    
    recursos.forEach(recurso => {
        const row = document.createElement('tr');
        
        let statusClass = '';
        let statusIcon = '';
        let statusText = '';
        
        switch(recurso.status) {
            case 'ativo':
                statusClass = 'status-active';
                statusIcon = 'fas fa-check-circle';
                statusText = 'Ativo';
                break;
            case 'manutencao':
                statusClass = 'status-maintenance';
                statusIcon = 'fas fa-tools';
                statusText = 'Manutenção';
                break;
            case 'inativo':
                statusClass = 'status-inactive';
                statusIcon = 'fas fa-times-circle';
                statusText = 'Inativo';
                break;
            default:
                statusClass = 'status-unknown';
                statusIcon = 'fas fa-question-circle';
                statusText = 'Desconhecido';
        }
        
        const ultimaInspecao = recurso.ultima_manutencao || recurso.data_cadastro || 'N/A';
        
        const tipoTraduzido = {
            'equipamento': 'Equipamento',
            'veiculo': 'Veículo',
            'dispositivo': 'Dispositivo',
            'tecnologia': 'Tecnologia'
        }[recurso.tipo] || recurso.tipo;
        
        row.innerHTML = `
            <td>#${recurso.id}</td>
            <td>
                <strong>${recurso.nome}</strong>
                ${recurso.descricao ? `<br><small style="color: var(--wayne-gray-light); display: block; margin-top: 5px;">${recurso.descricao}</small>` : ''}
            </td>
            <td><span class="resource-type">${tipoTraduzido}</span></td>
            <td>${recurso.localizacao}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="${statusIcon}"></i> ${statusText}
                </span>
            </td>
            <td>${ultimaInspecao}</td>
            <td class="actions-cell">
                ${isAdmin ? `
                <button class="btn-action edit" onclick="abrirModalEditar(${recurso.id})" title="Editar recurso">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-action delete" onclick="confirmarExclusao(${recurso.id}, '${recurso.nome.replace(/'/g, "\\'")}')" title="Excluir recurso">
                    <i class="fas fa-trash"></i> Excluir
                </button>
                ` : `
                <span style="color: var(--wayne-gray-light); font-size: 0.9rem;">
                    Apenas para administradores
                </span>
                `}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    console.log('Tabela renderizada com sucesso');
};

// ========== FUNÇÕES PARA AÇÕES ==========
async function abrirModalEditar(recursoId) {
    if (!verificarAdmin()) return;
    
    // Procura o recurso na lista de dados já carregados
    const recurso = window.recursosData.find(r => r.id === recursoId);
    if (!recurso) {
        alert('Recurso não encontrado');
        return;
    }
    
    // Remove qualquer modal de edição anterior
    fecharModalEditar();
    
    console.log(`Abrindo modal para editar recurso: ${recurso.nome}`);
    
    const modalHTML = `
        <div id="editModal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Editar Recurso</h2>
                    <span class="close-modal" onclick="fecharModalEditar()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editResourceForm">
                        <input type="hidden" id="editResourceId" value="${recurso.id}">
                        <div class="form-group">
                            <label for="editResourceName">Nome do Recurso:</label>
                            <input type="text" id="editResourceName" value="${recurso.nome.replace(/"/g, '&quot;')}" required>
                        </div>
                        <div class="form-group">
                            <label for="editResourceType">Tipo:</label>
                            <select id="editResourceType" required>
                                <option value="equipamento" ${recurso.tipo === 'equipamento' ? 'selected' : ''}>Equipamento</option>
                                <option value="veiculo" ${recurso.tipo === 'veiculo' ? 'selected' : ''}>Veículo</option>
                                <option value="dispositivo" ${recurso.tipo === 'dispositivo' ? 'selected' : ''}>Dispositivo</option>
                                <option value="tecnologia" ${recurso.tipo === 'tecnologia' ? 'selected' : ''}>Tecnologia</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editResourceLocation">Localização:</label>
                            <input type="text" id="editResourceLocation" value="${recurso.localizacao.replace(/"/g, '&quot;')}" required>
                        </div>
                        <div class="form-group">
                            <label for="editResourceDescription">Descrição:</label>
                            <textarea id="editResourceDescription" rows="3">${recurso.descricao || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="editResourceStatus">Status:</label>
                            <select id="editResourceStatus" required>
                                <option value="ativo" ${recurso.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                                <option value="manutencao" ${recurso.status === 'manutencao' ? 'selected' : ''}>Em Manutenção</option>
                                <option value="inativo" ${recurso.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editResourceCategory">Categoria:</label>
                            <input type="text" id="editResourceCategory" value="${recurso.categoria || 'Equipamento'}">
                        </div>
                        <div class="form-group">
                            <label for="editResourceResponsavel">Responsável:</label>
                            <input type="text" id="editResourceResponsavel" value="${recurso.responsavel || ''}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Salvar Alterações
                            </button>
                            <button type="button" class="btn-secondary" onclick="fecharModalEditar()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Adiciona o modal ao corpo do documento
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Adiciona o listener de submit APÓS o modal ser injetado
    document.getElementById('editResourceForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        // Usa o ID do campo hidden para garantir o ID correto
        const id = parseInt(document.getElementById('editResourceId').value); 
        await salvarEdicaoRecurso(id);
    });
}

async function salvarEdicaoRecurso(recursoId) {
    try {
        const dadosAtualizacao = {
            nome: document.getElementById('editResourceName').value,
            tipo: document.getElementById('editResourceType').value,
            localizacao: document.getElementById('editResourceLocation').value,
            descricao: document.getElementById('editResourceDescription').value,
            status: document.getElementById('editResourceStatus').value,
            categoria: document.getElementById('editResourceCategory').value,
            responsavel: document.getElementById('editResourceResponsavel').value
        };
        
        // Remove campos vazios se for o caso
        Object.keys(dadosAtualizacao).forEach(key => dadosAtualizacao[key] === '' && delete dadosAtualizacao[key]);
        
        console.log(`Dados de atualização para ID ${recursoId}:`, dadosAtualizacao);
        
        const resultado = await atualizarRecursoAPI(recursoId, dadosAtualizacao);
        
        if (resultado.sucesso) {
            alert('Recurso atualizado com sucesso');
            fecharModalEditar();
            // Recarrega os dados após a edição
            await carregarRecursosDaAPI(); 
        } else {
            alert('Erro: ' + resultado.erro);
        }
    } catch (erro) {
        console.error('Erro ao salvar edição:', erro);
        alert('Erro ao salvar alterações');
    }
}

function fecharModalEditar() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
}

async function confirmarExclusao(recursoId, nomeRecurso) {
    if (!verificarAdmin()) return;
    
    if (confirm('Tem certeza que deseja excluir o recurso "' + nomeRecurso + '"?\n\nEsta ação não pode ser desfeita.')) {
        const resultado = await excluirRecursoAPI(recursoId);
        
        if (resultado.sucesso) {
            alert('Recurso excluído com sucesso');
            // Recarrega os dados após a exclusão
            await carregarRecursosDaAPI(); 
        } else {
            alert('Erro: ' + resultado.erro);
        }
    }
}

function verificarAdmin() {
    const userType = localStorage.getItem('userType');
    const isAdmin = userType === 'admin';
    
    if (!isAdmin) {
        // Alerta não-administradores, mas não impede a função de retornar false
        alert('Apenas administradores podem realizar esta ação'); 
        return false;
    }
    
    return true;
}

// ========== GESTÃO DE RECURSOS ==========
async function carregarRecursosDaAPI() {
    console.log('Carregando recursos da API...');
    
    const dados = await buscarRecursosAPI();
    
    if (dados.sucesso) {
        window.recursosData = dados.recursos || [];
        
        console.log(dados.recursos.length + ' recursos carregados');
        
        if (typeof window.renderResourcesTable === 'function') {
            window.renderResourcesTable(window.recursosData);
        }
        
        if (document.getElementById('resourcesCount')) {
            document.getElementById('resourcesCount').textContent = dados.total || 0;
        }
        
        atualizarEstatisticasRecursos();
    } else {
        console.error('Erro ao carregar recursos:', dados.erro);
    }
}

function atualizarEstatisticasRecursos() {
    if (!window.recursosData || window.recursosData.length === 0) return;
    
    const equipamentos = window.recursosData.filter(r => r.tipo === 'equipamento').length;
    const veiculos = window.recursosData.filter(r => r.tipo === 'veiculo').length;
    const dispositivos = window.recursosData.filter(r => r.tipo === 'dispositivo').length;
    
    const equipamentoCount = document.querySelector('.stat-card-large:nth-child(1) .stat-value-large');
    const veiculoCount = document.querySelector('.stat-card-large:nth-child(2) .stat-value-large');
    const dispositivoCount = document.querySelector('.stat-card-large:nth-child(3) .stat-value-large');
    
    if (equipamentoCount) equipamentoCount.textContent = equipamentos;
    if (veiculoCount) veiculoCount.textContent = veiculos;
    if (dispositivoCount) dispositivoCount.textContent = dispositivos;
}

// ========== FILTROS ==========
function aplicarFiltros() {
    const tipo = document.getElementById('resourceType')?.value;
    const status = document.getElementById('resourceStatus')?.value;
    const busca = document.getElementById('searchResource')?.value;
    
    const filtros = {};
    if (tipo) filtros.tipo = tipo;
    if (status) filtros.status = status;
    if (busca) filtros.busca = busca;
    
    carregarRecursosDaAPI();
}

// ========== MODAL DE ADICIONAR RECURSO ==========
function configurarModalRecurso() {
    const modal = document.getElementById('resourceModal');
    const addResourceBtn = document.getElementById('addResourceBtn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const resourceForm = document.getElementById('resourceForm');
    
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', function() {
            if (!verificarAdmin()) return;
            if (modal) modal.style.display = 'flex';
        });
    }
    
    if (closeModalBtns) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (modal) modal.style.display = 'none';
            });
        });
    }
    
    if (modal) {
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    if (resourceForm) {
        resourceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!verificarAdmin()) {
                modal.style.display = 'none';
                return;
            }
            
            const dadosRecurso = {
                nome: document.getElementById('resourceName').value,
                tipo: document.getElementById('resourceTypeSelect').value,
                descricao: document.getElementById('resourceDescription').value,
                localizacao: document.getElementById('resourceLocation').value,
                status: document.getElementById('resourceStatusSelect').value,
                categoria: 'Equipamento',
                responsavel: localStorage.getItem('userName') || 'Sistema'
            };
            
            console.log('Criando novo recurso:', dadosRecurso.nome);
            
            const resultado = await criarRecursoAPI(dadosRecurso);
            
            if (resultado.sucesso) {
                alert('Recurso criado com sucesso');
                
                if (modal) modal.style.display = 'none';
                resourceForm.reset();
                
                await carregarRecursosDaAPI();
            } else {
                alert('Erro: ' + resultado.erro);
            }
        });
    }
}

// ========== SISTEMA DE LOGIN ==========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;
        
        const resultado = await fazerLoginAPI(username, password);
        
        if (resultado.sucesso) {
            if (userType && resultado.usuario.tipo !== userType) {
                alert('Tipo de usuário incorreto. Você é um ' + resultado.usuario.tipo + '.');
                return;
            }
            
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userName', resultado.usuario.nome);
            localStorage.setItem('userType', resultado.usuario.tipo);
            localStorage.setItem('userUsername', username);
            
            console.log('Login realizado como: ' + resultado.usuario.tipo);
            
            window.location.href = 'dashboard.html';
        } else {
            alert('Erro no login: ' + (resultado.erro || 'Credenciais inválidas'));
        }
    });
}

// ========== LOGOUT ==========
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema das Indústrias Wayne inicializando...');
    
    if (window.location.pathname.includes('recursos.html')) {
        console.log('Página de recursos detectada');
        
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', aplicarFiltros);
        }
        
        const searchInput = document.getElementById('searchResource');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    aplicarFiltros();
                }
            });
        }
        
        configurarModalRecurso();
        
        setTimeout(() => {
            carregarRecursosDaAPI();
        }, 500);
    }
    
    if (localStorage.getItem('userLoggedIn')) {
        const userInfoElements = document.querySelectorAll('#userInfo');
        userInfoElements.forEach(element => {
            element.textContent = localStorage.getItem('userName') + ' (' + localStorage.getItem('userType') + ')';
        });
        
        console.log('Usuário logado: ' + localStorage.getItem('userName'));
    }
});

// ========== VERIFICAÇÃO DE SEGURANÇA ==========
const protectedPages = ['dashboard.html', 'recursos.html'];
const currentPage = window.location.pathname.split('/').pop();

if (protectedPages.includes(currentPage) && !localStorage.getItem('userLoggedIn')) {
    console.log('Usuário não autenticado, redirecionando...');
    window.location.href = 'login.html';
}

console.log('script.js carregado com sucesso');