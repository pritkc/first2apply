import { Link } from "../../../supabase/functions/_shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export function LinksList({ links }: { links: Link[] }) {
  return (
    <ul className="space-y-10">
      {links.map((link) => {
        return (
          <li key={link.id} className="flex items-center gap-4">
            <Avatar className="w-11 h-11">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>LI</AvatarFallback>
            </Avatar>

            <div className="flex-1 overflow-ellipsis">
              <p className="font-medium">{link.title}</p>
              <p className="text-xs text-muted-foreground">
                {link.url.slice(0, 50)}
              </p>
            </div>

            {/* actions */}
            <div className="flex items-center">
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
