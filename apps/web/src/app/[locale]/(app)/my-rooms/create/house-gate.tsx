"use client";

import { Building2, Home, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { createDraftRoomForHouse, createHouseAndContinue } from "./actions";

type OwnerHouse = {
  id: string;
  name: string;
  roomCount: number;
};

type Props = {
  houses: OwnerHouse[];
};

function useCreateHouseHandler() {
  const t = useTranslations("app.rooms");
  const router = useRouter();

  return async (formData: FormData) => {
    const result = await createHouseAndContinue(formData);
    if (result.error) {
      toast.error(t(`houseSetup.errors.${result.error}`));
      return;
    }
    if (result.id) {
      router.push(`/my-rooms/create?id=${result.id}`);
    }
  };
}

export function HouseGate({ houses }: Props) {
  if (houses.length === 0) {
    return <HouseSetup />;
  }
  return <HousePicker houses={houses} />;
}

function HouseSetup() {
  const t = useTranslations("app.rooms");
  const [isPending, startTransition] = useTransition();
  const createHouse = useCreateHouseHandler();

  function handleSubmit(formData: FormData) {
    startTransition(() => createHouse(formData));
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="bg-primary/10 mb-4 flex size-14 items-center justify-center rounded-full">
          <Building2 className="text-primary size-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("houseSetup.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("houseSetup.description")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <div className="bg-primary/10 mb-1 flex size-9 items-center justify-center rounded-lg">
              <Home className="text-primary size-4" />
            </div>
            <CardTitle className="text-sm">{t("houseSetup.benefits.rooms.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t("houseSetup.benefits.rooms.description")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="pb-2">
            <div className="bg-primary/10 mb-1 flex size-9 items-center justify-center rounded-lg">
              <Users className="text-primary size-4" />
            </div>
            <CardTitle className="text-sm">{t("houseSetup.benefits.housemates.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t("houseSetup.benefits.housemates.description")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("houseSetup.form.title")}</CardTitle>
          <CardDescription>{t("houseSetup.form.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="house-name">{t("houseSetup.form.nameLabel")}</Label>
              <Input
                id="house-name"
                name="name"
                placeholder={t("houseSetup.form.namePlaceholder")}
                required
                minLength={2}
                maxLength={100}
                disabled={isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("houseSetup.form.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function HousePicker({ houses }: { houses: OwnerHouse[] }) {
  const t = useTranslations("app.rooms");
  const tCommon = useTranslations("common.labels");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(houses[0]?.id ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const createHouse = useCreateHouseHandler();

  function handleContinue() {
    startTransition(async () => {
      const result = await createDraftRoomForHouse(selectedId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.id) {
        router.push(`/my-rooms/create?id=${result.id}`);
      }
    });
  }

  function handleCreateNew(formData: FormData) {
    startTransition(() => createHouse(formData));
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="bg-primary/10 mb-4 flex size-14 items-center justify-center rounded-full">
          <Building2 className="text-primary size-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("housePicker.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("housePicker.description")}</p>
      </div>

      <div className="space-y-2">
        {houses.map((house) => (
          <button
            key={house.id}
            type="button"
            onClick={() => {
              setSelectedId(house.id);
              setShowCreate(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors",
              selectedId === house.id && !showCreate
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/30",
            )}
            disabled={isPending}
          >
            <div className="flex items-center gap-3">
              <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                <Home className="text-muted-foreground size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{house.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("housePicker.roomCount", { count: house.roomCount })}
                </p>
              </div>
            </div>
            {selectedId === house.id && !showCreate && (
              <div className="bg-primary size-4 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {!showCreate ? (
        <div className="space-y-3">
          <Button className="w-full" onClick={handleContinue} disabled={isPending || !selectedId}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("housePicker.continue")}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowCreate(true)}
            disabled={isPending}
          >
            {t("housePicker.createNew")}
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("housePicker.createNew")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreateNew} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-house-name">{t("houseSetup.form.nameLabel")}</Label>
                <Input
                  id="new-house-name"
                  name="name"
                  placeholder={t("houseSetup.form.namePlaceholder")}
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={isPending}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  disabled={isPending}
                >
                  {tCommon("back")}
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending && <Loader2 className="animate-spin" />}
                  {t("houseSetup.form.submit")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
