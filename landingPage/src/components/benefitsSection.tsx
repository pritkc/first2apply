import { useState } from "react";
import Image from "next/image";
import benefitsLight from "../../public/assets/benefits-light.png";
import benefitsDark from "../../public/assets/benefits-dark.png";

const sites = [
  "LinkedIn",
  "Indeed",
  "Dice",
  "Glassdoor",
  "BuiltIn",
  "Remotive",
  "Remote IO",
  "RemoteOK",
  "WeWorkRemotely",
  "FlexJobs",
  "Robert Half",
  "USA Jobs",
];

export function BenefitsSection() {
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  return (
    <section
      id="benefits"
      className="flex flex-col items-center gap-4 mt-[20vh] mx-auto max-w-7xl px-6 sm:px-10 md:flex-row"
    >
      <div className="w-full md:w-1/2">
        <h2 className="text-2xl font-semibold sm:text-4xl text-balance">
          More jobs, less hassle
        </h2>

        <p className="mt-2 sm:mt-4 text-balance sm:text-lg">
          Venture beyond LinkedIn to seize every opportunity. But manual
          searching across multiple platforms can be overwhelming... Let First 2
          Apply automate the process, fetching roles from{" "}
          {showAllPlatforms
            ? `${sites.join(", ")}.`
            : `${sites.slice(0, 3).join(", ")}, and `}
          {!showAllPlatforms && (
            <button
              onClick={() => setShowAllPlatforms(true)}
              className="text-blue-500"
            >
              {sites.length - 3} other job platforms.
            </button>
          )}{" "}
          Just sit back, relax and let us curate the perfect job list for you.
        </p>
      </div>

      <div className="w-full h-auto md:w-1/2">
        <Image
          src={benefitsLight}
          alt="sites light"
          className="dark:hidden w-full h-auto"
        />
        <Image
          src={benefitsDark}
          alt="sites dark"
          className="hidden dark:block w-full h-auto"
        />
      </div>
    </section>
  );
}
