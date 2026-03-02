"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import type {EditProfileData} from "@openhospi/database/validators";
import {editProfileSchema} from "@openhospi/database/validators";
import {
    MAX_BIO_LENGTH,
    MAX_LANGUAGES,
    MAX_LIFESTYLE_TAGS,
    MIN_LANGUAGES,
    MIN_LIFESTYLE_TAGS,
} from "@openhospi/shared/constants";
import {
    City,
    Gender,
    getStudyLevelsForInstitutionType,
    Language,
    LifestyleTag,
    StudyLevel,
    Vereniging,
} from "@openhospi/shared/enums";
import {getInstitution} from "@openhospi/surfconext";
import {Loader2, Pencil} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState, useTransition} from "react";
import {useForm, useWatch} from "react-hook-form";
import {toast} from "sonner";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
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
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import type {Profile} from "@/lib/profile";
import {cn} from "@/lib/utils";

import {updateProfile} from "./profile-actions";

type Props = {
    profile: Profile;
};

export function EditProfileDialog({profile}: Props) {
    const t = useTranslations("app.profile");
    const tCommon = useTranslations("common.labels");
    const tOnboarding = useTranslations("app.onboarding");
    const tEnums = useTranslations("enums");
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<EditProfileData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(editProfileSchema as any),
        defaultValues: {
            gender: (profile.gender as EditProfileData["gender"]) ?? undefined,
            birthDate: profile.birthDate ?? "",
            studyProgram: profile.studyProgram ?? "",
            studyLevel: (profile.studyLevel as EditProfileData["studyLevel"]) ?? undefined,
            bio: profile.bio ?? "",
            lifestyleTags: (profile.lifestyleTags as LifestyleTag[]) ?? [],
            languages: (profile.languages as Language[]) ?? [],
            preferredCity: (profile.preferredCity as EditProfileData["preferredCity"]) ?? undefined,
            maxRent: profile.maxRent ? Number(profile.maxRent) : undefined,
            availableFrom: profile.availableFrom ?? "",
            vereniging: (profile.vereniging as EditProfileData["vereniging"]) ?? undefined,
        },
    });

    function onSubmit(data: EditProfileData) {
        startTransition(async () => {
            const result = await updateProfile(data);
            if (result?.error) {
                toast.error(result.error);
                return;
            }
            toast.success(t("editSuccess"));
            setOpen(false);
        });
    }

    const selectedTags = useWatch({control: form.control, name: "lifestyleTags"}) ?? [];
    const selectedLanguages = useWatch({control: form.control, name: "languages"}) ?? [];

    function toggleTag(tag: LifestyleTag) {
        const current = form.getValues("lifestyleTags") ?? [];
        if (current.includes(tag)) {
            form.setValue(
                "lifestyleTags",
                current.filter((t) => t !== tag),
                {shouldValidate: true},
            );
        } else if (current.length < MAX_LIFESTYLE_TAGS) {
            form.setValue("lifestyleTags", [...current, tag], {shouldValidate: true});
        }
    }

    function toggleLanguage(lang: Language) {
        const current = form.getValues("languages") ?? [];
        if (current.includes(lang)) {
            form.setValue(
                "languages",
                current.filter((l) => l !== lang),
                {shouldValidate: true},
            );
        } else if (current.length < MAX_LANGUAGES) {
            form.setValue("languages", [...current, lang], {shouldValidate: true});
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="size-4"/>
                    {tCommon("edit")}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t("editTitle")}</DialogTitle>
                </DialogHeader>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Form {...(form as any)}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.gender")}</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-wrap gap-3"
                                        >
                                            {Gender.values.map((g) => (
                                                <Label
                                                    key={g}
                                                    className="border-input has-data-[state=checked]:border-primary flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                                >
                                                    <RadioGroupItem value={g}/>
                                                    {tEnums(`gender.${g}` as any)}
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    {field.value === Gender.prefer_not_to_say && (
                                        <p className="text-xs text-muted-foreground">
                                            {tOnboarding("genderPreferNotToSayHint")}
                                        </p>
                                    )}
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="birthDate"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.birthDate")}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="studyProgram"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.studyProgram")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="studyLevel"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.studyLevel")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {(profile.institutionDomain
                                                    ? getStudyLevelsForInstitutionType(
                                                        getInstitution(profile.institutionDomain).type,
                                                    )
                                                    : StudyLevel.values
                                            ).map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    {tEnums(`study_level.${level}` as any)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.bio")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            className="min-h-24 resize-none"
                                            maxLength={MAX_BIO_LENGTH}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>{t("languages")}</FormLabel>
                            <p className="text-xs text-muted-foreground">
                                {tOnboarding("languageCounter", {
                                    count: String(selectedLanguages.length),
                                    min: String(MIN_LANGUAGES),
                                    max: String(MAX_LANGUAGES),
                                })}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Language.values.map((lang) => {
                                    const isSelected = selectedLanguages.includes(lang);
                                    return (
                                        <Badge
                                            key={lang}
                                            variant={isSelected ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer select-none px-2.5 py-1 text-xs transition-colors",
                                                isSelected && "bg-primary text-primary-foreground",
                                            )}
                                            onClick={() => toggleLanguage(lang)}
                                        >
                                            {tEnums(`language_enum.${lang}` as any)}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <FormLabel>{t("lifestyleTags")}</FormLabel>
                            <p className="text-xs text-muted-foreground">
                                {tOnboarding("tagCounter", {
                                    count: String(selectedTags.length),
                                    min: String(MIN_LIFESTYLE_TAGS),
                                    max: String(MAX_LIFESTYLE_TAGS),
                                })}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {LifestyleTag.values.map((tag) => {
                                    const isSelected = selectedTags.includes(tag);
                                    return (
                                        <Badge
                                            key={tag}
                                            variant={isSelected ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer select-none px-2.5 py-1 text-xs transition-colors",
                                                isSelected && "bg-primary text-primary-foreground",
                                            )}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tEnums(`lifestyle_tag.${tag}` as any)}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="preferredCity"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.preferredCity")}</FormLabel>
                                    <Combobox
                                        value={field.value ?? null}
                                        onValueChange={field.onChange}
                                        items={City.values}
                                        itemToStringLabel={(city) => tEnums(`city.${city}` as any)}
                                    >
                                        <ComboboxInput placeholder={tOnboarding("placeholders.preferredCity")}/>
                                        <ComboboxContent>
                                            <ComboboxEmpty>{tCommon("noResults")}</ComboboxEmpty>
                                            <ComboboxList>
                                                {(city) => (
                                                    <ComboboxItem key={city} value={city}>
                                                        {tEnums(`city.${city}` as any)}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="maxRent"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.maxRent")}</FormLabel>
                                    <FormControl>
                                        <Input type="number" min={0} max={5000} {...field} value={field.value ?? ""}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="availableFrom"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.availableFrom")}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="vereniging"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{tOnboarding("fields.vereniging")}</FormLabel>
                                    <Combobox
                                        value={field.value ?? null}
                                        onValueChange={(val) =>
                                            form.setValue("vereniging", val ?? undefined, {shouldValidate: true})
                                        }
                                        items={Vereniging.values}
                                        itemToStringLabel={(v) => tEnums(`vereniging.${v}` as any)}
                                    >
                                        <ComboboxInput
                                            placeholder={tOnboarding("placeholders.searchVereniging")}
                                            showClear
                                        />
                                        <ComboboxContent>
                                            <ComboboxEmpty>{tCommon("noResults")}</ComboboxEmpty>
                                            <ComboboxList>
                                                {(v) => (
                                                    <ComboboxItem key={v} value={v}>
                                                        {tEnums(`vereniging.${v}` as any)}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                {tCommon("cancel")}
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="animate-spin"/>}
                                {tCommon("save")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
