# Modo Catálogo — CSM Splitter

Funcionalidade adicionada ao CSM Splitter para automatizar a criação de pastas `pag XX` e o salvamento de `full.png` direto do PDF, eliminando etapas manuais do fluxo de catalogação.

---

## O que foi adicionado

**`server.js`** — novo endpoint `POST /api/create-folders` que cria as pastas `pag XX` na pasta conectada.

**`index.html`** — Modo Catálogo completo:

| Ação | Resultado |
|---|---|
| Clicar "Modo Catálogo" | Ativa o modo — aparece barra roxa e crachás nos cards |
| Clicar num card | Tagueia com 1 produto (roxa) |
| Clicar de novo | Remove tag |
| Clicar no **crachá** | Cicla: 1 prod. → 2 prod. → 3 prod. → remove |
| **Shift+clique** | Mescla com a página anterior (2 páginas, 1 produto → azul claro) |
| "Criar pastas + full.png" | Cria as pastas `pag 02`, `pag 04`... e salva `full.png` em cada uma |

**Fluxo:**
```
Abrir PDF → Conectar pasta → Modo Catálogo → Taguear (~30s) → "Criar pastas" → só recortes
```

---

## Como conectar a pasta de destino

1. Na barra verde abaixo dos controles, clique em **"Conectar"**
2. Cole o caminho completo da pasta de destino, ex:
   ```
   C:\Users\joao.miguel\Documents\PROJETOS CSM\catalogos\catalogos separados\Artecouro 2025\imagens dos produtos\Artecouro 2026
   ```
3. Clique em **Conectar** — o servidor lê as subpastas existentes

O caminho fica salvo em `config.json` e é restaurado automaticamente na próxima abertura.  
Para trocar de catálogo, use o botão **"Trocar"** que aparece quando já há pasta conectada.

---

## Lógica do Shift+clique (mesclar)

Mescla **uma página específica** com a pasta da página imediatamente anterior — para o caso de **1 produto que ocupa 2 páginas** do catálogo.

**Exemplo:**
```
pag 5,6/1  →  produto que ocupa as págs 5 e 6
```
- Clique na pág. 5 → tagueia como 1 produto
- Shift+clique na pág. 6 → mescla com pág. 5
- Resultado: 1 pasta `pag 05` com `full.png` (pág. 5) + `full2.png` (pág. 6)

**Não é** para agrupar várias páginas em uma só pasta — é especificamente para produtos que se estendem por 2 páginas consecutivas.

**Exemplo de 4 páginas tagueadas, última mesclada:**
- Pág. 1 → clique → `pag 01`
- Pág. 2 → clique → `pag 02`
- Pág. 3 → clique → `pag 03`
- Pág. 4 → Shift+clique → mescla com pág. 3 → vai para `pag 03` (como `full2.png`)
- **Resultado:** 3 pastas — `pag 01`, `pag 02`, `pag 03` ✓

---

## Crachá de quantidade (múltiplos produtos por página)

Clicando no **crachá** (badge no canto inferior direito do card) cicla a quantidade de produtos:

```
1 prod. → 2 prod. → 3 prod. → remove
```

Para uma página com 2 produtos (ex: `pag 8/2`), o resultado é:
- `pag 08` → full.png da pág. 8
- `pag 08b` → pasta criada, sem full.png automático (o usuário salva o recorte depois)
