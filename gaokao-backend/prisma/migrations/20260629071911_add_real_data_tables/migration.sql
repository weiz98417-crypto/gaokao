-- CreateTable
CREATE TABLE "data"."province_batch_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "province_code" VARCHAR(10) NOT NULL,
    "year" INTEGER NOT NULL,
    "subject_type" VARCHAR(20) NOT NULL,
    "batch" VARCHAR(20) NOT NULL,
    "score" INTEGER NOT NULL,
    "source" VARCHAR(200),

    CONSTRAINT "province_batch_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data"."province_rank_segments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "province_code" VARCHAR(10) NOT NULL,
    "year" INTEGER NOT NULL,
    "subject_type" VARCHAR(20) NOT NULL,
    "score" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "total_count" INTEGER,
    "source" VARCHAR(200),

    CONSTRAINT "province_rank_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data"."subject_coverages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "province_code" VARCHAR(10),
    "year" INTEGER NOT NULL,
    "subjects" TEXT[],
    "coverage_pct" DOUBLE PRECISION NOT NULL,
    "total_majors" INTEGER NOT NULL,
    "source" VARCHAR(200),

    CONSTRAINT "subject_coverages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "province_batch_lines_province_code_year_subject_type_batch_key" ON "data"."province_batch_lines"("province_code", "year", "subject_type", "batch");

-- CreateIndex
CREATE UNIQUE INDEX "subject_coverages_province_code_year_subjects_key" ON "data"."subject_coverages"("province_code", "year", "subjects");
