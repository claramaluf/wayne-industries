// ========== INTEGRAÇÃO COM API PYTHON ==========

async function fazerLoginAPI(username, senha) {
    try {
        const resposta = await fetch('http://localhost:5002/api/login', {
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
        
        const resposta = await fetch('http://localhost:5002/api/recursos', {
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

// ========== SISTEMA DE LOGIN ==========

const loginForm = document.getElementById('loginForm');
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
            
            // Salvar dados ESSENCIAIS
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userName', resultado.usuario.nome);
            localStorage.setItem('userType', resultado.usuario.tipo);
            localStorage.setItem('userUsername', username);
            
            console.log(`Login realizado como: ${resultado.usuario.tipo}`);
            
            // Redirecionar
            window.location.href = 'dashboard.html';
        } else {
            alert(`Erro no login: ${resultado.erro || 'Credenciais inválidas'}`);
        }
    });
}

// ========== CONTROLE DE PERMISSÕES ==========

function verificarPermissoesAdmin() {
    console.log('INICIANDO VERIFICAÇÃO DE PERMISSÕES');
    
    // 1. Pega tipo do usuário
    const userType = localStorage.getItem('userType');
    console.log('Tipo de usuário:', userType);
    
    // 2. Verifica se é admin (APENAS admin tem acesso)
    const isAdmin = userType === 'admin';
    console.log('É administrador?', isAdmin);
    
    // 3. Lista de tipos que NÃO podem ver gerenciamento
    const tiposSemAcesso = ['funcionario', 'gerente'];
    const naoPodeVer = tiposSemAcesso.includes(userType);
    
    // 4. Botões com data-admin-only
    const elementosAdmin = document.querySelectorAll('[data-admin-only]');
    console.log(`Encontrados ${elementosAdmin.length} elementos restritos`);
    
    elementosAdmin.forEach((elemento, index) => {
        console.log(`   Botão ${index + 1}: ${elemento.textContent.trim()}`);
        
        if (isAdmin) {
            elemento.style.display = 'flex';
            elemento.style.visibility = 'visible';
            elemento.style.opacity = '1';
            console.log(`      VISÍVEL (admin)`);
        } else {
            elemento.style.display = 'none';
            elemento.style.visibility = 'hidden';
            elemento.style.opacity = '0';
            console.log(`      OCULTO (${userType})`);
        }
    });
    
    // 5. Seção inteira de gerenciamento de recursos
    const secaoGerenciamento = document.querySelector('.resources-section');
    if (secaoGerenciamento && naoPodeVer) {
        secaoGerenciamento.style.display = 'none';
        console.log('Seção de gerenciamento OCULTA');
    }
    
    // 6. Esconder coluna "Ações" da tabela
    if (!isAdmin) {
        console.log('Ocultando coluna "Ações"...');
        
        // Cabeçalho "Ações"
        document.querySelectorAll('th').forEach(th => {
            if (th.textContent.includes('Ações') || th.textContent.includes('Ações') || th.textContent.includes('Açoes')) {
                th.style.display = 'none';
                console.log('   Cabeçalho "Ações" ocultado');
            }
        });
        
    // Última coluna de cada linha (células de ações)
    document.querySelectorAll('tbody tr').forEach((tr, index) => {
        const ultimaCelula = tr.lastElementChild;
        if (ultimaCelula) {
            ultimaCelula.style.display = 'none';
            if (index === 0) console.log('   Células de ações ocultadas');
        }
    });
        }
    
    // 7. Aviso para não-administradores (APENAS NA PÁGINA DE RECURSOS)
    const avisoAntigo = document.getElementById('avisoAdmin');
    if (avisoAntigo) avisoAntigo.remove();
    
    // Verificar se estamos na página de recursos
    const isRecursosPage = window.location.pathname.includes('recursos.html');
    
    if (!isAdmin && userType && isRecursosPage) {
        console.log('⚠️ Criando aviso de acesso restrito...');
        
        const aviso = document.createElement('div');
        aviso.id = 'avisoAdmin';
        aviso.style.cssText = `
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 20px 25px;
            margin: 25px 0;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 20px;
            font-size: 16px;
            border-left: 8px solid #c62828;
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
        `;
        
        aviso.innerHTML = `
            <i class="fas fa-ban" style="font-size: 28px;"></i>
            <div style="flex: 1;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                    ⚠️ ACESSO RESTRITO
                </div>
                <div>
                    Apenas <strong>ADMINISTRADORES</strong> podem gerenciar recursos.<br>
                    <small style="opacity: 0.9;">Seu tipo de usuário: <strong style="color: #ffcc00">${userType.toUpperCase()}</strong></small>
                </div>
            </div>
            <i class="fas fa-lock" style="font-size: 24px; opacity: 0.8;"></i>
        `;
        
        // Insere após o header
        const header = document.querySelector('.dashboard-header');
        if (header) {
            header.parentNode.insertBefore(aviso, header.nextSibling);
            console.log('   Aviso inserido na página de recursos');
        }
    } else if (!isAdmin && userType && !isRecursosPage) {
        console.log('Dashboard: Aviso de acesso restrito OMITIDO');
    }
    
    console.log('VERIFICAÇÃO CONCLUÍDA');
    return isAdmin;
}

// ========== LOGOUT ==========

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

// ========== VERIFICAÇÃO DE LOGIN E PERMISSÕES ==========

// Verificar se usuário está logado nas páginas protegidas
const protectedPages = ['dashboard.html', 'recursos.html'];
const currentPage = window.location.pathname.split('/').pop();

if (protectedPages.includes(currentPage)) {
    if (!localStorage.getItem('userLoggedIn')) {
        console.log('Usuário não logado, redirecionando...');
        window.location.href = 'login.html';
    } else {
        // Atualizar informações do usuário
        const userInfoElements = document.querySelectorAll('#userInfo');
        userInfoElements.forEach(element => {
            element.textContent = `${localStorage.getItem('userName')} (${localStorage.getItem('userType')})`;
        });
        
        console.log(`Usuário logado: ${localStorage.getItem('userName')} (${localStorage.getItem('userType')})`);
        
        // Verificar permissões de admin
    if (typeof verificarPermissoesAdmin === 'function') {
    verificarPermissoesAdmin();
    } else {
    console.error('Função verificarPermissoesAdmin não encontrada!');
       }
    }
}

// ========== GESTÃO DE RECURSOS ==========

// Função para carregar recursos da API
async function carregarRecursosDaAPI() {
    console.log('Carregando recursos da API...');
    
    const dados = await buscarRecursosAPI();
    
    if (dados.sucesso && window.renderResourcesTable) {
        // Atualizar a variável global de recursos
        window.recursosData = dados.recursos || [];
        
        console.log(`${window.recursosData.length} recursos carregados`);
        
        // Renderizar tabela
        renderResourcesTable(window.recursosData);
        
        // Atualizar contadores
        if (document.getElementById('resourcesCount')) {
            document.getElementById('resourcesCount').textContent = dados.total || 0;
        }
        
        // Após renderizar, verificar permissões novamente
        verificarPermissoesAdmin();
    }
}

// Chamar função quando página de recursos carregar
if (window.location.pathname.includes('recursos.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Página de recursos detectada');
        
        // Primeiro verifica permissões
        verificarPermissoesAdmin();

        // Depois carrega dados
        carregarRecursosDaAPI();
    });
}

