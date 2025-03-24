import {
  xcard,
  xchar,
  xskill,
  xelement,
  xkeyword,
  xavatar,
  xdeckcard,
  xcardview,
  xchoose,
  type ExcelData,
  getExcel,
} from "./utils";

function match(
  excel: ExcelData,
  idKey: string,
  idVal: string | number | bigint | boolean,
  expected: string | number | bigint | boolean | ((s: any) => boolean),
): string {
  const tmp = excel.find((e) => e[idKey] === idVal);
  if (!tmp) throw new Error(`getPropNameWithMatch: Did not find value for key`);
  const entry = Object.entries(tmp).find(
    ([key, value]) =>
      value === expected || (typeof expected === "function" && expected(value)),
  );
  if (!entry) {
    throw new Error(
      `getPropNameWithMatch: Did not find property for value ${expected}`,
    );
  }
  return entry[0];
}

export const ID = `ELKKIAIGOBK`;

// GCGCharExcelConfigData
export const NAME_TEXT_MAP_HASH = match(xchar, ID, 1101, 3061219907);
export const TAG_LIST = match(
  xchar,
  ID,
  1101,
  (s) => Array.isArray(s) && s[0] === "GCG_TAG_ELEMENT_CRYO",
);
export const SKILL_LIST = match(
  xchar,
  ID,
  1101,
  (s) => Array.isArray(s) && s[0] === 11011,
);
export const IS_CAN_OBTAIN = match(xchar, ID, 1101, true);
export const HP = match(xchar, ID, 1102, 10);
export const MAX_ENERGY = match(xchar, ID, 1102, 3);
export const IS_REMOVE_AFTER_DIE = match(xchar, ID, 3001, true); // 打手丘丘人

// GCGCardExcelConfigData
export const DESC_TEXT_MAP_HASH = match(xcard, ID, 211011, 3455646488);
export const DESC_ON_TABLE_TEXT_MAP_HASH = match(xcard, ID, 211011, 3891839149);
export const DESC_ON_TABLE_2_TEXT_MAP_HASH = match(
  xcard,
  ID,
  330005,
  3076893924,
);
export const CARD_TYPE = match(xcard, ID, 211011, "GCG_CARD_MODIFY");
export const CHOOSE_TARGET_LIST = match(
  xcard,
  ID,
  211011,
  (s) => Array.isArray(s) && s[0] === 11101,
);
export const COST_LIST = match(
  xcard,
  ID,
  211011,
  (s) => Array.isArray(s) && Object.values(s[0]).includes("GCG_COST_DICE_CRYO"),
);
export const STATE_BUFF_TYPE = match(xcard, ID, 111031, "GCG_STATE_BUFF_CRYO");
export const HINT_TYPE = match(xcard, ID, 111031, "GCG_HINT_CRYO");
export const TOKEN_TO_SHOW = match(xcard, ID, 111031, "GCG_TOKEN_LIFE");
export const BUFF_ICON_HASH = match(xcard, ID, 111031, 3032486446292491317n);
export const IS_HIDDEN = match(xcard, ID, 112044, true); // 断流

const icicle = xcard.find((e) => e[ID] === 111031)!; // 寒冰之棱
export const COST_TYPE = Object.keys(icicle[COST_LIST][0])[0]; // { "XXX": "GCG_COST_INVALID" }

// GCGChooseExcelConfigData
export const SKILL_ID = match(xchoose, CARD_TYPE, "GCG_CARD_CHARACTER", 101); // 料理 hint
export const TARGET_HINT_TEXT_MAP_HASH = match(
  xchoose,
  SKILL_ID,
  11101,
  3363485348,
);
export const TARGET_CAMP = match(xchoose, SKILL_ID, 11101, "FRIENDLY");

// GCGSkillExcelConfigData
export const SKILL_TAG_LIST = match(
  xskill,
  SKILL_ID,
  11011,
  (s) => Array.isArray(s) && s[0] === "GCG_SKILL_TAG_A",
);
export const SKILL_JSON = match(xskill, SKILL_ID, 11011, "Effect_Damage_Physic_2");
export const SKILL_ICON_HASH = match(xskill, SKILL_ID, 11011, 2636861745786031653n);

const normalSkill = xskill.find((e) => e[SKILL_ID] === 11011)!; // Character_A_Normal
export const COUNT = Object.entries(normalSkill[COST_LIST][0]).find(
  ([k, v]) => v === 1,
)![0];
// { "XXX": "GCG_COST_DICE_CRYO", "YYY": 1 }

// GCGDeckCardExcelConfigData
export const SHARE_ID = match(xdeckcard, ID, 1101, 1);
export const STORY_TITLE_TEXT_MAP_HASH = match(xdeckcard, ID, 1101, 1492288492);
export const STORY_DESC_TEXT_MAP_HASH = match(xdeckcard, ID, 1101, 753619631);
export const RELATED_CHARACTER_ID = match(xdeckcard, ID, 211011, 1101);
export const RELATED_CHARACTER_TAG_LIST = match(
  xdeckcard,
  ID,
  331101,
  (s) => Array.isArray(s) && s[0] === "GCG_TAG_ELEMENT_CRYO",
);

// GCGCardViewExcelConfigData
export const CARD_PREFAB_NAME = match(
  xcardview,
  ID,
  1101,
  "Gcg_CardFace_Char_Avatar_Ganyu",
);

// GCGKeywordExcelConfigData
export const TITLE_TEXT_MAP_HASH = match(xkeyword, ID, 1, 2540223917);

// GCGElementExcelConfigData
const xActivityFilmfestSniperPreview = getExcel(
  "ActivityFilmfestSniperPreviewExcelConfigData",
);
export const TYPE = match(
  xActivityFilmfestSniperPreview,
  ID,
  1,
  "SNIPER_PREVIEW_GADGET",
);
export const KEYWORD_ID = match(xelement, TYPE, "GCG_ELEMENT_CRYO", 101);

export const WANDERER_NAME_TEXT_MAP_HASH_VALUE = xavatar.find(
  (ele) => ele[ID] === 10000075,
)![NAME_TEXT_MAP_HASH];
