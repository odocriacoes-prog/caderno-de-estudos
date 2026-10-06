# Caderno de Estudos

Sistema pessoal de gestão do aprendizado da Lidi: aulas (Bootcamp de Estratégia, Miami Ad School; workshop Branding com Conteúdo, Alana Miranda), estante de ferramentas, pendências e a área Meu Perfil (estratégia, esteira de produção e análise de conteúdo).

Site estático (HTML, CSS e JS, sem build) publicado no Netlify, com dados no Supabase do projeto da ÔDO.

## Arquivos
- `index.html` estrutura da página
- `estilo.css` visual (paleta Espresso, Eau trouble, Terre cuite, Bleu porcelaine, Nuage de lait, Miel doré)
- `conteudo.js` conteúdo das aulas, pautas e ferramentas. Aula nova entra aqui.
- `app.js` telas, login por link no e-mail e gravação no Supabase
- `config.js` endereço e chave pública do Supabase
- `schema.sql` tabela `estudo_estado` com acesso só da dona

## Colocar no ar
1. Rodar `schema.sql` no SQL Editor do Supabase.
2. Preencher `config.js`.
3. No Netlify, Add new site › Import from GitHub › este repositório. Sem comando de build; pasta de publicação: raiz.

O caderno abre sem login. Os dados ficam na linha `lidi` da tabela `estudo_aberto`; enquanto a tabela não existir, ficam guardados só no navegador.
