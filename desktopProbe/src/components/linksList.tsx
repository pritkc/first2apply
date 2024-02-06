import { Link } from "../../../supabase/functions/_shared/types";
import { useSites } from "@/hooks/sites";

import { openExternalUrl } from "@/lib/electronMainSdk";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export function LinksList({
  links,
  onDeleteLink,
}: {
  links: Link[];
  onDeleteLink: (linkId: number) => void;
}) {
  const { siteLogos } = useSites();

  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-medium tracking-wide">Your searches</h2>
      <hr className="w-full text-muted-foreground" />
      <ul className="space-y-6 pt-2">
        {links.map((link) => {
          return (
            <li
              key={link.id}
              className="flex items-center gap-4 justify-between"
            >
              <Avatar className="w-11 h-11">
                <AvatarImage src={siteLogos[link.site_id]} />
                <AvatarFallback>LI</AvatarFallback>
              </Avatar>

              <button
                className="flex-1 text-ellipsis overflow-hidden flex flex-col items-start"
                onClick={() => {
                  openExternalUrl(link.url);
                }}
              >
                <p className="text-lg">{link.title}</p>
                <p className="text-xs text-muted-foreground text-clip whitespace-nowrap font-extralight">
                  {link.url}
                </p>
              </button>

              {/* actions */}
              <div className="flex items-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteLink(link.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
