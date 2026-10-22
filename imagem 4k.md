# Imagem 4K — Drop Zone e Enhance

## O problema que isso resolve

Antes, baixar uma imagem do Gemini (ou de qualquer site) e colocá-la na pasta certa era um processo manual e repetitivo:
1. Clicar com botão direito → Salvar como
2. Navegar até a pasta `catalogos separados \ Fornecedor X \ imagens dos produtos \ pag XX`
3. Digitar o nome do arquivo
4. Repetir para cada imagem

Com o **Drop Zone + Enhance** isso virou um processo de 3 cliques.

---

## Drop Zone — Salvar imagem diretamente na pasta

### Como acessar
Abra o Separador em `http://localhost:8787` e clique no botão **"Salvar Img"** no cabeçalho (ao lado do botão Enhance).

### Como usar (fluxo do Gemini)
1. No Gemini, clique com botão direito na imagem → **Copiar imagem**
2. Volte para o Separador (`http://localhost:8787`)
3. Pressione **Ctrl+V** na área pontilhada — a imagem aparece como preview instantaneamente
4. Selecione a **pasta de destino** (ex: `pag 05`)
5. Escolha o **nome do arquivo** — use os atalhos rápidos:
   - **capa** → `capa.png` (foto principal do produto)
   - **ficha** → `ficha tecn.png` (ficha técnica do PDF)
   - **recorte** → `recorte.png` (recorte avulso)
6. Clique **"Salvar"** (fecha o modal) ou **"Salvar e próxima ›"** (limpa e fica aberto para a próxima imagem)

### Arrastar da web
Também é possível arrastar uma imagem de qualquer página web diretamente para a área pontilhada. O servidor busca a imagem automaticamente sem precisar baixar antes.

---

## Enhance — Qualidade melhorada ao salvar

O botão **Enhance OFF/ON** (também no cabeçalho) aplica três filtros automáticos em toda imagem que você salva pelo Separador:

| Filtro | O que faz |
|---|---|
| **Sharpening forte** | Nitidez aumentada nas bordas — resolve o serrilhado de PDFs e deixa metais e madeiras mais definidos |
| **Brilho +2%** | Levanta levemente a luminosidade sem estourar as luzes |
| **Saturação +8%** | Cores um pouco mais vivas — produtos ficam com aparência mais profissional |

### Como ativar
1. Clique no botão **"Enhance OFF"** no cabeçalho — ele fica roxo e passa a mostrar **"Enhance ON"**
2. A partir daí, toda imagem salva pelo Separador sai processada automaticamente
3. O estado é salvo no `config.json` — na próxima vez que abrir o servidor, continua como você deixou

### Quando usar
- **Ligado (recomendado):** para imagens extraídas de PDF que saem com serrilhado ou cores opacas
- **Desligado:** se quiser preservar a imagem exatamente como está, sem nenhum processamento

---

## Resumo do fluxo completo

```
Gemini → Copiar imagem → Ctrl+V no Separador → seleciona pasta → salva
                                                                    ↓
                                              (se Enhance ON) → sharpening automático
                                                                    ↓
                                                    arquivo salvo direto na pasta certa
```

Sem janela de "Salvar como". Sem navegar até a pasta. Sem digitar o nome toda vez.
