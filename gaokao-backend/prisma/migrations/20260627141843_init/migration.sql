-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "data";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "rec";

-- CreateTable
CREATE TABLE "data"."provinces" (
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "exam_mode" VARCHAR(20) NOT NULL,
    "total_score" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "data"."universities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "province_code" VARCHAR(10) NOT NULL,
    "level" VARCHAR(50),
    "type" VARCHAR(50),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is211" BOOLEAN NOT NULL DEFAULT false,
    "is985" BOOLEAN NOT NULL DEFAULT false,
    "is_double_first" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data"."majors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "subject_requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 4,
    "degree" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data"."admission_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "university_id" UUID NOT NULL,
    "major_id" UUID NOT NULL,
    "province_code" VARCHAR(10) NOT NULL,
    "year" INTEGER NOT NULL,
    "batch" VARCHAR(20) NOT NULL,
    "min_score" DOUBLE PRECISION,
    "avg_score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "min_rank" INTEGER,
    "avg_rank" INTEGER,
    "max_rank" INTEGER,
    "plan_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data"."university_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "university_id" UUID NOT NULL,
    "major_id" UUID NOT NULL,
    "province_code" VARCHAR(10) NOT NULL,
    "year" INTEGER NOT NULL,
    "batch" VARCHAR(20) NOT NULL,
    "plan_count" INTEGER NOT NULL DEFAULT 0,
    "tuition" DOUBLE PRECISION,
    "duration" INTEGER NOT NULL DEFAULT 4,
    "subject_requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID,
    "score_id" UUID,
    "preference_id" UUID,
    "result" JSONB NOT NULL,
    "result_hash" VARCHAR(64),
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."risk_checks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "detail" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "risk_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rec"."rank_lookups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "score" INTEGER NOT NULL,
    "province_code" VARCHAR(10),
    "rank" INTEGER NOT NULL,
    "same_score" INTEGER NOT NULL,
    "range_min" INTEGER NOT NULL,
    "range_max" INTEGER NOT NULL,

    CONSTRAINT "rank_lookups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universities_code_key" ON "data"."universities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "majors_code_key" ON "data"."majors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "admission_scores_province_code_year_university_id_major_id__key" ON "data"."admission_scores"("province_code", "year", "university_id", "major_id", "batch");

-- CreateIndex
CREATE UNIQUE INDEX "university_plans_province_code_year_university_id_major_id__key" ON "data"."university_plans"("province_code", "year", "university_id", "major_id", "batch");

-- CreateIndex
CREATE UNIQUE INDEX "rank_lookups_score_province_code_key" ON "rec"."rank_lookups"("score", "province_code");
