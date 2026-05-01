// src/app/learn/[stageId]/page.tsx

import ClientPage from "./ClientPage"; // Mengambil UI dari file yang tadi kamu rename
import enDummyData from "@/data/dummyData.json";
import jaAdventureData from "@/data/jaData.json";
import zhAdventureData from "@/data/zhData.json";
import koAdventureData from "@/data/koData.json";

// Fungsi khusus Server untuk mendaftarkan semua stage menjadi APK
export function generateStaticParams() {
  const paths: { stageId: string }[] = [];
  const allData = [enDummyData, jaAdventureData, zhAdventureData, koAdventureData];

  allData.forEach((data: any) => {
    if (data && data.chapters) {
      data.chapters.forEach((chapter: any) => {
        chapter.stages?.forEach((stage: any) => {
          if (!paths.find((p) => p.stageId === stage.id.toString())) {
            paths.push({ stageId: stage.id.toString() });
          }
        });
      });
    }
  });

  if (paths.length === 0) {
    return [{ stageId: "1" }];
  }

  return paths;
}

// Komponen utama yang akan merender ClientPage
export default function LearnStagePage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  return <ClientPage params={params} />;
}