import { Link } from "../../../supabase/functions/_shared/types";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export function LinksList({
  links,
  onDeleteLink,
}: {
  links: Link[];
  onDeleteLink: (linkId: string) => void;
}) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-2xl font-medium tracking-wide">Your searches</h2>
        <p className="text-muted-foreground text-sm">
          Below, you'll find your previously saved searches. This is your
          command center to review and manage them as needed.
        </p>
      </div>
      <hr className="w-full text-muted-foreground" />
      <ul className="space-y-6 pt-2">
        {links.map((link) => {
          return (
            <li
              key={link.id}
              className="flex items-center gap-4 justify-between"
            >
              <Avatar className="w-11 h-11">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>LI</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-ellipsis overflow-hidden">
                <p className="font-medium">{link.title}</p>
                <p className="text-xs text-muted-foreground text-clip whitespace-nowrap">
                  {link.url}
                </p>
              </div>

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
