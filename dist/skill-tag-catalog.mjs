// Generated from docs/skill-tag-registry.json. Tags are NOT executable numeric rules.
export const SKILL_TAG_CATALOG = {
  "1a101f308e1eaae6": {
    "id": "1a101f308e1eaae6",
    "name": "神圣光环",
    "text": "装备武器的攻击力和魔力数值+25%；装备两把武器时，两把武器分别生效。",
    "url": "https://altema.jp/lastcloudia/gino/176",
    "facets": [
      {
        "path": [
          "双手（双持）",
          "不限类型与属性"
        ],
        "scope": "clause",
        "sourceText": "装备两把武器时，两把武器分别生效。",
        "requirements": {
          "weaponCount": [
            2
          ],
          "weaponTypeRelation": "unrestricted",
          "weaponElementRelation": "unrestricted"
        }
      }
    ],
    "status": "partial",
    "labels": [
      "双手（双持） / 不限类型与属性"
    ]
  },
  "5ac756efac795660": {
    "id": "5ac756efac795660",
    "name": "二刀流",
    "text": "允许在防具栏位装备武器。装备两把武器时，物理攻击命中次数翻倍（单次伤害降至60%）。",
    "url": "https://altema.jp/lastcloudia/gino/181",
    "facets": [
      {
        "path": [
          "双手（双持）",
          "不限类型与属性"
        ],
        "scope": "clause",
        "sourceText": "装备两把武器时，物理攻击命中次数翻倍（单次伤害降至60%）。",
        "requirements": {
          "weaponCount": [
            2
          ],
          "weaponTypeRelation": "unrestricted",
          "weaponElementRelation": "unrestricted"
        }
      }
    ],
    "status": "partial",
    "labels": [
      "双手（双持） / 不限类型与属性"
    ]
  },
  "a805be70edade9bf": {
    "id": "a805be70edade9bf",
    "name": "生命鼓舞",
    "text": "自身剩余HP越低，攻击力提升越高（最高+50%）。",
    "url": "https://altema.jp/lastcloudia/gino/267",
    "facets": [
      {
        "path": [
          "濒死",
          "HP越低加成越高"
        ],
        "scope": "whole-skill",
        "sourceText": "自身剩余HP越低，攻击力提升越高（最高+50%）。",
        "requirements": {
          "hpDependency": "continuous-decreasing"
        },
        "calculationClass": "conditional-passive",
        "maximumPercent": 50,
        "formulaStatus": "pending",
        "note": "分类不设30%阈值，不把最高值当成固定值。"
      }
    ],
    "status": "partial",
    "labels": [
      "濒死 / HP越低加成越高"
    ]
  },
  "3e86dffa826956a7": {
    "id": "3e86dffa826956a7",
    "name": "魔兽同盟",
    "text": "队伍中至少2人装备「魔兽同盟」时，攻击力、防御力、魔力、魔抗提升（2人：5%；3人：10%；4人：15%）。",
    "url": "https://altema.jp/lastcloudia/gino/284",
    "facets": [
      {
        "path": [
          "多人",
          "同技能人数"
        ],
        "scope": "whole-skill",
        "sourceText": "队伍中至少2人装备「魔兽同盟」时，攻击力、防御力、魔力、魔抗提升（2人：5%；3人：10%；4人：15%）。",
        "requirements": {
          "partySkillId": "3e86dffa826956a7",
          "countIncludesSelf": true,
          "minimum": 2
        },
        "calculationClass": "conditional-passive",
        "percentByCount": {
          "2": 5,
          "3": 10,
          "4": 15
        }
      }
    ],
    "status": "partial",
    "labels": [
      "多人 / 同技能人数"
    ]
  },
  "4633d985390976cc": {
    "id": "4633d985390976cc",
    "name": "光头猴",
    "text": "当武器和防具栏位未装备任何物品时，攻击力、防御、 魔力和魔抗+10%。",
    "url": "https://altema.jp/lastcloudia/gino/304",
    "facets": [
      {
        "path": [
          "空手",
          "都空"
        ],
        "scope": "whole-skill",
        "sourceText": "当武器和防具栏位未装备任何物品时，攻击力、防御、 魔力和魔抗+10%。",
        "requirements": {
          "weaponCount": [
            0
          ],
          "armorEquipped": false
        },
        "calculationClass": "conditional-passive"
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 都空"
    ]
  },
  "28ccf85b5f31c394": {
    "id": "28ccf85b5f31c394",
    "name": "一天真刃",
    "text": "只装备一把武器时，物理攻击伤害+30%，物理攻击伤害上限+10,000。",
    "url": "https://altema.jp/lastcloudia/gino/327",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把武器时，物理攻击伤害+30%，物理攻击伤害上限+10,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "全部技能:all:304": {
    "id": "全部技能:all:304",
    "name": "两手枪",
    "text": "只装备一把枪类武器时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/365",
    "facets": [
      {
        "path": [
          "单手",
          "枪"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把枪类武器时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "枪"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 枪"
    ]
  },
  "全部技能:all:329": {
    "id": "全部技能:all:329",
    "name": "两手锤",
    "text": "只装备一把锤类武器时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/410",
    "facets": [
      {
        "path": [
          "单手",
          "锤"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把锤类武器时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "锤"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 锤"
    ]
  },
  "15ef9e047319adc5": {
    "id": "15ef9e047319adc5",
    "name": "两手剑",
    "text": "只装备一把剑时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/502",
    "facets": [
      {
        "path": [
          "单手",
          "剑"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把剑时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "剑"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 剑"
    ]
  },
  "05dffc8daf9a5872": {
    "id": "05dffc8daf9a5872",
    "name": "两手斧",
    "text": "只装备一把斧时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/556",
    "facets": [
      {
        "path": [
          "单手",
          "斧"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把斧时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "斧"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 斧"
    ]
  },
  "9d7ec20e8780822b": {
    "id": "9d7ec20e8780822b",
    "name": "两手爪",
    "text": "只装备一把爪时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/594",
    "facets": [
      {
        "path": [
          "单手",
          "爪"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把爪时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "爪"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 爪"
    ]
  },
  "bde3ce8d694af2ab": {
    "id": "bde3ce8d694af2ab",
    "name": "两手机械",
    "text": "只装备一把机械武器时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/619",
    "facets": [
      {
        "path": [
          "单手",
          "机械"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把机械武器时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "机械"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 机械"
    ]
  },
  "3f364d1ae44f839e": {
    "id": "3f364d1ae44f839e",
    "name": "两手剑增幅2",
    "text": "当只装备一把剑时，物理攻击和必杀伤害+20%，伤害上限+6,000。",
    "url": "https://altema.jp/lastcloudia/gino/777",
    "facets": [
      {
        "path": [
          "单手",
          "剑"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把剑时，物理攻击和必杀伤害+20%，伤害上限+6,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "剑"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 剑"
    ]
  },
  "6edebfe26dbf6ef3": {
    "id": "6edebfe26dbf6ef3",
    "name": "生命堡垒",
    "text": "你的剩余生命值越低，你的防御力就越高（最高+50%）。",
    "url": "https://altema.jp/lastcloudia/gino/788",
    "facets": [
      {
        "path": [
          "濒死",
          "HP越低加成越高"
        ],
        "scope": "whole-skill",
        "sourceText": "你的剩余生命值越低，你的防御力就越高（最高+50%）。",
        "requirements": {
          "hpDependency": "continuous-decreasing"
        },
        "calculationClass": "conditional-passive",
        "maximumPercent": 50,
        "formulaStatus": "pending",
        "note": "分类不设30%阈值，不把最高值当成固定值。"
      }
    ],
    "status": "partial",
    "labels": [
      "濒死 / HP越低加成越高"
    ]
  },
  "ce4c7604e001b0ed": {
    "id": "ce4c7604e001b0ed",
    "name": "两手剑增幅",
    "text": "当只装备一把剑时，物理攻击和必杀伤害+10%，伤害上限+3,000。",
    "url": "https://altema.jp/lastcloudia/gino/829",
    "facets": [
      {
        "path": [
          "单手",
          "剑"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把剑时，物理攻击和必杀伤害+10%，伤害上限+3,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "剑"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 剑"
    ]
  },
  "6952af1368802c34": {
    "id": "6952af1368802c34",
    "name": "一刀破坏者",
    "text": "仅装备1把武器时，物理攻击的Break值+100%。",
    "url": "https://altema.jp/lastcloudia/gino/850",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "whole-skill",
        "sourceText": "仅装备1把武器时，物理攻击的Break值+100%。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "4c3d40e4148fa790": {
    "id": "4c3d40e4148fa790",
    "name": "特技1极限突破",
    "text": "第1个特技伤害上限+2,000；仅装备一把武器时，效果提升至+4,000（左上方特技）。",
    "url": "https://altema.jp/lastcloudia/gino/866",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+4,000（左上方特技）。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "5837c3c5bd19cc83": {
    "id": "5837c3c5bd19cc83",
    "name": "两手剑增幅3",
    "text": "当只装备一把剑时，物理攻击和必杀伤害+30%，伤害上限+9,000。",
    "url": "https://altema.jp/lastcloudia/gino/901",
    "facets": [
      {
        "path": [
          "单手",
          "剑"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把剑时，物理攻击和必杀伤害+30%，伤害上限+9,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "剑"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 剑"
    ]
  },
  "105171fcac173ed9": {
    "id": "105171fcac173ed9",
    "name": "两手枪增幅",
    "text": "当只装备一把枪武器时，物理攻击和必杀 伤害+10%，伤害上限+3,000。",
    "url": "https://altema.jp/lastcloudia/gino/925",
    "facets": [
      {
        "path": [
          "单手",
          "枪"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把枪武器时，物理攻击和必杀 伤害+10%，伤害上限+3,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "枪"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 枪"
    ]
  },
  "d71dfc1292e7c678": {
    "id": "d71dfc1292e7c678",
    "name": "索迪安之力",
    "text": "当只装备一把剑时，与所装备武器属性相同的攻击伤 害增加 15%。",
    "url": "https://altema.jp/lastcloudia/gino/938",
    "facets": [
      {
        "path": [
          "单手",
          "剑"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把剑时，与所装备武器属性相同的攻击伤 害增加 15%。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "剑"
          ],
          "attackElementMatchesWeapon": true
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 剑"
    ]
  },
  "e822e4450ab4dcad": {
    "id": "e822e4450ab4dcad",
    "name": "特技2极限突破",
    "text": "第2个特技伤害上限+2,000；仅装备一把武器时，效果提升至+4,000（右上方特技）。",
    "url": "https://altema.jp/lastcloudia/gino/965",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+4,000（右上方特技）。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "22db4d8dd8dbfd9c": {
    "id": "22db4d8dd8dbfd9c",
    "name": "两手弓",
    "text": "只装备一把弓时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/977",
    "facets": [
      {
        "path": [
          "单手",
          "弓"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把弓时，物理攻击伤害+20%，暴击率+10%，物理攻击伤害上限+5,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "弓"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 弓"
    ]
  },
  "4b11acd40f6ed44f": {
    "id": "4b11acd40f6ed44f",
    "name": "光属性弱点突破2",
    "text": "使用光属性攻击命中弱点属性时，伤害上限+2,000；仅装备1把武器时，提升量变为+4,000。",
    "url": "https://altema.jp/lastcloudia/gino/1001",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+4,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "8ee1d245f7b403bc": {
    "id": "8ee1d245f7b403bc",
    "name": "两手机械增幅",
    "text": "只装备一把机械武器时，物理攻击和必杀伤害+10%，伤害上限+3,000。",
    "url": "https://altema.jp/lastcloudia/gino/1014",
    "facets": [
      {
        "path": [
          "单手",
          "机械"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把机械武器时，物理攻击和必杀伤害+10%，伤害上限+3,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "机械"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 机械"
    ]
  },
  "448a81c14ac59549": {
    "id": "448a81c14ac59549",
    "name": "暗属性弱点突破2",
    "text": "使用暗属性攻击命中弱点属性时，伤害上限+2,000；仅装备1把武器时，提升量变为+4,000。",
    "url": "https://altema.jp/lastcloudia/gino/1020",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+4,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "f00b7298670734fe": {
    "id": "f00b7298670734fe",
    "name": "特攻极限突破",
    "text": "触发特攻时，伤害上限+1,000；仅装备一把武器时，效果提升至+2,000。",
    "url": "https://altema.jp/lastcloudia/gino/1030",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+2,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "98c68a157e1b55ff": {
    "id": "98c68a157e1b55ff",
    "name": "炎属性弱点突破2",
    "text": "使用火属性攻击命中弱点属性时，伤害上限+2,000；仅装备1把武器时，提升量变为+4,000。",
    "url": "https://altema.jp/lastcloudia/gino/1038",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+4,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "21cb7e642833caf7": {
    "id": "21cb7e642833caf7",
    "name": "特技3极限突破",
    "text": "第3个特技伤害上限+2,000；仅装备一把武器时，效果提升至+4,000（左下方特技）。",
    "url": "https://altema.jp/lastcloudia/gino/1046",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+4,000（左下方特技）。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "0f9fbe87a80cc013": {
    "id": "0f9fbe87a80cc013",
    "name": "特攻极限突破2",
    "text": "触发特攻时，伤害上限+2,000；仅装备一把武器时，效果提升至+4,000。",
    "url": "https://altema.jp/lastcloudia/gino/1071",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+4,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "2d36845d899106f0": {
    "id": "2d36845d899106f0",
    "name": "树属性弱点突破",
    "text": "使用树属性攻击命中弱点属性时，伤害上限+1,000；仅装备1把武器时，提升量变为+2,000。",
    "url": "https://altema.jp/lastcloudia/gino/1079",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+2,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "5e9e49987bc80109": {
    "id": "5e9e49987bc80109",
    "name": "两手锤增幅2",
    "text": "当只装备一把锤子武器时，物理攻击和必杀伤 害+20%，伤害上限+6,000。",
    "url": "https://altema.jp/lastcloudia/gino/1109",
    "facets": [
      {
        "path": [
          "单手",
          "锤"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把锤子武器时，物理攻击和必杀伤 害+20%，伤害上限+6,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "锤"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 锤"
    ]
  },
  "ac908d277528e5bc": {
    "id": "ac908d277528e5bc",
    "name": "冰属性弱点突破2",
    "text": "使用冰属性攻击命中弱点属性时，伤害上限+2,000；仅装备1把武器时，提升量变为+4,000。",
    "url": "https://altema.jp/lastcloudia/gino/1110",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+4,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "f1b5060bde17e0e8": {
    "id": "f1b5060bde17e0e8",
    "name": "裸身坚韧",
    "text": "未装备防具时，防御力+20%。",
    "url": "https://altema.jp/lastcloudia/gino/1171",
    "facets": [
      {
        "path": [
          "空手",
          "空防具"
        ],
        "scope": "whole-skill",
        "sourceText": "未装备防具时，防御力+20%。",
        "requirements": {
          "armorEquipped": false
        },
        "calculationClass": "conditional-passive"
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 空防具"
    ]
  },
  "19e3a03542e896a2": {
    "id": "19e3a03542e896a2",
    "name": "雷属性弱点突破2",
    "text": "使用雷属性攻击命中弱点属性时，伤害上限+2,000；仅装备1把武器时，提升量变为+4,000。",
    "url": "https://altema.jp/lastcloudia/gino/1187",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+4,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "298a75e27246a317": {
    "id": "298a75e27246a317",
    "name": "徒手空拳",
    "text": "未装备武器时，物理攻击伤害+30%，伤害上限+10,000。",
    "url": "https://altema.jp/lastcloudia/gino/1206",
    "facets": [
      {
        "path": [
          "空手",
          "空武器"
        ],
        "scope": "whole-skill",
        "sourceText": "未装备武器时，物理攻击伤害+30%，伤害上限+10,000。",
        "requirements": {
          "weaponCount": [
            0
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 空武器"
    ]
  },
  "0257679d2708509b": {
    "id": "0257679d2708509b",
    "name": "和谐节拍",
    "text": "装备两把相同属性的武器时，所装备武器属性的特技和必杀伤害+15%，伤害上限+1,500。",
    "url": "https://altema.jp/lastcloudia/gino/1272",
    "facets": [
      {
        "path": [
          "双手（双持）",
          "同属性武器"
        ],
        "scope": "whole-skill",
        "sourceText": "装备两把相同属性的武器时，所装备武器属性的特技和必杀伤害+15%，伤害上限+1,500。",
        "requirements": {
          "weaponCount": [
            2
          ],
          "weaponTypeRelation": "unrestricted",
          "weaponElementRelation": "same",
          "attackElementMatchesWeapon": true
        }
      }
    ],
    "status": "partial",
    "labels": [
      "双手（双持） / 同属性武器"
    ]
  },
  "1519299bec222fca": {
    "id": "1519299bec222fca",
    "name": "立体机动心得",
    "text": "装备两把武器时，特技伤害+10%；从敌人背后攻击时，再+20%。",
    "url": "https://altema.jp/lastcloudia/gino/1295",
    "facets": [
      {
        "path": [
          "双手（双持）",
          "不限类型与属性"
        ],
        "scope": "whole-skill",
        "sourceText": "装备两把武器时，特技伤害+10%；从敌人背后攻击时，再+20%。",
        "requirements": {
          "weaponCount": [
            2
          ],
          "weaponTypeRelation": "unrestricted",
          "weaponElementRelation": "unrestricted"
        }
      }
    ],
    "status": "partial",
    "labels": [
      "双手（双持） / 不限类型与属性"
    ]
  },
  "1bb6b460e8a6c297": {
    "id": "1bb6b460e8a6c297",
    "name": "裸身心智",
    "text": "未装备防具时，魔抗+20%。",
    "url": "https://altema.jp/lastcloudia/gino/1306",
    "facets": [
      {
        "path": [
          "空手",
          "空防具"
        ],
        "scope": "whole-skill",
        "sourceText": "未装备防具时，魔抗+20%。",
        "requirements": {
          "armorEquipped": false
        },
        "calculationClass": "conditional-passive"
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 空防具"
    ]
  },
  "f5c157dab48c38c7": {
    "id": "f5c157dab48c38c7",
    "name": "裸身之力",
    "text": "未装备防具时，攻击力+20%。",
    "url": "https://altema.jp/lastcloudia/gino/1318",
    "facets": [
      {
        "path": [
          "空手",
          "空防具"
        ],
        "scope": "whole-skill",
        "sourceText": "未装备防具时，攻击力+20%。",
        "requirements": {
          "armorEquipped": false
        },
        "calculationClass": "conditional-passive"
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 空防具"
    ]
  },
  "cc874bcc3159e258": {
    "id": "cc874bcc3159e258",
    "name": "特攻极限突破3",
    "text": "特攻触发时，伤害上限+3,000；仅装备一把武器时，效果提升至+6,000。",
    "url": "https://altema.jp/lastcloudia/gino/1320",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+6,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "14f13262fec9119e": {
    "id": "14f13262fec9119e",
    "name": "雷属性弱点突破",
    "text": "使用雷属性攻击命中弱点属性时，伤害上限+1,000；仅装备1把武器时，提升量变为+2,000。",
    "url": "https://altema.jp/lastcloudia/gino/1326",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+2,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "c5f213214da57548": {
    "id": "c5f213214da57548",
    "name": "特技1极限突破2",
    "text": "第1个特技伤害上限+3,000；仅装备一把武器时，效果提升至+6,000（左上方特技）。",
    "url": "https://altema.jp/lastcloudia/gino/1352",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+6,000（左上方特技）。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "f88bb6ec201988e8": {
    "id": "f88bb6ec201988e8",
    "name": "两手锤增幅",
    "text": "当只装备一把锤子武器时，物理攻击和必杀伤 害+10%，伤害上限+3,000。",
    "url": "https://altema.jp/lastcloudia/gino/1369",
    "facets": [
      {
        "path": [
          "单手",
          "锤"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把锤子武器时，物理攻击和必杀伤 害+10%，伤害上限+3,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "锤"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 锤"
    ]
  },
  "9bba0f584207868a": {
    "id": "9bba0f584207868a",
    "name": "炎属性弱点突破",
    "text": "使用火属性攻击命中弱点属性时，伤害上限+1,000；仅装备1把武器时，提升量变为+2,000。",
    "url": "https://altema.jp/lastcloudia/gino/1379",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+2,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "980fc3c099f855ab": {
    "id": "980fc3c099f855ab",
    "name": "拳高阶增幅",
    "text": "未装备武器时，物理攻击伤害+30%。",
    "url": "https://altema.jp/lastcloudia/gino/1399",
    "facets": [
      {
        "path": [
          "空手",
          "空武器"
        ],
        "scope": "whole-skill",
        "sourceText": "未装备武器时，物理攻击伤害+30%。",
        "requirements": {
          "weaponCount": [
            0
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 空武器"
    ]
  },
  "7535b75bf589a4de": {
    "id": "7535b75bf589a4de",
    "name": "冰属性弱点突破",
    "text": "使用冰属性攻击命中弱点属性时，伤害上限+1,000；仅装备1把武器时，提升量变为+2,000。",
    "url": "https://altema.jp/lastcloudia/gino/1408",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+2,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "f80a686243715fb5": {
    "id": "f80a686243715fb5",
    "name": "两手枪增幅2",
    "text": "当仅装备一把枪武器时，物理攻击和必杀伤害+20%，伤害上限+6000。",
    "url": "https://altema.jp/lastcloudia/gino/1410",
    "facets": [
      {
        "path": [
          "单手",
          "枪"
        ],
        "scope": "whole-skill",
        "sourceText": "当仅装备一把枪武器时，物理攻击和必杀伤害+20%，伤害上限+6000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "枪"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 枪"
    ]
  },
  "0909ef13d95c0497": {
    "id": "0909ef13d95c0497",
    "name": "暗属性弱点突破",
    "text": "使用暗属性攻击命中弱点属性时，伤害上限+1,000；仅装备1把武器时，提升量变为+2,000。",
    "url": "https://altema.jp/lastcloudia/gino/1424",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+2,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "f28fd4eede5caea4": {
    "id": "f28fd4eede5caea4",
    "name": "女王乱舞",
    "text": "濒死时发动特技，伤害+30%、伤害上限+15,000；仅装备一把武器时，伤害上限提升至+30,000。",
    "url": "https://altema.jp/lastcloudia/gino/1427",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，伤害上限提升至+30,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "5b4ee2cab67374b7": {
    "id": "5b4ee2cab67374b7",
    "name": "拳破坏者",
    "text": "未装备武器时，Break值+100%。",
    "url": "https://altema.jp/lastcloudia/gino/1458",
    "facets": [
      {
        "path": [
          "空手",
          "空武器"
        ],
        "scope": "whole-skill",
        "sourceText": "未装备武器时，Break值+100%。",
        "requirements": {
          "weaponCount": [
            0
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 空武器"
    ]
  },
  "9d60989a10027525": {
    "id": "9d60989a10027525",
    "name": "拳超阶增幅",
    "text": "未装备武器时，物理攻击伤害+30%，物理攻击伤害上限+2,000。",
    "url": "https://altema.jp/lastcloudia/gino/1460",
    "facets": [
      {
        "path": [
          "空手",
          "空武器"
        ],
        "scope": "whole-skill",
        "sourceText": "未装备武器时，物理攻击伤害+30%，物理攻击伤害上限+2,000。",
        "requirements": {
          "weaponCount": [
            0
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 空武器"
    ]
  },
  "b01d5a17adf13b59": {
    "id": "b01d5a17adf13b59",
    "name": "裸身头脑",
    "text": "未装备防具时，魔力+20%。",
    "url": "https://altema.jp/lastcloudia/gino/1461",
    "facets": [
      {
        "path": [
          "空手",
          "空防具"
        ],
        "scope": "whole-skill",
        "sourceText": "未装备防具时，魔力+20%。",
        "requirements": {
          "armorEquipped": false
        },
        "calculationClass": "conditional-passive"
      }
    ],
    "status": "partial",
    "labels": [
      "空手 / 空防具"
    ]
  },
  "835e1d7e70f4a6d3": {
    "id": "835e1d7e70f4a6d3",
    "name": "两手斧增幅2",
    "text": "只装备一把斧时，物理攻击和必杀伤害+20%，伤害上限+6,000。",
    "url": "https://altema.jp/lastcloudia/gino/1484",
    "facets": [
      {
        "path": [
          "单手",
          "斧"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把斧时，物理攻击和必杀伤害+20%，伤害上限+6,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "斧"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 斧"
    ]
  },
  "b59538669bf4ade7": {
    "id": "b59538669bf4ade7",
    "name": "一枪流-闪月-",
    "text": "只装备一把枪时，触发特攻时伤害+20%，攻击敌人弱点属性时伤害+20%。",
    "url": "https://altema.jp/lastcloudia/gino/1516",
    "facets": [
      {
        "path": [
          "单手",
          "枪"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把枪时，触发特攻时伤害+20%，攻击敌人弱点属性时伤害+20%。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "枪"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 枪"
    ]
  },
  "3323da6f1691908a": {
    "id": "3323da6f1691908a",
    "name": "捣年糕大师",
    "text": "允许装备锤。只装备一把武器时，有概率使物理攻击伤害上限+20,000。",
    "url": "https://altema.jp/lastcloudia/gino/1518",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "只装备一把武器时，有概率使物理攻击伤害上限+20,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "全部技能:all:791": {
    "id": "全部技能:all:791",
    "name": "光属性弱点突破",
    "text": "当使用光属性并利用弱点时，伤害上限增加 1000。 当只装备一把武器时，效果增加到 2000。",
    "url": "https://altema.jp/lastcloudia/gino/1556",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "当只装备一把武器时，效果增加到 2000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "810e5630e720f446": {
    "id": "810e5630e720f446",
    "name": "VISIONS of MANA",
    "text": "当只装备一把武器时，与所装备武器属性相同的攻击 伤害增加 20%，伤害上限增加 2,000",
    "url": "https://altema.jp/lastcloudia/gino/1573",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把武器时，与所装备武器属性相同的攻击 伤害增加 20%，伤害上限增加 2,000",
        "requirements": {
          "weaponCount": [
            1
          ],
          "attackElementMatchesWeapon": true
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "492069f33fad559b": {
    "id": "492069f33fad559b",
    "name": "暗属性驱动极限突破",
    "text": "暗属性物理攻击与必杀伤害上限+1,500；仅装备1把武器或未装备武器时，提升量变为+3,000。",
    "url": "https://altema.jp/lastcloudia/gino/1603",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器或未装备武器时，提升量变为+3,000。",
        "requirements": {
          "weaponCount": [
            0,
            1
          ]
        }
      },
      {
        "path": [
          "空手",
          "空武器"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器或未装备武器时，提升量变为+3,000。",
        "requirements": {
          "weaponCount": [
            0,
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型",
      "空手 / 空武器"
    ]
  },
  "4c25a005372c0d24": {
    "id": "4c25a005372c0d24",
    "name": "同类二刀增幅",
    "text": "装备两把相同武器类型的武器时，物理攻击伤害+5%，伤害上限+1,000。",
    "url": "https://altema.jp/lastcloudia/gino/1615",
    "facets": [
      {
        "path": [
          "双手（双持）",
          "同类武器"
        ],
        "scope": "whole-skill",
        "sourceText": "装备两把相同武器类型的武器时，物理攻击伤害+5%，伤害上限+1,000。",
        "requirements": {
          "weaponCount": [
            2
          ],
          "weaponTypeRelation": "same",
          "weaponElementRelation": "unrestricted"
        }
      }
    ],
    "status": "partial",
    "labels": [
      "双手（双持） / 同类武器"
    ]
  },
  "2ae3c62f62930431": {
    "id": "2ae3c62f62930431",
    "name": "特技2极限突破2",
    "text": "第2个特技伤害上限+3,000；仅装备一把武器时，效果提升至+6,000（右上方特技）。",
    "url": "https://altema.jp/lastcloudia/gino/1637",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+6,000（右上方特技）。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "d268368f04c8f840": {
    "id": "d268368f04c8f840",
    "name": "荒神御魂",
    "text": "HP-15%，但对BOSS的物理攻击伤害上限+3,000；仅装备一把武器或未装备武器时，再+3,000。",
    "url": "https://altema.jp/lastcloudia/gino/1651",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器或未装备武器时，再+3,000。",
        "requirements": {
          "weaponCount": [
            0,
            1
          ]
        }
      },
      {
        "path": [
          "空手",
          "空武器"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器或未装备武器时，再+3,000。",
        "requirements": {
          "weaponCount": [
            0,
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型",
      "空手 / 空武器"
    ]
  },
  "0725be276a780aef": {
    "id": "0725be276a780aef",
    "name": "特攻极限突破4",
    "text": "触发特攻时，伤害上限+5,000；仅装备一把武器时，效果提升至+10,000。",
    "url": "https://altema.jp/lastcloudia/gino/1655",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+10,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "7fae80d83cb7551a": {
    "id": "7fae80d83cb7551a",
    "name": "Zero之骑士",
    "text": "装备两把武器时，特技和必杀伤害+15%。",
    "url": "https://altema.jp/lastcloudia/gino/1658",
    "facets": [
      {
        "path": [
          "双手（双持）",
          "不限类型与属性"
        ],
        "scope": "whole-skill",
        "sourceText": "装备两把武器时，特技和必杀伤害+15%。",
        "requirements": {
          "weaponCount": [
            2
          ],
          "weaponTypeRelation": "unrestricted",
          "weaponElementRelation": "unrestricted"
        }
      }
    ],
    "status": "partial",
    "labels": [
      "双手（双持） / 不限类型与属性"
    ]
  },
  "ca339383e4f1f6f6": {
    "id": "ca339383e4f1f6f6",
    "name": "两手斧增幅",
    "text": "只装备一把斧时，物理攻击和必杀伤害+10%，伤害上限+3,000。",
    "url": "https://altema.jp/lastcloudia/gino/1689",
    "facets": [
      {
        "path": [
          "单手",
          "斧"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备一把斧时，物理攻击和必杀伤害+10%，伤害上限+3,000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "斧"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 斧"
    ]
  },
  "a92f6001f2419fda": {
    "id": "a92f6001f2419fda",
    "name": "剑雷",
    "text": "当只装备一把剑时，攻击力+20%，物理攻击伤害上限+3000，对弱雷属性的敌人伤害上限+3000。",
    "url": "https://altema.jp/lastcloudia/gino/1727",
    "facets": [
      {
        "path": [
          "单手",
          "剑"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把剑时，攻击力+20%，物理攻击伤害上限+3000，对弱雷属性的敌人伤害上限+3000。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "剑"
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 剑"
    ]
  },
  "2832becd6721150f": {
    "id": "2832becd6721150f",
    "name": "致命撕裂者",
    "text": "当只装备一把武器时，对濒死敌人的物理攻击伤害增加 30%，伤害上限增加 15,000。",
    "url": "https://altema.jp/lastcloudia/gino/1744",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "whole-skill",
        "sourceText": "当只装备一把武器时，对濒死敌人的物理攻击伤害增加 30%，伤害上限增加 15,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "ee807560b8e94ab2": {
    "id": "ee807560b8e94ab2",
    "name": "两手驱动「斧枪机械」",
    "text": "只装备斧、枪或机械中的一把武器时，与所装备武器属性相同的攻击伤害+15%。",
    "url": "https://altema.jp/lastcloudia/gino/1746",
    "facets": [
      {
        "path": [
          "单手",
          "斧"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备斧、枪或机械中的一把武器时，与所装备武器属性相同的攻击伤害+15%。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "斧",
            "枪",
            "机械"
          ],
          "attackElementMatchesWeapon": true
        }
      },
      {
        "path": [
          "单手",
          "枪"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备斧、枪或机械中的一把武器时，与所装备武器属性相同的攻击伤害+15%。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "斧",
            "枪",
            "机械"
          ],
          "attackElementMatchesWeapon": true
        }
      },
      {
        "path": [
          "单手",
          "机械"
        ],
        "scope": "whole-skill",
        "sourceText": "只装备斧、枪或机械中的一把武器时，与所装备武器属性相同的攻击伤害+15%。",
        "requirements": {
          "weaponCount": [
            1
          ],
          "weaponTypes": [
            "斧",
            "枪",
            "机械"
          ],
          "attackElementMatchesWeapon": true
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 斧",
      "单手 / 枪",
      "单手 / 机械"
    ]
  },
  "73530ee6f38ccc34": {
    "id": "73530ee6f38ccc34",
    "name": "谨慎且大胆！",
    "text": "移动速度-1，特技的Break值+30%；仅装备1把武器时，Break值再+30%。",
    "url": "https://altema.jp/lastcloudia/gino/1764",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，Break值再+30%。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "72987eef01fbda4b": {
    "id": "72987eef01fbda4b",
    "name": "冰属性驱动极限突破",
    "text": "冰属性物理攻击与必杀伤害上限+1,500；仅装备1把武器或未装备武器时，提升量变为+3,000。",
    "url": "https://altema.jp/lastcloudia/gino/1774",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器或未装备武器时，提升量变为+3,000。",
        "requirements": {
          "weaponCount": [
            0,
            1
          ]
        }
      },
      {
        "path": [
          "空手",
          "空武器"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器或未装备武器时，提升量变为+3,000。",
        "requirements": {
          "weaponCount": [
            0,
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型",
      "空手 / 空武器"
    ]
  },
  "44a3d9148279023c": {
    "id": "44a3d9148279023c",
    "name": "树属性弱点突破2",
    "text": "使用树属性攻击命中弱点属性时，伤害上限+2,000；仅装备1把武器时，提升量变为+4,000。",
    "url": "https://altema.jp/lastcloudia/gino/1829",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+4,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "bc94425edcde5d97": {
    "id": "bc94425edcde5d97",
    "name": "霸幻双刃",
    "text": "装备两把武器时，特技伤害+20%、伤害上限+5,000；对Boss的特技伤害上限另+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/1830",
    "facets": [
      {
        "path": [
          "双手（双持）",
          "不限类型与属性"
        ],
        "scope": "whole-skill",
        "sourceText": "装备两把武器时，特技伤害+20%、伤害上限+5,000；对Boss的特技伤害上限另+5,000。",
        "requirements": {
          "weaponCount": [
            2
          ],
          "weaponTypeRelation": "unrestricted",
          "weaponElementRelation": "unrestricted"
        }
      }
    ],
    "status": "partial",
    "labels": [
      "双手（双持） / 不限类型与属性"
    ]
  },
  "03a679c6deeb2898": {
    "id": "03a679c6deeb2898",
    "name": "特技3极限突破2",
    "text": "第3个特技伤害上限+3,000；仅装备一把武器时，效果提升至+6,000（左下方特技）。",
    "url": "https://altema.jp/lastcloudia/gino/1846",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，效果提升至+6,000（左下方特技）。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "16e16b5e64f54f5c": {
    "id": "16e16b5e64f54f5c",
    "name": "光属性弱点突破3",
    "text": "使用光属性攻击命中弱点属性时，伤害上限+3,000；仅装备1把武器时，提升量变为+6,000。",
    "url": "https://altema.jp/lastcloudia/gino/1857",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+6,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "3159ed767f08fdf1": {
    "id": "3159ed767f08fdf1",
    "name": "炎属性弱点突破3",
    "text": "使用火属性攻击命中弱点属性时，伤害上限+3,000；仅装备1把武器时，提升量变为+6,000。",
    "url": "https://altema.jp/lastcloudia/gino/1882",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备1把武器时，提升量变为+6,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "9efcdc31fa117787": {
    "id": "9efcdc31fa117787",
    "name": "无法抗拒的力量洪流",
    "text": "使用攻击型特技时，消耗最大HP的15%，使伤害上限+5,000；仅装备一把武器时，再+5,000。",
    "url": "https://altema.jp/lastcloudia/gino/1914",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，再+5,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  },
  "899aa4edeab83540": {
    "id": "899aa4edeab83540",
    "name": "勇者前线",
    "text": "发动物理攻击或必杀时，以攻击力+30%的状态计算伤害。对Boss的物理攻击和必杀伤害上限+10,000；仅装备一把武器时，再+10,000。",
    "url": "https://altema.jp/lastcloudia/gino/1955",
    "facets": [
      {
        "path": [
          "单手",
          "不限武器类型"
        ],
        "scope": "clause",
        "sourceText": "仅装备一把武器时，再+10,000。",
        "requirements": {
          "weaponCount": [
            1
          ]
        }
      }
    ],
    "status": "partial",
    "labels": [
      "单手 / 不限武器类型"
    ]
  }
};
export const SKILL_TAG_ALIASES = {
  "1a101f308e1eaae6": "1a101f308e1eaae6",
  "5ac756efac795660": "5ac756efac795660",
  "a805be70edade9bf": "a805be70edade9bf",
  "3e86dffa826956a7": "3e86dffa826956a7",
  "4633d985390976cc": "4633d985390976cc",
  "28ccf85b5f31c394": "28ccf85b5f31c394",
  "全部技能:all:304": "全部技能:all:304",
  "全部技能:all:329": "全部技能:all:329",
  "15ef9e047319adc5": "15ef9e047319adc5",
  "05dffc8daf9a5872": "05dffc8daf9a5872",
  "9d7ec20e8780822b": "9d7ec20e8780822b",
  "bde3ce8d694af2ab": "bde3ce8d694af2ab",
  "3f364d1ae44f839e": "3f364d1ae44f839e",
  "6edebfe26dbf6ef3": "6edebfe26dbf6ef3",
  "ce4c7604e001b0ed": "ce4c7604e001b0ed",
  "6952af1368802c34": "6952af1368802c34",
  "4c3d40e4148fa790": "4c3d40e4148fa790",
  "5837c3c5bd19cc83": "5837c3c5bd19cc83",
  "105171fcac173ed9": "105171fcac173ed9",
  "d71dfc1292e7c678": "d71dfc1292e7c678",
  "e822e4450ab4dcad": "e822e4450ab4dcad",
  "22db4d8dd8dbfd9c": "22db4d8dd8dbfd9c",
  "4b11acd40f6ed44f": "4b11acd40f6ed44f",
  "8ee1d245f7b403bc": "8ee1d245f7b403bc",
  "448a81c14ac59549": "448a81c14ac59549",
  "f00b7298670734fe": "f00b7298670734fe",
  "98c68a157e1b55ff": "98c68a157e1b55ff",
  "21cb7e642833caf7": "21cb7e642833caf7",
  "0f9fbe87a80cc013": "0f9fbe87a80cc013",
  "2d36845d899106f0": "2d36845d899106f0",
  "5e9e49987bc80109": "5e9e49987bc80109",
  "ac908d277528e5bc": "ac908d277528e5bc",
  "f1b5060bde17e0e8": "f1b5060bde17e0e8",
  "19e3a03542e896a2": "19e3a03542e896a2",
  "298a75e27246a317": "298a75e27246a317",
  "0257679d2708509b": "0257679d2708509b",
  "1519299bec222fca": "1519299bec222fca",
  "1bb6b460e8a6c297": "1bb6b460e8a6c297",
  "f5c157dab48c38c7": "f5c157dab48c38c7",
  "cc874bcc3159e258": "cc874bcc3159e258",
  "14f13262fec9119e": "14f13262fec9119e",
  "c5f213214da57548": "c5f213214da57548",
  "f88bb6ec201988e8": "f88bb6ec201988e8",
  "9bba0f584207868a": "9bba0f584207868a",
  "980fc3c099f855ab": "980fc3c099f855ab",
  "7535b75bf589a4de": "7535b75bf589a4de",
  "f80a686243715fb5": "f80a686243715fb5",
  "0909ef13d95c0497": "0909ef13d95c0497",
  "f28fd4eede5caea4": "f28fd4eede5caea4",
  "5b4ee2cab67374b7": "5b4ee2cab67374b7",
  "9d60989a10027525": "9d60989a10027525",
  "b01d5a17adf13b59": "b01d5a17adf13b59",
  "835e1d7e70f4a6d3": "835e1d7e70f4a6d3",
  "b59538669bf4ade7": "b59538669bf4ade7",
  "3323da6f1691908a": "3323da6f1691908a",
  "全部技能:all:791": "全部技能:all:791",
  "810e5630e720f446": "810e5630e720f446",
  "492069f33fad559b": "492069f33fad559b",
  "4c25a005372c0d24": "4c25a005372c0d24",
  "2ae3c62f62930431": "2ae3c62f62930431",
  "d268368f04c8f840": "d268368f04c8f840",
  "0725be276a780aef": "0725be276a780aef",
  "7fae80d83cb7551a": "7fae80d83cb7551a",
  "ca339383e4f1f6f6": "ca339383e4f1f6f6",
  "a92f6001f2419fda": "a92f6001f2419fda",
  "2832becd6721150f": "2832becd6721150f",
  "ee807560b8e94ab2": "ee807560b8e94ab2",
  "73530ee6f38ccc34": "73530ee6f38ccc34",
  "72987eef01fbda4b": "72987eef01fbda4b",
  "44a3d9148279023c": "44a3d9148279023c",
  "bc94425edcde5d97": "bc94425edcde5d97",
  "03a679c6deeb2898": "03a679c6deeb2898",
  "16e16b5e64f54f5c": "16e16b5e64f54f5c",
  "3159ed767f08fdf1": "3159ed767f08fdf1",
  "9efcdc31fa117787": "9efcdc31fa117787",
  "899aa4edeab83540": "899aa4edeab83540",
  "ca04f0c739a8d9c2": "全部技能:all:304",
  "ad06a04fbb95cf5b": "全部技能:all:329",
  "5a0f83c4311d7755": "a805be70edade9bf",
  "ab2b32b120b7a2b9": "3e86dffa826956a7",
  "95dd0a8d4a905d5a": "3e86dffa826956a7",
  "525d02a27541baf0": "3323da6f1691908a",
  "1de8a34e8bb4dde1": "全部技能:all:791",
  "647b2c1ee70f31f0": "899aa4edeab83540",
  "配合:right:4": "4c25a005372c0d24",
  "伤害上限:left:95": "全部技能:all:791"
};
