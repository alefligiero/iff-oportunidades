# Plataforma - Agência de Oportunidades IFF Itaperuna

Plataforma Full-Stack para a Agência de Oportunidades do IFF Itaperuna. Desenvolvida com Next.js, a aplicação gerencia de forma integrada o ciclo de vida dos estágios e a publicação de vagas, unindo frontend e backend em um único projeto.

---

## 📋 Índice

* [Sobre o Projeto](#-sobre-o-projeto)
* [🚀 Tecnologias Utilizadas](#-tecnologias-utilizadas)
* [⚙️ Como Começar](#️-como-começar)
    * [Pré-requisitos](#pré-requisitos)
    * [Instalação](#instalação)
* [▶️ Rodando a Aplicação](#️-rodando-a-aplicação)

---

## 📖 Sobre o Projeto

Este projeto é uma aplicação web completa, desenvolvida com **Next.js**, para a **Agência de Oportunidades do IFF Itaperuna**. O objetivo é digitalizar e automatizar todo o processo de gestão de estágios, desde a formalização até a conclusão, além de servir como um portal de vagas para alunos e egressos.

A arquitetura Full-Stack do Next.js permite que o **Frontend (React)** e o **Backend (API Routes)** coexistam no mesmo projeto, proporcionando um desenvolvimento mais ágil e uma performance otimizada através de Server Components e Server Actions.

---

## 🚀 Tecnologias Utilizadas

O projeto foi desenvolvido utilizando as seguintes tecnologias:

* [**Next.js**](https://nextjs.org/) (v15) - Framework Full-Stack React.
* [**React.js**](https://react.dev/) - Biblioteca para a construção da interface de usuário.
* [**TypeScript**](https://www.typescriptlang.org/) - Superset do JavaScript que adiciona tipagem estática.
* [**Tailwind CSS**](https://tailwindcss.com/) - Framework de estilização CSS.
* [**Prisma**](https://www.prisma.io/) - ORM para Node.js e TypeScript.
* [**PostgreSQL**](https://www.postgresql.org/) - Banco de dados relacional.
* [**Zod**](https://zod.dev/) - Biblioteca para validação de schemas e dados.
* [**Bcrypt**](https://www.npmjs.com/package/bcrypt) - Para hashing de senhas.
* [**JOSE**](https://github.com/panva/jose) - Para manipulação de JSON Web Tokens (JWT).

---

## ⚙️ Como Começar

Siga as instruções abaixo para configurar e rodar o projeto em seu ambiente local para desenvolvimento ou servidor de produção.

### Pré-requisitos

Para rodar o projeto de forma eficiente:

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados no seu sistema
- [Git](https://git-scm.com/)

*(Para desenvolvimento, também é necessário ter o [Node.js](https://nodejs.org/en/) v18.18+ ou v20+ e npm instalados).*

---

### 🛠️ Ambiente de Desenvolvimento

Para desenvolvimento, recomenda-se rodar apenas o banco de dados via Docker e o servidor Web diretamente no Node.js local.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/SEU-USUARIO/iff-oportunidades.git
    cd iff-oportunidades
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Copie os exemplos e ajuste conforme necessário:
    ```bash
    cp .env.example .env
    cp .env.db.example .env.db
    ```

4.  **Suba apenas o banco de dados no Docker:**
    ```bash
    docker compose up db -d
    ```

5.  **Execute as migrações e (opcionalmente) popule os dados de exemplo:**
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

6.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:3000`.

---

### 🚀 Ambiente de Produção (Docker)

O projeto está totalmente dockerizado. Em produção, você sobe **toda a aplicação** (banco de dados e sistema web) via Docker. O próprio contêiner da aplicação aplica as migrações no banco e cria o usuário Admin inicial automaticamente no startup.

1.  **Clone o repositório no servidor:**
    ```bash
    git clone https://github.com/SEU-USUARIO/iff-oportunidades.git
    cd iff-oportunidades
    ```

2.  **Configure as variáveis de ambiente:**
    ```bash
    cp .env.example .env
    cp .env.db.example .env.db
    ```
    - No arquivo `.env`, é **obrigatório** definir:
      - `JWT_SECRET` com um valor forte e imprevisível.
      - `ADMIN_BOOTSTRAP_EMAIL` e `ADMIN_BOOTSTRAP_PASSWORD` para a criação automática da primeira conta de admin na inicialização.
    - No `.env.db`, altere as credenciais padrão de banco de dados (também reflita as mudanças na `DATABASE_URL` do seu `.env`).

3.  **Suba os contêineres e realize a build da imagem da aplicação:**
    ```bash
    docker compose up -d --build
    ```
    
Pronto! A aplicação estará disponível na porta `3000`. A infraestrutura do Docker tratará de executar o `prisma migrate deploy` e popular o admin automaticamente através do `entrypoint.sh`.

---

### 🔐 Usuários de teste (seed)

Se você rodou o seed, os usuários a seguir foram criados:

- Admin: definido por `ADMIN_SEED_EMAIL` (senha definida por `ADMIN_SEED_PASSWORD`)
- Estudante 1: `joao.silva@estudante.iff.edu.br`
- Estudante 2: `maria.oliveira@estudante.iff.edu.br`
- Empresa 1: `rh@techcorp.com.br`
- Empresa 2: `contato@inovadata.com.br`

Obs.: Estudantes e empresas do seed permanecem com senha padrão `123456`.

Obs.: Em produção, prefira `npm run admin:bootstrap` para criar o Admin inicial sem depender do seed.

Obs.: O cookie `auth_token` é usado na autenticação e o middleware protege rotas `/api/*` (exceto `/api/auth/*`) e `/dashboard/*`. Certifique-se de definir `JWT_SECRET` no `.env`.