// ========== MODAL DE ADICIONAR RECURSO ==========

const modal = document.getElementById('resourceModal');
const addResourceBtn = document.getElementById('addResourceBtn');
const closeModalBtns = document.querySelectorAll('.close-modal');
const resourceForm = document.getElementById('resourceForm');

// Abrir modal (apenas se usuário for admin)
if (addResourceBtn) {
    addResourceBtn.addEventListener('click', function() {
        // Verifica permissão antes de abrir
        const userType = localStorage.getItem('userType');
        if (userType !== 'admin') {
            alert('Apenas administradores podem adicionar recursos!');
            return;
        }
        
        if (modal) modal.style.display = 'flex';
    });
}

// Fechar modal
if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
        });
    });
}

// Fechar modal clicando fora
if (modal) {
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Formulário de recurso
if (resourceForm) {
    resourceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Verificar se usuário é admin
        const userType = localStorage.getItem('userType');
        if (userType !== 'admin') {
            alert('Apenas administradores podem criar recursos!');
            modal.style.display = 'none';
            return;
        }
        
        const dadosRecurso = {
            nome: document.getElementById('resourceName').value,
            tipo: document.getElementById('resourceTypeSelect').value,
            descricao: document.getElementById('resourceDescription').value,
            localizacao: document.getElementById('resourceLocation').value,
            status: document.getElementById('resourceStatusSelect').value,
            categoria: 'Equipamento'
        };
        
        console.log('Criando novo recurso:', dadosRecurso.nome);
        
        const resultado = await criarRecursoAPI(dadosRecurso);
        
        if (resultado.sucesso) {
            alert('✅ ' + resultado.mensagem);
            modal.style.display = 'none';
            resourceForm.reset();
            
            // Recarregar recursos
            await carregarRecursosDaAPI();
        } else {
            alert(`Erro: ${resultado.erro || 'Não foi possível criar o recurso'}`);
        }
    });
}

// ========== FUNÇÕES GLOBAIS PARA AÇÕES NA TABELA ==========

