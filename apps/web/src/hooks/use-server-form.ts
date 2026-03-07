"use client";

import { useTransition } from "react";
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { zodResolver } from "@/lib/form-utils";

type ServerFormOptions<TSchema extends z.ZodType<FieldValues>, TResult = void> = {
  schema: TSchema;
  defaultValues?: DefaultValues<z.infer<TSchema>>;
  action: (
    data: z.infer<TSchema>,
  ) => Promise<{ error?: string; data?: TResult } | undefined | void>;
  onSuccess?: (result?: { error?: string; data?: TResult } | undefined | void) => void;
  onError?: (error: string) => void;
};

type ServerFormReturn<TSchema extends z.ZodType<FieldValues>> = {
  form: UseFormReturn<z.infer<TSchema>>;
  isPending: boolean;
  submit: (e?: React.BaseSyntheticEvent) => void;
};

export function useServerForm<TSchema extends z.ZodType<FieldValues>, TResult = void>({
  schema,
  defaultValues,
  action,
  onSuccess,
  onError,
}: ServerFormOptions<TSchema, TResult>): ServerFormReturn<TSchema> {
  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const [isPending, startTransition] = useTransition();

  const submit = form.handleSubmit((data: z.infer<TSchema>) => {
    startTransition(async () => {
      const result = await action(data);
      if (result?.error) {
        if (onError) {
          onError(result.error);
        } else {
          toast.error(result.error);
        }
        return;
      }
      onSuccess?.(result);
    });
  });

  return { form, isPending, submit };
}
