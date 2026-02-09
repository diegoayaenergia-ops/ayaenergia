import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ✅ necessário p/ exceljs

// ===================== CONFIG (ENV) =====================
const BASE_URL = process.env.TECSCI_BASE_URL || "https://system.tecsci.com.br/openapi/v1/power-stations/";
const API_KEY = process.env.TECSCI_API_KEY;

// ===================== MAPAS ======================
const inverter_id_mapping = {
  1: "111", 2: "112", 3: "113", 4: "114", 5: "115", 6: "116", 7: "117", 8: "118",
  9: "121", 10: "122", 11: "123", 12: "124", 13: "125", 14: "126", 15: "127", 16: "128",
  17: "131", 18: "132", 19: "133", 20: "134", 21: "135", 22: "136", 23: "137", 24: "138",
  25: "141", 26: "142", 27: "143", 28: "144", 29: "145", 30: "146", 31: "147", 32: "148",
  33: "151", 34: "152", 35: "153", 36: "154",
  72: "136", 73: "137", 74: "138", 75: "111", 76: "112", 70: "134", 82: "118", 67: "131",
  68: "132", 69: "133", 71: "135", 77: "113", 78: "114", 79: "115", 80: "116", 81: "117",
  94: "134", 84: "112", 85: "113", 86: "114", 87: "121", 88: "122", 89: "123", 90: "124",
  91: "131", 92: "132", 93: "133", 95: "141", 83: "111", 96: "142", 97: "143", 98: "144",
  100: "112", 102: "114", 99: "111", 101: "113", 103: "111", 104: "112", 105: "113",
  106: "114", 107: "121", 108: "122", 109: "123", 110: "124", 111: "131", 112: "132",
  113: "133", 114: "134", 115: "141", 116: "142", 117: "143", 118: "144", 119: "111",
  121: "113", 120: "112", 122: "114", 123: "111", 124: "112", 125: "113", 128: "123",
  129: "131", 126: "121", 127: "122", 130: "132", 132: "112", 134: "121", 135: "122",
  136: "123", 138: "132", 131: "111", 133: "113", 137: "131", 139: "133", 140: "111",
  141: "112", 142: "113", 143: "114", 144: "121", 145: "122", 146: "123", 147: "124",
  148: "131", 149: "132", 150: "133", 151: "134", 152: "141", 153: "142", 154: "143",
  155: "144", 156: "151", 157: "152", 158: "153", 159: "154", 160: "111", 161: "112",
  162: "113", 163: "114",
  459: "111", 460: "112", 461: "113", 462: "114", 463: "115", 464: "121", 465: "122",
  466: "123", 467: "124", 468: "125", 469: "131", 470: "132", 471: "133", 472: "134",
  473: "135", 474: "141", 475: "142", 476: "143", 477: "144", 478: "145",
  479: "111", 480: "112", 481: "113", 482: "114", 483: "115", 484: "121", 485: "122",
  486: "123", 487: "124", 488: "125", 489: "111", 490: "112", 491: "113", 492: "114",
  493: "121", 494: "122", 495: "123", 496: "124", 497: "111", 498: "112", 499: "113",
  500: "114", 501: "115", 502: "121", 503: "122", 504: "123", 505: "124", 506: "125",
  507: "111", 508: "112", 509: "113", 510: "114", 511: "115", 512: "121", 513: "122",
  514: "123", 515: "124", 516: "125", 517: "131", 518: "132", 519: "133", 520: "134",
  521: "135", 522: "141", 523: "142", 524: "143", 525: "144", 526: "145",
  697: "111", 698: "112", 699: "113", 700: "114", 701: "115", 702: "121", 703: "122",
  704: "123", 705: "124", 706: "125", 707: "131", 708: "132", 709: "133", 710: "134",
  711: "135",
  733: "111", 734: "112", 735: "113", 736: "121", 737: "122", 738: "123",
};

const power_station_mapping = {
  1: "RBB", 7: "BLH", 8: "BES", 9: "SB3", 10: "RGN", 11: "MAP",
  12: "LRJ", 13: "GAR", 14: "MNR", 15: "PRG", 42: "RIN", 43: "PPL",
  44: "SB6", 45: "GUA", 46: "ITU", 50: "BLH", 65: "CON", 68: "PIR",
};

