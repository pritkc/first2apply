import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import trackBlackImage from "../../public/assets/track-black.png";
import trackWhiteImage from "../../public/assets/track-white.png";

export function ProductSection() {
  return (
    <section id="product">
      <div className="w-full max-w-7xl h-[calc(55vh-56px)] md:h-[calc(50vh-64px)] mx-auto px-6 sm:px-10 flex flex-col md:flex-row items-start md:items-end justify-end md:justify-between md:gap-10 lg:gap-20">
        <div id="embed02" className="absolute top-20 md:top-[calc(25vh-27px)]">
          <a
            href="https://www.producthunt.com/posts/first-2-apply?utm_source=badge-featured&amp;utm_medium=badge&amp;utm_souce=badge-first-2-apply"
            target="_blank"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=443975&amp;theme=dark"
              alt="First 2 Apply - New job alerts from 10+ most popular sites  | Product Hunt"
              width="250"
              height="54"
            />
          </a>
        </div>

        <h1 className="z-10 text-3xl sm:text-5xl lg:text-6xl font-semibold md:text-nowrap">
          New job alerts from&nbsp;
          <br className="hidden md:inline-block" />
          10+ most popular sites.
        </h1>

        <h2 className="md:hidden text-sm text-foreground/70 mt-2">
          Land more interviews by being the first to know when new jobs are
          posted.&nbsp;
          <br className="hidden sm:inline-block" />
          Stop wasting time manually browsing LinkedIn, Indeed, Dice or other
          job boards.
        </h2>

        <Link href="/download" passHref className="self-center md:self-end">
          <Button className="w-full max-w-72 lg:max-w-96 h-12 lg:h-14 text-xl lg:text-2xl my-[calc(10vh-64px)] md:my-0">
            Try it&nbsp;
            <span className="md:hidden lg:inline-block">now&nbsp;</span>
            for free
          </Button>
        </Link>
      </div>

      <div className="hidden md:block relative h-[50vh] bg-gradient-to-t from-muted dark:from-card/60 to-background">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-3">
          <h2 className="text-md lg:text-lg text-foreground/70">
            Land more interviews by being the first to know when new jobs are
            posted.
            <br />
            Stop wasting time manually browsing LinkedIn, Indeed, Dice or other
            job boards.
          </h2>

          <Image
            src={trackBlackImage}
            alt="paperfly track black"
            priority={true}
            className="z-10 dark:hidden absolute top-2 md:left-1/2 md:-translate-x-1/2 h-auto lg:h-[40vh] max-h-[315px] w-96 lg:w-auto md:ml-40 lg:ml-44"
          />
          <Image
            src={trackWhiteImage}
            alt="paperfly track white"
            priority={true}
            className="z-10 hidden dark:block absolute top-2 md:left-1/2 md:-translate-x-1/2 h-auto lg:h-[40vh] max-h-[315px] w-96 lg:w-auto md:ml-40 lg:ml-44"
          />
        </div>
      </div>

      <div className="md:relative md:-top-[20vh] mx-auto max-w-5xl min-h-fit overflow-hidden px-6 md:px-10">
        <iframe
          className="h-[250px] xs:h-[350px] sm:h-[500px] md:h-[550px] lg:h-[662px] rounded-2xl shadow-lg"
          width="100%"
          height="720"
          src="https://www.youtube.com/embed/hllcJSWBLA4?si=fncyozEeydbHb_zq"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
}
