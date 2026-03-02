import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { AutoLinkedText } from "./legal-auto-link";

export function LegalStructuredCards({ items }: { items: string[] }) {
  return (
    <div className="mt-4">
      <Table>
        <TableBody>
          {items.map((item, i) => {
            const dashIdx = item.indexOf(" — ");
            if (dashIdx <= 0) {
              return (
                <TableRow key={i}>
                  <TableCell colSpan={2} className="text-muted-foreground whitespace-normal">
                    <AutoLinkedText text={item} />
                  </TableCell>
                </TableRow>
              );
            }

            const label = item.slice(0, dashIdx);
            const value = item.slice(dashIdx + 3);

            return (
              <TableRow key={i}>
                <TableCell className="w-40 align-top font-medium text-foreground sm:w-48">
                  {label}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-normal">
                  <AutoLinkedText text={value} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
