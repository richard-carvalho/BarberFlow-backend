-- Armazena o motivo e a data do cancelamento sem apagar o agendamento.
ALTER TABLE "Agendamento"
ADD COLUMN "motivoCancelamento" TEXT,
ADD COLUMN "canceladoEm" TIMESTAMP(3);

-- Um agendamento cancelado deve liberar o mesmo horário para uma nova reserva.
-- A unicidade continua protegendo os horários que estão CONFIRMADOS.
DROP INDEX IF EXISTS "Agendamento_profissionalId_data_hora_key";

CREATE UNIQUE INDEX "Agendamento_profissional_data_hora_confirmado_key"
ON "Agendamento" ("profissionalId", "data", "hora")
WHERE "status" = 'CONFIRMADO';
