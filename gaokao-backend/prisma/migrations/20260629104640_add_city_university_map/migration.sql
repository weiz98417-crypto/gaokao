-- CreateTable
CREATE TABLE "data"."city_university_map" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_name" VARCHAR(100) NOT NULL,
    "university_id" UUID NOT NULL,
    "province_code" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_university_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "city_university_map_city_name_university_id_key" ON "data"."city_university_map"("city_name", "university_id");
