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

* [**Next.js**](https://nextjs.org/) (v14+) - Framework Full-Stack React.
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

* [Node.js](https://nodejs.org/en/) (v18.17 ou superior)
* [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
* Uma instância do **PostgreSQL** rodando.
* [Git](https://git-scm.com/)

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
    * Crie arquivo `.env`.
    * Abra o arquivo `.env` e configure as variáveis:
    ```env
    DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"
    JWT_SECRET="SUA_CHAVE_SECRETA_AQUI"
    ```

4.  **Execute as migrações do banco de dados:**
    ```bash
    npx prisma migrate dev
    ```

---

## ▶️ Rodando a Aplicação

Para iniciar o servidor de desenvolvimento, que servirá tanto o frontend quanto a API, execute o comando:
```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:3000`.