window.editResource = function(id) {
    // Verifica se é admin
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
        alert('Apenas administradores podem editar recursos!');
        return;
    }
    console.log(`Editando recurso ID: ${id}`);
    alert(`Editar recurso ID: ${id} (Funcionalidade em desenvolvimento)`);
};

window.deleteResource = function(id) {
    // Verifica se é admin
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
        alert('Apenas administradores podem excluir recursos!');
        return;
    }
    
    console.log(`Excluindo recurso ID: ${id}`);
    
    if (confirm('⚠️ Tem certeza que deseja remover este recurso?')) {
        const index = window.recursosData.findIndex(r => r.id === id);
        if (index > -1) {
            window.recursosData.splice(index, 1);
            
            // Se tiver função de renderização, atualiza
            if (typeof renderResourcesTable === 'function') {
                renderResourcesTable(window.recursosData);
            }
            
            alert('Recurso removido com sucesso!');
            console.log('Recurso removido');
        }
    }
};

// Adiciona classe admin ao body se for administrador
document.addEventListener('DOMContentLoaded', function() {
    const userType = localStorage.getItem('userType');
    if (userType === 'admin') {
        document.body.classList.add('admin');
    } else {
        document.body.classList.remove('admin');
    }
});

// ========== GRÁFICOS DO DASHBOARD ==========

function inicializarGraficosDashboard() {
    console.log('Inicializando gráficos do dashboard...');
    
    // 1. Gráfico de Barras - Acessos por Área
    const accessChartCanvas = document.getElementById('accessChart');
    if (accessChartCanvas) {
        console.log('Criando gráfico de acessos por área...');
        
        const ctx = accessChartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Torre Wayne', 'Laboratório', 'Armazém', 'Garagem', 'Sala de Controle', 'Área Técnica'],
                datasets: [{
                    label: 'Acessos nas últimas 24h',
                    data: [45, 28, 32, 19, 24, 15],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgb(54, 162, 235)',
                        'rgb(255, 99, 132)',
                        'rgb(75, 192, 192)',
                        'rgb(255, 206, 86)',
                        'rgb(153, 102, 255)',
                        'rgb(255, 159, 64)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Acessos'
                        },
                        ticks: {
                            stepSize: 10
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Áreas da Empresa'
                        }
                    }
                }
            }
        });
    }
    
    // 2. Gráfico de Pizza - Distribuição de Recursos
    const resourcesChartCanvas = document.getElementById('resourcesChart');
    if (resourcesChartCanvas) {
        console.log('Criando gráfico de distribuição de recursos...');
        
        const ctx2 = resourcesChartCanvas.getContext('2d');
        new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: ['Equipamentos', 'Veículos', 'Tecnologia', 'Ferramentas', 'Mobiliário', 'Segurança'],
                datasets: [{
                    label: 'Distribuição de Recursos',
                    data: [35, 20, 18, 12, 10, 5],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 206, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(153, 102, 255)',
                        'rgb(255, 159, 64)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    console.log('Gráficos do dashboard inicializados');
}

// ========== ATUALIZAÇÃO DE DADOS DO DASHBOARD ==========

async function atualizarDadosDashboard() {
    try {
        console.log('Atualizando dados do dashboard...');
        
        // Simular dados da API
        // Em produção, você faria chamadas reais à API
        const dadosDashboard = {
            sistema: 'Ativo',
            funcionarios: 247,
            alertas: 3,
            recursos: 156
        };
        
        // Atualizar os cards
        document.getElementById('systemStatus').textContent = dadosDashboard.sistema;
        document.getElementById('employeeCount').textContent = dadosDashboard.funcionarios;
        document.getElementById('alertsCount').textContent = dadosDashboard.alertas;
        document.getElementById('resourcesCount').textContent = dadosDashboard.recursos;
        
        console.log('Dados do dashboard atualizados');
    } catch (erro) {
        console.error('Erro ao atualizar dashboard:', erro);
    }
}

// ========== INICIALIZAÇÃO DO DASHBOARD ==========

if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Página do dashboard detectada');
        
        // Atualizar dados do dashboard
        atualizarDadosDashboard();
        
        // Inicializar gráficos
        inicializarGraficosDashboard();
        
        // Atualizar informações do usuário
        if (localStorage.getItem('userLoggedIn')) {
            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement) {
                userInfoElement.textContent = `${localStorage.getItem('userName')} (${localStorage.getItem('userType')})`;
            }
        }
    });
}

// Atualizar dados a cada 30 segundos (opcional)
if (window.location.pathname.includes('dashboard.html')) {
    setInterval(atualizarDadosDashboard, 30000); // 30 segundos
}

console.log('script.js carregado com sucesso!');