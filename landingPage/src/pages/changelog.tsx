import { DefaultLayout } from "@/components/defaultLayout";
import ReactTimeAgo from "react-time-ago";
import Image, { StaticImageData } from "next/image";
import alert from "../../public/assets/alert.png";

type changelogContent = {
  version: string;
  date: Date;
  title?: string;
  image?: StaticImageData;
  changes?: { title: string; content: string[] }[];
  texts?: { text: string | JSX.Element }[];
};

const changelogContent = [
  {
    version: "1.0.1",
    date: new Date("2024-04-03"),
    title: "Security Update",
    image: alert,
    changes: [
      { title: "New Features", content: ["Feature 1", "Feature 2"] },
      { title: "Bug Fixes", content: ["Bug 1", "Bug 2"] },
      { title: "Improvements", content: ["Improvement 1", "Improvement 2"] },
    ],
    texts: [
      {
        text: "This is a security update. Please update your app as soon as possible.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: new Date("2024-03-19"),
    title: "Initial Release",
    image: alert,
    changes: [
      { title: "New Features", content: ["Feature 1", "Feature 2"] },
      { title: "Bug Fixes", content: ["Bug 1", "Bug 2"] },
      { title: "Improvements", content: ["Improvement 1", "Improvement 2"] },
    ],
    texts: [{ text: <p className="underline">damn this </p> }],
  },
];

export default function Changelog() {
  return (
    <DefaultLayout>
      <div className="w-full max-w-[936px] min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] mx-auto px-4 sm:px-12 py-[72px] md:pt-16">
        <h1 className="pb-6 sm:pb-1 text-6xl sm:text-7xl sm:leading-[72px] font-bold sm:tracking-wide text-center">
          Changelog
        </h1>

        {changelogContent.map((release) => (
          <section key={`release-${release.version}`} className="mt-16">
            <div className="px-10">
              <h2 className="pt-16 mb-16 text-[40px] leading-[48px] font-medium">
                {release.version}
              </h2>

              <p className="my-4 text-muted-foreground text-sm leading-7 tracking-wide">
                <ReactTimeAgo date={release.date} locale="en-US" /> &nbsp; •
                &nbsp;
                {new Intl.DateTimeFormat("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(release.date)}
              </p>

              {release.title && (
                <h3 className="my-4 font-semibold">{release.title}</h3>
              )}
            </div>
            {release.image && (
              <Image
                src={release.image}
                alt={`release ${release.version} image`}
                className="my-8 w-full"
              />
            )}
            <div className="px-10">
              {release.changes.length > 0 &&
                release.changes.map((change, index) => (
                  <div key={`change-${index}`}>
                    <h4 className="my-4 font-semibold">{change.title}</h4>
                    {change.content.length > 0 && (
                      <ul className="list-disc list-inside pl-3">
                        {change.content.map((item) => (
                          <li className="mt-2 mb-1">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              {release.texts.length > 0 &&
                release.texts.map((item, index) => (
                  <div key={`text-${index}`} className="my-4">
                    {item.text}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </DefaultLayout>
  );
}
