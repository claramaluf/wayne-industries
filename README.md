# 🦇 Wayne Industries – Sistema de Gerenciamento de Segurança  
Aplicação Full Stack desenvolvida como projeto final do curso **Dev Full Stack – Infinity School**, simulando uma plataforma interna usada pelas Indústrias Wayne para controle de acesso, monitoramento, inventário e segurança de suas operações.

O sistema foi implementado utilizando **HTML, CSS e JavaScript no frontend**, integrado a uma **API Python (Flask)** que simula um banco de dados em memória, permitindo operações completas de login, gerenciamento de recursos e uso de permissões baseadas em perfil.

---

## Sumário
- [Visão Geral](#visão-geral)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Arquitetura da Aplicação](#arquitetura-da-aplicação)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Instalação e Execução](#instalação-e-execução)
  - [1. Backend (API Flask)](#1-backend-api-flask)
  - [2. Frontend](#2-frontend)
- [Fluxo de Autenticação e Permissões](#fluxo-de-autenticação-e-permissões)
- [Endpoints da API](#endpoints-da-api)
- [Modelos da Aplicação](#modelos-da-aplicação)
- [Autor](#autor)

---

## Visão Geral
As Indústrias Wayne necessitam de uma solução tecnológica robusta para gerenciar:

- Recursos físicos (equipamentos, veículos, dispositivos de segurança etc.)
- Controle de entrada e saída de funcionários
- Monitoramento do status das áreas da empresa
- Relatórios operacionais e alertas

Este sistema entrega:

✔ Dashboard inteligente  
✔ Gerenciamento de recursos com permissões de acesso  
✔ Login seguro baseado em papéis  
✔ API operante com CRUD completo  
✔ Interface moderna inspirada no universo Wayne Enterprises  

---

## Funcionalidades Principais

### **Autenticação e Permissões**
- Login via API Python  
- Sessão baseada em token  
- Perfis: `funcionario`, `gerente`, `admin`  
- Controle de acesso a botões, ações e rotas  

### **Dashboard Dinâmico**
- Gráfico de acessos por área  
- Distribuição de recursos  
- Cards de estatísticas  
- Últimas atividades  

### **Gerenciamento de Recursos**
- Listagem com filtros inteligentes  
- Criação de novos recursos (somente admin)  
- Editar/Excluir (somente admin)  
- Integração total com a API Flask  

### **Simulação de Banco de Dados**
- Tabelas em memória para:  
  - usuários  
  - recursos  
  - logs  
  - sessões  

---

## Arquitetura da Aplicação

Frontend (HTML, CSS, JS)
│
▼
API Flask (Python)
│
▼
Banco simulado em memória (listas Python)


- O frontend consome a API usando `fetch()`.
- O backend gerencia regras de negócio, autenticação, CRUD e logs.
- Permissões são validadas no frontend **e** backend.

---

## Tecnologias Utilizadas

### **Frontend**
- HTML5  
- CSS3 (tema escuro inspirado em Wayne Enterprises)  
- JavaScript ES6  
- Font Awesome  
- Google Fonts (Orbitron / Roboto)  
- Chart.js  

### **Backend**
- Python 3  
- Flask  
- Flask-CORS  

---

## Estrutura de Pastas

WAYNE-INDUSTRIES/
├── backend/
│ ├── app.py
│ └── requirements.txt
│
├── frontend/
│ ├── index.html
│ ├── login.html
│ ├── dashboard.html
│ ├── recursos.html
│ ├── styles.css
│ ├── script.js
│ └── img/
│ ├── LogoW.png
│ └── LogoWayne.png
│
└── README.md

---

## Instalação e Execução

---

# 1. Backend (API Flask)

### **Requisitos**
- Python 3.10+  
- Pip

### **Instalar dependências**

```bash
cd backend
pip install -r requirements.txt

▶ Executar API
python app.py

A API iniciará em:
http://localhost:5002

2. Frontend
O frontend é totalmente estático. Para abrir:

cd frontend

E abrir index.html no navegador.
O frontend automaticamente se comunica com:

http://localhost:5002/api

Fluxo de Autenticação e Permissões
Perfis disponíveis:

| Usuário     | Senha     | Tipo        |
| ----------- | --------- | ----------- |
| bruce.wayne | batman123 | admin       |
| lucius.fox  | wayne2025 | gerente     |
| funcionario | wayne123  | funcionario |

 Como funciona:

1. O usuário envia username e senha para /api/login

2. Backend valida e retorna:

    - session_id (token)

    - informações do usuário

3. Frontend salva no localStorage:

    - token

    - userType

4. Ao acessar páginas protegidas:

    - Dashboard e Recursos são bloqueados para não autenticados

5. Permissões:

    - Somente admin pode criar, editar e excluir recursos

    - Gerente e Funcionário possuem acesso restrito

 Endpoints da API

POST /api/login
Autenticação de usuário.

POST /api/logout
Encerra sessão.

GET /api/recursos
Lista recursos com filtros opcionais:
/api/recursos?tipo=veiculo&status=ativo&busca=bat

GET /api/recursos/<id>
Retorna um recurso específico.

POST /api/recursos
Cria novo recurso (somente admin).
Body:
{
  "nome": "Scanner XJ9",
  "tipo": "equipamento",
  "descricao": "Scanner avançado",
  "localizacao": "Entrada Leste",
  "status": "ativo"
}
