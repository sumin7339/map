export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "GET 요청만 지원합니다." });
  }

  const query = typeof request.query.q === "string" ? request.query.q.trim() : "";
  if (query.length < 2 || query.length > 200) {
    return response.status(400).json({ error: "검색어는 2자 이상 200자 이하로 입력해 주세요." });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", query);

  try {
    const result = await fetch(url, {
      headers: {
        "User-Agent": "GileumRouteFinder/1.0 (OpenStreetMap Nominatim client)",
        Accept: "application/json",
      },
    });

    if (!result.ok) {
      return response.status(502).json({ error: "장소 검색 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." });
    }

    response.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return response.status(200).json(await result.json());
  } catch {
    return response.status(502).json({ error: "장소 검색 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." });
  }
}
