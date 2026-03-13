"use client";

import {
  MAX_EVENT_DESCRIPTION_LENGTH,
  MAX_EVENT_LOCATION_LENGTH,
  MAX_EVENT_NOTES_LENGTH,
  MAX_EVENT_TITLE_LENGTH,
} from "@openhospi/shared/constants";
import type { CreateEventData } from "@openhospi/validators";
import { createEventSchema } from "@openhospi/validators";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation-app";
import { zodResolver } from "@/lib/form-utils";
import { cn } from "@/lib/utils";

import { createEvent } from "./event-actions";

const DURATION_PRESETS = [
  { label: "30 min", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "1.5h", minutes: 90 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
] as const;

function addMinutesToTime(time: string, minutes: number): { time: string; nextDay: boolean } {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return {
    time: `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`,
    nextDay: totalMinutes >= 24 * 60,
  };
}

type Props = {
  roomId: string;
};

export function CreateEventDialog({ roomId }: Props) {
  const t = useTranslations("app.rooms.events");
  const tCommon = useTranslations("common.labels");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedDuration, setSelectedDuration] = useState<number | null>(120);
  const [customEndTime, setCustomEndTime] = useState(false);
  const router = useRouter();

  const form = useForm<CreateEventData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventDate: "",
      timeStart: "",
      timeEnd: "",
      location: "",
      notes: "",
    },
  });

  const timeStart = useWatch({ control: form.control, name: "timeStart" });

  function handleDurationSelect(minutes: number) {
    setSelectedDuration(minutes);
    setCustomEndTime(false);
    if (timeStart) {
      const { time } = addMinutesToTime(timeStart, minutes);
      form.setValue("timeEnd", time);
    }
  }

  function handleStartTimeChange(value: string) {
    form.setValue("timeStart", value);
    if (selectedDuration && !customEndTime) {
      const { time } = addMinutesToTime(value, selectedDuration);
      form.setValue("timeEnd", time);
    }
  }

  function switchToCustomEndTime() {
    setCustomEndTime(true);
    setSelectedDuration(null);
  }

  function onSubmit(data: CreateEventData) {
    startTransition(async () => {
      const result = await createEvent(roomId, data);
      if (result?.error) {
        toast.error(t("createError"));
        return;
      }
      toast.success(t("created"));
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          {t("create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.title")}</FormLabel>
                  <FormControl>
                    <Input maxLength={MAX_EVENT_TITLE_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.startTime")}</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {customEndTime ? (
                <FormField
                  control={form.control}
                  name="timeEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.endTime")}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div>
                  <FormLabel>{t("fields.duration")}</FormLabel>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DURATION_PRESETS.map((preset) => (
                      <Button
                        key={preset.minutes}
                        type="button"
                        variant={selectedDuration === preset.minutes ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDurationSelect(preset.minutes)}
                        className="h-7 text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={switchToCustomEndTime}
                    className={cn("mt-1 h-auto p-0 text-xs")}
                  >
                    {t("fields.customEndTime")}
                  </Button>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.location")}</FormLabel>
                  <FormControl>
                    <Input maxLength={MAX_EVENT_LOCATION_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("fields.description")}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({tCommon("optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-20 resize-none"
                      maxLength={MAX_EVENT_DESCRIPTION_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxAttendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("fields.maxAttendees")}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({tCommon("optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("fields.notes")}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({tCommon("optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-16 resize-none"
                      maxLength={MAX_EVENT_NOTES_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="animate-spin" />}
              {t("createSubmit")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
