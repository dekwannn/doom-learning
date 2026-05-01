// src/app/adventure/[chapterId]/[stageId]/page.tsx

import ClientPage from "./ClientPage"; // Mengambil UI
import enDummyData from "@/data/dummyData.json";
import jaAdventureData from "@/data/jaData.json";
import zhAdventureData from "@/data/zhData.json";
import koAdventureData from "@/data/koData.json";

// Fungsi Server untuk mendaftarkan kombinasi chapterId dan stageId
export function generateStaticParams() {
  const paths: { chapterId: string; stageId: string }[] = [];
  const allData = [enDummyData, jaAdventureData, zhAdventureData, koAdventureData];

  allData.forEach((data: any) => {
    if (data && data.chapters) {
      data.chapters.forEach((chapter: any) => {
        if (chapter.id && chapter.stages) {
          chapter.stages.forEach((stage: any) => {
            if (stage.id) {
              // Cek agar tidak ada data yang kembar
              const isExist = paths.find(
                (p) => p.chapterId === chapter.id.toString() && p.stageId === stage.id.toString()
              );
              if (!isExist) {
                paths.push({
                  chapterId: chapter.id.toString(),
                  stageId: stage.id.toString(),
                });
              }
            }
          });
        }
      });
    }
  });

  // Fallback jika kosong
  if (paths.length === 0) {
    return [{ chapterId: "1", stageId: "1" }];
  }

  return paths;
}

// Komponen melempar data params ke ClientPage
export default function AdventureStagePage({
  params,
}: {
  params: Promise<{ chapterId: string; stageId: string }>;
}) {
  return <ClientPage params={params} />;
}