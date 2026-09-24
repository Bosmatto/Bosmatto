# Backlog do Projeto - Sistema de Controle de Ponto Eletrônico (PWA Tablet/Desktop)

Este documento registra todas as funcionalidades, requisitos e regras de negócio implementadas no sistema, com status de desenvolvimento, escopo de alterações e datas de atualização.

---

## Tabela de Acompanhamento de Requisitos

| Código | Requisito / Regra | Tipo | Escopo / Descrição | Status | Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Registro de Ponto | Funcional | Registro de 4 eventos: Entrada, Saída Intervalo, Retorno Intervalo, Saída Fim | Concluído | 2026-09-24 |
| **RF-02** | Emissão de Comprovante | Funcional | Ticket físico formatado com Razão Social, CNPJ, Endereço, Nome, PIS, Cargo, Turno e Horário Exato (Padrão Portaria MTE) | Concluído | 2026-09-24 |
| **RF-03** | Registro de Justificativa | Funcional | Modal obrigatório de justificativa quando a marcação extrapolar a tolerância horária | Concluído | 2026-09-24 |
| **RF-04** | Notificação de Inconsistência | Funcional | Alertas automáticos no painel do gestor para atrasos, saídas antecipadas e ausências | Concluído | 2026-09-24 |
| **RF-05** | Autenticação Biométrica | Funcional | Captura fotográfica via `getUserMedia` e biometria digital no momento da marcação | Concluído | 2026-09-24 |
| **RF-06** | Autenticação de Exceção | Funcional | Suporte a credencial alternativa via Cartão de Proximidade (RFID) ou PIN numérico | Concluído | 2026-09-24 |
| **RF-07** | Gestão de Atestados e Abonos | Funcional | Módulo para RH/Gestor cadastrar e anexar atestados médicos, abonando faltas e inconsistências | Concluído | 2026-09-24 |
| **RF-08** | Alertas Visuais de Hardware | Funcional | Indicadores visuais fixos e modais de alerta para desconexão de rede ou falha/falta de papel na impressora | Concluído | 2026-09-24 |
| **RF-09** | Comprovante Digital (E-mail) | Funcional | Envio automático do comprovante para o e-mail cadastrado caso a impressora esteja sem papel ou inoperante | Concluído | 2026-09-24 |
| **RN-01** | Tolerância de Horário | Regra Negócio | Limite de tolerância de 5 min por marcação e máximo acumulado diário de 10 min | Concluído | 2026-09-24 |
| **RN-02** | Desconto e Horas Excedentes | Regra Negócio | Contabilização do tempo excedente (>10 min acumulados) para cálculo de desconto em folha | Concluído | 2026-09-24 |
| **RN-03** | Imutabilidade do Registro | Regra Negócio | Registros imutáveis com timestamp UTC, hash criptográfico de integridade e auditoria | Concluído | 2026-09-24 |
| **RN-04** | Apuração de Faltas | Regra Negócio | Detecção automática e geração de Falta Injustificada para ausência total ao final da jornada | Concluído | 2026-09-24 |
| **RNF-01** | PWA Offline-First | Não-Funcional | Armazenamento local com IndexedDB, Service Worker (`vite-plugin-pwa`) e sincronização automática ao restabelecer rede | Concluído | 2026-09-24 |
| **RNF-02** | Desempenho da Interface | Não-Funcional | Resposta e gravação local da marcação em tempo inferior a 1 segundo | Concluído | 2026-09-24 |
| **RNF-03** | Compatibilidade Cross-Browser | Não-Funcional | Suporte responsivo a Chromium e Safari para Tablets e Desktops (min-width: 768px) | Concluído | 2026-09-24 |

---

## Histórico de Versões e Atualizações

* **v1.0.0 (2026-09-24):**
  * Criação da arquitetura base PWA (manifest, service workers, IndexedDB offline-first, cache API).
  * Implementação da tela Kiosk de marcação rápida de ponto com relógio digital em tempo real.
  * Integração com câmera web (`getUserMedia`) para biometria facial fotográfica e autenticação de exceção (PIN / RFID).
  * Motor de cálculo de tolerância (RN-01, RN-02) e captura de justificativa (RF-03).
  * Emissão de comprovante térmico físico (RF-02) e fallback automático para e-mail digital (RF-09) com simulação de hardware.
  * Indicadores e alertas de hardware para rede e impressora (RF-08).
  * Painel do Gestor/RH com auditoria de registros, notificações de inconsistência (RF-04), módulo de atestados e abonos (RF-07) e apuração de faltas (RN-04).
  * Integração com Supabase REST API e gerador de script SQL para PostgreSQL.
  * Criação do arquivo `/supabase_schema.sql` com DDL completo, índices, seed de colaboradores, regras de imutabilidade (trigger anti-update/delete) e políticas RLS.

