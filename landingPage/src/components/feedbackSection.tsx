import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  QuoteIcon,
} from "@radix-ui/react-icons";

type Review = {
  title: string;
  details: string;
  source: string;
};

const reviews: Review[] = [
  {
    title: "Helped me find a job within a few days of installing!",
    details:
      "After being able to only send out about 5-10 applications a day, which usually took me about 3 hours of parsing through a bunch of suggestions that simply weren't relevant to me, this app immensely increased my productivity! I was able to send out about 30-40 applications most days, in the course of about 2 hours. It also found jobs that I would've otherwise not seen! But most importantly, it allowed me to be one of the first applicants (I believe I was within the first 5) to a particular job, which I am sure was instrumental in me then landing that position!",
    source: "MS Store Reviews",
  },
];

export function FeedbackSection() {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const handleNextReview = () => {
    setCurrentReviewIndex((currentReviewIndex + 1) % reviews.length);
  };

  const handlePreviousReview = () => {
    setCurrentReviewIndex(
      currentReviewIndex === 0 ? reviews.length - 1 : currentReviewIndex - 1
    );
  };

  const currentReview = reviews[currentReviewIndex];

  return (
    <section
      id="feedback"
      className="mt-[10vh] md:mt-[20vh] bg-muted dark:bg-card/60"
    >
      <div className="relative max-w-7xl mx-auto min-h-screen xs:min-h-[650px] flex flex-col justify-center">
        <QuoteIcon className="w-10 h-10 sm:w-16 sm:h-16 text-foreground/80" />
        <p className="px-10 sm:px-16 text-2xl sm:text-3xl font-medium text-balance">
          {currentReview.title}
        </p>
        <p className="px-10 sm:px-16 pt-4 text-base sm:text-lg sm:text-justify">
          {currentReview.details}
        </p>
        <QuoteIcon className="ml-auto w-10 sm:w-16 h-10 sm:h-16 text-foreground/80" />

        <p className="absolute bottom-14 sm:bottom-16 lg:bottom-24 right-10 sm:right-16 text-sm text-muted-foreground text-right">
          Source: {currentReview.source}
        </p>
        {reviews.length > 1 && (
          <div className="absolute bottom-14 sm:bottom-16 lg:bottom-24 left-10 sm:left-16 flex gap-6 sm:gap-10">
            <button
              className="flex items-center"
              onClick={handlePreviousReview}
            >
              <ChevronLeftIcon className="w-auto h-5 text-primary" />
              <span className="hidden sm:block text-primary">
                Previous Review
              </span>
            </button>
            <button onClick={handleNextReview} className="flex items-center">
              <ChevronRightIcon className="w-auto h-5 text-primary" />
              <span className="ml-10 hidden sm:block text-primary">
                Next Review
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
