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

Siga as instruções abaixo para configurar e rodar o projeto em seu ambiente local.

### Pré-requisitos

Escolha uma das duas opções para o banco de dados:

- Com Docker (recomendado):
    - [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- Sem Docker:
    - Uma instância local do **PostgreSQL** rodando

Além disso:

- [Node.js](https://nodejs.org/en/) (v18.18+ ou v20+ recomendado)
- [npm](https://www.npmjs.com/) (ou Yarn/Pnpm, se preferir)
- [Git](https://git-scm.com/)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU-USUARIO/iff-oportunidades.git](https://github.com/SEU-USUARIO/iff-oportunidades.git)
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
        cp .env.db.example .env.db   # necessário apenas se for usar o Docker do Postgres
        ```
        - No `.env`, confirme:
            - `DATABASE_URL` apontando para seu Postgres (por padrão: localhost:5432)
            - `JWT_SECRET` com um valor não previsível em produção
            - `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` para o usuário Admin criado no seed

4.  **Suba o banco de dados (se usar Docker):**
    ```bash
    docker compose up -d
    ```

5.  **Execute as migrações do banco de dados:**
    ```bash
    npx prisma migrate dev
    ```

6.  **(Opcional, mas recomendado) Popular dados de exemplo:**
    ```bash
    npx prisma db seed
    ```

7.  **(Produção) Criar Admin inicial sem seed:**
    ```bash
    npm run admin:bootstrap
    ```
    Variáveis necessárias no ambiente:
    - `ADMIN_BOOTSTRAP_EMAIL`
    - `ADMIN_BOOTSTRAP_PASSWORD`
    - `ADMIN_BOOTSTRAP_FORCE_PASSWORD_UPDATE` (`true` para rotacionar senha de admin existente)

---

## ▶️ Rodando a Aplicação

Para iniciar o servidor de desenvolvimento, que servirá tanto o frontend quanto a API, execute o comando:
```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:3000`.

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