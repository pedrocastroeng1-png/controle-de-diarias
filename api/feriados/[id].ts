// Old clients must obtain a current impact preview before removing a holiday.
export default function handler(_req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  return res
    .status(409)
    .json({
      error:
        "Atualize o aplicativo e confira o impacto antes de remover o feriado.",
    });
}
