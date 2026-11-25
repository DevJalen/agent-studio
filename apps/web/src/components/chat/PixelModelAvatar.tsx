import { modelCharacterPortrait } from "./modelCompanionArt";
import type { CompanionState } from "./ModelCompanion";

const colors: Record<string, string> = {
  fable: "#a77bfa",
  opus: "#f3a16f",
  sonnet: "#f0bf76",
  haiku: "#ed93b6",
  sol: "#4cdbb0",
  astra: "#83aaff",
  terra: "#9acb72",
  luna: "#b5a1f5",
  robot: "#87c8d9",
};

export function PixelModelAvatar({
  model,
  label = model,
  state = "idle",
}: {
  model: string;
  label?: string;
  state?: CompanionState;
}) {
  const { family, variant } = modelCharacterPortrait(model, label);
  const waiting = state === "approval" || state === "input";
  return (
    <svg
      viewBox="0 0 160 152"
      aria-hidden
      className="block size-full overflow-visible"
      shapeRendering="crispEdges"
      data-character={family}
    >
      <g data-companion-head className="origin-center" fill={colors[family]}>
        <path opacity="0.2" d="M24 75h112v60H24zM34 135h92v8H34z" />
        {family === "fable" ? (
          <>
            <path d="M34 62V52h10V40h10V28h10V16h12V6h22v8h14v8h12v9h-24v12h10v13h17v8z" />
            <path
              fill="var(--color-studio-purple-shadow)"
              d="M76 16h10v12H76zM54 40h44v8H54zM44 52h66v10H44z"
            />
            <path fill="var(--color-studio-gold)" d="M80 24h6v8h8v6h-8v8h-6v-8h-8v-6h8z" />
            <path d="M24 62h112v8H24zM16 70h128v8H16z" />
          </>
        ) : family === "opus" ? (
          <>
            <path d="M36 30h10v14h16V24h12v20h16V24h12v20h16V30h10v32H36z" />
            <path fill="var(--color-studio-gold)" d="M42 54h80v6H42zM68 16h8v8h-8zM90 16h8v8h-8z" />
          </>
        ) : family === "sonnet" ? (
          <>
            <path d="M34 42h8V32h76v10h8v48h-10V44H44v46H34z" />
            <path d="M14 79h14v38H14zM132 79h14v38h-14zM119 112h15v7h-15z" />
          </>
        ) : family === "haiku" || family === "luna" ? (
          <>
            <path d="M28 70V34h10v9h10v12h14v15zM98 70V55h14V43h10v-9h10v36z" />
            <path fill="var(--color-studio-blush)" d="M34 47h6v10h9v7H34zM112 57h8V47h6v17h-14z" />
            {family === "luna" ? (
              <path fill="var(--color-studio-gold)" d="M77 21h20v7H83v19h14v7H77v-7h-7V28h7z" />
            ) : null}
          </>
        ) : family === "sol" ? (
          <>
            <path d="M76 22h8v20h-8zM42 28h8v8h8v8h-8v-8h-8zM110 28h8v8h-8v8h-8v-8h8zM14 50h20v8H14zM126 50h20v8h-20z" />
            <path fill="var(--color-studio-gold)" d="M65 43h30v8H65z" />
          </>
        ) : family === "terra" ? (
          <>
            <path d="M76 60V38h-8V26h-8v-9h22v8h8v24h-8v11zM86 40V25h10V15h23v13h-10v9H96v8z" />
          </>
        ) : family === "astra" ? (
          <>
            <path d="M77 32h6v28h-6zM68 23h24v9H68zM73 17h14v21H73zM20 56h120v6H20z" />
            <path fill="var(--color-studio-gold)" d="M125 34h6v16h-6zM120 39h16v6h-16z" />
          </>
        ) : (
          <>
            <path d="M77 30h6v31h-6zM68 22h24v14H68z" />
            <path fill="var(--color-studio-cream)" d="M75 25h10v6H75z" />
          </>
        )}
        <path d="M32 65h96v8h10v10h8v40h-8v12h-10v8H32v-8H22v-12h-8V83h8V73h10z" />
        <path fill="var(--color-studio-face)" d="M34 73h92v8h10v42h-10v12H34v-12H24V83h10z" />
        <path fill="var(--color-studio-cream)" opacity="0.15" d="M34 73h92v5H34zM24 83h5v36h-5z" />
        {[44, 94].map((x) => (
          <g key={x} transform={`translate(${x} 85)`}>
            <g data-companion-eye className="origin-center [transform-box:fill-box]">
              <path fill="var(--color-studio-cream)" d="M4 0h20v4h4v28h-4v4H4v-4H0V4h4z" />
              {waiting || state === "error" ? (
                <text
                  x="14"
                  y="26"
                  textAnchor="middle"
                  fill="var(--color-studio-face)"
                  fontSize="26"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {waiting ? "?" : "!"}
                </text>
              ) : (
                <g data-companion-pupil>
                  <path
                    fill="var(--color-studio-ink)"
                    d={`M${8 + variant} 6h12v23H${8 + variant}z`}
                  />
                  <path
                    fill="var(--color-studio-cream)"
                    d={`M${9 + variant} 7h5v7H${9 + variant}z`}
                  />
                </g>
              )}
            </g>
          </g>
        ))}
        <path
          fill="var(--color-studio-cream)"
          d={
            waiting
              ? "M76 121h8v8h-8z"
              : state === "error"
                ? "M72 125h16v4H72z"
                : "M72 120h5v5h8v-5h5v9H72z"
          }
        />
        <path
          fill="var(--color-studio-blush)"
          opacity="0.75"
          d="M35 119h12v5H35zM114 119h12v5h-12z"
        />
      </g>
    </svg>
  );
}
