-- CreateIndex
CREATE UNIQUE INDEX "Patient_id_organizationId_key" ON "Patient"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Patient_organizationId_idx" ON "Patient"("organizationId");

-- CreateIndex
CREATE INDEX "Patient_lastName_firstName_idx" ON "Patient"("lastName", "firstName");
