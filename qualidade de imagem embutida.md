# Qualidade de Imagem Embutida

## O que muda com o Enhance

**Sem Enhance (padrão):**
Você recorta → clica salvar → a imagem é gravada exatamente como está no canvas.

**Com Enhance ligado:**
Você recorta → clica salvar → antes de gravar, o servidor passa a imagem por 3 filtros automáticos:

| Filtro | O que faz |
|---|---|
| **Upscale Lanczos** | Se a imagem tiver menos de 800px de largura, dobra o tamanho com interpolação de alta qualidade (sem distorção) |
| **Sharpening** | Reforça as bordas — resolve o serrilhado típico de recortes de PDF |
| **Contraste leve** | Sobe levemente o brilho (+2%) e saturação (+5%) — cores ficam mais vivas |

**Como usar:**
1. Acesse sempre pelo endereço `http://localhost:8787` (não abra o arquivo HTML diretamente)
2. O botão **"Enhance OFF"** fica na barra de botões junto com "Salvar destinos"
3. Clica uma vez → vira **"Enhance ON"** (fica roxo) → tudo que você salvar a partir daí sai melhorado
4. O estado é salvo automaticamente — se fechar e reabrir, continua como você deixou

---

## Por que não abrir o HTML diretamente?

O arquivo HTML sozinho não consegue falar com o servidor Node.js quando aberto pelo Windows Explorer. Precisa ir pelo endereço `http://localhost:8787` para que tudo funcione. O atalho `.vbs` que já existe na pasta faz isso automaticamente.
