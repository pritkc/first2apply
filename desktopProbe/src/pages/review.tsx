import { RadioGroup } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { Item } from "@radix-ui/react-radio-group";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Icons } from "../components/icons";
import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";
import { toast } from "../components/ui/use-toast";
import { useError } from "../hooks/error";
import { useSession } from "../hooks/session";
import { createReview, getUserReview } from "../lib/electronMainSdk";
import { DefaultLayout } from "./defaultLayout";

const StarIcon = ({ filled = false }) => (
  <svg
    className={`h-6 w-6 ${
      filled ? "text-primary" : "text-gray-400"
    } transition-colors`}
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M12 .587l3.668 7.431 8.332 1.21-6.001 5.852 1.416 8.254L12 18.896l-7.415 3.898 1.416-8.254-6.001-5.852 8.332-1.21L12 .587z" />
  </svg>
);

const schema = z.object({
  title: z.string().min(1, { message: "This field cannot be blank" }).max(80),
  description: z
    .string()
    .min(1, { message: "This field cannot be blank" })
    .max(500),
  rating: z.number().min(1, { message: "Rate from 1 to 5 stars" }).max(5),
});

type FormValues = z.infer<typeof schema>;

export function ReviewPage() {
  const { isLoggedIn, user } = useSession();
  const { handleError } = useError();

  const [hoveredValue, setHoveredValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserReview = async () => {
    try {
      if (!isLoggedIn) return;
      console.log("userId", user?.id);
      const isReview = await getUserReview();
      console.log("isReview", isReview);
      setHasReviewed(!!isReview.length);
      setIsLoading(false);
    } catch (error) {
      handleError({ error });
    }
  };

  useEffect(() => {
    fetchUserReview();
  }, [isLoggedIn]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      rating: 5,
    },
    mode: "onChange",
  });
  const watchedValues = form.watch();

  const { setValue, watch } = form;
  const rating = watch("rating"); // This will update the rating based on the form's current value

  useEffect(() => {
    console.log(watchedValues);
  }, [watchedValues]);

  const onSubmit = async (values: FormValues) => {
    const { title, description, rating } = values;
    if (!title || !description || !rating) return;

    setIsSubmitting(true);

    try {
      await createReview({ title, description, rating });
      await fetchUserReview();
      form.reset();
      toast({
        title: "Success",
        description: "Review submitted successfully!",
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout className="p-6 md:p-10 ">
      <section className="p-6 border border-[#809966]/30 rounded-lg">
        {isLoading ? (
          <Skeleton className="h-4 w-full mb-4" />
        ) : hasReviewed ? (
          <h1 className="text-2xl font-medium tracking-wide mb-2">
            Thanks For Your Review!
          </h1>
        ) : (
          <>
            <h1 className="text-2xl font-medium tracking-wide mb-2">
              Leave a review
            </h1>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="rating"
                  render={() => (
                    <FormItem className="w-full mt-6">
                      <FormLabel>Rate this app</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={String(rating)}
                          onValueChange={(value) =>
                            setValue("rating", Number(value))
                          }
                          className="flex items-center "
                        >
                          {Array.from({ length: 5 }, (_, index) => {
                            const value = index + 1;
                            return (
                              <Item
                                key={value}
                                value={String(value)}
                                onMouseEnter={() => setHoveredValue(value)}
                                onMouseLeave={() => setHoveredValue(0)}
                              >
                                <label className="cursor-pointer">
                                  <StarIcon
                                    filled={value <= (hoveredValue || rating)}
                                  />
                                </label>
                              </Item>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="w-full mt-6">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input id="title" type="title" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="w-full mt-6">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          id="description"
                          className="resize-none mb-4"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={!form.formState.isValid || isSubmitting}
                  className="flex justify-center items-center gap-2 mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <Icons.spinner2 className="animate-spin h-4 w-4" />
                      Submitting review...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </section>
    </DefaultLayout>
  );
}
