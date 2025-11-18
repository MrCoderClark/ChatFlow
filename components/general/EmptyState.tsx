
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Cloud, PlusCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";

interface EmptyStateProps {
    title: string;
    description: string;
    buttonText: string;
    href: string;
}

export function EmptyState({ title, description, buttonText, href }: EmptyStateProps) {
    return (
        <Empty className="border border-dashed">
            <EmptyHeader>
                <EmptyMedia variant={"icon"} className="bg-primary/10">
                    <Cloud className="size-5 text-primary" />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <Link href={href} className={buttonVariants()}>
                    <PlusCircle />
                    {buttonText}
                </Link>
            </EmptyContent>
        </Empty>
    )
}