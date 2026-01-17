# Testes Automatizados - Sistema de Perícias

Esta pasta contém scripts de verificação E2E (End-to-End) usando [Playwright](https://playwright.dev/python/).

## Instalação

1. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

2. Instale os navegadores do Playwright:
   ```bash
   playwright install chromium
   ```

## Como Rodar

### Teste com Servidor HTTP (Recomendado)
Levanta um servidor local temporário em `localhost:8000`. Recomendado para testar funcionalidades completas que dependem de protocolo HTTP (evita problemas de CORS e restrições de `file://`).

```bash
python tests/test_server.py
```

### Teste Local (File Protocol)
Testa a aplicação abrindo o arquivo `index.html` diretamente. Pode apresentar limitações de roteamento dependendo do navegador.

```bash
python tests/test_local_file.py
```

## Estrutura
- `test_local_file.py`: Abre `file://.../index.html`.
- `test_server.py`: Inicia `python -m http.server` e testa em `http://localhost:8000`.
- `screenshots/`: Onde as capturas de tela dos testes são salvas.