const power_station_ids = [1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 42, 43, 44, 45, 46, 50, 65, 68];

const UC_MAP = {
  "BES|UFV 1": 271, "BES|UFV 2": 272, "BES|UFV 3": 270, "BES|UFV 4": 269,
  "BLH|UFV 1": 279, "BLH|UFV 2": 280, "BLH|UFV 3": 278,
  "RGN|UFV 1": 266, "RGN|UFV 2": 268, "RGN|UFV 3": 265, "RGN|UFV 4": 267,
  "RBB|UFV 1": 273, "RBB|UFV 2": 274, "RBB|UFV 3": 275, "RBB|UFV 4": 276, "RBB|UFV 5": 277,
  "LRJ|UFV 1": 299, "LRJ|UFV 2": 300, "LRJ|UFV 3": 301,
  "PRG|UFV 1": 263,
  "MAP|UFV 1": 264,
  "SB6|UFV 1": 260, "SB6|UFV 2": 261,
  "SB3|UFV 1": 262,
  "MNR|UFV 1": 285, "MNR|UFV 2": 281, "MNR|UFV 3": 282, "MNR|UFV 4": 283, "MNR|UFV 5": 284,
  "GAR|UFV 1": 287, "GAR|UFV 2": 288, "GAR|UFV 3": 286,
  "ITU|UFV 1": 297, "ITU|UFV 2": 295, "ITU|UFV 3": 298, "ITU|UFV 4": 296,
  "GUA|UFV 1": 293, "GUA|UFV 2": 294,
  "PPL|UFV 1": 304, "PPL|UFV 2": 305,
  "RIN|UFV 1": 291, "RIN|UFV 2": 290, "RIN|UFV 3": 289, "RIN|UFV 4": 292,
  "PIR|UFV 1": 302, "PIR|UFV 2": 303,
  "CON|UFV 1": 307, "CON|UFV 2": 306, "CON|UFV 3": 308,
};

function uc_lookup(usina, ufv) {
  return UC_MAP[`${usina}|${ufv}`] ?? null;
}

function get_inverter_group(inv_name) {
  const n = Number(inv_name);
  if (!Number.isFinite(n)) return "Outros Grupos";
  if (n >= 111 && n <= 118) return "UFV 1";
  if (n >= 121 && n <= 128) return "UFV 2";
  if (n >= 131 && n <= 138) return "UFV 3";
  if (n >= 141 && n <= 148) return "UFV 4";
  if (n >= 151 && n <= 158) return "UFV 5";
  return "Outros Grupos";
}

function robust_group_for_rbb(raw_inv_id, inv_name_mapped) {
  const g = get_inverter_group(inv_name_mapped);
  if (g !== "Outros Grupos") return g;

  let base = null;

  const n = Number(inv_name_mapped);
  if (Number.isFinite(n)) base = Math.floor(n / 10) * 10;

  if (base === null) {
    const rid = Number(raw_inv_id);
    if (Number.isFinite(rid)) base = Math.floor(rid / 10) * 10;
  }

  const centena_to_group = { 110: "UFV 1", 120: "UFV 2", 130: "UFV 3", 140: "UFV 4", 150: "UFV 5" };
  return centena_to_group[base] ?? "UFV 5";
}

function parseMonth(dateStr) {
  // espera YYYY-MM-DD
  if (!dateStr || typeof dateStr !== "string" || dateStr.length < 7) return null;
  return dateStr.slice(0, 7); // "YYYY-MM"
}

