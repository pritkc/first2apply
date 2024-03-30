import { DefaultLayout } from "@/components/defaultLayout";
import { Button } from "@/components/ui/button";
import { GlobeIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import logoBlack from "../../public/assets/logo-black.png";

export default function Download() {
  return (
    <DefaultLayout>
      <section className="w-full max-w-7xl min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] mx-auto px-6 sm:px-10 pb-14 md:pb-16 flex flex-col items-center justify-center">
        {/* <Image src={logoBlack} alt="logo" className="w-auto h-28 dark:hidden" /> */}
        {/* <Image
              src={logoWhite}
              alt="logo"
              className="w-auto h-7 hidden dark:block"
            /> */}
        <h1 className="w-full text-3xl sm:text-5xl lg:text-6xl font-semibold sm:text-center text-balance">
          Download First 2 Apply
        </h1>
        <h2 className="mt-2 text-sm lg:text-xl text-foreground/70 font-medium sm:text-center sm:text-balance sm:tracking-wide">
          Experience the convenience of monitoring and managing job applications
          from top platforms, all in one place. Dive into a 7-day free trial, no
          payment required
        </h2>

        <div className="mt-12 w-full xs:max-w-96 flex flex-col xs:flex-row xs:flex-wrap xs:items-center xs:justify-center gap-4">
          <a href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/darwin/arm64/First+2+Apply-1.3.0-arm64.dmg">
            <Button
              size="lg"
              className="h-12 w-full xs:w-fit flex items-center gap-2"
            >
              <img
                width="16"
                alt="Apple logo white"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Apple_logo_white.svg/256px-Apple_logo_white.svg.png"
                className="h-4 w-auto hidden dark:block"
              />
              <img
                width="16"
                alt="Apple logo black"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/256px-Apple_logo_black.svg.png"
                className="h-4 w-auto dark:hidden"
              />
              MacOS Apple Silicon
            </Button>
          </a>
          <a
            href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/linux/x64/first-2-apply_1.3.0_amd64.deb"
            className="hidden xs:block"
          >
            <Button
              size="lg"
              className="h-12 w-full xs:w-fit flex items-center gap-2"
            >
              <GlobeIcon className="h-4 w-auto text-foreground" />
              Linux
            </Button>
          </a>
          <a href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/darwin/x64/First+2+Apply-1.3.0-x64.dmg">
            <Button
              size="lg"
              className="h-12 w-full xs:w-fit flex items-center gap-2"
            >
              <img
                width="16"
                alt="Apple logo white"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Apple_logo_white.svg/256px-Apple_logo_white.svg.png"
                className="h-4 w-auto hidden dark:block"
              />
              <img
                width="16"
                alt="Apple logo black"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/256px-Apple_logo_black.svg.png"
                className="h-4 w-auto dark:hidden"
              />
              MacOS Intel
            </Button>
          </a>
          <a href="ms-windows-store://pdp/?productid=9NK18WV87SV2">
            <Button
              size="lg"
              className="h-12 w-full xs:w-fit flex items-center gap-2"
            >
              <img
                width="16"
                alt="Windows logo white"
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Windows_icon_logo.png"
                className="h-4 w-auto hidden dark:block"
              />
              <img
                width="16"
                alt="Windows logo black"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Windows_logo_2012-Black.svg/64px-Windows_logo_2012-Black.svg.png"
                className="h-4 w-auto dark:hidden"
              />
              Windows
            </Button>
          </a>
          <a
            href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/linux/x64/first-2-apply_1.3.0_amd64.deb"
            className="xs:hidden"
          >
            <Button size="lg" className="h-12 w-full xs:w-fit">
              <GlobeIcon className="h-4 w-auto text-foreground" />
              Linux
            </Button>
          </a>
        </div>
      </section>
    </DefaultLayout>
  );
}
