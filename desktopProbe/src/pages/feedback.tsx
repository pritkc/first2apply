import { RadioGroup } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { Item } from "@radix-ui/react-radio-group";
import { useEffect, useState } from "react";
import { set, useForm } from "react-hook-form";
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

import {
  createReview,
  getOS,
  getUserReview,
  openExternalUrl,
  updateReview,
} from "../lib/electronMainSdk";
import { DefaultLayout } from "./defaultLayout";
import { Review } from "../../../supabase/functions/_shared/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MICROSOFT_APP_URL = "ms-windows-store://pdp/?productid=9NK18WV87SV2";

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
    .max(500)
    .optional(),
  rating: z.number().min(1, { message: "Rate from 1 to 5 stars" }).max(5),
});

type FormValues = z.infer<typeof schema>;

export function FeedbackPage() {
  const { handleError } = useError();

  const [isLoading, setIsLoading] = useState(true);
  const [userOS, setUserOS] = useState<NodeJS.Platform | "">("");
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [hoveredValue, setHoveredValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      rating: 5,
    },
    mode: "onChange",
  });

  /**
   * Load user review on mount, if it exists.
   * Also load the user's OS to display a CTA for Windows users.
   */
  useEffect(() => {
    const fetchUserReview = async () => {
      try {
        // check if user has already reviewed and load the form accordingly
        const existingReview = await getUserReview();
        if (existingReview) {
          form.setValue("title", existingReview.title);
          form.setValue("description", existingReview.description);
          form.setValue("rating", existingReview.rating);
        }
        setExistingReview(existingReview);

        // load user's OS
        const userOS = await getOS();
        setUserOS(userOS);
        setIsLoading(false);
      } catch (error) {
        handleError({ error });
      }
    };

    fetchUserReview();
  }, []);

  const { setValue, watch } = form;
  const rating = watch("rating"); // This will update the rating based on the form's current value

  /**
   * Submit the review form.
   */
  const onSubmit = async (values: FormValues) => {
    try {
      const { title, description, rating } = values;
      if (!title || !rating) return;

      setIsSubmitting(true);
      let updatedReview = existingReview;
      if (!existingReview) {
        updatedReview = await createReview({ title, description, rating });
      } else {
        updatedReview = await updateReview({
          id: existingReview.id,
          title,
          description,
          rating,
        });
      }
      setExistingReview(updatedReview);

      toast({
        title: "Thank you for making First 2 Apply better!",
        description:
          "Your feedback has been submitted and our team will review it soon. You can always update your review later.",
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Open the Windows Store page in the Store app.
   */
  const openWindowsStore = () => {
    openExternalUrl(MICROSOFT_APP_URL);
  };

  if (isLoading) {
    return (
      <DefaultLayout className="p-6 md:p-10 space-y-3">
        <Skeleton className="h-4 w-full mb-4" />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="p-6 md:p-10 space-y-3">
      <h1 className="text-2xl font-medium tracking-wide pb-3">Feedback</h1>

      <Card>
        <CardHeader>
          <CardTitle>Help us make First 2 Apply better</CardTitle>
          {/* <CardDescription>Card Description</CardDescription> */}
        </CardHeader>
        <CardContent>
          <p>
            Let us know what works, what doesn't or any ideas you might have
            that would make the app better suited to your job hunting needs.
          </p>
        </CardContent>
        <CardFooter>
          {userOS !== "win32" && (
            <p>
              If you're enjoying First 2 Apply, please consider leaving a review
              on the{" "}
              <a
                className="text-primary underline hover:no-underline hover:text-primary-dark hover:cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  openWindowsStore();
                }}
              >
                Microsoft Store
              </a>
              .
            </p>
          )}
        </CardFooter>
      </Card>

      <section className="p-6 border border-[#809966]/30 rounded-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="rating"
              render={() => (
                <FormItem className="w-full">
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
                  <FormLabel>
                    Description <i>(Optional)</i>
                  </FormLabel>
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
              ) : existingReview ? (
                "Update review"
              ) : (
                "Submit review"
              )}
            </Button>
          </form>
        </Form>
      </section>
    </DefaultLayout>
  );
}
