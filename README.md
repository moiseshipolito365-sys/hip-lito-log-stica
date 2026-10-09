# Hipólito Logística

Quero desenvolver um sistema chamado HipólitoLogística, voltado inicialmente para vendedores do Mercado Livre no Brasil.

O objetivo é criar uma plataforma que encontre, organize e gerencie produtos de fornecedores para facilitar a criação de anúncios e o controle de lucro de uma loja online.

IMPORTANTE: quero construir o sistema por etapas. Nesta primeira etapa, crie uma aplicação funcional, com banco de dados real, e não apenas uma demonstração visual com dados falsos.

1. Aparência e idioma

Toda a interface deve estar em português brasileiro.

Visual profissional, moderno, organizado e responsivo para computador e celular.

Menu lateral com as seções: Painel, Catálogo de Produtos, Fornecedores, Calculadora de Lucro, Anúncios e Configurações.

Nome da plataforma: HipólitoLogística.

Painel simples de usar, mesmo para quem não tem experiência técnica.

2. Painel principal

Mostrar:

Total de produtos cadastrados.

Quantidade de fornecedores.

Produtos disponíveis e indisponíveis.

Valor total estimado dos produtos cadastrados.

Margem de lucro estimada.

Atividades recentes.

Os indicadores devem usar dados reais do banco de dados, não números inventados.

3. Catálogo de produtos

Criar uma página funcional para cadastrar, visualizar, editar, pesquisar e excluir produtos.

Cada produto deve ter:

Nome e descrição.

Foto ou URL da imagem.

Categoria.

Nome do fornecedor.

Link original do produto no fornecedor.

Código ou SKU.

Custo de compra.

Preço de venda pretendido.

Quantidade em estoque, quando conhecida.

Disponibilidade do fornecedor.

Data da última atualização.

Observações.

Adicionar busca por nome ou SKU e filtros por categoria, fornecedor e disponibilidade.

Permitir cadastrar produtos manualmente e importar produtos por arquivo CSV. Validar os dados importados e mostrar erros antes de salvar.

4. Cadastro de fornecedores

Criar uma área para registrar fornecedores com:

Nome da empresa.

Site.

Link do catálogo ou produto.

Contato comercial.

Observações.

Status do fornecedor.

Permitir associar cada produto ao fornecedor correspondente.

5. Calculadora de lucro

Criar uma calculadora que permita informar:

Custo do produto.

Preço de venda.

Tarifa percentual do marketplace.

Tarifa fixa, se houver.

Frete pago pelo vendedor.

Embalagem e outros custos.

Impostos ou outros custos adicionais configuráveis.

Calcular automaticamente:

Lucro líquido estimado por venda.

Margem de lucro percentual.

Percentual de custos.

Preço de venda necessário para atingir uma margem desejada.

Não inventar tarifas atuais do Mercado Livre. Deixar os valores configuráveis e indicar que devem ser confirmados conforme a categoria, modalidade e condições reais da conta do vendedor.

6. Banco de dados e segurança

Utilize Supabase para banco de dados e autenticação, se a integração estiver disponível.

Criar tabelas organizadas para produtos, fornecedores e configurações de custos. Configurar permissões para que cada usuário autenticado acesse somente os dados que lhe pertencem.

Se forem necessárias credenciais ou configurações externas, explicar como configurá-las. Nunca colocar chaves secretas no código do frontend.

7. Preparação para o Mercado Livre

Criar a seção de anúncios como uma estrutura inicial, com:

Seleção de produtos do catálogo.

Campos para título, descrição, preço, fotos e categoria do anúncio.

Status: rascunho, pronto para revisar, publicado ou com erro.

Espaço para mostrar futuramente o identificador e o link do anúncio.

Não simule uma publicação real. A integração oficial com a API do Mercado Livre será desenvolvida em uma etapa posterior, com autenticação autorizada e credenciais seguras.

8. Regras de desenvolvimento

Todos os botões e formulários principais devem funcionar.

Salvar, editar e excluir dados deve funcionar de verdade.

Não usar dados fictícios como se fossem informações reais.

Mostrar mensagens claras de sucesso e erro.

Criar estados de carregamento e telas vazias quando não houver produtos.

Manter o código organizado para permitir futuras integrações.

Se algum recurso exigir configuração externa, explicar isso claramente.

Comece pela estrutura da aplicação, pelo banco de dados e pelo catálogo funcional. Antes de finalizar, informe o que realmente está funcionando, o que ainda precisa de configuração e quais serão os próximos passos para integrar fornecedores e Mercado Livre.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5291aa44-036c-5a30-94d5-80b128b2f722).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
