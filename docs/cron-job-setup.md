# Cron Jobs para Gestão Automática de Estágios

## O que são?

Cron jobs automatizados que gerenciam o ciclo de vida dos estágios:
1. **Início automático**: Inicia estágios aprovados quando a data de início chega
2. **Finalização automática**: Finaliza estágios em andamento quando a data de fim chega ou quando encerramento precoce é aprovado

## Como funcionam?

### 1. Rota API: `/api/cron/start-internships`

Esta rota **inicia estágios**:
- Busca todos os estágios com status `APPROVED` cuja `startDate <= hoje`
- Para cada um, verifica se os documentos necessários estão aprovados:
  - `SIGNED_CONTRACT` (TCE + PAE assinados)
  - `LIFE_INSURANCE` (Comprovante de Seguro)
- Se ambos estiverem aprovados, atualiza o status para `IN_PROGRESS`

### 2. Rota API: `/api/cron/finish-internships`

Esta rota **finaliza estágios**:
- Busca todos os estágios com status `IN_PROGRESS` que atendem uma das condições:
  - `endDate <= hoje` (data de término chegou)
  - `earlyTerminationApproved = true` (encerramento precoce aprovado pelo admin)
- Atualiza o status para `FINISHED`
- Quando finalizado, o sistema libera automaticamente o envio dos documentos finais (TRE e RFE)

### 3. Agendamento

**No Vercel** (configurado em `vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/start-internships",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/finish-internships",
      "schedule": "0 7 * * *"
    }
  ]
}
```

- **Início**: Executa **todos os dias às 6h da manhã** (horário UTC)
- **Finalização**: Executa **todos os dias às 7h da manhã** (horário UTC)

**Em outros ambientes**:
Use um serviço externo de cron como:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- Ou configure um cron job no servidor Linux

Exemplo de configuração cron (Linux):
```bash
# Iniciar estágios às 6h
0 6 * * * curl -H "Authorization: Bearer SEU_SECRET_AQUI" https://seu-dominio.com/api/cron/start-internships

# Finalizar estágios às 7h
0 7 * * * curl -H "Authorization: Bearer SEU_SECRET_AQUI" https://seu-dominio.com/api/cron/finish-internships
```

### 4. Segurança

Para proteger as rotas em produção, adicione ao `.env`:
```
CRON_SECRET=seu-token-secreto-aleatorio-aqui
```

E chame as rotas com:
```bash
curl -H "Authorization: Bearer SEU_SECRET" https://seu-dominio.com/api/cron/start-internships
curl -H "Authorization: Bearer SEU_SECRET" https://seu-dominio.com/api/cron/finish-internships
```

Se `CRON_SECRET` não estiver definido, as rotas serão públicas (use apenas em desenvolvimento).

## Testando localmente

Para testar manualmente:

```bash
# Testar início de estágios
curl http://localhost:3000/api/cron/start-internships

# Testar finalização de estágios
curl http://localhost:3000/api/cron/finish-internships
```

Ou com autenticação:
```bash
curl -H "Authorization: Bearer SEU_SECRET" http://localhost:3000/api/cron/start-internships
curl -H "Authorization: Bearer SEU_SECRET" http://localhost:3000/api/cron/finish-internships
```

## Logs

### Start Internships
```json
{
  "success": true,
  "data": {
    "message": "X estágio(s) iniciado(s) automaticamente",
    "internships": ["id1", "id2"],
    "checkedCount": 10
  }
}
```

### Finish Internships
```json
{
  "success": true,
  "data": {
    "message": "X estágio(s) finalizado(s) automaticamente",
    "internships": ["id1", "id2"],
    "checkedCount": 5
  }
}
```

Onde:
- `internships`: IDs dos estágios que foram processados
- `checkedCount`: Total de estágios verificados

## Fluxo de Documentos Finais

Quando um estágio é finalizado (automaticamente ou manualmente):

1. **Status muda para `FINISHED`**
2. **Interface do aluno mostra box "Documentos Finais"**:
   - Botões para download dos templates (TRE e RFE)
   - Campos para upload dos documentos preenchidos
   - Orientações sobre assinaturas necessárias

3. **Documentos requeridos**:
   - **TRE (Termo de Realização)**: Assinado pela empresa
   - **RFE (Relatório Final)**: Produzido com Supervisor e Professor-Orientador

4. **Após aprovação pelo admin**:
   - Aluno recebe Declaração de Realização de Estágio

## Alternativa: Verificação no login

Se não quiser usar cron jobs, você pode verificar manualmente toda vez que o admin faz login ou acessa uma página específica. Mas os cron jobs são a melhor prática para garantir que estágios sejam iniciados e finalizados pontualmente.