async function process_power_station_data(power_station_id, start_date, end_date) {
  const usina = power_station_mapping[power_station_id] ?? "Usina Desconhecida";
  const url = `${BASE_URL}${power_station_id}/inverters/generation?start_date=${start_date}&end_date=${end_date}`;

  const headers = {
    "Accept": "application/json",
    "X-API-KEY": API_KEY,
  };

  let res;
  try {
    res = await fetch(url, { headers, cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  let payload;
  try {
    payload = await res.json();
  } catch {
    return [];
  }

  const data = payload?.data ?? [];
  const out = [];

  const ufv_override = (power_station_id === 50) ? "UFV 2" : null;
  const kwh_keys = ["power_yields_kwh", "power_yield_kwh", "generation_kwh", "yield_kwh", "kwh", "energy_kwh", "energy"];

  for (const day of data) {
    const date = day?.date;
    const inverters = day?.inverters ?? [];
    for (const inv of inverters) {
      const inv_id = inv?.id;

      let kwh = 0;
      for (const k of kwh_keys) {
        if (inv?.[k] != null) {
          const v = Number(inv[k]);
          kwh = Number.isFinite(v) ? v : 0;
          break;
        }
      }

      const inv_name = inverter_id_mapping[inv_id] ?? String(inv_id ?? "");
      let ufv;

      if (usina === "RBB") {
        ufv = robust_group_for_rbb(inv_id, inv_name);
      } else {
        const ufv_base = get_inverter_group(inv_name);
        ufv = ufv_override ?? ufv_base;
      }

      out.push({ USINA: usina, DATA: date, UFV: ufv, KWH: kwh });
    }
  }

  return out;
}

function ufvSortKey(ufv) {
  const m = /^UFV\s+(\d+)$/.exec(String(ufv || ""));
  return m ? Number(m[1]) : 999;
}

export async function GET(req) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Faltou TECSCI_API_KEY no .env.local" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);

  // Permite passar por querystring: ?start_date=2026-01-01&end_date=2026-01-31
  const start_date = searchParams.get("start_date") || "2026-01-01";
  const end_date = searchParams.get("end_date") || "2026-01-31";

  // ===================== COLETA =====================
  const rows = [];
  for (const ps of power_station_ids) {
    const part = await process_power_station_data(ps, start_date, end_date);
    rows.push(...part);
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Nenhum dado retornado. Verifique datas, API key e IDs." },
      { status: 404 }
    );
  }

  // ===================== AGREGA (Mês, USINA, UFV) =====================
  const agg = new Map(); // key: "YYYY-MM|USINA|UFV"
  for (const r of rows) {
    const mes = parseMonth(r.DATA);
    if (!mes) continue;
    const usina = r.USINA ?? "Usina Desconhecida";
    const ufv = r.UFV ?? "Outros Grupos";
    const key = `${mes}|${usina}|${ufv}`;
    const cur = agg.get(key) ?? 0;
    agg.set(key, cur + (Number(r.KWH) || 0));
  }

  const monthly = [];
  for (const [key, geracao] of agg.entries()) {
    const [mes, usina, ufv] = key.split("|");
    monthly.push({
      "Mês": mes,
      "USINA": usina,
      "UFV": ufv,
      "Geração": geracao,
      "UC": uc_lookup(usina, ufv),
    });
  }

  monthly.sort((a, b) => {
    // Mês -> USINA -> UC -> UFV
    if (a["Mês"] !== b["Mês"]) return a["Mês"] < b["Mês"] ? -1 : 1;
    if (a["USINA"] !== b["USINA"]) return a["USINA"] < b["USINA"] ? -1 : 1;

    const auc = (a["UC"] ?? 999999);
    const buc = (b["UC"] ?? 999999);
    if (auc !== buc) return auc - buc;

    return ufvSortKey(a["UFV"]) - ufvSortKey(b["UFV"]);
  });

  const format = searchParams.get("format"); // "json" ou null

  if (format === "json") {
    return NextResponse.json(
      {
        start_date,
        end_date,
        rows: monthly.map((r) => ({
          mes: r["Mês"],
          usina: r["USINA"],
          uc: r["UC"] ?? null,
          ufv: r["UFV"],
          geracao: r["Geração"],
        })),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }


  // ===================== GERA XLSX =====================
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Mensal por UC");

  ws.columns = [
    { header: "Mês", key: "Mês", width: 10 },
    { header: "USINA", key: "USINA", width: 10 },
    { header: "UC", key: "UC", width: 10 },
    { header: "UFV", key: "UFV", width: 10 },
    { header: "Geração", key: "Geração", width: 16 },
  ];

  ws.getRow(1).font = { bold: true };

  for (const r of monthly) {
    ws.addRow({
      "Mês": r["Mês"],
      "USINA": r["USINA"],
      "UC": r["UC"] ?? "",
      "UFV": r["UFV"],
      "Geração": r["Geração"],
    });
  }

  // Formata "Geração" como número com 2 casas
  ws.getColumn("Geração").numFmt = "#,##0.00";

  const buffer = await wb.xlsx.writeBuffer();

  const fileName = `geracao_mensal_${start_date}_a_${end_date}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
