import Image from "next/image";
import { urlForImage } from "@/sanity/image";
import type { CastMember } from "@/sanity/types";

const roleBadge: Record<string, string> = {
  dm: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  player: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
};

export function CrewCard({ member }: { member: CastMember }) {
  const portraitUrl = urlForImage(member.portrait)
    .width(400)
    .height(400)
    .auto("format")
    .url();

  const hasCharacter = member.characterName || member.characterClass;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 p-6 text-center">
      <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-border">
        <Image
          src={portraitUrl}
          alt={member.portrait.alt ?? member.name}
          width={400}
          height={400}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-tight">{member.name}</h3>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${
            roleBadge[member.role] ?? roleBadge.player
          }`}
        >
          {member.role === "dm" ? "Dungeon Master" : "Player"}
        </span>
        {hasCharacter && (
          <p className="text-sm text-muted-foreground">
            {member.characterName}
            {member.characterName && member.characterClass && " · "}
            {member.characterClass}
          </p>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
    </div>
  );
}
