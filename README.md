# Sistema Metalúrgica (local, 2 computadores)

Sistema web para controlar **estoque de materiais**, **clientes/orçamentos** e
**ordens de produção** de uma metalúrgica. Funciona na rede local: um
computador roda o servidor (com o banco de dados) e qualquer outro computador
da mesma rede acessa pelo navegador — sem precisar de internet.

## Como funciona

- **PC servidor**: roda o backend (Node.js + Express) e guarda os dados num
  arquivo SQLite local (`server/data/metalurgica.db`).
- **PC cliente(s)**: abrem o navegador (Chrome, Edge, Firefox) e acessam o
  endereço `http://IP-DO-SERVIDOR:3001`.
- Os dois computadores precisam estar na **mesma rede Wi-Fi ou cabeada**.

## Requisitos

- [Node.js](https://nodejs.org) versão 18 ou superior instalado no PC que vai
  ser o servidor (não precisa instalar nada no outro PC, só ter um navegador).

## Instalação (uma vez, no PC servidor)

```bash
# 1. Instalar dependências do backend
cd server
npm install

# 2. Instalar dependências do frontend e gerar o build
cd ../client
npm install
npm run build
```

## Rodando o sistema

No PC servidor:

```bash
cd server
npm start
```

Vai aparecer algo como:

```
Servidor rodando na porta 3001
Acesse pelo próprio PC em: http://localhost:3001
Acesse do outro computador usando o IP deste PC na rede local, ex: http://192.168.0.10:3001
```

### Descobrindo o IP do PC servidor

- **Windows**: abra o `cmd` e digite `ipconfig`. Use o "Endereço IPv4" (algo
  como `192.168.0.10`).
- **Linux/Mac**: no terminal, digite `hostname -I` ou `ip addr`.

### Acessando do outro computador (cliente)

Abra o navegador e digite:

```
http://IP-DO-SERVIDOR:3001
```

Exemplo: `http://192.168.0.10:3001`

> Dica: configure o IP do PC servidor como **fixo** no roteador (IP
> reservado/estático), assim ele não muda depois de reiniciar o roteador ou o
> computador.

### Firewall

Na primeira vez que rodar `npm start`, o Windows pode perguntar se libera o
Node.js na rede — escolha **Permitir acesso** (redes privadas). Sem isso, o
outro computador não vai conseguir se conectar.

## Login inicial

```
Usuário: admin
Senha:   admin123
```

Recomenda-se trocar a senha depois do primeiro acesso (rota
`POST /api/auth/login` de alteração de senha, ou peça para o desenvolvedor
adicionar uma tela de troca de senha).

## Módulos do sistema

- **Estoque**: cadastro de materiais (nome, unidade, quantidade, estoque
  mínimo, preço), com registro de entradas/saídas e alerta visual quando a
  quantidade fica igual ou menor que o mínimo.
- **Clientes**: cadastro e busca de clientes.
- **Orçamentos**: criação de orçamento com itens e valores, aprovação ou
  rejeição, e geração de ordem de produção a partir de um orçamento aprovado.
- **Ordens de Produção**: acompanhamento de status (pendente → em produção →
  concluída), com vínculo de materiais consumidos — ao concluir a ordem, o
  estoque é baixado automaticamente.

## Backup dos dados

Todos os dados ficam no arquivo:

```
server/data/metalurgica.db
```

Faça backup periódico desse arquivo (copiar para um pendrive, nuvem, etc.).
Não é necessário instalar nenhum banco de dados separado.

## Estrutura do projeto

```
server/   -> API (Node.js + Express + SQLite)
client/   -> Interface web (React), gerada em client/dist e servida pelo
             próprio servidor
```

## Deixando o sistema sempre ligado

Para não precisar abrir o terminal manualmente todo dia, você pode configurar
o `npm start` do `server/` para iniciar automaticamente com o Windows (Agendador
de Tarefas) ou usar uma ferramenta como o [PM2](https://pm2.keymetrics.io/)
para manter o processo rodando em segundo plano.
