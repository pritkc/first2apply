import { DefaultLayout } from "@/components/defaultLayout";
import { Button } from "@/components/ui/button";
import { QuoteIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import trackBlackImage from "../../public/assets/track-black.png";
import trackWhiteImage from "../../public/assets/track-white.png";
import screenshotLight from "../../public/assets/screenshot-light.png";
import screenshotDark from "../../public/assets/screenshot-dark.png";

export default function Home() {
  return (
    <DefaultLayout>
      <section
        id="product"
        className="max-w-7xl h-[calc(50vh-56px)] md:h-[calc(50vh-64px)] mx-auto px-6 sm:px-10 w-full flex flex-col md:flex-row items-start md:items-end justify-end md:justify-between md:gap-10 lg:gap-20"
      >
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
          Stop waisting time manually browsing LinkedIn, Indeed, Dice or other
          job boards.
        </h2>

        <Button className="w-full max-w-72 lg:max-w-96 h-12 lg:h-14 text-xl lg:text-2xl self-center md:self-end my-[calc(10vh-64px)] md:my-0">
          Try it&nbsp;<span className="hidden lg:inline-block">now&nbsp;</span>
          for free
        </Button>
      </section>

      <section className="hidden md:block relative h-[50vh] bg-gradient-to-t from-muted dark:from-card/60 to-background">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-3">
          <h2 className="text-sm lg:text-base text-foreground/70">
            Stop waisting time manually browsing LinkedIn, Indeed, Dice or other
            job boards.
          </h2>

          <Image
            src={trackBlackImage}
            alt="paperfly track black"
            className="z-10 dark:hidden absolute top-2 md:left-1/2 md:-translate-x-1/2 h-auto lg:h-[40vh] max-h-[315px] w-96 lg:w-auto md:ml-28 lg:ml-8"
          />
          <Image
            src={trackWhiteImage}
            alt="paperfly track white"
            className="z-10 hidden dark:block absolute top-2 md:left-1/2 md:-translate-x-1/2 h-auto lg:h-[40vh] max-h-[315px] w-96 lg:w-auto md:ml-28 lg:ml-8"
          />
        </div>
      </section>

      <section className="md:relative md:-top-[20vh] max-w-5xl mx-auto rounded-2xl">
        <Image
          src={screenshotLight}
          alt="app homepage light"
          className="dark:hidden w-full h-auto"
        />
        <Image
          src={screenshotDark}
          alt="app homepage dark"
          className="hidden dark:block w-full h-auto"
        />
      </section>

      <section className="max-w-7xl mx-auto px-6 sm:px-10 min-h-screen">
        <h2 className="text-4xl font-semibold text-center">
          Stay Ahead of the Competition with First 2 Apply
        </h2>
      </section>

      <section className="bg-muted dark:bg-card/60">
        <div className="max-w-5xl mx-auto pt-40 pb-24">
          <QuoteIcon className="w-16 h-16 text-foreground/80" />
          <p className="text-xl px-16 text-balance">
            Helped me find a job within a few days of installing!
            <br />
            <br />
            After being able to only send out about 5-10 applications a day,
            which usually took me about 3 hours of parsing through a bunch of
            suggestions that simply weren't relevant to me, this app immensely
            increased my productivity! I was able to send out about 30-40
            applications most days, in the course of about 2 hours. It also
            found jobs that I would've otherwise not seen! But most importantly,
            it allowed me to be one of the first applicants (I believe I was
            within the first 5) to a particular job, which I am sure was
            instrumental in me then landing that position!
          </p>
          <QuoteIcon className="w-16 h-16 text-foreground/80 ml-auto" />

          <p className="mt-12 text-right font-semibold text-base leading-5">
            Source: MS Store Reviews
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
}
