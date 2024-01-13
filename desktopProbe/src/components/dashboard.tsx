import { Button } from "./ui/button";
import { CronSchedule } from "./cronSchedule";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { createLink } from "@/lib/electronMainSdk";
import { getExceptionMessage } from "@/lib/error";

const schema = z.object({
  name: z.string().min(1, { message: "This field cannot be blank" }).max(80),
  link: z.string().url().min(1, { message: "This field cannot be blank" }),
});

export function Dashboard() {
  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  return (
    <div>
      <section className="max-w-[980px] px-6 md:px-10 lg:px-20 pt-32 pb-20 mx-auto flex flex-col items-center gap-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
          Welcome to: <span className="text-green-600">first 2 apply</span>
        </h1>
        <p className="text-muted-foreground lg:max-w-[7000px] text-center">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
        <div className="flex flex-row gap-4">
          <Button>Add new link</Button>
          <Button variant="outline">Recent jobs</Button>
        </div>
      </section>

      <div className="space-y-6 border rounded-lg p-8">
        <section className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-wide">Add links</h2>
          <p className="text-muted-foreground">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </section>
        <hr className="w-full text-muted-foreground" />

        {/* <CronSchedule /> */}
      </div>
    </div>
  );
}
