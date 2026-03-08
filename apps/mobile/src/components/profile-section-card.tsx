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
      <CardHeader
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 8,
        }}>
        <CardTitle>{title}</CardTitle>
        {onEdit && (
          <Button variant="ghost" size="icon" onPress={onEdit}>
            <Pencil size={16} className="text-muted-foreground" />
          </Button>
        )}
      </CardHeader>
      <CardContent style={{ paddingTop: 0 }}>{children}</CardContent>
    </Card>
  );
}
