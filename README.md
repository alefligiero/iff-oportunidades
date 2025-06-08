# API - Agência de Oportunidades IFF Itaperuna

Backend da plataforma da Agência de Oportunidades do IFF Itaperuna. API desenvolvida com Next.js, TypeScript e Prisma para gerenciar o ciclo de vida dos estágios e a publicação de vagas por empresas parceiras.

## 📋 Índice

* [Sobre o Projeto](#-sobre-o-projeto)
* [🚀 Tecnologias Utilizadas](#-tecnologias-utilizadas)
* [⚙️ Como Começar](#️-como-começar)
    * [Pré-requisitos](#pré-requisitos)
    * [Instalação](#instalação)
* [▶️ Rodando a Aplicação](#️-rodando-a-aplicação)
* [🗺️ Endpoints da API](#️-endpoints-da-api)

## 📖 Sobre o Projeto

Este projeto consiste na API RESTful para o sistema web da **Agência de Oportunidades do IFF Itaperuna**. O objetivo é digitalizar e automatizar todo o processo de gestão de estágios, desde a formalização e acompanhamento dos documentos até a moderação e publicação de vagas.

A API é responsável por toda a lógica de negócio, incluindo:
* Autenticação e autorização de usuários (Alunos, Empresas e Administradores).
* Gerenciamento do fluxo de documentos de estágio.
* Moderação de conteúdo.
* Persistência de dados.

## 🚀 Tecnologias Utilizadas

O projeto foi desenvolvido utilizando as seguintes tecnologias:

* [**Next.js**](https://nextjs.org/) (v14+) - Framework React para o backend (via App Router e Route Handlers).
* [**TypeScript**](https://www.typescriptlang.org/) - Superset do JavaScript que adiciona tipagem estática.
* [**Prisma**](https://www.prisma.io/) - ORM para Node.js e TypeScript, facilitando o acesso ao banco de dados.
* [**PostgreSQL**](https://www.postgresql.org/) - Banco de dados relacional.
* [**Zod**](https://zod.dev/) - Biblioteca para validação de schemas e dados.
* [**Bcrypt**](https://www.npmjs.com/package/bcrypt) - Para hashing de senhas.
* [**JOSE**](https://github.com/panva/jose) - Para manipulação de JSON Web Tokens (JWT) em ambientes Edge (Middleware).

## ⚙️ Como Começar

Siga as instruções abaixo para configurar e rodar o projeto em seu ambiente local.

### Pré-requisitos

* [Node.js](https://nodejs.org/en/) (v18.17 ou superior)
* [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
* Uma instância do **PostgreSQL** rodando (localmente via Docker ou em um serviço na nuvem).
* [Git](https://git-scm.com/)

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SEU-USUARIO/iff-oportunidades-api.git](https://github.com/SEU-USUARIO/iff-oportunidades-api.git)
   cd iff-oportunidades-api
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   * Renomeie o arquivo `.env.example` (se existir) para `.env`.
   * Abra o arquivo `.env` e configure as variáveis:
   ```env
   # URL de conexão com o seu banco de dados PostgreSQL
   DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"

   # Chave secreta para assinar os tokens JWT (use um gerador de senhas seguras)
   JWT_SECRET="SUA_CHAVE_SECRETA_AQUI"
   ```

4. **Execute as migrações do banco de dados:**
   * Este comando irá criar as tabelas no seu banco de dados com base no `schema.prisma`.
   ```bash
   npx prisma migrate dev
   ```

## ▶️ Rodando a Aplicação

Para iniciar o servidor de desenvolvimento, execute o comando:

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`.

## 🗺️ Endpoints da API

Abaixo estão os endpoints já implementados e disponíveis para teste.

| Método | Rota                     | Descrição                                                                 | Protegido? |
| :----- | :----------------------- | :------------------------------------------------------------------------ | :--------- |
| `POST` | `/api/auth/register`     | Cadastra um novo usuário (Aluno ou Empresa) no sistema.                   | ❌ Não     |
| `POST` | `/api/auth/login`        | Autentica um usuário e retorna um token JWT.                              | ❌ Não     |
| `GET`  | `/api/profile`           | **(Temporário)** Endpoint de teste para verificar a autenticação via token. | ✅ Sim     |
