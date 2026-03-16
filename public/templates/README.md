# Templates de Documentos de Estágio

Esta pasta contém os modelos de documentos que os alunos podem baixar para preencher durante o processo de estágio.

## Arquivos Necessários

Para que o sistema funcione corretamente, você precisa adicionar os seguintes arquivos de template nesta pasta:

### 1. `tre-template.docx`
**Termo de Realização de Estágio (TRE)**
- Documento que deve ser preenchido e assinado pelo representante da Empresa Concedente
- Utilizado ao final do estágio para comprovar sua realização
- Este template será disponibilizado para download quando o estágio estiver com status `FINISHED`

### 2. `rfe-orientacoes.pdf`
**Relatório Final de Estágio - Orientações**
- Documento com instruções para elaboração do Relatório Final de Estágio (RFE)
- Deve orientar o aluno sobre como produzir o relatório em parceria com o Supervisor e Professor-Orientador
- Deve incluir informações sobre formatação, conteúdo esperado e assinaturas necessárias
- Este template será disponibilizado para download quando o estágio estiver com status `FINISHED`

### 3. `modelo-relatorio-periodico.docx`
**Modelo de Relatório Periódico de Estágio**
- Documento utilizado pelo aluno para elaboração dos relatórios periódicos
- O sistema prioriza este arquivo em formato DOCX para download
- Disponível conforme a janela de liberação de cada período (30 dias antes do vencimento)

### 4. `modelo-relatorio-periodico.pdf` (opcional)
**Fallback de compatibilidade**
- Se o arquivo DOCX não existir, o sistema tenta servir esta versão em PDF
- Recomendado manter enquanto houver usuários/processos legados

### 5. `termination-term-template.docx`
**Termo de Cancelamento de Estágio**
- Obrigatório quando o encerramento antecipado do estágio for aprovado
- Deve ser preenchido e assinado pelas partes responsáveis
- O aluno envia este documento junto com TRE e RFE para concluir o processo

### 6. `TCE PAE.docx`
**Modelo oficial de TCE/PAE para estágios aprovados**
- Documento fonte usado para manter a redação oficial do termo
- Utilizado como fonte única para gerar o DOCX preenchido e o PDF oficial
- Os placeholders devem permanecer em formato `<campo>` para compatibilidade com a geração backend

## Placeholders esperados no `TCE PAE.docx`

Para preenchimento automático fiel ao DOCX oficial, o modelo deve usar placeholders como texto simples no formato `<campo>`.

Campos suportados atualmente:

- `<empresa>`
- `<cnpj>`
- `<endereco empresa>`
- `<num empresa>`
- `<bairro empresa>`
- `<cidade/estado empresa>`
- `<cep empresa>`
- `<representante>`
- `<cargo/funcao>`
- `<nome do aluno>`
- `<endereco aluno>`
- `<num end aluno>`
- `<bairro aluno>`
- `<cidade/estado aluno>`
- `<cep aluno>`
- `<tel aluno>`
- `<email do aluno>`
- `<curso>`
- `<matricula aluno>`
- `<serie/período>`
- `<semestre letivo>`
- `<inicio>`
- `<final>`
- `<tipo estagio>`
- `<ch semanal>`
- `<jornada diaria>`
- `<valor bolsa>`
- `<valor aux transp>`
- `<seguradora>`
- `<cnpj seguradora>`
- `<apolice>`
- `<vig seguro>`
- `<orientador>`
- `<matricula orientador>`
- `<supervisor>`
- `<cargo supervisor>`
- `<setor estagio>`
- `<plano de atividades>`
- `<data emissao>`
- `<is_remote>` (flag booleana para condicional de modalidade remota)

Regras de preenchimento relevantes:

- `<cnpj>` e `<cnpj seguradora>`:
   - São enviados já formatados no padrão brasileiro (ex.: `12.345.678/0001-90`)
- `<valor aux transp>`:
   - Estágio presencial: valor monetário formatado (ex.: `120,00`)
   - Estágio remoto: texto fixo `( Estágio 100% Remoto )`
   - Não deixe `R$` fixo no DOCX antes de `<valor aux transp>`, pois em estágio remoto o campo recebe texto não monetário
- `<data emissao>`:
   - Usa a data de aprovação do estágio pelo Admin
   - Fallback para data atual apenas quando não houver data de aprovação registrada

## Bloco condicional para estágio remoto

Para exibir um trecho apenas quando o estágio for remoto, envolva o bloco com as tags de seção do template:

- `<#is_remote>`
- `</is_remote>`

Exemplo para o trecho de validação remota:

```text
<#is_remote>
Validação Estágio Remoto*
Declaro que as atividades descritas neste documento são compatíveis com o estágio remoto.
_____________________________________________
Coordenador do Curso
*Assinatura necessária apenas nos casos de estágio remoto
</is_remote>
```

Importante:

- Mantenha `<#is_remote>` e `</is_remote>` em linhas próprias (parágrafos separados) no Word/LibreOffice.
- Não coloque outros placeholders dentro do nome da tag de seção.
- Se o estágio não for remoto, o bloco inteiro será removido automaticamente.

Substitua os valores literais fixos do modelo, como `0` em matrículas, número da empresa e valor da bolsa, pelos placeholders acima para que o documento final seja preenchido integralmente.

## Como Adicionar os Templates

1. Coloque os arquivos de template nesta pasta (`/public/templates/`)
2. Certifique-se de usar exatamente os nomes especificados acima:
   - `tre-template.docx`
   - `rfe-orientacoes.pdf`
   - `modelo-relatorio-periodico.docx`
   - `modelo-relatorio-periodico.pdf` (opcional)
   - `termination-term-template.docx`
   - `TCE PAE.docx`
3. Os arquivos estarão automaticamente disponíveis em:
   - `/templates/tre-template.docx`
   - `/templates/rfe-orientacoes.pdf`
   - `/templates/termination-term-template.docx`

## Fluxo de Uso

1. **Estágio finalizado** (status = `FINISHED`):
   - Sistema mostra box "Documentos Finais de Estágio"
   - Aluno pode baixar os templates TRE e RFE
   - Se o encerramento antecipado foi aprovado, também baixa o Termo de Cancelamento
   
2. **Aluno preenche e coleta assinaturas**:
   - TRE: Assinado pela empresa
   - RFE: Produzido com Supervisor e Professor-Orientador
   
3. **Upload dos documentos preenchidos**:
   - Aluno envia TRE preenchido
   - Aluno envia RFE completo
   - Em encerramento antecipado aprovado, também envia o Termo de Cancelamento
   
4. **Aprovação pelo Admin**:
   - Admin analisa e aprova/rejeita os documentos
   - No fluxo padrão, após aprovação de TRE e RFE, processo é concluído
   - No fluxo de encerramento antecipado, também é necessária aprovação do Termo de Cancelamento

## Status Atual

⚠️ **Arquivos pendentes**: Os templates ainda não foram adicionados a esta pasta.

Quando você adicionar os templates, remova ou atualize este aviso.

---

**Última atualização**: 16 de março de 2026
