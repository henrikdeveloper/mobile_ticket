# Sistema de Controle de Atendimento (Queue Management System)

Sistema de gestão de filas para laboratórios médicos, desenvolvido com Ionic e React.

## 📋 Sobre o Projeto

Este aplicativo gerencia o fluxo de atendimento em um laboratório médico, controlando a emissão de senhas, chamadas por guichê e relatórios estatísticos. O sistema opera com três tipos de prioridades e regras específicas de atendimento.

### Tipos de Senhas
- **SP (Senha Prioritária):** Idosos, gestantes, PCD. Prioridade máxima.
- **SE (Senha Exames):** Retirada de exames. Atendimento rápido.
- **SG (Senha Geral):** Atendimento normal.

### Regras de Negócio
- **Horário de Funcionamento:** 7:00 às 17:00.
- **Padrão de Chamada:** Alternância entre prioridades (`SP -> SE/SG -> SP -> SE/SG`).
- **Tempos Médios (TM):**
  - SP: 15 ± 5 minutos
  - SG: 5 ± 3 minutos
  - SE: <1 min (95%) ou 5 min (5%)
- **Abandono:** Simulação de 5% de taxa de desistência.

## 🚀 Tecnologias

- **Framework:** Ionic + React
- **Linguagem:** TypeScript
- **Banco de Dados:** SQLite (armazenamento local)
- **Estilização:** CSS Modules + Ionic Components

## 📱 Interfaces

O sistema possui 4 interfaces principais acessíveis via abas (para demonstração):

1. **Totem (Cliente):** Emissão de senhas.
2. **Atendente:** Chamada de senhas e controle de atendimento.
3. **Painel (Display):** Visualização da senha atual e histórico.
4. **Relatórios:** Estatísticas diárias e mensais com exportação.

## 🛠️ Instalação e Execução

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute no navegador:
   ```bash
   ionic serve
   ```
4. Para rodar em dispositivo móvel (Android/iOS), use o Capacitor:
   ```bash
   ionic capacitor add android
   ionic capacitor run android
   ```

## 📄 Licença

Este projeto está licenciado sob a licença Creative Commons (CC BY).
