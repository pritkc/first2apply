import Link from "next/link";
import { Button } from "./ui/button";

export function BottomCta() {
  return (
    <section
      id="bottom-cta"
      className="max-w-7xl mx-auto px-6 sm:px-10 pt-[10vh] md:pt-[20vh]"
    >
      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold md:text-center">
        Ready to get started?
      </h2>

      <p className="mt-2 sm:mt-6 md:mx-auto w-fit max-w-[600px] lg:max-w-[800px] md:text-center">
        Join 1000+ users who have already found their dream job with First 2
        Apply.
      </p>

      <Link href="/download" className="flex justify-center mt-6 md:mt-12">
        <Button size="lg" className="w-full xs:w-fit">
          Download for free
        </Button>
      </Link>
    </section>
  );
}
