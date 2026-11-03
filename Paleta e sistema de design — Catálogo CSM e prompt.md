# Paleta e sistema de design — Catálogo CSM e prompt

## Light Mode

| Papel | Hex | Uso |
|---|---|---|
| Background principal | `#FAF8F3` | Corpo da página |
| Background gradiente | `160deg` → `#FAF8F3` → `#F0EBE0` → `#E5DDD0` | Gradiente fixo no body |
| Surface cards | `#FFFFFF` | Cards, modais |
| Surface elevada | `#F5F0E8` | Hover states, inputs |
| Texto principal | `#1C1916` | Títulos e corpo |
| Texto secundário | `#7A7470` | Labels, metadados |
| Bordas | `rgba(0,0,0,0.07)` | Dividers, outlines |
| Acento dourado | `#8C6E18` / `#B8973A` | Botões, destaques |

## Dark Mode

| Papel | Hex | Uso |
|---|---|---|
| Background base | `#110D08` | Cor mais escura (warm, não frio) |
| Background 2 | `#160F09` | Variação |
| Surface cards | `#1E1610` | Cards e containers |
| Surface elevada | `#271C13` | Hover states |
| Texto principal | `#EDE8E2` | Levemente creme, não branco puro |
| Texto secundário | `#807C78` | Labels, metadados |
| Bordas | `rgba(255,255,255,0.08)` | Subtle, quase invisível |
| Acento dourado | `#C4924A` / `#D4A860` | Mais quente que no light |
| Painel de imagem | `#EDE7DC` | Display case para fotos de produto |

## Técnicas especiais

- **Grain no dark**: overlay SVG de ruído com `opacity: 0.035` — dá textura e evita banding
- **mix-blend-mode: multiply** no painel de imagem em dark: funde o fundo branco das fotos no creme `#EDE7DC`
- **Vinheta radial** no painel de imagem em dark: `radial-gradient(ellipse at 50% 46%, transparent 32%, rgba(17,13,8,0.62) 92%)`
- **Tipografia**: Cormorant Garamond (títulos, editorial) + Inter (interface)

---

## Prompt para outros projetos

```
Crie um tema dark/light para um site de catálogo de produtos de alto padrão (móveis, decoração, moda).

FILOSOFIA: Evitar pretos frios (#000, #111). Todo o dark mode deve ter subtom quente (marrom-escuro),
como se a tela fosse iluminada por luz âmbar. O light mode deve ser creme/marfim, nunca branco clínico.

LIGHT MODE:
- Background: gradiente fixo 160deg de #FAF8F3 → #F0EBE0 → #E5DDD0
- Cards/surfaces: #FFFFFF e #F5F0E8
- Texto: #1C1916 (quase preto quente) e #7A7470 (muted)
- Bordas: rgba(0,0,0,0.07)
- Acento: dourado #8C6E18 / #B8973A

DARK MODE:
- Backgrounds em escala quente: #110D08 → #160F09 → #1E1610 → #271C13
- Texto: #EDE8E2 (creme, não branco puro)
- Bordas: rgba(255,255,255,0.08)
- Acento dourado mais saturado: #C4924A / #D4A860
- Grain sutil no body (SVG fractalNoise, opacity 0.035) para textura
- Header/nav com backdrop-filter: blur e fundo com 97-98% de opacidade

PARA FOTOS DE PRODUTO COM FUNDO BRANCO em dark mode:
- Container da imagem: background #EDE7DC (creme quente)
- Imagem: mix-blend-mode: multiply — o branco da foto se funde no creme
- Vinheta via ::after: radial-gradient(ellipse at 50% 46%, transparent 32%, rgba(17,13,8,0.62) 92%)
- Resultado: foto parece "assentada" no fundo, sem recorte duro

TIPOGRAFIA:
- Display/títulos: Cormorant Garamond (serif elegante, pesos 300–600)
- Interface: Inter (sem serifa limpa, pesos 300–600)

TRANSIÇÃO entre modos: transition: background-color 0.3s ease, color 0.3s ease no body.
```
