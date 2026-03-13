-- Convert static Course enum columns to text-based codes.
ALTER TABLE "Internship"
ALTER COLUMN "studentCourse" TYPE TEXT USING "studentCourse"::text;

ALTER TABLE "JobVacancy"
ALTER COLUMN "eligibleCourses" TYPE TEXT[] USING "eligibleCourses"::text[];

-- Remove enum type after all dependent columns are converted.
DROP TYPE IF EXISTS "Course";

-- Course catalog managed by Admin settings.
CREATE TABLE "AvailableCourse" (
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AvailableCourse_pkey" PRIMARY KEY ("code")
);

CREATE UNIQUE INDEX "AvailableCourse_name_key" ON "AvailableCourse"("name");

INSERT INTO "AvailableCourse" ("code", "name", "isActive", "createdAt", "updatedAt")
VALUES
  ('BSI', 'Bacharelado em Sistemas de Informação', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LIC_QUIMICA', 'Licenciatura em Química', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ENG_MECANICA', 'Bacharelado em Engenharia Mecânica', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TEC_ADM_INTEGRADO', 'Técnico em Administração Integrado', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TEC_ELETRO_INTEGRADO', 'Técnico em Eletrotécnica Integrado', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TEC_INFO_INTEGRADO', 'Técnico em Informática Integrado', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TEC_QUIMICA_INTEGRADO', 'Técnico em Química Integrado', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TEC_AUTOMACAO_SUBSEQUENTE', 'Técnico em Automação Industrial Subsequente', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TEC_ELETRO_CONCOMITANTE', 'Técnico em Eletrotécnica Concomitante', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TEC_MECANICA_CONCOMITANTE', 'Técnico em Mecânica Concomitante', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TEC_QUIMICA_CONCOMITANTE', 'Técnico em Química Concomitante', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
