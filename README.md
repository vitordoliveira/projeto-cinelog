# CineLog

## 🎓 Projeto Acadêmico

CineLog é uma aplicação web para amantes de cinema catalogarem, avaliarem e compartilharem suas opiniões sobre filmes. Desenvolvida como projeto acadêmico para a disciplina de **Desenvolvimento Web 2** do **Professor Renan Cavichi** no curso de **Análise e Desenvolvimento de Sistemas do IFSP**.

Inspirado na plataforma [Letterboxd](https://letterboxd.com/), o CineLog permite que usuários criem uma coleção pessoal de filmes assistidos, atribuam notas, escrevam comentários e vejam avaliações de outros usuários, porém com sua própria identidade e características adaptadas ao contexto acadêmico.

## 🗂️ Estrutura do Projeto
Este repositório utiliza uma estrutura de monorepo contendo:

- `/backend` - API REST construída com Node.js, Express e Prisma
- `/frontend` - Interface de usuário construída com HTML, CSS e JavaScript Vanilla

## 🚀 Como Executar o Projeto

### Backend
```bash
# Entrar na pasta backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar migrações do banco de dados
npx prisma migrate dev

# Iniciar o servidor
npm start
```

### Frontend
```bash
# Entrar na pasta frontend
cd frontend

# Abrir o arquivo index.html em seu navegador
# ou utilizar uma extensão como Live Server no VS Code
```

## ✨ Funcionalidades Principais
### Para Usuários
- **Conta e Perfil**: Registro, login e personalização com avatar
- **Gerenciamento de Filmes**: Adicionar, editar e visualizar detalhes de filmes
- **Sistema de Avaliação**: Atribuir notas de 1 a 5 estrelas e escrever comentários
- **Interação Social**: Ver avaliações de outros usuários

### Para Administradores
- **Painel de Controle**: Visão geral das atividades na plataforma
- **Gestão de Usuários**: Promover, rebaixar ou banir usuários
- **Moderação de Conteúdo**: Revisar e remover avaliações inadequadas
- **Catálogo de Filmes**: Gerenciar a base de filmes disponíveis
- **Estatísticas**: Acompanhar métricas de uso da plataforma

## 🛠️ Tecnologias Utilizadas
### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Design responsivo com CSS Grid e Flexbox
- FontAwesome para ícones
- JavaScript Vanilla para interatividade e manipulação do DOM

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL (banco de dados)
- Bcrypt (hash de senhas)
- JSON Web Token (autenticação)

### Serviços Externos
- Cloudinary (armazenamento de imagens)

## 🔍 Características Técnicas
- **Design Responsivo**: Interface adaptada para dispositivos móveis e desktop
- **Tema Escuro**: Design elegante e agradável para os olhos
- **Segurança**: Proteção de senhas e validação de dados
- **Performance**: Carregamento otimizado de imagens via Cloudinary
- **Feedback Visual**: Notificações e indicadores de carregamento
- **Compatibilidade**: Suporte aos principais navegadores
- **Acessibilidade**: Elementos básicos de acessibilidade implementados

## 👨‍💻 Autor
Vitor de Oliveira


