// https://marketing.densitypharmachem.com/api/energy/getLabelInfo

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      code: 500,
      message: "Only POST method allowed",
      data: null,
    });
  }

  const { token, itemNumber } = req.body;

  if (!token || !itemNumber) {
    return res.status(400).json({
      code: 500,
      message: "Both token and itemNumber are required",
      data: null,
    });
  }

  try {
    const response = await fetch(
      "https://external-api.example.com/getLabelInfo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          OnlineToken: token,
        },
        body: new URLSearchParams({
          jsonStr: JSON.stringify({ itemNumber }),
        }).toString(),
      }
    );

    const result = await response.json();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Label info fetch error:", error);
    return res.status(500).json({
      code: 500,
      message: "Failed to fetch label info",
      data: null,
    });
  }
}
