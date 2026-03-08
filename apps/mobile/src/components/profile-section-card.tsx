import { Pencil } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
};

export function ProfileSectionCard({ title, onEdit, children }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        {onEdit && (
          <Button variant="ghost" size="icon" onPress={onEdit}>
            <Pencil size={16} className="text-muted-foreground" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
