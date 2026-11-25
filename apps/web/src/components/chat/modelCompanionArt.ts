const characters = {
  opus: {
    headwear:
      "  *       *       *  \n  |\\     /|\\     /|  \n  | '--' | '--' |  \n  '==============='  ",
    mouth: "\\___/",
    emblem: "<>",
  },
  sonnet: {
    headwear: "    ___________    \n  .'  _______  '.  \n /  .'       '.  \\ \n[__]           [__]",
    mouth: "v",
    emblem: "[#]",
  },
  fable: {
    headwear: "        /\\        \n       / *\\       \n      /  * \\      \n  ___/______\\___  ",
    mouth: "~",
    emblem: "*",
  },
  haiku: {
    headwear:
      "  /\\           /\\  \n /  \\         /  \\ \n/    '-------'    \\\n                   ",
    mouth: "=v=",
    emblem: ":",
  },
  sol: {
    headwear: "   \\    |    /    \n    \\   |   /     \n --   .-----.   -- \n    /         \\   ",
    mouth: "\\_o_/",
    emblem: "[+]",
  },
  astra: {
    headwear:
      "        . + .       \n       --(*)--      \n          |         \n   .---=======---.  ",
    mouth: "v",
    emblem: "/\\",
  },
  terra: {
    headwear:
      "         _/\\_      \n     ___/    /      \n     \\___  /       \n         ||         ",
    mouth: "\\__/",
    emblem: "/Y\\",
  },
  luna: {
    headwear:
      "        .---.       \n       / .--'       \n       \\ '--.       \n  /\\    '---'   /\\ ",
    mouth: "=w=",
    emblem: "( )",
  },
  robot: {
    headwear:
      "         [*]        \n          |         \n      .-------.     \n      '-------'     ",
    mouth: "[=]",
    emblem: "{#}",
  },
} as const;

export function modelCharacterPortrait(model: string, label: string) {
  const family = (Object.keys(characters).find((key) =>
    `${model} ${label}`.toLowerCase().includes(key),
  ) ?? "robot") as keyof typeof characters;
  const fingerprint = Array.from(model).reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    0,
  );
  const version = /\d+(?:[.-]\d+)?/.exec(model)?.[0]?.replace("-", ".");
  return {
    ...characters[family],
    family,
    variant: fingerprint % 3,
    tag: version ?? fingerprint.toString(16).slice(0, 3),
  };
}
