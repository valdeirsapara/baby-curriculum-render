# Currículo — Valdeir Sapará

Site estático que renderiza um currículo a partir de um XML. Sem build, sem
dependências, sem framework. `Ctrl + P` imprime em A4 já formatado.

```
.
├── index.html                  # casca da página (não precisa mexer)
├── css/style.css               # visual da tela + regras de impressão
├── js/render.js                # lê o XML e monta o HTML
└── assets/
    ├── foto.jpg                # foto do cabeçalho
    └── content/content.xml     # ← O CURRÍCULO. É só isso que você edita.
```

As tags do XML e os nomes de classes/funções são em inglês; o conteúdo é em
português.

## Atualizar o currículo

Edite `assets/content/content.xml` e recarregue a página. Mais nada.

A ordem dos elementos no XML é a ordem que aparece na página. Para tirar algo,
apague ou comente o bloco.

### Estrutura do XML

As tags são em inglês; o conteúdo, em português.

| Elemento | Onde | O que faz |
|---|---|---|
| `<resume lang="pt-BR">` | raiz | envolve tudo |
| `<personal>` | raiz | nome, cargo, foto e as linhas de contato do topo |
| `<name>`, `<role>`, `<photo>` | `<personal>` | nome, cargo sob o nome, caminho da foto |
| `<field label="X" href="...">` | `<personal>` | uma linha "**X:** valor". `href` é opcional (vira link) |
| `<summary>` | raiz | parágrafo de resumo no topo (opcional) |
| `<section title="...">` | raiz | um bloco com título e linha divisória |
| `<education>` | `<section>` | `<course>`, `<institution>`, `<status>` |
| `<experience>` | `<section>` | `<company>`, `<role>`, `<period start="" end=""/>`, `<activities><item>`, `<technologies><tech>` |
| `<skills>` | `<section>` | `<group name="Backend">Python, ...</group>` |
| `<links>` | `<section>` | `<link label="GitHub" href="...">texto</link>` |

Uma `<section>` aceita qualquer mistura desses blocos — dá para ter, por exemplo,
formação e cursos na mesma seção.

O `<summary>` não existe hoje no arquivo. Para usá-lo, adicione logo após o
`</personal>`:

```xml
<summary>Desenvolvedor de software com foco em Python/Django e agentes de IA.</summary>
```

Dois cuidados de XML:

- Escreva `&amp;` no lugar de `&` (ex.: `A&amp;3`, `DevOps &amp; Infra`).
- Todo elemento aberto precisa ser fechado.

Para conferir se o arquivo continua válido antes de publicar:

```bash
python3 -c "import xml.etree.ElementTree as E; E.parse('assets/content/content.xml'); print('ok')"
```

### Adicionar um tipo novo de bloco

Crie a função em `js/render.js` e registre no mapa `BUILDERS` — a chave é o nome
da tag XML. O resto é automático.

## Rodar localmente

O navegador bloqueia a leitura do XML quando a página é aberta direto do disco
(`file://`), então precisa de um servidor:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Imprimir / gerar PDF

`Ctrl + P` (ou o botão no canto). O botão não aparece no papel. O tamanho A4 e as
margens já vêm do CSS — deixe **Margens: Padrão**.

Desmarque **"Cabeçalhos e rodapés"** na caixa do Chrome. É o que imprime a data e
o `localhost:8765` nos cantos da folha; não dá para desligar isso por CSS, é uma
opção do navegador.

Blocos de experiência e formação nunca são cortados no meio de uma página.

Se a impressão sair com uma página quase vazia, é CSS antigo em cache: recarregue
com `Ctrl + Shift + R`. Ao editar `css/style.css` ou `js/render.js`, incremente o
`?v=` no `index.html` para que ninguém pegue a versão velha.

## Publicar

É estático — sobe qualquer coisa que sirva arquivos. Aponte o subdomínio
`curriculum.valdeirsapara.com.br` para a raiz do projeto.

Nginx:

```nginx
server {
    server_name curriculum.valdeirsapara.com.br;
    root /var/www/curriculum;
    index index.html;

    # o XML muda com frequência: não deixe o navegador cachear
    location = /assets/content/content.xml {
        add_header Cache-Control "no-cache";
    }
}
```

Em GitHub Pages / Netlify / Cloudflare Pages, basta subir a pasta como está —
não há etapa de build.
