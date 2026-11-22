-- CreateTable
CREATE TABLE "Agendamento" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "servicoId" INTEGER NOT NULL,
    "profissionalId" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "hora" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_profissionalId_data_hora_key"
ON "Agendamento"("profissionalId", "data", "hora");

-- CreateIndex
CREATE INDEX "Agendamento_clienteId_data_idx"
ON "Agendamento"("clienteId", "data");

-- CreateIndex
CREATE INDEX "Agendamento_data_idx"
ON "Agendamento"("data");

-- AddForeignKey
ALTER TABLE "Agendamento"
ADD CONSTRAINT "Agendamento_clienteId_fkey"
FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento"
ADD CONSTRAINT "Agendamento_servicoId_fkey"
FOREIGN KEY ("servicoId") REFERENCES "Servico"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento"
ADD CONSTRAINT "Agendamento_profissionalId_fkey"
FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
