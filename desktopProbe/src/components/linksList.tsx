import { Link } from "../../../supabase/functions/_shared/types";
import { useSites } from "@/hooks/sites";

import { openExternalUrl } from "@/lib/electronMainSdk";

import { TrashIcon } from "@radix-ui/react-icons";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

import ReactTimeAgo from "react-time-ago";
import { useMemo } from "react";

export function LinksList({
  links,
  onDeleteLink,
}: {
  links: Link[];
  onDeleteLink: (linkId: number) => void;
}) {
  const { siteLogos, sites } = useSites();
  const sitesMap = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites]);

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 2xl:gap-6 mt-4">
      {links.map((link) => {
        return (
          <li
            key={link.id}
            className="px-6 pt-8 pb-6 bg-card cursor-pointer border border-border shadow-sm rounded-lg flex flex-col gap-4"
            onClick={() => {
              openExternalUrl(link.url);
            }}
          >
            <div className="flex items-center gap-2">
              <Avatar
                className="w-12 h-12 cursor-pointer"
                onClick={() => {
                  openExternalUrl(link.url);
                }}
              >
                <AvatarImage src={siteLogos[link.site_id]} />
                <AvatarFallback className="text-xl tracking-wider">
                  LI
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-sm text-muted-foreground p-0">
                  {sitesMap.get(link.site_id)?.name}
                </p>
                <p className="text-lg leading-6 text-balance">{link.title}</p>
              </div>
            </div>

            <p className="text-xs grow break-all mt-6 mb-4 whitespace-pre-wrap text-muted-foreground font-light text-pretty">
              {link.url}
            </p>

            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/20 font-light">
                {"Added "}
                <ReactTimeAgo date={link.created_at} locale="en-US" />
              </p>

              {/* actions */}
              <Button
                variant="destructive"
                size="default"
                className="text-sm py-1 px-2 bg-destructive/10 rounded-full hover:bg-destructive/20 focus:bg-destructive/20 transition-colors duration-200 ease-in-out"
                onClick={(evt) => {
                  evt.stopPropagation();
                  onDeleteLink(link.id);
                }}
              >
                <TrashIcon className="w-5 h-5 text-destructive" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
