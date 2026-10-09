# BOOT — Configuração de Inicialização Automática

## O que é isso

O servidor Node.js (`server.js`) precisa estar rodando para o app funcionar — ele é quem lê as subpastas do Windows e salva os arquivos nas pastas certas. Sem ele, o conector de pasta não funciona.

Para não precisar abrir o terminal manualmente toda vez, o `iniciar-auto.vbs` sobe o servidor em segundo plano (sem janela) automaticamente ao ligar o PC.

Este arquivo documenta como registrar esse comportamento numa máquina nova.

---

## O que precisa ser feito (uma única vez por máquina)

Rode o comando abaixo no **PowerShell**, substituindo `CAMINHO_DO_PROJETO` pelo caminho completo onde o repositório foi clonado:

```powershell
$startupFolder = [System.Environment]::GetFolderPath('Startup')
$vbsPath = 'CAMINHO_DO_PROJETO\iniciar-auto.vbs'
$shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut("$startupFolder\CSM Separador - Servidor.lnk")
$shortcut.TargetPath = $vbsPath
$shortcut.WorkingDirectory = 'CAMINHO_DO_PROJETO'
$shortcut.Save()
```

**Exemplo** (se clonou em `C:\Projetos\separador 2`):

```powershell
$startupFolder = [System.Environment]::GetFolderPath('Startup')
$vbsPath = 'C:\Projetos\separador 2\iniciar-auto.vbs'
$shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut("$startupFolder\CSM Separador - Servidor.lnk")
$shortcut.TargetPath = $vbsPath
$shortcut.WorkingDirectory = 'C:\Projetos\separador 2'
$shortcut.Save()
```

---

## Verificar se funcionou

Após rodar o comando, verifique se o atalho foi criado:

```
explorer shell:startup
```

Deve aparecer o arquivo **"CSM Separador - Servidor.lnk"** na pasta.

---

## Dependências

- **Node.js** instalado na máquina (`node` disponível no PATH)
- Repositório clonado com os arquivos `server.js` e `iniciar-auto.vbs`

Para verificar se o Node está instalado:

```
node -v
```

Se não estiver, baixe em https://nodejs.org (versão LTS).

---

## Depois de configurado

Fluxo completo de uso:

1. Ligue o PC — servidor sobe sozinho
2. Abra `http://localhost:8787` no navegador
3. Carregue o PDF
4. Clique em **Conectar** e cole o caminho da pasta raiz desejada
5. Atribua as subpastas nos cards e clique em **Salvar destinos**

Para trocar de pasta/fornecedor a qualquer momento, basta clicar em **Trocar** e colar outro caminho — sem reiniciar nada.
