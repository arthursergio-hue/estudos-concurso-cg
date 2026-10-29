<!-- updated: 2026-10-28 · fonte: scripts/drive-sync/Codigo.gs -->

# Sincronizar o progresso pelo Google Drive (5 minutos, uma vez só)

O site guarda o progresso no navegador de cada aparelho. Com isto, PC, celular e pop-up do Windows passam a juntar
tudo num arquivo do seu Drive pessoal:
`00 - Pessoal/Concurso/Campina Grande 2026 - Inspetor Sanitario Arquiteto/Progresso do app/progresso.json`.

Faça logado na **sua conta Google pessoal** (a do Drive G:, não na conta da Seazone).

1. Abra https://script.google.com → **Novo projeto**. Dê o nome "Estudos CG - sincronizar".
2. Apague o código de exemplo e cole todo o conteúdo de `scripts/drive-sync/Codigo.gs`. Salve (Ctrl+S).
3. No menu de funções (ao lado de "Executar"), escolha **configurar** e clique em **Executar**.
   O Google pede autorização: **Revisar permissões** → sua conta → "O Google não verificou este app" →
   **Avançado** → **Acessar Estudos CG - sincronizar** → **Permitir**. (É o seu próprio script; ele só mexe na
   pasta do concurso.)
4. **Implantar** → **Nova implantação** → engrenagem → **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
   → **Implantar** → copie a URL do app da Web.
5. Rode **configurar** de novo. No **Registro de execução** aparece a linha
   `https://arthursergio-hue.github.io/estudos-concurso-cg/#/sync?u=...&t=...`.
6. Abra esse link **no PC e no celular** (pode mandar para você mesmo no WhatsApp). O site guarda o endereço e a chave
   e passa a sincronizar sozinho.
7. **Pop-up do Windows:** no PC, rode uma vez, com o mesmo link entre aspas:

   ```
   powershell -ExecutionPolicy Bypass -File C:\dev\pessoal\estudos\popup\ligar-sync.ps1 "<link do passo 5>"
   ```

   Ele grava `popup/sync.json` (fora do GitHub), e as respostas do pop-up passam a ir direto para o Drive.

## Segurança

- A chave fica só nas propriedades do script e nos seus aparelhos. Sem ela, o endereço não lê nem grava nada.
- Para trocar a chave: no editor, **Configurações do projeto → Propriedades do script**, apague `CHAVE`, rode
  **configurar** de novo e abra o link novo nos aparelhos.
- Uma cópia do dia anterior fica em `Progresso do app/progresso - copia do dia anterior.json`.
