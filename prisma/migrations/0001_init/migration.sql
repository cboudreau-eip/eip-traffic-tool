-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "errorMsg" TEXT,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GscRow" (
    "id" SERIAL NOT NULL,
    "uploadId" TEXT NOT NULL,
    "date" TEXT,
    "query" TEXT,
    "page" TEXT,
    "country" TEXT,
    "device" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "GscRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ga4Row" (
    "id" SERIAL NOT NULL,
    "uploadId" TEXT NOT NULL,
    "date" TEXT,
    "pagePath" TEXT,
    "pageTitle" TEXT,
    "sessionSource" TEXT,
    "sessionMedium" TEXT,
    "country" TEXT,
    "deviceCategory" TEXT,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "users" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSessionDur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Ga4Row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitemapUrl" (
    "id" SERIAL NOT NULL,
    "uploadId" TEXT NOT NULL,
    "loc" TEXT NOT NULL,
    "lastmod" TEXT,
    "changefreq" TEXT,
    "priority" DOUBLE PRECISION,

    CONSTRAINT "SitemapUrl_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GscRow" ADD CONSTRAINT "GscRow_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ga4Row" ADD CONSTRAINT "Ga4Row_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitemapUrl" ADD CONSTRAINT "SitemapUrl_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
